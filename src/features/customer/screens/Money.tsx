"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Async, AsyncList, Empty, Facts, Metrics, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { ConfirmDialog, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api, idempotencyKey } from "@/lib/api/client"
import { useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Payment, Plan, Receipt, Referrals, Subscription } from "@/lib/api/types"
import { day, naira, stamp } from "@/lib/format"
import { startPayment } from "@/features/shared/payments"

export function Receipts() {
  const list = useList<Receipt>("/receipts")
  const [open, setOpen] = useState<Receipt | null>(null)
  return (
    <>
      <PageHeader eyebrow="YOUR RECORDS" title="Receipts & refunds" description="Every payment you made, and what came back." />
      <Panel>
        <AsyncList list={list} empty={<Empty icon="receipt" title="No receipts yet.">A receipt appears here after each payment.</Empty>}>
          {(items) => (
            <Table
              rows={items}
              rowKey={(r) => r.payment_id}
              columns={[
                { header: "Receipt", cell: (r) => <button className="kit-link" onClick={() => setOpen(r)}><Two top={r.receipt_no} bottom={stamp(r.issued_at)} /></button> },
                { header: "For", cell: (r) => <Two top={r.for.description} bottom={r.for.vehicle_plate} /> },
                { header: "Status", cell: (r) => <Pill status={r.status} /> },
                { header: "Paid", className: "right", cell: (r) => <span className="kit-num">{naira(r.amount_kobo)}</span> },
                { header: "Refunded", className: "right", cell: (r) => <span className="kit-num">{r.refunded_kobo ? naira(r.refunded_kobo) : "—"}</span> },
              ]}
            />
          )}
        </AsyncList>
      </Panel>
      {open && (
        <Modal title={`Receipt ${open.receipt_no}`} eyebrow="PAYMENT RECEIPT" onClose={() => setOpen(null)}>
          <Facts items={[["For", open.for.description], ["Reference", open.reference], ["Issued", stamp(open.issued_at)], ["Paid", naira(open.amount_kobo)], ["Refunded", naira(open.refunded_kobo)], ["Net", naira(open.net_kobo)]]} />
          {open.refunds.length > 0 && (
            <>
              <hr className="kit-divider" />
              <h3>Refunds</h3>
              {open.refunds.map((r) => (
                <div className="kit-item" key={r.id}><div className="grow"><h4>{naira(r.amount_kobo)}</h4><p>{r.reason}</p></div><Pill status={r.status} /></div>
              ))}
            </>
          )}
          <div className="kit-form"><div className="actions"><button className="secondary" onClick={() => window.print()}><Icon name="download" size={15} /> Print</button></div></div>
        </Modal>
      )}
    </>
  )
}

