import type { Metadata } from "next"
import { VehiclesList } from "@/features/admin/screens/People"

export const metadata: Metadata = { title: "Vehicles" }

export default function Page() {
  return <VehiclesList />
}
