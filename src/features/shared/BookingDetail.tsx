"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, Facts, Notice, PageHeader, Panel, Pill, Plate } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Modal, ReasonDialog } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import type { Booking, Payment, Receipt, Tracking, Verdict } from "@/lib/api/types"
import { day, naira, stamp, window_ } from "@/lib/format"
import { bookingStatusLabel, jobResultLabel, reasonLabel, verdictLabel } from "@/lib/labels"
import { startPayment } from "./payments"
import SlotPicker from "./SlotPicker"
import { NewTicketDialog } from "./Tickets"

const TERMINAL_JOB = ["closed", "cancelled", "disputed", "unconfirmed"]

/**
 * One booking from the customer's side: where the wash is, the proof when it is ready, the confirmation you give,
 * and what you can still change. `base` is the space it lives in (for links back and to tickets).
 */
export default function BookingDetail({ id, base }: { id: string; base: string }) {
  const tracking = useResource<Tracking>(`/bookings/${id}/tracking`, undefined, { refetchInterval: 15_000 })
  const router = useRouter()
  const [dialog, setDialog] = useState<"cancel" | "reschedule" | "ticket" | "refund" | null>(null)

  const repay = useAction(
    async () => (await api<{ data: Payment }>(`/bookings/${id}/payments`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey() } })).data,
    { onSuccess: (payment) => startPayment(payment, (url) => router.push(url)) },
  )

  return (
    <Async query={tracking}>
      {(t) => {
        const b = t.booking
        const job = b.job
        const jobId = (t.job_id as string | undefined) ?? job?.id
        const finished = job ? TERMINAL_JOB.includes(job.state) : false
        const canChange = b.status === "confirmed" && (!job || ["booked", "assigned"].includes(job.state))
        return (
          <>
            <PageHeader
              eyebrow={`BOOKING ${b.reference}`}
              title={b.service_name}
              description={`${day(b.starts_at)} · ${window_(b.starts_at, b.ends_at)}`}
              action={<Link className="secondary" href={`${base}/bookings`}>All bookings</Link>}
            />
            {b.status === "pending_payment" && (
              <Notice tone="warn" icon="card">
                <b>Payment is still needed.</b> Your slot is held for a short while. Pay now to confirm the wash.
                <div style={{ marginTop: 10 }}>
                  <button className="primary kit-btn-small" onClick={() => repay.run()} disabled={repay.pending}>
                    {repay.pending ? "Opening checkout…" : `Pay ${naira(b.amount_kobo)}`}
                  </button>
                </div>
              </Notice>
            )}
            <div className="kit-grid side">
              <div className="kit-stack">
                <Panel title="Progress" action={<Pill status={job?.state ?? b.status} label={bookingStatusLabel(b.status, job?.state)} />}>
                  {job ? (
                    <div className="kit-timeline">
                      {t.stages.map((s) => (
                        <div key={s.key} className={s.reached_at ? "done" : "todo"}>
                          <i />
                          <span>
                            <strong>{s.label}</strong>
                            <small>{s.reached_at ? stamp(s.reached_at) : "Not yet"}</small>
                          </span>
                        </div>
                      ))}
                      {job.result && (
                        <div className="done">
                          <i />
                          <span>
                            <strong>{jobResultLabel(job.result)}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="kit-muted">
                      {b.status === "cancelled" ? "This booking was cancelled." : "A washman is assigned before your slot. You will see them here."}
                    </p>
                  )}
                </Panel>

                {t.trust_card && <TrustCard card={t.trust_card} />}

                {job?.state === "ready" && jobId && <VerdictPanel jobId={jobId} onDone={() => tracking.refetch()} />}
                {t.photos && (t.photos.before.length > 0 || t.photos.after.length > 0) && job?.state !== "ready" && <Photos photos={t.photos} />}
                {jobId && finished && job?.state === "closed" && <RatingPanel jobId={jobId} />}
              </div>

              <div className="kit-stack">
                <Panel title="The booking">
                  <Facts
                    items={[
                      ["Vehicle", b.vehicle ? <><Plate value={b.vehicle.plate} /> {b.vehicle.make} {b.vehicle.model}</> : b.vehicle_plate],
                      ["Place", b.location ? `${b.location.label} · ${b.location.address}` : null],
                      ["Total", b.billing === "subscription" ? "A subscription credit" : b.billing === "invoice" ? "On the monthly invoice" : naira(b.amount_kobo)],
                      ...(b.reward_discount_kobo ? ([["Reward applied", `− ${naira(b.reward_discount_kobo)}`]] as [string, string][]) : []),
                      ["Rescheduled", b.rescheduled_count ? `${b.rescheduled_count} time(s)` : "Not yet"],
                    ]}
                  />
                  <hr className="kit-divider" />
                  <div className="kit-row">
                    {canChange && <button className="secondary" onClick={() => setDialog("reschedule")}>Reschedule</button>}
                    {canChange && <button className="secondary kit-danger" onClick={() => setDialog("cancel")}>Cancel booking</button>}
                    {b.billing === "card" && b.status !== "pending_payment" && b.status !== "cancelled" && (
                      <button className="secondary" onClick={() => setDialog("refund")}>Ask for a refund</button>
                    )}
                    {jobId && <button className="secondary" onClick={() => setDialog("ticket")}><Icon name="help" size={15} /> Report a problem</button>}
                  </div>
                  {!canChange && b.status === "confirmed" && (
                    <p className="kit-muted" style={{ marginTop: 12 }}>The washman is already on this job, so it can no longer be changed online. Contact support if you need to.</p>
                  )}
                </Panel>
                {b.billing === "card" && <ReceiptPanel booking={b} />}
              </div>
            </div>

            {dialog === "cancel" && <CancelDialog booking={b} onClose={() => setDialog(null)} />}
            {dialog === "reschedule" && <RescheduleDialog booking={b} onClose={() => setDialog(null)} />}
            {dialog === "ticket" && jobId && <NewTicketDialog jobId={jobId} basePath={`${base}/help`} onClose={() => setDialog(null)} />}
            {dialog === "refund" && <RefundDialog booking={b} onClose={() => setDialog(null)} />}
          </>
        )
      }}
    </Async>
  )
}

function TrustCard({ card }: { card: Record<string, unknown> }) {
  return (
    <Panel title="Your washman">
      <div className="kit-item" style={{ padding: 0, border: 0 }}>
        <span className="kit-icon-tile"><Icon name="user" size={20} /></span>
        <div className="grow">
          <h4>{String(card.name)} <span className="kit-faint">· {String(card.staff_code)}</span></h4>
          <p>
            {card.verified ? "Identity and background verified" : "Verification in progress"} · {String(card.jobs_completed)} washes completed
            {card.rating ? ` · rated ${String(card.rating)} (${String(card.rating_count)})` : ""}
          </p>
        </div>
        {card.verified ? <Pill status="verified" /> : null}
      </div>
    </Panel>
  )
}

function Photos({ photos }: { photos: { before: string[]; after: string[] } }) {
  return (
    <Panel title="Proof of the wash" description="Photos taken by the washman. Open one to see it full size.">
      <div className="kit-grid cols-2" style={{ marginBottom: 0 }}>
        {(["before", "after"] as const).map((kind) => (
          <div key={kind}>
            <div className="kit-faint" style={{ marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.6 }}>{kind}</div>
            <div className="kit-stack">
              {photos[kind].map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  {/* Signed, expiring URLs from the API: not something next/image can optimise. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`${kind} photo`} style={{ width: "100%", borderRadius: 10, border: "1px solid var(--kit-border)" }} />
                </a>
              ))}
              {photos[kind].length === 0 && <span className="kit-faint">No photo</span>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

/** "Does it look right?" The washman cannot hand over until you answer. */
export function VerdictPanel({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const verdict = useResource<Verdict>(`/jobs/${jobId}/verdict`)
  const form = useForm({ outcome: "satisfied", remark: "" })
  const [reasons, setReasons] = useState<string[]>([])

  const give = useAction(
    () => api(`/jobs/${jobId}/verdict`, { method: "POST", body: { outcome: form.values.outcome, remark: String(form.values.remark).trim() || undefined, reasons: reasons.length ? reasons : undefined } }),
    { invalidate: ["/bookings"], success: "Thank you. Your answer is recorded.", onSuccess: onDone },
  )

  return (
    <Async query={verdict}>
      {(v) => {
        if (!v.awaiting_verdict) return <Photos photos={v.photos} />
        const needsRemark = v.outcomes.find((o) => o.key === form.values.outcome)?.remark_required
        return (
          <>
            <Photos photos={v.photos} />
            <Panel title="Does it look right?" description="Look at the car and the photos, then tell us. The washman cannot finish until you do.">
              <form className="kit-form" onSubmit={(e) => { e.preventDefault(); give.run() }}>
                <div className="kit-chips" role="radiogroup" aria-label="Your verdict">
                  {v.outcomes.map((o) => (
                    <button type="button" key={o.key} role="radio" aria-checked={form.values.outcome === o.key} className={`kit-chip ${form.values.outcome === o.key ? "selected" : ""}`} onClick={() => form.set("outcome", o.key)}>
                      {verdictLabel(o.key)}
                    </button>
                  ))}
                </div>
                {form.values.outcome !== "satisfied" && (
                  <>
                    <div className="kit-chips">
                      {v.quick_reasons.map((r) => (
                        <button type="button" key={r} className={`kit-chip ${reasons.includes(r) ? "selected" : ""}`} onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}>
                          {reasonLabel(r)}
                        </button>
                      ))}
                    </div>
                    <Field label="What happened?" error={fieldError(give.error, "remark")}>
                      <textarea {...form.field("remark")} rows={3} required={Boolean(needsRemark)} />
                    </Field>
                  </>
                )}
                <div className="actions">
                  <button className="primary" disabled={give.pending}>{give.pending ? "Sending…" : "Confirm"}</button>
                </div>
              </form>
            </Panel>
          </>
        )
      }}
    </Async>
  )
}

function RatingPanel({ jobId }: { jobId: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [done, setDone] = useState(false)
  const rate = useAction(() => api(`/jobs/${jobId}/rating`, { method: "POST", body: { rating, comment: comment.trim() || undefined } }), {
    success: "Thanks for rating.",
    onSuccess: () => setDone(true),
  })
  if (done) return null
  return (
    <Panel title="How was it?" description="Your rating helps us look after our washmen, and you.">
      <div className="kit-row" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`} className="kit-chip" style={{ color: n <= rating ? "#e8a400" : undefined }} onClick={() => setRating(n)}>
            <Icon name="star" size={18} />
          </button>
        ))}
      </div>
      <div className="kit-form" style={{ marginTop: 14 }}>
        <Field label="A word about it (optional)"><input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} /></Field>
        <div className="actions"><button className="primary" disabled={!rating || rate.pending} onClick={() => rate.run()}>Send rating</button></div>
      </div>
    </Panel>
  )
}

function ReceiptPanel({ booking }: { booking: Booking }) {
  const receipts = useItems<Receipt>("/receipts")
  const receipt = receipts.items.find((r) => r.for.id === booking.id)
  if (!receipt) return null
  return (
    <Panel title="Receipt">
      <Facts items={[["Number", receipt.receipt_no], ["Paid", naira(receipt.amount_kobo)], ["Refunded", receipt.refunded_kobo ? naira(receipt.refunded_kobo) : null], ["Issued", stamp(receipt.issued_at)]]} />
    </Panel>
  )
}

function CancelDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const router = useRouter()
  const cancel = useAction((reason: string) => api(`/bookings/${booking.id}/cancel`, { method: "POST", body: { reason: reason || undefined } }), {
    invalidate: ["/bookings", `/bookings/${booking.id}/tracking`],
    success: "Booking cancelled. If you paid, the refund goes back to your card.",
    onSuccess: () => { onClose(); router.refresh() },
  })
  return (
    <ReasonDialog
      title="Cancel this booking?"
      description="Cancel for free until shortly before your slot; closer than that the price may be partly kept. If you paid by card the refund returns to the same card."
      confirmLabel="Cancel the booking"
      danger
      minLength={0}
      pending={cancel.pending}
      onConfirm={(reason) => cancel.run(reason)}
      onClose={onClose}
    />
  )
}

function RescheduleDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const [startsAt, setStartsAt] = useState("")
  const move = useAction(() => api(`/bookings/${booking.id}/reschedule`, { method: "POST", body: { starts_at: startsAt } }), {
    invalidate: ["/bookings", `/bookings/${booking.id}/tracking`],
    success: "Your wash is moved.",
    onSuccess: onClose,
  })
  return (
    <Modal title="Choose a new time" eyebrow="RESCHEDULE" onClose={onClose}>
      <div className="kit-form">
        <SlotPicker state={booking.location?.state ?? "LA"} value={startsAt} onChange={setStartsAt} />
        <div className="actions">
          <button className="secondary" onClick={onClose}>Keep the current time</button>
          <button className="primary" disabled={!startsAt || move.pending} onClick={() => move.run()}>{move.pending ? "Moving…" : "Move my wash"}</button>
        </div>
      </div>
    </Modal>
  )
}

function RefundDialog({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const receipts = useItems<Receipt>("/receipts")
  const receipt = receipts.items.find((r) => r.for.id === booking.id)
  const [reason, setReason] = useState("")
  const ask = useAction(() => api(`/payments/${receipt?.payment_id}/refund-requests`, { method: "POST", body: { reason: reason.trim() } }), {
    invalidate: ["/receipts"],
    success: "We have your request. The team will review it and email you.",
    onSuccess: onClose,
  })
  return (
    <Modal title="Ask for a refund" eyebrow="REFUNDS ARE REVIEWED BY OUR TEAM" onClose={onClose}>
      {!receipt ? (
        <p>We could not find the payment for this booking yet.</p>
      ) : (
        <form className="kit-form" onSubmit={(e) => { e.preventDefault(); ask.run() }}>
          <p>You paid {naira(receipt.amount_kobo)}. Tell us what went wrong; if it is approved, the money goes back to the card you paid with.</p>
          <Field label="Reason" error={fieldError(ask.error, "reason")}><textarea value={reason} onChange={(e) => setReason(e.target.value)} required minLength={3} rows={4} /></Field>
          <div className="actions">
            <button type="button" className="secondary" onClick={onClose}>Cancel</button>
            <button className="primary" disabled={ask.pending}>{ask.pending ? "Sending…" : "Send request"}</button>
          </div>
        </form>
      )}
    </Modal>
  )
}

