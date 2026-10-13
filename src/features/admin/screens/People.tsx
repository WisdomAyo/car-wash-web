"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, Empty, Facts, Metrics, Notice, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Drawer, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useResource } from "@/lib/api/hooks"
import type { AdminStaff, Booking, Ticket, Vehicle } from "@/lib/api/types"
import { day, humanise, naira, relative, stamp } from "@/lib/format"
import { SCREENING_STATUS } from "@/lib/labels"
import { base, useAdmin } from "../AdminSpace"
import { ActionButton, AdminList, ReasonButton } from "../parts"
import BookingsTable from "@/features/shared/BookingsTable"

const SCREENING = [
  ["identification", "Valid ID"], ["guarantor", "Guarantor details"], ["guarantor_documents", "Guarantor's ID and guarantee"],
  ["background_check", "Background check"], ["written_undertaking", "Signed undertaking"], ["employment_documents", "Work history or references"],
] as const

export function StaffList() {
  const { can } = useAdmin()
  const [creating, setCreating] = useState(false)
  return (
    <>
      <AdminList<AdminStaff>
        eyebrow="THE FIELD TEAM" title="Washmen" description="Applications, screening, activation and devices."
        path="/admin/staff" rowKey={(s) => s.id} href={(s) => `${base}/staff/${s.id}`}
        action={can("staff.manage") ? <button className="primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> Add a washman</button> : undefined}
        filters={[{ param: "status", label: "Any status", options: ["applicant", "inactive", "active", "suspended"].map((v) => ({ value: v, label: v === "applicant" ? "Applications" : humanise(v) })) }]}
        columns={[
          { header: "Washman", cell: (s) => <Two top={s.name} bottom={`${s.staff_code} · ${s.phone}`} /> },
          { header: "Status", cell: (s) => <span className="kit-row" style={{ gap: 6 }}><Pill status={s.status} />{s.pending_device_requested_at && <Pill status="pending" label="New phone waiting" />}</span> },
          { header: "Screening", cell: (s) => (s.screening_verified ? <Pill status="verified" label="All verified" /> : <span className="kit-faint">{Object.values(s.screening).filter((v) => v === "verified").length} of 6 verified</span>) },
          { header: "Shift", cell: (s) => (s.on_shift ? <Pill status="active" label={s.is_available ? "On shift" : "Paused"} /> : <span className="kit-faint">Off</span>) },
          { header: "Jobs", cell: (s) => <Two top={s.jobs_completed} bottom={s.rating ? `rated ${s.rating}` : undefined} /> },
        ]}
        empty={<Empty icon="users" title="No washmen here." />}
      />
      {creating && <CreateStaff onClose={() => setCreating(false)} />}
    </>
  )
}

function CreateStaff({ onClose }: { onClose: () => void }) {
  const form = useForm({ name: "", phone: "", home_zone: "", skills: "exterior-wash, full-wash" })
  const [pin, setPin] = useState<{ code: string; pin: string } | null>(null)
  const create = useAction(
    async () => api<{ data: AdminStaff; one_time_pin: string }>("/admin/staff", { method: "POST", body: { name: form.values.name, phone: form.values.phone, home_zone: form.values.home_zone || undefined, skills: String(form.values.skills).split(",").map((s) => s.trim()).filter(Boolean) } }),
    { invalidate: ["/admin/staff"], onSuccess: (r) => setPin({ code: r.data.staff_code, pin: r.one_time_pin }) },
  )
  if (pin) {
    return (
      <Modal title="Washman created" onClose={onClose}>
        <Notice tone="warn" icon="lock">Give these to the washman now. The PIN is shown only once.</Notice>
        <Facts items={[["Staff code", <b key="c" className="kit-mono">{pin.code}</b>], ["PIN", <b key="p" className="kit-mono">{pin.pin}</b>]]} />
        <p className="kit-muted" style={{ marginTop: 12 }}>They cannot work until every screening item is verified and you activate them.</p>
        <div className="kit-form"><div className="actions"><button className="primary" onClick={onClose}>Done</button></div></div>
      </Modal>
    )
  }
  return (
    <Drawer title="Add a washman" eyebrow="CREATED BY OPERATIONS" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); create.run() }}>
        <Field label="Full name" error={fieldError(create.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Phone" error={fieldError(create.error, "phone")}><input {...form.field("phone")} type="tel" required /></Field>
        <Field label="Home area" error={fieldError(create.error, "home_zone")}><input {...form.field("home_zone")} /></Field>
        <Field label="Skills" hint="Comma separated service slugs."><input {...form.field("skills")} /></Field>
        <div className="actions"><button className="primary" disabled={create.pending}>Create</button></div>
      </form>
    </Drawer>
  )
}

