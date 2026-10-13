"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, AsyncList, Empty, Facts, Notice, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Field } from "@/components/app/forms"
import { Modal, ReasonDialog } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api, ApiError } from "@/lib/api/client"
import { useAction, useList, useResource } from "@/lib/api/hooks"
import type { StaffJob } from "@/lib/api/types"
import { day, time } from "@/lib/format"
import { base } from "../WashmanSpace"
import { commandId, readPosition, useTrail, type Fix } from "../geo"
import { StateText } from "./Today"

export function JobsList() {
  const list = useList<StaffJob>("/staff/jobs", undefined, { refetchInterval: 30_000 })
  return (
    <>
      <PageHeader eyebrow="YOUR WORK" title="My jobs" description="Soonest first." />
      <Panel>
        <AsyncList list={list} empty={<Empty icon="drop" title="No jobs assigned.">When dispatch gives you a job it appears here.</Empty>}>
          {(items) => (
            <Table rows={items} rowKey={(j) => j.id} href={(j) => `${base}/jobs/${j.id}`} columns={[
              { header: "Job", cell: (j) => <Two top={j.service} bottom={j.reference} /> },
              { header: "When", cell: (j) => <Two top={day(j.slot.starts_at)} bottom={time(j.slot.starts_at)} /> },
              { header: "Area", cell: (j) => j.area },
              { header: "Status", cell: (j) => <Pill status={j.state} label={StateText(j.state)} /> },
            ]} />
          )}
        </AsyncList>
      </Panel>
    </>
  )
}

const INCIDENTS = [
  ["customer_absent", "The customer is not there"],
  ["access_denied", "I cannot get in or park"],
  ["unsafe_site", "The place is unsafe"],
  ["vehicle_not_present", "The car is not here"],
  ["weather", "Weather stops the wash"],
  ["indoor_request", "I was asked to wash indoors"],
] as const

type Step = "accept" | "decline" | "clockin" | "photo" | "submit" | "incident" | null

