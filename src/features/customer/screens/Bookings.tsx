"use client"

import Link from "next/link"
import { Icon } from "@/components/Visuals"
import { AsyncList, Empty } from "@/components/app/kit"
import { useList } from "@/lib/api/hooks"
import type { Booking } from "@/lib/api/types"
import { day } from "@/lib/format"
import { bookingStatusLabel } from "@/lib/labels"
import { useCustomerUi } from "../CustomerUi"
import { PageHeading, isLive } from "../parts"

const base = "/workspace/customer"

/** Upcoming and recent washes, as the care calendar. */
export default function Bookings() {
  const { openModal } = useCustomerUi()
  const list = useList<Booking>("/bookings")
  return (
    <>
      <PageHeading title="My bookings" />
      <section className="content-panel">
        <div className="section-heading">
          <h3>Upcoming &amp; recent washes</h3>
          <span className="status-badge">Your care calendar</span>
        </div>
        <AsyncList list={list} empty={<Empty icon="calendar" title="No bookings yet." action={<button className="primary" onClick={() => openModal("booking")}>Book a wash</button>}>When you book a wash it appears here, with its progress.</Empty>}>
          {(items) =>
            items.map((b) => (
              <div className="history-row" key={b.id}>
                <span className="stat-icon">
                  <Icon name="drop" />
                </span>
                <div>
                  <h4>
                    {b.service_name} · {day(b.starts_at)}
                  </h4>
                  <p>
                    {b.vehicle ? `${b.vehicle.make} ${b.vehicle.model}` : b.vehicle_plate} · {b.location ? `${b.location.label}, ${b.location.area}` : b.reference}
                  </p>
                </div>
                <span className="status-badge">{bookingStatusLabel(b.status, b.job?.state)}</span>
                {isLive(b) ? (
                  <button className="secondary" onClick={() => openModal({ name: "tracking", id: b.id })}>
                    Track wash <Icon name="chevron" size={15} />
                  </button>
                ) : null}
                <Link className="secondary" href={`${base}/bookings/${b.id}`}>
                  View details <Icon name="chevron" size={15} />
                </Link>
              </div>
            ))
          }
        </AsyncList>
      </section>
    </>
  )
}
