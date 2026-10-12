import { useEffect, useRef, useState } from "react"
import type { Role } from "../domain/roles"
import { supabase } from "../lib/supabase"
import * as jobsApi from "../lib/verifiedWashApi"
import {
  currentCoordinates,
  recognizePlate,
  sampleRoute,
  signedEvidence,
  uploadEvidence,
} from "../lib/evidenceApi"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Heading from "../components/ui/Typography"
import Brand from "../components/Brand"

type Job = jobsApi.AssignedJob & { id?: string }
type Staff = {
  user_id: string
  display_name: string
  status: string
  screening_verified: boolean
}
type Photo = {
  storage_path: string
  phase: string
}
type Event = {
  id: string
  event: string
  created_at: string
}
type Payment = {
  id: string
  reference: string
  status: string
  amount_kobo: number
}
type Receipt = {
  receipt_number: string
  service_name: string
  amount_kobo: number
  payment_status: string
  paid_at: string
}
type Refund = {
  id: string
  payment_id: string
  reason: string
  status: string
}

export default function LiveOperations({
  role,
  onHome,
}: {
  role: Role
  onHome: () => void
}) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [selected, setSelected] = useState("")
  const [staffId, setStaffId] = useState("")
  const [plate, setPlate] = useState("")
  const [reason, setReason] = useState("")
  const [photos, setPhotos] = useState<Photo[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  const [tracking, setTracking] = useState(false)
  const stopTracking = useRef<(() => void) | null>(null)
  const isStaff = role === "Washman"
  const finance = role === "Finance" || role === "Super admin"
  const dispatch = role === "Dispatcher" || role === "Super admin"
  const job = jobs.find((item) => item.booking_id === selected)
  async function refresh() {
    if (!supabase) throw new Error("Supabase is not configured.")
    if (role !== "Finance") {
      if (isStaff) setJobs(await jobsApi.loadAssignedJobs())
      else {
        const { data, error } = await supabase
          .from("gw_bookings")
          .select("*")
          .order("scheduled_at")
        if (error) throw error
        setJobs(data.map((row) => ({ ...row, booking_id: row.id })))
      }
    }
    if (dispatch) {
      const { data, error } = await supabase
        .from("gw_staff_profiles")
        .select("*")
      if (error) throw error
      setStaff(data)
    }
    if (finance) {
      const results = await Promise.all([
        supabase
          .from("gw_payments")
          .select("id,reference,status,amount_kobo")
          .order("created_at", { ascending: false }),
        supabase.rpc("gw_receipts"),
        supabase
          .from("gw_refund_requests")
          .select("*")
          .order("created_at", { ascending: false }),
      ])
      for (const result of results) if (result.error) throw result.error
      setPayments(results[0].data || [])
      setReceipts(results[1].data || [])
      setRefunds(results[2].data || [])
    }
    if (selected) {
      const results = await Promise.all([
        supabase
          .from("gw_job_photos")
          .select("storage_path,phase")
          .eq("booking_id", selected),
        supabase
          .from("gw_job_events")
          .select("id,event,created_at")
          .eq("booking_id", selected)
          .order("created_at"),
      ])
      for (const result of results) if (result.error) throw result.error
      setPhotos(results[0].data || [])
      setEvents(results[1].data || [])
    }
  }
  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setMessage("")
    try {
      await action()
      await refresh()
      setMessage("Server confirmed. Records refreshed.")
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to load live records. Apply the Supabase migrations and retry.",
      )
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void run(async () => {})
  }, [selected, role])
  useEffect(() => {
    stopTracking.current?.()
    stopTracking.current = null
    setTracking(false)
    return () => {
      stopTracking.current?.()
      stopTracking.current = null
    }
  }, [selected, job?.status])
  const gpsActive =
    job &&
    [
      "accepted",
      "clocked_in",
      "washing",
      "ready",
      "verdict_given",
      "submitted",
    ].includes(job.status)
  return (
    <div className="min-h-dvh bg-(--foam)">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--line) bg-white px-6 py-5">
        <Brand onClick={onHome} />
        <Button className="secondary" onClick={onHome}>
          Return home
        </Button>
      </header>
      <main className="mx-auto max-w-7xl space-y-6 px-6 py-10">
        <div className="eyebrow">LIVE {role.toUpperCase()} WORKSPACE</div>
        <Heading level={1}>Every action. On the record.</Heading>
        <p className="text-(--muted)">
          Real Supabase records only. Permissions and job transitions are
          enforced by the server.
        </p>
        <Button
          className="secondary"
          disabled={busy}
          onClick={() => void run(async () => {})}
        >
          Refresh records
        </Button>
        {message && (
          <p role="status" className="content-panel">
            {message}
          </p>
        )}
        {role !== "Finance" && (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="content-panel space-y-4">
              <Heading>Work queue</Heading>
              {!jobs.length && (
                <p>
                  No jobs loaded. Refresh to retry if migrations have not been
                  deployed.
                </p>
              )}
              {jobs.map((item) => (
                <Button
                  key={item.booking_id}
                  className={`secondary full ${
                    selected === item.booking_id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelected(item.booking_id)
                    setPlate("")
                    setPhotos([])
                    setEvents([])
                  }}
                >
                  {item.service_name} · {item.vehicle_label} ·{" "}
                  {item.status.replace(/_/g, " ")}
                </Button>
              ))}
            </section>
            <section className="content-panel space-y-5">
              <Heading>{job ? job.service_name : "Select a job"}</Heading>
              {job && (
                <>
                  <p>
                    {job.vehicle_label} ·{" "}
                    {new Date(job.scheduled_at).toLocaleString()}
                    <br />
                    {job.location_label || "Location hidden until acceptance"} ·{" "}
                    {job.status}
                  </p>
                  {dispatch && job.status === "paid_pending_assignment" && (
                    <>
                      <p>Choose an available, screened professional.</p>
                      {staff
                        .filter(
                          (person) =>
                            person.status === "available" &&
                            person.screening_verified,
                        )
                        .map((person) => (
                          <Button
                            key={person.user_id}
                            className="secondary"
                            aria-pressed={staffId === person.user_id}
                            onClick={() => setStaffId(person.user_id)}
                          >
                            {person.display_name}
                          </Button>
                        ))}
                      <Button
                        className="primary"
                        disabled={busy || !staffId}
                        onClick={() =>
                          void run(() => jobsApi.assignJob(selected, staffId))
                        }
                      >
                        Assign professional
                      </Button>
                    </>
                  )}
                  {dispatch && ["ready", "disputed"].includes(job.status) && (
                    <>
                      <Input
                        aria-label="Administrative release reason"
                        placeholder="Detailed release reason (at least 10 characters)"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <Button
                        className="secondary"
                        disabled={busy || reason.trim().length < 10}
                        onClick={() =>
                          void run(() => jobsApi.releaseJob(selected, reason))
                        }
                      >
                        Release as unconfirmed
                      </Button>
                    </>
                  )}
                  {isStaff && (
                    <>
                      {job.status === "assigned" && (
                        <Button
                          className="primary"
                          disabled={busy}
                          onClick={() =>
                            void run(() => jobsApi.acceptJob(selected))
                          }
                        >
                          Accept assigned job
                        </Button>
                      )}
                      {gpsActive && (
                        <>
                          <p>
                            Route sampling is opt-in, every 15 seconds while
                            this page is visible. Keep this page open;
                            background tracking is not supported.
                          </p>
                          <Button
                            className="secondary"
                            onClick={() => {
                              if (tracking) {
                                stopTracking.current?.()
                                stopTracking.current = null
                                setTracking(false)
                              } else {
                                try {
                                  stopTracking.current = sampleRoute(
                                    selected,
                                    setMessage,
                                  )
                                  setTracking(true)
                                } catch (error) {
                                  setMessage(String(error))
                                }
                              }
                            }}
                          >
                            {tracking
                              ? "Stop route sampling"
                              : "Enable route sampling"}
                          </Button>
                        </>
                      )}
                      {["accepted", "verdict_given"].includes(job.status) && (
                        <>
                          <label className="block space-y-2">
                            Capture plate for recognition (sent to Plate
                            Recognizer)
                            <Input
                              type="file"
                              accept="image/jpeg"
                              capture="environment"
                              disabled={busy}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file)
                                  void run(async () =>
                                    setPlate(
                                      await recognizePlate(selected, file),
                                    ),
                                  )
                                e.target.value = ""
                              }}
                            />
                          </label>
                          <Input
                            aria-label="Confirm number plate"
                            placeholder="Confirm plate or enter manually"
                            value={plate}
                            onChange={(e) => setPlate(e.target.value)}
                          />
                          <p>
                            Review the recognized plate. Confirmation is
                            recorded as manual verification; OCR is assistive,
                            not trusted evidence.
                          </p>
                          <Button
                            className="primary"
                            disabled={busy || plate.trim().length < 4}
                            onClick={() =>
                              void run(async () => {
                                const coords = await currentCoordinates()
                                const result =
                                  job.status === "accepted"
                                    ? await jobsApi.clockIn(
                                        selected,
                                        plate,
                                        "manual",
                                        coords,
                                      )
                                    : await jobsApi.submitJob(
                                        selected,
                                        plate,
                                        "manual",
                                        coords,
                                      )
                                if (
                                  [
                                    "plate_mismatch",
                                    "outside_geofence",
                                  ].includes(result)
                                )
                                  throw new Error(
                                  `Server recorded ${result.replace(/_/g, " ")}. Contact operations.`,
                                  )
                              })
                            }
                          >
                            {job.status === "accepted"
                              ? "Verify arrival & clock in"
                              : "Verify plate & submit"}
                          </Button>
                        </>
                      )}
                      {["clocked_in", "washing", "ready"].includes(
                        job.status,
                      ) &&
                        (["before", "after"] as const)
                          .filter((phase) =>
                            phase === "before"
                              ? job.status !== "ready"
                              : job.status !== "clocked_in",
                          )
                          .map((phase) => (
                            <label key={phase} className="block space-y-2">
                              Capture {phase} evidence
                              <Input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                capture="environment"
                                disabled={busy}
                                onChange={(e) => {
                                  const file = e.target.files?.[0]
                                  if (file)
                                    void run(() =>
                                      uploadEvidence(selected, phase, file),
                                    )
                                  e.target.value = ""
                                }}
                              />
                            </label>
                          ))}
                      {job.status === "clocked_in" && (
                        <Button
                          className="primary"
                          disabled={busy}
                          onClick={() =>
                            void run(() => jobsApi.startWash(selected))
                          }
                        >
                          Start wash
                        </Button>
                      )}
                      {job.status === "washing" && (
                        <Button
                          className="primary"
                          disabled={busy}
                          onClick={() =>
                            void run(() => jobsApi.markWashReady(selected))
                          }
                        >
                          Request customer verdict
                        </Button>
                      )}
                      {job.status === "submitted" && (
                        <Button
                          className="primary"
                          disabled={busy}
                          onClick={() =>
                            void run(() => jobsApi.clockOut(selected))
                          }
                        >
                          Clock out & close job
                        </Button>
                      )}
                    </>
                  )}
                  <Heading level={3}>Private evidence</Heading>
                  {photos.map((photo) => (
                    <Button
                      key={photo.storage_path}
                      className="secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          const url = await signedEvidence(photo.storage_path)
                          window.open(url, "_blank", "noopener,noreferrer")
                        })
                      }
                    >
                      View {photo.phase} photo · 60-second link
                    </Button>
                  ))}
                  <Heading level={3}>Audit trail</Heading>
                  {events.map((event) => (
                    <p key={event.id}>
                      {event.event.replace(/_/g, " ")} ·{" "}
                      {new Date(event.created_at).toLocaleString()}
                    </p>
                  ))}
                </>
              )}
            </section>
          </div>
        )}
        {finance && (
          <section className="content-panel space-y-5">
            <Heading>Payments & refunds</Heading>
            <Input
              aria-label="Refund reason"
              placeholder="Refund reason (at least 10 characters)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-(--line) py-4"
              >
                <span>
                  {payment.reference} · ₦
                  {(payment.amount_kobo / 100).toLocaleString()} ·{" "}
                  {payment.status}
                </span>
                {payment.status === "paid" && (
                  <Button
                    className="secondary"
                    disabled={busy || reason.trim().length < 10}
                    onClick={() =>
                      void run(async () => {
                        const { error } = await supabase!.rpc(
                          "gw_request_refund",
                          { p_payment_id: payment.id, p_reason: reason },
                        )
                        if (error) throw error
                      })
                    }
                  >
                    Queue full refund
                  </Button>
                )}
              </div>
            ))}
            {refunds.map((refund) => (
              <div key={refund.id} className="space-y-2">
                <p>
                  {refund.reason} · {refund.status}
                </p>
                {refund.status === "requested" && (
                  <Button
                    className="secondary"
                    disabled={busy}
                    onClick={() =>
                      void run(async () => {
                        const { data, error } =
                          await supabase!.functions.invoke("refunds", {
                            body: { refundId: refund.id },
                          })
                        if (error || data?.error)
                          throw new Error(
                            data?.error ||
                              "Refund provider unavailable. Check deployment and credentials.",
                          )
                      })
                    }
                  >
                    Send approved refund to provider
                  </Button>
                )}
              </div>
            ))}
            <Heading>Reconciled receipts</Heading>
            {receipts.map((receipt) => (
              <p key={receipt.receipt_number}>
                {receipt.receipt_number} · {receipt.service_name} · ₦
                {(receipt.amount_kobo / 100).toLocaleString()} ·{" "}
                {receipt.payment_status} ·{" "}
                {new Date(receipt.paid_at).toLocaleString()}
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
