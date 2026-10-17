"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, Empty, Loading, Notice, PageHeader, Pill } from "@/components/app/kit"
import { Drawer } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { EstateInfo, EstateWindow, Service, Ticket, WindowRequest } from "@/lib/api/types"
import { day, humanise, initials, lagosDay, relative, time } from "@/lib/format"
import WindowsEditor, { describeWindows } from "@/features/shared/WindowsEditor"
import CopyButton from "@/features/shared/CopyButton"
import { usePartner } from "../PartnerSpace"
import { PortalMetrics, SectionHeading, StatusChip, downloadCsv } from "../parts"

type OnSite = { job_id: string; staff: { name: string; staff_code: string } | null; service: string; slot_starts_at: string; progress: string }

const DONE = ["submitted", "closed", "unconfirmed"]

/** "09:00" -> "9:00 – 11:00 AM": a window is one two-hour slot. */
const windowRange = (start: string) => {
  const [h, m] = start.split(":").map(Number)
  const at = (hour: number) => `${((hour + 11) % 12) + 1}:${String(m).padStart(2, "0")}`
  const suffix = (hour: number) => (hour >= 12 && hour < 24 ? "PM" : "AM")
  return suffix(h) === suffix(h + 2) ? `${at(h)} – ${at(h + 2)} ${suffix(h + 2)}` : `${at(h)} ${suffix(h)} – ${at(h + 2)} ${suffix(h + 2)}`
}

/** The next wash window from today: its date and hours. */
const nextWindow = (windows: EstateWindow[]) => {
  for (let offset = 0; offset < 8; offset++) {
    const date = lagosDay(offset)
    const weekday = new Date(`${date}T12:00:00+01:00`).getUTCDay()
    const match = windows.filter((w) => w.weekday === weekday).sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
    if (match) return { date, starts_at: match.starts_at }
  }
  return null
}

/** The professionals working the estate today, with how far along each is. */
function useCrew(rows: OnSite[]) {
  const crew = new Map<string, { name: string; code: string; total: number; done: number }>()
  for (const r of rows) {
    if (!r.staff) continue
    const entry = crew.get(r.staff.staff_code) ?? { name: r.staff.name, code: r.staff.staff_code, total: 0, done: 0 }
    entry.total += 1
    if (DONE.includes(r.progress)) entry.done += 1
    crew.set(r.staff.staff_code, entry)
  }
  return [...crew.values()]
}

function TeamCards({ crew, onOpen }: { crew: ReturnType<typeof useCrew>; onOpen: (name: string) => void }) {
  if (crew.length === 0) return <Empty icon="users" title="No one is washing right now.">Named, screened professionals appear here on wash days.</Empty>
  return (
    <div className="team-grid">
      {crew.map((s) => (
        <article className="team-card" key={s.code}>
          <div className="team-top">
            <div className="team-avatar">{initials(s.name)}</div>
            <span className="portal-status">{s.done === s.total ? "Finished" : "On site"}</span>
          </div>
          <h3>{s.name}</h3>
          <p>{s.code} · Screened professional</p>
          <div className="team-stats">
            <span><Icon name="shield" size={14} />Verified</span>
            <span>{s.total} washes today</span>
          </div>
          <div className="screening-progress"><span style={{ width: `${(s.done / s.total) * 100}%` }} /></div>
          <small>{s.done} / {s.total} washes complete</small>
          <button className="secondary full" onClick={() => onOpen(s.name)}>View site assignment <Icon name="arrow" size={15} /></button>
        </article>
      ))}
    </div>
  )
}

function SiteDrawer({ name, rows, onClose }: { name: string; rows: OnSite[]; onClose: () => void }) {
  const mine = rows.filter((r) => r.staff?.name === name)
  return (
    <Drawer title={name} eyebrow="YOUR GO-WASH WORKSPACE" onClose={onClose}>
      <div className="policy-locked">
        <Icon name="shield" size={27} />
        <span>Named professional · Screened · Approved estate run. {mine.length} assigned wash{mine.length === 1 ? "" : "es"} today. Resident names, plates and prices are not shown.</span>
      </div>
      {mine.map((r) => (
        <div className="history-row" key={r.job_id}>
          <Icon name="car" />
          <div><h4>{r.service}</h4><p>{time(r.slot_starts_at)} slot</p></div>
          <StatusChip>{humanise(r.progress)}</StatusChip>
        </div>
      ))}
      <button className="secondary full" onClick={onClose}>Back to workspace</button>
    </Drawer>
  )
}

