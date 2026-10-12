"use client"

import CustomerHome from "@/views/home/CustomerHome"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function HomePage() {
  const { navigate } = useAppNavigation()
  return <CustomerHome navigate={navigate} />
}
