"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CarArt, Icon } from "@/components/Visuals"
import Brand from "@/components/Brand"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import {
  authHref,
  operationsRoles,
  roles,
  workspaceHref,
  type AuthMode,
  type Role,
} from "@/lib/roles"

export default function Auth({
  mode,
  initialRole,
}: {
  mode: AuthMode
  initialRole: Role
}) {
  const router = useRouter()
  const [role, setRole] = useState<Role>(initialRole)
  const onComplete = () => router.push(workspaceHref(role))
  const [step, setStep] = useState(0)
  const [identity, setIdentity] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [resent, setResent] = useState(false)
  const [visible, setVisible] = useState(false)
  // Start the flow over when the audience or mode changes.
  const [flow, setFlow] = useState(`${role}:${mode}`)
  if (flow !== `${role}:${mode}`) {
    setFlow(`${role}:${mode}`)
    setStep(0)
    setError("")
    setCode("")
  }
  const register = mode === "register",
    recover = mode === "recover"
  const individual = role === "Customer",
    staff = role === "Washman",
    admin = role === "Super admin" || operationsRoles.includes(role)
  const org = role === "Corporate" || role === "Estate"
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    if (step === 0) {
      setStep(1)
      return
    }
    if (step === 1) {
      if (code !== "123456") {
        setError("Use the displayed demo code 123456 to continue.")
        return
      }
      if (recover && individual) onComplete()
      else if (register || recover) setStep(2)
      else onComplete()
      return
    }
    if (step === 2) {
      if (register && individual) setStep(3)
      else if (register && (staff || org)) setStep(4)
      else if (recover) setStep(4)
      else onComplete()
      return
    }
    if (step === 3) setStep(4)
  }
  const title =
    step === 4
      ? recover
        ? "You're ready to sign in."
        : org || staff
          ? "A good start. You're on our list."
          : "Welcome to a fresher routine."
      : step === 3
        ? "Your car, your identity."
        : step === 2
          ? recover
            ? "A fresh start for your access."
            : individual
              ? "Let's make it personal."
              : staff
                ? "Show us your standards."
                : "Tell us about your organisation."
          : step === 1
            ? "A little check. A lot of trust."
            : recover
              ? "Let's get you back in."
              : register
                ? individual
                  ? "Your first fresh start."
                  : staff
                    ? "Good work starts here."
                    : "Better care starts here."
                : "Welcome back to your space."
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <div className="pill-eyebrow">
            <span /> CARE THAT MEETS YOU WHERE YOU PARK
          </div>
          <h2>
            Five ways to move.
            <br />
            One calmer way
            <br /> to <em>stay fresh.</em>
          </h2>
          <p>
            Professional mobile car washing for homes, offices and approved
            outdoor spaces across Nigeria.
          </p>
          <div className="auth-car" aria-label="Five vehicle illustrations">
            <div className="auth-car-rail">
              <div className="auth-car-loop">
                <CarArt variant="suv" finish="emerald" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="pickup" finish="bronze" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="sedan" finish="silver" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="coupe" finish="sunset" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="jeep" finish="midnight" />
              </div>
            </div>
          </div>
          <div className="auth-story-proof">
            <Icon name="shield" size={20} />
            <span>
              Every wash has a clear record.
              <small>GPS tracked · Plate matched · You confirm</small>
            </span>
          </div>
        </div>
        <div className="auth-story-bottom">
          <span>HOME · OFFICE · ESTATE</span>
          <span>AVAILABLE ACROSS NIGERIA</span>
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-content-brand">
          <Brand />
        </div>
        <div className="auth-top">
          <ButtonLink href="/">
            <Icon name="arrow" size={15} /> Back to Go-Wash
          </ButtonLink>
          <span>
            {register ? "Already part of Go-Wash?" : "New to Go-Wash?"}{" "}
            <ButtonLink href={authHref(register ? "login" : "register", role)}>
              {register ? "Sign in" : "Get started"}
            </ButtonLink>
          </span>
        </div>
        <div className="auth-form-wrap">
          <>
            <div className="eyebrow">
              {recover
                ? "ACCOUNT RECOVERY"
                : register
                  ? "A LITTLE MORE CARE, STARTING TODAY"
                  : "YOUR PERSONAL GO-WASH SPACE"}
            </div>
            <h1>{title}</h1>
            <p className="auth-description">
              {step === 1
                ? `Enter the six-digit demo code for ${identity || "your account"}.`
                : step === 4
                  ? org || staff
                    ? "Our team reviews applications before activating access. You can explore a sample workspace below."
                    : "Your account journey is ready. Explore your new workspace."
                  : step === 0
                    ? "Choose your space. We'll take care of the next step."
                    : "A few thoughtful details help us take better care of you."}
            </p>
            {step === 0 && (
              <>
                <div className="auth-role-tabs">
                  {roles.map((r) => (
                    <button
                      className={
                        r === role || (r === "Super admin" && admin)
                          ? "selected"
                          : ""
                      }
                      onClick={() => setRole(r)}
                      key={r}
                    >
                      {r === "Super admin"
                        ? "Admin"
                        : r === "Washman"
                          ? "Staff"
                          : r}
                    </button>
                  ))}
                </div>
                {admin && (
                  <label>
                    Operations workspace
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as Role)}
                    >
                      {["Super admin", ...operationsRoles].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            )}
            <div className="auth-progress">
              <span className="current" />
              <span className={step > 0 ? "current" : ""} />
              <span className={step > 1 ? "current" : ""} />
            </div>
            {register && admin ? (
              <div className="auth-complete">
                <div className="auth-complete-note">
                  <Icon name="shield" size={22} />
                  <p>
                    Administrator accounts are invitation-only. A super admin
                    creates staff access with an approved role. Public
                    registration cannot grant operations permissions.
                  </p>
                </div>
                <ButtonLink
                  className="primary full"
                  href={authHref("login", role)}
                >
                  Sign in to operations <Icon name="arrow" size={17} />
                </ButtonLink>
                <ButtonLink className="text-button centered" href="/contact">
                  Contact the operations team
                </ButtonLink>
              </div>
            ) : step === 4 ? (
              <div className="auth-complete">
                <span className="confirmation-icon">
                  <Icon name="check" size={34} />
                </span>
                <div className="auth-complete-note">
                  <Icon name="shield" size={19} />
                  <p>
                    {recover
                      ? "Demo recovery completed. No real password was changed."
                      : staff
                        ? "Screening review pending. Production activation requires all six records to be verified and a registered device."
                        : org
                          ? "Account approval pending. Operations will agree your plan, pricing and access guidelines."
                          : "Vehicle profile created in this prototype. Production registration requires unique-plate validation."}
                  </p>
                </div>
                {recover ? (
                  <ButtonLink
                    className="primary full"
                    href={authHref("login", role)}
                  >
                    Return to sign-in
                    <Icon name="arrow" size={17} />
                  </ButtonLink>
                ) : (
                  <Button className="primary full" onClick={onComplete}>
                    Explore sample workspace
                    <Icon name="arrow" size={17} />
                  </Button>
                )}
              </div>
            ) : (
              <form onSubmit={submit}>
                {step === 0 && (
                  <>
                    {individual ? (
                      <label>
                        Phone number
                        <div className="phone-input">
                          <span>+234</span>
                          <input
                            required
                            type="tel"
                            pattern="[0-9 ()+-]{7,20}"
                            value={identity}
                            onChange={(e) => setIdentity(e.target.value)}
                            placeholder="801 234 5678"
                          />
                        </div>
                      </label>
                    ) : (
                      <label>
                        {staff ? "Staff ID" : "Work email"}
                        <input
                          required
                          type={staff ? "text" : "email"}
                          value={identity}
                          onChange={(e) => setIdentity(e.target.value)}
                          placeholder={
                            staff ? "GW-STAFF-024" : "you@organisation.com"
                          }
                        />
                      </label>
                    )}
                    {!individual && !recover && !register && (
                      <label>
                        {staff ? "Device PIN" : "Password"}
                        <div className="password-input">
                          <input
                            required
                            type={visible ? "text" : "password"}
                            minLength={staff ? 4 : 8}
                            placeholder={
                              staff
                                ? "Enter your 4-digit PIN"
                                : "Enter your password"
                            }
                          />
                          <button
                            type="button"
                            onClick={() => setVisible(!visible)}
                          >
                            {visible ? "Hide" : "Show"}
                          </button>
                        </div>
                      </label>
                    )}
                    {register && (
                      <label className="checkbox-label auth-consent">
                        <input required type="checkbox" />
                        <span>
                          I agree to outdoor-only service and the privacy
                          notice. Staff never enter private indoor premises.
                        </span>
                      </label>
                    )}
                    {!register && !recover && !individual && (
                      <ButtonLink
                        className="text-button auth-forgot"
                        href={authHref("recover", role)}
                      >
                        {staff
                          ? "Need help with your device or PIN?"
                          : "Forgot your password?"}
                      </ButtonLink>
                    )}
                    <button className="primary full">
                      {recover
                        ? "Begin recovery"
                        : individual
                          ? "Send verification code"
                          : register
                            ? "Start application"
                            : "Continue securely"}
                      <Icon name="arrow" size={17} />
                    </button>
                  </>
                )}
                {step === 1 && (
                  <>
                    <label>
                      Verification code
                      <input
                        className="otp-input"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        required
                        value={code}
                        onChange={(e) =>
                          setCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="– – – – – –"
                        autoComplete="one-time-code"
                      />
                    </label>
                    <div className="demo-code">
                      <Icon name="shield" size={16} />
                      <span>
                        Prototype code: <b>123456</b>
                        <small>
                          No SMS or email is sent.{" "}
                          {admin
                            ? "Production admin access requires a second factor."
                            : "Use this code to explore the flow."}
                        </small>
                      </span>
                    </div>
                    {error && (
                      <p className="form-error" role="alert">
                        {error}
                      </p>
                    )}
                    <button className="primary full">
                      Verify & continue <Icon name="arrow" size={17} />
                    </button>
                    <div className="auth-resend">
                      <span>
                        {resent
                          ? "Demo code is still 123456."
                          : "Didn't receive a code?"}
                      </span>
                      <button type="button" onClick={() => setResent(true)}>
                        Resend code
                      </button>
                    </div>
                    <button
                      type="button"
                      className="text-button centered"
                      onClick={() => setStep(0)}
                    >
                      Use a different {individual ? "number" : "account"}
                    </button>
                  </>
                )}
                {step === 2 && (
                  <>
                    {recover ? (
                      <>
                        <label>
                          New {staff ? "PIN" : "password"}
                          <input
                            type="password"
                            required
                            minLength={staff ? 4 : 8}
                            placeholder={
                              staff
                                ? "At least 4 digits"
                                : "At least 8 characters"
                            }
                          />
                        </label>
                        <p className="policy-note">
                          Demo recovery only. Staff device changes must be
                          approved by operations.
                        </p>
                      </>
                    ) : (
                      <>
                        <label>
                          {org ? "Organisation name" : "Your full name"}
                          <input
                            required
                            placeholder={
                              role === "Estate"
                                ? "e.g. Parkview Estate"
                                : org
                                  ? "e.g. Meridian Holdings"
                                  : "e.g. Tolu Adebayo"
                            }
                          />
                        </label>
                        <label>
                          {staff
                            ? "Home operating area"
                            : org
                              ? "Organisation address"
                              : "Email (optional)"}
                          <input
                            required={staff || org}
                            type={staff || org ? "text" : "email"}
                            placeholder={
                              staff
                                ? "e.g. Lekki"
                                : org
                                  ? "Street, area, state"
                                  : "you@example.com"
                            }
                          />
                        </label>
                        {org && (
                          <label>
                            {role === "Estate"
                              ? "Estimated households"
                              : "Fleet size"}
                            <select>
                              <option>1–10</option>
                              <option>11–50</option>
                              <option>51–100</option>
                              <option>100+</option>
                            </select>
                          </label>
                        )}
                        {staff && (
                          <>
                            <label>
                              Identification document
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                required
                              />
                            </label>
                            <label>
                              Guarantor name & contact
                              <input
                                required
                                placeholder="Full name and phone number"
                              />
                            </label>
                            <p className="policy-note">
                              Additional guarantor documentation, background
                              verification, undertaking and employment records
                              are reviewed by operations. Uploads in this demo
                              are not transmitted.
                            </p>
                          </>
                        )}
                      </>
                    )}
                    <button className="primary full">
                      {recover
                        ? "Save demo access details"
                        : individual
                          ? "Continue to your vehicle"
                          : "Submit demo application"}
                      <Icon name="arrow" size={17} />
                    </button>
                  </>
                )}
                {step === 3 && (
                  <>
                    <label>
                      Number plate
                      <input
                        required
                        placeholder="e.g. LND 482 JK"
                        className="plate-input"
                      />
                    </label>
                    <div className="form-grid">
                      <label>
                        Make
                        <input required placeholder="Mercedes-Benz" />
                      </label>
                      <label>
                        Model
                        <input required placeholder="C300" />
                      </label>
                    </div>
                    <div className="form-grid">
                      <label>
                        Colour
                        <input required placeholder="Midnight blue" />
                      </label>
                      <label>
                        Vehicle type
                        <select>
                          <option>Sedan</option>
                          <option>SUV</option>
                          <option>Van</option>
                        </select>
                      </label>
                    </div>
                    <p className="policy-note">
                      <Icon name="shield" size={16} /> Your plate links every
                      wash to the right vehicle.
                    </p>
                    <button className="primary full">
                      Create demo profile <Icon name="arrow" size={17} />
                    </button>
                  </>
                )}
              </form>
            )}
            <div className="auth-security">
              <Icon name="shield" size={15} /> Your details, treated with care.
              <span>Interactive prototype · Not live authentication</span>
            </div>
          </>
        </div>
        <div className="auth-bottom">
          Need a hand? <ButtonLink href="/contact">Talk to our team</ButtonLink>
          <span>Clean, proven, calm.</span>
        </div>
      </div>
    </div>
  )
}
