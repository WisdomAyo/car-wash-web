"use client"

import { useEffect, useRef, useState } from "react"
import { api } from "@/lib/api/client"

export type Fix = { lat: number; lng: number; accuracy_m: number }

/** One reading of where the phone is, or a plain-words reason it could not be read. */
export const readPosition = async (): Promise<Fix> => {
  if (!("geolocation" in navigator)) throw new Error("This device cannot share its location.")
  const once = (highAccuracy: boolean) =>
    new Promise<GeolocationPosition>((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: highAccuracy, timeout: highAccuracy ? 12_000 : 20_000, maximumAge: 30_000 }),
    )
  try {
    // GPS first; if it is slow indoors or under cover, settle for the network's estimate and let the server judge the accuracy.
    let p: GeolocationPosition
    try {
      p = await once(true)
    } catch (first) {
      if ((first as GeolocationPositionError).code === 1) throw first
      p = await once(false)
    }
    return { lat: p.coords.latitude, lng: p.coords.longitude, accuracy_m: Math.round(p.coords.accuracy) }
  } catch (e) {
    const denied = (e as GeolocationPositionError).code === 1
    throw new Error(
      denied
        ? "Location is blocked. Allow location for this site in your browser settings, then try again."
        : "We could not get a location fix. Move to open sky and try again.",
    )
  }
}

/** A client-side id for a command: a retry of the same tap is recognised and not done twice. */
export const commandId = (prefix: string) => `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`

/**
 * While a job is on, records the phone's position every few seconds and sends it in batches: this trail is part of
 * the proof of the wash. Stops when `active` is false or the page closes.
 */
export function useTrail(jobId: string, active: boolean) {
  const buffer = useRef<{ client_id: string; lat: number; lng: number; recorded_at: string; accuracy_m: number }[]>([])
  const [sent, setSent] = useState(0)

  useEffect(() => {
    if (!active || !("geolocation" in navigator)) return
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        buffer.current.push({
          client_id: commandId("pt"),
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          recorded_at: new Date(p.timestamp).toISOString(),
          accuracy_m: Math.round(p.coords.accuracy),
        })
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5_000 },
    )
    const flush = async () => {
      const points = buffer.current.splice(0, 200)
      if (points.length === 0) return
      try {
        await api(`/staff/jobs/${jobId}/locations`, { method: "POST", body: { points } })
        setSent((n) => n + points.length)
      } catch {
        buffer.current.unshift(...points) // keep them for the next try
      }
    }
    const timer = window.setInterval(flush, 15_000)
    return () => {
      navigator.geolocation.clearWatch(watch)
      window.clearInterval(timer)
      void flush()
    }
  }, [jobId, active])

  return sent
}
