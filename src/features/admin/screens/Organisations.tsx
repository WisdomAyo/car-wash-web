"use client"

import Link from "next/link"
import { useState } from "react"
import { Async, Empty, Facts, Notice, PageHeader, Panel, Pill, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { Drawer, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useRaw } from "@/lib/api/hooks"
import type { EstateWindow, Organisation } from "@/lib/api/types"
import { humanise } from "@/lib/format"
import PlaceForm from "@/features/shared/PlaceForm"
import WindowsEditor, { describeWindows } from "@/features/shared/WindowsEditor"
import { base } from "../AdminSpace"
import { AdminList } from "../parts"

export function OrganisationsList() {
  const [creating, setCreating] = useState(false)
  return (
    <>
      <AdminList<Organisation>
        eyebrow="COMPANIES AND ESTATES" title="Organisations" description="Set up and manage fleet and estate accounts."
        path="/admin/organisations" rowKey={(o) => o.id} href={(o) => `${base}/organisations/${o.id}`}
        action={<button className="primary" onClick={() => setCreating(true)}><Icon name="plus" size={16} /> New organisation</button>}
        filters={[{ param: "type", label: "Any type", options: [{ value: "corporate", label: "Company" }, { value: "estate", label: "Estate" }] }]}
        columns={[
          { header: "Organisation", cell: (o) => <Two top={o.name} bottom={humanise(o.type === "corporate" ? "company" : o.type)} /> },
          { header: "Status", cell: (o) => <Pill status={o.status} /> },
          { header: "Discount", cell: (o) => (o.discount_percent ? `${o.discount_percent}%` : "—") },
          { header: "Payment", cell: (o) => humanise(o.payment_terms) },
        ]}
        empty={<Empty icon="building" title="No organisations yet." />}
      />
      {creating && <CreateOrganisation onClose={() => setCreating(false)} />}
    </>
  )
}

function CreateOrganisation({ onClose }: { onClose: () => void }) {
  const form = useForm({ type: "corporate", name: "", owner_name: "", owner_email: "", owner_phone: "", discount_percent: "0", plan_months: "", payment_terms: "pay_per_booking", invoice_due_days: "10" })
  const create = useAction(
    () => {
      const v = form.values
      return api<{ data: Organisation }>("/admin/organisations", {
        method: "POST",
        body: {
          type: v.type, name: v.name, owner_name: v.owner_name, owner_email: v.owner_email || undefined, owner_phone: v.owner_phone || undefined,
          discount_percent: Number(v.discount_percent), plan_months: v.type === "corporate" && v.plan_months ? Number(v.plan_months) : undefined,
          payment_terms: v.type === "corporate" ? v.payment_terms : undefined, invoice_due_days: v.payment_terms === "monthly_invoice" ? Number(v.invoice_due_days) : undefined,
        },
      })
    },
    { invalidate: ["/admin/organisations"], success: (r) => `${r.data.name} created. The owner is invited by email.`, onSuccess: onClose },
  )
  const corporate = form.values.type === "corporate"
  return (
    <Drawer title="New organisation" eyebrow="SET UP AN ACCOUNT" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); create.run() }}>
        <Field label="Type"><select {...form.field("type")}><option value="corporate">Company (fleet)</option><option value="estate">Residential estate</option></select></Field>
        <Field label="Name" error={fieldError(create.error, "name")}><input {...form.field("name")} required /></Field>
        <div className="form-grid">
          <Field label="Owner's name" error={fieldError(create.error, "owner_name")}><input {...form.field("owner_name")} required /></Field>
          <Field label="Owner's email" error={fieldError(create.error, "owner_email")} hint="They get an invitation to choose a password."><input {...form.field("owner_email")} type="email" /></Field>
        </div>
        <Field label="Owner's phone (optional)" error={fieldError(create.error, "owner_phone")}><input {...form.field("owner_phone")} type="tel" /></Field>
        <div className="form-grid">
          <Field label="Discount %" error={fieldError(create.error, "discount_percent")}><input {...form.field("discount_percent")} type="number" min={0} max={50} /></Field>
          {corporate && <Field label="Plan term"><select {...form.field("plan_months")}><option value="">None</option>{[3, 6, 12].map((m) => <option key={m} value={m}>{m} months</option>)}</select></Field>}
        </div>
        {corporate && (
          <div className="form-grid">
            <Field label="Payment"><select {...form.field("payment_terms")}><option value="pay_per_booking">Pays for each booking</option><option value="monthly_invoice">Monthly invoice</option></select></Field>
            {form.values.payment_terms === "monthly_invoice" && <Field label="Invoice due (days)"><input {...form.field("invoice_due_days")} type="number" min={1} max={90} /></Field>}
          </div>
        )}
        <div className="actions"><button className="primary" disabled={create.pending}>Create and invite</button></div>
      </form>
    </Drawer>
  )
}

type EstateSetup = { windows: EstateWindow[]; locations: { id: string; label: string; address: string; area: string; geofence_radius_m: number }[] }

