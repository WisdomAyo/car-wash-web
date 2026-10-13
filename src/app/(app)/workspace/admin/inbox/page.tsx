import type { Metadata } from "next"
import { Inbox } from "@/features/admin/screens/Support"

export const metadata: Metadata = { title: "Inbox" }

export default function Page() {
  return <Inbox />
}
