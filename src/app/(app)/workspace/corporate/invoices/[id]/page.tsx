import type { Metadata } from "next"
import { InvoiceDetail } from "@/features/partners/screens/Common"

export const metadata: Metadata = { title: "Invoice" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <InvoiceDetail id={(await params).id} />
}
