import type { Metadata } from "next"
import { OrganisationDetail } from "@/features/admin/screens/Organisations"

export const metadata: Metadata = { title: "Organisation" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <OrganisationDetail id={(await params).id} />
}
