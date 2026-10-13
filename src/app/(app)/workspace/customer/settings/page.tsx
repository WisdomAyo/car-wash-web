import type { Metadata } from "next"
import Settings from "@/features/customer/screens/Settings"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return <Settings />
}
