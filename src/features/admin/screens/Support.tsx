"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, Empty, Facts, Notice, PageHeader, Panel, Pill, Two } from "@/components/app/kit"
import { Field } from "@/components/app/forms"
import { Drawer } from "@/components/app/overlays"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import type { DataRequest, Inquiry, Ticket, TicketMessage, WindowRequest } from "@/lib/api/types"
import { bytes, humanise, relative, stamp, WEEKDAYS } from "@/lib/format"
import { base, useAdmin } from "../AdminSpace"
import { AdminList, ActionButton, ReasonButton } from "../parts"

const TICKET_STATUS = [{ value: "open", label: "Open" }, { value: "resolved", label: "Resolved" }]

export function Tickets() {
  return (
    <AdminList<Ticket>
      eyebrow="CUSTOMERS WRITING TO US" title="Tickets" description="Complaints, conduct reports, feedback and incidents raised on jobs."
      path="/admin/tickets" refetchInterval={30_000} rowKey={(t) => t.id} href={(t) => `${base}/tickets/${t.id}`}
      filters={[
        { param: "status", label: "Any status", initial: "open", options: TICKET_STATUS },
        { param: "type", label: "Any type", options: ["complaint", "conduct", "feedback", "incident"].map((v) => ({ value: v, label: humanise(v) })) },
      ]}
      columns={[
        { header: "Ticket", cell: (t) => <Two top={humanise(t.type)} bottom={t.body.slice(0, 90)} /> },
        { header: "About", cell: (t) => (t.category ? humanise(t.category) : "—") },
        { header: "Status", cell: (t) => <Pill status={t.status} /> },
        { header: "Opened", cell: (t) => relative(t.created_at) },
      ]}
      empty={<Empty icon="check" title="No tickets." />}
    />
  )
}

export function TicketDetail({ id }: { id: string }) {
  const ticket = useResource<Ticket>(`/admin/tickets/${id}`)
  const messages = useItems<TicketMessage>(`/admin/tickets/${id}/messages`, undefined, { refetchInterval: 20_000 })
  const { can } = useAdmin()
  const [body, setBody] = useState("")
  const [internal, setInternal] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const inv = [`/admin/tickets/${id}`, `/admin/tickets/${id}/messages`, "/admin/tickets", "/admin/dashboard"]

  const send = useAction(
    () => {
      const form = new FormData()
      form.set("body", body)
      form.set("internal", internal ? "1" : "0")
      files.forEach((f) => form.append("attachments[]", f))
      return api(`/admin/tickets/${id}/messages`, { method: "POST", form })
    },
    { invalidate: inv, success: internal ? "Note added." : "Reply sent.", onSuccess: () => { setBody(""); setFiles([]) } },
  )

  return (
    <>
      <PageHeader eyebrow="SUPPORT TICKET" title={ticket.data ? humanise(ticket.data.type) : "Ticket"} action={<Link className="secondary" href={`${base}/tickets`}>All tickets</Link>} />
      <Async query={ticket}>
        {(t) => (
          <div className="kit-grid side">
            <Panel title="Conversation" action={<Pill status={t.status} />}>
              <div className="kit-thread">
                <div className="kit-bubble">{t.body}<small>Customer · {stamp(t.created_at)}</small></div>
                {messages.items.map((m) => (
                  <div key={m.id} className={`kit-bubble ${m.kind === "note" ? "internal" : m.from === "you" ? "mine" : ""}`}>
                    {m.body}
                    {m.attachments.length > 0 && <div className="kit-row" style={{ marginTop: 8 }}>{m.attachments.map((a) => <a key={a.id} className="kit-link" href={a.url} target="_blank" rel="noreferrer">{a.name}</a>)}</div>}
                    <small>{m.kind === "note" ? "Internal note · " : ""}{m.author?.name ?? humanise(m.from)} · {stamp(m.at)}</small>
                  </div>
                ))}
              </div>
              {can("tickets.respond") && (
                <form className="kit-form" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); send.run() }}>
                  <Field label={internal ? "Internal note (the customer never sees this)" : "Reply to the customer"}><textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></Field>
                  <Field label="Attachments (optional)" hint="Up to 3 files, 2 MB each."><input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} /></Field>
                  <label className="kit-field check"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} /><span>Internal note only</span></label>
                  <div className="actions"><button className="primary" disabled={send.pending || !body.trim()}>{internal ? "Add note" : "Send reply"}</button></div>
                </form>
              )}
            </Panel>
            <div className="kit-stack">
              <Panel title="Details">
                <Facts items={[["Type", humanise(t.type)], ["Topic", t.category ? humanise(t.category) : null], ["Opened", stamp(t.created_at)], ["Outcome", t.decision ? humanise(t.decision) : null], ["Note", t.decision_note]]} />
                {t.job_id && <p style={{ marginTop: 12 }}><Link className="kit-link" href={`${base}/jobs/${t.job_id}`}>Open the job and its evidence</Link></p>}
              </Panel>
              {t.status !== "resolved" && (
                <Panel title="Decide">
                  <div className="kit-row">
                    {can("tickets.respond") && <Resolve id={id} type={t.type} invalidate={inv} />}
                    {can("tickets.escalate") && <ReasonButton label="Escalate" path={`/admin/tickets/${id}/escalate`} invalidate={inv} success="Escalated." description="Hand this to a dispatcher or finance for a decision you cannot make." />}
                  </div>
                </Panel>
              )}
            </div>
          </div>
        )}
      </Async>
    </>
  )
}

