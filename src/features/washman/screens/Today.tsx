"use client"

import Link from "next/link"
import { Async, Empty, Metrics, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { api } from "@/lib/api/client"
import { useAction, useItems, useResource } from "@/lib/api/hooks"
import type { StaffJob, StaffProfile, StaffSummary } from "@/lib/api/types"
import { humanise, lagosDate, time } from "@/lib/format"
import { base } from "../WashmanSpace"

const ACTIVE = ["assigned", "accepted", "clocked_in", "ready", "verdict_given"]

export function StateText(state: string) {
  return (
    { booked: "Waiting", assigned: "New: accept it", accepted: "On the way", clocked_in: "Washing", ready: "Waiting for the customer", verdict_given: "Hand over now", submitted: "Done", closed: "Closed", disputed: "Under review", cancelled: "Cancelled" } as Record<string, string>
  )[state] ?? humanise(state)
}

/** The washman's day: shift controls, today's numbers, and the jobs in order. */
export default function Today() {
  const profile = useResource<StaffProfile>("/staff/me")
  const summary = useResource<StaffSummary>("/staff/summary", { date: lagosDate() }, { refetchInterval: 30_000 })
  const jobs = useItems<StaffJob>("/staff/jobs", undefined, { refetchInterval: 30_000 })

  const shift = useAction((on: boolean) => api(`/staff/shift/${on ? "start" : "end"}`, { method: "POST" }), {
    invalidate: ["/staff/me"],
    success: "Shift updated.",
  })
  const available = useAction((value: boolean) => api("/staff/availability", { method: "POST", body: { available: value } }), { invalidate: ["/staff/me"], success: "Saved." })

  const p = profile.data
  const active = jobs.items.filter((j) => ACTIVE.includes(j.state))

  return (
    <>
      <PageHeader
        eyebrow="THE GO-WASH FIELD TEAM"
        title={p ? `Good day, ${p.name.split(" ")[0]}.` : "Good day."}
        description="Accept your jobs, prove each wash, and hand over cleanly."
        action={
          p ? (
            p.shift.on_shift ? (
              <button className="secondary" onClick={() => shift.run(false)} disabled={shift.pending}>End my shift</button>
            ) : (
              <button className="primary" onClick={() => shift.run(true)} disabled={shift.pending || !p.screening_verified}>Start my shift</button>
            )
          ) : undefined
        }
      />
      {p && !p.shift.on_shift && <p className="kit-muted" style={{ marginBottom: 16 }}>Start your shift to be given jobs.</p>}
      {p?.shift.on_shift && (
        <Panel>
          <div className="kit-row spread">
            <div>
              <div className="kit-strong">You are on shift</div>
              <p className="kit-muted">{p.shift.available ? "Dispatch can assign you jobs." : "You are paused: dispatch will not assign you new jobs."}</p>
            </div>
            <button className="secondary" onClick={() => available.run(!p.shift.available)} disabled={available.pending}>
              {p.shift.available ? "Pause new jobs" : "Take new jobs"}
            </button>
          </div>
        </Panel>
      )}
      <Async query={summary}>
        {(s) => (
          <Metrics items={[
            { label: "Jobs today", value: s.total, icon: "calendar" },
            { label: "Still to do", value: s.upcoming + s.in_progress, note: s.next_job ? `Next: ${s.next_job.service} · ${time(s.next_job.starts_at)}` : "Nothing waiting", icon: "clock" },
            { label: "Completed", value: s.completed, icon: "check" },
            { label: "Your rating", value: p?.rating ? p.rating.average.toFixed(1) : "—", note: p?.rating ? `${p.rating.count} ratings` : "No ratings yet", icon: "star" },
          ]} />
        )}
      </Async>
      <Panel title="Your jobs" action={<Link className="kit-link" href={`${base}/jobs`}>All jobs</Link>}>
        <Async query={jobs} empty={<Empty icon="drop" title="No jobs right now.">New jobs from dispatch appear here and in your notifications.</Empty>} isEmpty={() => jobs.items.length === 0}>
          {() => (
            <Table rows={active.length ? active : jobs.items} rowKey={(j) => j.id} href={(j) => `${base}/jobs/${j.id}`} columns={[
              { header: "Job", cell: (j) => <Two top={j.service} bottom={j.reference} /> },
              { header: "Slot", cell: (j) => <Two top={time(j.slot.starts_at)} bottom={j.area} /> },
              { header: "Status", cell: (j) => <Pill status={j.state} label={StateText(j.state)} /> },
            ]} />
          )}
        </Async>
      </Panel>
    </>
  )
}
