"use client"

import BusinessHome from "@/views/home/BusinessHome"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function BusinessPage() {
  const { navigate } = useAppNavigation()
  return <BusinessHome navigate={navigate} />
}
