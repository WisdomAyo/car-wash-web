import type { Metadata } from "next"
import { SettingsScreen } from "@/features/admin/screens/Setup"

export const metadata: Metadata = { title: "Settings" }

export default function Page() {
  return <SettingsScreen />
}
