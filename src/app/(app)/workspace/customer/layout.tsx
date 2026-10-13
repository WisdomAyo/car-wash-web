import type { Metadata } from "next"
import type { ReactNode } from "react"
import CustomerSpace from "@/features/customer/CustomerSpace"

export const metadata: Metadata = { title: { default: "My space", template: "%s · Go-Wash" } }

export default function Layout({ children }: { children: ReactNode }) {
  return <CustomerSpace>{children}</CustomerSpace>
}
