"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, AsyncList, Empty, Facts, PageHeader, Panel, Table, Pill } from "@/components/app/kit"
import { useForm } from "@/components/app/forms"
import { Drawer } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { fieldError, useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Invoice, Organisation, Payment, Subscription, Ticket } from "@/lib/api/types"
import { day, humanise, lagosDate, naira, relative, stamp } from "@/lib/format"
import { startPayment } from "@/features/shared/payments"
import { usePartner } from "../PartnerSpace"
import { PortalMetrics, SectionHeading, StatusChip, downloadCsv } from "../parts"

export function Incidents() {
  const { org } = usePartner()
  const mine = useList<Ticket>("/tickets")
  const [open, setOpen] = useState(false)
  return (
    <>
      <PageHeader eyebrow="A SAFER SERVICE STARTS WITH SPEAKING UP" title="Incidents" description="Tell us about access, safety, weather or conduct concerns. It goes straight to dispatch." action={<button className="primary" onClick={() => setOpen(true)}><Icon name="plus" size={17} />Report an incident</button>} />
      <section className="portal-panel">
        <SectionHeading title="A safer service starts with speaking up." action="Report incident" onAction={() => setOpen(true)} />
        <AsyncList list={mine} empty={
          <div className="empty-state">
            <Icon name="shield" size={42} />
            <h3>Nothing unresolved.</h3>
            <p>Report access, safety, weather or conduct concerns here. Anything you report appears with our replies.</p>
            <button className="primary" onClick={() => setOpen(true)}>Report an incident <Icon name="plus" size={17} /></button>
          </div>
        }>
          {(items) => items.map((t) => (
            <Link className="history-row" key={t.id} href={`/workspace/customer/help/${t.id}`}>
              <Icon name="shield" size={25} />
              <div><h4>{humanise(t.type)}</h4><p>{t.body.slice(0, 110)} · {relative(t.created_at)}</p></div>
              <Pill status={t.status} />
            </Link>
          ))}
        </AsyncList>
      </section>
      {open && <IncidentForm orgId={org.id} onClose={() => setOpen(false)} />}
    </>
  )
}

function IncidentForm({ orgId, onClose }: { orgId: string; onClose: () => void }) {
  const form = useForm({ body: "" })
  const report = useAction(() => api(`/organisations/${orgId}/incidents`, { method: "POST", body: { body: form.values.body } }), { invalidate: ["/tickets"], success: "Reported. Dispatch has been told.", onSuccess: onClose })
  return (
    <Drawer title="Tell us what happened." eyebrow="DISPATCH IS TOLD AT ONCE" onClose={onClose}>
      <p>Describe the location and concern. It goes straight to the operations team.</p>
      <form onSubmit={(e) => { e.preventDefault(); report.run() }}>
        <label>
          What happened?
          <textarea {...form.field("body")} rows={6} required minLength={3} placeholder="What, where and when. Mention the plate if it is about a wash." />
          {fieldError(report.error, "body") && <small className="form-error">{fieldError(report.error, "body")}</small>}
        </label>
        <button className="primary full" disabled={report.pending}>Report it <Icon name="arrow" size={17} /></button>
      </form>
    </Drawer>
  )
}

type Summary = { month: string; washes_completed: number; cancelled: number; complaints: number; verdicts: Record<string, number>; daily: Record<string, number> }
type Month = { month: string; currency: string; billable_kobo: number; awaiting_payment_kobo: number; washes_completed: number; by_status: Record<string, { count: number; amount_kobo: number }> }

const MONTH = new Intl.DateTimeFormat("en-NG", { month: "long", year: "numeric", timeZone: "UTC" })
const pct = (n: number, of: number) => (of ? `${Math.round((n / of) * 1000) / 10}%` : "—")

