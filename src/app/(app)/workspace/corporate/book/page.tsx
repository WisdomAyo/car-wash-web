import type { Metadata } from "next"
import { BulkBook } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Book fleet wash" }

export default function Page() {
  return <BulkBook />
}
