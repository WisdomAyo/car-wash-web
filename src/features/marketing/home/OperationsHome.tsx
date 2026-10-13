import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { Benefits, Closing } from "@/features/marketing/components/HomeSections"
import {
  Journey,
  Questions,
} from "@/features/marketing/components/HomeInteractive"
import { audiences } from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"
import ExceptionExplorer from "./operations/ExceptionExplorer"
import OperationsDesks from "./operations/OperationsDesks"

const content = audiences.operations
const signIn = authHref("login", "Super admin")

const flow = [
  ["calendar", "Assigned job", "Dispatch"],
  ["pin", "Right place", "GPS"],
  ["car", "Right vehicle", "Plate"],
  ["check", "Customer verdict", "TREATED"],
] as const

const boundaries = [
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
] as const

export default function OperationsHome() {
  return (
    <>
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
          <ButtonLink className="primary" href={signIn}>
            Sign in to operations
            <Icon name="arrow" size={19} />
          </ButtonLink>
        </div>
        <div
          className="operations-flow-art"
          role="img"
          aria-label="Illustrated workflow connecting dispatch, vehicle evidence and customer verdict"
        >
          <div className="flow-rail" />
          {flow.map(([icon, title, sub], i) => (
            <div className="flow-station" key={title}>
              <span className="flow-station-index">0{i + 1}</span>
              <span className="flow-station-icon">
                <Icon name={icon} size={34} />
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
      <OperationsDesks />
      <Journey
        steps={content.process}
        title="Access that starts with the right boundaries."
      />
      <ExceptionExplorer />
      <section className="operations-boundaries">
        <div className="eyebrow">BEFORE PRODUCTION LAUNCH</div>
        <Heading>The interface is only one layer.</Heading>
        <div className="perspective-grid">
          {boundaries.map(([icon, title, text]) => (
            <article key={title}>
              <Icon name={icon} size={30} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <Questions items={content.faq} />
      <Closing
        title="A clear view. A responsible next step."
        description="Operations accounts are invitation-only. Use your approved workspace to continue."
        action="Sign in to operations"
        href={signIn}
      />
    </>
  )
}
