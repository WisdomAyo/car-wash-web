import PolicyLayout from "../../components/PolicyLayout"
import { termsSections } from "../../domain/policies"
import type { Navigate } from "../../domain/publicContent"

export default function TermsPage({ navigate }: { navigate: Navigate }) {
  return (
    <PolicyLayout
      page="terms"
      navigate={navigate}
      title="Clear expectations."
      accent="Better care."
      description="The same clear standards protect your vehicle, your professional and your peace of mind."
      sections={termsSections}
    />
  )
}
