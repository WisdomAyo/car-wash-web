import type { Metadata } from "next"
import { FleetVehicles } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Vehicles" }

export default function Page() {
  return <FleetVehicles />
}
