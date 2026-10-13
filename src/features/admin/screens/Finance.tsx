"use client"

import { useState } from "react"
import { Async, Empty, Facts, Metrics, Notice, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Drawer, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems, useResource } from "@/lib/api/hooks"
import type { Invoice, Payment, Refund } from "@/lib/api/types"
import { day, humanise, lagosDate, lagosDay, naira, relative, stamp } from "@/lib/format"
import { useAdmin } from "../AdminSpace"
import { ActionButton, AdminList, ReasonButton } from "../parts"

type FinanceReport = {
  window: { from: string; to: string }
  payments: number; collected_kobo: number; refunded_kobo: number; net_kobo: number
  payments_by_status: Record<string, number>; refund_queue: Record<string, number>
  attention: { awaiting_approval: number; needs_review: number }
}

export function Finance() {
  const [days, setDays] = useState("30")
  const from = lagosDay(-Number(days))
  const report = useResource<FinanceReport>("/admin/reports/finance", { from, to: lagosDate() })
  return (
    <>
      <PageHeader eyebrow="MONEY" title="Finance" description="What came in, what went back, and what needs a decision." />
      <div className="kit-toolbar"><select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Period">{["7", "30", "90"].map((d) => <option key={d} value={d}>Last {d} days</option>)}</select></div>
      <Async query={report}>
        {(r) => (
          <>
            {(r.attention.awaiting_approval > 0 || r.attention.needs_review > 0) && (
              <Notice tone="warn" icon="alert">{r.attention.awaiting_approval} refund request(s) waiting for approval · {r.attention.needs_review} needing a manual review. Open <b>Refunds</b>.</Notice>
            )}
            <Metrics items={[
              { label: "Collected", value: naira(r.collected_kobo), note: `${r.payments} payments`, icon: "card" },
              { label: "Refunded", value: naira(r.refunded_kobo), icon: "receipt" },
              { label: "Net", value: naira(r.net_kobo), icon: "chart" },
              { label: "Awaiting approval", value: r.attention.awaiting_approval, icon: "clock" },
            ]} />
            <div className="kit-grid cols-2">
              <Panel title="Payments by status"><Facts items={Object.entries(r.payments_by_status).map(([k, v]) => [humanise(k), v])} /></Panel>
              <Panel title="Refund queue"><Facts items={Object.entries(r.refund_queue).length ? Object.entries(r.refund_queue).map(([k, v]) => [humanise(k), v]) : [["Empty", "—"]]} /></Panel>
            </div>
          </>
        )}
      </Async>
    </>
  )
}

export function Payments() {
  const { can } = useAdmin()
  const [open, setOpen] = useState<Payment | null>(null)
  return (
    <>
      <AdminList<Payment>
        eyebrow="MONEY" title="Payments" description="Every payment attempt and its outcome."
        path="/admin/payments" rowKey={(p) => p.id}
        filters={[{ param: "status", label: "Any status", options: ["pending", "success", "failed", "partially_refunded", "refunded", "abandoned"].map((s) => ({ value: s, label: humanise(s) })) }]}
        columns={[
          { header: "Reference", cell: (p) => <button className="kit-link" onClick={() => setOpen(p)}><Two top={p.reference} bottom={p.paid_at ? stamp(p.paid_at) : "Not paid"} /></button> },
          { header: "For", cell: (p) => (p.booking_id ? "A booking" : p.subscription_id ? "A subscription" : p.invoice_id ? "An invoice" : "—") },
          { header: "Status", cell: (p) => <Pill status={p.status} /> },
          { header: "Amount", className: "right", cell: (p) => <span className="kit-num">{naira(p.amount_kobo)}</span> },
          { header: "Refunded", className: "right", cell: (p) => <span className="kit-num">{p.refunded_kobo ? naira(p.refunded_kobo) : "—"}</span> },
        ]}
        empty={<Empty icon="card" title="No payments." />}
      />
      {open && <PaymentDrawer payment={open} canRefund={can("payments.refund")} onClose={() => setOpen(null)} />}
    </>
  )
}

