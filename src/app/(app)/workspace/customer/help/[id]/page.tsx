import type { Metadata } from "next"
import { TicketDetail } from "@/features/shared/Tickets"

export const metadata: Metadata = { title: "Ticket" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <TicketDetail id={(await params).id} back="/workspace/customer/help" />
}
