"use client"

import OperationsHome from "@/views/home/OperationsHome"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function OperationsPage() {
  const { navigate } = useAppNavigation()
  return <OperationsHome navigate={navigate} />
}
