import type { Metadata } from "next"
import Profile from "@/features/washman/screens/Profile"

export const metadata: Metadata = { title: "My profile" }

export default function Page() {
  return <Profile />
}
