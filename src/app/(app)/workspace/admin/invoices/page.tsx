import type { Metadata } from "next"
import { Invoices } from "@/features/admin/screens/Finance"

export const metadata: Metadata = { title: "Invoices" }

export default function Page() {
  return <Invoices />
}
