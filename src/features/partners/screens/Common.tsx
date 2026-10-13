"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, AsyncList, Empty, Facts, Metrics, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Drawer } from "@/components/app/overlays"
import { api, idempotencyKey } from "@/lib/api/client"
import { fieldError, useAction, useList, useResource } from "@/lib/api/hooks"
import type { Invoice, Organisation, Payment, Ticket } from "@/lib/api/types"
import { day, humanise, lagosDate, naira, relative, stamp } from "@/lib/format"
import { startPayment } from "@/features/shared/payments"
import { usePartner } from "../PartnerSpace"

export function Incidents() {
  const { org, base } = usePartner()
  const mine = useList<Ticket>("/tickets")
  const [open, setOpen] = useState(false)
  return (
    <>
      <PageHeader eyebrow="A SAFER SERVICE STARTS WITH SPEAKING UP" title="Incidents" description="Tell us about access, safety, weather or conduct concerns. It goes straight to dispatch." action={<button className="primary" onClick={() => setOpen(true)}>Report an incident</button>} />
      <Panel title="What you have reported">
        <AsyncList list={mine} empty={<Empty icon="shield" title="Nothing unresolved.">Anything you report appears here with our replies.</Empty>}>
          {(items) => <Table rows={items} rowKey={(t) => t.id} href={(t) => `/workspace/customer/help/${t.id}`} columns={[{ header: "Report", cell: (t) => <Two top={humanise(t.type)} bottom={t.body.slice(0, 90)} /> }, { header: "Status", cell: (t) => <Pill status={t.status} /> }, { header: "Reported", cell: (t) => relative(t.created_at) }]} />}
        </AsyncList>
      </Panel>
      {open && <IncidentForm orgId={org.id} base={base} onClose={() => setOpen(false)} />}
    </>
  )
}

function IncidentForm({ orgId, onClose }: { orgId: string; base: string; onClose: () => void }) {
  const form = useForm({ body: "" })
  const report = useAction(() => api(`/organisations/${orgId}/incidents`, { method: "POST", body: { body: form.values.body } }), { invalidate: ["/tickets"], success: "Reported. Dispatch has been told.", onSuccess: onClose })
  return (
    <Drawer title="Report an incident" eyebrow="DISPATCH IS TOLD AT ONCE" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); report.run() }}>
        <Field label="What happened?" error={fieldError(report.error, "body")}><textarea {...form.field("body")} rows={6} required minLength={3} placeholder="What, where and when. Mention the plate if it is about a wash." /></Field>
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={report.pending}>Report it</button></div>
      </form>
    </Drawer>
  )
}

type Summary = { month: string; washes_completed: number; cancelled: number; complaints: number; verdicts: Record<string, number> }
type Month = { month: string; currency: string; billable_kobo: number; awaiting_payment_kobo: number; washes_completed: number; by_status: Record<string, { count: number; amount_kobo: number }> }

export function Reports() {
  const { org } = usePartner()
  const [month, setMonth] = useState(lagosDate().slice(0, 7))
  const summary = useResource<Summary>(`/organisations/${org.id}/summary`, { month })
  const money = useResource<Month>(`/organisations/${org.id}/invoice`, { month })
  return (
    <>
      <PageHeader eyebrow="HOW THE MONTH WENT" title="Reports" description="Washes, cancellations, complaints and what it cost." />
      <div className="kit-toolbar"><input type="month" className="kit-input" style={{ width: 200 }} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="Month" /></div>
      <Async query={summary}>
        {(s) => (
          <Metrics items={[
            { label: "Washes completed", value: s.washes_completed, icon: "check" },
            { label: "Cancelled", value: s.cancelled, icon: "close" },
            { label: "Complaints", value: s.complaints, icon: "alert" },
            { label: "Verdicts given", value: Object.values(s.verdicts).reduce((n, v) => n + v, 0), note: Object.entries(s.verdicts).map(([k, v]) => `${v} ${humanise(k).toLowerCase()}`).join(" · ") || undefined, icon: "shield" },
          ]} />
        )}
      </Async>
      <Async query={money}>
        {(m) => (
          <Panel title="Spend this month" description="After your organisation's discount.">
            <Facts items={[["Billable", naira(m.billable_kobo)], ["Awaiting payment", naira(m.awaiting_payment_kobo)], ["Washes completed", m.washes_completed], ...Object.entries(m.by_status).map(([k, v]) => [humanise(k), `${v.count} · ${naira(v.amount_kobo)}`] as [string, string])]} />
          </Panel>
        )}
      </Async>
    </>
  )
}

export function Settings() {
  const { org, role } = usePartner()
  return (
    <>
      <PageHeader eyebrow="YOUR ORGANISATION" title="Account settings" description="Your contact and billing details. Prices, discounts and payment terms are agreed with Go-Wash." />
      <Panel title="Details"><OrgForm key={org.id} org={org} editable={role === "owner" || role === "manager"} /></Panel>
      <Panel title="Agreed with Go-Wash">
        <Facts items={[["Status", <Pill key="s" status={org.status} />], ["Discount", `${org.discount_percent}%`], ["Payment", humanise(org.payment_terms)], ["Invoice due", org.payment_terms === "monthly_invoice" ? `${org.invoice_due_days} days` : null], ["Plan term", org.plan_months ? `${org.plan_months} months` : null]]} />
        <p className="kit-hint">To change any of these, ask your Go-Wash contact.</p>
      </Panel>
    </>
  )
}

