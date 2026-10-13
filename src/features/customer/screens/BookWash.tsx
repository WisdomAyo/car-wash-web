"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Empty, Loading, Notice, PageHeader, Panel, Plate } from "@/components/app/kit"
import { Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { useAction, useItems, useList } from "@/lib/api/hooks"
import type { Booking, Payment, Place, Service, Subscription, Vehicle } from "@/lib/api/types"
import { day, humanise, naira, window_ } from "@/lib/format"
import PlaceForm from "@/features/shared/PlaceForm"
import { startPayment } from "@/features/shared/payments"
import SlotPicker from "@/features/shared/SlotPicker"
import VehicleForm from "@/features/shared/VehicleForm"

const STEPS = ["Car & care", "Place", "Time", "Review"]

/** Book a wash in four steps. The price shown is the price charged: the server sets it from the service and vehicle type. */
export default function BookWash({ base, presetVehicle }: { base: string; presetVehicle?: string }) {
  const router = useRouter()
  const vehicles = useList<Vehicle>("/vehicles")
  const places = useList<Place>("/locations")
  const services = useItems<Service>("/services")
  const subscriptions = useItems<Subscription>("/subscriptions")

  const [step, setStep] = useState(0)
  const [vehicleId, setVehicleId] = useState(presetVehicle ?? "")
  const [serviceId, setServiceId] = useState("")
  const [placeId, setPlaceId] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [useCredit, setUseCredit] = useState(false)
  const [adding, setAdding] = useState<"vehicle" | "place" | null>(null)

  const vehicle = vehicles.items.find((v) => v.id === (vehicleId || vehicles.items[0]?.id))
  const place = places.items.find((p) => p.id === (placeId || places.items[0]?.id))
  const service = services.items.find((s) => s.id === (serviceId || services.items[0]?.id))
  const price = vehicle && service ? service.prices[vehicle.type] : undefined
  const credit = subscriptions.items.find((s) => s.status === "active" && s.washes_remaining > 0)

  const book = useAction(
    async () =>
      api<{ booking: Booking; payment: Payment | null }>("/bookings", {
        method: "POST",
        headers: { "Idempotency-Key": idempotencyKey() },
        body: { vehicle_id: vehicle!.id, service_id: service!.id, location_id: place!.id, starts_at: startsAt, use_subscription: useCredit && Boolean(credit) },
      }),
    {
      invalidate: ["/bookings", "/subscriptions"],
      onSuccess: ({ booking, payment }) => {
        if (payment) startPayment(payment, (url) => router.push(url))
        else router.push(`${base}/bookings/${booking.id}`)
      },
    },
  )

  if (vehicles.isPending || places.isPending || services.isPending) return <Loading />

  const needsVehicle = vehicles.items.length === 0
  const needsPlace = places.items.length === 0

  return (
    <>
      <PageHeader eyebrow="A FRESH START" title="Book a wash" description="Pick the car, the care, the place and the time. We handle the rest." />
      <div className="kit-steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => <span key={s} className={i <= step ? "on" : ""} />)}
      </div>

      {step === 0 && (
        <div className="kit-grid cols-2">
          <Panel title="Which car?" action={<button className="kit-link" onClick={() => setAdding("vehicle")}>+ Add a vehicle</button>}>
            {needsVehicle ? (
              <Empty icon="car" title="Add your car first." action={<button className="primary" onClick={() => setAdding("vehicle")}>Add a vehicle</button>} />
            ) : (
              <div className="kit-stack">
                {vehicles.items.map((v) => (
                  <button key={v.id} type="button" className={`kit-chip ${vehicle?.id === v.id ? "selected" : ""}`} style={{ textAlign: "left", borderRadius: 12, padding: 14 }} onClick={() => setVehicleId(v.id)}>
                    <Plate value={v.plate} /> <b>{v.make} {v.model}</b> · {v.colour}
                  </button>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Which care?">
            <div className="kit-stack">
              {services.items.map((s) => {
                const p = vehicle ? s.prices[vehicle.type] : undefined
                return (
                  <button key={s.id} type="button" className={`kit-chip ${service?.id === s.id ? "selected" : ""}`} style={{ textAlign: "left", borderRadius: 12, padding: 14 }} onClick={() => setServiceId(s.id)}>
                    <b>{s.name}</b> · about {s.duration_minutes} min{p !== undefined && <> · <b>{naira(p)}</b></>}
                    {s.description && <div className="kit-muted">{s.description}</div>}
                  </button>
                )
              })}
              {vehicle && price === undefined && <Notice tone="warn">We do not have a price for a {humanise(vehicle.type)} on this service.</Notice>}
            </div>
          </Panel>
        </div>
      )}

      {step === 1 && (
        <Panel title="Where is the car?" description="It must be outdoors: a driveway, car park or street frontage." action={<button className="kit-link" onClick={() => setAdding("place")}>+ Add a place</button>}>
          {needsPlace ? (
            <Empty icon="pin" title="Add a place first." action={<button className="primary" onClick={() => setAdding("place")}>Add a place</button>} />
          ) : (
            <div className="kit-stack">
              {places.items.map((p) => (
                <button key={p.id} type="button" className={`kit-chip ${place?.id === p.id ? "selected" : ""}`} style={{ textAlign: "left", borderRadius: 12, padding: 14 }} onClick={() => setPlaceId(p.id)}>
                  <b>{p.label}</b> · {p.address}, {p.area}
                </button>
              ))}
            </div>
          )}
        </Panel>
      )}

      {step === 2 && (
        <Panel title="When suits you?" description="Washes are booked in two-hour windows (Lagos time).">
          <SlotPicker state={place?.state ?? "LA"} value={startsAt} onChange={setStartsAt} />
        </Panel>
      )}

      {step === 3 && vehicle && service && place && (
        <div className="kit-grid side">
          <Panel title="Check and confirm">
            <dl className="kit-facts">
              <div><dt>Car</dt><dd><Plate value={vehicle.plate} /> {vehicle.make} {vehicle.model}</dd></div>
              <div><dt>Care</dt><dd>{service.name}</dd></div>
              <div><dt>Place</dt><dd>{place.label}, {place.address}</dd></div>
              <div><dt>When</dt><dd>{day(startsAt)} · {window_(startsAt, new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString())}</dd></div>
            </dl>
            <p className="kit-hint"><Icon name="shield" size={16} /> Outdoor-only service. The washman proves they are at your place, with your plate, before they start.</p>
          </Panel>
          <Panel title="Payment">
            <div className="kit-metrics" style={{ gridTemplateColumns: "1fr", marginBottom: 12 }}>
              <article><div>You pay</div><h3>{useCredit && credit ? "1 credit" : price !== undefined ? naira(price) : "—"}</h3><p>{useCredit && credit ? `${credit.washes_remaining - 1} credits left after this` : "Any referral reward is applied automatically."}</p></article>
            </div>
            {credit && (
              <label className="kit-field check">
                <input type="checkbox" checked={useCredit} onChange={(e) => setUseCredit(e.target.checked)} />
                <span>Use a subscription credit ({credit.washes_remaining} left on {credit.plan.name})</span>
              </label>
            )}
            {book.error && <p className="form-error" role="alert">{book.error.message}</p>}
            <button className="primary kit-wide" style={{ marginTop: 14 }} disabled={book.pending || (price === undefined && !useCredit)} onClick={() => book.run()}>
              {book.pending ? "Booking…" : useCredit && credit ? "Book with a credit" : "Confirm and pay"} <Icon name="arrow" size={17} />
            </button>
          </Panel>
        </div>
      )}

      <div className="kit-row spread" style={{ marginTop: 6 }}>
        <button className="secondary" onClick={() => setStep(step - 1)} disabled={step === 0}>Back</button>
        {step < 3 && (
          <button
            className="primary"
            onClick={() => setStep(step + 1)}
            disabled={(step === 0 && (!vehicle || !service || price === undefined)) || (step === 1 && !place) || (step === 2 && !startsAt)}
          >
            Continue <Icon name="arrow" size={17} />
          </button>
        )}
      </div>

      {adding === "vehicle" && <VehicleForm onClose={() => setAdding(null)} onSaved={(v) => setVehicleId(v.id)} />}
      {adding === "place" && <PlaceForm onClose={() => setAdding(null)} onSaved={(p) => setPlaceId(p.id)} />}
    </>
  )
}

