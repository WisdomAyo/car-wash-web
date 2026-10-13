const TZ = "Africa/Lagos"

/** 405000 -> "₦4,050". The API speaks kobo; people read naira. */
export const naira = (kobo: number | null | undefined) =>
  `₦${Math.round((kobo ?? 0) / 100).toLocaleString("en-NG")}`

/** Whole naira typed in a form -> kobo for the API. */
export const toKobo = (nairaAmount: string | number) =>
  Math.round(Number(nairaAmount) * 100)

const fmt = (options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-NG", { timeZone: TZ, ...options })

const dateFormat = fmt({ weekday: "short", day: "numeric", month: "short" })
const longDateFormat = fmt({ weekday: "long", day: "numeric", month: "long", year: "numeric" })
const timeFormat = fmt({ hour: "numeric", minute: "2-digit", hour12: true })
const stampFormat = fmt({ day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true })

const parse = (value: string | Date) => (value instanceof Date ? value : new Date(value))

/** "Wed, 14 Oct" in Lagos time. */
export const day = (value: string | Date | null | undefined) => (value ? dateFormat.format(parse(value)) : "—")
export const longDay = (value: string | Date) => longDateFormat.format(parse(value))
export const time = (value: string | Date | null | undefined) => (value ? timeFormat.format(parse(value)) : "—")
/** "14 Oct, 9:05 am". */
export const stamp = (value: string | Date | null | undefined) => (value ? stampFormat.format(parse(value)) : "—")

/** "9:00 am – 11:00 am". */
export const window_ = (from: string, to: string) => `${time(from)} – ${time(to)}`

/** "2026-10-14" in Lagos time (the API's day boundaries). */
export const lagosDate = (value: string | Date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(parse(value))

/** The Lagos date `offset` days from today (negative for the past), as `YYYY-MM-DD`. */
export const lagosDay = (offset = 0) => lagosDate(new Date(Date.now() + offset * 86_400_000))

/** The next `count` days as `YYYY-MM-DD`, starting today in Lagos. */
export const nextDays = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const date = new Date(Date.now() + i * 86_400_000)
    return lagosDate(date)
  })

/** "in 2 hours", "3 days ago". */
export const relative = (value: string | Date | null | undefined) => {
  if (!value) return "—"
  const seconds = Math.round((parse(value).getTime() - Date.now()) / 1000)
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" })
  const abs = Math.abs(seconds)
  if (abs < 60) return rtf.format(seconds, "second")
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), "minute")
  if (abs < 86_400) return rtf.format(Math.round(seconds / 3600), "hour")
  return rtf.format(Math.round(seconds / 86_400), "day")
}

/** `pending_payment` -> "Pending payment". */
export const humanise = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase()) : "—"

/** "LSR123AB" -> "LSR 123 AB". */
export const plate = (value: string) =>
  value.replace(/^([A-Z]{2,3})(\d{2,3})([A-Z]{1,2})$/, "$1 $2 $3")

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export const bytes = (n: number) =>
  n > 1_048_576 ? `${(n / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
