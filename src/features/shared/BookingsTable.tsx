"use client"

import { AsyncList, Empty, Pill, Plate, Table, Two } from "@/components/app/kit"
import { useList } from "@/lib/api/hooks"
import type { Booking } from "@/lib/api/types"
import { day, naira, window_ } from "@/lib/format"
import { bookingStatusLabel } from "@/lib/labels"

/** A booking's pill: the job's progress once there is one, the booking's own status before. */
export const BookingPill = ({ booking }: { booking: Booking }) => (
  <Pill status={booking.job?.state === "booked" ? booking.status : (booking.job?.state ?? booking.status)} label={bookingStatusLabel(booking.status, booking.job?.state)} />
)

/** Bookings from any list endpoint (`/bookings`, `/organisations/{id}/bookings`), each row linking to `hrefFor(booking)`. */
export default function BookingsTable({
  path,
  hrefFor,
  query,
  emptyAction,
}: {
  path: string
  hrefFor: (booking: Booking) => string
  query?: Record<string, string>
  emptyAction?: React.ReactNode
}) {
  const list = useList<Booking>(path, query)
  return (
    <AsyncList
      list={list}
      empty={
        <Empty icon="calendar" title="No bookings yet." action={emptyAction}>
          When you book a wash it appears here, with its progress.
        </Empty>
      }
    >
      {(items) => (
        <Table
          rows={items}
          rowKey={(b) => b.id}
          href={hrefFor}
          columns={[
            { header: "When", cell: (b) => <Two top={day(b.starts_at)} bottom={window_(b.starts_at, b.ends_at)} /> },
            { header: "Service", cell: (b) => <Two top={b.service_name} bottom={b.reference} /> },
            { header: "Vehicle", cell: (b) => <Plate value={b.vehicle_plate} /> },
            { header: "Status", cell: (b) => <BookingPill booking={b} /> },
            { header: "Total", className: "right", cell: (b) => <span className="kit-num">{b.billing === "subscription" ? "Credit" : b.billing === "invoice" ? "On invoice" : naira(b.amount_kobo)}</span> },
          ]}
        />
      )}
    </AsyncList>
  )
}
