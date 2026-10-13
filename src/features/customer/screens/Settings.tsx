"use client"

import { useState } from "react"
import { Async, Empty, Notice, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { CheckField, Field, useForm } from "@/components/app/forms"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import type { Consent, DataRequest, Preferences, User } from "@/lib/api/types"
import { authApi } from "@/lib/api/auth"
import { bytes, humanise, stamp } from "@/lib/format"
import { sessionStore } from "@/lib/session"

/** Everything about the account itself: details, password, preferences, terms, and the right to a copy of your data or deletion. */
export default function Settings() {
  return (
    <>
      <PageHeader eyebrow="YOUR ACCOUNT" title="Settings" description="Your details, how we reach you, and your data." />
      <ProfilePanel />
      <PasswordPanel />
      <PreferencesPanel />
      <ConsentsPanel />
      <DataPanel />
    </>
  )
}

function ProfilePanel() {
  const me = useResource<User>("/me")
  return (
    <Panel title="Your details">
      <Async query={me}>{(user) => <ProfileForm key={user.id} user={user} />}</Async>
    </Panel>
  )
}

function ProfileForm({ user }: { user: User }) {
  const form = useForm({ name: user.name, email: user.email ?? "", phone: user.phone ?? "" })
  const save = useAction(
    async () => (await api<{ data: User }>("/me", { method: "PATCH", body: { name: form.values.name, email: String(form.values.email).trim() || null, phone: String(form.values.phone).trim() || null } })).data,
    { invalidate: ["/me"], success: "Details saved.", onSuccess: (u) => sessionStore.patchUser({ name: u.name, email: u.email, phone: u.phone }) },
  )
  const resend = useAction(() => authApi.resendConfirmation(), { success: "We sent a confirmation email." })
  return (
    <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
      <div className="form-grid">
        <Field label="Full name" error={fieldError(save.error, "name")}><input {...form.field("name")} required /></Field>
        <Field label="Email" error={fieldError(save.error, "email")} hint={user.email ? (user.email_verified ? "Confirmed" : "Not confirmed yet") : undefined}>
          <input {...form.field("email")} type="email" />
        </Field>
      </div>
      <Field label="Phone number" error={fieldError(save.error, "phone")}><input {...form.field("phone")} type="tel" /></Field>
      <div className="actions">
        {user.email && !user.email_verified && <button type="button" className="secondary" onClick={() => resend.run(undefined)} disabled={resend.pending}>Resend confirmation email</button>}
        <button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Save details"}</button>
      </div>
    </form>
  )
}

function PasswordPanel() {
  const form = useForm({ current_password: "", password: "" })
  const me = useResource<User>("/me")
  const save = useAction(() => api("/auth/password", { method: "PUT", body: { current_password: form.values.current_password || undefined, password: form.values.password } }), {
    success: "Password changed. Your other devices are signed out.",
    onSuccess: () => form.reset(),
  })
  return (
    <Panel title="Password" description={me.data && !me.data.has_password ? "You signed in with a phone code. Set a password to sign in with your email too." : undefined}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        {me.data?.has_password && (
          <Field label="Current password" error={fieldError(save.error, "current_password")}><input {...form.field("current_password")} type="password" autoComplete="current-password" required /></Field>
        )}
        <Field label="New password" hint="At least 8 characters, with a letter and a number." error={fieldError(save.error, "password")}>
          <input {...form.field("password")} type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <div className="actions"><button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Change password"}</button></div>
      </form>
    </Panel>
  )
}

function PreferencesPanel() {
  const prefs = useResource<Preferences>("/preferences")
  const save = useAction((body: Partial<Preferences>) => api("/preferences", { method: "PUT", body }), { invalidate: ["/preferences"], success: "Saved." })
  return (
    <Panel title="Preferences">
      <Async query={prefs}>
        {(p) => (
          <div className="kit-form">
            <Field label="Language">
              <select value={p.language} onChange={(e) => save.run({ language: e.target.value })}>
                {[["en", "English"], ["pcm", "Pidgin"], ["yo", "Yorùbá"], ["ha", "Hausa"], ["ig", "Igbo"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </Field>
            <CheckField checked={p.notifications.push} onChange={(e) => save.run({ notifications: { ...p.notifications, push: e.target.checked } })}>Tell me when a washman is assigned, arrives, or finishes.</CheckField>
            <CheckField checked={p.notifications.marketing} onChange={(e) => save.run({ notifications: { ...p.notifications, marketing: e.target.checked } })}>Send me offers and news.</CheckField>
          </div>
        )}
      </Async>
    </Panel>
  )
}

function ConsentsPanel() {
  const consents = useItems<Consent>("/consents")
  const withdraw = useAction((type: string) => api(`/consents/${type}`, { method: "DELETE" }), { invalidate: ["/consents"], success: "Withdrawn. You will be asked to accept it again before booking." })
  return (
    <Panel title="Terms you accepted" description="Withdrawing one pauses booking until you accept it again.">
      <Async query={consents}>
        {() => (
          <Table rows={consents.items} rowKey={(c) => c.type} columns={[
            { header: "Document", cell: (c) => <Two top={humanise(c.type)} bottom={`Version ${c.version}`} /> },
            { header: "Accepted", cell: (c) => (c.accepted_at ? stamp(c.accepted_at) : "—") },
            { header: "", className: "right", cell: (c) => (c.accepted ? <button className="kit-link kit-danger" onClick={() => withdraw.run(c.type)}>Withdraw</button> : <Pill status="pending" label="Not accepted" />) },
          ]} />
        )}
      </Async>
    </Panel>
  )
}

function DataPanel() {
  const requests = useItems<DataRequest>("/data-requests")
  const [type, setType] = useState<"copy" | "deletion" | null>(null)
  const form = useForm({ note: "", current_password: "" })
  const ask = useAction(
    () => api("/data-requests", { method: "POST", body: { type, note: String(form.values.note).trim() || undefined, current_password: form.values.current_password || undefined } }),
    { invalidate: ["/data-requests"], success: "We have your request.", onSuccess: () => { setType(null); form.reset() } },
  )
  const open = (t: string) => requests.items.some((r) => r.type === t && r.status === "pending")
  return (
    <Panel title="Your data" description="You can ask for a copy of everything we hold about you, or for your account to be deleted.">
      <div className="kit-row" style={{ marginBottom: 16 }}>
        <button className="secondary" disabled={open("copy")} onClick={() => setType("copy")}>Ask for a copy of my data</button>
        <button className="secondary kit-danger" disabled={open("deletion")} onClick={() => setType("deletion")}>Delete my account</button>
      </div>
      {type && (
        <form className="kit-form" style={{ marginBottom: 20 }} onSubmit={(e) => { e.preventDefault(); ask.run() }}>
          {type === "deletion" && <Notice tone="warn">Deleting removes your personal details for good. Payment records the law requires are kept without your name. It cannot be done while a booking or payment is unfinished. Confirm with your password.</Notice>}
          {type === "deletion" && <Field label="Your password" error={fieldError(ask.error, "current_password")}><input {...form.field("current_password")} type="password" required /></Field>}
          <Field label="Anything we should know? (optional)"><textarea {...form.field("note")} rows={2} /></Field>
          <div className="actions"><button type="button" className="secondary" onClick={() => setType(null)}>Cancel</button><button className={type === "deletion" ? "kit-btn-danger" : "primary"} disabled={ask.pending}>{ask.pending ? "Sending…" : type === "copy" ? "Request my copy" : "Request deletion"}</button></div>
        </form>
      )}
      {requests.items.length === 0 ? <Empty icon="file" title="No requests." /> : (
        <Table rows={requests.items} rowKey={(r) => r.id} columns={[
          { header: "Request", cell: (r) => <Two top={r.type === "copy" ? "Copy of my data" : "Delete my account"} bottom={`Asked ${stamp(r.requested_at)}`} /> },
          { header: "Status", cell: (r) => <Pill status={r.status} /> },
          { header: "Answer due", cell: (r) => stamp(r.due_at) },
          { header: "", className: "right", cell: (r) => (r.download_url ? <a className="kit-link" href={r.download_url}>Download ({bytes(r.download_size_bytes ?? 0)})</a> : r.decision_note ?? "") },
        ]} />
      )}
    </Panel>
  )
}
