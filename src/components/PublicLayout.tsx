import { useCallback, useState, type ReactNode } from "react"
import PublicSidebar from "./navigation/PublicSidebar"
import Brand from "./Brand"
import Button from "./ui/Button"
import Heading from "./ui/Typography"
import { Icon } from "./Visuals"
import { publicLinks, type Navigate } from "../domain/publicContent"
import type { Role } from "../domain/roles"

export default function PublicLayout({
  page,
  navigate,
  role = "Customer",
  children,
}: {
  page: string
  navigate: Navigate
  role?: Role
  children: ReactNode
}) {
  const [menu, setMenu] = useState(false)
  const closeMenu = useCallback(() => setMenu(false), [])
  return (
    <div className="public-site editorial-site">
      <div className="announcement">
        <Icon name="shield" size={13} />
        Your vehicle. Our responsibility.<span>Made for Nigeria.</span>
      </div>
      <header className="public-header">
        <Brand onClick={() => navigate("home")} />
        <nav className="public-nav" aria-label="Public navigation">
          {publicLinks.map(([url, label]) => (
            <Button
              key={url}
              className={page === url ? "current" : ""}
              aria-current={page === url ? "page" : undefined}
              onClick={() => {
                navigate(url)
                setMenu(false)
              }}
            >
              {label}
            </Button>
          ))}
        </nav>
        <div className="public-header-actions">
          <Button
            className="public-login"
            onClick={() => navigate("auth/login", role)}
          >
            Log in
            <Icon name="arrow" size={14} />
          </Button>
          <Button
            className="primary"
            onClick={() =>
              navigate(
                role === "Super admin" ? "auth/login" : "auth/register",
                role,
              )
            }
          >
            {role === "Customer"
              ? "Book a wash"
              : role === "Super admin"
                ? "Staff access"
                : "Get started"}
          </Button>
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
        <PublicSidebar
          page={page}
          navigate={navigate}
          role={role}
          onClose={closeMenu}
        />
      )}
      <main className="public-main">
        {children}
        <ExplorePages navigate={navigate} />
      </main>
      <footer className="editorial-footer">
        <div>
          <Brand onClick={() => navigate("home")} />
          <p>
            Your vehicle. Our responsibility.
            <br />A fresher way to move across Nigeria.
          </p>
          <small>Interactive prototype · Not a live service.</small>
        </div>
        <div>
          <Heading level={4}>Your kind of care</Heading>
          {publicLinks.slice(0, 4).map(([url, label]) => (
            <Button key={url} onClick={() => navigate(url)}>
              {label}
            </Button>
          ))}
        </div>
        <div>
          <Heading level={4}>A little clarity</Heading>
          {[
            ["services", "Services & pricing"],
            ["coverage", "Where we wash"],
            ["trust", "Our trust standard"],
            ["journal", "The Care Journal"],
          ].map(([url, label]) => (
            <Button key={url} onClick={() => navigate(url)}>
              {label}
            </Button>
          ))}
        </div>
        <div>
          <Heading level={4}>Go-Wash</Heading>
          {[
            ["contact", "Talk to our team"],
            ["operations", "Operations home"],
            ["privacy", "Privacy & data"],
            ["terms", "Service terms"],
          ].map(([url, label]) => (
            <Button key={url} onClick={() => navigate(url)}>
              {label}
            </Button>
          ))}
        </div>
      </footer>
    </div>
  )
}

export function ExplorePages({ navigate }: { navigate: Navigate }) {
  return (
    <section className="explore-editorial">
      <div>
        <div className="eyebrow">THERE'S MORE TO GOOD CARE</div>
        <Heading>Get to know your Go-Wash.</Heading>
      </div>
      <div className="editorial-link-grid">
        {[
          [
            "services",
            "drop",
            "Find your kind of clean",
            "Explore services & pricing",
          ],
          ["coverage", "pin", "Care across Nigeria", "See where we wash"],
          [
            "trust",
            "shield",
            "Nothing left to guesswork",
            "Inside the trust standard",
          ],
          [
            "journal",
            "star",
            "A little everyday inspiration",
            "Read the Care Journal",
          ],
        ].map(([url, icon, title, label]) => (
          <Button key={url} onClick={() => navigate(url)}>
            <Icon name={icon as "drop"} size={24} />
            <strong>{title}</strong>
            <span>
              {label}
              <Icon name="arrow" size={15} />
            </span>
          </Button>
        ))}
      </div>
    </section>
  )
}
