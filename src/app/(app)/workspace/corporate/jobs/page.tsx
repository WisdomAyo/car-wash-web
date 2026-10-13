import type { Metadata } from "next"
import { FleetJobs } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Active washes" }

export default function Page() {
  return <FleetJobs />
}