function PaymentDrawer({ payment, canRefund, onClose }: { payment: Payment; canRefund: boolean; onClose: () => void }) {
  const events = useItems<{ id: number; type: string; reference: string; payload: Record<string, unknown>; at: string }>(`/admin/payments/${payment.id}/events`)
  const form = useForm({ amount: String(Math.round((payment.amount_kobo - (payment.refunded_kobo ?? 0)) / 100)), reason: "" })
  const refund = useAction(() => api(`/admin/payments/${payment.id}/refund`, { method: "POST", body: { amount_kobo: Math.round(Number(form.values.amount) * 100), reason: form.values.reason } }), {
    invalidate: ["/admin/payments", "/admin/refunds"], success: "Refund made.", onSuccess: onClose,
  })
  const refundable = payment.amount_kobo - (payment.refunded_kobo ?? 0) > 0 && ["success", "partially_refunded"].includes(payment.status)
  return (
    <Drawer title={payment.reference} eyebrow="PAYMENT" onClose={onClose}>
      <Facts items={[["Status", <Pill key="s" status={payment.status} />], ["Amount", naira(payment.amount_kobo)], ["Refunded", naira(payment.refunded_kobo)], ["Paid", payment.paid_at ? stamp(payment.paid_at) : null]]} />
      <h3 style={{ marginTop: 20 }}>What happened</h3>
      <div className="kit-timeline" style={{ marginTop: 10 }}>
        {events.items.map((e) => <div key={e.id} className="done"><i /><span><strong>{humanise(e.type)}</strong><small>{stamp(e.at)}</small></span></div>)}
      </div>
      {canRefund && refundable && (
        <form className="kit-form" style={{ marginTop: 20 }} onSubmit={(e) => { e.preventDefault(); refund.run() }}>
          <h3>Refund directly</h3>
          <Field label="Amount (₦)" error={fieldError(refund.error, "amount_kobo")}><input {...form.field("amount")} type="number" min={1} required /></Field>
          <Field label="Reason" error={fieldError(refund.error, "reason")}><textarea {...form.field("reason")} required minLength={3} /></Field>
          <div className="actions"><button className="primary" disabled={refund.pending}>Refund now</button></div>
        </form>
      )}
    </Drawer>
  )
}

export function Refunds() {
  const { can } = useAdmin()
  const decide = can("payments.refund")
  const inv = ["/admin/refunds"]
  return (
    <AdminList<Refund>
      eyebrow="MONEY" title="Refunds" description="Requests wait here for a decision; every approved refund is then paid back exactly once."
      path="/admin/refunds" refetchInterval={30_000} rowKey={(r) => r.id}
      filters={[{ param: "status", label: "Any status", initial: "requested", options: ["requested", "approved", "processing", "completed", "rejected", "failed", "needs_review"].map((s) => ({ value: s, label: humanise(s) })) }]}
      columns={[
        { header: "Refund", cell: (r) => <Two top={naira(r.amount_kobo)} bottom={r.payment?.reference} /> },
        { header: "Why", cell: (r) => r.reason },
        { header: "Status", cell: (r) => <Pill status={r.status} /> },
        { header: "Asked", cell: (r) => relative(r.requested_at) },
        { header: "", className: "right", cell: (r) => decide && r.status === "requested" ? (
          <span className="kit-row" style={{ justifyContent: "flex-end" }}>
            <ActionButton small primary label="Approve" path={`/admin/refunds/${r.id}/approve`} invalidate={inv} success="Approved. It will be paid back shortly." />
            <ReasonButton small label="Reject" path={`/admin/refunds/${r.id}/reject`} invalidate={inv} success="Rejected." description="The customer is told it was declined." />
          </span>
        ) : decide && r.status === "needs_review" ? <ResolveRefund refund={r} /> : <span className="kit-faint">{r.failure_reason ?? ""}</span> },
      ]}
      empty={<Empty icon="receipt" title="No refunds here." />}
    />
  )
}

