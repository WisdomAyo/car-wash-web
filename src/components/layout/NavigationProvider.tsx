"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  roles,
  operationsRoles,
  workspaceRoute,
  type Role,
} from "@/domain/roles"

export interface NavigationContextValue {
  route: string
  role: Role
  setRole: (role: Role) => void
  navigate: (next: string, nextRole?: Role) => void
  workspace: (r: Role) => void
  explorer: boolean
  setExplorer: (open: boolean) => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [role, setRole] = useState<Role>("Customer")
  const [explorer, setExplorer] = useState(false)

  // Derive route key from current pathname
  const route = !pathname || pathname === "/" ? "home" : pathname.replace(/^\//, "")

  // Sync role if present in search params
  useEffect(() => {
    const roleParam = searchParams?.get("role")
    if (roleParam) {
      const matched = [...roles, ...operationsRoles].find(
        (r) => r.toLowerCase() === roleParam.toLowerCase(),
      )
      if (matched) setRole(matched)
    }
  }, [searchParams])

  // Handle Escape key to close workspace explorer
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExplorer(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])

  // Universal navigation function compatible with Go-Wash components
  const navigate = useCallback(
    (next: string, nextRole?: Role) => {
      setExplorer(false)
      if (nextRole) {
        setRole(nextRole)
      }

      // Clean route string
      const cleanRoute = next.replace(/^#/, "")

      if (!cleanRoute || cleanRoute === "home") {
        router.push("/")
        window.scrollTo(0, 0)
        return
      }

      if (cleanRoute.startsWith("auth/")) {
        const query = nextRole ? `?role=${encodeURIComponent(nextRole)}` : ""
        router.push(`/${cleanRoute}${query}`)
        window.scrollTo(0, 0)
        return
      }

      router.push(`/${cleanRoute}`)
      window.scrollTo(0, 0)
    },
    [router],
  )

  const workspace = useCallback(
    (r: Role) => {
      navigate(workspaceRoute(r), r)
    },
    [navigate],
  )

  // Handle legacy hash navigation if entered in address bar
  useEffect(() => {
    const checkHash = () => {
      if (typeof window !== "undefined" && window.location.hash) {
        const hashTarget = window.location.hash.slice(1)
        if (hashTarget) {
          navigate(hashTarget)
        }
      }
    }
    checkHash()
    window.addEventListener("hashchange", checkHash)
    return () => window.removeEventListener("hashchange", checkHash)
  }, [navigate])

  return (
    <NavigationContext.Provider
      value={{
        route,
        role,
        setRole,
        navigate,
        workspace,
        explorer,
        setExplorer,
      }}
    >
      {children}
    </NavigationContext.Provider>
  )
}

export function useAppNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error(
      "useAppNavigation must be used within a NavigationProvider",
    )
  }
  return context
}
