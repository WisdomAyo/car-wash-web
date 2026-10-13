import type { Metadata } from "next"
import { FleetBookings } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Wash schedule" }

export default function Page() {
  return <FleetBookings />
}
