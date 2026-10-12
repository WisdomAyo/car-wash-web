import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "../lib/supabase"

export default function useSession() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    const client = supabase
    if (!client) {
      setLoading(false)
      return
    }
    let active = true
    // Subscribe before restoring so sign-in/sign-out cannot be missed.
    let changed = false
    const { data } = client.auth.onAuthStateChange((_event, next) => {
      changed = true
      if (active) {
        setSession(next)
        setError("")
        setLoading(false)
      }
    })
    client.auth
      .getSession()
      .then(({ data, error }) => {
        if (active && !changed) {
          setSession(data.session)
          setError(error?.message || "")
          setLoading(false)
        }
      })
      .catch(() => {
        if (active && !changed) {
          setError("Unable to restore your session. Please sign in again.")
          setLoading(false)
        }
      })
    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])
  return { session, loading, error }
}
