import { useCallback } from "react"
import Brand from "../Brand"
import Button from "../ui/Button"
import Heading from "../ui/Typography"
import { Icon } from "../Visuals"
import useDismissiblePanel from "../../hooks/useDismissiblePanel"
import { publicLinks, type Navigate } from "../../domain/publicContent"
import type { Role } from "../../domain/roles"

export default function PublicSidebar({
  page,
  navigate,
  role,
  onClose,
}: {
  page: string
  navigate: Navigate
  role: Role
  onClose: () => void
}) {
  const close = useCallback(onClose, [onClose])
  useDismissiblePanel(true, close, ".public-sidebar")
  const go = (route: string) => {
    onClose()
    navigate(route, role)
  }
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
          <Brand onClick={() => go("home")} />
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
          {publicLinks.map(([url, label], index) => (
            <Button
              key={url}
              className={`sidebar-route ${page === url ? "selected" : ""}`}
              aria-current={page === url ? "page" : undefined}
              onClick={() => go(url)}
            >
              <span className="sidebar-route-index">0{index + 1}</span>
              {label}
              <Icon name="arrow" size={18} />
            </Button>
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
        <Button className="primary full" onClick={() => go("auth/register")}>
          Get started <Icon name="arrow" size={18} />
        </Button>
        <Button className="sidebar-contact" onClick={() => go("contact")}>
          Need a hand? Talk to our team
        </Button>
      </aside>
    </div>
  )
}
