"use client"

import Auth from "@/views/Auth"
import { useAppNavigation } from "@/components/layout/NavigationProvider"
import { useSearchParams } from "next/navigation"

export default function AuthPageRoute() {
  const { role, setRole, navigate, workspace } = useAppNavigation()
  const searchParams = useSearchParams()
  const modeParam = searchParams?.get("mode")
  const mode =
    modeParam === "register" || modeParam === "recover"
      ? modeParam
      : "login"

  return (
    <Auth
      role={role}
      mode={mode}
      onRole={setRole}
      onHome={() => navigate("home")}
      onNavigate={navigate}
      onComplete={() => workspace(role)}
    />
  )
}
