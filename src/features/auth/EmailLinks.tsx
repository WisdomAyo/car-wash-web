"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Icon } from "@/components/Visuals"
import ButtonLink from "@/components/ui/ButtonLink"
import { authApi } from "@/lib/api/auth"
import { ApiError } from "@/lib/api/client"
import { startSession, useSession } from "@/lib/auth"
import { authHref, workspaceHref } from "@/lib/roles"
import AuthFrame from "./AuthFrame"
import { AuthField, fieldProblem, formMessage, PasswordInput } from "./fields"

type LinkProps = { token?: string; email?: string }

const BrokenLink = ({ what }: { what: string }) => (
  <AuthFrame eyebrow="THIS LINK DID NOT WORK" title="We could not use that link.">
    <div className="auth-complete">
      <div className="auth-complete-note">
        <Icon name="shield" size={22} />
        <p>
          The link to {what} is incomplete, has already been used, or has expired. Links work once, and only for a limited time.
        </p>
      </div>
      <ButtonLink className="primary full" href={authHref("recover")}>
        Send me a new link <Icon name="arrow" size={17} />
      </ButtonLink>
    </div>
  </AuthFrame>
)

/** Choosing a new password from the emailed link. */
export function ResetPassword({ token, email }: LinkProps) {
  return <NewPassword token={token} email={email} invited={false} />
}

/** An invitation (company owner, manager, confirmer): choose the first password and go straight in. */
export function SetPassword({ token, email }: LinkProps) {
  return <NewPassword token={token} email={email} invited />
}

function NewPassword({ token, email, invited }: LinkProps & { invited: boolean }) {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [again, setAgain] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [done, setDone] = useState(false)

  if (!token || !email) return <BrokenLink what={invited ? "set your password" : "reset your password"} />

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== again) {
      setError(new Error("The two passwords are different."))
      return
    }
    setPending(true)
    setError(null)
    try {
      if (invited) {
        startSession("customer", await authApi.setPassword({ token, email, password }))
        router.push(workspaceHref("Customer"))
      } else {
        await authApi.reset({ token, email, password })
        setDone(true)
      }
    } catch (failure) {
      setError(failure)
      setPending(false)
    }
  }

  if (done) {
    return (
      <AuthFrame eyebrow="ALL SET" title="Your password is changed.">
        <div className="auth-complete">
          <span className="confirmation-icon">
            <Icon name="check" size={34} />
          </span>
          <div className="auth-complete-note">
            <Icon name="shield" size={19} />
            <p>You were signed out everywhere for your safety. Sign in with your new password.</p>
          </div>
          <ButtonLink className="primary full" href={authHref("login")}>
            Sign in <Icon name="arrow" size={17} />
          </ButtonLink>
        </div>
      </AuthFrame>
    )
  }

  const linkProblem = error instanceof ApiError && error.code === "link_invalid"
  return (
    <AuthFrame
      eyebrow={invited ? "WELCOME TO GO-WASH" : "A FRESH START FOR YOUR ACCESS"}
      title={invited ? "Choose your password." : "Choose a new password."}
      description={`For ${email}. At least 8 characters, with a letter and a number.`}
    >
      <form onSubmit={submit}>
        <AuthField label="New password" error={fieldProblem(error, "password")}>
          <PasswordInput required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </AuthField>
        <AuthField label="Repeat the password">
          <PasswordInput required minLength={8} autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </AuthField>
        {error != null && (
          <p className="form-error" role="alert">
            {formMessage(error)}
          </p>
        )}
        {linkProblem && (
          <ButtonLink className="text-button centered" href={authHref("recover")}>
            Send me a new link
          </ButtonLink>
        )}
        <button className="primary full" disabled={pending}>
          {pending ? "Saving…" : invited ? "Save and continue" : "Save my password"} <Icon name="arrow" size={17} />
        </button>
      </form>
    </AuthFrame>
  )
}

/** Confirms an email address as soon as the link is opened. */
export function VerifyEmail({ token, email }: LinkProps) {
  const session = useSession()
  const [state, setState] = useState<"working" | "ok" | "failed">("working")
  const [message, setMessage] = useState("")
  const started = useRef(false)

  useEffect(() => {
    if (!token || !email || started.current) return
    started.current = true
    authApi
      .verifyEmail({ token, email })
      .then(() => setState("ok"))
      .catch((failure) => {
        setMessage(formMessage(failure))
        setState("failed")
      })
  }, [token, email])

  if (!token || !email) return <BrokenLink what="confirm your email" />

  return (
    <AuthFrame
      eyebrow="EMAIL CONFIRMATION"
      title={state === "ok" ? "Your email is confirmed." : state === "failed" ? "We could not confirm it." : "Confirming your email…"}
    >
      <div className="auth-complete">
        {state === "ok" && (
          <span className="confirmation-icon">
            <Icon name="check" size={34} />
          </span>
        )}
        {state === "failed" && (
          <div className="auth-complete-note">
            <Icon name="shield" size={22} />
            <p>{message || "The link may have expired. Sign in and ask for a new confirmation email from your settings."}</p>
          </div>
        )}
        <ButtonLink className="primary full" href={session ? workspaceHref("Customer") : authHref("login")}>
          {session ? "Go to my space" : "Sign in"} <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    </AuthFrame>
  )
}
