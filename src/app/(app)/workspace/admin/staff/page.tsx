import type { Metadata } from "next"
import { StaffList } from "@/features/admin/screens/People"

export const metadata: Metadata = { title: "Washmen" }

export default function Page() {
  return <StaffList />
}
