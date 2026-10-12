import { lazy, Suspense, useEffect, useState } from "react"
import { Icon } from "./components/Visuals"
import Button from "./components/ui/Button"
import {
  roles,
  operationsRoles,
  workspaceRoute,
  type Role,
} from "./domain/roles"
import Auth from "./views/Auth"
import Confirmer from "./views/Confirmer"
import CustomerHome from "./views/home/CustomerHome"
import PageErrorBoundary from "./components/PageErrorBoundary"
import MotionProvider, { PageTransition } from "./components/Motion"
import "./motion.css"
import "./experience.css"
import "./public-pages.css"
import "./homepages.css"
import "./readability.css"
import "./components/home/lagos-hero.css"
import "./components/home/lagos-film.css"
import "./responsive.css"
import CustomerChat from "./components/support/CustomerChat"
import ProtectedWorkspace from "./components/ProtectedWorkspace"
import "./interactions.css"

const CustomerApp = lazy(() => import("./App"))
const CustomerAccount = lazy(() => import("./views/CustomerAccount"))
const Portal = lazy(() => import("./components/Portal"))
const LiveOperations = lazy(() => import("./views/LiveOperations"))
const CarePages = lazy(() => import("./views/CarePages"))
const BusinessHome = lazy(() => import("./views/home/BusinessHome"))
const EstateHome = lazy(() => import("./views/home/EstateHome"))
const CareersHome = lazy(() => import("./views/home/CareersHome"))
const OperationsHome = lazy(() => import("./views/home/OperationsHome"))
const ContactPage = lazy(() => import("./views/public/ContactPage"))
const PrivacyPage = lazy(() => import("./views/public/PrivacyPage"))
const TermsPage = lazy(() => import("./views/public/TermsPage"))
const homePages = {
  home: CustomerHome,
  business: BusinessHome,
  estates: EstateHome,
  careers: CareersHome,
  operations: OperationsHome,
  contact: ContactPage,
  privacy: PrivacyPage,
  terms: TermsPage,
}

function initialRoute() {
  return window.location.hash.slice(1) || "home"
}
export default function Experience() {
  const [route, setRoute] = useState(initialRoute)
  const [role, setRole] = useState<Role>("Customer")
  const [explorer, setExplorer] = useState(false)
  useEffect(() => {
    const label =
      route === "home"
        ? "Mobile car care across Nigeria"
        : route.replace(/[/-]/g, " ")
    document.title = `Go-Wash · ${label}`
  }, [route])
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExplorer(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [])
  const navigate = (next: string, nextRole?: Role) => {
    setExplorer(false)
    if (nextRole) setRole(nextRole)
    window.location.hash = next
    setRoute(next)
    window.scrollTo(0, 0)
  }
  useEffect(() => {
    const onHash = () => {
      setRoute(initialRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])
  const roleFromRoute = [...roles, ...operationsRoles].find(
    (r) => route === workspaceRoute(r),
  )
  const activeRole = roleFromRoute || role
  const workspace = (r: Role) => navigate(workspaceRoute(r), r)
  const HomePage = homePages[(route as keyof typeof homePages)] || CustomerHome
  return (
    <MotionProvider>
      <PageTransition transitionKey={route}>
        <PageErrorBoundary key={route}>
          <Suspense
            fallback={
              <div className="workspace-loading">
                <Icon name="drop" size={35} />
                <h2>A little clarity is on its way.</h2>
                <p>Opening your Go-Wash workspace…</p>
              </div>
            }
          >
            {route === "account" ? (
              <CustomerAccount navigate={navigate} />
            ) : route.startsWith("workspace") ? (
              activeRole === "Customer" ? (
                <CustomerApp />
              ) : (
                <ProtectedWorkspace role={activeRole} navigate={navigate}>
                  {[
                    "Washman",
                    "Dispatcher",
                    "Finance",
                    "Support",
                    "Super admin",
                  ].includes(activeRole) ? (
                    <LiveOperations
                      key={activeRole}
                      role={activeRole}
                      onHome={() => navigate("home")}
                    />
                  ) : (
                    <Portal
                      key={activeRole}
                      role={activeRole}
                      onHome={() => navigate("home")}
                    />
                  )}
                </ProtectedWorkspace>
              )
            ) : route.startsWith("auth") ? (
              <Auth
                role={role}
                mode={
                  route === "auth/register"
                    ? "register"
                    : route === "auth/recover"
                      ? "recover"
                      : "login"
                }
                onRole={setRole}
                onHome={() => navigate("home")}
                onNavigate={navigate}
                onComplete={() => workspace(role)}
              />
            ) : route === "confirm" ? (
              <Confirmer onHome={() => navigate("home")} />
            ) : ["services", "coverage", "trust", "journal"].includes(route) ||
              route.startsWith("journal/") ? (
              <CarePages key={route} page={route} navigate={navigate} />
            ) : (
              <HomePage key={route} navigate={navigate} />
            )}
          </Suspense>
        </PageErrorBoundary>
      </PageTransition>
      {route !== "account" && <CustomerChat navigate={navigate} />}
      {route !== "account" && (
        <div className="experience-dock">
          <Button onClick={() => navigate("account")}>My account</Button>
          <button
            className="dock-home"
            onClick={() => navigate("home")}
            aria-label="Public homepage"
          >
            <Icon name="drop" size={16} />
          </button>
          <button onClick={() => setExplorer(!explorer)}>
            <span className="dock-dot" /> Explore workspaces{" "}
            <Icon name="chevron" size={13} />
          </button>
        </div>
      )}
      {explorer && (
        <div className="role-explorer">
          <div className="explorer-heading">
            <div>
              <small>THE GO-WASH EXPERIENCE</small>
              <h3>One promise. Every perspective.</h3>
            </div>
            <button
              onClick={() => setExplorer(false)}
              aria-label="Close workspace menu"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <p>
            Explore the interactive prototype. These role switches are for
            demonstration, not production access control.
          </p>
          {roles.map((r, i) => (
            <button
              className="explorer-role"
              key={r}
              onClick={() => {
                workspace(r)
                setExplorer(false)
              }}
            >
              <span className="explorer-icon">
                <Icon
                  name={
                    i === 0
                      ? "car"
                      : i === 1
                        ? "drop"
                        : i === 2
                          ? "card"
                          : i === 3
                            ? "pin"
                            : "shield"
                  }
                />
              </span>
              <span>
                <strong>
                  {r === "Washman" ? "Washman & field staff" : r}
                  <small>
                    {
                      [
                        "Book, track and confirm your care",
                        "Assigned jobs, guided proof and shift summary",
                        "Fleet scheduling, confirmers and invoices",
                        "Wash windows, on-site teams and residents",
                        "Dispatch, evidence, screening and finance",
                      ][i]
                    }
                  </small>
                </strong>
              </span>
              <Icon name="arrow" size={17} />
            </button>
          ))}
          <div className="operations-role-links">
            <small>OPERATIONS STAFF</small>
            <div>
              {operationsRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    workspace(r)
                    setExplorer(false)
                  }}
                >
                  {r}
                  <Icon name="arrow" size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className="explorer-links">
            <button
              onClick={() => {
                navigate("auth/login")
                setExplorer(false)
              }}
            >
              Authentication flows
            </button>
            <button
              onClick={() => {
                navigate("confirm")
                setExplorer(false)
              }}
            >
              Driver verdict link
            </button>
          </div>
        </div>
      )}
    </MotionProvider>
  )
}
