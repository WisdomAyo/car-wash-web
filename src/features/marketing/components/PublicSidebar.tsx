"use client"

import Brand from "@/components/Brand"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import useDismissiblePanel from "@/hooks/useDismissiblePanel"
import { publicLinks } from "@/features/marketing/content/publicContent"
import { authHref, type Role } from "@/lib/roles"

export default function PublicSidebar({
  pathname,
  role,
  onClose,
}: {
  pathname: string
  role: Role
  onClose: () => void
}) {
  useDismissiblePanel(true, onClose, ".public-sidebar")
  return (
    <div className="public-sidebar-layer">
      <Button
        className="public-sidebar-scrim"
        aria-label="Close navigation"
        onClick={onClose}
        tabIndex={-1}
      />
      <aside
        className="public-sidebar"
        role="dialog"
        aria-modal="true"
        aria-label="Go-Wash navigation"
      >
        <div className="sidebar-brand-row">
          <Brand onClick={onClose} />
          <Button
            className="panel-icon-button"
            aria-label="Close menu"
            onClick={onClose}
          >
            <Icon name="close" />
          </Button>
        </div>
        <div className="sidebar-intro">
          <span className="eyebrow">CARE THAT COMES TO YOU</span>
          <Heading level={3}>
            A little more shine.
            <br />A little less effort.
          </Heading>
        </div>
        <nav aria-label="Mobile navigation">
          {publicLinks.map(({ href, label }, index) => (
            <ButtonLink
              key={href}
              href={href}
              className={`sidebar-route ${pathname === href ? "selected" : ""}`}
              aria-current={pathname === href ? "page" : undefined}
              onClick={onClose}
            >
              <span className="sidebar-route-index">0{index + 1}</span>
              {label}
              <Icon name="arrow" size={18} />
            </ButtonLink>
          ))}
        </nav>
        <div className="sidebar-care-note">
          <Icon name="shield" />
          <p>
            At home or at work.
            <br />
            <strong>Made for Nigeria.</strong>
          </p>
        </div>
        <ButtonLink
          className="primary full"
          href={authHref("register", role)}
          onClick={onClose}
        >
          Get started <Icon name="arrow" size={18} />
        </ButtonLink>
        <ButtonLink
          className="sidebar-contact"
          href="/contact"
          onClick={onClose}
        >
          Need a hand? Talk to our team
        </ButtonLink>
      </aside>
    </div>
  )
}
