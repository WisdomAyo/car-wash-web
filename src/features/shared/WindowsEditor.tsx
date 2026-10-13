"use client"

import { useRaw } from "@/lib/api/hooks"
import type { EstateWindow, Slot } from "@/lib/api/types"
import { WEEKDAYS, lagosDay } from "@/lib/format"

const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Lagos" }).format(new Date(iso))

/** Wash-window starts are the booking slot starts, so the choices come from the API's slot grid. */
export const useSlotStarts = () => {
  const slots = useRaw<{ data: Slot[] }>("/slots", { date: lagosDay(2) })
  return slots.data?.data.map((s) => ({ value: hhmm(s.starts_at), label: new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(new Date(s.starts_at)) })) ?? []
}

/**
 * A week grid: for each day, which two-hour windows the estate is washed in. `value` is the full schedule
 * (what the API stores), `onChange` gets the new one.
 */
export default function WindowsEditor({ value, onChange }: { value: EstateWindow[]; onChange: (next: EstateWindow[]) => void }) {
  const starts = useSlotStarts()
  const has = (weekday: number, startsAt: string) => value.some((w) => w.weekday === weekday && w.starts_at === startsAt)
  const toggle = (weekday: number, startsAt: string) =>
    onChange(has(weekday, startsAt) ? value.filter((w) => !(w.weekday === weekday && w.starts_at === startsAt)) : [...value, { weekday, starts_at: startsAt }])

  return (
    <div className="kit-stack">
      {[1, 2, 3, 4, 5, 6, 0].map((weekday) => (
        <div key={weekday} className="kit-row" style={{ alignItems: "flex-start" }}>
          <b style={{ width: 100, paddingTop: 8 }}>{WEEKDAYS[weekday]}</b>
          <div className="kit-chips">
            {starts.map((s) => (
              <button key={s.value} type="button" className={`kit-chip ${has(weekday, s.value) ? "selected" : ""}`} aria-pressed={has(weekday, s.value)} onClick={() => toggle(weekday, s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export const describeWindows = (windows: EstateWindow[]) =>
  windows.length === 0
    ? "No wash days"
    : [1, 2, 3, 4, 5, 6, 0]
        .filter((d) => windows.some((w) => w.weekday === d))
        .map((d) => `${WEEKDAYS[d].slice(0, 3)} ${windows.filter((w) => w.weekday === d).map((w) => w.starts_at).join(", ")}`)
        .join(" · ")
