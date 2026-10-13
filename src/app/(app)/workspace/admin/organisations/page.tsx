import type { Metadata } from "next"
import { OrganisationsList } from "@/features/admin/screens/Organisations"

export const metadata: Metadata = { title: "Organisations" }

export default function Page() {
  return <OrganisationsList />
}
