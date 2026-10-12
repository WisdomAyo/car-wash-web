import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

const db = new PGlite()
const customer = "00000000-0000-0000-0000-000000000021"
const washman = "00000000-0000-0000-0000-000000000022"
const dispatcher = "00000000-0000-0000-0000-000000000023"
const support = "00000000-0000-0000-0000-000000000024"
const outsider = "00000000-0000-0000-0000-000000000025"
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
async function migration(name) {
  await db.exec(
    await readFile(
      new URL(`../supabase/migrations/${name}`, import.meta.url),
      "utf8",
    ),
  )
}

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql as
      $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    grant usage on schema auth, public to authenticated, anon, service_role;
    grant execute on function auth.uid() to authenticated, anon, service_role;
    insert into auth.users values
      ('${customer}'), ('${washman}'), ('${dispatcher}'),
      ('${support}'), ('${outsider}');
  `)
  await migration("202607190001_customer_foundation.sql")
  await migration("202607190002_role_access.sql")
  await migration("202607190003_payments.sql")
  await migration("202607190004_verified_wash.sql")

  await db.query(`
    insert into public.gw_memberships (user_id, role, status, approved_at) values
      ('${washman}', 'washman', 'approved', now()),
      ('${dispatcher}', 'dispatcher', 'approved', now()),
      ('${support}', 'support', 'approved', now())
  `)
  await db.query(`
    insert into public.gw_staff_profiles
      (user_id, display_name, status, screening_verified)
    values ('${washman}', 'Emeka Okafor', 'available', true)
  `)

  await asUser(customer)
  const vehicle = (
    await db.query(`
      insert into public.gw_vehicles (plate, make, model, colour, vehicle_type)
      values ('ABJ 123-AA', 'Toyota', 'Camry', 'Silver', 'Sedan')
      returning id
    `)
  ).rows[0].id
  const location = (
    await db.query(`
      insert into public.gw_locations (label, address, city, state)
      values ('Office', '12 Sample Road', 'Abuja', 'Federal Capital Territory')
      returning id
    `)
  ).rows[0].id
  await db.exec("reset role")
  await db.query(
    `update public.gw_locations
      set latitude = 9.0765, longitude = 7.3986, geofence_radius_m = 150
      where id = $1`,
    [location],
  )
  await asUser(customer)
  const booking = (
    await db.query("select public.gw_request_booking($1,$2,$3,$4,$5) as id", [
      vehicle,
      location,
      "signature",
      new Date(Date.now() + 3 * 86400000).toISOString(),
      "00000000-0000-0000-0000-000000000031",
    ])
  ).rows[0].id

  const failedPayment = (
    await db.query("select * from public.gw_prepare_payment($1,$2)", [
      booking,
      "00000000-0000-0000-0000-000000000032",
    ])
  ).rows[0]
  await check("payment preparation snapshots the server quote", async () => {
    assert.equal(Number(failedPayment.amount_kobo), 850000)
    assert.match(failedPayment.reference, /^GW-[A-F0-9]{32}$/)
  })
  await check("payment preparation is idempotent", async () => {
    const retry = (
      await db.query("select * from public.gw_prepare_payment($1,$2)", [
        booking,
        "00000000-0000-0000-0000-000000000032",
      ])
    ).rows[0]
    assert.equal(retry.payment_id, failedPayment.payment_id)
  })
  await check(
    "one booking cannot hold two active payment references",
    async () => {
      const retry = (
        await db.query("select * from public.gw_prepare_payment($1,$2)", [
          booking,
          "00000000-0000-0000-0000-000000000034",
        ])
      ).rows[0]
      assert.equal(retry.payment_id, failedPayment.payment_id)
    },
  )
  await check("customers cannot forge payment success", () =>
    denied("update public.gw_payments set status = 'paid'"),
  )

  await asUser("", "service_role")
  await check(
    "webhook amount mismatch cannot mark the booking paid",
    async () => {
      const result = await db.query(
        `select public.gw_reconcile_payment(
        $1,$2,'charge.success','success',$3,'101',now(),$4,'{}'
      ) as status`,
        [failedPayment.reference, "charge.success:101", 1, "mismatch-hash"],
      )
      assert.equal(result.rows[0].status, "amount_mismatch")
      await db.exec("reset role")
      assert.equal(
        (
          await db.query(
            "select status from public.gw_bookings where id = $1",
            [booking],
          )
        ).rows[0].status,
        "payment_pending",
      )
    },
  )

  await asUser(customer)
  const payment = (
    await db.query("select * from public.gw_prepare_payment($1,$2)", [
      booking,
      "00000000-0000-0000-0000-000000000033",
    ])
  ).rows[0]
  await asUser("", "service_role")
  await check(
    "signed webhook reconciliation marks exact amount paid",
    async () => {
      const args = [
        payment.reference,
        "charge.success:102",
        850000,
        "valid-hash",
      ]
      const query = `select public.gw_reconcile_payment(
      $1,$2,'charge.success','success',$3,'102',now(),$4,'{}'
    ) as status`
      assert.equal((await db.query(query, args)).rows[0].status, "paid")
      assert.equal((await db.query(query, args)).rows[0].status, "paid")
      await db.exec("reset role")
      assert.equal(
        (
          await db.query(
            "select count(*)::int as count from public.gw_payment_events where provider_event_id = 'charge.success:102'",
          )
        ).rows[0].count,
        1,
      )
    },
  )

  await asUser(support)
  await check("support cannot assign jobs", () =>
    denied("select public.gw_assign_job($1,$2)", [booking, washman]),
  )
  await asUser(dispatcher)
  await check("dispatcher assigns only screened available staff", async () => {
    await db.query("select public.gw_assign_job($1,$2)", [booking, washman])
    assert.equal(
      (
        await db.query("select status from public.gw_bookings where id = $1", [
          booking,
        ])
      ).rows[0].status,
      "assigned",
    )
  })

  await asUser(outsider)
  await check(
    "unassigned staff cannot accept or inspect job evidence",
    async () => {
      await denied("select public.gw_staff_accept($1)", [booking])
      assert.equal(
        (await db.query("select * from public.gw_job_assignments")).rows.length,
        0,
      )
    },
  )

  await asUser(washman)
  await check("assigned address is hidden until staff accepts", async () => {
    const job = (await db.query("select * from public.gw_my_assigned_jobs()"))
      .rows[0]
    assert.equal(job.status, "assigned")
    assert.equal(job.location_label, null)
  })
  await db.query("select public.gw_staff_accept($1)", [booking])
  await check("accepted staff can retrieve the assigned address", async () => {
    const job = (await db.query("select * from public.gw_my_assigned_jobs()"))
      .rows[0]
    assert.equal(job.status, "accepted")
    assert.match(job.location_label, /Sample Road/)
  })
  await check("plate mismatch is recorded and blocks clock-in", async () => {
    const result = await db.query(
      "select public.gw_staff_clock_in($1,$2,'ocr',$3,$4,$5) as status",
      [booking, "WRONG 999", 9.0765, 7.3986, 10],
    )
    assert.equal(result.rows[0].status, "plate_mismatch")
    assert.equal(
      (
        await db.query(
          "select status from public.gw_my_assigned_jobs() where booking_id = $1",
          [booking],
        )
      ).rows[0].status,
      "accepted",
    )
  })
  await check("matching plate inside geofence permits clock-in", async () => {
    const result = await db.query(
      "select public.gw_staff_clock_in($1,$2,'ocr',$3,$4,$5) as status",
      [booking, "ABJ-123 AA", 9.0765, 7.3986, 10],
    )
    assert.equal(result.rows[0].status, "clocked_in")
  })
  await check("wash cannot start before a before photo", () =>
    denied("select public.gw_start_wash($1)", [booking]),
  )
  await db.query("select public.gw_record_job_photo($1,'before',$2)", [
    booking,
    `${booking}/before/one.jpg`,
  ])
  await db.query("select public.gw_start_wash($1)", [booking])
  await check("wash cannot be marked ready before an after photo", () =>
    denied("select public.gw_mark_ready($1)", [booking]),
  )
  await db.query("select public.gw_record_job_photo($1,'after',$2)", [
    booking,
    `${booking}/after/one.jpg`,
  ])
  await db.query("select public.gw_mark_ready($1)", [booking])

  await asUser(customer)
  await check(
    "only the customer can unlock submission with a verdict",
    async () => {
      await db.query("select public.gw_give_verdict($1,'satisfied',null)", [
        booking,
      ])
      assert.equal(
        (
          await db.query(
            "select status from public.gw_bookings where id = $1",
            [booking],
          )
        ).rows[0].status,
        "verdict_given",
      )
    },
  )

  await asUser(washman)
  await check("final plate mismatch blocks submission", async () => {
    const result = await db.query(
      "select public.gw_staff_submit($1,$2,'ocr',$3,$4,$5) as status",
      [booking, "WRONG 999", 9.0765, 7.3986, 10],
    )
    assert.equal(result.rows[0].status, "plate_mismatch")
  })
  await db.query("select public.gw_staff_submit($1,$2,'ocr',$3,$4,$5)", [
    booking,
    "ABJ 123 AA",
    9.0765,
    7.3986,
    10,
  ])
  await check("complete three-proof evidence closes the job", async () => {
    await db.query("select public.gw_staff_clock_out($1)", [booking])
    const job = (
      await db.query(
        "select status, location_label from public.gw_my_assigned_jobs() where booking_id = $1",
        [booking],
      )
    ).rows[0]
    assert.equal(job.status, "closed")
    assert.equal(job.location_label, null)
  })

  await asUser(customer)
  const disputedBooking = (
    await db.query("select public.gw_request_booking($1,$2,$3,$4,$5) as id", [
      vehicle,
      location,
      "essential",
      new Date(Date.now() + 4 * 86400000).toISOString(),
      "00000000-0000-0000-0000-000000000035",
    ])
  ).rows[0].id
  await db.exec("reset role")
  await db.query(
    "update public.gw_bookings set status = 'ready' where id = $1",
    [disputedBooking],
  )
  await asUser(customer)
  await db.query("select public.gw_give_verdict($1,'untreated',$2)", [
    disputedBooking,
    "The vehicle was not washed.",
  ])
  await asUser(support)
  await check("support cannot release an untreated dispute", () =>
    denied("select public.gw_admin_release_job($1,$2)", [
      disputedBooking,
      "Customer contacted and evidence reviewed.",
    ]),
  )
  await asUser(dispatcher)
  await check(
    "dispatcher release requires a reason and remains audited",
    async () => {
      await denied("select public.gw_admin_release_job($1,'short')", [
        disputedBooking,
      ])
      await db.query("select public.gw_admin_release_job($1,$2)", [
        disputedBooking,
        "Customer unreachable after the documented reminder window.",
      ])
      assert.equal(
        (
          await db.query(
            "select status from public.gw_bookings where id = $1",
            [disputedBooking],
          )
        ).rows[0].status,
        "unconfirmed",
      )
      assert.equal(
        (
          await db.query(
            "select count(*)::int as count from public.gw_job_events where booking_id = $1 and event = 'admin_released'",
            [disputedBooking],
          )
        ).rows[0].count,
        1,
      )
    },
  )

  await db.exec(`reset role;
    create schema storage;
    create table storage.buckets (
      id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]
    );
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to authenticated;
    grant select, insert on storage.objects to authenticated;
  `)
  await migration("202607190005_evidence_finance.sql")
  await migration("202607190006_refund_execution.sql")
  await db.query(
    "update public.gw_bookings set status='clocked_in' where id=$1",
    [booking],
  )
  await asUser(washman)
  const evidencePath = `${washman}/${booking}/before/verified.jpg`
  await check("photo metadata rejects a nonexistent object", () =>
    denied("select public.gw_record_job_photo($1,'before',$2)", [
      booking,
      evidencePath,
    ]),
  )
  await check(
    "assigned staff uploads and registers a real private object",
    async () => {
      await db.query(
        "insert into storage.objects(bucket_id,name) values ('job-evidence',$1)",
        [evidencePath],
      )
      await db.query("select public.gw_record_job_photo($1,'before',$2)", [
        booking,
        evidencePath,
      ])
    },
  )
  await check("photo phase cannot reference a different folder", () =>
    denied("select public.gw_record_job_photo($1,'before',$2)", [
      booking,
      `${washman}/${booking}/after/verified.jpg`,
    ]),
  )
  await db.exec("reset role")
  await db.query("update public.gw_bookings set status='closed' where id=$1", [
    booking,
  ])
  await asUser(outsider)
  await check("private evidence rejects outsider uploads", () =>
    denied(
      "insert into storage.objects(bucket_id,name) values ('job-evidence',$1)",
      [`${outsider}/${booking}/before/photo.jpg`],
    ),
  )
  await check("outsiders cannot request another customer's refund", () =>
    denied("select public.gw_request_refund($1,$2)", [
      payment.payment_id,
      "Please refund this payment.",
    ]),
  )
  await asUser(customer)
  const refund = (
    await db.query("select public.gw_request_refund($1,$2) as id", [
      payment.payment_id,
      "Please review this completed wash refund.",
    ])
  ).rows[0].id
  await check("refund requests are durable and idempotent", async () => {
    assert.equal(
      (
        await db.query("select public.gw_request_refund($1,$2) as id", [
          payment.payment_id,
          "Please review this completed wash refund.",
        ])
      ).rows[0].id,
      refund,
    )
  })
  await check("customers cannot execute refunds", () =>
    denied("select * from public.gw_claim_refund($1)", [refund]),
  )
  await check("receipts expose reconciled payments only", async () => {
    const rows = (await db.query("select * from public.gw_receipts()")).rows
    assert.ok(rows.some((row) => row.receipt_number === payment.reference))
  })
  await check("subscription requests cannot activate billing", async () => {
    await db.query(
      "insert into public.gw_subscription_requests(service_id,washes_per_month) values ('signature',4)",
    )
    await denied(
      "insert into public.gw_subscription_requests(service_id,washes_per_month,status) values ('signature',4,'active')",
    )
  })
  await db.exec("reset role")
  await db.query(
    "insert into public.gw_memberships(user_id,role,status,approved_at) values ($1,'finance','approved',now())",
    [dispatcher],
  )
  await asUser(dispatcher)
  await check("finance claims a refund once only", async () => {
    await db.query("select * from public.gw_claim_refund($1)", [refund])
    await denied("select * from public.gw_claim_refund($1)", [refund])
  })
  await asUser("", "service_role")
  await check("refund reconciliation validates the exact amount", () =>
    denied(
      "select public.gw_reconcile_refund($1,'refund-1','processed',$2,1)",
      [refund, payment.reference],
    ),
  )
  await check(
    "provider reconciliation marks the payment refunded",
    async () => {
      await db.query(
        "select public.gw_reconcile_refund($1,'refund-1','processed',$2,$3)",
        [refund, payment.reference, payment.amount_kobo],
      )
      await db.query(
        "select public.gw_reconcile_refund($1,'refund-1','processed',$2,$3)",
        [refund, payment.reference, payment.amount_kobo],
      )
    },
  )
  await asUser(customer)
  await check("refund status appears on the receipt", async () => {
    assert.equal(
      (
        await db.query(
          "select payment_status from public.gw_receipts() where receipt_number=$1",
          [payment.reference],
        )
      ).rows[0].payment_status,
      "refunded",
    )
  })
  await db.exec("reset role")
  await check("late charge updates cannot undo a refund", async () => {
    await db.query("update public.gw_payments set status='paid' where id=$1", [
      payment.payment_id,
    ])
    assert.equal(
      (
        await db.query("select status from public.gw_payments where id=$1", [
          payment.payment_id,
        ])
      ).rows[0].status,
      "refunded",
    )
  })
  await asUser(outsider)
  await check("receipts do not leak other customers' payments", async () => {
    assert.equal(
      (await db.query("select * from public.gw_receipts()")).rows.length,
      0,
    )
  })
  await asUser("", "anon")
  await check("anonymous payment and job records are blocked", async () => {
    await denied("select * from public.gw_payments")
    await denied("select * from public.gw_job_events")
  })

  console.log(`${checks} payment and Verified Wash database checks passed.`)
} finally {
  await db.close()
}
