import type { Metadata } from "next"
import PaymentReturn from "@/features/shared/PaymentReturn"

export const metadata: Metadata = { title: "Payment" }

type Props = { searchParams: Promise<{ reference?: string; trxref?: string }> }

/** Where the payment provider sends people back to (`PAYSTACK_CALLBACK_URL`). */
export default async function Page({ searchParams }: Props) {
  const { reference, trxref } = await searchParams
  return <PaymentReturn reference={reference ?? trxref} />
}
