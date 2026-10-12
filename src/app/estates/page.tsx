"use client"

import EstateHome from "@/views/home/EstateHome"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function EstatesPage() {
  const { navigate } = useAppNavigation()
  return <EstateHome navigate={navigate} />
}
