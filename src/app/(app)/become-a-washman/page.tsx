import type { Metadata } from "next"
import WashmanJoin from "@/features/auth/WashmanJoin"

export const metadata: Metadata = {
  title: "Become a washman",
  description: "Apply to join the Go-Wash field team. Every washman is verified before their first job.",
}

/** Where someone applies to become a washman. */
export default function BecomeAWashmanPage() {
  return <WashmanJoin />
}
