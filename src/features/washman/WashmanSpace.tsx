"use client"

import type { ReactNode } from "react"
import PortalShell, { type NavGroup } from "@/components/app/PortalShell"
import { RequireSession } from "@/lib/auth"
import { longDay } from "@/lib/format"
import ConsentGate from "@/features/shared/ConsentGate"

export const base = "/workspace/washman"

const groups: NavGroup[] = [
  {
    label: "My day",
    items: [
      { label: "Today", href: base, icon: "grid" },
      { label: "My jobs", href: `${base}/jobs`, icon: "calendar" },
    ],
  },
  {
    label: "Me",
    items: [
      { label: "My profile", href: `${base}/profile`, icon: "user" },
      { label: "Notifications", href: `${base}/notifications`, icon: "bell" },
    ],
  },
]

/** The washman's space: sign-in with staff code + PIN on the registered phone, then the day's work. */
export default function WashmanSpace({ children }: { children: ReactNode }) {
  return (
    <RequireSession kind="staff" loginRole="Washman">
      {(session) => (
        <PortalShell
          session={session}
          title="Go-Wash field team"
          subtitle={session.user.staff_code ?? "Washman"}
          icon="drop"
          groups={groups}
          root={base}
          notificationsPath="/staff/notifications"
          notificationsHref={`${base}/notifications`}
          profileHref={`${base}/profile`}
          extraLabels={{ [`${base}/jobs`]: "My jobs" }}
          today={longDay(new Date()).replace(/^\w+, /, "")}
        >
          <ConsentGate path="/staff/consents">{children}</ConsentGate>
        </PortalShell>
      )}
    </RequireSession>
  )
}
