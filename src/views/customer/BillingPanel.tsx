import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import type { CustomerRecords } from "../../lib/customerApi"
import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Heading from "../../components/ui/Typography"
import { Select } from "./FormControls"
type Receipt = {
  receipt_number: string
  service_name: string
  amount_kobo: number
  paid_at: string
  payment_status: string
}
type PlanRequest = {
  id: string
  service_id: string
  washes_per_month: number
  status: string
}

export default function BillingPanel({
  records,
}: {
  records: CustomerRecords
}) {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [requests, setRequests] = useState<PlanRequest[]>([])
  const [service, setService] = useState(records.services[0]?.id || "")
  const [count, setCount] = useState(4)
  const [reason, setReason] = useState("")
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  async function load() {
    const results = await Promise.all([
      supabase!.rpc("gw_receipts"),
      supabase!.from("gw_subscription_requests").select("*"),
    ])
    for (const result of results) if (result.error) throw result.error
    setReceipts(results[0].data || [])
    setRequests(results[1].data || [])
  }
  async function run(action: () => Promise<unknown>, success: string) {
    setBusy(true)
    setMessage("")
    try {
      await action()
      await load()
      setMessage(success)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Billing storage is unavailable. Deploy the new migrations.",
      )
    } finally {
      setBusy(false)
    }
  }
  useEffect(() => {
    void run(async () => {}, "")
  }, [])
  function download(receipt: Receipt) {
    const content = [
      "GO-WASH PAYMENT RECEIPT",
      receipt.receipt_number,
      receipt.service_name,
      `NGN ${(receipt.amount_kobo / 100).toFixed(2)}`,
      new Date(receipt.paid_at).toISOString(),
      `Payment status: ${receipt.payment_status}`,
      "This receipt confirms payment, not service completion.",
    ].join("\n")
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/plain;charset=utf-8" }),
    )
    const link = document.createElement("a")
    link.href = url
    link.download = `${receipt.receipt_number}.txt`
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <div className="space-y-6">
      {message && (
        <p role="status" className="content-panel">
          {message}
        </p>
      )}
      <section className="content-panel space-y-4">
        <Heading>Payment receipts</Heading>
        <p>
          Receipts appear only after provider reconciliation. No card details
          are stored.
        </p>
        {!receipts.length && <p>No reconciled receipts loaded.</p>}
        {receipts.map((receipt) => (
          <div
            key={receipt.receipt_number}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-(--line) py-4"
          >
            <p>
              {receipt.service_name} · ₦
              {(receipt.amount_kobo / 100).toLocaleString()} ·{" "}
              {receipt.payment_status}
            </p>
            <Button className="secondary" onClick={() => download(receipt)}>
              Download receipt
            </Button>
          </div>
        ))}
        <Button
          className="secondary"
          disabled={busy}
          onClick={() => void run(async () => {}, "Billing refreshed.")}
        >
          Refresh billing
        </Button>
      </section>
      <section className="content-panel space-y-4">
        <Heading>Request a refund</Heading>
        <p>
          Full refunds require finance approval and provider confirmation. A
          request does not cancel an active wash.
        </p>
        <Input
          aria-label="Refund reason"
          placeholder="Tell us why (at least 10 characters)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {records.payments
          .filter((payment) => payment.status === "paid")
          .map((payment) => (
            <Button
              key={payment.id}
              className="secondary"
              disabled={busy || reason.trim().length < 10}
              onClick={() =>
                void run(async () => {
                  const { error } = await supabase!.rpc("gw_request_refund", {
                    p_payment_id: payment.id,
                    p_reason: reason,
                  })
                  if (error) throw error
                }, "Refund request recorded. Finance will review it; no refund has been confirmed.")
              }
            >
              Request refund · {payment.reference}
            </Button>
          ))}
      </section>
      <section className="content-panel space-y-4">
        <Heading>Plan your recurring care</Heading>
        <p>
          Request a monthly plan for review. Recurring billing and wash credits
          are not enabled; this request creates no charge or subscription
          mandate.
        </p>
        <label className="block">
          Service
          <Select value={service} onChange={(e) => setService(e.target.value)}>
            {records.services.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="block">
          Washes per month
          <Input
            type="number"
            min={1}
            max={12}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <Button
          className="primary"
          disabled={
            busy ||
            !service ||
            !Number.isInteger(count) ||
            count < 1 ||
            count > 12
          }
          onClick={() =>
            void run(async () => {
              const { error } = await supabase!
                .from("gw_subscription_requests")
                .insert({ service_id: service, washes_per_month: count })
              if (error) throw error
            }, "Plan request recorded. No recurring charges have been enabled.")
          }
        >
          Request monthly plan
        </Button>
        {requests.map((request) => (
          <p key={request.id}>
            {request.service_id} · {request.washes_per_month} washes / month ·{" "}
            {request.status}
          </p>
        ))}
      </section>
    </div>
  )
}
