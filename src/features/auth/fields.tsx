"use client"

import { useState, type InputHTMLAttributes, type ReactNode } from "react"
import { ApiError } from "@/lib/api/client"

/** A password box with a Show/Hide switch. */
export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button type="button" onClick={() => setVisible(!visible)}>
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  )
}

/** A label + control + this field's problem from the API, in the sign-in form style. */
export function AuthField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label>
      {label}
      {children}
      {hint && !error && <small style={{ display: "block", color: "#7c8798", fontSize: 12, marginTop: 6 }}>{hint}</small>}
      {error && (
        <small className="form-error" role="alert" style={{ display: "block", marginTop: 6 }}>
          {error}
        </small>
      )}
    </label>
  )
}

/** The message to show under a form: the API's field problems are placed on their fields, anything else is returned here. */
export const formMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code === "validation_failed") return "Please check the highlighted details."
    return error.message
  }
  return error instanceof Error ? error.message : "Something went wrong. Please try again."
}

export const fieldProblem = (error: unknown, name: string) =>
  error instanceof ApiError && error.code === "validation_failed" ? error.field(name) : undefined
