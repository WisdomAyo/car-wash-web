"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, AsyncList, Empty, Metrics, Notice, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { ConfirmDialog, Drawer } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Booking, Member, Place, Service, Subscription, Vehicle } from "@/lib/api/types"
import { lagosDate, humanise, naira } from "@/lib/format"
import BookingsTable from "@/features/shared/BookingsTable"
import PlaceForm from "@/features/shared/PlaceForm"
import SlotPicker from "@/features/shared/SlotPicker"
import VehicleForm from "@/features/shared/VehicleForm"
import { usePartner } from "../PartnerSpace"

export function FleetOverview() {
  const { org, base, manages } = usePartner()
  const vehicles = useList<Vehicle>("/vehicles")
  const jobs = useItems<{ id: string; state: string }>(`/organisations/${org.id}/jobs`, { active: 1 })
  const summary = useResource<{ washes_completed: number; cancelled: number }>(`/organisations/${org.id}/summary`, { month: lagosDate().slice(0, 7) })
  const subs = useItems<Subscription>("/subscriptions")
  const fleet = vehicles.items.filter((v) => v.organisation_id === org.id)
  const credit = subs.items.filter((s) => s.organisation_id === org.id && s.status === "active").reduce((n, s) => n + s.washes_remaining, 0)
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title={`A brighter workday, ${org.contact_name?.split(" ")[0] ?? org.name}.`} description="Every vehicle. One less worry."
        action={manages ? <Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book fleet wash</Link> : undefined} />
      <Metrics items={[
        { label: "Vehicles in your fleet", value: vehicles.isPending ? "…" : fleet.length, note: vehicles.hasMore ? "At least" : "One account. All your care.", icon: "car" },
        { label: "Washes this month", value: summary.data?.washes_completed ?? "…", note: `${summary.data?.cancelled ?? 0} cancelled`, icon: "drop" },
        { label: "Washing now", value: jobs.items.length, note: "Active across the fleet", icon: "clock" },
        { label: "Plan credits left", value: credit, note: "Washes remaining this term", icon: "card" },
      ]} />
      {org.status !== "active" && <Notice tone="warn" icon="alert">This account is {org.status}. Booking is paused until Go-Wash activates it.</Notice>}
      <Panel title="Latest bookings" action={<Link className="kit-link" href={`${base}/bookings`}>All</Link>}>
        <BookingsTable path={`/organisations/${org.id}/bookings`} hrefFor={(b) => `${base}/bookings/${b.id}`} />
      </Panel>
    </>
  )
}

export function FleetVehicles() {
  const { org, manages } = usePartner()
  const list = useList<Vehicle>("/vehicles")
  const [editing, setEditing] = useState<Vehicle | "new" | null>(null)
  const fleet = { ...list, items: list.items.filter((v) => v.organisation_id === org.id) }
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET" title="Vehicles" description="Add the company's vehicles. Each plate links every wash to the right car."
        action={manages ? <button className="primary" onClick={() => setEditing("new")}><Icon name="plus" size={17} /> Add a vehicle</button> : undefined} />
      <Panel>
        <AsyncList list={fleet} empty={<Empty icon="car" title="No fleet vehicles yet." action={manages ? <button className="primary" onClick={() => setEditing("new")}>Add the first one</button> : undefined}>Register the vehicles you want washed.</Empty>}>
          {(items) => <Table rows={items} rowKey={(v) => v.id} columns={[
            { header: "Vehicle", cell: (v) => <Two top={`${v.make} ${v.model}`} bottom={v.colour} /> },
            { header: "Plate", cell: (v) => <Plate value={v.plate} /> },
            { header: "Type", cell: (v) => (v.type === "suv" ? "SUV" : humanise(v.type)) },
            { header: "", className: "right", cell: (v) => (manages ? <button className="kit-link" onClick={() => setEditing(v)}>Edit</button> : null) },
          ]} />}
        </AsyncList>
      </Panel>
      {editing && <VehicleForm vehicle={editing === "new" ? undefined : editing} organisationId={org.id} onClose={() => setEditing(null)} />}
    </>
  )
}

export function FleetBookings() {
  const { org, base, manages } = usePartner()
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET" title="Wash schedule" description="All the fleet's bookings." action={manages ? <Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book fleet wash</Link> : undefined} />
      <Panel><BookingsTable path={`/organisations/${org.id}/bookings`} hrefFor={(b) => `${base}/bookings/${b.id}`} /></Panel>
    </>
  )
}

type OrgJob = { id: string; state: string; plate: string; washman: { name: string } | string | null; verdict: string | null; result: string | null }

