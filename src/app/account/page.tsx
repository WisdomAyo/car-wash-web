"use client"

import CustomerAccount from "@/views/CustomerAccount"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function AccountRoute() {
  const { navigate } = useAppNavigation()
  return <CustomerAccount navigate={navigate} />
}
