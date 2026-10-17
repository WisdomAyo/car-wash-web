"use client"

import { useState } from "react"
import { Icon } from "@/components/Visuals"
import { api, ApiError } from "@/lib/api/client"

type Kind = "contact" | "company" | "estate"

/** The contact form: a question for the team, or a request for a company or estate account. It lands in the admin inbox. */
export default function ContactForm() {
  const [kind, setKind] = useState<Kind>("contact")
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "", organisation_name: "", website: "" })
  const [reference, setReference] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<ApiError | Error | null>(null)
  const set = (name: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: e.target.value })
  const problem = (name: string) => (error instanceof ApiError && error.code === "validation_failed" ? error.field(name) : undefined)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      const organisation = kind !== "contact"
      const response = await api<{ data: { reference?: string } }>("/inquiries", {
        method: "POST",
        anonymous: true,
        body: {
          kind: organisation ? "organisation" : "contact",
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
          website: form.website || undefined,
          details: organisation ? { type: kind === "estate" ? "estate" : "corporate", organisation_name: form.organisation_name.trim() } : undefined,
        },
      })
      setReference(response.data?.reference ?? "")
    } catch (failure) {
      setError(failure instanceof Error ? failure : new Error("Something went wrong."))
    } finally {
      setPending(false)
    }
  }

  return (
    <section className="contact-form public-section">
      <div className="eyebrow">LET&apos;S TALK</div>
      <h2>{reference !== null ? "We've got your message." : "A real conversation starts here."}</h2>
      {reference !== null ? (
        <p>
          Thank you. The team will reply by email{reference ? ` (your reference is ${reference})` : ""}.
        </p>
      ) : (
        <form onSubmit={submit}>
          <label>
            What is this about?
            <select value={kind} onChange={(e) => setKind(e.target.value as Kind)}>
              <option value="contact">A question or a concern</option>
              <option value="company">A company or fleet account</option>
              <option value="estate">An estate account</option>
            </select>
          </label>
          <div className="form-grid">
            <label>
              Your name
              <input required minLength={2} placeholder="Full name" value={form.name} onChange={set("name")} />
              {problem("name") && <small className="form-error">{problem("name")}</small>}
            </label>
            <label>
              Email
              <input type="email" required placeholder="you@company.com" value={form.email} onChange={set("email")} />
              {problem("email") && <small className="form-error">{problem("email")}</small>}
            </label>
          </div>
          <div className="form-grid">
            <label>
              Phone (optional)
              <input type="tel" placeholder="0803 123 4567" value={form.phone} onChange={set("phone")} />
              {problem("phone") && <small className="form-error">{problem("phone")}</small>}
            </label>
            {kind !== "contact" && (
              <label>
                {kind === "estate" ? "Estate name" : "Company name"}
                <input required placeholder={kind === "estate" ? "e.g. Parkview Estate" : "e.g. Meridian Holdings"} value={form.organisation_name} onChange={set("organisation_name")} />
                {problem("details.organisation_name") && <small className="form-error">{problem("details.organisation_name")}</small>}
              </label>
            )}
          </div>
          <label>
            How can we help?
            <textarea required minLength={5} placeholder="Tell us about your vehicles, estate or question." value={form.message} onChange={set("message")} />
            {problem("message") && <small className="form-error">{problem("message")}</small>}
          </label>
          {/* A field only bots fill in; people never see it. */}
          <input aria-hidden="true" tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }} />
          {error && !(error instanceof ApiError && error.code === "validation_failed") && <p className="form-error" role="alert">{error.message}</p>}
          <button className="primary" disabled={pending}>
            {pending ? "Sending…" : "Send message"} <Icon name="arrow" size={17} />
          </button>
        </form>
      )}
    </section>
  )
}