/** One job, step by step. What the washman can do depends on the job's state; the server enforces the same rules. */
export function JobDetail({ id }: { id: string }) {
  const job = useResource<StaffJob>(`/staff/jobs/${id}`, undefined, { refetchInterval: 15_000 })
  const [step, setStep] = useState<Step>(null)
  const j = job.data
  const trail = useTrail(id, Boolean(j && ["accepted", "clocked_in", "ready", "verdict_given"].includes(j.state)))

  return (
    <>
      <PageHeader eyebrow={j ? `JOB ${j.reference}` : "JOB"} title={j?.service ?? "Job"} description={j ? `${day(j.slot.starts_at)} · ${time(j.slot.starts_at)} – ${time(j.slot.ends_at)} · ${j.area}` : undefined}
        action={<Link className="secondary" href={`${base}/jobs`}>All jobs</Link>} />
      <Async query={job}>
        {(j) => (
          <>
            {j.frozen && <Notice tone="bad" icon="alert">This job is frozen while the team reviews the customer&apos;s answer. Do not do anything on it.</Notice>}
            <div className="kit-grid side">
              <div className="kit-stack">
                <Panel title="What to do now" action={<Pill status={j.state} label={StateText(j.state)} />}>
                  <Actions job={j} onStep={setStep} onChanged={() => job.refetch()} />
                  {trail > 0 && <p className="kit-faint" style={{ marginTop: 10 }}>{trail} location points sent for this job.</p>}
                </Panel>
                <Panel title="The rule on this job"><p className="kit-muted">{j.conduct_rule}</p></Panel>
              </div>
              <Panel title="The job">
                <Facts items={[
                  ["Vehicle", j.vehicle ? <>{j.plate && <Plate value={j.plate} />} {j.vehicle.colour} {j.vehicle.make} {j.vehicle.model}</> : "Shown once you accept"],
                  ["Place", j.location ? `${j.location.address}${j.location.notes ? ` · ${j.location.notes}` : ""}` : `${j.area} (exact place shown once you accept)`],
                  ["Slot", `${time(j.slot.starts_at)} – ${time(j.slot.ends_at)}`],
                  ...(j.job_code ? ([["Job code", <b key="c" className="kit-mono" style={{ fontSize: 18 }}>{j.job_code}</b>]] as [string, React.ReactNode][]) : []),
                ]} />
                {j.location && (
                  <p style={{ marginTop: 14 }}>
                    <a className="kit-link" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${j.location.lat},${j.location.lng}`}>
                      <Icon name="map" size={14} /> Open directions
                    </a>
                  </p>
                )}
              </Panel>
            </div>
            {step === "accept" && <AcceptDialog job={j} onClose={() => setStep(null)} />}
            {step === "decline" && <DeclineDialog job={j} onClose={() => setStep(null)} />}
            {step === "clockin" && <ScanDialog job={j} kind="clock-in" title="Arrive and check in" text="Photograph the number plate. We check the plate, and that you are at the customer's pin." onClose={() => setStep(null)} />}
            {step === "submit" && <ScanDialog job={j} kind="submit" title="Hand over" text="Photograph the number plate again at departure. This closes the job." onClose={() => setStep(null)} />}
            {step === "photo" && <PhotoDialog job={j} onClose={() => setStep(null)} />}
            {step === "incident" && <IncidentDialog job={j} onClose={() => setStep(null)} />}
          </>
        )}
      </Async>
    </>
  )
}

function Actions({ job, onStep, onChanged }: { job: StaffJob; onStep: (s: Step) => void; onChanged: () => void }) {
  const ready = useAction(() => api(`/staff/jobs/${job.id}/ready`, { method: "POST", body: { command_id: commandId("ready") } }), {
    invalidate: ["/staff/jobs"], success: "Marked ready. The customer has been asked to check.", onSuccess: onChanged,
  })
  const release = useAction(() => api(`/staff/jobs/${job.id}/release-request`, { method: "POST" }), { invalidate: ["/staff/jobs"], success: "Asked dispatch to release the job.", onSuccess: onChanged })
  const s = job.state

  return (
    <div className="kit-stack">
      {s === "assigned" && (
        <>
          <p className="kit-muted">A new job. Accept it to see the plate and the exact place, or decline with a reason.</p>
          <div className="kit-row"><button className="primary" onClick={() => onStep("accept")}>Accept the job</button><button className="secondary" onClick={() => onStep("decline")}>Decline</button></div>
        </>
      )}
      {s === "accepted" && (
        <>
          <p className="kit-muted">Go to the place. When you arrive, check in: we match your plate photo and your location to the booking.</p>
          <div><button className="primary" onClick={() => onStep("clockin")}><Icon name="pin" size={16} /> I have arrived</button></div>
        </>
      )}
      {s === "clocked_in" && (
        <>
          <p className="kit-muted">Take a <b>before</b> photo, wash, then take an <b>after</b> photo. Then mark the wash ready.</p>
          <div className="kit-row"><button className="secondary" onClick={() => onStep("photo")}><Icon name="upload" size={15} /> Add a photo</button><button className="primary" onClick={() => ready.run()} disabled={ready.pending}>{ready.pending ? "Working…" : "Wash is ready"}</button></div>
          {ready.error && <p className="form-error">{ready.error.message}</p>}
        </>
      )}
      {s === "ready" && (
        <>
          <p className="kit-muted">Waiting for the customer to check the car and confirm. You cannot hand over until they do.</p>
          {job.release_available_at && <p className="kit-faint">If they stay silent you can ask dispatch to release the job from {time(job.release_available_at)}.</p>}
          {job.release_requested ? <Pill status="pending" label="Release requested" /> : job.release_available_at && new Date(job.release_available_at) <= new Date() && (
            <div><button className="secondary" onClick={() => release.run()} disabled={release.pending}>Ask dispatch to release this job</button></div>
          )}
        </>
      )}
      {(s === "verdict_given" || job.can_submit) && s !== "closed" && s !== "submitted" && (
        <>
          <p className="kit-muted">The customer has answered. Hand the job over to finish.</p>
          <div><button className="primary" onClick={() => onStep("submit")}>Hand over</button></div>
        </>
      )}
      {["submitted", "closed"].includes(s) && <Notice icon="check">This job is done. Thank you.</Notice>}
      {["booked", "cancelled", "disputed"].includes(s) && <p className="kit-muted">{StateText(s)}.</p>}
      {["accepted", "clocked_in", "ready", "verdict_given"].includes(s) && !job.frozen && (
        <div><button className="kit-link kit-danger" onClick={() => onStep("incident")}>Report a problem</button></div>
      )}
    </div>
  )
}

/** A reading of where the phone is, shared by the dialogs that need it. */
function useFix() {
  const [fix, setFix] = useState<Fix | null>(null)
  const [error, setError] = useState("")
  const [reading, setReading] = useState(false)
  const read = async () => {
    setReading(true)
    setError("")
    try {
      setFix(await readPosition())
    } catch (failure) {
      setError((failure as Error).message)
    } finally {
      setReading(false)
    }
  }
  return { fix, error, reading, read }
}

const FixRow = ({ f }: { f: ReturnType<typeof useFix> }) => (
  <div className="kit-file">
    <div className="kit-strong">Your location</div>
    {f.fix ? <span>Got it (accurate to about {f.fix.accuracy_m} m).</span> : <span className="kit-muted">We need your phone&apos;s location to prove you are at the place.</span>}
    {f.error && <span className="kit-danger">{f.error}</span>}
    <div><button type="button" className="secondary" onClick={f.read} disabled={f.reading}><Icon name="pin" size={15} /> {f.reading ? "Reading…" : f.fix ? "Read again" : "Share my location"}</button></div>
  </div>
)

function AcceptDialog({ job, onClose }: { job: StaffJob; onClose: () => void }) {
  const f = useFix()
  const accept = useAction(() => api(`/staff/jobs/${job.id}/accept`, { method: "POST", body: { ...f.fix, command_id: commandId("accept") } }), {
    invalidate: ["/staff/jobs", `/staff/jobs/${job.id}`], success: "Accepted. The customer can see you are on the way.", onSuccess: onClose,
  })
  return (
    <Modal title="Accept this job" onClose={onClose}>
      <div className="kit-form">
        <FixRow f={f} />
        {accept.error && <p className="form-error">{accept.error.message}</p>}
        <div className="actions"><button className="secondary" onClick={onClose}>Not now</button><button className="primary" disabled={!f.fix || accept.pending} onClick={() => accept.run()}>{accept.pending ? "Accepting…" : "Accept"}</button></div>
      </div>
    </Modal>
  )
}

function DeclineDialog({ job, onClose }: { job: StaffJob; onClose: () => void }) {
  const decline = useAction((reason: string) => api(`/staff/jobs/${job.id}/decline`, { method: "POST", body: { reason, command_id: commandId("decline") } }), {
    invalidate: ["/staff/jobs", `/staff/jobs/${job.id}`], success: "Declined. Dispatch will find someone else.", onSuccess: onClose,
  })
  return <ReasonDialog title="Decline this job" description="Tell dispatch why, so they can reassign it. Repeated declines are looked at." confirmLabel="Decline" pending={decline.pending} onConfirm={(r) => decline.run(r)} onClose={onClose} />
}

/** Clock-in and hand-over share the same proof: a plate photo, what the plate reads, and where the phone is. */
function ScanDialog({ job, kind, title, text, onClose }: { job: StaffJob; kind: "clock-in" | "submit"; title: string; text: string; onClose: () => void }) {
  const f = useFix()
  const [photo, setPhoto] = useState<File | null>(null)
  const [plate, setPlate] = useState(job.plate ?? "")
  const send = useAction(
    () => {
      const form = new FormData()
      form.set("photo", photo!)
      form.set("plate_read", plate.replace(/\s/g, "").toUpperCase())
      form.set("lat", String(f.fix!.lat))
      form.set("lng", String(f.fix!.lng))
      form.set("accuracy_m", String(f.fix!.accuracy_m))
      form.set("command_id", commandId(kind))
      return api(`/staff/jobs/${job.id}/${kind}`, { method: "POST", form })
    },
    { invalidate: ["/staff/jobs", `/staff/jobs/${job.id}`], success: kind === "submit" ? "Job handed over. Well done." : "Checked in.", onSuccess: onClose },
  )
  const refused = send.error instanceof ApiError ? send.error : null
  return (
    <Modal title={title} eyebrow={`JOB ${job.reference}`} onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); send.run() }}>
        <p>{text}</p>
        <FixRow f={f} />
        <Field label="Photo of the number plate"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></Field>
        <Field label="What does the plate say?" hint="Type it as you read it."><input value={plate} onChange={(e) => setPlate(e.target.value)} required style={{ textTransform: "uppercase" }} /></Field>
        {refused && <Notice tone="bad" icon="alert">{refused.message}</Notice>}
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!photo || !f.fix || send.pending}>{send.pending ? "Checking…" : "Send"}</button></div>
      </form>
    </Modal>
  )
}

function PhotoDialog({ job, onClose }: { job: StaffJob; onClose: () => void }) {
  const [kind, setKind] = useState("before")
  const [photo, setPhoto] = useState<File | null>(null)
  const [note, setNote] = useState("")
  const upload = useAction(
    () => {
      const form = new FormData()
      form.set("kind", kind)
      form.set("photo", photo!)
      if (note.trim()) form.set("note", note.trim())
      form.set("command_id", commandId("photo"))
      return api(`/staff/jobs/${job.id}/evidence`, { method: "POST", form })
    },
    { invalidate: [`/staff/jobs/${job.id}`], success: "Photo saved.", onSuccess: onClose },
  )
  return (
    <Modal title="Add a photo" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); upload.run() }}>
        <Field label="What is it of?">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="before">Before the wash</option><option value="after">After the wash</option><option value="damage">Existing damage</option>
          </select>
        </Field>
        <Field label="Photo"><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" required onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} /></Field>
        <Field label="Note (optional)"><input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} /></Field>
        {upload.error && <p className="form-error">{upload.error.message}</p>}
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={!photo || upload.pending}>{upload.pending ? "Uploading…" : "Save photo"}</button></div>
      </form>
    </Modal>
  )
}

function IncidentDialog({ job, onClose }: { job: StaffJob; onClose: () => void }) {
  const [type, setType] = useState<string>(INCIDENTS[0][0])
  const [note, setNote] = useState("")
  const report = useAction(() => api(`/staff/jobs/${job.id}/incident`, { method: "POST", body: { type, note: note.trim() || undefined } }), {
    success: "Reported. Dispatch has been told.", onSuccess: onClose,
  })
  return (
    <Modal title="Report a problem" eyebrow="DISPATCH IS TOLD AT ONCE" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); report.run() }}>
        <Field label="What happened?">
          <select value={type} onChange={(e) => setType(e.target.value)}>{INCIDENTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </Field>
        <Field label="Details (optional)"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} /></Field>
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={report.pending}>Report it</button></div>
      </form>
    </Modal>
  )
}

