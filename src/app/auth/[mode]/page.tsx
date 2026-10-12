"use client"

import { use } from "react"
import Auth from "@/views/Auth"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function AuthModeRoute({
  params,
}: {
  params: Promise<{ mode: string }>
}) {
  const resolvedParams = use(params)
  const { role, setRole, navigate, workspace } = useAppNavigation()

  const mode =
    resolvedParams.mode === "register"
      ? "register"
      : resolvedParams.mode === "recover"
        ? "recover"
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
