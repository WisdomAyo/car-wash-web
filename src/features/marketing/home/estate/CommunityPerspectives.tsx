"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

const perspectives = {
  Residents: [
    "A fresh start, close to home.",
    "Book through your estate link, leave your car in the approved outdoor space and review the result in your own account.",
    "Your private payment and vehicle records stay private.",
  ],
  Security: [
    "A clear handover at the gate.",
    "Know the named, screened staff scheduled for the estate run and follow the agreed access procedure.",
    "No unapproved entry. No private indoor work.",
  ],
  Managers: [
    "A little coordination. A calmer community.",
    "Agree wash windows, review aggregate activity and flag incidents without opening residents' private care records.",
    "Community visibility, with thoughtful boundaries.",
  ],
} as const
type Perspective = keyof typeof perspectives

const symbols: Record<Perspective, "car" | "shield" | "grid"> = {
  Residents: "car",
  Security: "shield",
  Managers: "grid",
}

/** Residents / Security / Managers tabs. */
export default function CommunityPerspectives() {
  const [view, setView] = useState<Perspective>("Residents")
  const detail = perspectives[view]
  return (
    <section className="community-perspectives" id="community-perspectives">
      <div className="home-editorial-heading">
        <div className="eyebrow">A COMMUNITY IS MORE THAN A CAR PARK</div>
        <Heading>
          One wash morning.
          <br />
          Three thoughtful perspectives.
        </Heading>
      </div>
      <div
        className="community-tabs"
        role="group"
        aria-label="Community perspectives"
      >
        {(Object.keys(perspectives) as Perspective[]).map((name) => (
          <Button
            key={name}
            className={view === name ? "selected" : ""}
            aria-pressed={view === name}
            onClick={() => setView(name)}
          >
            {name}
            <Icon name="arrow" size={18} />
          </Button>
        ))}
      </div>
      <div className="community-detail" key={view}>
        <span className="community-detail-symbol">
          <Icon name={symbols[view]} size={70} />
        </span>
        <div>
          <Heading>{detail[0]}</Heading>
          <p>{detail[1]}</p>
          <span>
            <Icon name="check" size={19} />
            {detail[2]}
          </span>
        </div>
      </div>
    </section>
  )
}
