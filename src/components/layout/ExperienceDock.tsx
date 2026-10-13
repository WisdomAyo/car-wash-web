"use client"

import { useEffect, useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon, type IconName } from "@/components/Visuals"
import { authHref, operationsRoles, roles, workspaceHref } from "@/lib/roles"

const roleCards: { icon: IconName; blurb: string }[] = [
  { icon: "car", blurb: "Book, track and confirm your care" },
  { icon: "drop", blurb: "Assigned jobs, guided proof and shift summary" },
  { icon: "card", blurb: "Fleet scheduling, confirmers and invoices" },
  { icon: "pin", blurb: "Wash windows, on-site teams and residents" },
  { icon: "shield", blurb: "Dispatch, evidence, screening and finance" },
]

/** Prototype navigation aid: jump between the demo workspaces. Not access control. */
export default function ExperienceDock() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <div className="experience-dock">
        <ButtonLink href="/account">My account</ButtonLink>
        <ButtonLink className="dock-home" href="/" aria-label="Public homepage">
          <Icon name="drop" size={16} />
        </ButtonLink>
        <Button onClick={() => setOpen(!open)}>
          <span className="dock-dot" /> Explore workspaces{" "}
          <Icon name="chevron" size={13} />
        </Button>
      </div>

      {open && (
        <div className="role-explorer">
          <div className="explorer-heading">
            <div>
              <small>THE GO-WASH EXPERIENCE</small>
              <h3>One promise. Every perspective.</h3>
            </div>
            <Button onClick={close} aria-label="Close workspace menu">
              <Icon name="close" size={18} />
            </Button>
          </div>
          <p>
            Explore the interactive prototype. These role switches are for
            demonstration, not production access control.
          </p>
          {roles.map((role, i) => (
            <ButtonLink
              className="explorer-role"
              key={role}
              href={workspaceHref(role)}
              onClick={close}
            >
              <span className="explorer-icon">
                <Icon name={roleCards[i].icon} />
              </span>
              <span>
                <strong>
                  {role === "Washman" ? "Washman & field staff" : role}
                  <small>{roleCards[i].blurb}</small>
                </strong>
              </span>
              <Icon name="arrow" size={17} />
            </ButtonLink>
          ))}
          <div className="operations-role-links">
            <small>OPERATIONS STAFF</small>
            <div>
              {operationsRoles.map((role) => (
                <ButtonLink
                  key={role}
                  href={workspaceHref(role)}
                  onClick={close}
                >
                  {role}
                  <Icon name="arrow" size={12} />
                </ButtonLink>
              ))}
            </div>
          </div>
          <div className="explorer-links">
            <ButtonLink href={authHref("login")} onClick={close}>
              Authentication flows
            </ButtonLink>
            <ButtonLink href="/confirm" onClick={close}>
              Driver verdict link
            </ButtonLink>
          </div>
        </div>
      )}
    </>
  )
}
