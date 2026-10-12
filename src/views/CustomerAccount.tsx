import { useCallback, useEffect, useRef, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import Brand from "../components/Brand"
import Button from "../components/ui/Button"
import Heading from "../components/ui/Typography"
import { Icon, type IconName } from "../components/Visuals"
import useSession from "../hooks/useSession"
import { supabase } from "../lib/supabase"
import { loadCustomerRecords, type CustomerRecords } from "../lib/customerApi"
import VehiclesPanel, { type SaveAction } from "./customer/VehiclesPanel"
import LocationsPanel from "./customer/LocationsPanel"
import BookingsPanel from "./customer/BookingsPanel"
import SupportPanel from "./customer/SupportPanel"
import BillingPanel from "./customer/BillingPanel"

const tabs: {
  label: string
  icon: IconName
}[] = [
  { label: "Bookings", icon: "calendar" },
  { label: "Vehicles", icon: "car" },
  { label: "Locations", icon: "pin" },
  { label: "Support", icon: "help" },
  { label: "Billing & plans", icon: "card" },
]

export default function CustomerAccount({
  navigate,
}: {
  navigate: (route: string) => void
}) {
  const { session, loading, error } = useSession()
  const [signoutError, setSignoutError] = useState("")
  return (
    <div className="min-h-dvh text-base leading-relaxed [&_label]:text-sm [&_input]:text-base [&_select]:text-base [&_textarea]:text-base [&_.primary]:text-sm [&_.secondary]:text-sm [&_.policy-note]:text-sm! [&_.status-badge]:text-xs [&_h2]:text-xl [&_h3]:text-lg">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--line) bg-white px-5 py-6 md:px-10">
        <Brand onClick={() => navigate("home")} />
        <div className="flex items-center gap-4">
          <span className="hidden text-(--muted) md:block">
            Your personal account
          </span>
          {session ? (
            <Button
              className="secondary"
              onClick={async () => {
                const result = await supabase!.auth.signOut()
                if (result.error) setSignoutError(result.error.message)
                else navigate("auth/login")
              }}
            >
              Sign out
            </Button>
          ) : (
            <Button className="secondary" onClick={() => navigate("home")}>
              Back to home
            </Button>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-10">
        {signoutError && (
          <p className="form-error" role="alert">
            {signoutError}
          </p>
        )}
        {loading ? (
          <p role="status">Restoring your account…</p>
        ) : session ? (
          <AccountRecords key={session.user.id} session={session} />
        ) : (
          <section className="content-panel">
            <Heading level={1}>Your care, in one place.</Heading>
            <p className="my-6">
              Sign in to save vehicles, outdoor locations, booking requests and
              support tickets. Demonstration workspaces do not access your
              account records.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button className="primary" onClick={() => navigate("auth/login")}>
              Sign in securely <Icon name="arrow" size={18} />
            </Button>
          </section>
        )}
      </main>
    </div>
  )
}

function AccountRecords({ session }: { session: Session }) {
  const [tab, setTab] = useState("Bookings")
  const [records, setRecords] = useState<CustomerRecords | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const reload = useCallback(async () => {
    const next = await loadCustomerRecords()
    setRecords(next)
  }, [])
  useEffect(() => {
    let active = true
    loadCustomerRecords()
      .then((next) => {
        if (active) setRecords(next)
      })
      .catch((error) => {
        if (active)
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load your account.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])
  const save: SaveAction = async (action, success) => {
    if (locked.current) return false
    locked.current = true
    setBusy(true)
    setError("")
    setMessage("")
    try {
      await action()
      setMessage(success)
      try {
        await reload()
      } catch {
        setError(
          "Saved successfully, but the list could not refresh. Use Refresh records; do not submit again.",
        )
      }
      return true
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to save. Please try again.",
      )
      return false
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return (
    <>
      <div className="page-heading flex-wrap gap-4">
        <div>
          <div className="eyebrow">CARE THAT MEETS YOU WHERE YOU PARK</div>
          <Heading level={1}>Your next fresh start.</Heading>
          <p className="break-all">{session.user.email}</p>
        </div>
        <Button
          className="secondary"
          disabled={busy || loading}
          onClick={async () => {
            setLoading(true)
            setError("")
            try {
              await reload()
            } catch (error) {
              setError(
                error instanceof Error ? error.message : "Unable to refresh.",
              )
            } finally {
              setLoading(false)
            }
          }}
        >
          Refresh records
        </Button>
      </div>
      <section className="mb-6 rounded-xl border border-(--line) bg-white p-6">
        <div className="flex gap-3">
          <span className="shrink-0">
            <Icon name="shield" size={24} />
          </span>
          <div>
            <Heading level={2} className="text-lg">
              Saved requests. No simulated promises.
            </Heading>
            <p className="mt-2 text-(--muted)">
              This account area uses Supabase records, not sample vehicles.
              Payments, assignment and wash evidence use server-owned workflows
              once deployed. A saved request is not a confirmed wash.
            </p>
          </div>
        </div>
      </section>
      <nav aria-label="Account sections" className="mb-6 flex flex-wrap gap-3">
        {tabs.map((item) => (
          <Button
            key={item.label}
            aria-current={tab === item.label ? "page" : undefined}
            className={tab === item.label ? "primary" : "secondary"}
            disabled={busy}
            onClick={() => {
              setTab(item.label)
              setMessage("")
            }}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
          </Button>
        ))}
      </nav>
      {error && (
        <div role="alert" className="content-panel mb-6">
          <p className="form-error">{error}</p>
        </div>
      )}
      {message && (
        <div role="status" className="content-panel mb-6">
          <p>{message}</p>
        </div>
      )}
      {loading && (
        <p role="status" className="py-6">
          Loading your records…
        </p>
      )}
      {!loading && records && (
        <div aria-busy={busy}>
          {tab === "Billing & plans" && <BillingPanel records={records} />}
          {tab === "Vehicles" && (
            <VehiclesPanel
              vehicles={records.vehicles}
              busy={busy}
              save={save}
            />
          )}
          {tab === "Locations" && (
            <LocationsPanel
              locations={records.locations}
              busy={busy}
              save={save}
            />
          )}
          {tab === "Bookings" && (
            <BookingsPanel records={records} busy={busy} save={save} />
          )}
          {tab === "Support" && (
            <SupportPanel tickets={records.tickets} busy={busy} save={save} />
          )}
        </div>
      )}
    </>
  )
}
