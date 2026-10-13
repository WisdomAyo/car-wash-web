import type { Metadata } from "next"
import { EstateRuns } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Estate runs" }

export default function Page() {
  return <EstateRuns />
}
