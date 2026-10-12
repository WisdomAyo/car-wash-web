import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { PGlite } from "@electric-sql/pglite"

const db = new PGlite()
const manager = "00000000-0000-0000-0000-000000000011"
const outsider = "00000000-0000-0000-0000-000000000012"
const admin = "00000000-0000-0000-0000-000000000013"
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
    insert into auth.users values ('${manager}'), ('${outsider}'), ('${admin}');
  `)
  await db.exec(
    await readFile(
      new URL(
        "../supabase/migrations/202607190002_role_access.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  )
  const organisation = (
    await db.query(`
      insert into public.gw_organisations (kind, name, status)
      values ('corporate', 'Northstar Motors', 'active')
      returning id
    `)
  ).rows[0].id
  await db.query(
    `insert into public.gw_memberships
      (user_id, organisation_id, role, status, approved_at)
      values ($1, $2, 'corporate_manager', 'approved', now())`,
    [manager, organisation],
  )
  await db.query(
    `insert into public.gw_memberships
      (user_id, role, status, approved_at)
      values ($1, 'super_admin', 'approved', now())`,
    [admin],
  )

  await asUser(manager)
  await check("approved member reads only their membership", async () => {
    const rows = (await db.query("select * from public.gw_memberships")).rows
    assert.equal(rows.length, 1)
    assert.equal(rows[0].role, "corporate_manager")
  })
  await check("approved member reads their organisation", async () => {
    const rows = (await db.query("select * from public.gw_organisations")).rows
    assert.equal(rows.length, 1)
    assert.equal(rows[0].name, "Northstar Motors")
  })
  await check("role helper binds checks to the signed-in user", async () => {
    assert.equal(
      (
        await db.query(
          "select public.gw_has_role('corporate_manager', $1) as allowed",
          [organisation],
        )
      ).rows[0].allowed,
      true,
    )
    assert.equal(
      (await db.query("select public.gw_has_role('super_admin') as allowed"))
        .rows[0].allowed,
      false,
    )
  })
  await check("browser clients cannot grant memberships", () =>
    denied(
      `insert into public.gw_memberships
        (user_id, role, status, approved_at)
        values ($1, 'super_admin', 'approved', now())`,
      [manager],
    ),
  )
  await check("organisation roles require organisation scope", async () => {
    await db.exec("reset role")
    await denied(
      `insert into public.gw_memberships
        (user_id, role, status, approved_at)
        values ($1, 'estate_manager', 'approved', now())`,
      [outsider],
    )
  })
  await check(
    "organisation roles require a matching organisation kind",
    async () => {
      await denied(
        `insert into public.gw_memberships
        (user_id, organisation_id, role, status, approved_at)
        values ($1, $2, 'estate_manager', 'approved', now())`,
        [outsider, organisation],
      )
    },
  )

  await asUser(outsider)
  await check(
    "unapproved users cannot inspect memberships or organisations",
    async () => {
      assert.equal(
        (await db.query("select * from public.gw_memberships")).rows.length,
        0,
      )
      assert.equal(
        (await db.query("select * from public.gw_organisations")).rows.length,
        0,
      )
    },
  )

  await asUser(admin)
  await check(
    "super admin membership permits organisation visibility",
    async () => {
      assert.equal(
        (await db.query("select * from public.gw_organisations")).rows.length,
        1,
      )
    },
  )

  await asUser("", "anon")
  await check("anonymous role access is blocked", async () => {
    await denied("select * from public.gw_memberships")
    await denied("select public.gw_has_role('super_admin')")
  })
  console.log(`${checks} role-access database checks passed.`)
} finally {
  await db.close()
}
