"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, Empty, Facts, Metrics, Notice, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Field } from "@/components/app/forms"
import { Modal } from "@/components/app/overlays"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useRaw, useResource } from "@/lib/api/hooks"
import type { AdminJob, Booking } from "@/lib/api/types"
import { day, humanise, lagosDay, naira, stamp, time } from "@/lib/format"
import { AdminList, ReasonButton } from "../parts"
import { base, useAdmin } from "../AdminSpace"

const JOB_STATES = ["booked", "assigned", "accepted", "clocked_in", "ready", "verdict_given", "submitted", "closed", "disputed", "unconfirmed", "cancelled"]

const Proofs = ({ job }: { job: AdminJob }) =>
  job.proofs ? (
    <span className="kit-row" style={{ gap: 5 }}>
      {(["gps", "plate", "verdict"] as const).map((k) => <span key={k} className={`kit-pill tone-${job.proofs![k] ? "ok" : "bad"}`}>{k === "gps" ? "Place" : humanise(k)}</span>)}
    </span>
  ) : <span className="kit-faint">—</span>

const jobColumns = [
  { header: "Booking", cell: (j: AdminJob) => <Two top={j.booking.service_name} bottom={j.booking.reference} /> },
  { header: "Vehicle", cell: (j: AdminJob) => <Plate value={j.booking.vehicle_plate} /> },
  { header: "When", cell: (j: AdminJob) => <Two top={day(j.booking.starts_at)} bottom={time(j.booking.starts_at)} /> },
  { header: "Washman", cell: (j: AdminJob) => j.washman ? <Two top={j.washman.name} bottom={j.washman.staff_code} /> : <span className="kit-faint">Unassigned</span> },
  { header: "State", cell: (j: AdminJob) => <span className="kit-row" style={{ gap: 6 }}><Pill status={j.state} />{j.flagged && <Pill status="flagged" />}</span> },
  { header: "Proofs", cell: (j: AdminJob) => <Proofs job={j} /> },
]

export function Overview() {
  const dash = useResource<{ jobs_by_state: Record<string, number>; exceptions_open: number; tickets_open: number }>("/admin/dashboard")
  const { can } = useAdmin()
  const performance = useResource<{ jobs_closed: number; fully_proven: number; control_rate: number; satisfied_rate: number }>(can("reports.view") ? "/admin/reports/performance" : null)
  return (
    <>
      <PageHeader eyebrow="GO-WASH OPERATIONS" title="Overview" description="What needs you now." />
      <Async query={dash}>
        {(d) => {
          const by = d.jobs_by_state
          const active = ["assigned", "accepted", "clocked_in", "ready", "verdict_given", "submitted"].reduce((n, k) => n + (by[k] ?? 0), 0)
          return (
            <>
              <Metrics items={[
                { label: "Waiting for a washman", value: by.booked ?? 0, note: "Assign them in Jobs", icon: "clock" },
                { label: "In progress", value: active, icon: "drop" },
                { label: "Exceptions open", value: d.exceptions_open, note: "Disputes, flags, release requests", icon: "alert" },
                { label: "Tickets open", value: d.tickets_open, icon: "help" },
              ]} />
              <Panel title="Jobs by state">
                <div className="kit-chips">
                  {Object.entries(by).map(([state, n]) => <Link key={state} className="kit-chip" href={`${base}/jobs?state=${state}`}>{humanise(state)} · <b>{n}</b></Link>)}
                </div>
              </Panel>
            </>
          )
        }}
      </Async>
      {performance.data && (
        <Panel title="Last 30 days" description="How verified the washes were.">
          <Metrics items={[
            { label: "Jobs closed", value: performance.data.jobs_closed },
            { label: "Fully proven", value: performance.data.fully_proven, note: "Place, plate and customer all confirmed" },
            { label: "Control rate", value: `${Math.round(performance.data.control_rate * 100)}%` },
            { label: "Satisfied", value: `${Math.round(performance.data.satisfied_rate * 100)}%` },
          ]} />
        </Panel>
      )}
    </>
  )
}