function OrgForm({ org, editable }: { org: Organisation; editable: boolean }) {
  const form = useForm({ name: org.name, address: org.address ?? "", contact_name: org.contact_name ?? "", contact_email: org.contact_email ?? "", contact_phone: org.contact_phone ?? "", billing_email: org.billing_email ?? "" })
  const save = useAction(() => api(`/organisations/${org.id}`, { method: "PATCH", body: Object.fromEntries(Object.entries(form.values).map(([k, v]) => [k, k === "name" ? v : String(v).trim() || null])) }), { invalidate: ["/organisations"], success: "Saved." })
  return (
    <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
      <Field label="Name" error={fieldError(save.error, "name")}><input {...form.field("name")} required disabled={!editable} /></Field>
      <Field label="Address" error={fieldError(save.error, "address")}><input {...form.field("address")} disabled={!editable} /></Field>
      <div className="form-grid">
        <Field label="Contact person" error={fieldError(save.error, "contact_name")}><input {...form.field("contact_name")} disabled={!editable} /></Field>
        <Field label="Contact phone" error={fieldError(save.error, "contact_phone")}><input {...form.field("contact_phone")} type="tel" disabled={!editable} /></Field>
      </div>
      <div className="form-grid">
        <Field label="Contact email" error={fieldError(save.error, "contact_email")}><input {...form.field("contact_email")} type="email" disabled={!editable} /></Field>
        <Field label="Billing email" error={fieldError(save.error, "billing_email")} hint="Invoices are sent here."><input {...form.field("billing_email")} type="email" disabled={!editable} /></Field>
      </div>
      {editable && <div className="actions"><button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Save details"}</button></div>}
    </form>
  )
}

export function Invoices() {
  const { org, base } = usePartner()
  const list = useList<Invoice>(`/organisations/${org.id}/invoices`)
  return (
    <>
      <PageHeader eyebrow="BILLING" title="Plan & invoices" description={org.payment_terms === "monthly_invoice" ? `Washes are billed monthly. Invoices are due ${org.invoice_due_days} days after they are issued.` : "Your washes are paid for as you book them. Monthly invoices appear here if your account is billed that way."} />
      <Panel>
        <AsyncList list={list} empty={<Empty icon="file" title="No invoices yet.">Once a month&apos;s washes are invoiced, the invoice appears here.</Empty>}>
          {(items) => (
            <Table rows={items} rowKey={(i) => i.id} href={(i) => `${base}/invoices/${i.id}`} columns={[
              { header: "Invoice", cell: (i) => <Two top={i.number} bottom={`For ${i.period}`} /> },
              { header: "Washes", cell: (i) => i.washes },
              { header: "Due", cell: (i) => day(i.due_at) },
              { header: "Status", cell: (i) => <span className="kit-row" style={{ gap: 6 }}><Pill status={i.status} />{i.overdue && <Pill status="overdue" />}</span> },
              { header: "Total", className: "right", cell: (i) => <span className="kit-num">{naira(i.total_kobo)}</span> },
            ]} />
          )}
        </AsyncList>
      </Panel>
    </>
  )
}

export function InvoiceDetail({ id }: { id: string }) {
  const { org, base, manages } = usePartner()
  const router = useRouter()
  const invoice = useResource<Invoice>(`/organisations/${org.id}/invoices/${id}`)
  const pay = useAction(async () => (await api<{ data: Payment }>(`/organisations/${org.id}/invoices/${id}/pay`, { method: "POST", headers: { "Idempotency-Key": idempotencyKey() } })).data, {
    onSuccess: (payment) => startPayment(payment, (url) => router.push(url)),
  })
  return (
    <Async query={invoice}>
      {(i) => (
        <>
          <PageHeader eyebrow="INVOICE" title={i.number} description={`For ${i.period} · due ${day(i.due_at)}`} action={<Link className="secondary" href={`${base}/invoices`}>All invoices</Link>} />
          <div className="kit-grid side">
            <Panel title="Washes" action={<button className="secondary kit-btn-small" onClick={() => window.print()}>Print</button>}>
              <Table rows={i.lines ?? []} rowKey={(l) => l.booking_id} columns={[{ header: "Date", cell: (l) => l.date }, { header: "Vehicle", cell: (l) => l.plate }, { header: "Service", cell: (l) => l.service }, { header: "Reference", cell: (l) => l.reference }, { header: "Amount", className: "right", cell: (l) => naira(l.amount_kobo) }]} />
            </Panel>
            <Panel title="Total">
              <h3 style={{ fontSize: 30, margin: "0 0 10px" }}>{naira(i.total_kobo)}</h3>
              <Facts items={[["Status", <Pill key="s" status={i.status} />], ["Issued", stamp(i.issued_at)], ["Paid", i.paid_at ? `${stamp(i.paid_at)}${i.paid_via ? ` (${humanise(i.paid_via)})` : ""}` : null]]} />
              {i.status === "issued" && manages && (
                <div style={{ marginTop: 16 }}>
                  <button className="primary kit-wide" disabled={pay.pending} onClick={() => pay.run()}>{pay.pending ? "Opening checkout…" : `Pay ${naira(i.total_kobo)} by card`}</button>
                  <p className="kit-hint">Prefer a bank transfer? Pay the amount, then tell us the reference so we can record it.</p>
                </div>
              )}
            </Panel>
          </div>
        </>
      )}
    </Async>
  )
}
