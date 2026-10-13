import type { ReactNode } from "react"
import PublicLayout from "@/features/marketing/components/PublicLayout"

/** Every public page shares one shell: announcement bar, header, footer. */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <PublicLayout>{children}</PublicLayout>
}
