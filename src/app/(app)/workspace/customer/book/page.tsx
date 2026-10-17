import type { Metadata } from "next"
import Overview from "@/features/customer/screens/Overview"

export const metadata: Metadata = { title: "Book a wash" }

/** The booking wizard is a dialog on the dashboard; this address opens it (optionally for one vehicle). */
export default async function Page({ searchParams }: { searchParams: Promise<{ vehicle?: string }> }) {
  const { vehicle } = await searchParams
  return <Overview autoBook={{ vehicleId: typeof vehicle === "string" ? vehicle : undefined }} />
}
