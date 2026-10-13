import type { Metadata } from "next"
import { Refunds } from "@/features/admin/screens/Finance"

export const metadata: Metadata = { title: "Refunds" }

export default function Page() {
  return <Refunds />
}
