import type { Metadata } from "next"
import { Reports } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Monthly report" }

export default function Page() {
  return <Reports />
}
