"use client"

import Link from "next/link"
import { useEffect } from "react"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import type { IconName } from "@/components/Visuals"
import { useItems, useList, useResource } from "@/lib/api/hooks"
import type { Booking, Referrals, Service, Subscription, User, Vehicle } from "@/lib/api/types"
import { day, humanise, naira, time, window_ } from "@/lib/format"
import { bookingStatusLabel, jobForCustomer } from "@/lib/labels"
import { useCustomerUi } from "../CustomerUi"
import { PageHeading, VehicleArt, isLive, isUpcoming, WaterLine, useTracking, type TrustCardData } from "../parts"

const base = "/workspace/customer"
const pad = (n: number) => String(n).padStart(2, "0")

const SERVICE_STYLE: { tag: string; icon: IconName }[] = [
  { tag: "A fresh start", icon: "drop" },
  { tag: "MOST POPULAR", icon: "star" },
  { tag: "The full treatment", icon: "shield" },
]

/** The personal dashboard: the same hero, stats, live wash, garage, plan and services as ever, fed by the account. */
export default function Overview({ autoBook }: { autoBook?: { vehicleId?: string } }) {
  const ui = useCustomerUi()
  const me = useResource<User>("/me")
  const bookings = useList<Booking>("/bookings")
  const vehicles = useList<Vehicle>("/vehicles")
  const services = useItems<Service>("/services")
  const subscriptions = useItems<Subscription>("/subscriptions")
  const referrals = useResource<Referrals>("/referrals")

  const { openModal } = ui
  useEffect(() => {
    if (autoBook) openModal({ name: "booking", vehicleId: autoBook.vehicleId })
    // The booking route opens the wizard once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const firstName = (me.data?.name ?? "").split(" ")[0]
  const sorted = [...bookings.items].sort((a, b) => a.starts_at.localeCompare(b.starts_at))
  const active = sorted.find(isLive) ?? sorted.find(isUpcoming)
  const completed = bookings.items.filter((b) => b.job?.state === "closed").length
  const plan = subscriptions.items.find((s) => ["active", "grace"].includes(s.status))
  const pricingType = vehicles.items[0]?.type ?? "sedan"
  const lastWash = (v: Vehicle) => bookings.items.find((b) => b.vehicle_plate === v.plate && b.job?.state === "closed")
  const nextFor = (v: Vehicle) => sorted.find((b) => b.vehicle_plate === v.plate && isUpcoming(b))

  return (
    <>
      <PageHeading title={firstName ? `A fresh start, ${firstName}.` : "A fresh start."}>Less time at the wash bay. More time for what matters.</PageHeading>
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span /> THE CLEAN YOU CAN COUNT ON
          </div>
          <h2>
            Your day moves fast.
            <br />
            Let us handle <em>the shine.</em>
          </h2>
          <p>
            A spotless car, without going anywhere.
            <br />
            Screened professionals. Every wash, verified.
          </p>
          <button className="primary" onClick={() => openModal("booking")}>
            Give your car a fresh start <Icon name="arrow" size={18} />
          </button>
          <div className="hero-proof">
            <Icon name="shield" size={15} />
            GPS tracked <b>·</b> Plate matched <b>·</b> You confirm
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="spark spark-one">✦</span>
          <span className="spark spark-two">✦</span>
          <CarArt />
          <div className="floating-proof">
            <span>
              <Icon name="shield" size={18} />
            </span>
            <div>
              Not just clean. Proven.
              <small>The Go-Wash promise</small>
            </div>
            <Icon name="check" size={16} />
          </div>
        </div>
      </section>

      <section className="stats-row">
        <div>
          <span className="stat-icon">
            <Icon name="car" />
          </span>
          <div>
            <strong>{vehicles.isPending ? "…" : pad(vehicles.items.length)}</strong>
            <small>Vehicles in your garage</small>
          </div>
          <Link className="stat-link" href={`${base}/vehicles`} aria-label="View vehicles">
            <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div>
          <span className="stat-icon">
            <Icon name="drop" />
          </span>
          <div>
            <strong>
              {bookings.isPending ? "…" : `${completed}${bookings.hasMore ? "+" : ""}`} <span>washes</span>
            </strong>
            <small>A little care goes a long way</small>
          </div>
          <span className="tiny-tag">All verified</span>
        </div>
        <div>
          <span className="stat-icon">
            <Icon name="card" />
          </span>
          <div>
            <strong>
              {plan ? pad(plan.washes_remaining) : "—"} <span>{plan ? "remaining" : "no plan"}</span>
            </strong>
            <small>{plan ? `Your ${plan.plan.name} plan` : "Save with a monthly plan"}</small>
          </div>
          <Link className="stat-link" href={`${base}/subscriptions`} aria-label="View subscription">
            <Icon name="arrow" size={17} />
          </Link>
        </div>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-left">
          <section className="section">
            <div className="section-heading">
              <h3>Your next fresh start</h3>
              <Link className="text-button" href={`${base}/bookings`}>
                All bookings <Icon name="arrow" size={16} />
              </Link>
            </div>
            {active ? (
              <ActiveBooking booking={active} />
            ) : (
              <div className="active-booking">
                <div className="booking-top">
                  <div className="booking-symbol">
                    <Icon name="drop" size={23} />
                  </div>
                  <div>
                    <h4>{bookings.isPending ? "Looking for your next wash…" : "Nothing on the calendar."}</h4>
                    <p>Pick a time and we&apos;ll come to your car.</p>
                  </div>
                  <button className="secondary" onClick={() => openModal("booking")}>
                    Book a wash <Icon name="arrow" size={15} />
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="section">
            <div className="section-heading">
              <h3>
                Your garage <span className="heading-count">{vehicles.items.length}</span>
              </h3>
              <button className="text-button" onClick={() => openModal("vehicle")}>
                <Icon name="plus" size={15} /> Add vehicle
              </button>
            </div>
            <div className="garage-grid">
              {vehicles.items.slice(0, 4).map((v, i) => {
                const next = nextFor(v)
                const last = lastWash(v)
                return (
                  <div className="vehicle-card" key={v.id}>
                    <div className="vehicle-card-top">
                      <span>{i === 0 ? "YOUR DAILY DRIVE" : "THE EVERYDAY ONE"}</span>
                      <Link className="card-chevron" href={`${base}/vehicles/${v.id}`} aria-label={`View ${v.make} ${v.model} passport`}>
                        <Icon name="chevron" size={16} />
                      </Link>
                    </div>
                    <VehicleArt vehicle={v} />
                    <h4>
                      {v.make} {v.model}
                    </h4>
                    <div className="vehicle-info">
                      <Plate>{v.plate}</Plate>
                      <span>
                        {humanise(v.colour)} · {v.type === "suv" ? "SUV" : humanise(v.type)}
                      </span>
                    </div>
                    <div className="vehicle-footer">
                      <span>
                        <Icon name="shield" size={14} />
                        {next ? "A fresh wash is on its way" : last ? `Last washed ${day(last.starts_at)}` : "Ready for its first wash"}
                      </span>
                      <button onClick={() => openModal({ name: "booking", vehicleId: v.id })}>
                        Book again <Icon name="arrow" size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {!vehicles.isPending && vehicles.items.length === 0 && (
                <div className="vehicle-card">
                  <CarArt silver />
                  <h4>Your garage is empty.</h4>
                  <div className="vehicle-footer">
                    <span>
                      <Icon name="shield" size={14} />
                      Add the car you want washed.
                    </span>
                    <button onClick={() => openModal("vehicle")}>
                      Add vehicle <Icon name="plus" size={13} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="dashboard-right">
          <section className="subscription-card">
            <div className="subscription-top">
              <span className="sub-icon">
                <Icon name="drop" />
              </span>
              <span>YOUR SHINE, ON REPEAT</span>
            </div>
            <h3>
              Good habits.
              <br />
              Great-looking car.
            </h3>
            {plan ? (
              <>
                <p>
                  You&apos;re on the {plan.plan.name} plan.
                  <br />
                  {active ? "A clean car is already on the calendar." : "Your next wash is one tap away."}
                </p>
                <div className="wash-credit">
                  <strong>
                    {plan.washes_remaining} <span>/ {plan.washes_included} washes left</span>
                  </strong>
                  <span className="plan-pill">{plan.plan.months > 1 ? `${plan.plan.months} MONTHS` : "MONTHLY"}</span>
                </div>
                <div className="credit-progress">
                  <span style={{ width: `${plan.washes_included ? Math.round((plan.washes_remaining / plan.washes_included) * 100) : 0}%` }} />
                </div>
                <div className="renewal">
                  {plan.auto_renew ? "Renews" : "Ends"} {plan.ends_at ? day(plan.ends_at) : "—"} <b>{naira(plan.amount_kobo)}</b>
                </div>
              </>
            ) : (
              <>
                <p>
                  Prepay a bundle of washes and save.
                  <br />
                  Every wash you book uses one credit.
                </p>
                <div className="wash-credit">
                  <strong>
                    0 <span>washes in plan</span>
                  </strong>
                  <span className="plan-pill">NO PLAN</span>
                </div>
                <div className="credit-progress">
                  <span style={{ width: "0%" }} />
                </div>
                <div className="renewal">Choose a plan whenever you&apos;re ready.</div>
              </>
            )}
            <Link className="plan-link" href={`${base}/subscriptions`}>
              {plan ? "Manage your plan" : "See the plans"} <Icon name="arrow" size={17} />
            </Link>
          </section>

          <section className="trust-card">
            <div className="trust-heading">
              <span>
                <Icon name="shield" size={22} />
              </span>
              <h4>
                Clean is good.
                <br />
                Verified is better.
              </h4>
            </div>
            <p>
              Every wash comes with three proofs.
              <br />
              Because your peace of mind matters.
            </p>
            {[
              { icon: "pin" as IconName, title: "Right place", text: "GPS-verified arrival and wash" },
              { icon: "car" as IconName, title: "Right vehicle", text: "Your plate, matched twice" },
              { icon: "check" as IconName, title: "Your say. Always.", text: "You confirm before we close" },
            ].map((item) => (
              <div className="proof-item" key={item.title}>
                <span>
                  <Icon name={item.icon} size={17} />
                </span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
                <Icon name="check" size={14} />
              </div>
            ))}
            <button className="text-button" onClick={() => openModal("proof")}>
              Meet the Verified Wash <Icon name="arrow" size={15} />
            </button>
          </section>
        </aside>
      </div>

      <section className="section services-section">
        <div className="section-heading">
          <div>
            <h3>A little clean. Or the whole glow.</h3>
            <p>Carefully crafted care for every kind of day.</p>
          </div>
          <span className="pricing-note">
            {pricingType === "suv" ? "SUV" : humanise(pricingType)} pricing <Icon name="car" size={16} />
          </span>
        </div>
        <div className="service-grid">
          {services.items.slice(0, 3).map((s, i) => (
            <div className={`service-card ${i === 1 ? "featured" : ""}`} key={s.id}>
              <div className="service-top">
                <span className="service-icon">
                  <Icon name={SERVICE_STYLE[i].icon} size={24} />
                </span>
                <span className={i === 1 ? "popular-tag" : "service-tag"}>{SERVICE_STYLE[i].tag}</span>
              </div>
              <h4>{s.name}</h4>
              <p>{s.description}</p>
              <div className="service-bottom">
                <strong>
                  {s.prices[pricingType] !== undefined ? naira(s.prices[pricingType]) : "—"}
                  <small>
                    <Icon name="clock" size={12} />
                    About {s.duration_minutes} min
                  </small>
                </strong>
                <button aria-label={`Book ${s.name}`} onClick={() => openModal({ name: "booking", serviceId: s.id })}>
                  <Icon name="arrow" size={19} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {referrals.data?.enabled && (
        <div className="referral-strip">
          <span className="referral-icon">
            <Icon name="gift" size={24} />
          </span>
          <div>
            <h4>Good things are better shared.</h4>
            <p>
              Give a friend {naira(referrals.data.offer.friend_gets_kobo)} off their first wash. Get {naira(referrals.data.offer.you_get_kobo)} when they book.
            </p>
          </div>
          <Link className="referral-link" href={`${base}/referrals`}>
            Share the shine <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
    </>
  )
}

/** The wash that is next, with its real stages and washman. */
function ActiveBooking({ booking }: { booking: Booking }) {
  const { openModal } = useCustomerUi()
  const tracking = useTracking(booking)
  const card = tracking.data?.trust_card as TrustCardData | null | undefined
  const stages = tracking.data?.stages ?? []
  const state = booking.job?.state
  const ready = state === "ready"

  return (
    <div className="active-booking">
      <div className="booking-top">
        <div className="booking-symbol">
          <Icon name="drop" size={23} />
        </div>
        <div>
          <h4>{booking.service_name}</h4>
          <p>
            {booking.vehicle ? `${booking.vehicle.make} ${booking.vehicle.model}` : "Your vehicle"} <span>·</span> <Plate>{booking.vehicle_plate}</Plate>
          </p>
        </div>
        <span className="status-badge">
          <i />
          {bookingStatusLabel(booking.status, state)}
        </span>
      </div>
      <div className="booking-details">
        <span>
          <Icon name="calendar" size={16} />
          {day(booking.starts_at)}
        </span>
        <span>
          <Icon name="clock" size={16} />
          {window_(booking.starts_at, booking.ends_at)}
        </span>
        <span>
          <Icon name="pin" size={16} />
          {booking.location ? `${booking.location.label}, ${booking.location.area}` : "Your saved place"}
        </span>
      </div>
      {stages.length > 0 && <WaterLine stages={stages} />}
      <div className="washman-row">
        <div className="washman-avatar">{card ? card.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : "GW"}</div>
        <div>
          {card ? (
            <>
              <strong>
                {card.name}{" "}
                {card.verified && (
                  <span className="verified-inline">
                    <Icon name="shield" size={13} />
                    Verified
                  </span>
                )}
              </strong>
              <small>
                {card.rating ? (
                  <>
                    <Icon name="star" size={12} /> {card.rating} <span>·</span>{" "}
                  </>
                ) : null}
                {card.jobs_completed} washes completed
              </small>
            </>
          ) : (
            <>
              <strong>A verified washman is on the way to being assigned</strong>
              <small>You&apos;ll see their Trust Card here as soon as they accept.</small>
            </>
          )}
        </div>
        <div className="eta">
          <strong>{time(booking.starts_at)}</strong>
          <small>{jobForCustomer(state)}</small>
        </div>
        <button className="secondary" onClick={() => openModal(ready && booking.job ? { name: "verdict", id: booking.job.id } : { name: "tracking", id: booking.id })}>
          {ready ? "Give your verdict" : "Track wash"} <Icon name="arrow" size={15} />
        </button>
      </div>
    </div>
  )
}
