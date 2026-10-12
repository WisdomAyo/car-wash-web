import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import {
  initializePaystack,
  sha256Hex,
  verifyPaystackSignature,
} from "../supabase/functions/_shared/paystack.ts"

let checks = 0
async function check(name, action) {
  await action()
  checks++
  console.log(`PASS ${name}`)
}

await check("Paystack signature accepts the exact raw body", async () => {
  const secret = "sandbox-secret"
  const body = '{"event":"charge.success","data":{"id":42}}'
  const signature = createHmac("sha512", secret).update(body).digest("hex")
  assert.equal(await verifyPaystackSignature(secret, body, signature), true)
  assert.equal(
    await verifyPaystackSignature(secret, `${body} `, signature),
    false,
  )
})

await check("payload hashing is deterministic", async () => {
  assert.equal(await sha256Hex("go-wash"), await sha256Hex("go-wash"))
  assert.notEqual(await sha256Hex("go-wash"), await sha256Hex("Go-Wash"))
})

await check(
  "initialization sends kobo and server-owned references",
  async () => {
    const originalFetch = globalThis.fetch
    let requestBody
    globalThis.fetch = async (url, init) => {
      assert.equal(url, "https://api.paystack.co/transaction/initialize")
      assert.equal(init.headers.Authorization, "Bearer test-key")
      requestBody = JSON.parse(init.body)
      return Response.json({
        status: true,
        message: "Authorization URL created",
        data: {
          authorization_url: "https://checkout.paystack.com/sample",
          access_code: "sample",
          reference: "GW-ABC",
        },
      })
    }
    try {
      const result = await initializePaystack("test-key", {
        email: "customer@example.com",
        amount: 850000,
        reference: "GW-ABC",
        callbackUrl: "https://example.com/#account",
        bookingId: "booking-id",
        paymentId: "payment-id",
      })
      assert.equal(
        result.authorizationUrl,
        "https://checkout.paystack.com/sample",
      )
      assert.equal(requestBody.amount, 850000)
      assert.equal(requestBody.currency, "NGN")
      assert.equal(requestBody.metadata.booking_id, "booking-id")
    } finally {
      globalThis.fetch = originalFetch
    }
  },
)

console.log(`${checks} Paystack adapter checks passed.`)
