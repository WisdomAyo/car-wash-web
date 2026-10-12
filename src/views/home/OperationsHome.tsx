import { useState } from "react"
import PublicLayout from "../../components/PublicLayout"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import {
  Benefits,
  Journey,
  Questions,
  Closing,
} from "../../components/home/HomeSections"
import { audiences, type Navigate } from "../../domain/publicContent"
import type { Role } from "../../domain/roles"

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
export default function OperationsHome({ navigate }: { navigate: Navigate }) {
  const content = audiences.operations
  const [desk, setDesk] = useState(0)
  const [exception, setException] = useState("Untreated")
  return (
    <PublicLayout page="operations" navigate={navigate} role="Super admin">
      <section className="operations-home-hero">
        <div className="ops-hero-top">
          <span className="ops-system-mark">
            <Icon name="drop" size={22} />
            THE PEOPLE BEHIND THE PROMISE
          </span>
          <span>
            <Icon name="shield" size={17} />
            INVITATION-ONLY ACCESS
          </span>
        </div>
        <Heading level={1}>
          Clarity for every
          <br />
          <em>moving part.</em>
        </Heading>
        <div className="ops-hero-description">
          <p>
            Care is the promise. Coordination is how we keep it. One dedicated
            entrance for the teams making every booking, professional and proof
            accountable.
          </p>
          <Button
            className="primary"
            onClick={() => navigate("auth/login", "Super admin")}
          >
            Sign in to operations
            <Icon name="arrow" size={19} />
          </Button>
        </div>
        <div
          className="operations-flow-art"
          role="img"
          aria-label="Illustrated workflow connecting dispatch, vehicle evidence and customer verdict"
        >
          <div className="flow-rail" />
          {[
            ["calendar", "Assigned job", "Dispatch"],
            ["pin", "Right place", "GPS"],
            ["car", "Right vehicle", "Plate"],
            ["check", "Customer verdict", "TREATED"],
          ].map(([icon, title, sub], i) => (
            <div className="flow-station" key={title}>
              <span className="flow-station-index">0{i + 1}</span>
              <span className="flow-station-icon">
                <Icon name={icon as "calendar"} size={34} />
              </span>
              <strong>{title}</strong>
              <small>{sub}</small>
            </div>
          ))}
        </div>
        <small className="ops-art-notice">
          ILLUSTRATED SYSTEM · NOT LIVE OPERATIONS DATA
        </small>
      </section>
      <Benefits items={content.benefits} />
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
            <Icon name={desks[desk].icon} size={84} />
            <span>{desks[desk].task}</span>
          </div>
          <div>
            <div className="eyebrow">{desks[desk].role} WORKSPACE</div>
            <Heading>{desks[desk].title}</Heading>
            <p>{desks[desk].text}</p>
            <div className="audience-actions">
              <Button
                className="primary"
                onClick={() => navigate("auth/login", desks[desk].role)}
              >
                Sign in as {desks[desk].role}
                <Icon name="arrow" size={17} />
              </Button>
              <Button
                className="public-secondary"
                onClick={() =>
                  navigate(
                    `workspace/${desks[desk].role.toLowerCase()}`,
                    desks[desk].role,
                  )
                }
              >
                Explore sample workspace
                <Icon name="arrow" size={17} />
              </Button>
            </div>
          </div>
        </div>
      </section>
      <Journey
        steps={content.process}
        title="Access that starts with the right boundaries."
      />
      <section className="exception-story">
        <div>
          <div className="eyebrow">NOT EVERY JOB HAS A NORMAL ENDING</div>
          <Heading>
            Evidence first.
            <br />A reason, always.
          </Heading>
          <p>
            Explore what an exception means. These examples describe the product
            standard; they do not release or modify a real job.
          </p>
          <div className="planner-tabs">
            {["Untreated", "Plate mismatch", "Quality concern"].map((name) => (
              <Button
                key={name}
                aria-pressed={exception === name}
                className={exception === name ? "selected" : ""}
                onClick={() => setException(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
        <div className="exception-illustration">
          <Icon
            name={exception === "Quality concern" ? "help" : "shield"}
            size={58}
          />
          <div className="eyebrow">OPERATIONS REVIEW</div>
          <Heading level={3}>
            {exception === "Untreated"
              ? "Freeze. Review. Resolve."
              : exception === "Plate mismatch"
                ? "The vehicle must match."
                : "Listen to the customer's concern."}
          </Heading>
          <p role="status">
            {exception === "Untreated"
              ? "An Untreated verdict disputes the job and blocks final submission. Administrative release requires a mandatory reason and an audit record."
              : exception === "Plate mismatch"
                ? "A mismatched registered plate is not a normal verification path. Operations must review the evidence instead of silently bypassing the requirement."
                : "Treated and not pleased records a quality complaint. Final submission may proceed with required evidence while support follows up."}
          </p>
          <span>
            <Icon name="check" size={18} />
            Accountable decisions stay on record.
          </span>
        </div>
      </section>
      <section className="operations-boundaries">
        <div className="eyebrow">BEFORE PRODUCTION LAUNCH</div>
        <Heading>The interface is only one layer.</Heading>
        <div className="perspective-grid">
          {[
            [
              "shield",
              "Backend permissions",
              "Role switches in this prototype are demonstrations. Production access and every job transition must be enforced by the backend.",
            ],
            [
              "clock",
              "Protected evidence",
              "Private, expiring evidence links and tracking boundaries need real service integrations.",
            ],
            [
              "grid",
              "An enduring audit trail",
              "Administrator actions and job events require append-only records with mandatory reasons for exceptional releases.",
            ],
          ].map(([icon, title, text]) => (
            <article key={title}>
              <Icon name={icon as "shield"} size={30} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <Questions items={content.faq} navigate={navigate} />
      <Closing
        title="A clear view. A responsible next step."
        description="Operations accounts are invitation-only. Use your approved workspace to continue."
        action="Sign in to operations"
        onClick={() => navigate("auth/login", "Super admin")}
      />
    </PublicLayout>
  )
}