export function Subscriptions() {
  const router = useRouter()
  const subs = useList<Subscription>("/subscriptions")
  const plans = useItems<Plan>("/subscription-plans")
  const [cancelling, setCancelling] = useState<Subscription | null>(null)

  const buy = useAction(
    async (plan: Plan) => api<{ subscription: Subscription; payment: Payment }>("/subscriptions", { method: "POST", headers: { "Idempotency-Key": idempotencyKey() }, body: { plan_id: plan.id, auto_renew: true } }),
    { invalidate: ["/subscriptions"], onSuccess: ({ payment }) => startPayment(payment, (url) => router.push(url)) },
  )
  const autoRenew = useAction((v: { s: Subscription; enabled: boolean }) => api(`/subscriptions/${v.s.id}/auto-renew`, { method: "PUT", body: { enabled: v.enabled } }), { invalidate: ["/subscriptions"], success: "Saved." })
  const cancel = useAction((s: Subscription) => api(`/subscriptions/${s.id}/cancel`, { method: "POST" }), { invalidate: ["/subscriptions"], success: "Subscription cancelled.", onSuccess: () => setCancelling(null) })

  const individual = plans.items.filter((p) => p.scope === "individual" && p.is_active)
  return (
    <>
      <PageHeader eyebrow="WASH MORE, PAY LESS" title="Subscriptions" description="Prepay a bundle of washes. Each wash you book uses one credit." />
      <Panel title="Your subscriptions">
        <AsyncList list={subs} empty={<Empty icon="card" title="No subscription yet.">Choose a plan below to start saving.</Empty>}>
          {(items) => (
            <div className="kit-list">
              {items.map((s) => (
                <div className="kit-item" key={s.id}>
                  <span className="kit-icon-tile"><Icon name="card" size={18} /></span>
                  <div className="grow">
                    <h4>{s.plan.name} <Pill status={s.status} /></h4>
                    <p>{s.washes_remaining} of {s.washes_included} washes left{s.ends_at ? ` · renews or ends ${day(s.ends_at)}` : ""}</p>
                  </div>
                  {["active", "grace"].includes(s.status) && (
                    <>
                      <label className="kit-chip"><input type="checkbox" checked={s.auto_renew} onChange={(e) => autoRenew.run({ s, enabled: e.target.checked })} /> Auto-renew</label>
                      <button className="secondary kit-danger" onClick={() => setCancelling(s)}>Cancel</button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </AsyncList>
      </Panel>
      <Panel title="Plans">
        <Async query={plans} empty={<Empty icon="card" title="No plans on sale right now." />} isEmpty={() => individual.length === 0}>
          {() => (
            <div className="kit-grid cols-3" style={{ marginBottom: 0 }}>
              {individual.map((p) => (
                <article key={p.id} className="portal-panel" style={{ marginBottom: 0 }}>
                  <h3 className="kit-panel-title">{p.name}</h3>
                  <p className="kit-muted">{p.washes_included} washes over {p.months} month{p.months > 1 ? "s" : ""}{p.discount_percent ? ` · ${p.discount_percent}% off` : ""}</p>
                  <h3 style={{ fontSize: 28, margin: "12px 0" }}>{naira(p.price_kobo)}</h3>
                  <button className="primary kit-wide" onClick={() => buy.run(p)} disabled={buy.pending}>Choose this plan</button>
                </article>
              ))}
            </div>
          )}
        </Async>
      </Panel>
      {cancelling && <ConfirmDialog title="Cancel this subscription?" description="Unused credits stay until the end of the paid period. It will not renew." confirmLabel="Cancel subscription" danger pending={cancel.pending} onConfirm={() => cancel.run(cancelling)} onClose={() => setCancelling(null)} />}
    </>
  )
}

export function ReferralsScreen() {
  const referrals = useResource<Referrals>("/referrals")
  return (
    <>
      <PageHeader eyebrow="SHARE THE SHINE" title="Referrals & rewards" description="Invite a friend. They get a discount on their first wash; you get one when it is done." />
      <Async query={referrals}>
        {(r) =>
          !r.enabled ? (
            <Empty icon="gift" title="Referrals are paused." >Check back soon.</Empty>
          ) : (
            <>
              <Metrics items={[
                { label: "Friends invited", value: r.stats.invited, note: `${r.stats.qualified} completed a first wash`, icon: "users" },
                { label: "Available to use", value: naira(r.stats.available_kobo), note: "Applied automatically to your next booking", icon: "gift" },
                { label: "On the way", value: naira(r.stats.pending_kobo), note: "Once a friend's first wash is done", icon: "clock" },
                { label: "Already used", value: naira(r.stats.spent_kobo), icon: "check" },
              ]} />
              <Panel title="Your code" description={`A friend gets ${naira(r.offer.friend_gets_kobo)} off their first wash and you get ${naira(r.offer.you_get_kobo)} off. Rewards last ${r.offer.valid_days} days.`}>
                <div className="kit-row">
                  <span className="kit-mono" style={{ fontSize: 22, letterSpacing: 3, fontWeight: 700 }}>{r.code}</span>
                  <CopyButton text={r.share_url} label="Copy invite link" />
                </div>
                <p className="kit-faint" style={{ marginTop: 8 }}>{r.share_url}</p>
              </Panel>
              <Panel title="Your rewards">
                {r.rewards.length === 0 ? (
                  <Empty icon="gift" title="No rewards yet.">Share your code to earn your first one.</Empty>
                ) : (
                  <Table rows={r.rewards} rowKey={(x) => x.id} columns={[
                    { header: "Reward", cell: (x) => <Two top={x.type === "welcome" ? "Welcome reward" : "Thank-you for inviting"} bottom={x.friend?.name} /> },
                    { header: "Status", cell: (x) => <Pill status={x.status} /> },
                    { header: "Valid until", cell: (x) => (x.expires_at ? day(x.expires_at) : "—") },
                    { header: "Value", className: "right", cell: (x) => <span className="kit-num">{naira(x.amount_kobo)}</span> },
                  ]} />
                )}
              </Panel>
            </>
          )
        }
      </Async>
    </>
  )
}

export function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2500)
        } catch {
          // clipboard blocked: the text is on screen to select
        }
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied" : label}
    </button>
  )
}

