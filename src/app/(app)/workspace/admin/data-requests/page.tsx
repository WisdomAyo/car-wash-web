import type { Metadata } from "next"
import { DataRequests } from "@/features/admin/screens/Support"

export const metadata: Metadata = { title: "Data requests" }

export default function Page() {
  return <DataRequests />
}
