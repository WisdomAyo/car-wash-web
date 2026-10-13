import type { Metadata } from "next"
import { Access } from "@/features/partners/screens/Estate"

export const metadata: Metadata = { title: "Resident access" }

export default function Page() {
  return <Access />
}
