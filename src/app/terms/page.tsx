"use client"

import TermsPage from "@/views/public/TermsPage"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function TermsRoute() {
  const { navigate } = useAppNavigation()
  return <TermsPage navigate={navigate} />
}
