import type { Metadata } from "next"
import { Team } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Team & confirmers" }

export default function Page() {
  return <Team />
}
