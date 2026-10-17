"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useSyncExternalStore, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api/client"
import { Loading } from "@/components/app/kit"
import { sessionStore, deviceId, type Session, type SessionKind, type SessionUser } from "@/lib/session"
import { isAdminRole, staffLoginHref, type Role } from "@/lib/roles"

/** `undefined` until the browser has read its stored session; then the session or `null`. */
export function useSession(): Session | null | undefined {
  return useSyncExternalStore(
    sessionStore.subscribe,
    () => sessionStore.get(),
    () => undefined,
  )
}

/** Where each kind of person lands after signing in. */
export const homeFor = (kind: SessionKind): string => {
  switch (kind) {
    case "staff":
      return "/workspace/washman"
    case "admin":
      return "/workspace/admin"
    case "applicant":
      return "/workspace/applicant"
    default:
      return "/workspace/customer"
  }
}

type AuthResponse = { token: string; user: SessionUser & { roles?: string[] } }

/** Stores a sign-in response as the current session. Customers who belong to an organisation are sent to its portal by the caller. */
export function startSession(kind: SessionKind, response: AuthResponse): Session {
  const session: Session = {
    token: response.token,
    kind,
    user: response.user,
    deviceId: kind === "staff" ? deviceId() : undefined,
  }
  sessionStore.set(session)
  return session
}

export function useSignOut() {
  const client = useQueryClient()
  const router = useRouter()
  return async () => {
    try {
      await api("/auth/logout", { method: "POST" })
    } catch {
      // the token may already be revoked: signing out locally is what matters
    }
    sessionStore.clear()
    client.clear()
    router.replace("/")
  }
}

/** The sign-in URL for the audience a path belongs to. */
export const loginHref = (role: Role, next?: string) => {
  if (role === "Washman") return staffLoginHref({ next })
  if (isAdminRole(role)) return staffLoginHref({ team: "operations", next })
  return `/auth/login?role=${encodeURIComponent(role)}${next ? `&next=${encodeURIComponent(next)}` : ""}`
}

const kindLabels: Record<SessionKind, string> = {
  customer: "customer",
  staff: "washman",
  admin: "admin",
  applicant: "applicant",
}

/**
 * Keeps a workspace for the right kind of person. Not signed in: goes to the sign-in page and brings them
 * back afterwards. Signed in as someone else: says so and offers to switch. Renders nothing until the
 * stored session has been read, so there is no flash of the wrong screen.
 */
export function RequireSession({
  kind,
  loginRole,
  children,
}: {
  kind: SessionKind | SessionKind[]
  loginRole: Role
  children: (session: Session) => ReactNode
}) {
  const session = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const signOut = useSignOut()
  const kinds = Array.isArray(kind) ? kind : [kind]

  useEffect(() => {
    if (session === null) {
      const reason = sessionStore.endedBecause()
      const href = loginHref(loginRole, pathname)
      router.replace(reason ? `${href}${href.includes("?") ? "&" : "?"}expired=1` : href)
    }
  }, [session, router, pathname, loginRole])

  if (session === undefined || session === null) return <Loading label="Opening your space…" />

  if (!kinds.includes(session.kind)) {
    return (
      <div className="kit-empty" style={{ minHeight: "60vh", display: "grid", placeContent: "center" }}>
        <h3>This space is for a different account.</h3>
        <p>
          You are signed in as a {kindLabels[session.kind]}. Sign out to use this space with the right account.
        </p>
        <div className="kit-row" style={{ justifyContent: "center" }}>
          <button className="primary" onClick={signOut}>
            Sign out
          </button>
          <button className="secondary" onClick={() => router.push(homeFor(session.kind))}>
            Go to my space
          </button>
        </div>
      </div>
    )
  }

  return <>{children(session)}</>
}