export function EstateOverview() {
  const { org, base, firstName } = usePartner()
  const router = useRouter()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  const onSite = useItems<OnSite>(`/organisations/${org.id}/on-site`, undefined, { refetchInterval: 30_000 })
  const tickets = useList<Ticket>("/tickets")
  const [site, setSite] = useState<string | null>(null)
  const crew = useCrew(onSite.items)
  const done = onSite.items.filter((r) => DONE.includes(r.progress)).length
  const open = tickets.items.filter((t) => !["closed", "resolved"].includes(t.status)).length

  return (
    <>
      <PageHeader eyebrow="YOUR COMMUNITY. OUR RESPONSIBILITY." title={`Good morning, ${firstName}.`} description="Washes happen on the days you agreed, outdoors, with every washman verified." />
      <Async query={estate}>
        {(e) => {
          const next = nextWindow(e.windows)
          const spot = e.locations[0]
          return (
            <>
              <PortalMetrics items={[
                { label: "Today's estate washes", value: onSite.isPending ? "…" : onSite.items.length, note: `${done} verified · ${onSite.items.length - done} in progress`, icon: "car" },
                { label: "Professionals on site", value: onSite.isPending ? "…" : String(crew.length).padStart(2, "0"), note: "Named, screened & assigned", icon: "shield" },
                { label: "Next wash window", value: next ? day(`${next.date}T12:00:00+01:00`) : "—", note: next ? windowRange(next.starts_at) : "No windows set yet", icon: "clock" },
                { label: "Open incidents", value: String(open).padStart(2, "0"), note: "A calm, accountable community", icon: "pin" },
              ]} />
              {e.pending_request && <Notice tone="warn" icon="clock">A change to your wash days is waiting for Go-Wash to review.</Notice>}
              <section className="estate-hero">
                <div>
                  <div className="eyebrow">{org.name.toUpperCase()} · WASH MORNINGS</div>
                  <h2>A fresher way to<br />start the neighbourhood.</h2>
                  <p>
                    {next ? <>Next window: {day(`${next.date}T12:00:00+01:00`)} · {windowRange(next.starts_at)}</> : <>Wash windows are agreed with Go-Wash.</>}
                    <br />
                    {spot ? <>Approved location: {spot.label}.</> : <>Approved locations are added with you.</>}
                  </p>
                  <button className="primary" onClick={() => router.push(`${base}/access`)}>Share your estate booking link <Icon name="arrow" size={17} /></button>
                </div>
                <div className="estate-window-art">
                  <Icon name="pin" size={72} />
                  <span className="estate-art-ring" />
                  <span className="estate-art-label">{org.name.toUpperCase()}<small>APPROVED OUTDOOR CARE</small></span>
                </div>
              </section>
            </>
          )
        }}
      </Async>
      <section className="portal-panel">
        <SectionHeading title="Know who's inside. And why." action="View on-site team" onAction={() => router.push(`${base}/on-site`)} />
        {onSite.isPending ? <Loading /> : <TeamCards crew={crew} onOpen={setSite} />}
      </section>
      <section className="portal-panel">
        <SectionHeading title="Today's estate run" />
        <div className="estate-run-progress">
          <div>
            <strong>{done} <span>/ {onSite.items.length} completed</span></strong>
            <small>Every completed job has all three proofs.</small>
          </div>
          <div className="estate-progress-track"><span style={{ width: `${onSite.items.length ? (done / onSite.items.length) * 100 : 0}%` }} /></div>
          <span className="portal-status">{onSite.items.length ? "Today's window" : "No run today"}</span>
        </div>
      </section>
      {site && <SiteDrawer name={site} rows={onSite.items} onClose={() => setSite(null)} />}
    </>
  )
}

export function OnSiteScreen() {
  const { org } = usePartner()
  const onSite = useItems<OnSite>(`/organisations/${org.id}/on-site`, undefined, { refetchInterval: 15_000 })
  const [site, setSite] = useState<string | null>(null)
  const crew = useCrew(onSite.items)
  return (
    <>
      <PageHeader eyebrow="FOR SECURITY AND THE ESTATE OFFICE" title="On-site team" description="Who is washing in the estate right now. Refreshes every 15 seconds." />
      <div className="live-banner"><span className="live-dot" /> Approved staff on site today<span>{day(new Date())} · Estate run</span></div>
      {onSite.isPending ? <Loading /> : <TeamCards crew={crew} onOpen={setSite} />}
      <section className="portal-panel">
        <SectionHeading title="Estate jobs, without resident private data" />
        {crew.map((s) => (
          <div className="history-row" key={s.code}>
            <Icon name="car" />
            <div><h4>{s.name} · {s.total} assigned wash{s.total === 1 ? "" : "es"}</h4><p>{s.done} complete, {s.total - s.done} in progress</p></div>
            <span className="portal-status">{s.done === s.total ? "Finished" : "On site"}</span>
          </div>
        ))}
        <p className="policy-note"><Icon name="shield" size={15} />Resident payment details and individual vehicle histories are not available to estate managers.</p>
      </section>
      {site && <SiteDrawer name={site} rows={onSite.items} onClose={() => setSite(null)} />}
    </>
  )
}

