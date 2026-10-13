import type { Metadata } from "next"
import { Referrals } from "@/features/admin/screens/Finance"

export const metadata: Metadata = { title: "Referral rewards" }

export default function Page() {
  return <Referrals />
}