export function FleetJobs() {
  const { org, base } = usePartner()
  const [active, setActive] = useState(true)
  const jobs = useItems<OrgJob>(`/organisations/${org.id}/jobs`, active ? { active: 1 } : undefined, { refetchInterval: 30_000 })
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET" title="Active washes" description="Where each wash is, and who is on it. The named driver confirms their own vehicle." />
      <Panel>
        <div className="kit-toolbar"><label className="kit-chip"><input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} /> Only washes in progress</label></div>
        <Async query={jobs} empty={<Empty icon="drop" title="No washes right now." />} isEmpty={() => jobs.items.length === 0}>
          {() => <Table rows={jobs.items} rowKey={(j) => j.id} columns={[
            { header: "Vehicle", cell: (j) => <Plate value={j.plate} /> },
            { header: "Washman", cell: (j) => (j.washman ? (typeof j.washman === "string" ? j.washman : j.washman.name) : <span className="kit-faint">Not assigned</span>) },
            { header: "Status", cell: (j) => <Pill status={j.state} /> },
            { header: "Verdict", cell: (j) => (j.verdict ? humanise(j.verdict) : "—") },
            { header: "", className: "right", cell: (j) => (j.state === "ready" ? <Link className="kit-link" href={`${base}/confirm/${j.id}`}>Confirm the wash</Link> : null) },
          ]} />}
        </Async>
      </Panel>
    </>
  )
}

export function Team() {
  const { org, role } = usePartner()
  const members = useItems<Member>(`/organisations/${org.id}/members`)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Member | null>(null)
  const remove = useAction((m: Member) => api(`/organisations/${org.id}/members/${m.id}`, { method: "DELETE" }), { invalidate: [`/organisations/${org.id}/members`], success: "Removed.", onSuccess: () => setRemoving(null) })
  return (
    <>
      <PageHeader eyebrow="YOUR ORGANISATION" title="Team & confirmers" description="Managers book and manage washes. Confirmers check a finished wash and give the verdict." action={<button className="primary" onClick={() => setAdding(true)}><Icon name="plus" size={17} /> Add a person</button>} />
      <Panel>
        <Async query={members}>
          {() => <Table rows={members.items} rowKey={(m) => m.id} columns={[
            { header: "Person", cell: (m) => <Two top={m.name} bottom={m.email ?? m.phone} /> },
            { header: "Role", cell: (m) => <Pill status="info" tone="info" label={humanise(m.role)} /> },
            { header: "", className: "right", cell: (m) => (m.role !== "owner" && role === "owner" ? <button className="kit-link kit-danger" onClick={() => setRemoving(m)}>Remove</button> : null) },
          ]} />}
        </Async>
      </Panel>
      {adding && <AddMember orgId={org.id} onClose={() => setAdding(false)} />}
      {removing && <ConfirmDialog title="Remove this person?" description={`${removing.name} will lose access to the organisation.`} confirmLabel="Remove" danger pending={remove.pending} onConfirm={() => remove.run(removing)} onClose={() => setRemoving(null)} />}
    </>
  )
}

function AddMember({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const form = useForm({ name: "", email: "", role: "manager" })
  const add = useAction(() => api(`/organisations/${orgId}/members`, { method: "POST", body: { name: form.values.name, email: form.values.email, role: form.values.role } }), { invalidate: [`/organisations/${orgId}/members`], success: "Invited. They get an email to choose a password.", onSuccess: onClose })
  return (
    <Drawer title="Add a person" eyebrow="THEY ARE INVITED BY EMAIL" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); add.run() }}>
        <Field label="Full name" error={fieldError(add.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Work email" error={fieldError(add.error, "email")}><input {...form.field("email")} type="email" required /></Field>
        <Field label="Role" error={fieldError(add.error, "role")}><select {...form.field("role")}><option value="manager">Manager: books and manages washes</option><option value="confirmer">Confirmer: checks and confirms washes</option></select></Field>
        <div className="actions"><button className="primary" disabled={add.pending}>Send invitation</button></div>
      </form>
    </Drawer>
  )
}

type BulkResult = { created: { vehicle_id: string; booking: Booking; payment: unknown }[]; failed: { vehicle_id: string; error?: { message?: string }; message?: string }[] }

