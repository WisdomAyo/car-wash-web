import type { Metadata } from "next"
import { Exceptions } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Exceptions" }

export default function Page() {
  return <Exceptions />
}
