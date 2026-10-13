import type { Metadata } from "next"
import { TicketsScreen } from "@/features/shared/Tickets"

export const metadata: Metadata = { title: "Help & tickets" }

export default function Page() {
  return <TicketsScreen base="/workspace/customer/help" />
}