/** Book many vehicles at once: same service, place and time. Pays by account, subscription credit or card as the account allows. */
export function BulkBook() {
  const { org, base } = usePartner()
  const vehicles = useList<Vehicle>("/vehicles")
  const places = useList<Place>("/locations")
  const services = useItems<Service>("/services")
  const [picked, setPicked] = useState<string[]>([])
  const [serviceId, setServiceId] = useState("")
  const [placeId, setPlaceId] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [credits, setCredits] = useState(false)
  const [adding, setAdding] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const fleet = vehicles.items.filter((v) => v.organisation_id === org.id)
  const service = services.items.find((s) => s.id === (serviceId || services.items[0]?.id))
  const place = places.items.find((p) => p.id === (placeId || places.items[0]?.id))
  const estimate = service ? picked.reduce((n, id) => n + (service.prices[fleet.find((v) => v.id === id)?.type ?? "sedan"] ?? 0), 0) : 0

  const book = useAction(() => api<BulkResult>(`/organisations/${org.id}/bookings/bulk`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey() }, body: { vehicle_ids: picked, service_id: service!.id, location_id: place!.id, starts_at: startsAt, use_subscription: credits } }), {
    invalidate: [`/organisations/${org.id}/bookings`, "/subscriptions"], onSuccess: setResult,
  })

  if (result) {
    return (
      <>
        <PageHeader eyebrow="DONE" title="Fleet booking" description={`${result.created.length} booked${result.failed.length ? `, ${result.failed.length} could not be booked` : ""}.`} />
        <Panel>
          {result.created.map((c) => <div className="kit-item" key={c.booking.id}><div className="grow"><h4><Plate value={c.booking.vehicle_plate} /> {c.booking.service_name}</h4><p>{c.booking.reference}</p></div><Pill status={c.booking.status} /></div>)}
          {result.failed.map((f) => <div className="kit-item" key={f.vehicle_id}><div className="grow"><h4>{fleet.find((v) => v.id === f.vehicle_id)?.plate ?? f.vehicle_id}</h4><p className="kit-danger">{f.error?.message ?? f.message ?? "Could not be booked."}</p></div></div>)}
          <div className="kit-row" style={{ marginTop: 14 }}><Link className="primary" href={`${base}/bookings`}>See the schedule</Link></div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <PageHeader eyebrow="YOUR FLEET" title="Book fleet wash" description="Choose the vehicles, the place and the time. One request books them all." />
      <div className="kit-grid cols-2">
        <Panel title="Which vehicles?" description={`${picked.length} selected`} action={<button className="kit-link" onClick={() => setPicked(picked.length === fleet.length ? [] : fleet.map((v) => v.id))}>{picked.length === fleet.length ? "Clear" : "Select all"}</button>}>
          {fleet.length === 0 ? <Empty icon="car" title="Add vehicles first." action={<Link className="primary" href={`${base}/vehicles`}>Go to vehicles</Link>} /> : (
            <div className="kit-stack">
              {fleet.map((v) => (
                <label key={v.id} className="kit-chip" style={{ borderRadius: 12, padding: 12 }}>
                  <input type="checkbox" checked={picked.includes(v.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, v.id] : picked.filter((x) => x !== v.id))} /> <Plate value={v.plate} /> {v.make} {v.model}
                </label>
              ))}
            </div>
          )}
        </Panel>
        <div className="kit-stack">
          <Panel title="Which care?">
            <select className="kit-input" value={service?.id ?? ""} onChange={(e) => setServiceId(e.target.value)} aria-label="Service">{services.items.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
          </Panel>
          <Panel title="Where?" action={<button className="kit-link" onClick={() => setAdding(true)}>+ Add a place</button>}>
            <select className="kit-input" value={place?.id ?? ""} onChange={(e) => setPlaceId(e.target.value)} aria-label="Place">{places.items.map((p) => <option key={p.id} value={p.id}>{p.label} · {p.address}</option>)}</select>
          </Panel>
        </div>
      </div>
      <Panel title="When?"><SlotPicker state={place?.state ?? "LA"} value={startsAt} onChange={setStartsAt} /></Panel>
      <Panel title="Confirm">
        <label className="kit-field check"><input type="checkbox" checked={credits} onChange={(e) => setCredits(e.target.checked)} /><span>Use the fleet plan&apos;s credits where there are enough</span></label>
        <p className="kit-muted" style={{ margin: "10px 0" }}>{picked.length} vehicle(s){estimate ? ` · about ${naira(estimate)} before your ${org.discount_percent}% organisation discount` : ""}. {org.payment_terms === "monthly_invoice" ? "Billed on your monthly invoice." : "You pay for each booking at checkout."}</p>
        {book.error && <p className="form-error">{book.error.message}</p>}
        <button className="primary" disabled={picked.length === 0 || !service || !place || !startsAt || book.pending} onClick={() => book.run()}>{book.pending ? "Booking…" : `Book ${picked.length || ""} wash${picked.length === 1 ? "" : "es"}`}</button>
      </Panel>
      {adding && <PlaceForm onClose={() => setAdding(false)} onSaved={(p) => setPlaceId(p.id)} />}
    </>
  )
}