function Resolve({ id, type, invalidate }: { id: string; type: string; invalidate: string[] }) {
  const options: [string, string][] =
    type === "complaint"
      ? [["no_action", "Resolved, no action"], ["credit", "Goodwill credit (refund)"], ["rewash", "Order a re-wash"]]
      : type === "plate_conflict"
        ? [["reject", "Reject: ownership not proven"], ["transfer", "Transfer the vehicle to the requester"]]
        : [["resolved", "Resolved"], ["warning", "Resolved with a warning"], ["no_action", "No action needed"]]
  const [open, setOpen] = useState(false)
  const [decision, setDecision] = useState(options[0][0])
  const [note, setNote] = useState("")
  const [amount, setAmount] = useState("")
  const [rewash, setRewash] = useState("")
  const run = useAction(
    () =>
      api(`/admin/tickets/${id}/resolve`, {
        method: "POST",
        body: {
          decision,
          note: note || undefined,
          amount_kobo: decision === "credit" ? Math.round(Number(amount) * 100) : undefined,
          rewash_starts_at: decision === "rewash" && rewash ? new Date(rewash).toISOString() : undefined,
        },
      }),
    { invalidate, success: "Ticket resolved.", onSuccess: () => setOpen(false) },
  )
  if (!open) return <button className="primary" onClick={() => setOpen(true)}>Resolve</button>
  return (
    <form className="kit-form" style={{ width: "100%" }} onSubmit={(e) => { e.preventDefault(); run.run() }}>
      <Field label="Outcome">
        <select value={decision} onChange={(e) => setDecision(e.target.value)}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
      </Field>
      {decision === "credit" && <Field label="Amount (₦)" error={fieldError(run.error, "amount_kobo")} hint="Paid back through the refund process."><input type="number" min={1} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>}
      {decision === "rewash" && <Field label="Re-wash time" error={fieldError(run.error, "rewash_starts_at")}><input type="datetime-local" required value={rewash} onChange={(e) => setRewash(e.target.value)} /></Field>}
      <Field label="Note for the record"><textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} /></Field>
      <div className="actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={run.pending}>Resolve</button></div>
    </form>
  )
}

export function Inbox() {
  const [open, setOpen] = useState<Inquiry | null>(null)
  return (
    <>
      <AdminList<Inquiry>
        eyebrow="PEOPLE WITHOUT AN ACCOUNT" title="Inbox" description="The contact form, requests for company or estate accounts, and chats the assistant could not answer."
        path="/admin/inquiries" refetchInterval={30_000} rowKey={(i) => i.id}
        filters={[
          { param: "status", label: "Any status", initial: "new", options: [{ value: "new", label: "New" }, { value: "answered", label: "Answered" }, { value: "closed", label: "Closed" }] },
          { param: "kind", label: "Any kind", options: [{ value: "contact", label: "Contact form" }, { value: "organisation", label: "Account request" }, { value: "assistant", label: "Chat hand-over" }] },
        ]}
        columns={[
          { header: "From", cell: (i) => <button className="kit-link" onClick={() => setOpen(i)}><Two top={i.name} bottom={i.email} /></button> },
          { header: "Kind", cell: (i) => <Pill status={i.kind === "assistant" ? "escalated" : "info"} label={i.kind === "assistant" ? "Chat hand-over" : i.kind === "organisation" ? "Account request" : "Contact form"} tone="info" /> },
          { header: "Message", cell: (i) => i.message.slice(0, 80) },
          { header: "Status", cell: (i) => <Pill status={i.status} /> },
          { header: "Received", cell: (i) => relative(i.created_at) },
        ]}
        empty={<Empty icon="inbox" title="Inbox is clear." />}
      />
      {open && <InquiryDrawer inquiry={open} onClose={() => setOpen(null)} />}
    </>
  )
}