/** The month in numbers: washes, verdicts, and a bar for every day. */
export function Reports() {
  const { org } = usePartner()
  const estate = org.type === "estate"
  const [month, setMonth] = useState(lagosDate().slice(0, 7))
  const summary = useResource<Summary>(`/organisations/${org.id}/summary`, { month })
  const money = useResource<Month>(`/organisations/${org.id}/invoice`, { month }, { enabled: !estate })
  const [y, m] = month.split("-").map(Number)
  const dayCount = new Date(Date.UTC(y, m, 0)).getUTCDate()

  return (
    <>
      <PageHeader eyebrow={estate ? "YOUR COMMUNITY. OUR RESPONSIBILITY." : "HOW THE MONTH WENT"} title={estate ? "Monthly report" : "Reports"} description="Washes, cancellations, complaints and what it cost." />
      <div className="portal-toolbar"><input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} aria-label="Month" /></div>
      <Async query={summary}>
        {(s) => {
          const verdicts = Object.values(s.verdicts).reduce((n, v) => n + v, 0)
          const bars = Array.from({ length: dayCount }, (_, i) => s.daily[`${month}-${String(i + 1).padStart(2, "0")}`] ?? 0)
          const top = Math.max(1, ...bars)
          return (
            <>
              <PortalMetrics items={[
                { label: estate ? "Estate washes this month" : "Washes this month", value: s.washes_completed, note: "Across the selected account", icon: "car" },
                { label: "Treated & satisfied", value: pct(s.verdicts.satisfied ?? 0, verdicts), note: "Customer-confirmed outcomes", icon: "shield" },
                { label: "Cancelled", value: s.cancelled, note: "Before the wash began", icon: "close" },
                { label: estate ? "Incidents reviewed" : "Complaints", value: s.complaints, note: "Not pleased or untreated", icon: "alert" },
              ]} />
              <section className="portal-panel">
                <div className="section-heading">
                  <h3>{MONTH.format(new Date(Date.UTC(y, m - 1, 1)))} · Your care in perspective</h3>
                  <button className="secondary" onClick={() => downloadCsv(`go-wash-${month}`, ["Metric", "Value"], [["Washes completed", s.washes_completed], ["Cancelled", s.cancelled], ["Complaints", s.complaints], ...Object.entries(s.verdicts).map(([k, v]) => [humanise(k), v] as [string, number])])}>
                    Export report <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="report-chart" aria-label="Completed washes per day">
                  {bars.map((n, i) => (
                    <div key={i} title={`${n} wash${n === 1 ? "" : "es"}`}>
                      <span style={{ height: `${Math.max(n ? 8 : 2, (n / top) * 100)}%` }} />
                      <small>{i + 1}</small>
                    </div>
                  ))}
                </div>
                <div className="report-breakdown">
                  {([["satisfied", "Treated and satisfied"], ["not_pleased", "Treated and not pleased"], ["untreated", "Untreated"]] as const).map(([key, title], i) => (
                    <div key={key}>
                      <span className={`verdict-dot dot-${i}`} />
                      <strong>{title}</strong>
                      <span>{pct(s.verdicts[key] ?? 0, verdicts)}</span>
                    </div>
                  ))}
                </div>
                {estate && <p className="policy-note"><Icon name="shield" size={16} />Estate reports exclude residents&apos; payment information and private vehicle histories.</p>}
              </section>
            </>
          )
        }}
      </Async>
      {!estate && (
        <Async query={money}>
          {(mo) => (
            <Panel title="Spend this month" description="After your organisation's discount.">
              <Facts items={[["Billable", naira(mo.billable_kobo)], ["Awaiting payment", naira(mo.awaiting_payment_kobo)], ["Washes completed", mo.washes_completed], ...Object.entries(mo.by_status).map(([k, v]) => [humanise(k), `${v.count} · ${naira(v.amount_kobo)}`] as [string, string])]} />
            </Panel>
          )}
        </Async>
      )}
    </>
  )
}

