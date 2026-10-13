import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Auth from "@/features/auth/Auth"
import { authModes, roleFromParam, type AuthMode } from "@/lib/roles"

type Props = {
  params: Promise<{ mode: string }>
  searchParams: Promise<{ role?: string; next?: string; ref?: string; expired?: string }>
}

const titles: Record<AuthMode, string> = {
  login: "Sign in",
  register: "Get started",
  recover: "Recover access",
}

const isAuthMode = (value: string): value is AuthMode =>
  authModes.includes(value as AuthMode)

export const dynamicParams = false
export const generateStaticParams = () => authModes.map((mode) => ({ mode }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mode } = await params
  return { title: isAuthMode(mode) ? titles[mode] : "Sign in" }
}

export default async function AuthPage({ params, searchParams }: Props) {
  const { mode } = await params
  if (!isAuthMode(mode)) notFound()
  const { role, next, ref, expired } = await searchParams
  return (
    <Auth
      mode={mode}
      initialRole={roleFromParam(typeof role === "string" ? role : undefined)}
      next={typeof next === "string" ? next : undefined}
      referral={typeof ref === "string" ? ref : undefined}
      expired={expired === "1"}
    />
  )
}