export function Exceptions() {
  return (
    <AdminList<AdminJob>
      eyebrow="NEEDS A HUMAN" title="Exceptions" description="Disputes, flagged jobs, release requests and unconfirmed hand-overs."
      path="/admin/exceptions" refetchInterval={30_000} rowKey={(j) => j.id} href={(j) => `${base}/jobs/${j.id}`}
      columns={[...jobColumns.slice(0, 5), { header: "Why", cell: (j) => (j.flags.length ? j.flags.map(humanise).join(", ") : j.release_requested_at ? "Release requested" : humanise(j.state)) }]}
      empty={<Empty icon="check" title="Nothing needs a decision.">Everything is moving as it should.</Empty>}
    />
  )
}

export function JobsList({ initialState }: { initialState?: string }) {
  return (
    <AdminList<AdminJob>
      eyebrow="DISPATCH" title="Jobs" description="Every wash, from booked to closed."
      path="/admin/jobs" refetchInterval={30_000} rowKey={(j) => j.id} href={(j) => `${base}/jobs/${j.id}`} columns={jobColumns}
      filters={[
        { param: "state", label: "Any state", initial: initialState, options: JOB_STATES.map((s) => ({ value: s, label: humanise(s) })) },
        { param: "flagged", label: "All jobs", options: [{ value: "1", label: "Flagged only" }] },
      ]}
    />
  )
}

type Pack = {
  job: AdminJob
  customer: { id: string; name: string }
  location: { label: string; address: string; area: string; state_name: string; lat: number; lng: number; geofence_radius_m: number }
  vehicle: { plate: string; make: string; model: string; colour: string }
  events: { type: string; from: string | null; to: string | null; actor_role: string | null; server_time: string; lat: number | null; lng: number | null; meta: Record<string, unknown> | null }[]
  route: { lat: number; lng: number; recorded_at: string; is_mock: boolean }[]
  evidence: { id: string; kind: string; url: string; purged_at: string | null; plate_read: string | null; plate_matched: boolean | null; read_source: string | null; lat: number | null; lng: number | null }[]
  verdict: { outcome: string; reasons: string[]; remark: string | null; confirmer_name: string; channel: string; given_at: string } | null
  tickets: { id: string; type: string; status: string; body: string }[]
  review: { rating: number; comment: string | null } | null
}

