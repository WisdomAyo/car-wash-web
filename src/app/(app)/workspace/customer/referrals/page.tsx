import type { Metadata } from "next"
import { ReferralsScreen } from "@/features/customer/screens/Money"

export const metadata: Metadata = { title: "Referrals & rewards" }

export default function Page() {
  return <ReferralsScreen />
}
