"use client"

import Link from "next/link"
import { useMemo, useState, type ReactNode } from "react"
import { Async, Empty } from "@/components/app/kit"
import { Drawer } from "@/components/app/overlays"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import type { IconName } from "@/components/Visuals"
import { useItems, useResource } from "@/lib/api/hooks"
import type { Tracking } from "@/lib/api/types"
import { day, humanise, stamp, time, window_ } from "@/lib/format"
import { usePartner } from "./PartnerSpace"

/** A company's job as its tables show it: which car, what care, where and when, and who is on it. */
export type OrgJob = {
  id: string
  state: string
  booking_id: string
  reference: string
  service: string
  starts_at: string
  ends_at: string
  plate: string
  vehicle: string | null
  area: string | null
  washman: string | null
  verdict: string | null
  result: string | null
}

/** How a job's state reads to a company. */
export const JOB_STATUS: Record<string, string> = {
  booked: "Booked",
  assigned: "Assigned",
  accepted: "On the way",
  clocked_in: "Washing",
  ready: "Ready",
  verdict_given: "Verdict given",
  submitted: "Finishing up",
  closed: "Verified",
  disputed: "Needs review",
  unconfirmed: "Closed",
  cancelled: "Cancelled",
}

export const STATUS_FILTERS = ["All statuses", "Booked", "On the way", "Washing", "Ready", "Needs review", "Verified"]

export const jobStatus = (job: Pick<OrgJob, "state" | "result">) => (job.result === "closed_complaint_open" ? "Needs review" : (JOB_STATUS[job.state] ?? humanise(job.state)))

export const CLOSED_STATES = ["closed", "unconfirmed"]

/** The company's jobs. `active` limits it to washes in progress. */
export const useOrgJobs = (orgId: string, active: boolean) => useItems<OrgJob>(`/organisations/${orgId}/jobs`, active ? { active: 1 } : undefined, { refetchInterval: 30_000 })

/* ------------------------------------------------------------------ small pieces */

export const StatusChip = ({ children, review }: { children: ReactNode; review?: boolean }) => (
  <span className={`portal-status ${review ? "review" : ""}`}>
    <i />
    {children}
  </span>
)

/** Four figures at the top of a page. */
export function PortalMetrics({ items }: { items: { label: string; value: ReactNode; note: string; icon: IconName }[] }) {
  return (
    <div className="portal-metrics">
      {items.map((m, i) => (
        <article key={m.label}>
          <div>
            <span>{m.label}</span>
            <Icon name={m.icon} size={19} />
          </div>
          <h3>
            {m.value}
            <small>{i === 0 ? "TODAY" : "LIVE VIEW"}</small>
          </h3>
          <p>{m.note}</p>
        </article>
      ))}
    </div>
  )
}

export const SectionHeading = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div className="section-heading">
    <h3>{title}</h3>
    {action && (
      <button className="text-button" onClick={onAction}>
        {action}
        <Icon name="arrow" size={15} />
      </button>
    )}
  </div>
)

