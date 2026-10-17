"use client"

import { useState } from "react"
import { Async, AsyncList, Empty, Facts, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { ConfirmDialog, Modal } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { useAction, useItems, useList, useResource } from "@/lib/api/hooks"
import type { Plan, Receipt, Referrals, Subscription } from "@/lib/api/types"
import { day, naira, stamp } from "@/lib/format"
import { useCustomerUi } from "../CustomerUi"
import { PageHeading } from "../parts"

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

/** Plans on offer, with the customer's own subscriptions above them. */
export function Subscriptions() {
  const { openModal } = useCustomerUi()
  const subs = useList<Subscription>("/subscriptions")
  const plans = useItems<Plan>("/subscription-plans")
  const [cancelling, setCancelling] = useState<Subscription | null>(null)

  const autoRenew = useAction((v: { s: Subscription; enabled: boolean }) => api(`/subscriptions/${v.s.id}/auto-renew`, { method: "PUT", body: { enabled: v.enabled } }), { invalidate: ["/subscriptions"], success: "Saved." })
  const cancel = useAction((s: Subscription) => api(`/subscriptions/${s.id}/cancel`, { method: "POST" }), { invalidate: ["/subscriptions"], success: "Subscription cancelled.", onSuccess: () => setCancelling(null) })

  const individual = plans.items.filter((p) => p.scope === "individual" && p.is_active)
  const current = subs.items.find((s) => ["active", "grace"].includes(s.status))
  const featured = current ? individual.findIndex((p) => p.id === current.plan.id) : Math.min(1, individual.length - 1)

  return (
    <>
      <PageHeading title="Subscriptions" />
      <section className="passport-banner">
        <Icon name="drop" size={45} />
        <div>
          <div className="eyebrow">LESS PLANNING. MORE SHINE.</div>
          <h2>Your clean-car routine, sorted.</h2>
          <p>Monthly care delivered to your driveway. No wash-bay detours.</p>
        </div>
      </section>

      {subs.items.length > 0 && (
        <section className="content-panel">
          <div className="section-heading">
            <h3>Your subscriptions</h3>
            <span className="status-badge">Each wash uses one credit</span>
          </div>
          {subs.items.map((s) => (
            <div className="history-row" key={s.id}>
              <span className="stat-icon">
                <Icon name="card" />
              </span>
              <div>
                <h4>
                  {s.plan.name} <Pill status={s.status} />
                </h4>
                <p>
                  {s.washes_remaining} of {s.washes_included} washes left{s.ends_at ? ` · ${s.auto_renew ? "renews" : "ends"} ${day(s.ends_at)}` : ""}
                </p>
              </div>
              {["active", "grace"].includes(s.status) && (
                <>
                  <label className="checkbox-label" style={{ margin: 0 }}>
                    <input type="checkbox" checked={s.auto_renew} onChange={(e) => autoRenew.run({ s, enabled: e.target.checked })} /> Auto-renew
                  </label>
                  <button className="secondary" onClick={() => setCancelling(s)}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          ))}
        </section>
      )}

      <Async query={plans} empty={<Empty icon="card" title="No plans on sale right now." />} isEmpty={() => individual.length === 0}>
        {() => (
          <div className="service-grid">
            {individual.map((p, i) => {
              const mine = current?.plan.id === p.id
              return (
                <div className={`service-card ${i === featured ? "featured" : ""}`} key={p.id}>
                  <span className="popular-tag">{mine ? "YOUR CURRENT PLAN" : `${p.washes_included} WASHES${p.months > 1 ? ` / ${p.months} MONTHS` : " / MONTH"}`}</span>
                  <h3>{p.name}</h3>
                  <p>
                    {p.washes_included} professional washes. Three proofs per wash. One less thing to worry about.
                    {p.discount_percent ? ` ${p.discount_percent}% off.` : ""}
                  </p>
                  <h2>
                    {naira(p.price_kobo)}
                    <small className="per-month"> / {p.months > 1 ? `${p.months} months` : "month"}</small>
                  </h2>
                  <button className={mine ? "secondary" : "primary"} onClick={() => openModal({ name: "plan", id: p.id })}>
                    {mine ? "Manage plan" : "Explore plan"}
                    <Icon name="arrow" size={16} />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </Async>
      {cancelling && <ConfirmDialog title="Cancel this subscription?" description="Unused credits stay until the end of the paid period. It will not renew." confirmLabel="Cancel subscription" danger pending={cancel.pending} onConfirm={() => cancel.run(cancelling)} onClose={() => setCancelling(null)} />}
    </>
  )
}

export function ReferralsScreen() {
  const { notify } = useCustomerUi()
  const referrals = useResource<Referrals>("/referrals")
  return (
    <>
      <PageHeading title="Referrals & rewards" />
      <Async query={referrals}>
        {(r) =>
          !r.enabled ? (
            <Empty icon="gift" title="Referrals are paused.">Check back soon.</Empty>
          ) : (
            <>
              <section className="referral-page">
                <div className="large-gift">
                  <Icon name="gift" size={48} />
                </div>
                <div className="eyebrow">SPREAD A LITTLE SHINE</div>
                <h2>Clean cars. Happy friends.</h2>
                <p>
                  Your friend gets {naira(r.offer.friend_gets_kobo)} off their first wash.
                  <br />
                  You get {naira(r.offer.you_get_kobo)} in wash credit when they book.
                </p>
                <div className="referral-code">
                  <span>{r.code}</span>
                  <button
                    className="primary"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(r.share_url)
                        notify("Your invite link has been copied.")
                      } catch {
                        notify(`Your code is ${r.code}.`)
                      }
                    }}
                  >
                    Copy invite link <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="referral-metrics">
                  <div>
                    <strong>{r.stats.invited}</strong>
                    <span>Friends referred</span>
                  </div>
                  <div>
                    <strong>{naira(r.stats.earned_kobo)}</strong>
                    <span>Credit earned</span>
                  </div>
                  <div>
                    <strong>{naira(r.stats.available_kobo)}</strong>
                    <span>Available credit</span>
                  </div>
                </div>
              </section>
              {r.rewards.length > 0 && (
                <section className="content-panel">
                  <div className="section-heading">
                    <h3>Your rewards</h3>
                    <span className="status-badge">Valid for {r.offer.valid_days} days</span>
                  </div>
                  {r.rewards.map((x) => (
                    <div className="history-row" key={x.id}>
                      <span className="stat-icon">
                        <Icon name="gift" />
                      </span>
                      <div>
                        <h4>{x.type === "welcome" ? "Welcome reward" : "Thank-you for inviting"}</h4>
                        <p>
                          {x.friend?.name ?? "A friend"}
                          {x.expires_at ? ` · valid until ${day(x.expires_at)}` : ""}
                        </p>
                      </div>
                      <Pill status={x.status} />
                      <strong>{naira(x.amount_kobo)}</strong>
                    </div>
                  ))}
                </section>
              )}
            </>
          )
        }
      </Async>
    </>
  )
}
