import type { Metadata } from "next"
import PolicyLayout from "@/features/marketing/components/PolicyLayout"
import { privacySections } from "@/features/marketing/content/policies"

export const metadata: Metadata = { title: "Privacy & data" }

export default function PrivacyPage() {
  return (
    <PolicyLayout
      title="Your data."
      accent="Treated with care."
      description="A thoughtful service deserves thoughtful privacy. Here's how Go-Wash is designed to protect the details that matter."
      sections={privacySections}
    />
  )
}
