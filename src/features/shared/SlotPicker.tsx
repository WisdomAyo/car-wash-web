"use client"

import { useState } from "react"
import { Loading } from "@/components/app/kit"
import { useRaw } from "@/lib/api/hooks"
import type { Slot } from "@/lib/api/types"
import { nextDays, time } from "@/lib/format"

const weekday = (date: string) => new Intl.DateTimeFormat("en-NG", { weekday: "short", timeZone: "Africa/Lagos" }).format(new Date(`${date}T12:00:00+01:00`))
const dayNumber = (date: string) => new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", timeZone: "Africa/Lagos" }).format(new Date(`${date}T12:00:00+01:00`))

/**
 * Pick a day, then a two-hour window. Windows come from the API (Lagos time) with whether each still has room.
 * `value` is the chosen window's `starts_at` (ISO), or "".
 */
export default function SlotPicker({
  state = "LA",
  value,
  onChange,
  days = 14,
}: {
  state?: string
  value: string
  onChange: (startsAt: string) => void
  days?: number
}) {
  const dates = nextDays(days)
  const [date, setDate] = useState(dates[0])
  const slots = useRaw<{ data: Slot[] }>("/slots", { date, state })

  return (
    <div className="kit-stack">
      <div className="kit-chips" role="group" aria-label="Choose a day">
        {dates.map((d) => (
          <button
            type="button"
            key={d}
            className={`kit-chip ${d === date ? "selected" : ""}`}
            onClick={() => {
              setDate(d)
              onChange("")
            }}
          >
            <b>{weekday(d)}</b> {dayNumber(d)}
          </button>
        ))}
      </div>
      {slots.isPending ? (
        <Loading label="Finding times…" />
      ) : slots.isError ? (
        <p className="kit-danger">{slots.error.message}</p>
      ) : (
        <div className="kit-chips" role="group" aria-label="Choose a time">
          {slots.data.data.map((slot) => (
            <button
              type="button"
              key={slot.starts_at}
              disabled={!slot.available}
              className={`kit-chip ${slot.starts_at === value ? "selected" : ""}`}
              onClick={() => onChange(slot.starts_at)}
              title={slot.available ? undefined : "Not available"}
            >
              {time(slot.starts_at)} – {time(slot.ends_at)}
              {!slot.available && " · unavailable"}
            </button>
          ))}
          {slots.data.data.length === 0 && <p className="kit-muted">No times are open on this day. Try another.</p>}
        </div>
      )}
    </div>
  )
}
