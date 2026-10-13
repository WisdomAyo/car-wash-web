import type { Metadata } from "next"
import { Accounts } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "Admin accounts" }

export default function Page() {
  return <Accounts />
}
