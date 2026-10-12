import { useState } from "react"
import PublicLayout from "../../components/PublicLayout"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import { CarArt, Icon, Plate } from "../../components/Visuals"
import {
  Benefits,
  Journey,
  Questions,
  Closing,
  ProofRibbon,
} from "../../components/home/HomeSections"
import { audiences, type Navigate } from "../../domain/publicContent"

export default function BusinessHome({ navigate }: { navigate: Navigate }) {
  const content = audiences.business
  const [term, setTerm] = useState(6)
  const [active, setActive] = useState(0)
  const vehicles = [
    ["Mercedes-Benz C300", "LND 482 JK", "Confirmed · TREATED"],
    ["Toyota Camry", "KJA 715 FC", "Awaiting named confirmer"],
    ["Lexus RX350", "EKY 203 AJ", "Scheduled · Not yet verified"],
  ]
  const register = () => navigate("auth/register", "Corporate")
  return (
    <PublicLayout page="business" navigate={navigate} role="Corporate">
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
              More vehicles shouldn't mean more moving parts. Bring scheduling,
              care records and named confirmers into one beautifully clear
              routine.
            </p>
            <Button className="primary" onClick={register}>
              Design your fleet plan
              <Icon name="arrow" size={19} />
            </Button>
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
      <section className="fleet-passport-story">
        <div>
          <div className="eyebrow">FOLLOW THE VEHICLE, NOT THE PAPERWORK</div>
          <Heading>
            A care record.
            <br />
            With a number plate.
          </Heading>
          <p>
            Select a sample vehicle to explore how a fleet care record stays
            connected to its assigned job and confirmer.
          </p>
          <div className="fleet-vehicle-tabs">
            {vehicles.map(([name, plate], i) => (
              <Button
                key={plate}
                aria-pressed={active === i}
                className={active === i ? "selected" : ""}
                onClick={() => setActive(i)}
              >
                <Icon name="car" size={22} />
                <span>
                  {name}
                  <small>{plate}</small>
                </span>
                <Icon name="chevron" size={17} />
              </Button>
            ))}
          </div>
        </div>
        <div className="fleet-passport-preview" key={active}>
          <div className="eyebrow">SAMPLE WASH PASSPORT</div>
          <div className="passport-preview-car">
            <CarArt silver={active !== 0} />
          </div>
          <Heading level={3}>{vehicles[active][0]}</Heading>
          <Plate>{vehicles[active][1]}</Plate>
          <div className="passport-status">
            <Icon name={active === 0 ? "shield" : "clock"} />
            {vehicles[active][2]}
          </div>
          <p>
            This is an illustrated record, not live job evidence. Only fully
            verified jobs may close normally.
          </p>
          <Button
            className="secondary full"
            onClick={() => navigate("workspace/corporate", "Corporate")}
          >
            Explore the fleet workspace
            <Icon name="arrow" size={17} />
          </Button>
        </div>
      </section>
      <Journey
        steps={content.process}
        title="From the first vehicle to the whole fleet."
      />
      <section className="team-perspectives">
        <div className="eyebrow">ONE ACCOUNT. THOUGHTFUL PERSPECTIVES.</div>
        <Heading>Everyone gets the clarity they need.</Heading>
        <div className="perspective-grid">
          {[
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
          ].map(([icon, eyebrow, title, text]) => (
            <article key={title}>
              <Icon name={icon as "calendar"} size={32} />
              <div className="eyebrow">{eyebrow}</div>
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="audience-planner">
        <div>
          <div className="eyebrow">A ROUTINE THAT FITS YOUR ORGANISATION</div>
          <Heading>Choose your fleet rhythm.</Heading>
          <p>
            Explore a term below. Your fleet size, service mix, locations and
            final volume pricing are agreed with operations before activation.
          </p>
        </div>
        <div className="planner-options">
          <div className="planner-tabs">
            {[3, 6, 12].map((t) => (
              <Button
                key={t}
                aria-pressed={term === t}
                className={term === t ? "selected" : ""}
                onClick={() => setTerm(t)}
              >
                {t} months
              </Button>
            ))}
          </div>
          <Heading level={3}>
            {term === 3
              ? "A confident beginning"
              : term === 6
                ? "A beautifully reliable routine"
                : "A long-term care standard"}
          </Heading>
          <p>
            {term}-month care plan · Named confirmers · Consolidated invoices
          </p>
          <Button className="primary" onClick={register}>
            Discuss this term
            <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>
      <Questions items={content.faq} navigate={navigate} />
      <Closing
        title="Less to chase. More to look forward to."
        description="Start a conversation about your fleet. We'll help shape a care routine around it."
        action="Design your fleet plan"
        onClick={register}
      />
    </PublicLayout>
  )
}
