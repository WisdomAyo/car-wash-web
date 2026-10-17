import type { Metadata } from "next"
import { StaffLogin } from "@/features/auth/StaffAuth"

export const metadata: Metadata = { title: "Staff sign-in" }

type Props = { searchParams: Promise<{ team?: string; next?: string; expired?: string }> }

/** Sign-in for the field team (staff code + PIN) and, on its other tab, for the operations team. */
export default async function StaffLoginPage({ searchParams }: Props) {
  const { team, next, expired } = await searchParams
  return (
    <StaffLogin
      team={team === "operations" ? "operations" : undefined}
      next={typeof next === "string" ? next : undefined}
      expired={expired === "1"}
    />
  )
}
