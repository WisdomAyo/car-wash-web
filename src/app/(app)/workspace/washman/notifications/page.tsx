import type { Metadata } from "next"
import Notifications from "@/features/shared/Notifications"

export const metadata: Metadata = { title: "Notifications" }

export default function Page() {
  return <Notifications path="/staff/notifications" />
}
