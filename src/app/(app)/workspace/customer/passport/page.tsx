import type { Metadata } from "next"
import Passport from "@/features/customer/screens/Passport"

export const metadata: Metadata = { title: "Wash Passport" }

export default function Page() {
  return <Passport />
}