function InquiryDrawer({ inquiry, onClose }: { inquiry: Inquiry; onClose: () => void }) {
  const { can } = useAdmin()
  const [message, setMessage] = useState("")
  const inv = ["/admin/inquiries"]
  const reply = useAction(() => api(`/admin/inquiries/${inquiry.id}/reply`, { method: "POST", body: { message } }), { invalidate: inv, success: "Reply sent by email.", onSuccess: onClose })
  const details = inquiry.details as Record<string, unknown> | null
  return (
    <Drawer title={inquiry.name} eyebrow={`${inquiry.reference} · ${humanise(inquiry.kind)}`} onClose={onClose}>
      <Facts items={[["Email", inquiry.email], ["Phone", inquiry.phone], ["Received", stamp(inquiry.created_at)], ...(details ? Object.entries(details).filter(([, v]) => typeof v === "string" || typeof v === "boolean").map(([k, v]) => [humanise(k), String(v)] as [string, string]) : [])]} />
      <h3 style={{ marginTop: 18 }}>Message</h3>
      <p style={{ whiteSpace: "pre-wrap" }}>{inquiry.message}</p>
      {inquiry.reply && <><h3>Replies sent</h3><p style={{ whiteSpace: "pre-wrap" }}>{inquiry.reply}</p></>}
      {inquiry.kind === "organisation" && <Notice>To set this up, create the organisation in <Link className="kit-link" href={`${base}/organisations`}>Organisations</Link>; the named person gets an invitation email.</Notice>}
      {can("tickets.respond") && inquiry.status !== "closed" && (
        <form className="kit-form" onSubmit={(e) => { e.preventDefault(); reply.run() }}>
          <Field label="Reply by email" error={fieldError(reply.error, "message")} hint={inquiry.kind === "assistant" ? "Also appears in the visitor's chat." : undefined}><textarea required rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></Field>
          <div className="actions">
            <ActionButton label="Close without replying" path={`/admin/inquiries/${inquiry.id}/close`} invalidate={inv} success="Closed." onDone={onClose} />
            <button className="primary" disabled={reply.pending}>{reply.pending ? "Sending…" : "Send reply"}</button>
          </div>
        </form>
      )}
    </Drawer>
  )
}

export function WindowRequests() {
  return (
    <AdminList<WindowRequest>
      eyebrow="ESTATE MANAGERS ASKING" title="Estate requests" description="A manager proposes new wash days. Approving replaces the estate's schedule."
      path="/admin/window-requests" rowKey={(w) => w.id}
      filters={[{ param: "status", label: "Any status", initial: "pending", options: ["pending", "approved", "rejected"].map((v) => ({ value: v, label: humanise(v) })) }]}
      columns={[
        { header: "Estate", cell: (w) => <Two top={w.estate?.name} bottom={`Asked by ${w.requested_by?.name}`} /> },
        { header: "Wanted", cell: (w) => <span className="kit-muted">{w.windows.map((x) => `${WEEKDAYS[x.weekday].slice(0, 3)} ${x.starts_at}`).join(", ") || "No wash days"}</span> },
        { header: "Note", cell: (w) => w.note ?? "—" },
        { header: "Status", cell: (w) => <Pill status={w.status} /> },
        { header: "", className: "right", cell: (w) => w.status === "pending" ? (
          <span className="kit-row" style={{ justifyContent: "flex-end" }}>
            <ActionButton small primary label="Approve" path={`/admin/window-requests/${w.id}/approve`} invalidate={["/admin/window-requests"]} success="Approved. The estate's schedule is updated." />
            <ReasonButton small label="Decline" path={`/admin/window-requests/${w.id}/reject`} invalidate={["/admin/window-requests"]} success="Declined." />
          </span>
        ) : (w.decision_note ?? "") },
      ]}
      empty={<Empty icon="clock" title="No requests waiting." />}
    />
  )
}

export function DataRequests() {
  return (
    <AdminList<DataRequest>
      eyebrow="PRIVACY" title="Data requests" description="People asking for a copy of their data, or for their account to be deleted."
      path="/admin/data-requests" rowKey={(r) => r.id}
      filters={[
        { param: "status", label: "Any status", initial: "pending", options: ["pending", "completed", "rejected"].map((v) => ({ value: v, label: humanise(v) })) },
        { param: "type", label: "Any type", options: [{ value: "copy", label: "Copy" }, { value: "deletion", label: "Deletion" }] },
      ]}
      columns={[
        { header: "Person", cell: (r) => <Two top={r.person?.name} bottom={r.person?.email ?? r.person?.phone} /> },
        { header: "Request", cell: (r) => <Two top={r.type === "copy" ? "Copy of data" : "Delete account"} bottom={r.note} /> },
        { header: "Due", cell: (r) => <span className={r.overdue ? "kit-danger" : undefined}>{stamp(r.due_at)}{r.overdue ? " · overdue" : ""}</span> },
        { header: "Status", cell: (r) => <Pill status={r.status} /> },
        { header: "", className: "right", cell: (r) => r.status === "pending" ? (
          <span className="kit-row" style={{ justifyContent: "flex-end" }}>
            <ActionButton small primary label={r.type === "copy" ? "Prepare the copy" : "Delete the account"} path={`/admin/data-requests/${r.id}/fulfil`} invalidate={["/admin/data-requests"]} success="Done." />
            <ReasonButton small label="Decline" path={`/admin/data-requests/${r.id}/reject`} invalidate={["/admin/data-requests"]} success="Declined." />
          </span>
        ) : r.download_url ? <span className="kit-faint">Copy ready · {bytes(r.download_size_bytes ?? 0)}</span> : <span className="kit-faint">{r.decision_note}</span> },
      ]}
      empty={<Empty icon="lock" title="No requests." />}
    />
  )
}
