import PolicyLayout from "../../components/PolicyLayout"
import { privacySections } from "../../domain/policies"
import type { Navigate } from "../../domain/publicContent"

export default function PrivacyPage({ navigate }: { navigate: Navigate }) {
  return (
    <PolicyLayout
      page="privacy"
      navigate={navigate}
      title="Your data."
      accent="Treated with care."
      description="A thoughtful service deserves thoughtful privacy. Here's how Go-Wash is designed to protect the details that matter."
      sections={privacySections}
    />
  )
}
