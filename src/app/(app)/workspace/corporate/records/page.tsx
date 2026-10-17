import type { Metadata } from "next"
import { WashRecords } from "@/features/partners/screens/Corporate"

export const metadata: Metadata = { title: "Wash records" }

export default function Page() {
  return <WashRecords />
}