export function Settings() {
  const { org, role } = usePartner()
  const estate = org.type === "estate"
  return (
    <>
      <PageHeader eyebrow={estate ? "YOUR COMMUNITY. OUR RESPONSIBILITY." : "YOUR FLEET. OUR RESPONSIBILITY."} title={estate ? "Estate settings" : "Account settings"} description="Your contact and billing details. Prices, discounts and payment terms are agreed with Go-Wash." />
      <section className="portal-panel organisation-settings">
        <div className="eyebrow">YOUR ORGANISATION, BEAUTIFULLY CONNECTED</div>
        <h3>Account details</h3>
        <OrgForm key={org.id} org={org} editable={role !== "confirmer"} />
        <div className="policy-locked">
          <Icon name="shield" size={20} />
          <span>{estate ? "You can view staff access and estate summaries, not resident payment details or individual care histories." : "Your company data is visible only to authorised company users. Confirmer access is limited to their assigned vehicles."}</span>
        </div>
      </section>
      <section className="portal-panel">
        <SectionHeading title="Agreed with Go-Wash" />
        <Facts items={[["Status", <Pill key="s" status={org.status} />], ["Discount", `${org.discount_percent}%`], ["Payment", humanise(org.payment_terms)], ["Invoice due", org.payment_terms === "monthly_invoice" ? `${org.invoice_due_days} days` : null], ["Plan term", org.plan_months ? `${org.plan_months} months` : null]]} />
        <p className="kit-hint">To change any of these, ask your Go-Wash contact.</p>
      </section>
    </>
  )
}

