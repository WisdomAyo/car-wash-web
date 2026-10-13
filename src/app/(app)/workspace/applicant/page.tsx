import type { Metadata } from "next"
import ApplicantSpace from "@/features/washman/ApplicantSpace"

export const metadata: Metadata = { title: "Your application" }

export default function Page() {
  return <ApplicantSpace />
}
