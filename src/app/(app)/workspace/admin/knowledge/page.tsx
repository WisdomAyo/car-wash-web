import type { Metadata } from "next"
import Knowledge from "@/features/admin/screens/Knowledge"

export const metadata: Metadata = { title: "Help & assistant" }

export default function Page() {
  return <Knowledge />
}