function OrgForm({ org, editable }: { org: Organisation; editable: boolean }) {
  const form = useForm({ name: org.name, address: org.address ?? "", contact_name: org.contact_name ?? "", contact_email: org.contact_email ?? "", contact_phone: org.contact_phone ?? "", billing_email: org.billing_email ?? "" })
  const save = useAction(() => api(`/organisations/${org.id}`, { method: "PATCH", body: Object.fromEntries(Object.entries(form.values).map(([k, v]) => [k, k === "name" ? v : String(v).trim() || null])) }), { invalidate: ["/organisations"], success: "Saved." })
  const err = (name: string) => fieldError(save.error, name) && <small className="form-error">{fieldError(save.error, name)}</small>
  return (
    <form onSubmit={(e) => { e.preventDefault(); save.run() }}>
      <label>Organisation name<input {...form.field("name")} required disabled={!editable} />{err("name")}</label>
      <label>Outdoor service location<input {...form.field("address")} disabled={!editable} />{err("address")}</label>
      <div className="form-grid">
        <label>Account representative<input {...form.field("contact_name")} disabled={!editable} />{err("contact_name")}</label>
        <label>Contact phone<input {...form.field("contact_phone")} type="tel" disabled={!editable} />{err("contact_phone")}</label>
      </div>
      <div className="form-grid">
        <label>Contact email<input {...form.field("contact_email")} type="email" disabled={!editable} />{err("contact_email")}</label>
        <label>Billing email<input {...form.field("billing_email")} type="email" disabled={!editable} />{err("billing_email")}</label>
      </div>
      {editable && <button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Save preferences"} <Icon name="check" size={16} /></button>}
    </form>
  )
}

/** The fleet's plan and its invoices. */
export function Invoices() {
  const { org, base } = usePartner()
  const list = useList<Invoice>(`/organisations/${org.id}/invoices`)
  const subs = useItems<Subscription>("/subscriptions")
  const [managing, setManaging] = useState(false)
  const plan = subs.items.find((s) => s.organisation_id === org.id && ["active", "grace"].includes(s.status))
  const fleetSize = useList<{ id: string; organisation_id: string | null }>("/vehicles").items.filter((v) => v.organisation_id === org.id).length

  return (
    <>
      <PageHeader eyebrow="YOUR FLEET. OUR RESPONSIBILITY." title="Plan & invoices" description={org.payment_terms === "monthly_invoice" ? `Washes are billed monthly. Invoices are due ${org.invoice_due_days} days after they are issued.` : "Your washes are paid for as you book them. Monthly invoices appear here if your account is billed that way."} />
      <section className="fleet-plan-panel">
        <div>
          <div className="eyebrow">YOUR CURRENT PLAN</div>
          <h2>{plan ? `${plan.plan.name}${plan.plan.months > 1 ? ` · ${plan.plan.months} months` : ""}` : org.plan_months ? `Fleet plan · ${org.plan_months} months` : "Pay as you wash"}</h2>
          <p>{fleetSize} vehicle{fleetSize === 1 ? "" : "s"} · {org.discount_percent ? `${org.discount_percent}% volume pricing` : "Standard pricing"} · {humanise(org.payment_terms)}</p>
          <StatusChip>{plan ? (plan.ends_at ? `Active through ${day(plan.ends_at)}` : "Active") : org.status === "active" ? "Account active" : humanise(org.status)}</StatusChip>
        </div>
        <div className="plan-balance">
          <strong>{plan ? plan.washes_remaining : "—"} {plan && <small>/ {plan.washes_included}</small>}</strong>
          <span>washes remaining</span>
        </div>
        <button className="secondary" onClick={() => setManaging(true)}>Manage plan <Icon name="arrow" size={16} /></button>
      </section>
      <section className="portal-panel">
        <SectionHeading title="One clear invoice." />
        <AsyncList list={list} empty={<Empty icon="file" title="No invoices yet.">Once a month&apos;s washes are invoiced, the invoice appears here.</Empty>}>
          {(items) => (
            <div className="table-scroll">
              <table className="portal-table">
                <thead><tr><th>INVOICE</th><th>PERIOD</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td><strong>{i.number}</strong><small>{org.name}</small></td>
                      <td>{i.period}</td>
                      <td><strong>{naira(i.total_kobo)}</strong></td>
                      <td><span className="kit-row" style={{ gap: 6 }}><StatusChip>{humanise(i.status)}</StatusChip>{i.overdue && <StatusChip review>Overdue</StatusChip>}</span></td>
                      <td><Link className="text-button" href={`${base}/invoices/${i.id}`}>{i.status === "issued" ? "View & pay" : "View invoice"} <Icon name="arrow" size={14} /></Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncList>
      </section>
      {managing && <PlanDrawer org={org} plan={plan} onClose={() => setManaging(false)} />}
    </>
  )
}

function PlanDrawer({ org, plan, onClose }: { org: Organisation; plan?: Subscription; onClose: () => void }) {
  const [term, setTerm] = useState("6 months")
  const ask = useAction(() => api("/tickets", { method: "POST", body: { type: "feedback", category: "plan_review", body: `Plan review requested for ${org.name}. Preferred next term: ${term}.` } }), { invalidate: ["/tickets"], success: "Plan review requested. Your current term is unchanged.", onSuccess: onClose })
  return (
    <Drawer title="Care that fits your fleet." eyebrow="YOUR GO-WASH WORKSPACE" onClose={onClose}>
      <div className="review-summary">
        <h3>{plan?.plan.name ?? "Your account terms"}</h3>
        <p>{org.name}</p>
        <hr />
        <div><span>Prepaid term</span><strong>{plan ? `${plan.plan.months} month${plan.plan.months > 1 ? "s" : ""}` : org.plan_months ? `${org.plan_months} months` : "None"}</strong></div>
        <div><span>Payment</span><strong>{humanise(org.payment_terms)}</strong></div>
        <div><span>Status</span><strong>{plan ? (plan.ends_at ? `Active through ${day(plan.ends_at)}` : "Active") : humanise(org.status)}</strong></div>
      </div>
      <label>
        Next term preference
        <select value={term} onChange={(e) => setTerm(e.target.value)}>
          <option>3 months</option>
          <option>6 months</option>
          <option>12 months</option>
        </select>
      </label>
      <button className="primary full" disabled={ask.pending} onClick={() => ask.run()}>Request plan review <Icon name="arrow" size={17} /></button>
      <p className="policy-note"><Icon name="shield" size={15} />Plans and prices are agreed with Go-Wash. Asking for a review does not change your current term.</p>
    </Drawer>
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
