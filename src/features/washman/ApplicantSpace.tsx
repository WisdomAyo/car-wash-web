"use client"

import { useState } from "react"
import { Async, Notice, PageHeader, Panel, Pill } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import PortalShell from "@/components/app/PortalShell"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useResource } from "@/lib/api/hooks"
import type { Application, ApplicationItem } from "@/lib/api/types"
import { RequireSession, useSignOut } from "@/lib/auth"
import { stamp } from "@/lib/format"
import { SCREENING_STATUS } from "@/lib/labels"

const base = "/workspace/applicant"

/** Where someone who applied to become a washman sees what is still needed, uploads papers, and waits for the decision. */
export default function ApplicantSpace() {
  return (
    <RequireSession kind="applicant" loginRole="Washman">
      {(session) => (
        <PortalShell
          session={session}
          title="Washman application"
          subtitle="Under review"
          icon="shield"
          root={base}
          groups={[{ label: "Your application", items: [{ label: "My application", href: base, icon: "file" }] }]}
        >
          <Application_ />
        </PortalShell>
      )}
    </RequireSession>
  )
}

const STAGE: Record<Application["stage"], { title: string; text: string; tone: "info" | "warn" | "bad" }> = {
  incomplete: { title: "Almost there.", text: "Upload the papers below. Once everything is in, our team reviews your application.", tone: "warn" },
  in_review: { title: "We are reviewing your application.", text: "You will get an email when there is a decision. You can still add or replace papers.", tone: "info" },
  approved: { title: "You are approved.", text: "Sign out, then sign in again as a washman with your staff code and PIN, on the phone you will work with.", tone: "info" },
  declined: { title: "Your application was not successful.", text: "", tone: "bad" },
}

function Application_() {
  const application = useResource<Application>("/applicant", undefined, { refetchInterval: 30_000 })
  const signOut = useSignOut()
  return (
    <>
      <PageHeader eyebrow="JOIN THE FIELD TEAM" title="Your application" description="Every washman is verified before their first job." />
      <Async query={application}>
        {(a) => {
          const stage = STAGE[a.stage]
          return (
            <>
              <Notice tone={stage.tone} icon={a.stage === "declined" ? "close" : "shield"}>
                <b>{stage.title}</b> {stage.text}
                {a.decision_note && <div style={{ marginTop: 6 }}>{a.decision_note}</div>}
                {a.stage === "approved" && (
                  <div style={{ marginTop: 10 }}>
                    <button className="primary kit-btn-small" onClick={signOut}>Sign out and sign in as a washman</button>
                  </div>
                )}
              </Notice>
              <div className="kit-grid side">
                <Panel title="Your papers" description="JPEG, PNG, WebP or PDF, up to 5 MB each. Only the Go-Wash team can open them.">
                  <div className="kit-list">
                    {a.items.map((item) => <PaperRow key={item.item} item={item} locked={a.stage === "approved" || a.stage === "declined"} />)}
                  </div>
                </Panel>
                <div className="kit-stack">
                  <Panel title="Your details"><DetailsForm key={a.applied_at} application={a} locked={a.stage === "approved" || a.stage === "declined"} /></Panel>
                  <Panel title="Your staff code"><p className="kit-mono" style={{ fontSize: 22, letterSpacing: 2 }}>{a.staff_code}</p><p className="kit-muted">You sign in with this and the PIN you chose. Applied {stamp(a.applied_at)}.</p></Panel>
                </div>
              </div>
            </>
          )
        }}
      </Async>
    </>
  )
}

function PaperRow({ item, locked }: { item: ApplicationItem; locked: boolean }) {
  const [file, setFile] = useState<File | null>(null)
  const upload = useAction(
    () => {
      const form = new FormData()
      form.set("item", item.item)
      form.set("file", file!)
      return api("/applicant/documents", { method: "POST", form })
    },
    { invalidate: ["/applicant"], success: "Uploaded.", onSuccess: () => setFile(null) },
  )
  const remove = useAction((id: string) => api(`/applicant/documents/${id}`, { method: "DELETE" }), { invalidate: ["/applicant"], success: "Removed." })
  const uploadable = ["identification", "guarantor_documents", "written_undertaking", "employment_documents"].includes(item.item)
  return (
    <div className="kit-item" style={{ alignItems: "flex-start" }}>
      <div className="grow">
        <h4>{item.label}</h4>
        {item.documents.map((d) => (
          <p key={d.id} className="kit-row" style={{ gap: 8 }}>
            {d.name}
            {!locked && <button className="kit-link kit-danger" onClick={() => remove.run(d.id)}>Remove</button>}
          </p>
        ))}
        {uploadable && !locked && item.status !== "verified" && (
          <form className="kit-row" style={{ marginTop: 8 }} onSubmit={(e) => { e.preventDefault(); upload.run() }}>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} key={item.documents.length} />
            <button className="secondary kit-btn-small" disabled={!file || upload.pending}>{upload.pending ? "Uploading…" : "Upload"}</button>
          </form>
        )}
        {!uploadable && item.status === "missing" && <p className="kit-faint">{item.item === "background_check" ? "Go-Wash arranges this for you." : "Complete the details on the right."}</p>}
      </div>
      <Pill status={item.status === "verified" ? "verified" : item.status === "rejected" ? "rejected" : item.status === "submitted" ? "submitted" : "pending"} label={SCREENING_STATUS[item.status] ?? item.status} />
    </div>
  )
}

function DetailsForm({ application, locked }: { application: Application; locked: boolean }) {
  const form = useForm({
    home_zone: application.home_zone ?? "",
    email: application.email ?? "",
    guarantor_name: application.guarantor.name ?? "",
    guarantor_phone: application.guarantor.phone ?? "",
  })
  const save = useAction(
    () => api("/applicant", { method: "PATCH", body: Object.fromEntries(Object.entries(form.values).filter(([, v]) => String(v).trim() !== "")) }),
    { invalidate: ["/applicant"], success: "Saved." },
  )
  return (
    <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
      <Field label="Home operating area" error={fieldError(save.error, "home_zone")}><input {...form.field("home_zone")} disabled={locked} /></Field>
      <Field label="Email" error={fieldError(save.error, "email")}><input {...form.field("email")} type="email" disabled={locked} /></Field>
      <Field label="Guarantor's name" error={fieldError(save.error, "guarantor_name")}><input {...form.field("guarantor_name")} disabled={locked} /></Field>
      <Field label="Guarantor's phone" error={fieldError(save.error, "guarantor_phone")}><input {...form.field("guarantor_phone")} type="tel" disabled={locked} /></Field>
      {!locked && <div className="actions"><button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Save details"}</button></div>}
    </form>
  )
}
