import type { Metadata } from "next"
import { Spots } from "@/features/partners/screens/Estate"

export const metadata: Metadata = { title: "Approved spots" }

export default function Page() {
  return <Spots />
}