export function StaffDetail({ id }: { id: string }) {
  const staff = useResource<AdminStaff>(`/admin/staff/${id}`)
  const { can } = useAdmin()
  const manage = can("staff.manage")
  const inv = [`/admin/staff/${id}`, "/admin/staff"]
  const setItem = useAction((v: { item: string; status: string }) => api(`/admin/staff/${id}/screening`, { method: "PUT", body: v }), { invalidate: inv, success: "Screening updated." })
  const [pin, setPin] = useState<string | null>(null)
  const resetPin = useAction(() => api<{ one_time_pin: string }>(`/admin/staff/${id}/reset-pin`, { method: "POST" }), { onSuccess: (r) => setPin(r.one_time_pin) })

  return (
    <Async query={staff}>
      {(s) => (
        <>
          <PageHeader eyebrow={`${s.staff_code}`} title={s.name} description={`${s.phone}${s.email ? ` · ${s.email}` : ""}`} action={<Link className="secondary" href={`${base}/staff`}>All washmen</Link>} />
          {s.decision_note && s.status === "suspended" && <Notice tone="bad" icon="alert">{s.decision_note}</Notice>}
          {s.pending_device_requested_at && (
            <Notice tone="warn" icon="alert">
              <b>A different phone tried to sign in ({stamp(s.pending_device_requested_at)}).</b> Check with the washman first. Approving binds the new phone and signs the old one out.
              {manage && <div style={{ marginTop: 8 }}><ActionButton small primary label="Approve the new phone" path={`/admin/staff/${id}/approve-device`} invalidate={inv} success="Phone approved." /></div>}
            </Notice>
          )}
          <div className="kit-grid side">
            <div className="kit-stack">
              <Panel title="Screening" description="Every item must be verified before a washman can be activated." action={<Pill status={s.status} />}>
                <div className="kit-list">
                  {SCREENING.map(([item, label]) => {
                    const status = s.screening[item] ?? "missing"
                    const docs = s.documents?.filter((d) => d.item === item) ?? []
                    return (
                      <div className="kit-item" key={item}>
                        <div className="grow">
                          <h4>{label}</h4>
                          {docs.map((d) => <p key={d.id}><a className="kit-link" href={d.url} target="_blank" rel="noreferrer"><Icon name="file" size={13} /> {d.name}</a> <span className="kit-faint">· {stamp(d.uploaded_at)}</span></p>)}
                          {item === "guarantor" && s.guarantor?.name && <p>{s.guarantor.name} · {s.guarantor.phone}</p>}
                        </div>
                        {manage ? (
                          <select value={status} aria-label={`${label} status`} onChange={(e) => setItem.run({ item, status: e.target.value })} disabled={setItem.pending}>
                            {(["missing", "submitted", "verified"] as const).map((v) => <option key={v} value={v}>{SCREENING_STATUS[v]}</option>)}
                          </select>
                        ) : <Pill status={status === "verified" ? "verified" : "pending"} label={SCREENING_STATUS[status] ?? status} />}
                      </div>
                    )
                  })}
                </div>
              </Panel>
            </div>
            <div className="kit-stack">
              <Panel title="Decisions">
                <div className="kit-row">
                  {manage && s.status !== "active" && <ActionButton primary label="Activate" path={`/admin/staff/${id}/activate`} invalidate={inv} success="Washman activated." />}
                  {manage && s.status === "applicant" && <ReasonButton label="Decline application" path={`/admin/staff/${id}/reject`} invalidate={inv} success="Application declined." danger description="The applicant is told why when they sign in." />}
                  {manage && s.status === "active" && <ReasonButton label="Suspend" path={`/admin/staff/${id}/suspend`} invalidate={inv} success="Washman suspended." danger description="Signs them out and stops new jobs." />}
                  {manage && s.status !== "applicant" && <button className="secondary" onClick={() => resetPin.run()}>Reset PIN</button>}
                </div>
                {!s.screening_verified && s.status !== "active" && <p className="kit-hint"><Icon name="alert" size={15} /> Activation is refused until all six items are verified.</p>}
              </Panel>
              <Panel title="Record">
                <Facts items={[["Home area", s.home_zone], ["Skills", s.skills?.join(", ")], ["Jobs completed", s.jobs_completed], ["Rating", s.rating], ["Phone registered", s.device_bound ? "Yes" : "Not yet"], ["Integrity flags", s.integrity_flags], ["Applied", s.applied_at ? stamp(s.applied_at) : null], ["Last seen at", s.last_location ? `${s.last_location.lat.toFixed(4)}, ${s.last_location.lng.toFixed(4)} · ${relative(s.last_location.at)}` : null]]} />
              </Panel>
            </div>
          </div>
          {pin && <Modal title="New PIN" onClose={() => setPin(null)}><Notice tone="warn" icon="lock">Give this to the washman now. It is shown only once.</Notice><p className="kit-mono" style={{ fontSize: 28, margin: "12px 0" }}>{pin}</p><div className="kit-form"><div className="actions"><button className="primary" onClick={() => setPin(null)}>Done</button></div></div></Modal>}
        </>
      )}
    </Async>
  )
}

