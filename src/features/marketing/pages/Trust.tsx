import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import PageIntro from "@/features/marketing/components/PageIntro"
import ProofExplorer from "./trust/ProofExplorer"
import VerdictExplainer from "./trust/VerdictExplainer"

const boundaries = [
  [
    "Screened professionals",
    "Required records are reviewed before staff activation.",
  ],
  ["Outdoors only", "Staff never enter private homes or indoor premises."],
  [
    "Privacy by design",
    "Vehicle evidence should avoid people and neighbouring property.",
  ],
  [
    "Auditable exceptions",
    "Administrative releases require a reason and an enduring record.",
  ],
]

export default function Trust() {
  return (
    <>
      <PageIntro
        eyebrow="THE VERIFIED WASH STANDARD"
        title="Trust isn't a tagline."
        accent="It's a process."
        text="A beautifully clean car is the beginning. The record behind it is what makes Go-Wash different. Three independent signals must agree before a job closes normally."
      />
      <ProofExplorer />
      <VerdictExplainer />
      <section className="care-inclusions">
        <div className="eyebrow">CARE WITH CLEAR BOUNDARIES</div>
        <Heading>People first. Always.</Heading>
        <div className="inclusion-grid">
          {boundaries.map(([title, text]) => (
            <article key={title}>
              <Icon name="shield" size={25} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
