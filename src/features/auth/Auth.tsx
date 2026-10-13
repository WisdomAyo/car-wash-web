"use client"

import { useState } from "react"
import { Icon } from "@/components/Visuals"
import ButtonLink from "@/components/ui/ButtonLink"
import { authApi } from "@/lib/api/auth"
import { authHref, isAdminRole, roles, type AuthMode, type Role } from "@/lib/roles"
import AuthFrame from "./AuthFrame"
import { AuthField, fieldProblem, formMessage } from "./fields"
import LoginForm from "./LoginForm"
import { CustomerRegisterForm, OrganisationRequestForm, WashmanApplyForm } from "./RegisterForms"

const tabLabel = (role: Role) => (role === "Super admin" ? "Admin" : role === "Washman" ? "Staff" : role)

const headings: Record<AuthMode, Record<"person" | "staff" | "org" | "admin", [string, string, string]>> = {
  login: {
    person: ["YOUR PERSONAL GO-WASH SPACE", "Welcome back to your space.", "Sign in with your email or phone number and your password."],
    staff: ["THE GO-WASH FIELD TEAM", "Welcome back to the team.", "Sign in with your staff code and PIN."],
    org: ["YOUR ORGANISATION'S SPACE", "Welcome back.", "Sign in with the email and password you set for your account."],
    admin: ["GO-WASH OPERATIONS", "Operations sign-in.", "Email, password and the code from your authenticator app."],
  },
  register: {
    person: ["A LITTLE MORE CARE, STARTING TODAY", "Your first fresh start.", "Create an account with your email. It takes a minute."],
    staff: ["GOOD WORK STARTS HERE", "Apply to join the team.", "Tell us about yourself. We verify every washman before they start."],
    org: ["BETTER CARE STARTS HERE", "Tell us about your organisation.", "Go-Wash sets up company and estate accounts with you. Send us a few details."],
    admin: ["INVITATION ONLY", "Operations accounts are invitation-only.", ""],
  },
  recover: {
    person: ["ACCOUNT RECOVERY", "Let's get you back in.", "Enter your email and we will send you a link to choose a new password."],
    staff: ["ACCOUNT RECOVERY", "Need your PIN reset?", ""],
    org: ["ACCOUNT RECOVERY", "Let's get you back in.", "Enter your email and we will send you a link to choose a new password."],
    admin: ["ACCOUNT RECOVERY", "Lost your password or authenticator?", ""],
  },
}

export default function Auth({
  mode,
  initialRole,
  next,
  referral,
  expired,
}: {
  mode: AuthMode
  initialRole: Role
  next?: string
  referral?: string
  expired?: boolean
}) {
  const [role, setRole] = useState<Role>(initialRole)
  const admin = isAdminRole(role)
  const staff = role === "Washman"
  const org = role === "Corporate" || role === "Estate"
  const audience = admin ? "admin" : staff ? "staff" : org ? "org" : "person"
  const [eyebrow, title, description] = headings[mode][audience]
  const register = mode === "register"

  return (
    <AuthFrame
      eyebrow={eyebrow}
      title={title}
      description={description || undefined}
      topLink={
        mode === "recover"
          ? { text: "Remembered it?", label: "Sign in", href: authHref("login", role) }
          : {
              text: register ? "Already part of Go-Wash?" : "New to Go-Wash?",
              label: register ? "Sign in" : "Get started",
              href: authHref(register ? "login" : "register", role),
            }
      }
    >
      <div className="auth-role-tabs">
        {roles.map((r) => (
          <button
            type="button"
            key={r}
            className={r === role || (r === "Super admin" && admin) ? "selected" : ""}
            onClick={() => setRole(r)}
          >
            {tabLabel(r)}
          </button>
        ))}
      </div>
      {mode === "login" && <LoginForm key={role} role={role} next={next} expired={expired} />}
      {mode === "register" && (
        <>
          {audience === "person" && <CustomerRegisterForm key={role} referral={referral} />}
          {audience === "staff" && <WashmanApplyForm key={role} />}
          {audience === "org" && <OrganisationRequestForm key={role} role={role as "Corporate" | "Estate"} />}
          {audience === "admin" && (
            <div className="auth-complete">
              <div className="auth-complete-note">
                <Icon name="shield" size={22} />
                <p>
                  A super admin creates operations accounts with an approved role, and gives you a one-time password and an
                  authenticator secret. Public registration cannot grant operations access.
                </p>
              </div>
              <ButtonLink className="primary full" href={authHref("login", role)}>
                Sign in to operations <Icon name="arrow" size={17} />
              </ButtonLink>
            </div>
          )}
        </>
      )}
      {mode === "recover" && <Recover audience={audience} role={role} />}
    </AuthFrame>
  )
}

function Recover({ audience, role }: { audience: "person" | "staff" | "org" | "admin"; role: Role }) {
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle")
  const [error, setError] = useState<unknown>(null)

  if (audience === "staff" || audience === "admin") {
    return (
      <div className="auth-complete">
        <div className="auth-complete-note">
          <Icon name="shield" size={22} />
          <p>
            {audience === "staff"
              ? "A PIN can only be reset by the operations team, and a new phone has to be approved by them too. Ask your dispatcher, or contact us."
              : "A lost password or authenticator can only be replaced by a super admin, for your security. Ask one of them to reset it."}
          </p>
        </div>
        <ButtonLink className="primary full" href={authHref("login", role)}>
          Back to sign-in <Icon name="arrow" size={17} />
        </ButtonLink>
        <ButtonLink className="text-button centered" href="/contact">
          Contact the operations team
        </ButtonLink>
      </div>
    )
  }

  if (state === "sent") {
    return (
      <div className="auth-complete">
        <span className="confirmation-icon">
          <Icon name="check" size={34} />
        </span>
        <div className="auth-complete-note">
          <Icon name="shield" size={19} />
          <p>
            If <b>{email}</b> has a Go-Wash account, a link to choose a new password is on its way. It works once and expires in an
            hour.
          </p>
        </div>
        <ButtonLink className="primary full" href={authHref("login", role)}>
          Back to sign-in <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    )
  }

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault()
        setState("sending")
        setError(null)
        try {
          await authApi.forgot(email.trim())
          setState("sent")
        } catch (failure) {
          setError(failure)
          setState("idle")
        }
      }}
    >
      <AuthField label="Email" error={fieldProblem(error, "email")}>
        <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
      </AuthField>
      {error != null && (
        <p className="form-error" role="alert">
          {formMessage(error)}
        </p>
      )}
      <button className="primary full" disabled={state === "sending"}>
        {state === "sending" ? "Sending…" : "Email me a link"} <Icon name="arrow" size={17} />
      </button>
    </form>
  )
}
