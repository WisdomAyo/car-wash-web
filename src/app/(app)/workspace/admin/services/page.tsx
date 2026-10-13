import type { Metadata } from "next"
import { Services } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "Services & prices" }

export default function Page() {
  return <Services />
}