function ResolveRefund({ refund }: { refund: Refund }) {
  const [open, setOpen] = useState(false)
  const form = useForm({ decision: "retry", reason: "", provider_refund_id: "" })
  const run = useAction(() => api(`/admin/refunds/${refund.id}/resolve`, { method: "POST", body: { decision: form.values.decision, reason: form.values.reason, provider_refund_id: form.values.provider_refund_id || undefined } }), {
    invalidate: ["/admin/refunds"], success: "Settled.", onSuccess: () => setOpen(false),
  })
  return (
    <>
      <button className="secondary kit-btn-small" onClick={() => setOpen(true)}>Settle by hand</button>
      {open && (
        <Modal title="Settle this refund" onClose={() => setOpen(false)}>
          <p>The provider&apos;s answer was lost, so we do not know whether the money moved. Check the provider&apos;s dashboard first.</p>
          <form className="kit-form" onSubmit={(e) => { e.preventDefault(); run.run() }}>
            <Field label="What the provider shows"><select {...form.field("decision")}><option value="confirm_completed">It was paid: record it</option><option value="retry">It was not paid: try again</option><option value="abandon">It will never be paid: close it</option></select></Field>
            {form.values.decision === "confirm_completed" && <Field label="Provider's refund id" error={fieldError(run.error, "provider_refund_id")}><input {...form.field("provider_refund_id")} required /></Field>}
            <Field label="Reason" error={fieldError(run.error, "reason")}><textarea {...form.field("reason")} required minLength={3} /></Field>
            <div className="actions"><button type="button" className="secondary" onClick={() => setOpen(false)}>Cancel</button><button className="primary" disabled={run.pending}>Settle</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function Invoices() {
  const { can } = useAdmin()
  const [open, setOpen] = useState<Invoice | null>(null)
  const [issuing, setIssuing] = useState(false)
  return (
    <>
      <AdminList<Invoice>
        eyebrow="MONEY" title="Invoices" description="Monthly invoices for companies billed on account."
        path="/admin/invoices" rowKey={(i) => i.id}
        action={can("invoices.manage") ? <button className="primary" onClick={() => setIssuing(true)}><Icon name="plus" size={16} /> Issue an invoice</button> : undefined}
        filters={[{ param: "status", label: "Any status", options: ["issued", "paid", "void"].map((s) => ({ value: s, label: humanise(s) })) }]}
        columns={[
          { header: "Invoice", cell: (i) => <button className="kit-link" onClick={() => setOpen(i)}><Two top={i.number} bottom={i.organisation?.name} /></button> },
          { header: "Month", cell: (i) => i.period },
          { header: "Washes", cell: (i) => i.washes },
          { header: "Status", cell: (i) => <span className="kit-row" style={{ gap: 6 }}><Pill status={i.status} />{i.overdue && <Pill status="overdue" />}</span> },
          { header: "Due", cell: (i) => day(i.due_at) },
          { header: "Total", className: "right", cell: (i) => <span className="kit-num">{naira(i.total_kobo)}</span> },
        ]}
        empty={<Empty icon="file" title="No invoices yet." />}
      />
      {open && <InvoiceDrawer id={open.id} onClose={() => setOpen(null)} />}
      {issuing && <IssueInvoice onClose={() => setIssuing(false)} />}
    </>
  )
}

function InvoiceDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const invoice = useResource<Invoice>(`/admin/invoices/${id}`)
  const { can } = useAdmin()
  const inv = ["/admin/invoices", `/admin/invoices/${id}`]
  const [reference, setReference] = useState("")
  const paid = useAction(() => api(`/admin/invoices/${id}/mark-paid`, { method: "POST", body: { reference } }), { invalidate: inv, success: "Recorded as paid.", onSuccess: onClose })
  return (
    <Drawer title="Invoice" eyebrow="MONTHLY INVOICE" onClose={onClose}>
      <Async query={invoice}>
        {(i) => (
          <>
            <Facts items={[["Number", i.number], ["Organisation", i.organisation?.name], ["Month", i.period], ["Status", <Pill key="s" status={i.status} />], ["Issued", stamp(i.issued_at)], ["Due", day(i.due_at)], ["Paid", i.paid_at ? `${stamp(i.paid_at)} (${humanise(i.paid_via)})` : null], ["Total", naira(i.total_kobo)]]} />
            <h3 style={{ marginTop: 20 }}>Washes</h3>
            <Table rows={i.lines ?? []} rowKey={(l) => l.booking_id} columns={[{ header: "Date", cell: (l) => l.date }, { header: "Vehicle", cell: (l) => l.plate }, { header: "Service", cell: (l) => l.service }, { header: "Amount", className: "right", cell: (l) => naira(l.amount_kobo) }]} />
            {can("invoices.manage") && i.status === "issued" && (
              <div className="kit-form" style={{ marginTop: 18 }}>
                <Field label="Record a bank transfer" hint="The bank reference of the payment received."><input value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
                <div className="actions">
                  <ReasonButton label="Void" danger path={`/admin/invoices/${id}/void`} invalidate={inv} success="Invoice voided." description="Frees its washes to be invoiced again." onDone={onClose} />
                  <button className="primary" disabled={reference.trim().length < 3 || paid.pending} onClick={() => paid.run()}>Mark as paid</button>
                </div>
              </div>
            )}
          </>
        )}
      </Async>
    </Drawer>
  )
}

function IssueInvoice({ onClose }: { onClose: () => void }) {
  const orgs = useItems<{ id: string; name: string; type: string; payment_terms: string }>("/admin/organisations")
  const billed = orgs.items.filter((o) => o.type === "corporate")
  const form = useForm({ organisation: "", month: lagosDate().slice(0, 7) })
  const issue = useAction(() => api<{ data: Invoice | null; message?: string }>(`/admin/organisations/${form.values.organisation}/invoices`, { method: "POST", body: { month: form.values.month } }), {
    invalidate: ["/admin/invoices"], success: (r) => (r.data ? `Invoice ${r.data.number} ready.` : (r.message ?? "Nothing to invoice for that month.")), onSuccess: onClose,
  })
  return (
    <Modal title="Issue an invoice" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); issue.run() }}>
        <Field label="Company"><select {...form.field("organisation")} required><option value="">Choose…</option>{billed.map((o) => <option key={o.id} value={o.id}>{o.name}{o.payment_terms === "monthly_invoice" ? "" : " (pays per booking)"}</option>)}</select></Field>
        <Field label="Month" error={fieldError(issue.error, "month")} hint="Collects that month's completed washes booked on account."><input {...form.field("month")} type="month" required /></Field>
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={issue.pending}>Issue</button></div>
      </form>
    </Modal>
  )
}

