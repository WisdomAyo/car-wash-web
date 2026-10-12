import { useEffect, useState } from "react"
import type { Role } from "../domain/roles"
import { databaseRole } from "../domain/roles"
import useSession from "../hooks/useSession"
import { loadWorkspaceAccess, type WorkspaceAccess } from "../lib/accessApi"
import { supabase } from "../lib/supabase"
import Brand from "./Brand"
import { Icon } from "./Visuals"
import Button from "./ui/Button"
import Heading from "./ui/Typography"

export default function ProtectedWorkspace({
  role,
  navigate,
  children,
}: {
  role: Role
  navigate: (route: string) => void
  children: React.ReactNode
}) {
  const { session, loading: sessionLoading, error: sessionError } = useSession()
  const [access, setAccess] = useState<WorkspaceAccess[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    if (!session) {
      setAccess(null)
      setError("")
      return
    }
    loadWorkspaceAccess()
      .then((memberships) => {
        if (active) setAccess(memberships)
      })
      .catch((reason) => {
        if (active)
          setError(
            reason instanceof Error
              ? reason.message
              : "Unable to verify workspace access.",
          )
      })
    return () => {
      active = false
    }
  }, [session])

  const requiredRole = databaseRole(role)
  const membership = access?.find((item) => item.role === requiredRole)
  const approved =
    membership?.status === "approved" &&
    (!membership.organisation || membership.organisation.status === "active")

  if (approved) return children

  const waiting = sessionLoading || (!!session && access === null && !error)
  return (
    <div className="min-h-dvh bg-(--foam)">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--line) bg-white px-5 py-6 md:px-10">
        <Brand onClick={() => navigate("home")} />
        {session && (
          <Button
            className="secondary"
            onClick={async () => {
              await supabase?.auth.signOut()
              navigate("auth/login")
            }}
          >
            Sign out
          </Button>
        )}
      </header>
      <main className="mx-auto max-w-3xl px-5 py-14 md:px-10 md:py-20">
        <section className="content-panel">
          <span className="mb-5 inline-flex text-(--aqua)">
            <Icon name="shield" size={34} />
          </span>
          <div className="eyebrow">PROTECTED GO-WASH WORKSPACE</div>
          <Heading level={1}>
            {waiting
              ? "Checking your approved access…"
              : !session
                ? "Sign in with an approved account."
                : "This workspace is not active for your account."}
          </Heading>
          <p className="my-6 text-(--muted)">
            {waiting
              ? "Your session and role membership are being verified securely."
              : !session
                ? `${role} access is invitation-only. Public registration cannot grant staff, organisation or operations permissions.`
                : membership?.status === "pending"
                  ? "Your membership is awaiting approval from Go-Wash operations."
                  : membership?.status === "suspended" ||
                      membership?.organisation?.status === "suspended"
                    ? "This access is suspended. Contact Go-Wash support if you believe this is an error."
                    : `Your signed-in account does not have approved ${role} access.`}
          </p>
          {(error || sessionError) && (
            <p className="form-error" role="alert">
              {error || sessionError}
            </p>
          )}
          {!waiting && !session && (
            <Button className="primary" onClick={() => navigate("auth/login")}>
              Sign in securely <Icon name="arrow" size={18} />
            </Button>
          )}
          {!waiting && session && (
            <div className="flex flex-wrap gap-3">
              <Button className="primary" onClick={() => navigate("account")}>
                Open personal account
              </Button>
              <Button className="secondary" onClick={() => navigate("home")}>
                Return home
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