/** The evidence pack for one job: the proofs, the timeline, the photos and every decision a dispatcher can make on it. */
export function JobDetail({ id }: { id: string }) {
  const pack = useResource<Pack>(`/admin/jobs/${id}`)
  const { can } = useAdmin()
  const [assigning, setAssigning] = useState(false)
  const inv = [`/admin/jobs/${id}`, "/admin/jobs", "/admin/exceptions"]

  return (
    <Async query={pack}>
      {(p) => {
        const j = p.job
        return (
          <>
            <PageHeader eyebrow={`JOB ${j.booking.reference}`} title={j.booking.service_name} description={`${day(j.booking.starts_at)} · ${time(j.booking.starts_at)} · ${p.vehicle.plate}`} action={<Link className="secondary" href={`${base}/jobs`}>All jobs</Link>} />
            {j.flags.length > 0 && <Notice tone="warn" icon="alert"><b>Flags:</b> {j.flags.map(humanise).join(", ")}</Notice>}
            <div className="kit-grid side">
              <div className="kit-stack">
                <Panel title="Decisions" action={<span className="kit-row"><Pill status={j.state} />{j.result && <Pill status="info" label={humanise(j.result)} tone="info" />}</span>}>
                  {!can("jobs.assign") && !can("jobs.release") && !can("exceptions.decide") && <p className="kit-muted">You can read everything about this job. Decisions on it belong to dispatch.</p>}
                  <div className="kit-row">
                    {can("jobs.assign") && ["booked", "assigned"].includes(j.state) && <button className="primary" onClick={() => setAssigning(true)}>{j.washman ? "Reassign" : "Assign a washman"}</button>}
                    {can("jobs.release") && ["ready", "unconfirmed"].includes(j.state) && <ReasonButton label="Release the job" path={`/admin/jobs/${id}/release`} invalidate={inv} success="Job released." description="Closes the job without the customer's answer, when they cannot be reached. Needs a reason." />}
                    {can("jobs.release") && !["closed", "cancelled", "booked"].includes(j.state) && <ReasonButton label="Close on the evidence" path={`/admin/jobs/${id}/override`} invalidate={inv} success="Job closed." description="Closes the job from the evidence available (for example a lost phone)." />}
                    {can("exceptions.decide") && j.state === "disputed" && <ResolveDispute id={id} invalidate={inv} />}
                    {can("exceptions.decide") && !["closed", "cancelled"].includes(j.state) && <ReasonButton label="Cancel the job" path={`/admin/jobs/${id}/cancel`} invalidate={inv} success="Job cancelled." danger description="Cancels the booking. The customer is refunded (less any cancellation fee you set)." />}
                    {can("exceptions.decide") && j.flagged && <ReasonButton label="Clear the flags" path={`/admin/jobs/${id}/clear-flags`} invalidate={inv} success="Flags cleared." description="Record why the flags are not a concern." />}
                  </div>
                </Panel>
                <Panel title="Timeline">
                  <div className="kit-timeline">
                    {p.events.map((e, i) => (
                      <div key={i} className="done"><i /><span><strong>{humanise(e.type)}{e.to && e.from !== e.to && humanise(e.to).toLowerCase() !== humanise(e.type).toLowerCase() ? ` → ${humanise(e.to)}` : ""}</strong><small>{stamp(e.server_time)} · {e.actor_role ?? "system"}{e.lat != null ? ` · ${e.lat.toFixed(5)}, ${e.lng?.toFixed(5)}` : ""}</small></span></div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Photos and plate readings">
                  {p.evidence.length === 0 ? <p className="kit-muted">No evidence yet.</p> : (
                    <div className="kit-grid cols-3" style={{ marginBottom: 0 }}>
                      {p.evidence.map((e) => (
                        <div key={e.id}>
                          {e.purged_at ? <p className="kit-faint">Photo removed after retention.</p> : (
                            <a href={e.url} target="_blank" rel="noreferrer">
                              {/* Signed, expiring URL: next/image cannot optimise it. */}
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={e.url} alt={e.kind} style={{ width: "100%", borderRadius: 8, border: "1px solid var(--kit-border)" }} />
                            </a>
                          )}
                          <p className="kit-faint" style={{ marginTop: 6 }}>{humanise(e.kind)}{e.plate_read ? ` · read ${e.plate_read}` : ""}{e.plate_matched === false ? " · MISMATCH" : ""}{e.read_source ? ` · ${humanise(e.read_source)}` : ""}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </Panel>
              </div>
              <div className="kit-stack">
                <Panel title="The job">
                  <Facts items={[
                    ["Customer", p.customer.name],
                    ["Washman", j.washman ? <Link key="w" className="kit-link" href={`${base}/staff/${j.washman.id}`}>{j.washman.name} · {j.washman.staff_code}</Link> : "Unassigned"],
                    ["Vehicle", `${p.vehicle.colour} ${p.vehicle.make} ${p.vehicle.model} · ${p.vehicle.plate}`],
                    ["Place", `${p.location.label} · ${p.location.address}, ${p.location.area}`],
                    ["Geofence", `${p.location.geofence_radius_m} m`],
                    ["Route points", p.route.length],
                  ]} />
                </Panel>
                <Panel title="Customer's verdict">
                  {p.verdict ? (
                    <Facts items={[["Answer", humanise(p.verdict.outcome)], ["Reasons", p.verdict.reasons.map(humanise).join(", ")], ["Remark", p.verdict.remark], ["Given by", `${p.verdict.confirmer_name} (${humanise(p.verdict.channel)})`], ["At", stamp(p.verdict.given_at)]]} />
                  ) : <p className="kit-muted">Not given yet.</p>}
                  {p.review && <p className="kit-muted" style={{ marginTop: 12 }}>Rating: {p.review.rating}/5{p.review.comment ? ` · “${p.review.comment}”` : ""}</p>}
                </Panel>
                {p.tickets.length > 0 && (
                  <Panel title="Tickets on this job">
                    {p.tickets.map((t) => <div key={t.id} className="kit-item"><div className="grow"><h4><Link className="kit-link" href={`${base}/tickets/${t.id}`}>{humanise(t.type)}</Link></h4><p>{t.body.slice(0, 120)}</p></div><Pill status={t.status} /></div>)}
                  </Panel>
                )}
              </div>
            </div>
            {assigning && <AssignDialog jobId={id} onClose={() => setAssigning(false)} />}
          </>
        )
      }}
    </Async>
  )
}

type Suggestion = { washman_id: string; name: string; staff_code: string; distance_m: number | null; same_site_today: boolean; jobs_today: number; rating: number | null }

function AssignDialog({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const suggestions = useItems<Suggestion>(`/admin/jobs/${jobId}/suggestions`)
  const assign = useAction((washmanId: string) => api(`/admin/jobs/${jobId}/assign`, { method: "POST", body: { washman_id: washmanId } }), {
    invalidate: [`/admin/jobs/${jobId}`, "/admin/jobs", "/admin/planning"], success: "Assigned.", onSuccess: onClose,
  })
  return (
    <Modal title="Assign a washman" eyebrow="BEST MATCHES FIRST" onClose={onClose}>
      <p>Washmen on shift, qualified and free in this slot, ranked by distance, same-site work, load and rating.</p>
      {suggestions.isPending ? <p className="kit-muted">Looking…</p> : suggestions.items.length === 0 ? <Empty icon="users" title="No one is available." >Nobody on shift can take this slot.</Empty> : (
        <div className="kit-list">
          {suggestions.items.map((s) => (
            <div className="kit-item" key={s.washman_id}>
              <div className="grow"><h4>{s.name} <span className="kit-faint">{s.staff_code}</span></h4><p>{s.distance_m != null ? `${(s.distance_m / 1000).toFixed(1)} km away · ` : ""}{s.jobs_today} jobs today{s.same_site_today ? " · already on this site today" : ""}{s.rating ? ` · rated ${s.rating}` : ""}</p></div>
              <button className="primary kit-btn-small" disabled={assign.pending} onClick={() => assign.run(s.washman_id)}>Assign</button>
            </div>
          ))}
        </div>
      )}
      {assign.error && <p className="form-error">{assign.error.message}</p>}
    </Modal>
  )
}

function ResolveDispute({ id, invalidate }: { id: string; invalidate: string[] }) {
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState("uphold")
  const [reason, setReason] = useState("")
  const [rewash, setRewash] = useState("")
  const run = useAction(() => api(`/admin/jobs/${id}/resolve-dispute`, { method: "POST", body: { decision, reason, rewash_starts_at: decision === "rewash" ? new Date(rewash).toISOString() : undefined } }), {
    invalidate, success: "Dispute decided.", onSuccess: () => setOpen(false),
  })
  return (
    <>
      <button className="primary" onClick={() => setOpen(true)}>Decide the dispute</button>
      {open && (
        <Modal title="Decide the dispute" onClose={() => setOpen(false)}>
          <form className="kit-form" onSubmit={(e) => { e.preventDefault(); run.run() }}>
            <Field label="Decision">
              <select value={decision} onChange={(e) => setDecision(e.target.value)}>
                <option value="uphold">Uphold: the wash was done</option><option value="rewash">Order a re-wash</option><option value="refund">Refund the customer</option>
              </select>
            </Field>
            {decision === "rewash" && <Field label="Re-wash time" error={fieldError(run.error, "rewash_starts_at")}><input type="datetime-local" required value={rewash} onChange={(e) => setRewash(e.target.value)} /></Field>}
            <Field label="Reason" error={fieldError(run.error, "reason")} hint="Written to the audit log."><textarea required minLength={3} value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
            <div className="actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={run.pending}>Decide</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function Planning() {
  const [date, setDate] = useState(() => lagosDay(1))
  const list = useList<Booking>("/admin/planning", { date })
  return (
    <>
      <PageHeader eyebrow="PLAN THE DAY" title="Planning" description="Bookings for one day, and which still need a washman." />
      <Panel>
        <div className="kit-toolbar"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="kit-input" style={{ width: 200 }} aria-label="Day" /></div>
        {list.isPending ? null : list.items.length === 0 ? <Empty icon="calendar" title="No bookings that day." /> : (
          <Table rows={list.items} rowKey={(b) => b.id} href={(b) => (b.job ? `${base}/jobs/${b.job.id}` : `${base}/planning`)} columns={[
            { header: "Slot", cell: (b) => <Two top={time(b.starts_at)} bottom={b.location?.area} /> },
            { header: "Booking", cell: (b) => <Two top={b.service_name} bottom={b.reference} /> },
            { header: "Vehicle", cell: (b) => <Plate value={b.vehicle_plate} /> },
            { header: "Job", cell: (b) => (b.job ? <Pill status={b.job.state} /> : <span className="kit-faint">—</span>) },
            { header: "Total", className: "right", cell: (b) => naira(b.amount_kobo) },
          ]} />
        )}
        {list.hasMore && <div className="kit-more"><button className="secondary" onClick={() => list.loadMore()}>Show more</button></div>}
      </Panel>
    </>
  )
}

type Live = { job_id: string; state: string; flagged: boolean; washman: { id: string; name: string; lat: number | null; lng: number | null; at: string | null } | null; site: { lat: number; lng: number; plate: string } }

export function LiveMap() {
  const live = useItems<Live>("/admin/live-map", undefined, { refetchInterval: 15_000 })
  return (
    <>
      <PageHeader eyebrow="IN THE FIELD" title="Live map" description="Washmen on active jobs and where they last reported. Refreshes every 15 seconds." />
      <Panel>
        {live.isPending ? null : live.items.length === 0 ? <Empty icon="map" title="Nobody is out right now." /> : (
          <Table rows={live.items} rowKey={(l) => l.job_id} href={(l) => `${base}/jobs/${l.job_id}`} columns={[
            { header: "Washman", cell: (l) => <Two top={l.washman?.name ?? "Unassigned"} bottom={l.washman?.at ? `Last seen ${stamp(l.washman.at)}` : "No position yet"} /> },
            { header: "Job", cell: (l) => <span className="kit-row"><Plate value={l.site.plate} /><Pill status={l.state} /></span> },
            { header: "Washman is at", cell: (l) => (l.washman?.lat != null ? <a className="kit-link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${l.washman.lat},${l.washman.lng}`}>{l.washman.lat.toFixed(5)}, {l.washman.lng?.toFixed(5)}</a> : "—") },
            { header: "Customer's place", cell: (l) => <a className="kit-link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps?q=${l.site.lat},${l.site.lng}`}>Open map</a> },
          ]} />
        )}
      </Panel>
    </>
  )
}

type Run = { estate: { id: string; name: string }; starts_at: string; jobs: { job_id: string; plate: string; state: string; washman: string | null }[] }

export function EstateRuns() {
  const [date, setDate] = useState(() => lagosDay(1))
  const runs = useRaw<{ data: Run[] }>("/admin/estate-runs", { date })
  return (
    <>
      <PageHeader eyebrow="BATCH THE WORK" title="Estate runs" description="Each estate's wash window on a day, with its cars, so one team can take them together." />
      <Panel>
        <div className="kit-toolbar"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="kit-input" style={{ width: 200 }} aria-label="Day" /></div>
        {runs.isPending ? null : runs.data?.data.length === 0 ? <Empty icon="building" title="No estate washes that day." /> : (
          <div className="kit-stack">
            {runs.data?.data.map((r) => (
              <div key={`${r.estate.id}${r.starts_at}`} className="portal-panel" style={{ marginBottom: 0 }}>
                <h4 className="kit-panel-title">{r.estate.name} · {time(r.starts_at)}</h4>
                <Table rows={r.jobs} rowKey={(j) => j.job_id} href={(j) => `${base}/jobs/${j.job_id}`} columns={[
                  { header: "Plate", cell: (j) => <Plate value={j.plate} /> }, { header: "State", cell: (j) => <Pill status={j.state} /> }, { header: "Washman", cell: (j) => j.washman ?? "Unassigned" },
                ]} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  )
}