type CustomerRow = { id: string; name: string; phone: string | null; email: string | null; status: string; created_at?: string }

export function CustomersList() {
  return (
    <AdminList<CustomerRow>
      eyebrow="THE PEOPLE WE WASH FOR" title="Customers" description="Search by name, phone or email."
      path="/admin/customers" rowKey={(c) => c.id} href={(c) => `${base}/customers/${c.id}`} search={{ param: "q", placeholder: "Name, phone or email" }}
      columns={[
        { header: "Customer", cell: (c) => <Two top={c.name} bottom={c.email ?? c.phone} /> },
        { header: "Phone", cell: (c) => c.phone ?? "—" },
        { header: "Status", cell: (c) => <Pill status={c.status} /> },
      ]}
      empty={<Empty icon="user" title="No customers match." />}
    />
  )
}

type CustomerDetailData = {
  user: { id: string; name: string; phone: string | null; email: string | null; email_verified: boolean; status: string; referral_code: string | null }
  organisations: { id: string; name: string; type: string; my_role: string }[]
  stats: { bookings: number; completed: number; cancelled: number; open_tickets: number; paid_kobo: number; refunded_kobo: number }
  vehicles: Vehicle[]
  subscriptions: { id: string; status: string; plan: { name: string }; washes_remaining: number }[]
  recent_tickets: Ticket[]
  consents: { type: string; version: string; action: string; at: string }[]
  referral: { code: string | null; stats?: { invited: number } }
}

