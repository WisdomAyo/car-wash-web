import type { Metadata } from "next"
import { EstateOverview } from "@/features/partners/screens/Estate"

export const metadata: Metadata = { title: "Estate overview" }

export default function Page() {
  return <EstateOverview />
}
