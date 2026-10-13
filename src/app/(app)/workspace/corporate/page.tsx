import type { Metadata } from "next"
import { FleetOverview } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Fleet overview" }

export default function Page() {
  return <FleetOverview />
}
