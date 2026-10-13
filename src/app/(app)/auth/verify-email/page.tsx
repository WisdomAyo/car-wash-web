import type { Metadata } from "next"
import { VerifyEmail } from "@/features/auth/EmailLinks"

export const metadata: Metadata = { title: "Confirm your email" }

type Props = { searchParams: Promise<{ token?: string; email?: string }> }

export default async function Page({ searchParams }: Props) {
  const { token, email } = await searchParams
  return <VerifyEmail token={typeof token === "string" ? token : undefined} email={typeof email === "string" ? email : undefined} />
}