export function CustomerDetail({ id }: { id: string }) {
  const customer = useResource<CustomerDetailData>(`/admin/customers/${id}`)
  return (
    <Async query={customer}>
      {(c) => (
        <>
          <PageHeader eyebrow="CUSTOMER" title={c.user.name} description={`${c.user.email ?? ""}${c.user.email && c.user.phone ? " · " : ""}${c.user.phone ?? ""}`} action={<Link className="secondary" href={`${base}/customers`}>All customers</Link>} />
          <Metrics items={[
            { label: "Bookings", value: c.stats.bookings, note: `${c.stats.completed} completed · ${c.stats.cancelled} cancelled`, icon: "calendar" },
            { label: "Paid", value: naira(c.stats.paid_kobo), note: `${naira(c.stats.refunded_kobo)} refunded`, icon: "card" },
            { label: "Open tickets", value: c.stats.open_tickets, icon: "help" },
            { label: "Vehicles", value: c.vehicles.length, icon: "car" },
          ]} />
          <div className="kit-grid side">
            <div className="kit-stack">
              <Panel title="Bookings"><BookingsTable path={`/admin/customers/${id}/bookings`} hrefFor={(b: Booking) => (b.job ? `${base}/jobs/${b.job.id}` : `${base}/customers/${id}`)} /></Panel>
              <Panel title="Tickets">
                {c.recent_tickets.length === 0 ? <p className="kit-muted">None.</p> : <Table rows={c.recent_tickets} rowKey={(t) => t.id} href={(t) => `${base}/tickets/${t.id}`} columns={[{ header: "Ticket", cell: (t) => <Two top={humanise(t.type)} bottom={t.body.slice(0, 70)} /> }, { header: "Status", cell: (t) => <Pill status={t.status} /> }, { header: "Opened", cell: (t) => day(t.created_at) }]} />}
              </Panel>
            </div>
            <div className="kit-stack">
              <Panel title="Account"><Facts items={[["Status", <Pill key="s" status={c.user.status} />], ["Email", c.user.email ? `${c.user.email}${c.user.email_verified ? " (confirmed)" : " (not confirmed)"}` : null], ["Referral code", c.user.referral_code], ["Organisations", c.organisations.map((o) => `${o.name} (${o.my_role})`).join(", ")]]} /></Panel>
              <Panel title="Vehicles">{c.vehicles.map((v) => <div className="kit-item" key={v.id}><Plate value={v.plate} /><div className="grow">{v.make} {v.model} · {v.colour}</div></div>)}{c.vehicles.length === 0 && <p className="kit-muted">None.</p>}</Panel>
              <Panel title="Subscriptions">{c.subscriptions.length === 0 ? <p className="kit-muted">None.</p> : c.subscriptions.map((s) => <div className="kit-item" key={s.id}><div className="grow">{s.plan.name} · {s.washes_remaining} left</div><Pill status={s.status} /></div>)}</Panel>
              <Panel title="Terms accepted">{c.consents.map((x) => <p key={x.type + x.at} className="kit-muted">{humanise(x.type)} {x.version} · {humanise(x.action)} · {stamp(x.at)}</p>)}</Panel>
            </div>
          </div>
        </>
      )}
    </Async>
  )
}

export function VehiclesList() {
  const { can } = useAdmin()
  const [fixing, setFixing] = useState<Vehicle | null>(null)
  return (
    <>
      <AdminList<Vehicle>
        eyebrow="THE FLEET ON OUR BOOKS" title="Vehicles" description="Every registered vehicle. A plate typed wrongly can be corrected here, with a reason."
        path="/admin/vehicles" rowKey={(v) => v.id} search={{ param: "q", placeholder: "Plate" }}
        columns={[
          { header: "Plate", cell: (v) => <Plate value={v.plate} /> },
          { header: "Vehicle", cell: (v) => <Two top={`${v.make} ${v.model}`} bottom={v.colour} /> },
          { header: "Type", cell: (v) => humanise(v.type) },
          { header: "Owner", cell: (v) => (v.organisation_id ? "Organisation" : "Personal") },
          { header: "", className: "right", cell: (v) => (can("vehicles.correct_plate") ? <button className="kit-link" onClick={() => setFixing(v)}>Correct plate</button> : null) },
        ]}
      />
      {fixing && <CorrectPlate vehicle={fixing} onClose={() => setFixing(null)} />}
    </>
  )
}

function CorrectPlate({ vehicle, onClose }: { vehicle: Vehicle; onClose: () => void }) {
  const form = useForm({ plate: vehicle.plate, reason: "" })
  const save = useAction(() => api(`/admin/vehicles/${vehicle.id}/plate`, { method: "PUT", body: form.values }), { invalidate: ["/admin/vehicles"], success: "Plate corrected.", onSuccess: onClose })
  return (
    <Modal title="Correct the plate" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        <Field label="Plate" error={fieldError(save.error, "plate")}><input {...form.field("plate")} required style={{ textTransform: "uppercase" }} /></Field>
        <Field label="Reason" error={fieldError(save.error, "reason")} hint="Written to the audit log."><textarea {...form.field("reason")} required minLength={3} /></Field>
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={save.pending}>Correct</button></div>
      </form>
    </Modal>
  )
}

