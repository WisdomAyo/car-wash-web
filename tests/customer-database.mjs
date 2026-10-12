import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

// Local PostgreSQL engine only. No hosted project credentials or records are used.
const db = new PGlite()
const alice = "00000000-0000-0000-0000-000000000001"
const bob = "00000000-0000-0000-0000-000000000002"
const requestId = "00000000-0000-0000-0000-000000000003"
let checks = 0
async function check(name, action) {
  await action()
  checks++
  console.log(`PASS ${name}`)
}
async function denied(sql, parameters = []) {
  await assert.rejects(() => db.query(sql, parameters))
}
async function asUser(user, role = "authenticated") {
  await db.exec(`reset role; set role ${role};`)
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    user,
  ])
}
try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth, public to authenticated, anon;
    grant execute on function auth.uid() to authenticated, anon;
    insert into auth.users values ('${alice}'), ('${bob}');
  `)
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202607190001_customer_foundation.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  await check("migration applies to PostgreSQL", async () => {
    assert.equal(
      (await db.query("select count(*)::int as count from public.gw_services"))
        .rows[0].count,
      3,
    )
  })
  await asUser(alice)
  const vehicle = (
    await db.query(`
    insert into public.gw_vehicles (plate, make, model, colour, vehicle_type)
    values ('ABJ 123-AA', 'Toyota', 'Camry', 'Silver', 'Sedan') returning id
  `)
  ).rows[0].id
  const location = (
    await db.query(`
    insert into public.gw_locations (label, address, city, state)
    values ('Office', '12 Sample Road', 'Abuja', 'Federal Capital Territory') returning id
  `)
  ).rows[0].id
  await check("plate normalization rejects duplicate formatting", () =>
    denied(`
    insert into public.gw_vehicles (plate, make, model, colour, vehicle_type)
    values ('abj123aa', 'Honda', 'Accord', 'Blue', 'Sedan')
  `),
  )
  await check("clients cannot set ownership", () =>
    denied(
      `
    insert into public.gw_locations (owner_id, label, address, city, state)
    values ($1, 'Office', '12 Sample Road', 'Abuja', 'Federal Capital Territory')
  `,
      [bob],
    ),
  )
  await check("invalid states rejected", () =>
    denied(`
    insert into public.gw_locations (label, address, city, state)
    values ('Home', '12 Sample Road', 'Unknown', 'Invalid state')
  `),
  )
  const future = new Date(Date.now() + 3 * 86400000).toISOString()
  const args = [vehicle, location, "signature", future, requestId]
  const query = "select public.gw_request_booking($1,$2,$3,$4,$5) as id"
  const booking = (await db.query(query, args)).rows[0].id
  await check("server sets quote and pending-review status", async () => {
    const row = (
      await db.query("select * from public.gw_bookings where id = $1", [
        booking,
      ])
    ).rows[0]
    assert.equal(Number(row.price_kobo), 850000)
    assert.equal(row.status, "pending_review")
    assert.equal(row.owner_id, alice)
  })
  await check("retries are idempotent and create one audit event", async () => {
    assert.equal((await db.query(query, args)).rows[0].id, booking)
    assert.equal(
      (
        await db.query(
          "select count(*)::int as count from public.gw_booking_events",
        )
      ).rows[0].count,
      1,
    )
  })
  await check("past appointments rejected", () =>
    denied(query, [
      vehicle,
      location,
      "signature",
      "2020-01-01T00:00:00Z",
      "00000000-0000-0000-0000-000000000004",
    ]),
  )
  await check("clients cannot mark bookings paid or alter quotes", () =>
    denied("update public.gw_bookings set price_kobo = 1 where id = $1", [
      booking,
    ]),
  )
  await check("client direct booking insert blocked", () =>
    denied("insert into public.gw_bookings (owner_id) values ($1)", [alice]),
  )
  await db.query(`
    insert into public.gw_support_tickets (subject, message)
    values ('Request question', 'Please check this sample request.')
  `)
  await check("clients cannot resolve their own support ticket", () =>
    denied("update public.gw_support_tickets set status = 'resolved'"),
  )
  await asUser(bob)
  await check(
    "RLS isolates vehicles, locations, bookings, events and tickets",
    async () => {
      for (const table of [
        "gw_vehicles",
        "gw_locations",
        "gw_bookings",
        "gw_booking_events",
        "gw_support_tickets",
      ])
        assert.equal(
          (await db.query(`select count(*)::int as count from public.${table}`))
            .rows[0].count,
          0,
        )
    },
  )
  await check("RPC rejects another customer's vehicle/location", () =>
    denied(query, [vehicle, location, "signature", future, requestId]),
  )
  await check("RPC rejects another customer's booking changes", () =>
    denied("select public.gw_change_booking($1, null)", [booking]),
  )
  await asUser(alice)
  await check("reschedule succeeds and is audited", async () => {
    const next = new Date(Date.now() + 4 * 86400000).toISOString()
    await db.query("select public.gw_change_booking($1,$2)", [booking, next])
    assert.equal(
      (
        await db.query(
          "select event from public.gw_booking_events where event = 'rescheduled'",
        )
      ).rows.length,
      1,
    )
  })
  await check("cancellation succeeds and cannot be reversed", async () => {
    await db.query("select public.gw_change_booking($1, null)", [booking])
    assert.equal(
      (
        await db.query("select status from public.gw_bookings where id = $1", [
          booking,
        ])
      ).rows[0].status,
      "cancelled",
    )
    await denied("select public.gw_change_booking($1,$2)", [booking, future])
  })
  const lateBooking = (
    await db.query(query, [
      vehicle,
      location,
      "signature",
      future,
      "00000000-0000-0000-0000-000000000005",
    ])
  ).rows[0].id
  await db.exec("reset role")
  await db.query(
    "update public.gw_bookings set scheduled_at = now() + interval '1 hour' where id = $1",
    [lateBooking],
  )
  await asUser(alice)
  await check("server rejects cancellation after policy cutoff", () =>
    denied("select public.gw_change_booking($1,null)", [lateBooking]),
  )
  await asUser("", "anon")
  await check("anonymous access to records and RPCs blocked", async () => {
    await denied("select * from public.gw_bookings")
    await denied(query, args)
  })
  console.log(`${checks} customer database checks passed.`)
} finally {
  await db.close()
}
