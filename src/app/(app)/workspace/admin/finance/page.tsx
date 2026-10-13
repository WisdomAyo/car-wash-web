import type { Metadata } from "next"
import { Finance } from "@/features/admin/screens/Finance"

export const metadata: Metadata = { title: "Finance" }

export default function Page() {
  return <Finance />
}
