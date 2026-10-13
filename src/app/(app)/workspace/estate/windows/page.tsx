import type { Metadata } from "next"
import { Windows } from "@/features/partners/screens/Estate"

export const metadata: Metadata = { title: "Wash windows" }

export default function Page() {
  return <Windows />
}
