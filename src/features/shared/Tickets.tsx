"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, AsyncList, Empty, ErrorBox, Notice, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Ticket, TicketMessage } from "@/lib/api/types"
import { humanise, relative, stamp } from "@/lib/format"

const TYPES = [
  { value: "complaint", label: "A problem with a wash" },
  { value: "conduct", label: "How a washman behaved" },
  { value: "feedback", label: "Feedback or a suggestion" },
]

/** Raise a ticket, optionally about one job. Goes to the support team, who reply in the thread. */
export function NewTicketDialog({ jobId, basePath, onClose }: { jobId?: string; basePath: string; onClose: () => void }) {
  const router = useRouter()
  const form = useForm({ type: jobId ? "complaint" : "feedback", body: "" })
  const save = useAction(
    async () => (await api<{ data: Ticket }>("/tickets", { method: "POST", body: { type: form.values.type, body: form.values.body, job_id: jobId } })).data,
    {
      invalidate: ["/tickets"],
      success: "Thank you. Our team will reply here.",
      onSuccess: (ticket) => {
        onClose()
        router.push(`${basePath}/${ticket.id}`)
      },
    },
  )
  return (
    <Modal title={jobId ? "Report a problem with this wash" : "How can we help?"} eyebrow="REAL PEOPLE. READY TO HELP." onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        <Field label="What is it about?" error={fieldError(save.error, "type")}>
          <select {...form.field("type")}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </Field>
        <Field label="Tell us what happened" error={fieldError(save.error, "body")}>
          <textarea {...form.field("body")} required minLength={3} rows={5} placeholder="The more detail, the faster we can sort it out." />
        </Field>
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>Cancel</button>
          <button className="primary" disabled={save.pending}>{save.pending ? "Sending…" : "Send to support"}</button>
        </div>
      </form>
    </Modal>
  )
}

export function TicketsScreen({ base }: { base: string }) {
  const list = useList<Ticket>("/tickets")
  const [creating, setCreating] = useState(false)
  return (
    <>
      <PageHeader
        eyebrow="REAL PEOPLE. READY TO HELP."
        title="Help & tickets"
        description="Something not right, or just a question? Write to us and we reply here."
        action={<button className="primary" onClick={() => setCreating(true)}><Icon name="plus" size={17} /> New ticket</button>}
      />
      <Panel>
        <AsyncList list={list} empty={<Empty icon="help" title="No tickets." action={<button className="primary" onClick={() => setCreating(true)}>Write to support</button>}>Anything you raise appears here with our replies.</Empty>}>
          {(items) => (
            <Table
              rows={items}
              rowKey={(t) => t.id}
              href={(t) => `${base}/${t.id}`}
              columns={[
                { header: "Ticket", cell: (t) => <Two top={humanise(t.type)} bottom={t.body.slice(0, 80) + (t.body.length > 80 ? "…" : "")} /> },
                { header: "Status", cell: (t) => <Pill status={t.status} /> },
                { header: "Opened", cell: (t) => relative(t.created_at) },
              ]}
            />
          )}
        </AsyncList>
      </Panel>
      <p className="kit-muted" style={{ marginTop: 6 }}>
        Quick questions? The chat assistant at the bottom of the page answers instantly, and hands over to the team when it cannot.
      </p>
      {creating && <NewTicketDialog basePath={base} onClose={() => setCreating(false)} />}
    </>
  )
}

export function TicketDetail({ id, back }: { id: string; back: string }) {
  const ticket = useResource<Ticket>(`/tickets/${id}`)
  const messages = useItems<TicketMessage>(`/tickets/${id}/messages`, undefined, { refetchInterval: 20_000 })
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])

  const send = useAction(
    () => {
      const form = new FormData()
      form.set("body", body)
      files.forEach((f) => form.append("attachments[]", f))
      return api(`/tickets/${id}/messages`, { method: "POST", form })
    },
    { invalidate: [`/tickets/${id}/messages`], onSuccess: () => { setBody(""); setFiles([]) } },
  )

  return (
    <>
      <PageHeader eyebrow="SUPPORT TICKET" title={ticket.data ? humanise(ticket.data.type) : "Ticket"} description={ticket.data ? `Opened ${stamp(ticket.data.created_at)}` : undefined}
        action={<Link className="secondary" href={back}>All tickets</Link>} />
      <Async query={ticket}>
        {(t) => (
          <div className="kit-grid side">
            <Panel title="Conversation" action={<Pill status={t.status} />}>
              <div className="kit-thread">
                <div className="kit-bubble mine">{t.body}<small>You · {stamp(t.created_at)}</small></div>
                {messages.items.map((m) => (
                  <div key={m.id} className={`kit-bubble ${m.from === "you" ? "mine" : ""}`}>
                    {m.body}
                    {m.attachments.length > 0 && (
                      <div className="kit-row" style={{ marginTop: 8 }}>
                        {m.attachments.map((a) => <a key={a.id} className="kit-link" href={a.url} target="_blank" rel="noreferrer"><Icon name="file" size={14} /> {a.name}</a>)}
                      </div>
                    )}
                    <small>{m.from === "you" ? "You" : "Go-Wash support"} · {stamp(m.at)}</small>
                  </div>
                ))}
              </div>
              {messages.isError && <ErrorBox error={messages.error} />}
              {t.status === "resolved" ? (
                <Notice icon="check">{t.decision_note ?? "This ticket is resolved."} You can still reply to reopen the conversation.</Notice>
              ) : null}
              <form className="kit-form" style={{ marginTop: 18 }} onSubmit={(e) => { e.preventDefault(); send.run() }}>
                <Field label="Your reply">
                  <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} />
                </Field>
                <Field label="Attach photos or a PDF (optional)" hint="Up to 3 files, 2 MB each.">
                  <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 3))} />
                </Field>
                <div className="actions"><button className="primary" disabled={send.pending || !body.trim()}>{send.pending ? "Sending…" : "Send reply"}</button></div>
              </form>
            </Panel>
            <Panel title="Details">
              <dl className="kit-facts" style={{ gridTemplateColumns: "1fr" }}>
                <div><dt>Status</dt><dd><Pill status={t.status} /></dd></div>
                {t.category && <div><dt>Topic</dt><dd>{humanise(t.category)}</dd></div>}
                {t.decision && <div><dt>Outcome</dt><dd>{humanise(t.decision)}</dd></div>}
                {t.decision_note && <div><dt>Note from support</dt><dd>{t.decision_note}</dd></div>}
              </dl>
            </Panel>
          </div>
        )}
      </Async>
    </>
  )
}
