"use client"

import Link from "next/link"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { Icon } from "@/components/Visuals"
import { Loading, Notice } from "@/components/app/kit"
import { useResource } from "@/lib/api/hooks"
import type { Payment } from "@/lib/api/types"
import { useSession } from "@/lib/auth"
import { loginHref } from "@/lib/auth"
import { naira } from "@/lib/format"
import { useRouter } from "next/navigation"

/** The page the payment provider returns to: asks the API what happened and says so plainly. */
export default function PaymentReturn({ reference }: { reference?: string }) {
  const session = useSession()
  const router = useRouter()
  const client = useQueryClient()
  const payment = useResource<Payment>(session && reference ? `/payments/${reference}/verify` : null)

  useEffect(() => {
    if (session === null) router.replace(loginHref("Customer", `/workspace/customer`))
  }, [session, router])

  useEffect(() => {
    if (payment.data) void client.invalidateQueries()
  }, [payment.data, client])

  if (!reference) {
    return (
      <Shell>
        <Notice tone="bad">There is no payment to check.</Notice>
      </Shell>
    )
  }
  if (session === undefined || payment.isPending) return <Loading label="Confirming your payment…" />

  const p = payment.data
  const paid = p?.status === "success" || p?.status === "partially_refunded"
  // Where "continue" goes depends on what was paid for.
  const next = p?.booking_id ? `/workspace/customer/bookings/${p.booking_id}` : p?.subscription_id ? "/workspace/customer/subscriptions" : "/workspace/customer"

  return (
    <Shell>
      <span className="confirmation-icon">
        <Icon name={paid ? "check" : "close"} size={34} />
      </span>
      <h1 style={{ fontSize: 30, margin: "18px 0 10px" }}>
        {paid ? "Payment received." : payment.isError ? "We could not check the payment." : "That payment did not go through."}
      </h1>
      <p className="kit-muted" style={{ maxWidth: 440, margin: "0 auto 22px" }}>
        {paid
          ? `${naira(p?.amount_kobo)} is paid. A receipt is on its way to your account.`
          : payment.isError
            ? payment.error.message
            : "Nothing was charged, or your bank is still confirming it. If money left your account, wait a few minutes and open the booking again; it updates by itself."}
      </p>
      <Link className="primary" href={next}>
        Continue <Icon name="arrow" size={17} />
      </Link>
    </Shell>
  )
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div style={{ minHeight: "100dvh", display: "grid", placeContent: "center", textAlign: "center", padding: 24 }}>{children}</div>
)
