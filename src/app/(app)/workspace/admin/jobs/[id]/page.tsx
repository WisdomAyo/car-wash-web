import type { Metadata } from "next"
import { JobDetail } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Job" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <JobDetail id={(await params).id} />
}
