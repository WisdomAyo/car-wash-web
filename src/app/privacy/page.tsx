"use client"

import PrivacyPage from "@/views/public/PrivacyPage"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function PrivacyRoute() {
  const { navigate } = useAppNavigation()
  return <PrivacyPage navigate={navigate} />
}
