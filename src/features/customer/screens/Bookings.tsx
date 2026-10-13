"use client"

import Link from "next/link"
import { PageHeader, Panel } from "@/components/app/kit"
import { Icon } from "@/components/Visuals"
import BookingsTable from "@/features/shared/BookingsTable"

const base = "/workspace/customer"

export default function Bookings() {
  return (
    <>
      <PageHeader
        eyebrow="YOUR WASHES"
        title="My bookings"
        description="Every wash, with its progress and proof."
        action={<Link className="primary" href={`${base}/book`}><Icon name="plus" size={17} /> Book a wash</Link>}
      />
      <Panel>
        <BookingsTable path="/bookings" hrefFor={(b) => `${base}/bookings/${b.id}`} emptyAction={<Link className="primary" href={`${base}/book`}>Book a wash</Link>} />
      </Panel>
    </>
  )
}
