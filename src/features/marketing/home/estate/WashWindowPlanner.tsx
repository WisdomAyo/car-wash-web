"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { authHref } from "@/lib/roles"

const slots = ["Morning", "Afternoon"] as const

/** Morning / afternoon wash-window preview. */
export default function WashWindowPlanner() {
  const [slot, setSlot] = useState<(typeof slots)[number]>("Morning")
  return (
    <section className="estate-window-planner">
      <div>
        <div className="eyebrow">PLAN A LITTLE. RELAX A LOT.</div>
        <Heading>Care on your community&apos;s clock.</Heading>
        <p>
          Preview an illustrative wash window. Actual times, access arrangements
          and capacity require operations approval.
        </p>
        <div className="planner-tabs">
          {slots.map((name) => (
            <Button
              key={name}
              aria-pressed={slot === name}
              className={slot === name ? "selected" : ""}
              onClick={() => setSlot(name)}
            >
              {name}
            </Button>
          ))}
        </div>
        <ButtonLink className="primary" href={authHref("register", "Estate")}>
          Discuss a wash window
          <Icon name="arrow" size={18} />
        </ButtonLink>
      </div>
      <div className="estate-window-preview">
        <div className="eyebrow">SAMPLE ESTATE RUN</div>
        <div className="window-sun">
          <Icon name="clock" size={46} />
        </div>
        <Heading>
          {slot === "Morning" ? "08:00 — 12:00" : "13:00 — 17:00"}
        </Heading>
        <p>
          {slot === "Morning"
            ? "Start the day with a little shine."
            : "Fresh care, after the morning rush."}
        </p>
        <div className="window-run-line">
          {["Access check", "Assigned care", "Resident verdict"].map(
            (name, i) => (
              <div key={name}>
                <span>0{i + 1}</span>
                <strong>{name}</strong>
              </div>
            ),
          )}
        </div>
        <small>Illustrated schedule · Not live availability</small>
      </div>
    </section>
  )
}
