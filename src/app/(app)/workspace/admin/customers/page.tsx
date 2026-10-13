import type { Metadata } from "next"
import { CustomersList } from "@/features/admin/screens/People"

export const metadata: Metadata = { title: "Customers" }

export default function Page() {
  return <CustomersList />
}
