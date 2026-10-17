"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loading } from "@/components/app/kit"
import { homeFor, useSession } from "@/lib/auth"

/** "My account" means wherever this person's own space is: their workspace if signed in, the sign-in page if not. */
export default function AccountRedirect() {
  const session = useSession()
  const router = useRouter()
  useEffect(() => {
    if (session === undefined) return
    router.replace(session ? homeFor(session.kind) : "/auth/login")
  }, [session, router])
  return <Loading label="Opening your account…" />
}
