import type { Metadata } from "next"
import { Invoices } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Plan & invoices" }

export default function Page() {
  return <Invoices />
}
