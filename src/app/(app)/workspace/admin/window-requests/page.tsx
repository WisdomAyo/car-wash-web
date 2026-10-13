import type { Metadata } from "next"
import { WindowRequests } from "@/features/admin/screens/Support"

export const metadata: Metadata = { title: "Estate requests" }

export default function Page() {
  return <WindowRequests />
}
