"use client"

import Journal from "@/views/public/Journal"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function JournalPage() {
  const { navigate } = useAppNavigation()
  return <Journal navigate={navigate} />
}
