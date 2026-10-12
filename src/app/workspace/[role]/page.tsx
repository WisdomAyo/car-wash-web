"use client"

import { use } from "react"
import CustomerApp from "@/App"
import ProtectedWorkspace from "@/components/ProtectedWorkspace"
import LiveOperations from "@/views/LiveOperations"
import Portal from "@/components/Portal"
import { useAppNavigation } from "@/components/layout/NavigationProvider"
import { roles, operationsRoles, type Role } from "@/domain/roles"

export default function RoleWorkspaceRoute({
  params,
}: {
  params: Promise<{ role: string }>
}) {
  const resolvedParams = use(params)
  const { navigate } = useAppNavigation()

  const roleSlug = resolvedParams.role.toLowerCase()
  const matchedRole: Role =
    [...roles, ...operationsRoles].find(
      (r) => r.toLowerCase().replace(/ /g, "-") === roleSlug,
    ) || "Customer"

  if (matchedRole === "Customer") {
    return <CustomerApp />
  }

  const isLiveOps = [
    "Washman",
    "Dispatcher",
    "Finance",
    "Support",
    "Super admin",
  ].includes(matchedRole)

  return (
    <ProtectedWorkspace role={matchedRole} navigate={navigate}>
      {isLiveOps ? (
        <LiveOperations
          key={matchedRole}
          role={matchedRole}
          onHome={() => navigate("home")}
        />
      ) : (
        <Portal
          key={matchedRole}
          role={matchedRole}
          onHome={() => navigate("home")}
        />
      )}
    </ProtectedWorkspace>
  )
}
