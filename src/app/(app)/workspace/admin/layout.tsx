import type { Metadata } from "next"
import type { ReactNode } from "react"
import AdminSpace from "@/features/admin/AdminSpace"

export const metadata: Metadata = { title: { default: "Operations", template: "%s · Go-Wash operations" } }

export default function Layout({ children }: { children: ReactNode }) {
  return <AdminSpace>{children}</AdminSpace>
}
