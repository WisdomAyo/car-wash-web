import type { Payment } from "@/lib/api/types"

/** Where the payment provider sends people back to (also set as `PAYSTACK_CALLBACK_URL` on the API). */
export const PAYMENT_RETURN_PATH = "/pay/return"

/**
 * Takes the person to pay. With a real provider that is its checkout page; the local test gateway has no
 * page, so the app goes straight to the return screen, which confirms the payment with the API.
 */
export function startPayment(payment: Pick<Payment, "reference" | "authorization_url">, navigate: (url: string) => void) {
  const returnUrl = `${PAYMENT_RETURN_PATH}?reference=${encodeURIComponent(payment.reference)}`
  const url = payment.authorization_url
  if (!url) return navigate(returnUrl)
  try {
    if (new URL(url).hostname.endsWith(".fake.local")) return navigate(returnUrl)
  } catch {
    return navigate(returnUrl)
  }
  window.location.assign(url)
}
