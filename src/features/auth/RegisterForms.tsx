"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Icon } from "@/components/Visuals"
import ButtonLink from "@/components/ui/ButtonLink"
import { authApi } from "@/lib/api/auth"
import { api } from "@/lib/api/client"
import { startSession } from "@/lib/auth"
import { workspaceHref, type Role } from "@/lib/roles"
import { AuthField, fieldProblem, formMessage, PasswordInput } from "./fields"

/** Runs a sign-up call, keeping the pending/error state every form here needs. */
function useSubmit<T>(run: () => Promise<T>, done: (result: T) => void) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      done(await run())
    } catch (failure) {
      setError(failure)
      setPending(false)
    }
  }
  return { submit, pending, error }
}

const Problem = ({ error }: { error: unknown }) =>
  error ? (
    <p className="form-error" role="alert">
      {formMessage(error)}
    </p>
  ) : null

/** A customer's account: email and password first, a phone number if they want one. */
export function CustomerRegisterForm({ referral }: { referral?: string }) {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", referral_code: referral ?? "" })
  const [agreed, setAgreed] = useState(false)
  const set = (name: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [name]: event.target.value })

  const { submit, pending, error } = useSubmit(
    () =>
      authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        referral_code: form.referral_code.trim() || undefined,
      }),
    (response) => {
      startSession("customer", response)
      router.push(workspaceHref("Customer"))
    },
  )

  return (
    <form onSubmit={submit}>
      <AuthField label="Your full name" error={fieldProblem(error, "name")}>
        <input required autoComplete="name" value={form.name} onChange={set("name")} placeholder="e.g. Tolu Adebayo" />
      </AuthField>
      <AuthField label="Email" error={fieldProblem(error, "email")}>
        <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
      </AuthField>
      <AuthField label="Phone number (optional)" hint="Only used to reach you about a wash." error={fieldProblem(error, "phone")}>
        <input type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="0803 123 4567" />
      </AuthField>
      <AuthField label="Password" hint="At least 8 characters, with a letter and a number." error={fieldProblem(error, "password")}>
        <PasswordInput required minLength={8} autoComplete="new-password" value={form.password} onChange={set("password")} />
      </AuthField>
      <AuthField label="Referral code (optional)" error={fieldProblem(error, "referral_code")}>
        <input value={form.referral_code} onChange={set("referral_code")} placeholder="A friend's code" autoCapitalize="characters" />
      </AuthField>
      <label className="checkbox-label auth-consent">
        <input required type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
        <span>
          I agree to outdoor-only service and to the <ButtonLink href="/privacy">privacy notice</ButtonLink>. Staff never enter
          private indoor premises.
        </span>
      </label>
      <Problem error={error} />
      <button className="primary full" disabled={pending || !agreed}>
        {pending ? "Creating your account…" : "Create my account"} <Icon name="arrow" size={17} />
      </button>
    </form>
  )
}

/** Self-registration for washmen: details, a PIN, and a guarantor. Papers are uploaded next, on the applicant screen. */
export function WashmanApplyForm() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", phone: "", email: "", home_zone: "", guarantor_name: "", guarantor_phone: "", pin: "", pin2: "" })
  const [mismatch, setMismatch] = useState(false)
  const set = (name: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [name]: event.target.value })

  const { submit, pending, error } = useSubmit(
    async () => {
      if (form.pin !== form.pin2) {
        setMismatch(true)
        throw new Error("The two PINs are different.")
      }
      setMismatch(false)
      return authApi.apply({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        pin: form.pin,
        home_zone: form.home_zone.trim() || undefined,
        guarantor_name: form.guarantor_name.trim() || undefined,
        guarantor_phone: form.guarantor_phone.trim() || undefined,
      })
    },
    (response) => {
      startSession("applicant", { token: response.token, user: response.user })
      router.push("/workspace/applicant")
    },
  )

  return (
    <form onSubmit={submit}>
      <AuthField label="Your full name" error={fieldProblem(error, "name")}>
        <input required autoComplete="name" value={form.name} onChange={set("name")} placeholder="e.g. Emeka Okoro" />
      </AuthField>
      <div className="form-grid">
        <AuthField label="Phone number" error={fieldProblem(error, "phone")}>
          <input required type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="0803 123 4567" />
        </AuthField>
        <AuthField label="Email (optional)" hint="We write to you here about your application." error={fieldProblem(error, "email")}>
          <input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </AuthField>
      </div>
      <AuthField label="Home operating area" error={fieldProblem(error, "home_zone")}>
        <input value={form.home_zone} onChange={set("home_zone")} placeholder="e.g. Lekki" />
      </AuthField>
      <div className="form-grid">
        <AuthField label="Guarantor's name" error={fieldProblem(error, "guarantor_name")}>
          <input value={form.guarantor_name} onChange={set("guarantor_name")} placeholder="Full name" />
        </AuthField>
        <AuthField label="Guarantor's phone" error={fieldProblem(error, "guarantor_phone")}>
          <input type="tel" value={form.guarantor_phone} onChange={set("guarantor_phone")} placeholder="0803 123 4567" />
        </AuthField>
      </div>
      <div className="form-grid">
        <AuthField label="Choose a PIN" hint="6 to 8 digits. You sign in with it." error={fieldProblem(error, "pin")}>
          <PasswordInput required inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} autoComplete="new-password" value={form.pin} onChange={set("pin")} />
        </AuthField>
        <AuthField label="Repeat the PIN" error={mismatch ? "The two PINs are different." : undefined}>
          <PasswordInput required inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} autoComplete="new-password" value={form.pin2} onChange={set("pin2")} />
        </AuthField>
      </div>
      <p className="policy-note">
        <Icon name="shield" size={16} /> Next you upload your ID and your guarantor&apos;s papers. We arrange the background check, and
        nobody works before every item is verified.
      </p>
      <Problem error={error} />
      <button className="primary full" disabled={pending}>
        {pending ? "Sending your application…" : "Start my application"} <Icon name="arrow" size={17} />
      </button>
    </form>
  )
}

