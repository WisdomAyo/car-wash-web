"use client"

import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"

// Support chat is loaded after hydration instead of competing with the content for bandwidth.
const CustomerChat = dynamic(() => import("@/features/support/CustomerChat"), {
  ssr: false,
})

/** Floating support chat, hidden on the personal account page. */
export default function FloatingChrome() {
  if (usePathname() === "/account") return null
  return <CustomerChat />
}