/** The search box, status filter and export button above a portal table. */
export function Toolbar({ placeholder, query, onQuery, filter, onFilter, onExport }: { placeholder: string; query: string; onQuery: (v: string) => void; filter?: string; onFilter?: (v: string) => void; onExport?: () => void }) {
  return (
    <div className="portal-toolbar">
      <div className="search-field">
        <Icon name="car" size={17} />
        <input aria-label={placeholder} value={query} onChange={(e) => onQuery(e.target.value)} placeholder={placeholder} />
      </div>
      {onFilter && (
        <select aria-label="Filter jobs" value={filter} onChange={(e) => onFilter(e.target.value)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
      {onExport && (
        <button className="secondary" onClick={onExport}>
          Export CSV <Icon name="arrow" size={15} />
        </button>
      )}
    </div>
  )
}

/** Downloads rows as a CSV file. */
export function downloadCsv(name: string, header: string[], rows: (string | number | null)[][]) {
  const cell = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`
  const content = [header, ...rows].map((r) => r.map(cell).join(",")).join("\n")
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }))
  const a = document.createElement("a")
  a.href = url
  a.download = `${name}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/** Free-text search over a list of jobs, and the status filter. */
export function useJobFilter(jobs: OrgJob[]) {
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All statuses")
  const filtered = useMemo(
    () => jobs.filter((j) => `${j.reference} ${j.vehicle} ${j.plate} ${j.washman} ${j.area}`.toLowerCase().includes(query.toLowerCase()) && (filter === "All statuses" || jobStatus(j) === filter)),
    [jobs, query, filter],
  )
  const clear = () => {
    setQuery("")
    setFilter("All statuses")
  }
  return { query, setQuery, filter, setFilter, filtered, clear }
}

/* ------------------------------------------------------------------ the jobs table */

export function JobsTable({ rows, onOpen, onClear }: { rows: OrgJob[]; onOpen: (job: OrgJob) => void; onClear?: () => void }) {
  return (
    <div className="table-scroll">
      <table className="portal-table">
        <thead>
          <tr>
            <th>VEHICLE / JOB</th>
            <th>SERVICE & LOCATION</th>
            <th>PROFESSIONAL</th>
            <th>STATUS</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((j) => (
            <tr key={j.id}>
              <td>
                <button className="table-vehicle" onClick={() => onOpen(j)}>
                  <span className="table-car-icon">
                    <Icon name="car" size={19} />
                  </span>
                  <span>
                    <strong>{j.vehicle ?? j.plate}</strong>
                    <small>
                      <Plate>{j.plate}</Plate>
                      <b>{j.reference}</b>
                    </small>
                  </span>
                </button>
              </td>
              <td>
                <strong>{j.service}</strong>
                <small>
                  {j.area ? `${j.area} · ` : ""}
                  {day(j.starts_at)}, {time(j.starts_at)}
                </small>
              </td>
              <td>
                <strong>{j.washman ?? "Unassigned"}</strong>
                <small>{j.washman ? "Screened professional" : "Dispatch required"}</small>
              </td>
              <td>
                <StatusChip review={jobStatus(j) === "Needs review"}>{jobStatus(j)}</StatusChip>
              </td>
              <td>
                <button className="table-more" aria-label={`View ${j.reference}`} onClick={() => onOpen(j)}>
                  <Icon name="chevron" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="empty-state">
          <Icon name="car" size={30} />
          <h3>No matching jobs.</h3>
          <p>Try another plate, name or status.</p>
          {onClear && (
            <button className="secondary" onClick={onClear}>
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ the job drawer */

const TIMELINE = ["Booking paid & confirmed", "Professional assigned", "Accepted · GPS tracking starts", "Arrival · Geofence & plate match", "Wash ready · Customer verdict", "Final plate scan & clock-out"]

/** One wash, step by step, with the evidence it has so far. */
export function JobDrawer({ job, onClose }: { job: OrgJob; onClose: () => void }) {
  const { base } = usePartner()
  const tracking = useResource<Tracking>(`/bookings/${job.booking_id}/tracking`)
  return (
    <Drawer title={job.service} eyebrow="YOUR GO-WASH WORKSPACE" onClose={onClose}>
      <div className="drawer-job-header">
        <CarArt />
        <h3>{job.vehicle ?? job.plate}</h3>
        <Plate>{job.plate}</Plate>
        <p>
          {job.reference} · {job.area ?? "Your approved spot"} · {day(job.starts_at)}, {window_(job.starts_at, job.ends_at)}
        </p>
        <StatusChip review={jobStatus(job) === "Needs review"}>{jobStatus(job)}</StatusChip>
      </div>
      <Async query={tracking}>
        {(t) => {
          const reached = [true, t.stages[0]?.reached_at, t.stages[1]?.reached_at, t.stages[2]?.reached_at, t.stages[4]?.reached_at, ["submitted", "closed", "unconfirmed"].includes(job.state)]
          const stamps = [null, t.stages[0]?.reached_at, t.stages[1]?.reached_at, t.stages[2]?.reached_at, t.stages[4]?.reached_at, null]
          const photos = t.photos ?? { before: [], after: [] }
          const evidence: [string, IconName, string][] = [
            ["GPS trail", "pin", t.stages[2]?.reached_at ? "Arrival verified at the place" : "Awaiting arrival"],
            ["Arrival plate scan", "car", t.stages[2]?.reached_at ? `${job.plate} · Matched` : "Awaiting arrival"],
            ["Before & after", "shield", photos.before.length + photos.after.length ? `${photos.before.length} before · ${photos.after.length} after` : "Not yet taken"],
            ["Customer verdict", "shield", job.verdict ? humanise(job.verdict) : "Awaiting the confirmer"],
            ["Final plate scan", "car", ["submitted", "closed", "unconfirmed"].includes(job.state) ? "Matched" : "Locked until verdict"],
            ["Payment", "card", t.booking.billing === "invoice" ? "On the monthly invoice" : t.booking.billing === "subscription" ? "Plan credit used" : `${t.booking.status === "pending_payment" ? "Awaiting payment" : "Paid"}`],
          ]
          return (
            <>
              <h3>Every step, accounted for.</h3>
              <div className="job-event-timeline">
                {TIMELINE.map((text, i) => (
                  <div key={text}>
                    <span className={reached[i] ? "event-complete" : ""}>{reached[i] ? <Icon name="check" size={12} /> : i + 1}</span>
                    <p>
                      {text}
                      <small>{i === 0 ? `Slot ${stamp(t.booking.starts_at)}` : reached[i] && stamps[i] ? `Recorded ${stamp(stamps[i])}` : "Awaiting next step"}</small>
                    </p>
                  </div>
                ))}
              </div>
              {job.state === "ready" && (
                <Link className="primary full link-btn" href={`${base}/confirm/${job.id}`}>
                  Give the verdict <Icon name="arrow" size={17} />
                </Link>
              )}
              <h3 className="drawer-subheading">Evidence pack</h3>
              <div className="evidence-grid">
                {evidence.map(([name, icon, text]) => (
                  <div key={name}>
                    <span>
                      <Icon name={icon} size={18} />
                    </span>
                    <strong>{name}</strong>
                    <small>{text}</small>
                  </div>
                ))}
              </div>
              {photos.before.length + photos.after.length > 0 && (
                <div className="kit-row" style={{ marginTop: 12, flexWrap: "wrap" }}>
                  {[...photos.before, ...photos.after].map((url, i) => (
                    <a key={url} className="kit-link" href={url} target="_blank" rel="noreferrer">
                      Photo {i + 1}
                    </a>
                  ))}
                </div>
              )}
              <p className="policy-note">
                <Icon name="shield" size={15} /> Photos are private links that expire. Open the booking for the full record.
              </p>
              <Link className="secondary full link-btn" href={`${base}/bookings/${job.booking_id}`}>
                Open the booking
              </Link>
            </>
          )
        }}
      </Async>
    </Drawer>
  )
}

/** A friendly empty state for a list with nothing in it. */
export const NothingHere = ({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) => (
  <Empty icon={icon} title={title}>
    {children}
  </Empty>
)
