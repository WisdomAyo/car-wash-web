import type { Metadata } from "next"
import Confirmer from "@/features/customer/Confirmer"

export const metadata: Metadata = { title: "Confirm your wash", robots: { index: false } }

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  return <Confirmer token={(await params).token} />
}
