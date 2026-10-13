"use client"

import { useState } from "react"
import { Async, Empty, Facts, Notice, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { CheckField, Field, useForm } from "@/components/app/forms"
import { Drawer, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import { vehicleTypes, type Plan, type RoleInfo, type Service, type AdminUser } from "@/lib/api/types"
import { humanise, naira, stamp, relative, toKobo } from "@/lib/format"
import { sessionStore } from "@/lib/session"
import { AdminList, ActionButton, ReasonButton } from "../parts"

/* ------------------------------------------------------------------ services & prices */

export function Services() {
  const services = useItems<Service>("/admin/services")
  const [editing, setEditing] = useState<Service | "new" | null>(null)
  return (
    <>
      <PageHeader eyebrow="WHAT WE SELL" title="Services & prices" description="A price per vehicle type. A change applies to new bookings only." action={<button className="primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> New service</button>} />
      <Async query={services} empty={<Empty icon="tool" title="No services." />} isEmpty={(d) => d.length === 0}>
        {() => (
          <div className="kit-stack">
            {services.items.map((s) => (
              <Panel key={s.id} title={s.name} description={`${s.duration_minutes} minutes · ${s.is_active ? "On sale" : "Off sale"}`} action={<button className="secondary kit-btn-small" onClick={() => setEditing(s)}>Edit</button>}>
                <p className="kit-muted">{s.description}</p>
                <PriceGrid service={s} />
              </Panel>
            ))}
          </div>
        )}
      </Async>
      {editing && <ServiceDrawer service={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function PriceGrid({ service }: { service: Service }) {
  const [typed, setTyped] = useState<Record<string, string>>({})
  const set = useAction((v: { vehicle_type: string; amount: string }) => api(`/admin/services/${service.id}/price`, { method: "PUT", body: { vehicle_type: v.vehicle_type, amount_kobo: toKobo(v.amount) } }), { invalidate: ["/admin/services", "/services"], success: "Price saved." })
  return (
    <div className="kit-chips" style={{ marginTop: 12, gap: 12 }}>
      {vehicleTypes.map((t) => (
        <form key={t} className="kit-row" style={{ gap: 6 }} onSubmit={(e) => { e.preventDefault(); if (typed[t] !== undefined) set.run({ vehicle_type: t, amount: typed[t] }) }}>
          <label className="kit-faint" style={{ width: 54 }}>{t === "suv" ? "SUV" : humanise(t)}</label>
          <span>₦</span>
          <input className="kit-input" style={{ width: 110 }} inputMode="numeric" aria-label={`${t} price`} value={typed[t] ?? (service.prices[t] !== undefined ? String(service.prices[t]! / 100) : "")} placeholder="not sold" onChange={(e) => setTyped({ ...typed, [t]: e.target.value })} />
          <button className="secondary kit-btn-small" disabled={typed[t] === undefined || set.pending}>Save</button>
        </form>
      ))}
    </div>
  )
}

function ServiceDrawer({ service, onClose }: { service?: Service; onClose: () => void }) {
  const form = useForm({ slug: service?.slug ?? "", name: service?.name ?? "", description: service?.description ?? "", duration_minutes: String(service?.duration_minutes ?? 45), is_active: service?.is_active ?? true })
  const save = useAction(() => {
    const v = form.values
    const body = { name: v.name, description: v.description || null, duration_minutes: Number(v.duration_minutes), is_active: v.is_active, ...(service ? {} : { slug: v.slug }) }
    return api(service ? `/admin/services/${service.id}` : "/admin/services", { method: service ? "PATCH" : "POST", body })
  }, { invalidate: ["/admin/services", "/services"], success: "Saved.", onSuccess: onClose })
  return (
    <Drawer title={service ? "Edit service" : "New service"} eyebrow="CATALOGUE" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        {!service && <Field label="Slug" error={fieldError(save.error, "slug")} hint="Letters, numbers and dashes, e.g. interior-detail."><input {...form.field("slug")} required /></Field>}
        <Field label="Name" error={fieldError(save.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Description" error={fieldError(save.error, "description")}><textarea {...form.field("description")} rows={3} /></Field>
        <Field label="Duration (minutes)" error={fieldError(save.error, "duration_minutes")}><input {...form.field("duration_minutes")} type="number" min={5} max={480} /></Field>
        <CheckField {...form.check("is_active")}>On sale</CheckField>
        <div className="actions"><button className="primary" disabled={save.pending}>Save</button></div>
      </form>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ plans */

export function Plans() {
  const plans = useItems<Plan>("/admin/subscription-plans")
  const [editing, setEditing] = useState<Plan | "new" | null>(null)
  return (
    <>
      <PageHeader eyebrow="WHAT WE SELL" title="Subscription plans" description="Prepaid wash bundles. Changing what a plan costs or includes creates a new version: subscribers keep renewing on the terms they bought." action={<button className="primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> New plan</button>} />
      <Panel>
        <Async query={plans} empty={<Empty icon="card" title="No plans." />} isEmpty={(d) => d.length === 0}>
          {() => (
            <Table rows={plans.items} rowKey={(p) => p.id} columns={[
              { header: "Plan", cell: (p) => <button className="kit-link" onClick={() => setEditing(p)}><Two top={p.name} bottom={`${p.slug} · v${p.version}`} /></button> },
              { header: "For", cell: (p) => (p.scope === "corporate" ? "Fleets" : "Individuals") },
              { header: "Washes", cell: (p) => `${p.washes_included} over ${p.months} month${p.months > 1 ? "s" : ""}` },
              { header: "Rollover", cell: (p) => p.rollover_max },
              { header: "Discount", cell: (p) => (p.discount_percent ? `${p.discount_percent}%` : "—") },
              { header: "Price", className: "right", cell: (p) => naira(p.price_kobo) },
              { header: "Status", cell: (p) => <Pill status={p.is_active ? "active" : "inactive"} label={p.is_active ? "On sale" : "Off sale"} /> },
            ]} />
          )}
        </Async>
      </Panel>
      {editing && <PlanDrawer plan={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function PlanDrawer({ plan, onClose }: { plan?: Plan; onClose: () => void }) {
  const form = useForm({ slug: plan?.slug ?? "", name: plan?.name ?? "", scope: plan?.scope ?? "individual", months: String(plan?.months ?? 1), washes_included: String(plan?.washes_included ?? 4), rollover_max: String(plan?.rollover_max ?? 0), price: plan ? String(plan.price_kobo / 100) : "", discount_percent: String(plan?.discount_percent ?? 0), is_active: plan?.is_active ?? true })
  const save = useAction(() => {
    const v = form.values
    const body = { name: v.name, scope: v.scope, months: Number(v.months), washes_included: Number(v.washes_included), rollover_max: Number(v.rollover_max), price_kobo: toKobo(String(v.price)), discount_percent: Number(v.discount_percent), is_active: v.is_active, ...(plan ? {} : { slug: v.slug }) }
    return api(plan ? `/admin/subscription-plans/${plan.id}` : "/admin/subscription-plans", { method: plan ? "PATCH" : "POST", body })
  }, { invalidate: ["/admin/subscription-plans", "/subscription-plans"], success: plan ? "Saved. Terms that changed are a new version." : "Plan created.", onSuccess: onClose })
  return (
    <Drawer title={plan ? "Edit plan" : "New plan"} eyebrow="SUBSCRIPTIONS" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        {!plan && <Field label="Slug" error={fieldError(save.error, "slug")}><input {...form.field("slug")} required /></Field>}
        <Field label="Name" error={fieldError(save.error, "name")}><input {...form.field("name")} required /></Field>
        <div className="form-grid">
          <Field label="For"><select {...form.field("scope")}><option value="individual">Individuals</option><option value="corporate">Fleets (companies)</option></select></Field>
          <Field label="Term" error={fieldError(save.error, "months")}><select {...form.field("months")}>{[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>)}</select></Field>
        </div>
        <div className="form-grid">
          <Field label="Washes included" error={fieldError(save.error, "washes_included")}><input {...form.field("washes_included")} type="number" min={1} /></Field>
          <Field label="Unused credits that roll over" error={fieldError(save.error, "rollover_max")}><input {...form.field("rollover_max")} type="number" min={0} /></Field>
        </div>
        <div className="form-grid">
          <Field label="Price (₦)" error={fieldError(save.error, "price_kobo")}><input {...form.field("price")} type="number" min={1} required /></Field>
          <Field label="Discount %" error={fieldError(save.error, "discount_percent")}><input {...form.field("discount_percent")} type="number" min={0} max={50} /></Field>
        </div>
        <CheckField {...form.check("is_active")}>On sale</CheckField>
        <div className="actions"><button className="primary" disabled={save.pending}>Save plan</button></div>
      </form>
    </Drawer>
  )
}

/* ------------------------------------------------------------------ coverage */

type Coverage = { state: string; name: string; available: boolean; capacity_per_slot: number; note: string | null }

export function CoverageScreen() {
  const coverage = useItems<Coverage>("/admin/coverage")
  const toggle = useAction((v: { state: string; body: Record<string, unknown> }) => api(`/admin/coverage/${v.state}`, { method: "PATCH", body: v.body }), { invalidate: ["/admin/coverage", "/coverage"], success: "Saved." })
  return (
    <>
      <PageHeader eyebrow="WHERE WE WORK" title="Coverage" description="Turn a state on or off, and set how many washes it can take per two-hour slot." />
      <Panel>
        <Async query={coverage}>
          {() => (
            <Table rows={coverage.items} rowKey={(c) => c.state} columns={[
              { header: "State", cell: (c) => <Two top={c.name} bottom={c.state} /> },
              { header: "Served", cell: (c) => <label className="kit-chip"><input type="checkbox" checked={c.available} onChange={(e) => toggle.run({ state: c.state, body: { is_active: e.target.checked } })} /> {c.available ? "Yes" : "No"}</label> },
              { header: "Washes per slot", cell: (c) => <CapacityInput c={c} onSave={(n) => toggle.run({ state: c.state, body: { capacity_per_slot: n } })} /> },
              { header: "Note", cell: (c) => c.note ?? "—" },
            ]} />
          )}
        </Async>
      </Panel>
    </>
  )
}

function CapacityInput({ c, onSave }: { c: Coverage; onSave: (n: number) => void }) {
  const [value, setValue] = useState(String(c.capacity_per_slot))
  return (
    <span className="kit-row" style={{ gap: 6 }}>
      <input className="kit-input" style={{ width: 80 }} type="number" min={0} max={5000} aria-label={`${c.name} capacity`} value={value} onChange={(e) => setValue(e.target.value)} />
      {Number(value) !== c.capacity_per_slot && <button className="secondary kit-btn-small" onClick={() => onSave(Number(value))}>Save</button>}
    </span>
  )
}

/* ------------------------------------------------------------------ settings */

type Settings = Record<string, Record<string, number>>

const SETTING_LABELS: Record<string, Record<string, string>> = {
  verdict: { sms_link_after_minutes: "Send the customer a one-tap link after (minutes)", job_code_after_minutes: "Ask for the job code after (minutes)", release_request_after_minutes: "Let the washman ask for a release after (minutes)", late_window_hours: "Accept a late verdict for (hours)", link_ttl_hours: "Verdict link lives for (hours)" },
  geofence: { default_radius_m: "Arrival radius around a customer's pin (metres)" },
  booking: { min_lead_minutes: "Book at least this far ahead (minutes)", max_days_ahead: "Book at most this far ahead (days)", free_change_hours: "Free cancel / reschedule until (hours before)", late_cancel_fee_percent: "Share kept when cancelling late (%)", max_reschedules: "Times a booking can be moved" },
  referrals: { enabled: "Referrals on (1) or off (0)", welcome_reward_kobo: "A friend's welcome reward (kobo)", referrer_reward_kobo: "The inviter's reward (kobo)" },
}

export function SettingsScreen() {
  const settings = useResource<Settings>("/admin/settings")
  const [changes, setChanges] = useState<Record<string, string>>({})
  const save = useAction(() => {
    const body: Settings = {}
    for (const [key, value] of Object.entries(changes)) {
      const [group, name] = key.split(".")
      body[group] = { ...body[group], [name]: Number(value) }
    }
    return api("/admin/settings", { method: "PUT", body: { settings: body } })
  }, { invalidate: ["/admin/settings"], success: "Settings saved.", onSuccess: () => setChanges({}) })
  return (
    <>
      <PageHeader eyebrow="HOW THE SERVICE RUNS" title="Settings" description="Rules that can be tuned without a release. Every change is recorded." action={<button className="primary" disabled={Object.keys(changes).length === 0 || save.pending} onClick={() => save.run()}>Save {Object.keys(changes).length || ""} change{Object.keys(changes).length === 1 ? "" : "s"}</button>} />
      <Async query={settings}>
        {(s) => (
          <div className="kit-stack">
            {Object.entries(s).map(([group, values]) => (
              <Panel key={group} title={humanise(group)}>
                <div className="kit-form">
                  {Object.entries(values).map(([name, value]) => {
                    const key = `${group}.${name}`
                    return (
                      <Field key={key} label={SETTING_LABELS[group]?.[name] ?? humanise(name)} error={fieldError(save.error, `settings.${key}`)}>
                        <input type="number" value={changes[key] ?? String(value)} onChange={(e) => setChanges({ ...changes, [key]: e.target.value })} />
                      </Field>
                    )
                  })}
                </div>
              </Panel>
            ))}
          </div>
        )}
      </Async>
    </>
  )
}

/* ------------------------------------------------------------------ audit log */

type Audit = { id: number; admin: { id: string; name: string } | null; action: string; subject_type: string | null; subject_id: string | null; reason: string | null; created_at: string; ip: string | null; before: unknown; after: unknown }

export function AuditLog() {
  return (
    <AdminList<Audit>
      eyebrow="NOBODY CAN EDIT THIS" title="Audit log" description="Every change an admin makes, with who, when and why."
      path="/admin/audit-logs" rowKey={(a) => String(a.id)}
      search={{ param: "action", placeholder: "Action, e.g. job.assign" }}
      columns={[
        { header: "When", cell: (a) => <Two top={stamp(a.created_at)} bottom={relative(a.created_at)} /> },
        { header: "Admin", cell: (a) => <Two top={a.admin?.name ?? "System"} bottom={a.ip} /> },
        { header: "Action", cell: (a) => <Two top={a.action} bottom={a.subject_type ? `${a.subject_type} ${a.subject_id?.slice(-6) ?? ""}` : undefined} /> },
        { header: "Reason", cell: (a) => a.reason ?? "—" },
      ]}
    />
  )
}

/* ------------------------------------------------------------------ admin accounts and roles */

export function Accounts() {
  const roles = useItems<RoleInfo>("/admin/roles")
  const [creating, setCreating] = useState(false)
  const [secret, setSecret] = useState<{ title: string; password?: string; authenticator_secret?: string; authenticator_uri?: string } | null>(null)
  return (
    <>
      <AdminList<AdminUser>
        eyebrow="WHO CAN SIGN IN" title="Admin accounts" description="Create admins, change roles, suspend, and replace a lost password or authenticator. Credentials are shown once."
        path="/admin/users" rowKey={(u) => u.id}
        action={<button className="primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> New admin</button>}
        filters={[{ param: "role", label: "Any role", options: roles.items.map((r) => ({ value: r.role, label: r.label })) }, { param: "status", label: "Any status", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }] }]}
        columns={[
          { header: "Admin", cell: (u) => <Two top={u.name} bottom={u.email} /> },
          { header: "Role", cell: (u) => humanise(u.role) },
          { header: "Status", cell: (u) => <Pill status={u.status} /> },
          { header: "Last sign-in", cell: (u) => (u.last_login_at ? relative(u.last_login_at) : "Never") },
          { header: "", className: "right", cell: (u) => <AccountActions user={u} roles={roles.items} onSecret={setSecret} /> },
        ]}
      />
      <Panel title="What each role may do">
        <div className="kit-grid cols-2" style={{ marginBottom: 0 }}>
          {roles.items.map((r) => (
            <div key={r.role}>
              <h4 className="kit-panel-title" style={{ fontSize: 15 }}>{r.label} <span className="kit-faint">· {r.holders} active</span></h4>
              <p className="kit-muted">{r.summary}</p>
              <ul className="kit-muted" style={{ margin: "8px 0 0", paddingLeft: 18 }}>{r.permissions.map((p) => <li key={p.key}>{p.label}</li>)}</ul>
            </div>
          ))}
        </div>
      </Panel>
      {creating && <CreateAdmin roles={roles.items} onClose={() => setCreating(false)} onCreated={(s) => { setCreating(false); setSecret(s) }} />}
      {secret && (
        <Modal title={secret.title} onClose={() => setSecret(null)}>
          <Notice tone="warn" icon="lock">Give these to the person now. They are shown only once.</Notice>
          <Facts items={[...(secret.password ? ([["One-time password", <b key="p" className="kit-mono">{secret.password}</b>]] as [string, React.ReactNode][]) : []), ...(secret.authenticator_secret ? ([["Authenticator secret", <b key="a" className="kit-mono">{secret.authenticator_secret}</b>], ["Setup link", <span key="u" className="kit-mono" style={{ wordBreak: "break-all" }}>{secret.authenticator_uri}</span>]] as [string, React.ReactNode][]) : [])]} />
          <div className="kit-form"><div className="actions"><button className="primary" onClick={() => setSecret(null)}>Done</button></div></div>
        </Modal>
      )}
    </>
  )
}

type OneTime = { password?: string; authenticator_secret?: string; authenticator_uri?: string }

function CreateAdmin({ roles, onClose, onCreated }: { roles: RoleInfo[]; onClose: () => void; onCreated: (s: { title: string } & OneTime) => void }) {
  const form = useForm({ name: "", email: "", phone: "", role: "support" })
  const create = useAction(() => api<{ one_time: OneTime }>("/admin/users", { method: "POST", body: { name: form.values.name, email: form.values.email, role: form.values.role, phone: form.values.phone || undefined } }), {
    invalidate: ["/admin/users", "/admin/roles"], onSuccess: (r) => onCreated({ title: "Admin created", ...r.one_time }),
  })
  return (
    <Drawer title="New admin" eyebrow="OPERATIONS ACCOUNT" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); create.run() }}>
        <Field label="Full name" error={fieldError(create.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Work email" error={fieldError(create.error, "email")}><input {...form.field("email")} type="email" required /></Field>
        <Field label="Phone (optional)" error={fieldError(create.error, "phone")}><input {...form.field("phone")} type="tel" /></Field>
        <Field label="Role" hint={roles.find((r) => r.role === form.values.role)?.summary}><select {...form.field("role")}>{roles.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}</select></Field>
        {create.error && create.error.code !== "validation_failed" && <p className="form-error">{create.error.message}</p>}
        <div className="actions"><button className="primary" disabled={create.pending}>Create admin</button></div>
      </form>
    </Drawer>
  )
}

function AccountActions({ user, roles, onSecret }: { user: AdminUser; roles: RoleInfo[]; onSecret: (s: { title: string } & OneTime) => void }) {
  const inv = ["/admin/users", "/admin/roles"]
  const role = useAction((r: string) => api(`/admin/users/${user.id}`, { method: "PATCH", body: { role: r } }), { invalidate: inv, success: "Role changed. Their sessions ended." })
  const reset = useAction((what: "reset-password" | "reset-2fa") => api<{ one_time: OneTime }>(`/admin/users/${user.id}/${what}`, { method: "POST" }), {
    invalidate: inv, onSuccess: (r) => onSecret({ title: r.one_time.password ? "New password" : "New authenticator", ...r.one_time }),
  })
  return (
    <span className="kit-row" style={{ justifyContent: "flex-end", gap: 8 }}>
      <select aria-label={`Role of ${user.name}`} value={user.role} onChange={(e) => role.run(e.target.value)} disabled={role.pending}>{roles.map((r) => <option key={r.role} value={r.role}>{r.label}</option>)}</select>
      {user.status === "active" ? <ReasonButton small label="Suspend" path={`/admin/users/${user.id}/suspend`} invalidate={inv} success="Suspended and signed out." danger description="They cannot sign in until you activate them." /> : <ActionButton small label="Activate" path={`/admin/users/${user.id}/activate`} invalidate={inv} success="Activated." />}
      <button className="secondary kit-btn-small" onClick={() => reset.run("reset-password")}>Reset password</button>
      <button className="secondary kit-btn-small" onClick={() => reset.run("reset-2fa")}>Reset authenticator</button>
    </span>
  )
}

/* ------------------------------------------------------------------ my security (replace my own authenticator) */

export function Security() {
  const me = sessionStore.get()?.user
  const [secret, setSecret] = useState<{ secret: string; uri: string } | null>(null)
  const code = useForm({ current: "", confirm: "" })
  const start = useAction(() => api<{ data: { secret: string; uri: string } }>("/admin/me/two-factor", { method: "POST", body: { current_code: code.values.current } }), { onSuccess: (r) => setSecret(r.data) })
  const confirm = useAction(() => api("/admin/me/two-factor/confirm", { method: "POST", body: { code: code.values.confirm } }), { success: "Your new authenticator is active.", onSuccess: () => { setSecret(null); code.reset() } })
  return (
    <>
      <PageHeader eyebrow="YOUR ACCOUNT" title="My security" description={me ? `${me.name} · ${me.email ?? ""}` : undefined} />
      <Panel title="Replace my authenticator" description="New phone? Start with a code from the current app, scan the new secret, then confirm with a code from the new one. Until you confirm, the old one keeps working.">
        {!secret ? (
          <form className="kit-form" onSubmit={(e) => { e.preventDefault(); start.run() }}>
            <Field label="Code from your current authenticator" error={fieldError(start.error, "current_code")}><input {...code.field("current")} inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required /></Field>
            {start.error && start.error.code !== "validation_failed" && <p className="form-error">{start.error.message}</p>}
            <div className="actions"><button className="primary" disabled={start.pending}>Start</button></div>
          </form>
        ) : (
          <form className="kit-form" onSubmit={(e) => { e.preventDefault(); confirm.run() }}>
            <Facts items={[["Secret", <b key="s" className="kit-mono">{secret.secret}</b>], ["Setup link", <span key="u" className="kit-mono" style={{ wordBreak: "break-all" }}>{secret.uri}</span>]]} />
            <Field label="Code from the NEW authenticator" error={fieldError(confirm.error, "code")}><input {...code.field("confirm")} inputMode="numeric" maxLength={6} pattern="[0-9]{6}" required /></Field>
            {confirm.error && confirm.error.code !== "validation_failed" && <p className="form-error">{confirm.error.message}</p>}
            <div className="actions"><button className="primary" disabled={confirm.pending}>Confirm</button></div>
          </form>
        )}
      </Panel>
    </>
  )
}
