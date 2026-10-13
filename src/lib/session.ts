/**
 * Who is signed in. One session at a time: signing in as someone else replaces it. The token lives in
 * localStorage (the API uses bearer tokens, not cookies); `useSession` re-renders when it changes,
 * including in other tabs.
 */
export type SessionKind = "customer" | "staff" | "admin" | "applicant"

export type SessionUser = {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  staff_code?: string | null
  roles?: string[]
}

export type Session = {
  token: string
  kind: SessionKind
  user: SessionUser
  /** A washman's phone id, sent on every /staff call. Stable per browser. */
  deviceId?: string
}

const KEY = "gowash.session"
const DEVICE_KEY = "gowash.device"

let cached: Session | null | undefined
const listeners = new Set<() => void>()
let endedBecause: "expired" | null = null

const read = (): Session | null => {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

const emit = () => listeners.forEach((listener) => listener())

/** A phone id for this browser, created once. The API binds a washman to the first one it sees. */
export const deviceId = (): string => {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id = `web-${crypto.randomUUID()}`
      window.localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return "web-unknown-device"
  }
}

export const sessionStore = {
  get(): Session | null {
    if (typeof window === "undefined") return null
    if (cached === undefined) cached = read()
    return cached
  },
  set(session: Session) {
    cached = session
    endedBecause = null
    try {
      window.localStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      // private mode: the session lasts until the tab closes
    }
    emit()
  },
  /** Updates the stored name/email after a profile change, keeping the token. */
  patchUser(user: Partial<SessionUser>) {
    const current = sessionStore.get()
    if (current) sessionStore.set({ ...current, user: { ...current.user, ...user } })
  },
  clear(reason?: "expired") {
    cached = null
    endedBecause = reason ?? null
    try {
      window.localStorage.removeItem(KEY)
    } catch {
      // nothing to remove
    }
    emit()
  },
  endedBecause: () => endedBecause,
  subscribe(listener: () => void) {
    listeners.add(listener)
    const onStorage = (event: StorageEvent) => {
      if (event.key === KEY) {
        cached = read()
        listener()
      }
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(listener)
      window.removeEventListener("storage", onStorage)
    }
  },
}
