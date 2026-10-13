"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

// Neither the support chat nor the workspace dock is needed to read a page, so they
// load after hydration instead of competing with the content for bandwidth.
const CustomerChat = dynamic(() => import("@/features/support/CustomerChat"), {
  ssr: false,
})
const ExperienceDock = dynamic(() => import("./ExperienceDock"), { ssr: false })

/** Floating support chat and workspace dock, hidden on the personal account page. */
export default function FloatingChrome() {
  if (usePathname() === "/account") return null
  return (
    <>
      <CustomerChat />
      <ExperienceDock />
    </>
  )
}
