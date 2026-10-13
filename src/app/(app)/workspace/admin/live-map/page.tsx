import type { Metadata } from "next"
import { LiveMap } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Live map" }

export default function Page() {
  return <LiveMap />
}