/** Companies and estates are set up by Go-Wash: this sends the request to the inbox. */
export function OrganisationRequestForm({ role }: { role: Extract<Role, "Corporate" | "Estate"> }) {
  const estate = role === "Estate"
  const [form, setForm] = useState({ name: "", email: "", phone: "", organisation_name: "", address: "", size: "1–10", message: "" })
  const [reference, setReference] = useState("")
  const set = (name: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [name]: event.target.value })

  const { submit, pending, error } = useSubmit(
    () =>
      api<{ data: { reference: string } }>("/inquiries", {
        method: "POST",
        anonymous: true,
        body: {
          kind: "organisation",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim() || `We would like a ${estate ? "estate" : "company"} account for ${form.organisation_name}.`,
          details: {
            type: estate ? "estate" : "corporate",
            organisation_name: form.organisation_name.trim(),
            address: form.address.trim() || undefined,
            size: form.size,
          },
        },
      }),
    (response) => setReference(response.data.reference),
  )

  if (reference) {
    return (
      <div className="auth-complete">
        <span className="confirmation-icon">
          <Icon name="check" size={34} />
        </span>
        <div className="auth-complete-note">
          <Icon name="shield" size={19} />
          <p>
            Thank you. Your request is with the team (reference <b>{reference}</b>). We reply by email to agree your plan and set up your
            account; the person named on the request then gets an invitation to choose a password.
          </p>
        </div>
        <ButtonLink className="primary full" href="/">
          Back to Go-Wash <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    )
  }

  return (
    <form onSubmit={submit}>
      <AuthField label="Your name" error={fieldProblem(error, "name")}>
        <input required autoComplete="name" value={form.name} onChange={set("name")} />
      </AuthField>
      <div className="form-grid">
        <AuthField label="Work email" error={fieldProblem(error, "email")}>
          <input required type="email" autoComplete="email" value={form.email} onChange={set("email")} />
        </AuthField>
        <AuthField label="Phone (optional)" error={fieldProblem(error, "phone")}>
          <input type="tel" value={form.phone} onChange={set("phone")} />
        </AuthField>
      </div>
      <AuthField label={estate ? "Estate name" : "Organisation name"} error={fieldProblem(error, "details.organisation_name")}>
        <input required value={form.organisation_name} onChange={set("organisation_name")} placeholder={estate ? "e.g. Parkview Estate" : "e.g. Meridian Holdings"} />
      </AuthField>
      <div className="form-grid">
        <AuthField label="Address">
          <input value={form.address} onChange={set("address")} placeholder="Street, area, state" />
        </AuthField>
        <AuthField label={estate ? "Households" : "Fleet size"}>
          <select value={form.size} onChange={set("size")}>
            {["1–10", "11–50", "51–100", "100+"].map((size) => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </AuthField>
      </div>
      <AuthField label="Anything we should know? (optional)">
        <textarea rows={3} value={form.message} onChange={set("message")} />
      </AuthField>
      <Problem error={error} />
      <button className="primary full" disabled={pending}>
        {pending ? "Sending…" : "Send my request"} <Icon name="arrow" size={17} />
      </button>
    </form>
  )
}
