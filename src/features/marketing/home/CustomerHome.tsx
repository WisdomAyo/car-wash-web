import Heading from "@/components/ui/Typography"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import {
  Closing,
  ProofRibbon,
} from "@/features/marketing/components/HomeSections"
import { Questions } from "@/features/marketing/components/HomeInteractive"
import ScrollButton from "@/features/marketing/components/ScrollButton"
import LagosFilm from "@/features/marketing/scenes/LagosFilm"
import { authHref, workspaceHref } from "@/lib/roles"
import CareSelector from "./customer/CareSelector"
import DayStory from "./customer/DayStory"

const questions = [
  [
    "Do I have to stay beside my car?",
    "No. Leave your vehicle in an approved, accessible outdoor space. Review the result and give your verdict when the care is ready.",
  ],
  [
    "Where can I book?",
    "You can book from any location in Nigeria. Enter your address and choose an available slot for your home, office, estate or fleet parking area.",
  ],
  [
    "What if I'm not pleased?",
    "Choose Treated and not pleased and add a remark to open a quality complaint. If the vehicle wasn't washed, choose Untreated; the job is frozen for operations review.",
  ],
  [
    "Can staff come into my home?",
    "Never. Work takes place only in approved outdoor areas. Staff do not enter private indoor premises or handle personal property.",
  ],
] as const

const howItWorks = [
  [
    "car",
    "Tell us about your car",
    "Register its plate, choose the care, location and available window.",
  ],
  [
    "shield",
    "Meet your professional",
    "Dispatch assigns a screened washman. Review their verified Trust Card.",
  ],
  [
    "drop",
    "Keep your plans",
    "We arrive, match the plate and care for your car in the approved outdoor area.",
  ],
  [
    "check",
    "Have the final say",
    "Review the result, record your TREATED verdict and keep a Wash Passport.",
  ],
] as const

const audienceLinks = [
  [
    "/business",
    "Corporate care",
    "Many vehicles. One account. Full visibility.",
  ],
  [
    "/estates",
    "Estate wash mornings",
    "Approved teams. Agreed windows. Thoughtful boundaries.",
  ],
  [
    "/careers",
    "A career in care",
    "Professional standards. Work to stand behind.",
  ],
] as const

const register = authHref("register", "Customer")

export default function CustomerHome() {
  return (
    <>
      <section className="customer-home-hero">
        <div>
          <div className="pill-eyebrow">
            <span />
            MOBILE CAR CARE. ACROSS NIGERIA.
          </div>
          <Heading level={1}>
            Your car shines.
            <br />
            Your day <em>stays yours.</em>
          </Heading>
          <p>
            Professional care, right where you park. No queues. No detours. Just
            a beautifully clean car—with the proof to match.
          </p>
          <div className="audience-actions">
            <ButtonLink className="primary" href={register}>
              Give your car a fresh start
              <Icon name="arrow" size={19} />
            </ButtonLink>
            <ScrollButton className="public-secondary" targetId="customer-how">
              See how it works
              <Icon name="chevron" size={18} />
            </ScrollButton>
          </div>
          <div className="customer-hero-signature">
            <Icon name="shield" size={25} />
            <span>
              Your vehicle. Our responsibility.
              <small>Screened people · Outdoor care · Three proofs</small>
            </span>
          </div>
        </div>
        <LagosFilm />
      </section>
      <ProofRibbon />
      <DayStory />
      <section className="customer-how" id="customer-how">
        <div className="eyebrow">A LITTLE LESS FRICTION</div>
        <Heading>From first tap to final shine.</Heading>
        <div className="customer-how-grid">
          {howItWorks.map(([icon, title, text], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <Icon name={icon} size={30} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <CareSelector />
      <section className="customer-trust-story">
        <div className="trust-story-visual">
          <div className="trust-story-ring" />
          <span className="trust-story-shield">
            <Icon name="shield" size={80} />
          </span>
          {(
            [
              ["pin", "GPS trail"],
              ["car", "Plate matched twice"],
              ["check", "Your TREATED verdict"],
            ] as const
          ).map(([icon, title], i) => (
            <span className={`trust-story-label label-${i}`} key={title}>
              <Icon name={icon} size={22} />
              {title}
              <Icon name="check" size={16} />
            </span>
          ))}
        </div>
        <div>
          <div className="eyebrow">NOT JUST CLEAN. PROVEN.</div>
          <Heading>
            Peace of mind.
            <br />
            With a paper trail.
          </Heading>
          <p>
            Your wash belongs to your vehicle, your location and your own
            confirmation. No single signal can tell the whole story—that&apos;s
            why we require three.
          </p>
          <div className="audience-feature-item">
            <Icon name="check" />
            Location tracking limited to assigned work
          </div>
          <div className="audience-feature-item">
            <Icon name="check" />
            Registered plate checked before and after
          </div>
          <div className="audience-feature-item">
            <Icon name="check" />
            Your verdict before normal closure
          </div>
          <ButtonLink className="public-secondary" href="/trust">
            Inside our trust standard
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
      </section>
      <section className="customer-passport-story">
        <div>
          <div className="eyebrow">A GOOD ROUTINE LEAVES A RECORD</div>
          <Heading>
            Your car&apos;s care story.
            <br />
            Beautifully connected.
          </Heading>
          <p>
            A Wash Passport keeps verified care linked to the registered
            vehicle. Return to its history, review outcomes and build a routine
            without relying on memory.
          </p>
          <ButtonLink className="primary" href={workspaceHref("Customer")}>
            Explore your sample workspace
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
        <div className="care-history-art">
          <div className="care-history-header">
            <Icon name="shield" size={25} />
            <span>
              THE WASH PASSPORT<small>Illustrated care history</small>
            </span>
          </div>
          {[
            ["01", "Vehicle identity", "Registered number plate"],
            ["02", "Service & evidence", "Job-linked location and plate scans"],
            ["03", "Your confirmation", "Recorded customer verdict"],
          ].map(([number, title, text]) => (
            <div className="care-history-event" key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              <Icon name="check" size={17} />
            </div>
          ))}
          <p>Sample record only · No live job evidence</p>
        </div>
      </section>
      <section className="customer-audiences">
        <div className="eyebrow">ONE PROMISE. EVERY SCALE.</div>
        <Heading>
          One car. A whole fleet.
          <br />
          An entire community.
        </Heading>
        <div className="customer-audience-links">
          {audienceLinks.map(([href, title, text]) => (
            <ButtonLink key={href} href={href}>
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
              <Icon name="arrow" size={23} />
            </ButtonLink>
          ))}
        </div>
      </section>
      <Questions
        items={questions}
        heading={
          <>
            Good questions.
            <br />
            Clear answers.
          </>
        }
        action="Talk to our team"
      />
      <Closing
        title="A clean car. A little more freedom."
        description="Let us take care of the shine. You take care of your day."
        action="Let's make it a fresh start"
        href={register}
      />
    </>
  )
}
