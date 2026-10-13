"use client"

import { useCallback, useState, type ChangeEvent, type ReactNode } from "react"

type Values = Record<string, string | boolean>

/**
 * Plain controlled form state. `const form = useForm({ email: "" })`, then `<input {...form.field("email")} />`.
 * Checkboxes use `form.check("agree")`.
 */
export function useForm<T extends Values>(initial: T) {
  const [values, setValues] = useState<T>(initial)

  const set = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setValues((current) => ({ ...current, [name]: value }))
  }, [])

  const field = (name: keyof T & string) => ({
    name,
    value: String(values[name] ?? ""),
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      set(name, event.target.value as T[typeof name]),
  })

  const check = (name: keyof T & string) => ({
    name,
    checked: Boolean(values[name]),
    onChange: (event: ChangeEvent<HTMLInputElement>) => set(name, event.target.checked as T[typeof name]),
  })

  return { values, set, field, check, reset: () => setValues(initial), setValues }
}

/** A labelled control with its hint and error. Wrap the input: `<Field label="Email" error={...}><input .../></Field>`. */
export function Field({
  label,
  error,
  hint,
  children,
  className = "",
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <label className={`kit-field ${error ? "has-error" : ""} ${className}`}>
      {label}
      {children}
      {hint && !error && <span className="hint">{hint}</span>}
      {error && (
        <span className="error" role="alert">
          {error}
        </span>
      )}
    </label>
  )
}

export function CheckField({ children, error, ...props }: { children: ReactNode; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`kit-field check ${error ? "has-error" : ""}`}>
      <input type="checkbox" {...props} />
      <span>
        {children}
        {error && (
          <span className="error" role="alert">
            {" "}
            {error}
          </span>
        )}
      </span>
    </label>
  )
}

/** A native file picker with the accepted types spelled out. */
export function FileField({
  label,
  hint,
  accept = "image/jpeg,image/png,image/webp,application/pdf",
  onPick,
  error,
}: {
  label: string
  hint?: string
  accept?: string
  onPick: (file: File | null) => void
  error?: string
}) {
  return (
    <Field label={label} hint={hint} error={error}>
      <input type="file" accept={accept} onChange={(event) => onPick(event.target.files?.[0] ?? null)} />
    </Field>
  )
}

/** Shows an inline problem that is not tied to one field (a rule the API refused). */
export function FormError({ message }: { message?: string | null }) {
  if (!message) return null
  return (
    <p className="form-error" role="alert">
      {message}
    </p>
  )
}