export function Windows() {
  const { org, manages } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  const requests = useItems<WindowRequest>(`/organisations/${org.id}/window-requests`)
  const [editing, setEditing] = useState(false)
  const [guidelines, setGuidelines] = useState(false)
  return (
    <>
      <PageHeader eyebrow="YOUR COMMUNITY. OUR RESPONSIBILITY." title="Wash windows" description="The days and times residents can book. To change them, send Go-Wash a request." />
      <Async query={estate}>
        {(e) => {
          const spot = e.locations[0]
          const starts = [...new Set(e.windows.map((w) => w.starts_at))].sort()
          return (
            <div className="settings-grid">
              <section className="portal-panel">
                <div className="eyebrow">YOUR AGREED SCHEDULE</div>
                <h3>{describeWindows(e.windows)}</h3>
                <div className="window-time">
                  <Icon name="clock" size={28} />
                  <span>{starts.length ? starts.map(windowRange).join(" · ") : "No windows yet"}<small>Wash window · each booking is a two-hour slot</small></span>
                </div>
                <p className="panel-description">All resident bookings are grouped into one estate run. Operations assigns and approves the team.</p>
                {e.pending_request && <Notice tone="warn" icon="clock">A change is waiting for Go-Wash to review.</Notice>}
                {manages && !e.pending_request && <button className="secondary full" onClick={() => setEditing(true)}>Request a window change <Icon name="arrow" size={16} /></button>}
              </section>
              <section className="portal-panel">
                <div className="eyebrow">APPROVED OUTDOOR LOCATIONS</div>
                <h3>{spot?.label ?? "None yet"}</h3>
                <div className="location-diagram">
                  <Icon name="pin" size={38} />
                  <span>{spot ? `${org.name} · ${spot.area}` : org.name}</span>
                  <small>{spot ? `Outdoor zone · Geofence radius ${spot.geofence_radius_m}m` : "Go-Wash adds the car parks and frontages with you."}</small>
                </div>
                <p className="panel-description">{spot?.address ?? "Approved spots appear here."} No washing in private indoor garages or shared pedestrian paths.</p>
                <button className="secondary full" onClick={() => setGuidelines(true)}>View access guidelines <Icon name="arrow" size={16} /></button>
              </section>
            </div>
          )
        }}
      </Async>
      <section className="portal-panel">
        <SectionHeading title="Your requests" />
        {requests.items.length === 0 ? <p className="kit-muted">No requests yet.</p> : requests.items.map((r) => (
          <div className="history-row" key={r.id}>
            <Icon name="clock" />
            <div><h4>{describeWindows(r.windows)}</h4><p>{r.note ?? "No reason given"}{r.decision_note ? ` · Answer: ${r.decision_note}` : ""} · {relative(r.created_at)}</p></div>
            <Pill status={r.status} />
          </div>
        ))}
      </section>
      {editing && estate.data && <RequestChange orgId={org.id} current={estate.data.windows} onClose={() => setEditing(false)} />}
      {guidelines && (
        <Drawer title="Care that respects your community." eyebrow="YOUR GO-WASH WORKSPACE" onClose={() => setGuidelines(false)}>
          <div className="policy-locked">
            <Icon name="shield" size={27} />
            <span>Washmen show their verified Trust Card. They work only in the approved outdoor spots, keep pedestrian access clear, and never enter private indoor garages. Report safety concerns to operations.</span>
          </div>
          <button className="secondary full" onClick={() => setGuidelines(false)}>Back to workspace</button>
        </Drawer>
      )}
    </>
  )
}

