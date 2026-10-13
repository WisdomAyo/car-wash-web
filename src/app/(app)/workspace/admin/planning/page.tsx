import type { Metadata } from "next"
import { Planning } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Planning" }

export default function Page() {
  return <Planning />
}
