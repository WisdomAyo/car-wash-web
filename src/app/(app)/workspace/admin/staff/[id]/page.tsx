import type { Metadata } from "next"
import { StaffDetail } from "@/features/admin/screens/People"

export const metadata: Metadata = { title: "Washman" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <StaffDetail id={(await params).id} />
}
