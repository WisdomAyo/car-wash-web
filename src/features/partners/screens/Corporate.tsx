"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Empty, Facts, Loading, Notice, PageHeader, Panel, Pill } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { ConfirmDialog, Drawer } from "@/components/app/overlays"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Booking, Member, Place, Service, Subscription, Vehicle } from "@/lib/api/types"
import { day, humanise, lagosDate, naira, window_ } from "@/lib/format"
import { jobResultLabel, verdictLabel } from "@/lib/labels"
import BookingsTable, { BookingPill } from "@/features/shared/BookingsTable"
import PlaceForm from "@/features/shared/PlaceForm"
import SlotPicker from "@/features/shared/SlotPicker"
import VehicleForm from "@/features/shared/VehicleForm"
import { usePartner } from "../PartnerSpace"
import { CLOSED_STATES, JobDrawer, JobsTable, PortalMetrics, SectionHeading, StatusChip, Toolbar, downloadCsv, jobStatus, useJobFilter, useOrgJobs, type OrgJob } from "../parts"

/** Dates in Lagos, as "YYYY-MM-DD". */
const dayKey = (iso: string) => lagosDate(iso)

export function FleetOverview() {
  const { org, base, manages, firstName } = usePartner()
  const router = useRouter()
  const vehicles = useList<Vehicle>("/vehicles")
  const bookings = useList<Booking>(`/organisations/${org.id}/bookings`)
  const jobs = useOrgJobs(org.id, false)
  const active = useOrgJobs(org.id, true)
  const summary = useResource<{ washes_completed: number; cancelled: number; complaints: number; verdicts: Record<string, number> }>(`/organisations/${org.id}/summary`, { month: lagosDate().slice(0, 7) })
  const subs = useItems<Subscription>("/subscriptions")
  const [open, setOpen] = useState<OrgJob | null>(null)

  const fleet = vehicles.items.filter((v) => v.organisation_id === org.id)
  const plan = subs.items.find((s) => s.organisation_id === org.id && s.status === "active")
  const credit = subs.items.filter((s) => s.organisation_id === org.id && s.status === "active").reduce((n, s) => n + s.washes_remaining, 0)
  const today = lagosDate()
  const upcoming = bookings.items.filter((b) => b.status === "confirmed" && dayKey(b.starts_at) >= today && !["closed", "cancelled"].includes(b.job?.state ?? "")).sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const next = upcoming[0]
  const nextDayCount = next ? upcoming.filter((b) => dayKey(b.starts_at) === dayKey(next.starts_at)).length : 0
  const verdicts = summary.data ? Object.values(summary.data.verdicts).reduce((n, v) => n + v, 0) : 0
  const satisfied = summary.data?.verdicts.satisfied ?? 0
  const careOf = (v: Vehicle): [number, string] => {
    const job = jobs.items.find((j) => j.plate === v.plate)
    if (job?.state === "ready") return [2, "Ready for verdict"]
    const coming = upcoming.find((b) => b.vehicle_plate === v.plate)
    if (coming) return [1, `Scheduled ${day(coming.starts_at)}`]
    if (job && CLOSED_STATES.includes(job.state)) return [0, `Washed ${day(job.starts_at)}`]
    return [1, "Due for care"]
  }

  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title={`A brighter workday, ${firstName}.`} description="Every vehicle. One less worry."
        action={manages ? <Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book fleet wash</Link> : undefined} />
      <PortalMetrics items={[
        { label: "Vehicles in your fleet", value: vehicles.isPending ? "…" : fleet.length, note: vehicles.hasMore ? "At least this many" : "One account. All your care.", icon: "car" },
        { label: "Washes this month", value: summary.data?.washes_completed ?? "…", note: `${summary.data?.cancelled ?? 0} cancelled`, icon: "drop" },
        { label: "Verified completion", value: summary.data ? (verdicts ? `${Math.round((satisfied / verdicts) * 100)}%` : "—") : "…", note: verdicts ? "Confirmed by the right person" : "Proof ready for finance", icon: "shield" },
        { label: "Your plan balance", value: credit, note: "Washes remaining this term", icon: "card" },
      ]} />
      {org.status !== "active" && <Notice tone="warn" icon="alert">This account is {org.status}. Booking is paused until Go-Wash activates it.</Notice>}
      <section className="fleet-hero">
        <div>
          <div className="eyebrow">{org.name.toUpperCase()}{plan ? ` · ${plan.plan.name.toUpperCase()}` : org.plan_months ? ` · ${org.plan_months}-MONTH FLEET PLAN` : ""}</div>
          <h2>Looking sharp.<br />Running smoothly.</h2>
          <p>
            {next ? <>Your next fleet wash is {day(next.starts_at)}.<br />{nextDayCount} vehicle{nextDayCount === 1 ? "" : "s"}{next.location ? `. ${next.location.label}` : ""}. Every job verified.</> : <>Nothing is scheduled yet.<br />Book your first fleet wash and every job is verified.</>}
          </p>
          <button className="primary" onClick={() => router.push(manages && !next ? `${base}/book` : `${base}/bookings`)}>
            {next || !manages ? "View your care calendar" : "Book a fleet wash"} <Icon name="arrow" size={17} />
          </button>
        </div>
        <CarArt silver />
        <span className="fleet-hero-tag"><Icon name="shield" size={17} />Every vehicle has a Wash Passport</span>
      </section>
      <section className="portal-panel">
        <SectionHeading title="Your fleet shine board" action="All vehicles" onAction={() => router.push(`${base}/vehicles`)} />
        {fleet.length === 0 ? <Empty icon="car" title="No fleet vehicles yet.">Register the company&apos;s vehicles to see their care here.</Empty> : (
          <div className="shine-board">
            {fleet.slice(0, 6).map((v) => {
              const [level, label] = careOf(v)
              const job = jobs.items.find((j) => j.plate === v.plate)
              return (
                <button key={v.id} onClick={() => (job ? setOpen(job) : router.push(`${base}/vehicles`))}>
                  <span className={`shine-indicator shine-${level}`} />
                  <Icon name="car" size={27} />
                  <strong>{v.make} {v.model}</strong>
                  <Plate>{v.plate}</Plate>
                  <small>{label}</small>
                </button>
              )
            })}
          </div>
        )}
        <div className="shine-legend">
          <span><i />Recent verified care</span>
          <span><i />Care coming up</span>
          <span><i />Ready for confirmation</span>
        </div>
      </section>
      <section className="portal-panel">
        <SectionHeading title="Active care" action="View all active washes" onAction={() => router.push(`${base}/jobs`)} />
        {active.isPending ? <Loading /> : active.items.length === 0 ? <Empty icon="drop" title="No washes right now.">Washes in progress across the fleet appear here.</Empty> : <JobsTable rows={active.items.slice(0, 3)} onOpen={setOpen} />}
      </section>
      {open && <JobDrawer job={open} onClose={() => setOpen(null)} />}
    </>
  )
}

