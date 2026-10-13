import type { Metadata } from "next"
import { Incidents } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Incidents" }

export default function Page() {
  return <Incidents />
}
