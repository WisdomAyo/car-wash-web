import type { Metadata } from "next"
import { JobsList } from "@/features/admin/screens/Operations"

export const metadata: Metadata = { title: "Jobs" }

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  const { state } = await searchParams
  return <JobsList initialState={typeof state === "string" ? state : undefined} />
}
