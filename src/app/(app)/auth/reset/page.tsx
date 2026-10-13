import type { Metadata } from "next"
import { ResetPassword } from "@/features/auth/EmailLinks"

export const metadata: Metadata = { title: "Reset your password" }

type Props = { searchParams: Promise<{ token?: string; email?: string }> }

export default async function Page({ searchParams }: Props) {
  const { token, email } = await searchParams
  return <ResetPassword token={typeof token === "string" ? token : undefined} email={typeof email === "string" ? email : undefined} />
}
