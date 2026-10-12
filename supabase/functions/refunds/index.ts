import { createClient } from "npm:@supabase/supabase-js@2.117.3"
import { corsHeaders, json } from "../_shared/http.ts"

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405)
  const url = Deno.env.get("SUPABASE_URL")
  const anon = Deno.env.get("SUPABASE_ANON_KEY")
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const secret = Deno.env.get("PAYSTACK_SECRET_KEY")
  if (!url || !anon || !service || !secret)
    return json({ error: "Refund provider is not configured." }, 503)
  const db = createClient(url, anon, {
    global: {
      headers: { Authorization: request.headers.get("Authorization") || "" },
    },
  })
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) return json({ error: "Sign in to finance." }, 401)
  let refundId: string
  try {
    refundId = (await request.json()).refundId
  } catch {
    return json({ error: "Invalid body." }, 400)
  }
  if (!/^[0-9a-f-]{36}$/i.test(refundId || ""))
    return json({ error: "Invalid refund ID." }, 400)
  const { data, error } = await db
    .rpc("gw_claim_refund", { p_refund_id: refundId })
    .single()
  if (error) return json({ error: error.message }, 403)
  // Claim commits before the provider call. Ambiguous failures stay processing:
  // never automatically reissue a monetary action after a timeout.
  try {
    const response = await fetch("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: data.reference,
        amount: Number(data.amount_kobo),
        merchant_note: refundId,
      }),
      signal: AbortSignal.timeout(20000),
    })
    const result = await response.json()
    if (!response.ok || !result.status || !result.data?.id)
      throw new Error("Provider refund was not confirmed.")
    const admin = createClient(url, service)
    const { error: reconcileError } = await admin.rpc("gw_reconcile_refund", {
      p_refund_id: refundId,
      p_provider_id: String(result.data.id),
      p_status: result.data.status,
      p_reference: data.reference,
      p_amount_kobo: data.amount_kobo,
    })
    if (reconcileError) throw reconcileError
    return json({ status: result.data.status })
  } catch {
    return json(
      {
        error:
          "Refund outcome requires reconciliation. Do not resubmit; review the provider dashboard.",
      },
      502,
    )
  }
})
