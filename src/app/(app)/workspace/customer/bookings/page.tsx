import type { Metadata } from "next"
import Bookings from "@/features/customer/screens/Bookings"

export const metadata: Metadata = { title: "My bookings" }

export default function Page() {
  return <Bookings />
}
