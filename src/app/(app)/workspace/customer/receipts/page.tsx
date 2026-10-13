import type { Metadata } from "next"
import { Receipts } from "@/features/customer/screens/Money"

export const metadata: Metadata = { title: "Receipts & refunds" }

export default function Page() {
  return <Receipts />
}
