import type { Metadata } from "next"
import BookingDetail from "@/features/shared/BookingDetail"

export const metadata: Metadata = { title: "Booking" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <BookingDetail id={(await params).id} base="/workspace/customer" />
}
