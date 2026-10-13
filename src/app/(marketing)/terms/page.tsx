import type { Metadata } from "next"
import PolicyLayout from "@/features/marketing/components/PolicyLayout"
import { termsSections } from "@/features/marketing/content/policies"

export const metadata: Metadata = { title: "Service terms" }

export default function TermsPage() {
  return (
    <PolicyLayout
      title="Clear expectations."
      accent="Better care."
      description="The same clear standards protect your vehicle, your professional and your peace of mind."
      sections={termsSections}
    />
  )
}
