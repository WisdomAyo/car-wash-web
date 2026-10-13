import type { Metadata } from "next"
import { Tickets } from "@/features/admin/screens/Support"

export const metadata: Metadata = { title: "Tickets" }

export default function Page() {
  return <Tickets />
}
