import type { Metadata } from "next"
import { Vehicles } from "@/features/customer/screens/Garage"

export const metadata: Metadata = { title: "My vehicles" }

export default function Page() {
  return <Vehicles />
}
