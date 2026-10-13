import type { Metadata } from "next"
import { JobsList } from "@/features/washman/screens/Jobs"

export const metadata: Metadata = { title: "My jobs" }

export default function Page() {
  return <JobsList />
}
