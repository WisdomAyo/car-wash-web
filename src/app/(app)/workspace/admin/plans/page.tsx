import type { Metadata } from "next"
import { Plans } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "Subscription plans" }

export default function Page() {
  return <Plans />
}
