"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, Empty, Metrics, Notice, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Field } from "@/components/app/forms"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import type { EstateInfo, WindowRequest, EstateWindow } from "@/lib/api/types"
import { relative, time } from "@/lib/format"
import WindowsEditor, { describeWindows } from "@/features/shared/WindowsEditor"
import { CopyButton } from "@/features/customer/screens/Money"
import { usePartner } from "../PartnerSpace"

type OnSite = { job_id: string; staff: { name: string; staff_code: string }; service: string; slot_starts_at: string; progress: string; plate?: string }

export function EstateOverview() {
  const { org, base } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  const onSite = useItems<OnSite>(`/organisations/${org.id}/on-site`, undefined, { refetchInterval: 30_000 })
  return (
    <>
      <PageHeader eyebrow="YOUR COMMUNITY. OUR RESPONSIBILITY." title={org.name} description="Washes happen on the days you agreed, outdoors, with every washman verified." />
      <Async query={estate}>
        {(e) => (
          <>
            <Metrics items={[
              { label: "Wash windows a week", value: e.windows.length, note: describeWindows(e.windows), icon: "clock" },
              { label: "Approved spots", value: e.locations.length, icon: "pin" },
              { label: "On site right now", value: onSite.items.length, icon: "users" },
              { label: "Resident discount", value: `${e.discount_percent}%`, icon: "gift" },
            ]} />
            {e.pending_request && <Notice tone="warn" icon="clock">A change to your wash days is waiting for Go-Wash to review. <Link className="kit-link" href={`${base}/windows`}>See it</Link></Notice>}
          </>
        )}
      </Async>
      <Panel title="On site now" action={<Link className="kit-link" href={`${base}/on-site`}>Details</Link>}>
        <OnSiteTable rows={onSite.items} loading={onSite.isPending} />
      </Panel>
    </>
  )
}

function OnSiteTable({ rows, loading }: { rows: OnSite[]; loading: boolean }) {
  if (loading) return null
  if (rows.length === 0) return <Empty icon="users" title="No one is washing right now." />
  return <Table rows={rows} rowKey={(r) => r.job_id} columns={[
    { header: "Washman", cell: (r) => <Two top={r.staff.name} bottom={r.staff.staff_code} /> },
    { header: "Service", cell: (r) => r.service },
    { header: "Slot", cell: (r) => time(r.slot_starts_at) },
    { header: "Progress", cell: (r) => <Pill status={r.progress} /> },
    { header: "Plate", cell: (r) => (r.plate ? <Plate value={r.plate} /> : "—") },
  ]} />
}

export function OnSiteScreen() {
  const { org } = usePartner()
  const onSite = useItems<OnSite>(`/organisations/${org.id}/on-site`, undefined, { refetchInterval: 15_000 })
  return (
    <>
      <PageHeader eyebrow="FOR SECURITY AND THE ESTATE OFFICE" title="On-site team" description="Who is washing in the estate right now. Refreshes every 15 seconds." />
      <Panel><OnSiteTable rows={onSite.items} loading={onSite.isPending} /></Panel>
    </>
  )
}

export function Windows() {
  const { org, manages } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  const requests = useItems<WindowRequest>(`/organisations/${org.id}/window-requests`)
  const [editing, setEditing] = useState(false)
  return (
    <>
      <PageHeader eyebrow="WHEN WE WASH" title="Wash windows" description="The days and times residents can book. To change them, send Go-Wash a request." action={manages && !estate.data?.pending_request ? <button className="primary" onClick={() => setEditing(true)}>Request a change</button> : undefined} />
      <Async query={estate}>
        {(e) => (
          <>
            <Panel title="Current schedule"><p>{describeWindows(e.windows)}</p></Panel>
            {editing && <RequestChange orgId={org.id} current={e.windows} onClose={() => setEditing(false)} />}
          </>
        )}
      </Async>
      <Panel title="Your requests">
        {requests.items.length === 0 ? <p className="kit-muted">No requests yet.</p> : (
          <Table rows={requests.items} rowKey={(r) => r.id} columns={[
            { header: "Asked for", cell: (r) => <Two top={describeWindows(r.windows)} bottom={r.note} /> },
            { header: "Status", cell: (r) => <Pill status={r.status} /> },
            { header: "Answer", cell: (r) => r.decision_note ?? "—" },
            { header: "Sent", cell: (r) => relative(r.created_at) },
          ]} />
        )}
      </Panel>
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
    <Panel title="Choose the schedule you want" description="Tick every window you want washes in. This is the whole schedule, not just the changes.">
      <WindowsEditor value={windows} onChange={setWindows} />
      <div className="kit-form" style={{ marginTop: 16 }}>
        <Field label="Why? (optional)" error={fieldError(send.error, "note")}><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        {send.error && send.error.code !== "validation_failed" && <p className="form-error">{send.error.message}</p>}
        <div className="actions"><button className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={send.pending} onClick={() => send.run()}>Send the request</button></div>
      </div>
    </Panel>
  )
}

export function Spots() {
  const { org } = usePartner()
  const estate = useResource<EstateInfo>(`/organisations/${org.id}/estate`)
  return (
    <>
      <PageHeader eyebrow="WHERE WE WASH" title="Approved spots" description="Residents can only book at these outdoor spots. Go-Wash adds new ones with you." />
      <Panel>
        <Async query={estate}>
          {(e) => e.locations.length === 0 ? <Empty icon="pin" title="No approved spots yet.">Ask Go-Wash to add the car parks and frontages you want used.</Empty> : (
            <Table rows={e.locations} rowKey={(l) => l.id} columns={[{ header: "Spot", cell: (l) => <Two top={l.label} bottom={l.address} /> }, { header: "Area", cell: (l) => l.area }, { header: "Arrival radius", cell: (l) => `${l.geofence_radius_m} m` }]} />
          )}
        </Async>
      </Panel>
    </>
  )
}

export function Access() {
  const { org } = usePartner()
  const link = useResource<{ code: string; url: string }>(`/organisations/${org.id}/booking-link`)
  return (
    <>
      <PageHeader eyebrow="INVITE YOUR RESIDENTS" title="Resident access" description="Residents join with this code, then book washes at the estate's spots and days." />
      <Async query={link}>
        {(l) => (
          <Panel title="The estate link">
            <div className="kit-stack">
              <div><div className="kit-faint">Join code</div><span className="kit-mono" style={{ fontSize: 26, letterSpacing: 4, fontWeight: 700 }}>{l.code}</span></div>
              <div><div className="kit-faint">Link to share or print</div><a className="kit-link" href={l.url}>{l.url}</a></div>
              <div className="kit-row"><CopyButton text={l.url} label="Copy the link" /><button className="secondary" onClick={() => window.print()}>Print this page</button></div>
              <p className="kit-hint">Put the link on the estate notice board, in the residents&apos; group, or on a QR code. Residents who open it see the estate&apos;s name and wash days before they join.</p>
            </div>
          </Panel>
        )}
      </Async>
    </>
  )
}

