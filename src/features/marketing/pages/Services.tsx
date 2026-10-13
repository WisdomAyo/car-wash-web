import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import PageIntro from "@/features/marketing/components/PageIntro"
import ServiceExplorer from "./services/ServiceExplorer"

export default function Services() {
  return (
    <>
      <PageIntro
        eyebrow="THE GO-WASH CARE MENU"
        title="Your kind of clean."
        accent="Beautifully considered."
        text="From an everyday refresh to a little extra attention, choose care that fits your vehicle and your day. Every service comes with the same standard of proof."
      />
      <ServiceExplorer />
      <section className="care-note">
        <Icon name="shield" size={38} />
        <div>
          <Heading>What never changes?</Heading>
          <p>
            Screened professionals. Outdoor-only service. GPS evidence, two
            matching plate scans and your TREATED verdict before normal closure.
          </p>
        </div>
        <ButtonLink className="secondary" href="/trust">
          Our trust standard
          <Icon name="arrow" size={16} />
        </ButtonLink>
      </section>
    </>
  )
}
