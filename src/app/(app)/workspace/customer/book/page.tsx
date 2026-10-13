import type { Metadata } from "next"
import BookWash from "@/features/customer/screens/BookWash"

export const metadata: Metadata = { title: "Book a wash" }

export default async function Page({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const { vehicle } = await searchParams
  return <BookWash base="/workspace/customer" presetVehicle={typeof vehicle === "string" ? vehicle : undefined} />
}
