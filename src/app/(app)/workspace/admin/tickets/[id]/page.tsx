import type { Metadata } from "next"
import { TicketDetail } from "@/features/admin/screens/Support"

export const metadata: Metadata = { title: "Ticket" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <TicketDetail id={(await params).id} />
}
