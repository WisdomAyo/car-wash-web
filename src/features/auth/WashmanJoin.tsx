"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import { authApi } from "@/lib/api/auth"
import { startSession } from "@/lib/auth"
import { staffLoginHref } from "@/lib/roles"
import { AuthField, fieldProblem, formMessage, PasswordInput } from "./fields"
import { StaffFrame } from "./StaffAuth"

const STEPS = ["About you", "Your guarantor", "Secure it"] as const

/** The API field names each step owns, so a server complaint can send the person back to the right step. */
const STEP_FIELDS: string[][] = [["name", "phone", "email", "home_zone"], ["guarantor_name", "guarantor_phone"], ["pin"]]

type Form = {
  name: string
  phone: string
  email: string
  home_zone: string
  guarantor_name: string
  guarantor_phone: string
  pin: string
  pin2: string
}

const EMPTY: Form = { name: "", phone: "", email: "", home_zone: "", guarantor_name: "", guarantor_phone: "", pin: "", pin2: "" }

/** The problem with a step's details that the browser can see before asking the server, or null. */
function problemWith(step: number, form: Form, agreed: boolean): string | null {
  if (step === 0) {
    if (form.name.trim().length < 2) return "Please enter your full name."
    if (form.phone.replace(/\D/g, "").length < 10) return "Please enter a phone number we can reach you on."
  }
  if (step === 1) {
    const name = form.guarantor_name.trim() !== ""
    const phone = form.guarantor_phone.trim() !== ""
    if (name !== phone) return "Add both your guarantor's name and phone, or leave both empty and add them later."
  }
  if (step === 2) {
    if (!/^\d{6,8}$/.test(form.pin)) return "Your PIN must be 6 to 8 digits."
    if (form.pin !== form.pin2) return "The two PINs are different."
    if (!agreed) return "Please confirm that you agree before you continue."
  }
  return null
}

/** Washman self-registration: three short steps, then straight into the application screen to upload papers. */
export default function WashmanJoin() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Form>(EMPTY)
  const [agreed, setAgreed] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [local, setLocal] = useState<string | null>(null)

  const set = (name: keyof Form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [name]: event.target.value })
    setLocal(null)
  }

  const next = () => {
    const problem = problemWith(step, form, agreed)
    setLocal(problem)
    if (!problem) {
      setError(null)
      setStep(step + 1)
    }
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (step < STEPS.length - 1) return next()
    const problem = problemWith(step, form, agreed)
    setLocal(problem)
    if (problem) return
    setPending(true)
    setError(null)
    try {
      const response = await authApi.apply({
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        pin: form.pin,
        home_zone: form.home_zone.trim() || undefined,
        guarantor_name: form.guarantor_name.trim() || undefined,
        guarantor_phone: form.guarantor_phone.trim() || undefined,
      })
      startSession("applicant", { token: response.token, user: response.user })
      router.push("/workspace/applicant")
    } catch (failure) {
      setError(failure)
      setPending(false)
      // Show the step that holds the first field the server complained about.
      const wrong = STEP_FIELDS.findIndex((fields) => fields.some((field) => fieldProblem(failure, field)))
      if (wrong >= 0) setStep(wrong)
    }
  }

  return (
    <StaffFrame
      team="join"
      eyebrow="BECOME A WASHMAN"
      title="Apply to join the team."
      description="Tell us about yourself. We verify every washman before they start, and you can upload your papers right after this."
      below={
        <div className="sa-invite">
          <div>
            <strong>Already applied, or already on the team?</strong>
            <small>Sign in with your staff code and PIN.</small>
          </div>
          <ButtonLink className="sa-invite-link" href={staffLoginHref()}>
            Staff sign-in <Icon name="arrow" size={15} />
          </ButtonLink>
        </div>
      }
    >
      <ol className="sa-steps" aria-label="Application steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index < step ? "done" : index === step ? "current" : ""} aria-current={index === step ? "step" : undefined}>
            <span>{index < step ? <Icon name="check" size={13} /> : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>

      <form onSubmit={submit} noValidate>
        {step === 0 && (
          <>
            <AuthField label="Your full name" error={fieldProblem(error, "name")}>
              <input required autoComplete="name" value={form.name} onChange={set("name")} placeholder="e.g. Emeka Okoro" />
            </AuthField>
            <AuthField label="Phone number" hint="You will use this phone to work. It is tied to your account." error={fieldProblem(error, "phone")}>
              <input required type="tel" autoComplete="tel" value={form.phone} onChange={set("phone")} placeholder="0803 123 4567" />
            </AuthField>
            <div className="form-grid">
              <AuthField label="Email (optional)" hint="We write to you here about your application." error={fieldProblem(error, "email")}>
                <input type="email" autoComplete="email" value={form.email} onChange={set("email")} />
              </AuthField>
              <AuthField label="Home operating area" error={fieldProblem(error, "home_zone")}>
                <input value={form.home_zone} onChange={set("home_zone")} placeholder="e.g. Lekki" />
              </AuthField>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <p className="sa-lede">
              A guarantor is someone who knows you and can vouch for you. You can add them now, or later from your application page.
            </p>
            <AuthField label="Guarantor's full name" error={fieldProblem(error, "guarantor_name")}>
              <input value={form.guarantor_name} onChange={set("guarantor_name")} placeholder="Full name" />
            </AuthField>
            <AuthField label="Guarantor's phone" error={fieldProblem(error, "guarantor_phone")}>
              <input type="tel" value={form.guarantor_phone} onChange={set("guarantor_phone")} placeholder="0803 123 4567" />
            </AuthField>
          </>
        )}

        {step === 2 && (
          <>
            <p className="sa-lede">Choose the PIN you will sign in with, together with the staff code we give you.</p>
            <div className="form-grid">
              <AuthField label="Choose a PIN" hint="6 to 8 digits." error={fieldProblem(error, "pin")}>
                <PasswordInput required inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} autoComplete="new-password" value={form.pin} onChange={set("pin")} />
              </AuthField>
              <AuthField label="Repeat the PIN">
                <PasswordInput required inputMode="numeric" pattern="[0-9]{6,8}" maxLength={8} autoComplete="new-password" value={form.pin2} onChange={set("pin2")} />
              </AuthField>
            </div>
            <label className="checkbox-label auth-consent sa-consent">
              <input type="checkbox" checked={agreed} onChange={(event) => { setAgreed(event.target.checked); setLocal(null) }} />
              <span>
                I understand that Go-Wash verifies every washman, including a background check, that I work outdoors only, and I agree to the{" "}
                <ButtonLink href="/privacy">privacy notice</ButtonLink> and <ButtonLink href="/terms">terms</ButtonLink>.
              </span>
            </label>
          </>
        )}

        {(local || error != null) && (
          <p className="form-error" role="alert">
            {local ?? formMessage(error)}
          </p>
        )}

        <div className="sa-actions">
          {step > 0 && (
            <button type="button" className="sa-back" onClick={() => { setStep(step - 1); setLocal(null) }} disabled={pending}>
              Back
            </button>
          )}
          <button className="primary" disabled={pending}>
            {pending ? "Sending your application…" : step < STEPS.length - 1 ? "Continue" : "Start my application"} <Icon name="arrow" size={17} />
          </button>
        </div>
      </form>
      <p className="sa-reassure">
        <Icon name="shield" size={15} /> Next you upload your ID and your guarantor&apos;s papers. We arrange the background check, and nobody works before every item is verified.
      </p>
    </StaffFrame>
  )
}
