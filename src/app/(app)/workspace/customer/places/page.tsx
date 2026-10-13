import type { Metadata } from "next"
import { Places } from "@/features/customer/screens/Garage"

export const metadata: Metadata = { title: "My places" }

export default function Page() {
  return <Places />
}
