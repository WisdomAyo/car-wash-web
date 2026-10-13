"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { authHref } from "@/lib/roles"

const terms = [3, 6, 12] as const

const termHeading = {
  3: "A confident beginning",
  6: "A beautifully reliable routine",
  12: "A long-term care standard",
} as const

/** 3 / 6 / 12-month corporate plan explorer. */
export default function TermPlanner() {
  const [term, setTerm] = useState<(typeof terms)[number]>(6)
  return (
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
          {terms.map((t) => (
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
        <Heading level={3}>{termHeading[term]}</Heading>
        <p>{term}-month care plan · Named confirmers · Consolidated invoices</p>
        <ButtonLink
          className="primary"
          href={authHref("register", "Corporate")}
        >
          Discuss this term
          <Icon name="arrow" size={18} />
        </ButtonLink>
      </div>
    </section>
  )
}
