"use client"

import { useCallback, useState } from "react"
import { usePathname } from "next/navigation"
import Brand from "@/components/Brand"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import {
  audienceByPath,
  publicLinks,
} from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"
import PublicSidebar from "./PublicSidebar"

/** Site header. Client-side only for the active-link highlight and the mobile menu. */
export default function PublicHeader() {
  const pathname = usePathname()
  const role = audienceByPath[pathname] ?? "Customer"
  const [menu, setMenu] = useState(false)
  const [menuPath, setMenuPath] = useState(pathname)
  // Close the mobile menu whenever the route changes (the header persists across pages).
  if (menuPath !== pathname) {
    setMenuPath(pathname)
    setMenu(false)
  }
  const closeMenu = useCallback(() => setMenu(false), [])

  return (
    <>
      <header className="public-header">
        <Brand />
        <nav className="public-nav" aria-label="Public navigation">
          {publicLinks.map(({ href, label }) => (
            <ButtonLink
              key={href}
              href={href}
              className={pathname === href ? "current" : ""}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
            </ButtonLink>
          ))}
        </nav>
        <div className="public-header-actions">
          <ButtonLink className="public-login" href={authHref("login", role)}>
            Log in
            <Icon name="arrow" size={14} />
          </ButtonLink>
          <ButtonLink
            className="primary"
            href={authHref(role === "Super admin" ? "login" : "register", role)}
          >
            {role === "Customer"
              ? "Book a wash"
              : role === "Super admin"
                ? "Staff access"
                : "Get started"}
          </ButtonLink>
          <Button
            className="public-menu"
            aria-expanded={menu}
            aria-label="Toggle menu"
            onClick={() => setMenu(!menu)}
          >
            <Icon name={menu ? "close" : "grid"} />
          </Button>
        </div>
      </header>
      {menu && (
        <PublicSidebar pathname={pathname} role={role} onClose={closeMenu} />
      )}
    </>
  )
}
