import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import PageIntro from "@/features/marketing/components/PageIntro"
import CoverageExplorer from "./coverage/CoverageExplorer"

const preparation = [
  [
    "pin",
    "Safe outdoor access",
    "An approved, accessible parking area with room for the professional to work.",
  ],
  [
    "shield",
    "Clear estate entry",
    "Let security know the approved team and any agreed access requirements.",
  ],
  [
    "clock",
    "A confirmed window",
    "Choose an available slot. Rain or unsafe conditions may require rescheduling.",
  ],
  [
    "car",
    "The right vehicle",
    "Your registered plate connects the booking and its evidence to your car.",
  ],
] as const

export default function Coverage() {
  return (
    <>
      <PageIntro
        eyebrow="NATIONWIDE MOBILE CAR CARE"
        title="Where you park."
        accent="Where we care."
        text="Go-Wash is for every location in Nigeria. Book care at home, at work, in your estate or wherever your fleet parks, then confirm your preferred time."
      />
      <CoverageExplorer />
      <section className="coverage-preparation">
        <div className="eyebrow">BEFORE WE ARRIVE</div>
        <Heading>A good place for a fresh start.</Heading>
        <div className="inclusion-grid">
          {preparation.map(([icon, title, text]) => (
            <article key={title}>
              <Icon name={icon} size={25} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="care-note">
        <Icon name="pin" size={35} />
        <div>
          <Heading>Wherever you are in Nigeria.</Heading>
          <p>
            Book personal care or talk to us about a coordinated plan for your
            fleet, workplace or estate.
          </p>
        </div>
        <ButtonLink className="secondary" href="/contact">
          Tell us about your location
          <Icon name="arrow" size={16} />
        </ButtonLink>
      </section>
    </>
  )
}
