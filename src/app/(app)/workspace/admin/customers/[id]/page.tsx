import type { Metadata } from "next"
import { CustomerDetail } from "@/features/admin/screens/People"

export const metadata: Metadata = { title: "Customer" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <CustomerDetail id={(await params).id} />
}
