"use client"

import { useEffect, useState, type ReactNode } from "react"
import { PageTransition } from "@/components/Motion"

// A template re-mounts on every navigation, which is exactly when the entrance should play.
// It must not play for the first page of a visit (the server-rendered HTML is already visible).
let firstPageMounted = false

export default function Template({ children }: { children: ReactNode }) {
  const [animate] = useState(() => firstPageMounted)
  useEffect(() => {
    firstPageMounted = true
  }, [])
  return (
    <PageTransition transitionKey="route" animateOnMount={animate}>
      {children}
    </PageTransition>
  )
}
