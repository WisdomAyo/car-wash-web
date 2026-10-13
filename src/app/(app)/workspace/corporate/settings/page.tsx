import type { Metadata } from "next"
import { Settings } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Account settings" }

export default function Page() {
  return <Settings />
}
