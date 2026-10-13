"use client"

import type { ReactNode } from "react"
import PortalShell, { type NavGroup } from "@/components/app/PortalShell"
import { useItems } from "@/lib/api/hooks"
import type { Organisation } from "@/lib/api/types"
import { RequireSession } from "@/lib/auth"
import { longDay } from "@/lib/format"
import type { Session } from "@/lib/session"
import ConsentGate from "@/features/shared/ConsentGate"

const base = "/workspace/customer"

const groups: NavGroup[] = [
  {
    label: "Your space",
    items: [
      { label: "Overview", href: base, icon: "grid" },
      { label: "My bookings", href: `${base}/bookings`, icon: "calendar" },
      { label: "My vehicles", href: `${base}/vehicles`, icon: "car" },
      { label: "My places", href: `${base}/places`, icon: "pin" },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Receipts & refunds", href: `${base}/receipts`, icon: "receipt" },
      { label: "Subscriptions", href: `${base}/subscriptions`, icon: "card" },
      { label: "Referrals & rewards", href: `${base}/referrals`, icon: "gift" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Help & tickets", href: `${base}/help`, icon: "help" },
      { label: "Notifications", href: `${base}/notifications`, icon: "bell" },
      { label: "Settings", href: `${base}/settings`, icon: "settings" },
    ],
  },
]

/** The personal space: sign-in required, current terms accepted, then the screens below. */
export default function CustomerSpace({ children }: { children: ReactNode }) {
  return (
    <RequireSession kind="customer" loginRole="Customer">
      {(session) => <Frame session={session}>{children}</Frame>}
    </RequireSession>
  )
}

function Frame({ session, children }: { session: Session; children: ReactNode }) {
  const organisations = useItems<Organisation>("/organisations")
  // People who run a company or an estate also get a way over to its portal.
  const portals: NavGroup[] = organisations.items
    .filter((o) => o.my_role && o.my_role !== "resident")
    .map((o) => ({
      label: "Your organisation",
      items: [{ label: o.name, href: `/workspace/${o.type}`, icon: o.type === "estate" ? ("pin" as const) : ("building" as const) }],
    }))
  const navGroups = portals.length ? [...groups, { label: "Your organisation", items: portals.flatMap((p) => p.items) }] : groups

  return (
    <PortalShell
      session={session}
      title="Personal account"
      subtitle="Your everyday, elevated"
      icon="car"
      groups={navGroups}
      root={base}
      notificationsPath="/notifications"
      notificationsHref={`${base}/notifications`}
      profileHref={`${base}/settings`}
      extraLabels={{ [`${base}/book`]: "Book a wash" }}
      today={longDay(new Date()).replace(/^\w+, /, "")}
    >
      <ConsentGate path="/consents">{children}</ConsentGate>
    </PortalShell>
  )
}
