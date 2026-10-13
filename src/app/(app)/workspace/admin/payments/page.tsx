import type { Metadata } from "next"
import { Payments } from "@/features/admin/screens/Finance"

export const metadata: Metadata = { title: "Payments" }

export default function Page() {
  return <Payments />
}
