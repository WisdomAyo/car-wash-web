import type { Metadata } from "next"
import NotConnected from "@/features/workspace/NotConnected"

export const metadata: Metadata = { title: "Your account" }

export default function AccountPage() {
  return <NotConnected title="Your account is on its way." />
}
