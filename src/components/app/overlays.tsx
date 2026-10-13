"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon } from "@/components/Visuals"
import { Field } from "./forms"

function useOverlay(onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    // Move focus into the dialog so keyboard users start inside it.
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button:not(.modal-close)")?.focus()
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return ref
}

type OverlayProps = {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
}

/** A centred dialog for short forms and confirmations. */
export function Modal({ title, eyebrow, onClose, children }: OverlayProps) {
  const ref = useOverlay(onClose)
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  )
}

/** A side panel for longer detail and forms (the partner portal's pattern). */
export function Drawer({ title, eyebrow, onClose, children }: OverlayProps) {
  const ref = useOverlay(onClose)
  return (
    <div className="portal-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="portal-drawer" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <button className="modal-close" aria-label="Close" onClick={onClose}>
          <Icon name="close" size={16} />
        </button>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  )
}

/**
 * Decisions that change money, access or records need a written reason (the API requires it and keeps it in the
 * audit log). Asks for it, then calls `onConfirm(reason)`.
 */
export function ReasonDialog({
  title,
  description,
  confirmLabel,
  danger = false,
  minLength = 3,
  pending = false,
  error,
  onConfirm,
  onClose,
  extra,
}: {
  title: string
  description?: string
  confirmLabel: string
  danger?: boolean
  minLength?: number
  pending?: boolean
  error?: string
  onConfirm: (reason: string) => void
  onClose: () => void
  /** More inputs shown above the reason (an amount, a decision). */
  extra?: ReactNode
}) {
  const [reason, setReason] = useState("")
  return (
    <Modal title={title} onClose={onClose}>
      {description && <p>{description}</p>}
      <form
        className="kit-form"
        onSubmit={(event) => {
          event.preventDefault()
          onConfirm(reason.trim())
        }}
      >
        {extra}
        <Field label="Reason" error={error} hint="Written to the audit log.">
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={minLength} required />
        </Field>
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className={danger ? "kit-btn-danger" : "primary"} disabled={pending || reason.trim().length < minLength}>
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/** A yes/no question with no input. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  danger = false,
  pending = false,
  onConfirm,
  onClose,
}: {
  title: string
  description: string
  confirmLabel: string
  danger?: boolean
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal title={title} onClose={onClose}>
      <p>{description}</p>
      <div className="kit-form">
        <div className="actions">
          <button className="secondary" onClick={onClose}>
            Not now
          </button>
          <button className={danger ? "kit-btn-danger" : "primary"} onClick={onConfirm} disabled={pending}>
            {pending ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
