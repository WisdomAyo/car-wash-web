"use client"

import Link from "next/link"
import type { ReactNode } from "react"
import { Icon, type IconName } from "@/components/Visuals"
import { humanise, plate as formatPlate } from "@/lib/format"
import type { ApiError } from "@/lib/api/client"

/* ------------------------------------------------------------------ status pills */

type Tone = "ok" | "warn" | "bad" | "info" | "neutral"

const TONES: Record<Exclude<Tone, "neutral">, string[]> = {
  ok: [
    "completed", "paid", "success", "active", "approved", "answered", "published", "verified", "satisfied",
    "resolved", "accepted", "closed", "available", "done", "healthy", "processed",
  ],
  warn: [
    "pending", "pending_payment", "requested", "submitted", "in_review", "awaiting_contact", "new", "draft",
    "overdue", "partially_refunded", "processing", "needs_review", "incomplete", "inactive", "applicant", "on_hold",
    "reserved", "in_progress",
  ],
  bad: [
    "failed", "cancelled", "canceled", "rejected", "declined", "suspended", "void", "expired", "disputed", "flagged",
    "not_pleased", "untreated", "outcome_unknown", "refunded", "high", "missing",
  ],
  info: [
    "assigned", "accepted_by_washman", "on_the_way", "arrived", "washing", "ready", "booked", "issued", "escalated",
    "open", "confirmed", "scheduled", "normal", "submitted_for_review",
  ],
}

export const toneOf = (status: string): Tone => {
  const key = status.toLowerCase().replace(/[\s-]+/g, "_")
  return (Object.keys(TONES) as (keyof typeof TONES)[]).find((tone) => TONES[tone].includes(key)) ?? "neutral"
}

/** A coloured status chip. Pass the API's raw status; the label and colour follow from it. */
export function Pill({ status, label, tone }: { status: string; label?: string; tone?: Tone }) {
  return <span className={`kit-pill tone-${tone ?? toneOf(status)}`}>{label ?? humanise(status)}</span>
}

/* ------------------------------------------------------------------ page parts */

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`portal-panel ${className}`}>
      {(title || action) && (
        <div className="section-heading">
          <div>
            {title && <h3>{title}</h3>}
            {description && <p className="kit-sub">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Metrics({
  items,
}: {
  items: { label: string; value: ReactNode; note?: string; icon?: IconName }[]
}) {
  return (
    <div className="kit-metrics">
      {items.map((item) => (
        <article key={item.label}>
          <div>
            {item.label}
            {item.icon && <Icon name={item.icon} size={18} />}
          </div>
          <h3 className="kit-num">{item.value}</h3>
          {item.note && <p>{item.note}</p>}
        </article>
      ))}
    </div>
  )
}

/** Label/value pairs: `<Facts items={[["Phone", user.phone], ...]} />`. Empty values show a dash. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kit-facts">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value === null || value === undefined || value === "" ? "—" : value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function Notice({ children, tone = "info", icon = "shield" }: { children: ReactNode; tone?: "info" | "warn" | "bad"; icon?: IconName }) {
  return (
    <div className={`kit-notice ${tone === "info" ? "" : tone}`}>
      <Icon name={icon} size={18} />
      <div>{children}</div>
    </div>
  )
}

/* ------------------------------------------------------------------ states */

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="kit-loading" role="status">
      <span className="kit-spinner" />
      {label}
    </div>
  )
}

export function Empty({
  icon = "shield",
  title,
  children,
  action,
}: {
  icon?: IconName
  title: string
  children?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="kit-empty">
      <Icon name={icon} size={40} />
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  )
}

export function ErrorBox({ error, retry }: { error: ApiError | Error | null; retry?: () => void }) {
  return (
    <div className="kit-error" role="alert">
      {error?.message ?? "Something went wrong."}
      {retry && (
        <div>
          <button className="secondary kit-btn-small" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Handles the three states every list and detail screen shares: loading, failed, and (for lists) empty.
 * `children` only runs when there is data.
 */
export function Async<T>({
  query,
  empty,
  isEmpty,
  children,
}: {
  query: { data: T | undefined; isPending: boolean; isError: boolean; error: Error | null; refetch: () => unknown }
  /** Shown instead of `children` when `isEmpty(data)` is true. */
  empty?: ReactNode
  isEmpty?: (data: T) => boolean
  children: (data: T) => ReactNode
}) {
  if (query.isPending) return <Loading />
  if (query.isError) return <ErrorBox error={query.error} retry={() => query.refetch()} />
  if (query.data === undefined) return null
  if (empty && isEmpty?.(query.data)) return <>{empty}</>
  return <>{children(query.data)}</>
}

/** The same for paged lists from `useList`. */
export function AsyncList<T>({
  list,
  empty,
  children,
}: {
  list: {
    items: T[]
    isPending: boolean
    isError: boolean
    error: Error | null
    refetch: () => unknown
    hasMore: boolean
    loadMore: () => unknown
    loadingMore: boolean
  }
  empty: ReactNode
  children: (items: T[]) => ReactNode
}) {
  if (list.isPending) return <Loading />
  if (list.isError) return <ErrorBox error={list.error} retry={() => list.refetch()} />
  if (list.items.length === 0) return <>{empty}</>
  return (
    <>
      {children(list.items)}
      {list.hasMore && (
        <div className="kit-more">
          <button className="secondary" onClick={() => list.loadMore()} disabled={list.loadingMore}>
            {list.loadingMore ? "Loading…" : "Show more"}
          </button>
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ table */

export type Column<T> = {
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

/** A responsive table. `href` makes each row a link (the first cell holds the real anchor, so it works with a keyboard). */
export function Table<T>({
  columns,
  rows,
  rowKey,
  href,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  href?: (row: T) => string
}) {
  return (
    <div className="kit-table-wrap">
      <table className="kit-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} className={column.className}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column, i) => (
                <td key={column.header} className={column.className}>
                  {i === 0 && href ? (
                    <Link className="row-link" href={href(row)}>
                      {column.cell(row)}
                    </Link>
                  ) : (
                    column.cell(row)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Two-line cell: a name and a small caption under it. */
export function Two({ top, bottom }: { top: ReactNode; bottom?: ReactNode }) {
  return (
    <>
      <strong>{top}</strong>
      {bottom !== undefined && bottom !== null && <small>{bottom}</small>}
    </>
  )
}

/* ------------------------------------------------------------------ tabs & toolbar */

export function Tabs<T extends string>({
  value,
  onChange,
  tabs,
}: {
  value: T
  onChange: (value: T) => void
  tabs: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="kit-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          role="tab"
          aria-selected={tab.value === value}
          className={tab.value === value ? "active" : ""}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          {tab.count !== undefined && <span className="kit-faint">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SearchBox({
  value,
  onChange,
  placeholder = "Search",
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="search-field">
      <Icon name="search" size={16} />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  label: string
}) {
  return (
    <select value={value} aria-label={label} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

/** A number plate, set the way it looks on the car. */
export function Plate({ value }: { value: string }) {
  return <span className="plate">{formatPlate(value)}</span>
}
