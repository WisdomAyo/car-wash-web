import type { Metadata } from "next"
import Confirm from "@/features/partners/screens/Confirm"

export const metadata: Metadata = { title: "Confirm a wash" }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <Confirm jobId={(await params).id} />
}
