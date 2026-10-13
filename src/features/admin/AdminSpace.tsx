"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import PortalShell, { type NavGroup } from "@/components/app/PortalShell"
import { ErrorBox, Loading } from "@/components/app/kit"
import { useItems, useResource } from "@/lib/api/hooks"
import type { RoleInfo, User } from "@/lib/api/types"
import { RequireSession } from "@/lib/auth"
import { humanise, longDay } from "@/lib/format"
import type { Session } from "@/lib/session"

export const base = "/workspace/admin"

type AdminContext = { role: string; can: (permission: string) => boolean }
const Context = createContext<AdminContext>({ role: "", can: () => false })

/** Who is signed in as an admin and what that role may do (the same matrix the API enforces). */
export const useAdmin = () => useContext(Context)

type Entry = { label: string; href: string; icon: NavGroup["items"][number]["icon"]; permission: string }

const MENU: { label: string; items: Entry[] }[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: base, icon: "grid", permission: "jobs.view" },
      { label: "Exceptions", href: `${base}/exceptions`, icon: "alert", permission: "jobs.view" },
      { label: "Jobs", href: `${base}/jobs`, icon: "drop", permission: "jobs.view" },
      { label: "Planning", href: `${base}/planning`, icon: "calendar", permission: "jobs.view" },
      { label: "Live map", href: `${base}/live-map`, icon: "map", permission: "map.view" },
      { label: "Estate runs", href: `${base}/estate-runs`, icon: "building", permission: "jobs.view" },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Washmen", href: `${base}/staff`, icon: "users", permission: "staff.view" },
      { label: "Customers", href: `${base}/customers`, icon: "user", permission: "customers.view" },
      { label: "Vehicles", href: `${base}/vehicles`, icon: "car", permission: "customers.view" },
      { label: "Organisations", href: `${base}/organisations`, icon: "building", permission: "orgs.manage" },
    ],
  },
  {
    label: "Support",
    items: [
      { label: "Tickets", href: `${base}/tickets`, icon: "help", permission: "tickets.view" },
      { label: "Inbox", href: `${base}/inbox`, icon: "inbox", permission: "tickets.view" },
      { label: "Estate requests", href: `${base}/window-requests`, icon: "clock", permission: "orgs.manage" },
      { label: "Data requests", href: `${base}/data-requests`, icon: "lock", permission: "data_requests.manage" },
      { label: "Help & assistant", href: `${base}/knowledge`, icon: "book", permission: "knowledge.manage" },
    ],
  },
  {
    label: "Money",
    items: [
      { label: "Finance", href: `${base}/finance`, icon: "chart", permission: "reports.view" },
      { label: "Payments", href: `${base}/payments`, icon: "card", permission: "payments.view" },
      { label: "Refunds", href: `${base}/refunds`, icon: "receipt", permission: "payments.view" },
      { label: "Invoices", href: `${base}/invoices`, icon: "file", permission: "payments.view" },
      { label: "Referral rewards", href: `${base}/referrals`, icon: "gift", permission: "customers.view" },
    ],
  },
  {
    label: "Setup",
    items: [
      { label: "Services & prices", href: `${base}/services`, icon: "tool", permission: "config.manage" },
      { label: "Subscription plans", href: `${base}/plans`, icon: "card", permission: "config.manage" },
      { label: "Coverage", href: `${base}/coverage`, icon: "pin", permission: "locations.manage" },
      { label: "Settings", href: `${base}/settings`, icon: "settings", permission: "config.manage" },
      { label: "Audit log", href: `${base}/audit`, icon: "list", permission: "audit.view" },
      { label: "Admin accounts", href: `${base}/accounts`, icon: "lock", permission: "admin_users.manage" },
    ],
  },
]

/** The operations space for every admin role: the menu shows only what the signed-in role may use. */
export default function AdminSpace({ children }: { children: ReactNode }) {
  return (
    <RequireSession kind="admin" loginRole="Super admin">
      {(session) => <Frame session={session}>{children}</Frame>}
    </RequireSession>
  )
}

function Frame({ session, children }: { session: Session; children: ReactNode }) {
  const me = useResource<User>("/me")
  const roles = useItems<RoleInfo>("/admin/roles")

  if (me.isPending || roles.isPending) return <Loading label="Opening operations…" />
  if (me.isError || roles.isError) return <ErrorBox error={me.error ?? roles.error} retry={() => { void me.refetch(); void roles.refetch() }} />

  const role = me.data.roles.find((r) => roles.items.some((x) => x.role === r)) ?? ""
  const granted = new Set(roles.items.find((r) => r.role === role)?.permissions.map((p) => p.key))
  return <Shell session={session} role={role} granted={granted}>{children}</Shell>
}

function Shell({ session, role, granted, children }: { session: Session; role: string; granted: Set<string>; children: ReactNode }) {
  const value = useMemo<AdminContext>(() => ({ role, can: (permission) => granted.has(permission) }), [role, granted])
  const groups: NavGroup[] = MENU.map((group) => ({
    label: group.label,
    items: group.items.filter((item) => granted.has(item.permission)).map((item) => ({ label: item.label, href: item.href, icon: item.icon })),
  })).filter((group) => group.items.length > 0)

  return (
    <Context.Provider value={value}>
      <PortalShell
        session={session}
        title="Go-Wash operations"
        subtitle={humanise(role)}
        icon="shield"
        groups={groups}
        root={base}
        profileHref={`${base}/security`}
        today={longDay(new Date()).replace(/^\w+, /, "")}
        extraLabels={{ [`${base}/security`]: "My security" }}
      >
        {children}
      </PortalShell>
    </Context.Provider>
  )
}