export function FleetVehicles() {
  const { org, manages } = usePartner()
  const list = useList<Vehicle>("/vehicles")
  const members = useItems<Member>(`/organisations/${org.id}/members`, undefined, { enabled: manages })
  const jobs = useOrgJobs(org.id, false)
  const [editing, setEditing] = useState<Vehicle | "new" | null>(null)
  const [open, setOpen] = useState<OrgJob | null>(null)
  const [query, setQuery] = useState("")
  const fleet = list.items.filter((v) => v.organisation_id === org.id)
  const shown = fleet.filter((v) => `${v.make} ${v.model} ${v.plate} ${v.colour}`.toLowerCase().includes(query.toLowerCase()))
  const confirmer = (v: Vehicle) => members.items.find((m) => m.id === v.confirmer_id)?.name

  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Vehicles" description="Add the company's vehicles. Each plate links every wash to the right car." />
      <div className="section-heading">
        <h3>Your fleet, plate by plate.</h3>
        {manages && <button className="secondary" onClick={() => setEditing("new")}><Icon name="plus" size={16} />Register vehicle</button>}
      </div>
      <section className="portal-panel">
        <Toolbar placeholder="Search your fleet plates or vehicles" query={query} onQuery={setQuery}
          onExport={() => downloadCsv("go-wash-fleet", ["Vehicle", "Plate", "Type", "Colour"], fleet.map((v) => [`${v.make} ${v.model}`, v.plate, v.type, v.colour]))} />
        {list.isPending ? <Loading /> : shown.length === 0 ? <Empty icon="car" title={fleet.length ? "No matching vehicles." : "No fleet vehicles yet."} action={manages && !fleet.length ? <button className="primary" onClick={() => setEditing("new")}>Add the first one</button> : undefined}>{fleet.length ? "Try another plate or name." : "Register the vehicles you want washed."}</Empty> : (
          <div className="table-scroll">
            <table className="portal-table">
              <thead><tr><th>VEHICLE / PLATE</th><th>TYPE & COLOUR</th><th>CONFIRMER</th><th>CARE</th><th /></tr></thead>
              <tbody>
                {shown.map((v) => {
                  const job = jobs.items.find((j) => j.plate === v.plate)
                  return (
                    <tr key={v.id}>
                      <td>
                        <button className="table-vehicle" onClick={() => (job ? setOpen(job) : manages && setEditing(v))}>
                          <span className="table-car-icon"><Icon name="car" size={19} /></span>
                          <span><strong>{v.make} {v.model}</strong><small><Plate>{v.plate}</Plate></small></span>
                        </button>
                      </td>
                      <td><strong>{v.type === "suv" ? "SUV" : humanise(v.type)}</strong><small>{v.colour}</small></td>
                      <td><strong>{confirmer(v) ?? "Any manager"}</strong><small>{confirmer(v) ? "Gives the verdict" : "No named driver"}</small></td>
                      <td>{job ? <StatusChip review={jobStatus(job) === "Needs review"}>{jobStatus(job)}</StatusChip> : <span className="kit-faint">No washes yet</span>}</td>
                      <td>{manages && <button className="table-more" aria-label={`Edit ${v.plate}`} onClick={() => setEditing(v)}><Icon name="chevron" size={17} /></button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <VehicleForm vehicle={editing === "new" ? undefined : editing} organisationId={org.id} onClose={() => setEditing(null)} />}
      {open && <JobDrawer job={open} onClose={() => setOpen(null)} />}
    </>
  )
}

const WEEKDAYS_MON = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const MONTH_NAME = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" })

/** The fleet's care calendar: each day with what is booked on it. */
export function FleetBookings() {
  const { org, base, manages } = usePartner()
  const list = useList<Booking>(`/organisations/${org.id}/bookings`)
  const [month, setMonth] = useState(lagosDate().slice(0, 7))
  const [picked, setPicked] = useState<string | null>(null)

  // Bookings arrive newest first: keep loading while the page still reaches back into this month.
  const { hasMore, loadMore, loadingMore, items } = list
  const oldest = items.at(-1)?.starts_at
  useEffect(() => {
    if (hasMore && !loadingMore && oldest && dayKey(oldest) >= `${month}-01`) loadMore()
  }, [hasMore, loadingMore, oldest, month, loadMore])

  const [y, m] = month.split("-").map(Number)
  const first = new Date(Date.UTC(y, m - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const today = lagosDate()
  const byDay = new Map<string, Booking[]>()
  for (const b of items) {
    if (["cancelled", "expired"].includes(b.status)) continue
    const key = dayKey(b.starts_at)
    byDay.set(key, [...(byDay.get(key) ?? []), b])
  }
  const shift = (n: number) => setMonth(new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7))
  const chosen = picked ? (byDay.get(picked) ?? []) : []

  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Wash schedule" description="All the fleet's bookings, day by day."
        action={manages ? <Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book fleet wash</Link> : undefined} />
      <section className="portal-panel">
        <div className="calendar-heading">
          <div>
            <div className="eyebrow">YOUR FLEET CARE CALENDAR</div>
            <h3>{MONTH_NAME.format(first)}</h3>
          </div>
          <div className="kit-row">
            <button className="secondary" aria-label="Previous month" onClick={() => shift(-1)}>Previous</button>
            <button className="secondary" aria-label="Next month" onClick={() => shift(1)}>Next</button>
            {manages && <Link className="secondary" href={`${base}/book`}>Book a wash <Icon name="plus" size={16} /></Link>}
          </div>
        </div>
        <div className="calendar-weekdays">{WEEKDAYS_MON.map((d) => <span key={d}>{d}</span>)}</div>
        <div className="fleet-calendar">
          {Array.from({ length: Math.ceil((lead + days) / 7) * 7 }, (_, i) => {
            const n = i - lead + 1
            const inMonth = n >= 1 && n <= days
            const key = `${month}-${String(n).padStart(2, "0")}`
            const bookings = inMonth ? (byDay.get(key) ?? []) : []
            const groups = [...bookings.reduce((g, b) => g.set(b.service_name, (g.get(b.service_name) ?? 0) + 1), new Map<string, number>())]
            return (
              <button key={i} className={`${key === today ? "today" : ""} ${picked === key ? "selected" : ""}`} disabled={!inMonth} onClick={() => setPicked(picked === key ? null : key)}>
                <span>{inMonth ? n : ""}</span>
                {groups.slice(0, 2).map(([service, count], gi) => (
                  <small key={service} className={gi ? "calendar-essential" : ""}><i />{count} {service}{count === 1 ? "" : "es"}</small>
                ))}
              </button>
            )
          })}
        </div>
        <p className="policy-note"><Icon name="shield" size={16} />Operations assigns professionals to your schedule. Fleet managers never assign staff.</p>
      </section>
      {picked && (
        <section className="portal-panel">
          <SectionHeading title={`${day(`${picked}T12:00:00+01:00`)}`} />
          {chosen.length === 0 ? <Empty icon="calendar" title="Nothing booked this day." /> : chosen.map((b) => (
            <Link className="history-row" key={b.id} href={`${base}/bookings/${b.id}`}>
              <span className="stat-icon"><Icon name="drop" /></span>
              <div><h4>{b.service_name}</h4><p>{b.vehicle ? `${b.vehicle.make} ${b.vehicle.model} · ` : ""}{window_(b.starts_at, b.ends_at)}</p></div>
              <Plate>{b.vehicle_plate}</Plate>
              <BookingPill booking={b} />
            </Link>
          ))}
        </section>
      )}
      <section className="portal-panel">
        <SectionHeading title="Every booking" />
        <BookingsTable path={`/organisations/${org.id}/bookings`} hrefFor={(b) => `${base}/bookings/${b.id}`} />
      </section>
    </>
  )
}

export function FleetJobs() {
  const { org, base } = usePartner()
  const [onlyActive, setOnlyActive] = useState(true)
  const jobs = useOrgJobs(org.id, onlyActive)
  const f = useJobFilter(jobs.items)
  const [open, setOpen] = useState<OrgJob | null>(null)
  const ready = jobs.items.find((j) => j.state === "ready")
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Active washes" description="Where each wash is, and who is on it. The named driver confirms their own vehicle." />
      <section className="portal-panel">
        <Toolbar placeholder="Search jobs, plates or professionals" query={f.query} onQuery={f.setQuery} filter={f.filter} onFilter={f.setFilter}
          onExport={() => downloadCsv("go-wash-jobs", ["Job", "Vehicle", "Plate", "Service", "Area", "Status"], jobs.items.map((j) => [j.reference, j.vehicle, j.plate, j.service, j.area, jobStatus(j)]))} />
        <label className="kit-chip" style={{ marginBottom: 12 }}><input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} /> Only washes in progress</label>
        {jobs.isPending ? <Loading /> : <JobsTable rows={f.filtered} onOpen={setOpen} onClear={f.clear} />}
        <div className="delegated-reminder">
          <Icon name="shield" size={24} />
          <div>
            <h3>The right person has the final say.</h3>
            <p>Named drivers confirm their own vehicles. You&apos;ll be alerted only if a wash is not pleasing or untreated.</p>
          </div>
          {ready && <Link className="secondary" href={`${base}/confirm/${ready.id}`}>Confirm a ready wash</Link>}
        </div>
      </section>
      {open && <JobDrawer job={open} onClose={() => setOpen(null)} />}
    </>
  )
}

/** Verified care, wash by wash, with the proofs behind each. */
export function WashRecords() {
  const { org } = usePartner()
  const jobs = useOrgJobs(org.id, false)
  const [open, setOpen] = useState<OrgJob | null>(null)
  const done = jobs.items.filter((j) => CLOSED_STATES.includes(j.state))
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Wash records" description="Every closed wash, with the proof behind it." />
      <section className="portal-panel">
        <SectionHeading title="Verified care. Ready for review." action="Export records" onAction={() => downloadCsv("go-wash-records", ["Job", "Vehicle", "Plate", "Service", "Washman", "Verdict", "Result"], done.map((j) => [j.reference, j.vehicle, j.plate, j.service, j.washman, j.verdict, j.result]))} />
        {jobs.isPending ? <Loading /> : done.length === 0 ? <Empty icon="shield" title="No closed washes yet.">Each finished wash is recorded here with its proof.</Empty> : done.map((j) => (
          <div className="history-row" key={j.id}>
            <span className="stat-icon"><Icon name="shield" /></span>
            <div>
              <h4>{j.vehicle ?? j.plate} · {j.service}</h4>
              <p>{day(j.starts_at)} · {j.washman ?? "Go-Wash team"}{j.verdict ? ` · ${verdictLabel(j.verdict)}` : ""}{j.result ? ` · ${jobResultLabel(j.result)}` : ""}</p>
              <Plate>{j.plate}</Plate>
            </div>
            <div className="passport-proofs">
              <span><Icon name="pin" size={13} />GPS</span>
              <span><Icon name="car" size={13} />Plate</span>
              <span><Icon name="check" size={13} />Verdict</span>
            </div>
            <button className="text-button" onClick={() => setOpen(j)}>Evidence pack <Icon name="arrow" size={15} /></button>
          </div>
        ))}
      </section>
      {open && <JobDrawer job={open} onClose={() => setOpen(null)} />}
    </>
  )
}

const ACCESS: Record<string, string> = { owner: "Account & billing", manager: "Book, view & confirm", confirmer: "Verdict only" }
const ROLE_NAME: Record<string, string> = { owner: "Company owner", manager: "Fleet manager", confirmer: "Driver / confirmer" }

export function Team() {
  const { org, role } = usePartner()
  const members = useItems<Member>(`/organisations/${org.id}/members`)
  const vehicles = useList<Vehicle>("/vehicles")
  const [adding, setAdding] = useState(false)
  const [managing, setManaging] = useState<Member | null>(null)
  const [removing, setRemoving] = useState<Member | null>(null)
  const remove = useAction((m: Member) => api(`/organisations/${org.id}/members/${m.id}`, { method: "DELETE" }), { invalidate: [`/organisations/${org.id}/members`], success: "Removed.", onSuccess: () => { setRemoving(null); setManaging(null) } })
  const assigned = (m: Member) => {
    if (m.role !== "confirmer") return "All company vehicles"
    const cars = vehicles.items.filter((v) => v.confirmer_id === m.id)
    return cars.length ? cars.map((v) => `${v.make} ${v.model} · ${v.plate}`).join(", ") : "No vehicle assigned"
  }
  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Team & confirmers" description="Managers book and manage washes. Confirmers check a finished wash and give the verdict." />
      <section className="portal-panel">
        <SectionHeading title="The people behind your fleet." action="Invite team member" onAction={() => setAdding(true)} />
        {members.isPending ? <Loading /> : (
          <div className="table-scroll">
            <table className="portal-table">
              <thead><tr><th>NAME</th><th>ROLE</th><th>ASSIGNED VEHICLE</th><th>ACCESS</th><th /></tr></thead>
              <tbody>
                {members.items.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong><small>{org.name}</small></td>
                    <td>{ROLE_NAME[m.role] ?? humanise(m.role)}</td>
                    <td>{assigned(m)}</td>
                    <td><span className="portal-status">{ACCESS[m.role] ?? humanise(m.role)}</span></td>
                    <td><button className="text-button" onClick={() => setManaging(m)}>Manage <Icon name="chevron" size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {adding && <AddMember orgId={org.id} onClose={() => setAdding(false)} />}
      {managing && (
        <Drawer title={`Access for ${managing.name}`} eyebrow="YOUR GO-WASH WORKSPACE" onClose={() => setManaging(null)}>
          <div className="policy-locked">
            <Icon name="shield" size={27} />
            <span>{managing.role === "confirmer" ? "Confirmer access is limited to verdicts for named vehicles. They cannot book, pay or see invoices." : managing.role === "owner" ? "The owner has the whole account: bookings, people, plan and billing." : "Managers book and manage washes and see the account's records."}</span>
          </div>
          <Facts items={[["Email", managing.email], ["Phone", managing.phone], ["Role", ROLE_NAME[managing.role] ?? humanise(managing.role)], ["Vehicles", assigned(managing)]]} />
          {managing.role !== "owner" && role === "owner" && <button className="secondary full kit-danger" onClick={() => setRemoving(managing)}>Remove from the organisation</button>}
          <button className="secondary full" onClick={() => setManaging(null)}>Back to workspace</button>
        </Drawer>
      )}
      {removing && <ConfirmDialog title="Remove this person?" description={`${removing.name} will lose access to the organisation.`} confirmLabel="Remove" danger pending={remove.pending} onConfirm={() => remove.run(removing)} onClose={() => setRemoving(null)} />}
    </>
  )
}

function AddMember({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const form = useForm({ name: "", email: "", role: "manager" })
  const add = useAction(() => api(`/organisations/${orgId}/members`, { method: "POST", body: { name: form.values.name, email: form.values.email, role: form.values.role } }), { invalidate: [`/organisations/${orgId}/members`], success: "Invited. They get an email to choose a password.", onSuccess: onClose })
  return (
    <Drawer title="The right people. The right access." eyebrow="THEY ARE INVITED BY EMAIL" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); add.run() }}>
        <Field label="Full name" error={fieldError(add.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Work email" error={fieldError(add.error, "email")}><input {...form.field("email")} type="email" required /></Field>
        <Field label="Access role" error={fieldError(add.error, "role")}><select {...form.field("role")}><option value="manager">Fleet manager: books and manages washes</option><option value="confirmer">Confirmer: checks and confirms washes</option></select></Field>
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
          {result.created.map((c) => <div className="kit-item" key={c.booking.id}><div className="grow"><h4><Plate>{c.booking.vehicle_plate}</Plate> {c.booking.service_name}</h4><p>{c.booking.reference}</p></div><Pill status={c.booking.status} /></div>)}
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
                  <input type="checkbox" checked={picked.includes(v.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, v.id] : picked.filter((x) => x !== v.id))} /> <Plate>{v.plate}</Plate> {v.make} {v.model}
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