type Reward = { id: string; type: string; amount_kobo: number; status: string; earner: { name: string; email: string | null }; friend: { name: string } | null; expires_at: string | null; created_at: string }

export function Referrals() {
  const { can } = useAdmin()
  return (
    <AdminList<Reward>
      eyebrow="MONEY" title="Referral rewards" description="Rewards earned from invitations. Cancel one that looks unfair, with a reason."
      path="/admin/referrals" rowKey={(r) => r.id}
      filters={[
        { param: "type", label: "Any type", options: [{ value: "welcome", label: "Welcome (the friend)" }, { value: "referrer", label: "Referrer (the inviter)" }] },
        { param: "status", label: "Any status", options: ["pending", "available", "reserved", "used", "expired", "void"].map((s) => ({ value: s, label: humanise(s) })) },
      ]}
      columns={[
        { header: "Earned by", cell: (r) => <Two top={r.earner.name} bottom={r.earner.email} /> },
        { header: "Type", cell: (r) => (r.type === "welcome" ? "Welcome" : "Referrer") },
        { header: "From", cell: (r) => r.friend?.name ?? "—" },
        { header: "Status", cell: (r) => <Pill status={r.status} /> },
        { header: "Amount", className: "right", cell: (r) => naira(r.amount_kobo) },
        { header: "", className: "right", cell: (r) => can("referrals.manage") && ["pending", "available"].includes(r.status) ? <ReasonButton small label="Cancel" path={`/admin/referrals/${r.id}/void`} invalidate={["/admin/referrals"]} success="Reward cancelled." danger description="For example: the same device as the inviter." /> : null },
      ]}
      empty={<Empty icon="gift" title="No rewards yet." />}
    />
  )
}
