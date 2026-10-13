"use client"

import { useState, type ReactNode } from "react"
import { AsyncList, Empty, PageHeader, Panel, SearchBox, Select, Table, type Column } from "@/components/app/kit"
import { ReasonDialog } from "@/components/app/overlays"
import { api, type Query } from "@/lib/api/client"
import { fieldError, useAction, useList } from "@/lib/api/hooks"

export type Filter = { param: string; label: string; options: { value: string; label: string }[]; initial?: string }

/**
 * The shape of most admin screens: a heading, filters and a search box over a paged table. Describe the data
 * (`path`, `columns`, filters) and this does the loading, empty and "show more" states.
 */
export function AdminList<T>({
  eyebrow,
  title,
  description,
  path,
  filters = [],
  search,
  query,
  columns,
  rowKey,
  href,
  action,
  empty,
  refetchInterval,
}: {
  eyebrow?: string
  title: string
  description?: string
  path: string
  filters?: Filter[]
  search?: { param: string; placeholder: string }
  /** Fixed query values (always sent). */
  query?: Query
  columns: Column<T>[]
  rowKey: (row: T) => string
  href?: (row: T) => string
  action?: ReactNode
  empty?: ReactNode
  refetchInterval?: number
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(filters.map((f) => [f.param, f.initial ?? ""])))
  const [term, setTerm] = useState("")
  const list = useList<T>(path, { ...query, ...values, ...(search ? { [search.param]: term.trim() || undefined } : {}) }, { refetchInterval })

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} action={action} />
      <Panel>
        {(filters.length > 0 || search) && (
          <div className="kit-toolbar">
            {search && <SearchBox value={term} onChange={setTerm} placeholder={search.placeholder} />}
            {filters.map((f) => (
              <Select key={f.param} label={f.label} value={values[f.param] ?? ""} onChange={(v) => setValues({ ...values, [f.param]: v })} options={[{ value: "", label: f.label }, ...f.options]} />
            ))}
          </div>
        )}
        <AsyncList list={list} empty={empty ?? <Empty icon="list" title="Nothing here.">Nothing matches right now.</Empty>}>
          {(rows) => <Table rows={rows} rowKey={rowKey} columns={columns} href={href} />}
        </AsyncList>
      </Panel>
    </>
  )
}

/**
 * A button that asks for a written reason (kept in the audit log), then calls the API. Covers most admin decisions:
 * void, reject, suspend, release, cancel…
 */
export function ReasonButton({
  label,
  title = label,
  description,
  path,
  method = "POST",
  body,
  invalidate,
  success,
  danger = false,
  secondary = true,
  small = false,
  extra,
  minLength,
  disabled,
  onDone,
}: {
  label: string
  title?: string
  description?: string
  path: string
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
  /** More fields sent with the reason. */
  body?: Record<string, unknown>
  invalidate: string[]
  success: string
  danger?: boolean
  secondary?: boolean
  small?: boolean
  /** Extra inputs shown above the reason; their values come from `body`. */
  extra?: ReactNode
  minLength?: number
  disabled?: boolean
  onDone?: () => void
}) {
  const [open, setOpen] = useState(false)
  const run = useAction((reason: string) => api(path, { method, body: { ...body, reason } }), {
    invalidate,
    success,
    onSuccess: () => {
      setOpen(false)
      onDone?.()
    },
  })
  return (
    <>
      <button className={`${secondary ? "secondary" : "primary"} ${danger ? "kit-danger" : ""} ${small ? "kit-btn-small" : ""}`} onClick={() => setOpen(true)} disabled={disabled}>
        {label}
      </button>
      {open && (
        <ReasonDialog
          title={title}
          description={description}
          confirmLabel={label}
          danger={danger}
          minLength={minLength}
          pending={run.pending}
          error={fieldError(run.error, "reason")}
          extra={extra}
          onConfirm={(reason) => run.run(reason)}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

/** A button for an action with no input: calls the API and says it worked. */
export function ActionButton({
  label,
  path,
  method = "POST",
  body,
  invalidate,
  success,
  primary = false,
  small = false,
  disabled,
  onDone,
}: {
  label: string
  path: string
  method?: "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
  invalidate: string[]
  success: string | ((result: unknown) => string)
  primary?: boolean
  small?: boolean
  disabled?: boolean
  onDone?: (result: unknown) => void
}) {
  const run = useAction(() => api(path, { method, body }), { invalidate, success, onSuccess: onDone })
  return (
    <button className={`${primary ? "primary" : "secondary"} ${small ? "kit-btn-small" : ""}`} onClick={() => run.run()} disabled={run.pending || disabled}>
      {run.pending ? "Working…" : label}
    </button>
  )
}
