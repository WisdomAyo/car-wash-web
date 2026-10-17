"use client"

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"
import { Icon } from "@/components/Visuals"

export type ModalName = "booking" | "tracking" | "verdict" | "vehicle" | "support" | "notifications" | "proof" | "receipt" | "plan" | "settings"

export type ModalState = {
  name: ModalName
  /** The booking, job, vehicle, plan or receipt the modal is about. */
  id?: string
  /** Pre-selections for the booking wizard. */
  vehicleId?: string
  serviceId?: string
}

type Ui = {
  modal: ModalState | null
  openModal: (modal: ModalState | ModalName) => void
  closeModal: () => void
  notify: (text: string) => void
}

const Context = createContext<Ui | null>(null)

/** The personal space's dialogs and toast: the same modal pattern the workspace has always used. */
export const useCustomerUi = () => {
  const value = useContext(Context)
  if (!value) throw new Error("useCustomerUi must be used inside CustomerUiProvider")
  return value
}

export function CustomerUiProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [toast, setToast] = useState("")
  const timer = useRef<number | undefined>(undefined)

  const notify = useCallback((text: string) => {
    window.clearTimeout(timer.current)
    setToast(text)
    timer.current = window.setTimeout(() => setToast(""), 4500)
  }, [])
  const openModal = useCallback((next: ModalState | ModalName) => setModal(typeof next === "string" ? { name: next } : next), [])
  const closeModal = useCallback(() => setModal(null), [])
  const ui = useMemo<Ui>(() => ({ modal, openModal, closeModal, notify }), [modal, openModal, closeModal, notify])

  return (
    <Context.Provider value={ui}>
      {children}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
    </Context.Provider>
  )
}
