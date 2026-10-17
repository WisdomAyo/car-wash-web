"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { CarArt, Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { useAction, useItems, useList, useRaw, useResource } from "@/lib/api/hooks"
import type { AppNotification, Booking, Payment, Place, Plan, Preferences, Receipt, Service, Subscription, Tracking, User, Vehicle, Verdict } from "@/lib/api/types"
import { useSignOut } from "@/lib/auth"
import { day, humanise, naira, nextDays, stamp, time, window_ } from "@/lib/format"
import { bookingStatusLabel, jobForCustomer, reasonLabel, verdictLabel } from "@/lib/labels"
import PlaceForm from "@/features/shared/PlaceForm"
import VehicleForm from "@/features/shared/VehicleForm"
import { startPayment } from "@/features/shared/payments"
import { useCustomerUi } from "./CustomerUi"
import { WaterLine } from "./parts"

/** Every dialog of the personal space, in the workspace's own modal style. */
export default function Modals() {
  const { modal, closeModal } = useCustomerUi()
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!modal) return
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeModal()
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
    }
  }, [modal, closeModal])

  if (!modal) return null
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeModal()}>
      <section ref={ref} className={`modal ${modal.name === "booking" ? "booking-modal" : ""}`} role="dialog" aria-modal="true" aria-label={modal.name === "booking" ? "Book a wash" : "Go-Wash details"}>
        <button className="modal-close" aria-label="Close dialog" onClick={closeModal}>
          <Icon name="close" />
        </button>
        {modal.name === "booking" && <BookingModal vehicleId={modal.vehicleId} serviceId={modal.serviceId} />}
        {modal.name === "tracking" && <TrackingModal bookingId={modal.id!} />}
        {modal.name === "verdict" && <VerdictModal jobId={modal.id!} bookingId={undefined} />}
        {modal.name === "vehicle" && <VehicleModal />}
        {modal.name === "support" && <SupportModal />}
        {modal.name === "notifications" && <NotificationsModal />}
        {modal.name === "proof" && <ProofModal />}
        {modal.name === "receipt" && <ReceiptModal bookingId={modal.id!} />}
        {modal.name === "plan" && <PlanModal planId={modal.id!} />}
        {modal.name === "settings" && <SettingsModal />}
      </section>
    </div>
  )
}

const Hint = ({ children }: { children: ReactNode }) => (
  <p className="kit-hint">
    <Icon name="shield" size={16} /> {children}
  </p>
)

/* ------------------------------------------------------------------ booking */

