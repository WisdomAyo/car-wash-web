import type { Metadata } from "next"
import { Reports } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Reports" }

export default function Page() {
  return <Reports />
}
