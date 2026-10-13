"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { Icon } from "@/components/Visuals"

type Tone = "success" | "error"
type Notify = (text: string, tone?: Tone) => void

const ToastContext = createContext<Notify>(() => {})

/** `const notify = useToast(); notify("Saved")`. One message at a time, bottom centre, like the rest of the app. */
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ text: string; tone: Tone } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback<Notify>((text, tone = "success") => {
    window.clearTimeout(timer.current)
    setToast({ text, tone })
    timer.current = window.setTimeout(() => setToast(null), tone === "error" ? 7000 : 4500)
  }, [])

  const value = useMemo(() => notify, [notify])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`toast kit-toast ${toast.tone === "error" ? "is-error" : ""}`}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <Icon name={toast.tone === "error" ? "close" : "check"} size={18} />
          {toast.text}
        </div>
      )}
    </ToastContext.Provider>
  )
}
