import { sessionStore } from "@/lib/session"

/** Origin of the Laravel API, including `/api/v1`. Set `NEXT_PUBLIC_API_URL` for anything but local development. */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1"
).replace(/\/$/, "")

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    /** Field name -> messages, for `validation_failed`; other errors may add context (e.g. `blockers`). */
    public details: Record<string, unknown> = {},
  ) {
    super(message)
  }

  /** The first message for a field, for showing under an input. */
  field(name: string): string | undefined {
    const value = this.details[name]
    return Array.isArray(value) ? String(value[0]) : undefined
  }
}

export type Query = Record<string, string | number | boolean | null | undefined>

type Options = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  query?: Query
  /** A JSON body. */
  body?: unknown
  /** A multipart body (file uploads). */
  form?: FormData
  headers?: Record<string, string>
  /** Use this token instead of the stored session's (sign-in calls, the assistant's own token). */
  token?: string | null
  /** Do not send any credentials. */
  anonymous?: boolean
  signal?: AbortSignal
}

const withQuery = (path: string, query?: Query) => {
  if (!query) return path
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value))
    }
  }
  const text = params.toString()
  return text ? `${path}${path.includes("?") ? "&" : "?"}${text}` : path
}

/** A random key for a request that must not be repeated if it is retried (bookings, payments). */
export const idempotencyKey = () =>
  `web-${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`

/**
 * The one way the app talks to the API. Adds the bearer token, the washman's phone id, and turns every
 * failure into an `ApiError` carrying the machine-readable `code` the API returns. A 401 on a signed-in
 * session ends the session (the token expired or was revoked).
 */
export async function api<T = unknown>(
  path: string,
  options: Options = {},
): Promise<T> {
  const session = sessionStore.get()
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  }
  if (!options.anonymous) {
    const token = options.token ?? session?.token
    if (token) headers.Authorization = `Bearer ${token}`
    if (session?.kind === "staff" && session.deviceId) {
      headers["X-Device-Id"] = session.deviceId
    }
  }

  let body: BodyInit | undefined
  if (options.form) {
    body = options.form
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`${API_URL}${withQuery(path, options.query)}`, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    })
  } catch {
    throw new ApiError(
      0,
      "network_error",
      "We could not reach Go-Wash. Check your connection and try again.",
    )
  }

  if (response.status === 204) return undefined as T

  const text = await response.text()
  let json: unknown = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // not JSON: handled below
  }

  if (!response.ok) {
    const error = (json as { error?: Record<string, unknown> } | null)?.error
    if (response.status === 401 && session && !options.token) {
      sessionStore.clear("expired")
    }
    throw new ApiError(
      response.status,
      String(error?.code ?? `http_${response.status}`),
      String(error?.message ?? "Something went wrong. Please try again."),
      (error?.details as Record<string, unknown>) ?? {},
    )
  }

  return json as T
}

/** `{ data }` envelope used by every resource response. */
export type One<T> = { data: T }
/** A cursor page: `meta.next_cursor` is null on the last page. */
export type Page<T> = { data: T[]; meta: { next_cursor: string | null } }
