"use client"

import Services from "@/views/public/Services"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function ServicesPage() {
  const { navigate } = useAppNavigation()
  return <Services navigate={navigate} />
}
