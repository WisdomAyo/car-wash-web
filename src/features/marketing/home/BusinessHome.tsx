import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { CarArt, Icon } from "@/components/Visuals"
import {
  Benefits,
  Closing,
  ProofRibbon,
} from "@/features/marketing/components/HomeSections"
import {
  Journey,
  Questions,
} from "@/features/marketing/components/HomeInteractive"
import { audiences } from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"
import FleetPassport from "./business/FleetPassport"
import TermPlanner from "./business/TermPlanner"

const content = audiences.business
const register = authHref("register", "Corporate")

const perspectives = [
  [
    "calendar",
    "For the fleet manager",
    "Set a reliable rhythm",
    "Register vehicles, agree wash days and keep an eye on active care.",
  ],
  [
    "check",
    "For the driver",
    "A simple final say",
    "A named confirmer reviews the result through a delegated verdict link.",
  ],
  [
    "card",
    "For finance",
    "One clear account",
    "Review consolidated invoices, agreed pricing and term billing.",
  ],
] as const

export default function BusinessHome() {
  return (
    <>
      <section className="fleet-home-hero">
        <div className="pill-eyebrow">GO-WASH FOR BUSINESS</div>
        <div className="fleet-hero-heading">
          <Heading level={1}>
            A fleet that shines.
            <br />
            <em>A workday that flows.</em>
          </Heading>
          <div>
            <p>
              More vehicles shouldn&apos;t mean more moving parts. Bring
              scheduling, care records and named confirmers into one beautifully
              clear routine.
            </p>
            <ButtonLink className="primary" href={register}>
              Design your fleet plan
              <Icon name="arrow" size={19} />
            </ButtonLink>
          </div>
        </div>
        <div className="fleet-panorama">
          <CarArt silver />
          <CarArt />
          <CarArt silver />
          <div className="fleet-panorama-label">
            <Icon name="shield" size={22} />
            <span>Many vehicles. One care standard.</span>
          </div>
        </div>
        <div className="fleet-hero-bottom">
          <span>3, 6 & 12-MONTH TERMS</span>
          <span>AGREED VOLUME PRICING</span>
          <span>PLATE-LINKED CARE RECORDS</span>
        </div>
      </section>
      <ProofRibbon />
      <section className="home-editorial-heading">
        <div className="eyebrow">LESS COORDINATION. MORE CONFIDENCE.</div>
        <Heading>
          A better-looking fleet.
          <br />
          Without another spreadsheet.
        </Heading>
        <p>
          Let your teams spend less time chasing a clean car, a driver
          confirmation or an invoice. The same service record keeps everyone
          looking at the right detail.
        </p>
      </section>
      <Benefits items={content.benefits} />
      <FleetPassport />
      <Journey
        steps={content.process}
        title="From the first vehicle to the whole fleet."
      />
      <section className="team-perspectives">
        <div className="eyebrow">ONE ACCOUNT. THOUGHTFUL PERSPECTIVES.</div>
        <Heading>Everyone gets the clarity they need.</Heading>
        <div className="perspective-grid">
          {perspectives.map(([icon, eyebrow, title, text]) => (
            <article key={title}>
              <Icon name={icon} size={32} />
              <div className="eyebrow">{eyebrow}</div>
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <TermPlanner />
      <Questions items={content.faq} />
      <Closing
        title="Less to chase. More to look forward to."
        description="Start a conversation about your fleet. We'll help shape a care routine around it."
        action="Design your fleet plan"
        href={register}
      />
    </>
  )
}
