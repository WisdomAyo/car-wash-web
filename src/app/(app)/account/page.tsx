import type { Metadata } from "next"
import AccountRedirect from "@/features/workspace/AccountRedirect"

export const metadata: Metadata = { title: "Your account" }

export default function AccountPage() {
  return <AccountRedirect />
}
