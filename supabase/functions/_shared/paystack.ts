const apiUrl = "https://api.paystack.co"
const encoder = new TextEncoder()

type InitializeInput = {
  email: string
  amount: number
  reference: string
  callbackUrl: string
  bookingId: string
  paymentId: string
}

type PaystackInitializeResponse = {
  status: boolean
  message: string
  data?: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export async function initializePaystack(
  secret: string,
  input: InitializeInput,
) {
  const response = await fetch(`${apiUrl}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amount,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: {
        booking_id: input.bookingId,
        payment_id: input.paymentId,
      },
    }),
  })
  const body = (await response.json()) as PaystackInitializeResponse
  if (!response.ok || !body.status || !body.data)
    throw new Error(body.message || "Paystack initialization failed.")
  const authorizationUrl = new URL(body.data.authorization_url)
  if (
    authorizationUrl.protocol !== "https:" ||
    !authorizationUrl.hostname.endsWith(".paystack.com")
  )
    throw new Error("Paystack returned an invalid authorization URL.")
  if (body.data.reference !== input.reference)
    throw new Error("Paystack returned a mismatched payment reference.")
  return {
    authorizationUrl: authorizationUrl.toString(),
    accessCode: body.data.access_code,
  }
}

function toHex(bytes: ArrayBuffer) {
  return [...new Uint8Array(bytes)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
}

export async function verifyPaystackSignature(
  secret: string,
  rawBody: string,
  signature: string,
) {
  if (!/^[a-f0-9]{128}$/i.test(signature)) return false
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  )
  const expected = toHex(
    await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody)),
  )
  let mismatch = expected.length ^ signature.length
  for (let index = 0; index < expected.length; index++)
    mismatch |=
      expected.charCodeAt(index) ^ signature.toLowerCase().charCodeAt(index)
  return mismatch === 0
}

export async function sha256Hex(value: string) {
  return toHex(await crypto.subtle.digest("SHA-256", encoder.encode(value)))
}
