import { createClient } from "npm:@supabase/supabase-js@2.117.3"
import { corsHeaders, json } from "../_shared/http.ts"
import { initializePaystack } from "../_shared/paystack.ts"

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders })
  if (request.method !== "POST")
    return json({ error: "Method not allowed." }, 405)

  const supabaseUrl = Deno.env.get("SUPABASE_URL")
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  const paystackSecret = Deno.env.get("PAYSTACK_SECRET_KEY")
  if (!supabaseUrl || !anonKey || !serviceKey)
    return json({ error: "Supabase function environment is incomplete." }, 503)
  if (!paystackSecret)
    return json(
      { error: "Paystack is not configured. Add PAYSTACK_SECRET_KEY." },
      503,
    )

  const authorization = request.headers.get("Authorization")
  if (!authorization) return json({ error: "Sign in to pay." }, 401)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  })
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser()
  if (userError || !user?.email) return json({ error: "Sign in to pay." }, 401)

  let input: { bookingId?: string requestId?: string }
  try {
    input = await request.json()
  } catch {
    return json({ error: "A JSON request body is required." }, 400)
  }
  if (!uuid.test(input.bookingId || "") || !uuid.test(input.requestId || ""))
    return json({ error: "Booking and request identifiers are required." }, 400)

  const { data, error } = await userClient
    .rpc("gw_prepare_payment", {
      p_booking_id: input.bookingId,
      p_request_id: input.requestId,
    })
    .single()
  if (error) return json({ error: error.message }, 400)
  if (data.authorization_url)
    return json({ authorizationUrl: data.authorization_url })

  const configuredCallback = Deno.env.get("PAYMENT_CALLBACK_URL")
  const origin = request.headers.get("Origin")
  const callbackUrl =
    configuredCallback ||
    (origin && /^https?:\/\//.test(origin) ? `${origin}/#account` : "")
  if (!callbackUrl)
    return json({ error: "Payment callback URL is not configured." }, 503)

  try {
    const initialized = await initializePaystack(paystackSecret, {
      email: user.email,
      amount: Number(data.amount_kobo),
      reference: data.reference,
      callbackUrl,
      bookingId: input.bookingId!,
      paymentId: data.payment_id,
    })
    const admin = createClient(supabaseUrl, serviceKey)
    const { error: updateError } = await admin.rpc("gw_mark_payment_pending", {
      p_payment_id: data.payment_id,
      p_authorization_url: initialized.authorizationUrl,
      p_access_code: initialized.accessCode,
    })
    if (updateError) throw updateError
    return json({ authorizationUrl: initialized.authorizationUrl })
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize payment.",
      },
      502,
    )
  }
})
