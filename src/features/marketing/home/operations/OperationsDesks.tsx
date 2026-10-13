"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { authHref, workspaceHref, type Role } from "@/lib/roles"

const desks: {
  role: Role
  icon: "calendar" | "card" | "help"
  title: string
  text: string
  task: string
}[] = [
  {
    role: "Dispatcher",
    icon: "calendar",
    title: "Keep the day connected.",
    text: "Coordinate approved staff, assigned routes and bookings. Review the workday without turning dispatch into an open job marketplace.",
    task: "Assignments · Routes · Exceptions",
  },
  {
    role: "Finance",
    icon: "card",
    title: "One clear account.",
    text: "Review payments, invoices and reconciliation from a focused financial perspective. Agreed term billing stays connected to the organisation.",
    task: "Invoices · Reconciliation · Reporting",
  },
  {
    role: "Support",
    icon: "help",
    title: "Close the loop with care.",
    text: "Connect a customer's concern to the right job, its evidence and its outcome. Keep context close when a conversation needs a decision.",
    task: "Customers · Complaints · Follow-through",
  },
]

/** Dispatch / Finance / Support desk picker. */
export default function OperationsDesks() {
  const [desk, setDesk] = useState(0)
  const current = desks[desk]
  return (
    <section className="operations-desks">
      <div className="home-editorial-heading">
        <div className="eyebrow">DIFFERENT ROLES. A SHARED RECORD.</div>
        <Heading>
          The right perspective.
          <br />
          For the decision ahead.
        </Heading>
      </div>
      <div
        className="operations-desk-tabs"
        role="group"
        aria-label="Operations roles"
      >
        {desks.map((d, i) => (
          <Button
            key={d.role}
            aria-pressed={desk === i}
            className={desk === i ? "selected" : ""}
            onClick={() => setDesk(i)}
          >
            <Icon name={d.icon} size={25} />
            {d.role}
          </Button>
        ))}
      </div>
      <div className="operations-desk-detail" key={desk}>
        <div className="desk-graphic">
          <Icon name={current.icon} size={84} />
          <span>{current.task}</span>
        </div>
        <div>
          <div className="eyebrow">{current.role} WORKSPACE</div>
          <Heading>{current.title}</Heading>
          <p>{current.text}</p>
          <div className="audience-actions">
            <ButtonLink
              className="primary"
              href={authHref("login", current.role)}
            >
              Sign in as {current.role}
              <Icon name="arrow" size={17} />
            </ButtonLink>
            <ButtonLink
              className="public-secondary"
              href={workspaceHref(current.role)}
            >
              Explore sample workspace
              <Icon name="arrow" size={17} />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  )
}
