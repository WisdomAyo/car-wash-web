import { useRef, useState } from "react"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import { nigeriaAppointment, nigeriaToday } from "../../domain/nigeria"
import {
  changeBooking,
  initializePayment,
  requestBooking,
  type CustomerRecords,
  type Booking,
} from "../../lib/customerApi"
import { Select } from "./FormControls"
import type { SaveAction } from "./VehiclesPanel"

const money = (kobo: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100)
const appointment = (date: string) =>
  new Intl.DateTimeFormat("en-NG", {
    timeZone: "Africa/Lagos",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date))

export default function BookingsPanel({
  records,
  busy,
  save,
}: {
  records: CustomerRecords
  busy: boolean
  save: SaveAction
}) {
  const [serviceId, setServiceId] = useState(records.services[0]?.id || "")
  const [review, setReview] = useState<Booking | null>(null)
  const paymentRequests = useRef<Record<string, string>>({})
  const request = useRef<{
    fingerprint: string
    id: string
  } | null>(null)
  const service = records.services.find((item) => item.id === serviceId)
  const ready =
    records.vehicles.length > 0 && records.locations.length > 0 && !!service
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="content-panel">
        <Heading level={2}>A fresh start, on your schedule</Heading>
        <p className="mt-3 text-base text-(--muted)">
          Request a wash anywhere in Nigeria. Times are in West Africa Time
          (WAT).
        </p>
        {!ready && (
          <p className="policy-note">
            Add a vehicle and outdoor location first. A service must also be
            available.
          </p>
        )}
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            const scheduledAt = nigeriaAppointment(
              String(data.get("date")),
              String(data.get("time")),
            )
            const value = {
              vehicleId: String(data.get("vehicle")),
              locationId: String(data.get("location")),
              serviceId,
              scheduledAt,
            }
            const fingerprint = JSON.stringify(value)
            if (request.current?.fingerprint !== fingerprint)
              request.current = { fingerprint, id: crypto.randomUUID() }
            if (
              await save(
                () =>
                  requestBooking({ ...value, requestId: request.current!.id }),
                "Request saved. Complete payment before operations can assign a washman.",
              )
            ) {
              form.reset()
              request.current = null
            }
          }}
        >
          <fieldset disabled={busy || !ready} className="border-0 p-0">
            <label>
              Vehicle
              <Select name="vehicle" required defaultValue="">
                <option value="" disabled>
                  Choose a vehicle
                </option>
                {records.vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} · {vehicle.plate}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Outdoor location
              <Select name="location" required defaultValue="">
                <option value="" disabled>
                  Choose an outdoor location
                </option>
                {records.locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.label} · {location.city}, {location.state}
                  </option>
                ))}
              </Select>
            </label>
            <label>
              Service
              <Select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                {records.services.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {money(item.price_kobo)}
                  </option>
                ))}
              </Select>
            </label>
            <div className="form-grid">
              <label>
                Date
                <Input name="date" type="date" min={nigeriaToday()} required />
              </label>
              <label>
                Time (WAT)
                <Input name="time" type="time" required />
              </label>
            </div>
            <div className="review-summary">
              <div>
                <span>Indicative service quote</span>
                <strong>
                  {service ? money(service.price_kobo) : "Unavailable"}
                </strong>
              </div>
              <p>
                Price is validated by the server. No payment is taken.
                Availability is not guaranteed.
              </p>
              <p>
                Choose a time at least 2 hours ahead and within 90 days.
                Requests may be changed until{" "}
                {service?.cancellation_minutes ?? "—"} minutes before the
                appointment.
              </p>
            </div>
            <Button type="submit" className="primary full">
              Save booking request <Icon name="arrow" size={18} />
            </Button>
          </fieldset>
        </form>
      </section>
      <section className="content-panel">
        <Heading level={2}>Your requests</Heading>
        {!records.bookings.length && (
          <p className="py-8">
            No booking requests yet. Your saved requests will appear here.
          </p>
        )}
        {records.bookings.map((booking) => {
          const payment = records.payments.find(
            (item) => item.booking_id === booking.id,
          )
          const editable =
            ["pending_review", "payment_pending"].includes(booking.status) &&
            new Date(booking.scheduled_at).getTime() -
              booking.cancellation_minutes * 60000 >
              Date.now()
          return (
            <article key={booking.id} className="border-b border-(--line) py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Heading level={3} className="text-lg">
                  {booking.service_name}
                </Heading>
                <span className="status-badge">
                  {{
                    pending_review: "Awaiting payment",
                    payment_pending: "Payment pending",
                    paid_pending_assignment: "Paid · Awaiting assignment",
                    assigned: "Washman assigned",
                    accepted: "Accepted",
                    clocked_in: "Clocked in",
                    washing: "Washing",
                    ready: "Verdict needed",
                    verdict_given: "Verdict recorded",
                    submitted: "Final checks",
                    closed: "Verified & closed",
                    disputed: "Needs review",
                    unconfirmed: "Closed unconfirmed",
                    cancelled: "Cancelled",
                  }[booking.status] || booking.status}
                </span>
              </div>
              <p className="mt-3">
                {booking.vehicle_label} · {booking.plate}
              </p>
              <p className="mt-2">{booking.location_label}</p>
              <p className="mt-2">{appointment(booking.scheduled_at)} WAT</p>
              <p className="mt-2 font-semibold">
                {money(booking.price_kobo)} ·{" "}
                {payment?.status === "paid"
                  ? "Paid"
                  : payment?.status === "failed"
                    ? "Payment failed"
                    : payment?.status === "pending"
                      ? "Checkout opened"
                      : "Not paid"}
              </p>
              <p className="policy-note">
                Reference {booking.id.slice(0, 8).toUpperCase()}
              </p>
              {editable && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    disabled={busy}
                    className="primary"
                    onClick={() => {
                      paymentRequests.current[booking.id] ||=
                        crypto.randomUUID()
                      void save(async () => {
                        const authorizationUrl = await initializePayment(
                          booking.id,
                          paymentRequests.current[booking.id],
                        )
                        window.location.assign(authorizationUrl)
                      }, "Secure checkout initialized.")
                    }}
                  >
                    Pay securely
                  </Button>
                  <Button
                    disabled={busy}
                    className="secondary"
                    onClick={() => setReview(booking)}
                  >
                    Change or cancel
                  </Button>
                </div>
              )}
              {!editable && booking.status !== "cancelled" && (
                <p className="policy-note">
                  The change window has closed. Open a support ticket for help.
                </p>
              )}
              {review?.id === booking.id && (
                <div className="review-summary">
                  <Heading level={4} className="text-base">
                    Manage this request
                  </Heading>
                  <p>
                    Cancelling removes this request from review. No charge or
                    refund is involved.
                  </p>
                  <form
                    onSubmit={async (event) => {
                      event.preventDefault()
                      const data = new FormData(event.currentTarget)
                      const date = nigeriaAppointment(
                        String(data.get("date")),
                        String(data.get("time")),
                      )
                      if (
                        await save(
                          () => changeBooking(booking.id, date),
                          "Request rescheduled.",
                        )
                      )
                        setReview(null)
                    }}
                  >
                    <fieldset disabled={busy} className="border-0 p-0">
                      <div className="form-grid">
                        <label>
                          New date
                          <Input
                            type="date"
                            name="date"
                            min={nigeriaToday()}
                            required
                          />
                        </label>
                        <label>
                          New time (WAT)
                          <Input type="time" name="time" required />
                        </label>
                      </div>
                      <Button type="submit" className="primary full">
                        Save new time
                      </Button>
                    </fieldset>
                  </form>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button
                      className="secondary"
                      disabled={busy}
                      onClick={async () => {
                        if (
                          await save(
                            () => changeBooking(booking.id, null),
                            "Request cancelled.",
                          )
                        )
                          setReview(null)
                      }}
                    >
                      Confirm cancellation
                    </Button>
                    <Button
                      className="text-button"
                      disabled={busy}
                      onClick={() => setReview(null)}
                    >
                      Keep booking
                    </Button>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </section>
    </div>
  )
}