function BookingModal({ vehicleId, serviceId }: { vehicleId?: string; serviceId?: string }) {
  const { closeModal } = useCustomerUi()
  const router = useRouter()
  const vehicles = useList<Vehicle>("/vehicles")
  const places = useList<Place>("/locations")
  const services = useItems<Service>("/services")
  const subscriptions = useItems<Subscription>("/subscriptions")

  const [step, setStep] = useState(0)
  const [vehicle, setVehicle] = useState(vehicleId ?? "")
  const [service, setService] = useState(serviceId ?? "")
  const [place, setPlace] = useState("")
  const [date, setDate] = useState(() => nextDays(2)[1])
  const [startsAt, setStartsAt] = useState("")
  const [useCredit, setUseCredit] = useState(false)
  const [addingPlace, setAddingPlace] = useState(false)
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [booked, setBooked] = useState<Booking | null>(null)

  const chosenVehicle = vehicles.items.find((v) => v.id === (vehicle || vehicles.items[0]?.id))
  const chosenService = services.items.find((s) => s.id === (service || services.items[1]?.id || services.items[0]?.id))
  const chosenPlace = places.items.find((p) => p.id === (place || places.items[0]?.id))
  const price = chosenVehicle && chosenService ? chosenService.prices[chosenVehicle.type] : undefined
  const credit = subscriptions.items.find((s) => s.status === "active" && s.washes_remaining > 0)
  const slots = useRaw<{ data: { starts_at: string; ends_at: string; available: boolean }[] }>("/slots", { date, state: chosenPlace?.state ?? "LA" })

  const book = useAction(
    () =>
      api<{ booking: Booking; payment: Payment | null }>("/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: { vehicle_id: chosenVehicle!.id, service_id: chosenService!.id, location_id: chosenPlace!.id, starts_at: startsAt, use_subscription: useCredit && Boolean(credit) },
      }),
    {
      invalidate: ["/bookings", "/subscriptions"],
      onSuccess: ({ booking, payment }) => {
        if (payment) {
          closeModal()
          startPayment(payment, (url) => router.push(url))
        } else {
          setBooked(booking)
          setStep(2)
        }
      },
    },
  )

  const ready = Boolean(chosenVehicle && chosenService && chosenPlace && startsAt && price !== undefined)
  const heading = step === 2 ? "You're on the calendar." : step === 1 ? "Everything look good?" : "Make time for a little shine."

  return (
    <>
      <div className="eyebrow">A CLEAN CAR IS JUST A FEW TAPS AWAY</div>
      <h2>{heading}</h2>
      <div className="booking-steps">
        {["Your wash", "Review & pay", "Confirmed"].map((label, i) => (
          <span className={i <= step ? "current" : ""} key={label}>
            {i + 1}. {label}
          </span>
        ))}
      </div>
      {step === 0 ? (
        <>
          <label>
            Your vehicle
            {vehicles.items.length === 0 ? (
              <button type="button" className="secondary" onClick={() => setAddingVehicle(true)}>
                <Icon name="plus" size={15} /> Add your first vehicle
              </button>
            ) : (
              <select value={chosenVehicle?.id ?? ""} onChange={(e) => (e.target.value === "__add" ? setAddingVehicle(true) : setVehicle(e.target.value))}>
                {vehicles.items.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} · {v.plate}
                  </option>
                ))}
                <option value="__add">+ Add another vehicle…</option>
              </select>
            )}
          </label>
          <label>Choose your care</label>
          <div className="booking-service-list">
            {services.items.map((s, i) => {
              const p = chosenVehicle ? s.prices[chosenVehicle.type] : undefined
              const selected = chosenService?.id === s.id
              return (
                <button type="button" className={selected ? "selected" : ""} key={s.id} onClick={() => setService(s.id)}>
                  <Icon name={serviceIcons[i % serviceIcons.length]} />
                  <span>
                    <strong>{s.name}</strong>
                    <small>About {s.duration_minutes} minutes</small>
                  </span>
                  <b>{p !== undefined ? naira(p) : "—"}</b>
                  {selected && <Icon name="check" size={17} />}
                </button>
              )
            })}
          </div>
          <label>
            Outdoor wash location
            {places.items.length === 0 ? (
              <button type="button" className="secondary" onClick={() => setAddingPlace(true)}>
                <Icon name="plus" size={15} /> Add a place
              </button>
            ) : (
              <select value={chosenPlace?.id ?? ""} onChange={(e) => (e.target.value === "__add" ? setAddingPlace(true) : setPlace(e.target.value))}>
                {places.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} · {p.area}
                  </option>
                ))}
                <option value="__add">+ Add another place…</option>
              </select>
            )}
          </label>
          <div className="form-grid">
            <label>
              Date
              <select value={date} onChange={(e) => { setDate(e.target.value); setStartsAt("") }}>
                {nextDays(14).map((d) => (
                  <option key={d} value={d}>
                    {day(`${d}T12:00:00+01:00`)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Time slot
              <select value={startsAt} onChange={(e) => setStartsAt(e.target.value)}>
                <option value="">{slots.isPending ? "Finding times…" : "Choose a time"}</option>
                {slots.data?.data.map((s) => (
                  <option key={s.starts_at} value={s.starts_at} disabled={!s.available}>
                    {window_(s.starts_at, s.ends_at)}
                    {s.available ? "" : " · unavailable"}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <Hint>We work in approved outdoor spaces only. Your washman never enters your home.</Hint>
          <button className="primary full" onClick={() => setStep(1)} disabled={!ready}>
            Review booking <Icon name="arrow" size={17} />
          </button>
        </>
      ) : step === 1 && chosenService && chosenVehicle && chosenPlace ? (
        <>
          <div className="review-summary">
            <h3>{chosenService.name}</h3>
            <p>
              {chosenVehicle.make} {chosenVehicle.model} · {chosenVehicle.plate}
            </p>
            <p>
              <Icon name="pin" size={16} />
              {chosenPlace.label} · {chosenPlace.address}
            </p>
            <p>
              <Icon name="calendar" size={16} />
              {day(startsAt)} · {time(startsAt)}
            </p>
            <hr />
            <div>
              <span>Wash service</span>
              <strong>{price !== undefined ? naira(price) : "—"}</strong>
            </div>
            <div>
              <span>Travel & verification</span>
              <strong>Included</strong>
            </div>
            {credit && (
              <div>
                <span>
                  <label className="checkbox-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} /> Use a subscription credit ({credit.washes_remaining} left)
                  </label>
                </span>
              </div>
            )}
            <hr />
            <div>
              <strong>Total</strong>
              <h3>{useCredit && credit ? "1 credit" : price !== undefined ? naira(price) : "—"}</h3>
            </div>
          </div>
          <Hint>Any referral reward is applied automatically. You pay securely on the next step.</Hint>
          {book.error && <p className="form-error" role="alert">{book.error.message}</p>}
          <button className="primary full" onClick={() => book.run()} disabled={book.pending}>
            {book.pending ? "Booking…" : useCredit && credit ? "Book with a credit" : "Confirm and pay"} <Icon name="shield" size={17} />
          </button>
          <button className="text-button centered" onClick={() => setStep(0)}>
            Back to your wash
          </button>
        </>
      ) : (
        booked && (
          <div className="confirmation">
            <span className="confirmation-icon">
              <Icon name="check" size={38} />
            </span>
            <h3>We&apos;ll take care of the rest.</h3>
            <p>
              {booked.service_name} for {booked.vehicle_plate}
              <br />
              {day(booked.starts_at)} · {window_(booked.starts_at, booked.ends_at)}
            </p>
            <span className="status-badge">Booking {booked.reference}</span>
            <p>You&apos;ll receive your washman&apos;s Trust Card when they&apos;re assigned.</p>
            <button className="primary full" onClick={() => { closeModal(); router.push(`/workspace/customer/bookings/${booked.id}`) }}>
              View my booking <Icon name="arrow" size={17} />
            </button>
          </div>
        )
      )}
      {addingVehicle && <VehicleForm onClose={() => setAddingVehicle(false)} onSaved={(v) => setVehicle(v.id)} />}
      {addingPlace && <PlaceForm onClose={() => setAddingPlace(false)} onSaved={(p) => setPlace(p.id)} />}
    </>
  )
}

import type { IconName } from "@/components/Visuals"
const serviceIcons: IconName[] = ["drop", "star", "shield"]

/* ------------------------------------------------------------------ tracking */

function TrackingModal({ bookingId }: { bookingId: string }) {
  const { closeModal, openModal } = useCustomerUi()
  const tracking = useResource<Tracking>(`/bookings/${bookingId}/tracking`, undefined, { refetchInterval: 15_000 })
  const t = tracking.data
  const job = t?.booking.job
  const card = t?.trust_card as { name: string; staff_code: string; verified: boolean; jobs_completed: number; rating: number | null; rating_count: number } | null | undefined
  const jobId = (t?.job_id as string | undefined) ?? job?.id

  if (!t) return <div className="kit-loading"><span className="kit-spinner" /> Loading your wash…</div>
  const b = t.booking
  const headline = !job ? "Your wash is booked." : job.state === "accepted" ? "Your shine is on its way." : job.state === "clocked_in" ? "Your washman is at work." : job.state === "ready" ? "Ready for your final say." : job.state === "closed" ? "A verified wash." : "Your shine is coming."
  return (
    <>
      <div className="eyebrow">LIVE WASH · {b.reference}</div>
      <h2>{headline}</h2>
      <div className="map-illustration">
        <div className="map-road road-1" />
        <div className="map-road road-2" />
        <div className="map-road road-3" />
        <span className="map-label">{(b.location?.area ?? "YOUR PLACE").toUpperCase()}</span>
        <div className="route-path" />
        <span className="map-car">
          <Icon name="car" size={24} />
        </span>
        <span className="map-home">
          <Icon name="pin" size={24} />
        </span>
        <span className="map-water">{(b.location?.state_name ?? "LAGOS").toUpperCase()}</span>
        <span className="map-demo">Illustrative route · Not live GPS</span>
      </div>
      {card ? (
        <div className="washman-row tracking-washman">
          <div className="washman-avatar">{card.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}</div>
          <div>
            <strong>{card.name}</strong>
            <small>
              {card.verified ? "Verified professional" : "Verification in progress"}
              {card.rating ? ` · ${card.rating} rating` : ""}
            </small>
          </div>
          <div className="eta">
            <strong>{jobForCustomer(job?.state)}</strong>
            <small>{time(b.starts_at)} slot</small>
          </div>
        </div>
      ) : (
        <div className="washman-row tracking-washman">
          <div className="washman-avatar">GW</div>
          <div>
            <strong>{bookingStatusLabel(b.status, job?.state)}</strong>
            <small>A verified washman is assigned before your slot</small>
          </div>
          <div className="eta">
            <strong>{time(b.starts_at)}</strong>
            <small>Slot starts</small>
          </div>
        </div>
      )}
      <div style={{ margin: "18px 0" }}>
        <WaterLine stages={t.stages} />
      </div>
      <p>We&apos;ll let you know as each stage happens. Your vehicle&apos;s plate is checked before the wash begins.</p>
      {job?.state === "ready" && jobId ? (
        <button className="primary full" onClick={() => openModal({ name: "verdict", id: jobId })}>
          Give your verdict <Icon name="arrow" size={16} />
        </button>
      ) : (
        <Link className="primary full link-btn" href={`/workspace/customer/bookings/${bookingId}`} onClick={closeModal}>
          Open booking details <Icon name="arrow" size={16} />
        </Link>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ verdict (the reveal) */

function VerdictModal({ jobId }: { jobId: string; bookingId?: string }) {
  const { closeModal, notify } = useCustomerUi()
  const verdict = useResource<Verdict>(`/jobs/${jobId}/verdict`)
  const [choice, setChoice] = useState("")
  const [remark, setRemark] = useState("")
  const [reasons, setReasons] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [rating, setRating] = useState(0)

  const give = useAction(
    () => api(`/jobs/${jobId}/verdict`, { method: "POST", body: { outcome: choice, remark: remark.trim() || undefined, reasons: reasons.length ? reasons : undefined } }),
    { invalidate: ["/bookings"], onSuccess: () => setDone(true) },
  )
  const rate = useAction((n: number) => api(`/jobs/${jobId}/rating`, { method: "POST", body: { rating: n } }), { success: "Thanks for rating." })

  const v = verdict.data
  if (!v) return <div className="kit-loading"><span className="kit-spinner" /> Loading…</div>
  const needsRemark = v.outcomes.find((o) => o.key === choice)?.remark_required
  const labels: Record<string, [string, string, IconName]> = {
    satisfied: ["Treated and satisfied", "All clean. All good.", "check"],
    not_pleased: ["Treated and not pleased", "The wash happened, but needs attention.", "help"],
    untreated: ["Untreated", "My vehicle was not washed.", "close"],
  }
  const photos = [...v.photos.after, ...v.photos.before]

  return (
    <>
      <div className="eyebrow">THE REVEAL</div>
      <h2>{done ? "Your say has been recorded." : "A little shine. Your final say."}</h2>
      {!done ? (
        <>
          <div className="reveal-art">
            {photos.length ? (
              // Signed, expiring URL straight from the API.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[0]} alt="Photo of your vehicle after the wash" style={{ width: "100%", borderRadius: 12 }} />
            ) : (
              <>
                <CarArt />
                <span>Your washman&apos;s photos will appear here</span>
              </>
            )}
          </div>
          {photos.length > 1 && (
            <div className="kit-row" style={{ marginBottom: 12 }}>
              {photos.slice(1).map((p) => (
                <a key={p} className="kit-link" href={p} target="_blank" rel="noreferrer">More photos</a>
              ))}
            </div>
          )}
          <p>Confirm whether your vehicle was treated. Your verdict is required before the washman can make the final plate scan.</p>
          <div className="verdict-options">
            {v.outcomes.map((o, i) => (
              <button type="button" key={o.key} className={`verdict-option outcome-${i} ${choice === o.key ? "selected" : ""}`} onClick={() => setChoice(o.key)}>
                <Icon name={labels[o.key]?.[2] ?? "check"} />
                <span>
                  {labels[o.key]?.[0] ?? verdictLabel(o.key)}
                  <small>{labels[o.key]?.[1]}</small>
                </span>
              </button>
            ))}
          </div>
          {choice && choice !== "satisfied" && (
            <div className="reason-chips">
              {v.quick_reasons.map((r) => (
                <button type="button" key={r} onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])} className={reasons.includes(r) ? "selected" : ""}>
                  {reasonLabel(r)}
                </button>
              ))}
            </div>
          )}
          <label>
            Your remark {needsRemark ? "(required)" : "(optional)"}
            <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Tell us about your wash…" />
          </label>
          {give.error && <p className="form-error" role="alert">{give.error.message}</p>}
          <button className="primary full" disabled={!choice || (needsRemark && !remark.trim()) || give.pending} onClick={() => give.run()}>
            {give.pending ? "Sending…" : "Submit your verdict"} <Icon name="check" size={16} />
          </button>
        </>
      ) : (
        <div className="confirmation">
          <span className="confirmation-icon">
            <Icon name="shield" size={36} />
          </span>
          <h3>{labels[choice]?.[0] ?? verdictLabel(choice)}</h3>
          <p>
            {choice === "untreated"
              ? "The job is disputed. Final submission is locked until the operations team reviews the evidence."
              : choice === "not_pleased"
                ? "A complaint is open for the operations team. The washman can now make the final plate scan."
                : "The washman can now make the final plate scan. Your Wash Passport is updated once all three proofs are complete."}
          </p>
          {choice !== "untreated" && (
            <>
              <h4>How was your experience?</h4>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} aria-label={`Rate ${n} stars`} className={rating >= n ? "rated" : ""} onClick={() => { setRating(n); rate.run(n) }}>
                    <Icon name="star" size={30} />
                  </button>
                ))}
              </div>
            </>
          )}
          <button className="primary full" onClick={() => { closeModal(); notify("Thank you for your feedback.") }}>
            Done <Icon name="check" size={16} />
          </button>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ vehicle */

function VehicleModal() {
  const { closeModal, notify } = useCustomerUi()
  const [form, setForm] = useState({ plate: "", make: "", model: "", colour: "", type: "sedan" })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: k === "plate" ? e.target.value.toUpperCase() : e.target.value })
  const add = useAction(() => api("/vehicles", { method: "POST", body: { ...form, plate: form.plate.trim() } }), {
    invalidate: ["/vehicles"], onSuccess: () => { closeModal(); notify("Vehicle added to your garage.") },
  })
  const problem = (f: string) => (add.error?.code === "validation_failed" ? add.error.field(f) : undefined)
  return (
    <>
      <div className="eyebrow">MAKE ROOM IN YOUR GARAGE</div>
      <h2>A new vehicle. The same care.</h2>
      <p>Your number plate is your vehicle&apos;s unique identity.</p>
      <form onSubmit={(e) => { e.preventDefault(); add.run() }}>
        <label>
          Number plate
          <input required value={form.plate} onChange={set("plate")} placeholder="e.g. LND 482 JK" />
          {problem("plate") && <small className="form-error">{problem("plate")}</small>}
        </label>
        <div className="form-grid">
          <label>
            Make
            <input required value={form.make} onChange={set("make")} placeholder="e.g. Lexus" />
          </label>
          <label>
            Model
            <input required value={form.model} onChange={set("model")} placeholder="e.g. RX350" />
          </label>
        </div>
        <div className="form-grid">
          <label>
            Colour
            <input required value={form.colour} onChange={set("colour")} placeholder="e.g. Pearl white" />
          </label>
          <label>
            Vehicle type
            <select value={form.type} onChange={set("type")}>
              {["sedan", "suv", "van", "pickup", "bus"].map((t) => (
                <option key={t} value={t}>{t === "suv" ? "SUV" : humanise(t)}</option>
              ))}
            </select>
          </label>
        </div>
        <Hint>If this plate is already registered to someone else, it is held for review by the team.</Hint>
        {add.error && add.error.code !== "validation_failed" && <p className="form-error" role="alert">{add.error.message}</p>}
        <button className="primary full" type="submit" disabled={add.pending}>
          {add.pending ? "Adding…" : "Add to my garage"} <Icon name="plus" size={17} />
        </button>
      </form>
    </>
  )
}

/* ------------------------------------------------------------------ support */

function SupportModal() {
  const { closeModal, notify } = useCustomerUi()
  const router = useRouter()
  const [topic, setTopic] = useState("booking")
  const [message, setMessage] = useState("")
  const topics: Record<string, [string, string]> = {
    booking: ["A booking or wash", "complaint"], payment: ["A payment", "complaint"], conduct: ["Staff conduct", "conduct"], other: ["Something else", "feedback"],
  }
  const send = useAction(() => api<{ data: { id: string } }>("/tickets", { method: "POST", body: { type: topics[topic][1], category: topic, body: message } }), {
    invalidate: ["/tickets"], onSuccess: (r) => { closeModal(); notify("Your message is with our team. We reply in your tickets."); router.push(`/workspace/customer/help/${r.data.id}`) },
  })
  return (
    <>
      <div className="eyebrow">REAL PEOPLE. REAL SUPPORT.</div>
      <h2>How can we help?</h2>
      <p>Tell our team what happened. We&apos;ll help make it right.</p>
      <form onSubmit={(e) => { e.preventDefault(); send.run() }}>
        <label>
          What is it about?
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {Object.entries(topics).map(([k, [label]]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
        <label>
          Your message
          <textarea required minLength={3} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us a little more…" />
        </label>
        {send.error && <p className="form-error" role="alert">{send.error.message}</p>}
        <button className="primary full" disabled={send.pending}>
          {send.pending ? "Sending…" : "Send message"} <Icon name="arrow" size={16} />
        </button>
      </form>
      <Link className="text-button centered link-btn" href="/workspace/customer/settings" onClick={closeModal}>
        Request a copy or deletion of your data
      </Link>
    </>
  )
}

/* ------------------------------------------------------------------ notifications */

function NotificationsModal() {
  const { closeModal, openModal } = useCustomerUi()
  const notifications = useItems<AppNotification>("/notifications")
  const bookings = useItems<Booking>("/bookings")
  const markRead = useAction(() => api("/notifications/read", { method: "POST" }), { invalidate: ["/notifications"] })
  const active = bookings.items.find((b) => b.job && ["accepted", "clocked_in", "ready", "assigned"].includes(b.job.state))
  useEffect(() => {
    if (notifications.items.some((n) => !n.read)) markRead.run()
    // once, when the list has loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications.items.length])
  return (
    <>
      <div className="eyebrow">YOUR LATEST UPDATES</div>
      <h2>A little heads-up.</h2>
      {notifications.isPending ? <div className="kit-loading"><span className="kit-spinner" /> Loading…</div> : notifications.items.length === 0 ? <p>Nothing new right now. We&apos;ll tell you here when something happens.</p> : notifications.items.slice(0, 6).map((n) => (
        <div className="notification-item" key={n.id}>
          <Icon name={n.kind.includes("payment") ? "card" : n.kind.includes("verdict") || n.kind.includes("ready") ? "shield" : "car"} />
          <div>
            <h4>{n.title}</h4>
            <p>{n.body}</p>
            <small>{stamp(n.created_at)}</small>
          </div>
        </div>
      ))}
      {active ? (
        <button className="primary full" onClick={() => openModal({ name: "tracking", id: active.id })}>
          View active wash <Icon name="arrow" size={16} />
        </button>
      ) : (
        <Link className="secondary full link-btn" href="/workspace/customer/bookings" onClick={closeModal}>
          See my bookings
        </Link>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ the promise */

function ProofModal() {
  const { openModal } = useCustomerUi()
  const bookings = useItems<Booking>("/bookings")
  const ready = bookings.items.find((b) => b.job?.state === "ready")
  return (
    <>
      <div className="eyebrow">THE VERIFIED WASH PROMISE</div>
      <h2>Three proofs. Zero guesswork.</h2>
      {[
        "GPS trail confirms the washman arrived and worked at your location.",
        "Your registered plate is scanned at arrival and again before submission.",
        "Your own verdict confirms the service happened — and how well.",
      ].map((text, i) => (
        <div className="notification-item" key={text}>
          <span className="step-number">{i + 1}</span>
          <p>{text}</p>
        </div>
      ))}
      <p>A wash doesn&apos;t close until all three signals agree. If something isn&apos;t right, our operations team reviews the evidence.</p>
      {ready?.job && (
        <button className="primary full" onClick={() => openModal({ name: "verdict", id: ready.job!.id })}>
          Give your verdict now <Icon name="arrow" size={16} />
        </button>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ receipt / wash record */

function ReceiptModal({ bookingId }: { bookingId: string }) {
  const { closeModal } = useCustomerUi()
  const tracking = useResource<Tracking>(`/bookings/${bookingId}/tracking`)
  const receipts = useItems<Receipt>("/receipts")
  const t = tracking.data
  const receipt = receipts.items.find((r) => r.for.id === bookingId)
  if (!t) return <div className="kit-loading"><span className="kit-spinner" /> Loading…</div>
  const b = t.booking
  const card = t.trust_card as { name?: string } | null
  return (
    <>
      <div className="eyebrow">WASH PASSPORT · VERIFIED RECORD</div>
      <h2>Every detail, accounted for.</h2>
      <div className="review-summary">
        <h3>{b.service_name}</h3>
        <p>
          {b.vehicle?.make} {b.vehicle?.model} · {b.vehicle_plate}
        </p>
        <p>
          {day(b.starts_at)} · {b.location?.label}, {b.location?.area}
        </p>
        {card?.name && <p>Washman: {card.name}</p>}
        <hr />
        {t.stages.map((s) => (
          <p key={s.key}>
            <Icon name="shield" size={17} />
            {s.label} · {s.reached_at ? stamp(s.reached_at) : "not reached"}
          </p>
        ))}
        <hr />
        <div>
          <strong>{receipt ? `Paid · ${receipt.receipt_no}` : bookingStatusLabel(b.status, b.job?.state)}</strong>
          <strong>{b.billing === "subscription" ? "Credit" : naira(b.amount_kobo)}</strong>
        </div>
      </div>
      <Link className="primary full link-btn" href={`/workspace/customer/bookings/${bookingId}`} onClick={closeModal}>
        Open the full booking <Icon name="arrow" size={16} />
      </Link>
    </>
  )
}

/* ------------------------------------------------------------------ plan */

function PlanModal({ planId }: { planId: string }) {
  const { closeModal } = useCustomerUi()
  const router = useRouter()
  const plans = useItems<Plan>("/subscription-plans")
  const subscriptions = useItems<Subscription>("/subscriptions")
  const plan = plans.items.find((p) => p.id === planId)
  const current = subscriptions.items.find((s) => s.plan.id === planId && ["active", "grace"].includes(s.status))
  const buy = useAction(() => api<{ payment: Payment }>("/subscriptions", { method: "POST", headers: { "Idempotency-Key": idempotencyKey() }, body: { plan_id: planId, auto_renew: true } }), {
    invalidate: ["/subscriptions"], onSuccess: ({ payment }) => { closeModal(); startPayment(payment, (url) => router.push(url)) },
  })
  if (!plan) return <div className="kit-loading"><span className="kit-spinner" /> Loading…</div>
  return (
    <>
      <div className="eyebrow">CARE ON YOUR TERMS</div>
      <h2>{plan.name}</h2>
      <p>
        {plan.washes_included} washes over {plan.months} month{plan.months > 1 ? "s" : ""}. Outdoor service at your saved places. Every wash includes GPS, plate matching and your verdict.
      </p>
      <div className="review-summary">
        <div>
          <strong>Price</strong>
          <h3>{naira(plan.price_kobo)}</h3>
        </div>
        {plan.rollover_max > 0 && <p>Up to {plan.rollover_max} unused washes roll over when you renew.</p>}
        <p>Auto-renewal is on by default and can be switched off at any time.</p>
      </div>
      {buy.error && <p className="form-error" role="alert">{buy.error.message}</p>}
      {current ? (
        <button className="primary full" onClick={closeModal}>
          Keep my plan <Icon name="check" size={17} />
        </button>
      ) : (
        <button className="primary full" disabled={buy.pending} onClick={() => buy.run()}>
          {buy.pending ? "Opening checkout…" : "Choose this plan"} <Icon name="check" size={17} />
        </button>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ help & settings */

function SettingsModal() {
  const { closeModal, notify } = useCustomerUi()
  const signOut = useSignOut()
  const me = useResource<User>("/me")
  const prefs = useResource<Preferences>("/preferences")
  const places = useItems<Place>("/locations")
  const [name, setName] = useState<string | null>(null)
  const [place, setPlace] = useState<string | null>(null)
  const [push, setPush] = useState<boolean | null>(null)

  const save = useAction(
    async () => {
      if (name !== null && name.trim()) await api("/me", { method: "PATCH", body: { name: name.trim() } })
      await api("/preferences", { method: "PUT", body: { default_location_id: (place ?? prefs.data?.default_location_id) || null, notifications: { ...prefs.data?.notifications, push: push ?? prefs.data?.notifications.push ?? true } } })
    },
    { invalidate: ["/me", "/preferences"], onSuccess: () => { closeModal(); notify("Preferences saved.") } },
  )
  if (!me.data || !prefs.data) return <div className="kit-loading"><span className="kit-spinner" /> Loading…</div>
  return (
    <>
      <div className="eyebrow">YOUR PERSONAL SPACE</div>
      <h2>{me.data.name}</h2>
      <p>Manage your preferences and saved outdoor locations.</p>
      <form onSubmit={(e) => { e.preventDefault(); save.run() }}>
        <label>
          Display name
          <input value={name ?? me.data.name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          Default outdoor location
          <select value={place ?? prefs.data.default_location_id ?? ""} onChange={(e) => setPlace(e.target.value)}>
            <option value="">None</option>
            {places.items.map((p) => <option key={p.id} value={p.id}>{p.label} · {p.area}</option>)}
          </select>
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={push ?? prefs.data.notifications.push} onChange={(e) => setPush(e.target.checked)} /> Receive wash progress notifications
        </label>
        <button className="primary full" disabled={save.pending}>
          {save.pending ? "Saving…" : "Save preferences"} <Icon name="check" size={16} />
        </button>
      </form>
      <Link className="text-button centered link-btn" href="/workspace/customer/settings" onClick={closeModal}>
        Password, terms and your data
      </Link>
      <button className="text-button centered" onClick={signOut}>
        Sign out
      </button>
    </>
  )
}
