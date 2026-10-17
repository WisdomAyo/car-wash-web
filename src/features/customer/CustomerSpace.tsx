"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useState, type ReactNode } from "react"
import { PageTransition } from "@/components/Motion"
import SidebarControls from "@/components/SidebarControls"
import SoundToggle from "@/components/app/SoundToggle"
import { Icon, type IconName } from "@/components/Visuals"
import useDismissiblePanel from "@/hooks/useDismissiblePanel"
import useNotificationAlerts from "@/hooks/useNotificationAlerts"
import { useItems, useResource } from "@/lib/api/hooks"
import type { AppNotification, Booking, Organisation, User } from "@/lib/api/types"
import { RequireSession } from "@/lib/auth"
import { initials } from "@/lib/format"
import type { Session } from "@/lib/session"
import ConsentGate from "@/features/shared/ConsentGate"
import { CustomerUiProvider, useCustomerUi } from "./CustomerUi"
import Modals from "./Modals"

const base = "/workspace/customer"

type NavItem = { label: string; href: string; icon: IconName; section?: string }

/** The original six, then the screens that grew out of the real service. */
const nav: NavItem[] = [
  { label: "Overview", href: base, icon: "grid" },
  { label: "My vehicles", href: `${base}/vehicles`, icon: "car" },
  { label: "My bookings", href: `${base}/bookings`, icon: "calendar" },
  { label: "Wash Passport", href: `${base}/passport`, icon: "shield" },
  { label: "Subscriptions", href: `${base}/subscriptions`, icon: "card" },
  { label: "Referrals & rewards", href: `${base}/referrals`, icon: "gift" },
]

const more: NavItem[] = [
  { label: "My places", href: `${base}/places`, icon: "pin" },
  { label: "Receipts & refunds", href: `${base}/receipts`, icon: "receipt" },
  { label: "Help & tickets", href: `${base}/help`, icon: "help" },
  { label: "Settings", href: `${base}/settings`, icon: "settings" },
]

const isActive = (pathname: string, item: NavItem) =>
  item.href === base ? pathname === base || pathname === `${base}/book` : pathname === item.href || pathname.startsWith(`${item.href}/`)

/** The personal space: sign-in required, current terms accepted, then the screens. */
export default function CustomerSpace({ children }: { children: ReactNode }) {
  return (
    <RequireSession kind="customer" loginRole="Customer">
      {(session) => (
        <CustomerUiProvider>
          <Shell session={session}>
            <ConsentGate path="/consents">{children}</ConsentGate>
          </Shell>
        </CustomerUiProvider>
      )}
    </RequireSession>
  )
}

function Shell({ session, children }: { session: Session; children: ReactNode }) {
  const pathname = usePathname()
  const ui = useCustomerUi()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismissiblePanel(menuOpen, closeMenu, ".app-shell .sidebar")

  const me = useResource<User>("/me")
  const notifications = useResource<AppNotification[]>("/notifications", undefined, { refetchInterval: 20_000, background: true })
  useNotificationAlerts(notifications.data)
  const bookings = useResource<Booking[]>("/bookings")
  const organisations = useItems<Organisation>("/organisations")
  const unread = notifications.data?.some((n) => !n.read) ?? false
  const upcoming = bookings.data?.filter((b) => b.status === "confirmed" && !["closed", "cancelled"].includes(b.job?.state ?? "")).length ?? 0
  const name = me.data?.name ?? session.user.name
  const portals = organisations.items.filter((o) => o.my_role && o.my_role !== "resident")
  const current = [...nav, ...more].find((item) => isActive(pathname, item))

  const link = (item: NavItem, extra?: ReactNode) => (
    <Link key={item.href} href={item.href} className={`nav-item ${isActive(pathname, item) ? "active" : ""}`} onClick={closeMenu} aria-current={isActive(pathname, item) ? "page" : undefined}>
      <Icon name={item.icon} />
      <span>{item.label}</span>
      {extra}
    </Link>
  )

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "mobile-open" : ""}`} id="customer-navigation" role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label="Customer navigation">
        {menuOpen && <SidebarControls onClose={closeMenu} />}
        <Link href="/" className="brand link-btn" aria-label="Go-Wash home">
          <span className="brand-symbol">
            <Icon name="drop" size={24} />
          </span>
          go<span className="brand-dash">-</span>wash
          <span className="brand-dot">.</span>
        </Link>
        <div className="workspace">
          <span className="workspace-icon">
            <Icon name="car" />
          </span>
          <div>
            Personal account<small>Your everyday, elevated</small>
          </div>
          <Icon name="chevron" size={15} />
        </div>
        <div className="nav-label">YOUR SPACE</div>
        <nav>{nav.map((item) => link(item, item.label === "My bookings" && upcoming > 0 ? <span className="nav-count">{upcoming}</span> : null))}</nav>
        <div className="nav-label">MORE</div>
        <nav>{more.filter((m) => m.label !== "Settings").map((item) => link(item))}</nav>
        {portals.length > 0 && (
          <>
            <div className="nav-label">YOUR ORGANISATION</div>
            <nav>
              {portals.map((o) => (
                <Link key={o.id} href={`/workspace/${o.type}`} className="nav-item" onClick={closeMenu}>
                  <Icon name={o.type === "estate" ? "pin" : "building"} />
                  <span>{o.name}</span>
                </Link>
              ))}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-bubble">
              <Icon name="help" size={23} />
            </span>
            <h4>A little help?</h4>
            <p>Real people. Ready to help.</p>
            <button onClick={() => ui.openModal("support")}>
              Talk to us <Icon name="arrow" size={16} />
            </button>
          </div>
          <button className="nav-item" onClick={() => ui.openModal("settings")}>
            <Icon name="help" />
            <span>Help & settings</span>
          </button>
          <div className="user-card">
            <div className="avatar">{initials(name)}</div>
            <div>
              <strong>{name}</strong>
              <small>Personal account</small>
            </div>
            <button aria-label="Open account settings" onClick={() => ui.openModal("settings")}>
              <Icon name="chevron" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation" aria-expanded={menuOpen} aria-controls="customer-navigation">
              <Icon name="grid" />
            </button>
            <span>My space</span>
            <Icon name="chevron" size={13} />
            <strong>{current?.label ?? "Overview"}</strong>
          </div>
          <div className="header-right">
            <span className="location-label">
              <Icon name="pin" size={16} /> Lagos, Nigeria
            </span>
            <span className="header-divider" />
            <SoundToggle />
            <button className="notification-btn" aria-label={`Notifications${unread ? ", unread" : ""}`} onClick={() => ui.openModal("notifications")}>
              <Icon name="bell" />
              {unread && <i />}
            </button>
            <button className="avatar small" onClick={() => ui.openModal("settings")} aria-label="Account settings">
              {initials(name)}
            </button>
          </div>
        </header>
        <main>
          <PageTransition transitionKey={pathname}>
            {children}
            <footer>
              <span>
                go-wash <b>·</b> Your vehicle. Our responsibility.
              </span>
              <span>
                <Icon name="shield" size={13} /> Clean, proven, calm. <b>·</b> Made for Nigeria.
              </span>
            </footer>
          </PageTransition>
        </main>
      </div>
      <Modals />
    </div>
  )
}
