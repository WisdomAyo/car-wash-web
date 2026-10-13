import type { Metadata } from "next"
import type { ReactNode } from "react"
import WashmanSpace from "@/features/washman/WashmanSpace"

export const metadata: Metadata = { title: { default: "Today", template: "%s · Go-Wash" } }

export default function Layout({ children }: { children: ReactNode }) {
  return <WashmanSpace>{children}</WashmanSpace>
}
