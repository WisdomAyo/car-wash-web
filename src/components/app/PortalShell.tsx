"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useState, type ReactNode } from "react"
import Brand from "@/components/Brand"
import SidebarControls from "@/components/SidebarControls"
import SoundToggle from "@/components/app/SoundToggle"
import { Icon, type IconName } from "@/components/Visuals"
import useDismissiblePanel from "@/hooks/useDismissiblePanel"
import useNotificationAlerts from "@/hooks/useNotificationAlerts"
import { useResource } from "@/lib/api/hooks"
import type { AppNotification } from "@/lib/api/types"
import { useSignOut } from "@/lib/auth"
import { initials } from "@/lib/format"
import type { Session } from "@/lib/session"
import { PageTransition } from "@/components/Motion"

export type NavItem = { label: string; href: string; icon: IconName; count?: number }
export type NavGroup = { label: string; items: NavItem[] }

const isActive = (pathname: string, item: NavItem, root: string) =>
  item.href === root ? pathname === root : pathname === item.href || pathname.startsWith(`${item.href}/`)

/**
 * The frame of every signed-in space: sidebar with grouped links, top bar with notifications, the account
 * at the bottom. It is the prototype's own portal layout, driven by real routes instead of in-page state.
 */
export default function PortalShell({
  session,
  title,
  subtitle,
  icon = "car",
  groups,
  root,
  notificationsPath,
  notificationsHref,
  profileHref,
  children,
  today,
  extraLabels,
}: {
  session: Session
  /** Shown in the workspace card: the organisation, "Personal account", "Operations". */
  title: string
  subtitle: string
  icon?: IconName
  groups: NavGroup[]
  /** The workspace's home route, matched exactly. */
  root: string
  notificationsPath?: string
  notificationsHref?: string
  /** Where the avatar leads (account settings). */
  profileHref?: string
  children: ReactNode
  today?: string
  /** Pages that are not in the menu (a booking wizard, a detail page) and what to call them in the breadcrumb. */
  extraLabels?: Record<string, string>
}) {
  const pathname = usePathname()
  const signOut = useSignOut()
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismissiblePanel(menuOpen, closeMenu, ".portal-sidebar")

  const notifications = useResource<AppNotification[]>(notificationsPath ?? null, undefined, {
    refetchInterval: 20_000,
    background: true,
  })
  const unread = notifications.data?.filter((n) => !n.read).length ?? 0
  useNotificationAlerts(notifications.data)

  const current =
    groups.flatMap((group) => group.items).find((item) => item.href !== root && isActive(pathname, item, root)) ??
    Object.entries(extraLabels ?? {})
      .filter(([href]) => pathname === href || pathname.startsWith(`${href}/`))
      .sort((a, b) => b[0].length - a[0].length)
      .map(([, label]) => ({ label }))[0] ??
    groups.flatMap((group) => group.items).find((item) => isActive(pathname, item, root))

  return (
    <div className="portal-shell">
      <aside
        className={`sidebar portal-sidebar ${menuOpen ? "mobile-open" : ""}`}
        id="workspace-navigation"
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen || undefined}
        aria-label="Navigation"
      >
        {menuOpen && <SidebarControls onClose={closeMenu} />}
        <Brand />
        <div className="workspace">
          <span className="workspace-icon">
            <Icon name={icon} />
          </span>
          <div>
            {title}
            <small>{subtitle}</small>
          </div>
        </div>
        {groups.map((group) => (
          <div className="portal-nav-group" key={group.label}>
            <div className="nav-label">{group.label.toUpperCase()}</div>
            <nav>
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${isActive(pathname, item, root) ? "active" : ""}`}
                  onClick={closeMenu}
                  aria-current={isActive(pathname, item, root) ? "page" : undefined}
                >
                  <Icon name={item.icon} size={18} />
                  <span>{item.label}</span>
                  {item.count ? <span className="nav-count">{item.count}</span> : null}
                </Link>
              ))}
            </nav>
          </div>
        ))}
        <div className="portal-sidebar-bottom">
          <Link className="nav-item" href="/">
            <Icon name="arrow" size={18} />
            <span>Back to website</span>
          </Link>
          <div className="user-card">
            <span className="avatar">{initials(session.user.name)}</span>
            <div>
              <strong>{session.user.name}</strong>
              <small>{subtitle}</small>
            </div>
            <button aria-label="Sign out" title="Sign out" onClick={signOut}>
              <Icon name="logout" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="workspace-navigation"
            >
              <Icon name="grid" />
            </button>
            <span>{title}</span>
            <Icon name="chevron" size={13} />
            <strong>{current?.label ?? "Overview"}</strong>
          </div>
          <div className="header-right">
            {today && (
              <span className="location-label">
                <Icon name="calendar" size={15} />
                {today}
              </span>
            )}
            {notificationsPath && <SoundToggle />}
            {notificationsHref && (
              <Link className="notification-btn" href={notificationsHref} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
                <Icon name="bell" />
                {unread > 0 && <i />}
              </Link>
            )}
            {profileHref ? (
              <Link className="avatar small" href={profileHref} aria-label="Account settings">
                {initials(session.user.name)}
              </Link>
            ) : (
              <span className="avatar small">{initials(session.user.name)}</span>
            )}
          </div>
        </header>
        <main className="portal-main">
          <PageTransition transitionKey={pathname}>{children}</PageTransition>
        </main>
      </div>
    </div>
  )
}