export function OrganisationDetail({ id }: { id: string }) {
  const org = useRaw<{ data: Organisation; estate?: EstateSetup }>(`/admin/organisations/${id}`)
  const [editing, setEditing] = useState(false)
  const [windowing, setWindowing] = useState(false)
  const [placing, setPlacing] = useState(false)
  return (
    <Async query={org}>
      {({ data: o, estate }) => (
        <>
          <PageHeader eyebrow={o.type === "estate" ? "ESTATE" : "COMPANY"} title={o.name} description={`${humanise(o.status)} · ${o.discount_percent}% discount`} action={<Link className="secondary" href={`${base}/organisations`}>All organisations</Link>} />
          <div className="kit-grid cols-2">
            <Panel title="Account" action={<button className="secondary kit-btn-small" onClick={() => setEditing(true)}>Edit terms</button>}>
              <Facts items={[["Status", <Pill key="s" status={o.status} />], ["Discount", `${o.discount_percent}%`], ["Plan term", o.plan_months ? `${o.plan_months} months` : null], ["Payment", humanise(o.payment_terms)], ["Invoice due", o.payment_terms === "monthly_invoice" ? `${o.invoice_due_days} days` : null], ["Join code", o.join_code ? <b key="j" className="kit-mono">{o.join_code}</b> : null]]} />
            </Panel>
            <Panel title="Contact">
              <Facts items={[["Contact", o.contact_name], ["Email", o.contact_email], ["Phone", o.contact_phone], ["Billing email", o.billing_email], ["Address", o.address]]} />
            </Panel>
          </div>
          {estate && (
            <Panel title="Wash days and approved spots" description="Residents book only inside these windows and at these spots.">
              <Facts items={[["Wash days", describeWindows(estate.windows)], ["Approved spots", estate.locations.length ? estate.locations.map((l) => `${l.label} (${l.area})`).join(", ") : "None yet"]]} />
              <div className="kit-row" style={{ marginTop: 16 }}>
                <button className="secondary" onClick={() => setWindowing(true)}>Set wash days</button>
                <button className="secondary" onClick={() => setPlacing(true)}>Add an approved spot</button>
              </div>
              <Notice>The estate manager can also ask for new wash days themselves; those arrive in <Link className="kit-link" href={`${base}/window-requests`}>Estate requests</Link>.</Notice>
            </Panel>
          )}
          {o.payment_terms === "monthly_invoice" && <p className="kit-muted">This company is billed monthly. Issue or review its invoices in <Link className="kit-link" href={`${base}/invoices`}>Invoices</Link>.</p>}
          {editing && <EditTerms org={o} onClose={() => setEditing(false)} />}
          {windowing && estate && <SetWindows org={o} current={estate.windows} onClose={() => setWindowing(false)} />}
          {placing && <PlaceForm createPath={`/admin/organisations/${id}/locations`} invalidate={[`/admin/organisations/${id}`]} onClose={() => setPlacing(false)} />}
        </>
      )}
    </Async>
  )
}

function EditTerms({ org, onClose }: { org: Organisation; onClose: () => void }) {
  const form = useForm({ name: org.name, status: org.status, discount_percent: String(org.discount_percent), plan_months: org.plan_months ? String(org.plan_months) : "", payment_terms: org.payment_terms, invoice_due_days: String(org.invoice_due_days) })
  const save = useAction(
    () => {
      const v = form.values
      return api(`/admin/organisations/${org.id}`, { method: "PATCH", body: { name: v.name, status: v.status, discount_percent: Number(v.discount_percent), plan_months: v.plan_months ? Number(v.plan_months) : null, payment_terms: v.payment_terms, invoice_due_days: Number(v.invoice_due_days) } })
    },
    { invalidate: [`/admin/organisations/${org.id}`, "/admin/organisations"], success: "Saved.", onSuccess: onClose },
  )
  return (
    <Modal title="Edit terms" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        <Field label="Name" error={fieldError(save.error, "name")}><input {...form.field("name")} required /></Field>
        <div className="form-grid">
          <Field label="Status"><select {...form.field("status")}>{["pending", "active", "suspended"].map((s) => <option key={s} value={s}>{humanise(s)}</option>)}</select></Field>
          <Field label="Discount %" error={fieldError(save.error, "discount_percent")}><input {...form.field("discount_percent")} type="number" min={0} max={50} /></Field>
        </div>
        {org.type === "corporate" && (
          <div className="form-grid">
            <Field label="Payment"><select {...form.field("payment_terms")}><option value="pay_per_booking">Pays for each booking</option><option value="monthly_invoice">Monthly invoice</option></select></Field>
            <Field label="Invoice due (days)"><input {...form.field("invoice_due_days")} type="number" min={1} max={90} /></Field>
          </div>
        )}
        <div className="actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={save.pending}>Save</button></div>
      </form>
    </Modal>
  )
}

function SetWindows({ org, current, onClose }: { org: Organisation; current: EstateWindow[]; onClose: () => void }) {
  const [windows, setWindows] = useState<EstateWindow[]>(current)
  const save = useAction(() => api(`/admin/organisations/${org.id}/windows`, { method: "PUT", body: { windows } }), { invalidate: [`/admin/organisations/${org.id}`], success: "Wash days saved.", onSuccess: onClose })
  return (
    <Drawer title="Set wash days" eyebrow={org.name.toUpperCase()} onClose={onClose}>
      <p className="kit-muted">This replaces the estate&apos;s whole schedule.</p>
      <WindowsEditor value={windows} onChange={setWindows} />
      {save.error && <p className="form-error">{save.error.message}</p>}
      <div className="kit-form"><div className="actions"><button className="primary" onClick={() => save.run()} disabled={save.pending}>Save schedule</button></div></div>
    </Drawer>
  )
}
