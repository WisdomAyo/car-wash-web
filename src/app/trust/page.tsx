"use client"

import Trust from "@/views/public/Trust"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function TrustPage() {
  const { navigate } = useAppNavigation()
  return <Trust navigate={navigate} />
}
