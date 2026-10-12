import { useState } from "react"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Heading from "../components/ui/Typography"
import { supabase } from "../lib/supabase"

export default function SupabaseAuth({
  mode,
  onNavigate,
}: {
  mode: string
  onNavigate: (route: string) => void
}) {
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [verified, setVerified] = useState(false)
  const register = mode === "register"

  async function sendCode() {
    if (!supabase || busy) return
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: register },
      })
      if (error) throw error
      setSent(true)
      setMessage(
        "Check your email for the verification code. Delivery may take a moment.",
      )
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to send a code. Please try again.",
      )
    } finally {
      setBusy(false)
    }
  }

  async function verifyCode() {
    if (!supabase || busy) return
    setBusy(true)
    setError("")
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      })
      if (error) throw error
      if (!data.session)
        throw new Error(
          "Verification did not create a session. Request a new code.",
        )
      setVerified(true)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to verify this code.",
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="eyebrow">YOUR GO-WASH ACCOUNT</div>
      <Heading level={1}>
        {verified
          ? "Your email is verified."
          : register
            ? "Your first fresh start."
            : "Welcome back to your space."}
      </Heading>
      <p className="auth-description">
        {verified
          ? "You are signed in with Supabase. Open your account to manage saved vehicles, locations and booking requests. Account storage requires the customer database migration."
          : "Sign in securely with an email code. Staff and organisation access must be approved by operations; signing up does not grant a privileged role."}
      </p>
      {verified ? (
        <Button className="primary full" onClick={() => onNavigate("account")}>
          Open my account
        </Button>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void (sent ? verifyCode() : sendCode())
          }}
        >
          <label>
            Email address
            <Input
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={sent || busy}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>
          {register && !sent && (
            <label className="checkbox-label auth-consent">
              <Input type="checkbox" required disabled={busy} />
              <span>
                I agree to the privacy notice and outdoor-only service.
              </span>
            </label>
          )}
          {sent && (
            <label>
              Email verification code
              <Input
                required
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                value={code}
                disabled={busy}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, ""))
                }
              />
            </label>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="policy-note" role="status">
              {message}
            </p>
          )}
          <Button type="submit" className="primary full" disabled={busy}>
            {busy
              ? "Please wait…"
              : sent
                ? "Verify email & sign in"
                : "Send email code"}
          </Button>
          {sent && (
            <div className="auth-resend">
              <Button disabled={busy} onClick={() => void sendCode()}>
                Resend code
              </Button>
              <Button
                disabled={busy}
                onClick={() => {
                  setSent(false)
                  setCode("")
                  setMessage("")
                  setError("")
                }}
              >
                Use another email
              </Button>
            </div>
          )}
        </form>
      )}
      <p className="policy-note">
        Email codes also restore access without a password. Phone OTP, staff
        PINs and admin MFA are not enabled yet.
      </p>
    </>
  )
}
