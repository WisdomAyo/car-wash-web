import type { Metadata } from "next"
import { StaffHelp } from "@/features/auth/StaffAuth"

export const metadata: Metadata = { title: "Staff help" }

/** What a washman does when the PIN is forgotten or the phone has changed. */
export default function StaffHelpPage() {
  return <StaffHelp />
}
