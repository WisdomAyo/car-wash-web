import type { Metadata } from "next"
import { Subscriptions } from "@/features/customer/screens/Money"

export const metadata: Metadata = { title: "Subscriptions" }

export default function Page() {
  return <Subscriptions />
}
