"use client"

import CareersHome from "@/views/home/CareersHome"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function CareersPage() {
  const { navigate } = useAppNavigation()
  return <CareersHome navigate={navigate} />
}
