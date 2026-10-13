import type { Metadata } from "next"
import { Security } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "My security" }

export default function Page() {
  return <Security />
}
