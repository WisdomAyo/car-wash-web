import type { Metadata } from "next"
import { OnSiteScreen } from "@/features/partners/screens/Estate"

export const metadata: Metadata = { title: "On-site team" }

export default function Page() {
  return <OnSiteScreen />
}
