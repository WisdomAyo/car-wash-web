"use client"

import ContactPage from "@/views/public/ContactPage"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function ContactRoute() {
  const { navigate } = useAppNavigation()
  return <ContactPage navigate={navigate} />
}
