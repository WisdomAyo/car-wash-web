import type { Metadata } from "next"
import EstateJoin from "@/features/shared/EstateJoin"

export const metadata: Metadata = { title: "Join your estate", robots: { index: false } }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  return <EstateJoin code={(await params).code} />
}
