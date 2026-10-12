import { createClient } from "npm:@supabase/supabase-js@2.117.3"
import { json } from "../_shared/http.ts"
import { sha256Hex, verifyPaystackSignature } from "../_shared/paystack.ts"

type PaystackEvent = {
  event?: string
  data?: {
    id?: number
    reference?: string
    status?: string
    amount?: number
    currency?: string
    paid_at?: string | null
    channel?: string
    gateway_response?: string
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405)
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY")
  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  if (!secret || !supabaseUrl || !serviceKey)
    return json({ error: "Webhook environment is incomplete." }, 503)

  const rawBody = await request.text()
  const signature = request.headers.get("x-paystack-signature") || ""
  if (!(await verifyPaystackSignature(secret, rawBody, signature)))
    return json({ error: "Invalid signature." }, 401)

  let payload: PaystackEvent
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return json({ error: "Invalid JSON." }, 400)
  }
  const event = payload.event || ""
  const admin = createClient(supabaseUrl, serviceKey)
  if (
    [
      "refund.processed",
      "refund.failed",
      "refund.processing",
      "refund.pending",
    ].includes(event)
  ) {
    const refund = payload.data
    if (!refund?.id) return json({ error: "Invalid refund payload." }, 400)
    // Fetch authoritative provider data rather than trusting optional webhook fields.
    try {
      const response = await fetch(
        `https://api.paystack.co/refund/${refund.id}`,
        {
          headers: { Authorization: `Bearer ${secret}` },
          signal: AbortSignal.timeout(20000),
        },
      )
      const result = await response.json()
      if (!response.ok || !result.status || !result.data)
        throw new Error("Provider lookup failed.")
      const { data: row, error: lookupError } = await admin
        .from("gw_refund_requests")
        .select("id")
        .eq("provider_refund_id", String(refund.id))
        .maybeSingle()
      // A webhook may race the initialization response; return 500 for provider retry.
      if (lookupError || !row) throw new Error("Refund is not yet linked.")
      const { error } = await admin.rpc("gw_reconcile_refund", {
        p_refund_id: row.id,
        p_provider_id: String(refund.id),
        p_status: result.data.status,
        p_reference: result.data.transaction?.reference,
        p_amount_kobo: result.data.amount,
      })
      if (error) throw error
      return json({ received: true })
    } catch {
      return json({ error: "Refund reconciliation failed." }, 500)
    }
  }
  if (!["charge.success", "charge.failed", "charge.abandoned"].includes(event))
    return json({ received: true, ignored: true })
  const transaction = payload.data
  if (
    !transaction?.id ||
    !transaction.reference?.startsWith("GW-") ||
    !Number.isSafeInteger(transaction.amount)
  )
    return json({ error: "Invalid transaction payload." }, 400)

  const safePayload = {
    event,
    transaction_id: String(transaction.id),
    reference: transaction.reference,
    status: transaction.status || null,
    amount: transaction.amount,
    currency: transaction.currency || null,
    paid_at: transaction.paid_at || null,
    channel: transaction.channel || null,
    gateway_response: transaction.gateway_response || null,
  }
  const { data, error } = await admin.rpc("gw_reconcile_payment", {
    p_reference: transaction.reference,
    p_provider_event_id: `${event}:${transaction.id}`,
    p_event_type: event,
    p_provider_status: transaction.status || "",
    p_amount_kobo: transaction.amount,
    p_transaction_id: String(transaction.id),
    p_paid_at: transaction.paid_at || null,
    p_payload_hash: await sha256Hex(rawBody),
    p_payload: safePayload,
  })
  if (error) return json({ error: "Reconciliation failed." }, 500)
  return json({ received: true, status: data })
})
