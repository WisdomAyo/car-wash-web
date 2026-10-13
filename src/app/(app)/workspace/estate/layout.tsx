import type { Metadata } from "next"
import type { ReactNode } from "react"
import PartnerSpace from "@/features/partners/PartnerSpace"

export const metadata: Metadata = { title: { default: "Estate portal", template: "%s · Go-Wash" } }

export default function Layout({ children }: { children: ReactNode }) {
  return <PartnerSpace kind="estate">{children}</PartnerSpace>
}
