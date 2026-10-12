"use client"

import Coverage from "@/views/public/Coverage"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function CoveragePage() {
  const { navigate } = useAppNavigation()
  return <Coverage navigate={navigate} />
}
