import type { Metadata } from "next"
import { SetPassword } from "@/features/auth/EmailLinks"

export const metadata: Metadata = { title: "Choose your password" }

type Props = { searchParams: Promise<{ token?: string; email?: string }> }

export default async function Page({ searchParams }: Props) {
  const { token, email } = await searchParams
  return <SetPassword token={typeof token === "string" ? token : undefined} email={typeof email === "string" ? email : undefined} />
}
