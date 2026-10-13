import type { Metadata } from "next"
import { CoverageScreen } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "Coverage" }

export default function Page() {
  return <CoverageScreen />
}