function RequestChange({ orgId, current, onClose }: { orgId: string; current: EstateWindow[]; onClose: () => void }) {
  const [windows, setWindows] = useState<EstateWindow[]>(current)
  const [note, setNote] = useState("")
  const send = useAction(() => api(`/organisations/${orgId}/window-requests`, { method: "POST", body: { windows, note: note.trim() || undefined } }), {
    invalidate: [`/organisations/${orgId}/estate`, `/organisations/${orgId}/window-requests`], success: "Sent. Go-Wash will review it.", onSuccess: onClose,
  })
  return (
    <Drawer title="Better mornings, by agreement." eyebrow="OPERATIONS AGREES BEFORE IT CHANGES" onClose={onClose}>
      <p>Estate schedule changes require operations agreement before becoming active. Tick every window you want washes in. This is the whole schedule, not just the changes.</p>
      <WindowsEditor value={windows} onChange={setWindows} />
      <form onSubmit={(e) => { e.preventDefault(); send.run() }} style={{ marginTop: 16 }}>
        <label>
          Reason for change (optional)
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
          {fieldError(send.error, "note") && <small className="form-error">{fieldError(send.error, "note")}</small>}
        </label>
        {send.error && send.error.code !== "validation_failed" && <p className="form-error">{send.error.message}</p>}
        <button className="primary full" disabled={send.pending}>Send the request <Icon name="arrow" size={17} /></button>
      </form>
    </Drawer>
  )
}

export function Spots() {
  const { org } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  return (
    <>
      <PageHeader eyebrow="WHERE WE WASH" title="Approved spots" description="Residents can only book at these outdoor spots. Go-Wash adds new ones with you." />
      <section className="portal-panel">
        <Async query={estate}>
          {(e) => e.locations.length === 0 ? <Empty icon="pin" title="No approved spots yet.">Ask Go-Wash to add the car parks and frontages you want used.</Empty> : (
            <div className="table-scroll">
              <table className="portal-table">
                <thead><tr><th>SPOT</th><th>AREA</th><th>ARRIVAL RADIUS</th></tr></thead>
                <tbody>
                  {e.locations.map((l) => (
                    <tr key={l.id}>
                      <td><span className="table-vehicle"><span className="table-car-icon"><Icon name="pin" size={19} /></span><span><strong>{l.label}</strong><small>{l.address}</small></span></span></td>
                      <td>{l.area}</td>
                      <td>{l.geofence_radius_m} m</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Async>
      </section>
    </>
  )
}

export function Access() {
  const { org } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  const link = useResource<{ code: string; url: string }>(`/organisations/${org.id}/booking-link`)
  const services = useItems<Service>("/services")
  const windows = estate.data ? describeWindows(estate.data.windows) : ""
  const priceRows = services.items.map((s) => [s.name, ...(["sedan", "suv"] as const).map((t) => Math.round(((s.prices[t] ?? 0) * (100 - org.discount_percent)) / 100 / 100))])
  return (
    <>
      <PageHeader eyebrow="YOUR COMMUNITY. OUR RESPONSIBILITY." title="Resident access" description="Residents join with this code, then book washes at the estate's spots and days." />
      <Async query={link}>
        {(l) => (
          <section className="resident-access-panel portal-panel">
            <div className="eyebrow">BRING THE SHINE TO YOUR COMMUNITY</div>
            <h2>One link. A fresher estate.</h2>
            <p>Residents book into your approved wash windows and pay for their own care at estate pricing.</p>
            <div className="resident-link-box">
              <Icon name="pin" size={30} />
              <div>
                <strong>{org.name}</strong>
                <small>Join code {l.code} · <a className="kit-link" href={l.url}>{l.url}</a></small>
              </div>
              <CopyButton text={l.url} label="Copy the link" />
            </div>
            <div className="announcement-pack">
              <h3>Your resident announcement pack</h3>
              <p>Share the next window, approved locations and resident prices.</p>
              <div className="announcement-message">
                Good morning, {org.name}! Go-Wash will be at the approved outdoor car park {windows ? `on ${windows}` : "on wash days"}. Book your vehicle&apos;s care in advance with {l.url}. Screened staff. Every wash verified. Outdoor service only.
              </div>
              <CopyButton text={`Go-Wash at ${org.name}${windows ? `: ${windows}` : ""}. Approved outdoor car park. Book ahead at ${l.url}. Every wash verified.`} label="Copy announcement" />
              <button className="secondary" onClick={() => downloadCsv(`${org.name.toLowerCase().replace(/\W+/g, "-")}-price-list`, ["Service", "Sedan price (NGN)", "SUV price (NGN)"], priceRows)}>
                Download price list <Icon name="arrow" size={16} />
              </button>
              <button className="secondary" onClick={() => window.print()}>Print this page</button>
            </div>
            <p className="policy-note"><Icon name="shield" size={16} />Put the link on the estate notice board, in the residents&apos; group, or on a QR code. {priceRows.length ? `Prices in the list include your ${org.discount_percent}% estate discount.` : ""}</p>
          </section>
        )}
      </Async>
    </>
  )
}

