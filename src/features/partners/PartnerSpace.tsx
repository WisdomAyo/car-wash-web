"use client"

import { createContext, useContext, type ReactNode } from "react"
import PortalShell, { type NavGroup } from "@/components/app/PortalShell"
import { Empty, ErrorBox, Loading } from "@/components/app/kit"
import ButtonLink from "@/components/ui/ButtonLink"
import { useItems } from "@/lib/api/hooks"
import type { Organisation } from "@/lib/api/types"
import { RequireSession } from "@/lib/auth"
import { longDay } from "@/lib/format"
import ConsentGate from "@/features/shared/ConsentGate"

export type PartnerKind = "corporate" | "estate"

type PartnerContext = { org: Organisation; base: string; role: NonNullable<Organisation["my_role"]>; manages: boolean }
const Context = createContext<PartnerContext | null>(null)

/** The organisation this portal is open on, and what the signed-in person is in it. */
export const usePartner = () => {
  const value = useContext(Context)
  if (!value) throw new Error("usePartner must be used inside PartnerSpace")
  return value
}

const menus = (kind: PartnerKind, base: string, manages: boolean): NavGroup[] =>
  kind === "corporate"
    ? [
        {
          label: "Your fleet",
          items: [
            { label: "Fleet overview", href: base, icon: "grid" },
            { label: "Vehicles", href: `${base}/vehicles`, icon: "car" },
            { label: "Wash schedule", href: `${base}/bookings`, icon: "calendar" },
            { label: "Active washes", href: `${base}/jobs`, icon: "drop" },
          ],
        },
        {
          label: "Your organisation",
          items: [
            ...(manages ? [{ label: "Team & confirmers", href: `${base}/team`, icon: "users" as const }] : []),
            { label: "Plan & invoices", href: `${base}/invoices`, icon: "card" as const },
            { label: "Reports", href: `${base}/reports`, icon: "chart" as const },
            { label: "Report an incident", href: `${base}/incidents`, icon: "alert" as const },
            ...(manages ? [{ label: "Account settings", href: `${base}/settings`, icon: "settings" as const }] : []),
          ],
        },
      ]
    : [
        {
          label: "Your estate",
          items: [
            { label: "Estate overview", href: base, icon: "grid" },
            { label: "Wash windows", href: `${base}/windows`, icon: "clock" },
            { label: "Approved spots", href: `${base}/spots`, icon: "pin" },
            { label: "On-site team", href: `${base}/on-site`, icon: "users" },
          ],
        },
        {
          label: "Your community",
          items: [
            { label: "Resident access", href: `${base}/access`, icon: "copy" },
            { label: "Incidents", href: `${base}/incidents`, icon: "alert" },
            { label: "Monthly report", href: `${base}/reports`, icon: "chart" },
            ...(manages ? [{ label: "Estate settings", href: `${base}/settings`, icon: "settings" as const }] : []),
          ],
        },
      ]

/** A company or estate portal: signed-in members only, on the organisation they belong to. */
export default function PartnerSpace({ kind, children }: { kind: PartnerKind; children: ReactNode }) {
  return (
    <RequireSession kind="customer" loginRole={kind === "corporate" ? "Corporate" : "Estate"}>
      {(session) => <Frame kind={kind} session={session}>{children}</Frame>}
    </RequireSession>
  )
}

function Frame({ kind, session, children }: { kind: PartnerKind; session: Parameters<typeof PortalShell>[0]["session"]; children: ReactNode }) {
  const orgs = useItems<Organisation>("/organisations")
  const base = `/workspace/${kind}`

  if (orgs.isPending) return <Loading label="Opening your portal…" />
  if (orgs.isError) return <ErrorBox error={orgs.error} retry={() => orgs.refetch()} />

  const org = orgs.items.find((o) => o.type === kind && o.my_role && o.my_role !== "resident")
  if (!org) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeContent: "center", padding: 24 }}>
        <Empty icon="building" title={`No ${kind === "corporate" ? "company" : "estate"} account is linked to this login.`} action={<ButtonLink className="primary" href="/workspace/customer">Go to my personal space</ButtonLink>}>
          Company and estate accounts are set up by Go-Wash and the owner is invited by email. If you expected one, ask the team.
        </Empty>
      </div>
    )
  }

  const role = org.my_role!
  const manages = role === "owner" || role === "manager"
  return (
    <Context.Provider value={{ org, base, role, manages }}>
      <PortalShell
        session={session}
        title={org.name}
        subtitle={`${kind === "corporate" ? "Corporate" : "Estate"} portal · ${role}`}
        icon={kind === "corporate" ? "car" : "pin"}
        groups={menus(kind, base, manages)}
        root={base}
        notificationsPath="/notifications"
        notificationsHref="/workspace/customer/notifications"
        profileHref="/workspace/customer/settings"
        today={longDay(new Date()).replace(/^\w+, /, "")}
      >
        <ConsentGate path="/consents">{children}</ConsentGate>
      </PortalShell>
    </Context.Provider>
  )
}
