"use client"

import { useEffect, useRef } from "react"
import { useToast } from "@/components/app/Toast"
import type { AppNotification } from "@/lib/api/types"
import { playSound, primeAudio, toneFor } from "@/lib/sound"

/**
 * Rings (and shows a message) when a new unread notification arrives in a list that is polled.
 *
 * The first list it sees only sets the baseline, so opening the app never plays a sound for things that
 * were already waiting. After that, every unread notification it has not seen before makes a sound (the
 * stronger tone if any of them needs action), a toast with the newest title, and, when the tab is in the
 * background and the person allowed it, a desktop notification.
 */
export default function useNotificationAlerts(items: AppNotification[] | undefined) {
  const notify = useToast()
  const seen = useRef<Set<string> | null>(null)

  useEffect(() => primeAudio(), [])

  useEffect(() => {
    if (!items) return
    if (seen.current === null) {
      seen.current = new Set(items.map((n) => n.id))
      return
    }
    const known = seen.current
    const fresh = items.filter((n) => !n.read && !known.has(n.id))
    items.forEach((n) => known.add(n.id))
    if (fresh.length === 0) return

    const newest = fresh[0]
    playSound(fresh.some((n) => toneFor(n.kind) === "alert") ? "alert" : "soft")
    notify(fresh.length > 1 ? `${fresh.length} new notifications: ${newest.title}` : newest.title)

    if (document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification(newest.title, { body: newest.body, tag: newest.id })
      } catch {
        // some mobile browsers only allow notifications through a service worker
      }
    }
  }, [items, notify])
}
