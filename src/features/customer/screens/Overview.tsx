"use client"

import Link from "next/link"
import { Async, Empty, Metrics, PageHeader, Panel, Plate } from "@/components/app/kit"
import { Icon } from "@/components/Visuals"
import { useList, useResource } from "@/lib/api/hooks"
import type { Booking, Referrals, User, Vehicle } from "@/lib/api/types"
import { day, naira, window_ } from "@/lib/format"
import BookingsTable, { BookingPill } from "@/features/shared/BookingsTable"

const base = "/workspace/customer"

export default function Overview() {
  const me = useResource<User>("/me")
  const bookings = useList<Booking>("/bookings")
  const vehicles = useList<Vehicle>("/vehicles")
  const referrals = useResource<Referrals>("/referrals")

  const upcoming = bookings.items.filter((b) => b.status === "confirmed" && !["closed", "cancelled"].includes(b.job?.state ?? ""))
  const completed = bookings.items.filter((b) => b.job?.state === "closed").length
  const next = [...upcoming].sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0]
  const firstName = me.data?.name.split(" ")[0]

  return (
    <>
      <PageHeader
        eyebrow="YOUR VEHICLE. OUR RESPONSIBILITY."
        title={firstName ? `A fresh start, ${firstName}.` : "A fresh start."}
        description="Less time at the wash bay. More time for what matters."
        action={<Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book a wash</Link>}
      />
      <Metrics
        items={[
          { label: "Upcoming washes", value: bookings.isPending ? "…" : upcoming.length, note: next ? `Next: ${day(next.starts_at)}` : "Nothing booked yet", icon: "calendar" },
          { label: "Washes completed", value: bookings.isPending ? "…" : completed, note: "Each one with a clear record", icon: "check" },
          { label: "Vehicles", value: vehicles.isPending ? "…" : vehicles.items.length, note: "In your garage", icon: "car" },
          { label: "Rewards ready", value: referrals.data ? naira(referrals.data.stats.available_kobo) : "…", note: "Applied automatically", icon: "gift" },
        ]}
      />
      <div className="kit-grid side">
        <Panel title="Your next wash" action={next ? <Link className="kit-link" href={`${base}/bookings/${next.id}`}>Open</Link> : undefined}>
          {bookings.isPending ? null : next ? (
            <div className="kit-item" style={{ padding: 0, border: 0 }}>
              <span className="kit-icon-tile"><Icon name="drop" size={20} /></span>
              <div className="grow">
                <h4>{next.service_name}</h4>
                <p>{day(next.starts_at)} · {window_(next.starts_at, next.ends_at)} · <Plate value={next.vehicle_plate} /></p>
              </div>
              <BookingPill booking={next} />
            </div>
          ) : (
            <Empty icon="drop" title="Nothing booked." action={<Link className="primary" href={`${base}/book`}>Book a wash</Link>}>Pick a time and we will come to your car.</Empty>
          )}
        </Panel>
        <Panel title="Invite a friend" description="Share your code. You both get a discount.">
          <Async query={referrals}>
            {(r) => (
              <div className="kit-stack">
                <span className="kit-mono" style={{ fontSize: 20, letterSpacing: 3, fontWeight: 700 }}>{r.code}</span>
                <Link className="kit-link" href={`${base}/referrals`}>See your rewards</Link>
              </div>
            )}
          </Async>
        </Panel>
      </div>
      <Panel title="Recent bookings" action={<Link className="kit-link" href={`${base}/bookings`}>All bookings</Link>}>
        <BookingsTable path="/bookings" hrefFor={(b) => `${base}/bookings/${b.id}`} emptyAction={<Link className="primary" href={`${base}/book`}>Book a wash</Link>} />
      </Panel>
    </>
  )
}
