"use client"

import Confirmer from "@/views/Confirmer"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function ConfirmRoute() {
  const { navigate } = useAppNavigation()
  return <Confirmer onHome={() => navigate("home")} />
}
