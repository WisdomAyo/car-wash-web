"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Icon } from "@/components/Visuals"
import ButtonLink from "@/components/ui/ButtonLink"
import { authApi, myOrganisations } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { startSession } from "@/lib/auth"
import { authHref, isAdminRole, isPartnerRole, workspaceHref, type Role } from "@/lib/roles"
import { deviceId } from "@/lib/session"
import { AuthField, fieldProblem, formMessage, PasswordInput } from "./fields"

/** Only paths inside this site are followed after sign-in (never a link to somewhere else). */
export const safeNext = (next?: string) => (next && /^\/(workspace|estate\/)/.test(next) ? next : undefined)

/** Where a customer-account holder should land: the company/estate portal they asked for, if they have one. */
async function landingFor(role: Role): Promise<{ href: string; note?: string }> {
  if (!isPartnerRole(role)) return { href: workspaceHref("Customer") }
  const wanted = role === "Corporate" ? "corporate" : "estate"
  const organisations = await myOrganisations()
  const mine = organisations.find((o) => o.type === wanted && o.my_role !== "resident")
  return mine
    ? { href: workspaceHref(role) }
    : { href: workspaceHref("Customer"), note: `No ${wanted} account is linked to this login, so we opened your personal space.` }
}

export default function LoginForm({
  role,
  next,
  expired,
}: {
  role: Role
  next?: string
  expired?: boolean
}) {
  const router = useRouter()
  const staff = role === "Washman"
  const admin = isAdminRole(role)
  const [identifier, setIdentifier] = useState("")
  const [secret, setSecret] = useState("")
  const [code, setCode] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [info, setInfo] = useState(expired ? "Your session ended. Please sign in again." : "")

  const go = (href: string) => router.push(safeNext(next) ?? href)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      if (admin) {
        startSession("admin", await authApi.adminLogin(identifier.trim(), secret, code))
        go(workspaceHref("Super admin"))
      } else if (staff) {
        await signInWasher()
      } else {
        startSession("customer", await authApi.login(identifier.trim(), secret))
        const landing = await landingFor(role)
        if (landing.note) setInfo(landing.note)
        go(landing.href)
      }
    } catch (failure) {
      setError(failure)
      setPending(false)
    }
  }

  /** A washman signs in with the staff code and PIN; someone still under review gets their application screen instead. */
  const signInWasher = async () => {
    try {
      startSession("staff", await authApi.staffLogin(identifier.trim().toUpperCase(), secret, deviceId()))
      go(workspaceHref("Washman"))
    } catch (failure) {
      if (!(failure instanceof ApiError) || failure.code !== "account_inactive") throw failure
      const applicant = await authApi.applicantLogin(identifier.trim().toUpperCase(), secret)
      startSession("applicant", { token: applicant.token, user: applicant.user })
      go("/workspace/applicant")
    }
  }

  const label = staff ? "Staff code" : admin ? "Work email" : "Email or phone number"

  return (
    <form onSubmit={submit}>
      {info && <p className="policy-note">{info}</p>}
      <AuthField label={label} error={fieldProblem(error, "identifier") ?? fieldProblem(error, "staff_code") ?? fieldProblem(error, "email")}>
        <input
          required
          autoComplete="username"
          type={admin ? "email" : "text"}
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder={staff ? "GW1234" : admin ? "you@go-wash.com" : "you@example.com or 0803 123 4567"}
        />
      </AuthField>
      <AuthField label={staff ? "PIN" : "Password"} error={fieldProblem(error, "password") ?? fieldProblem(error, "pin")}>
        <PasswordInput
          required
          autoComplete="current-password"
          value={secret}
          onChange={(event) => setSecret(event.target.value)}
          placeholder={staff ? "Your 6–8 digit PIN" : "Your password"}
        />
      </AuthField>
      {admin && (
        <AuthField label="Authenticator code" hint="The 6 digits from your authenticator app.">
          <input
            required
            className="otp-input"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            placeholder="– – – – – –"
          />
        </AuthField>
      )}
      {error != null && (
        <p className="form-error" role="alert">
          {formMessage(error)}
        </p>
      )}
      {!admin && (
        <ButtonLink className="text-button auth-forgot" href={authHref("recover", role)}>
          {staff ? "Forgot your PIN or changed phone?" : "Forgot your password?"}
        </ButtonLink>
      )}
      <button className="primary full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"} <Icon name="arrow" size={17} />
      </button>
    </form>
  )
}
