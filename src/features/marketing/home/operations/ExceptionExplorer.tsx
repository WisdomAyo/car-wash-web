"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

const exceptions = {
  Untreated: {
    title: "Freeze. Review. Resolve.",
    text: "An Untreated verdict disputes the job and blocks final submission. Administrative release requires a mandatory reason and an audit record.",
    icon: "shield",
  },
  "Plate mismatch": {
    title: "The vehicle must match.",
    text: "A mismatched registered plate is not a normal verification path. Operations must review the evidence instead of silently bypassing the requirement.",
    icon: "shield",
  },
  "Quality concern": {
    title: "Listen to the customer's concern.",
    text: "Treated and not pleased records a quality complaint. Final submission may proceed with required evidence while support follows up.",
    icon: "help",
  },
} as const
type Exception = keyof typeof exceptions

/** What each kind of job exception means for operations. */
export default function ExceptionExplorer() {
  const [exception, setException] = useState<Exception>("Untreated")
  const current = exceptions[exception]
  return (
    <section className="exception-story">
      <div>
        <div className="eyebrow">NOT EVERY JOB HAS A NORMAL ENDING</div>
        <Heading>
          Evidence first.
          <br />A reason, always.
        </Heading>
        <p>
          Explore what an exception means. These examples describe the product
          standard; they do not release or modify a real job.
        </p>
        <div className="planner-tabs">
          {(Object.keys(exceptions) as Exception[]).map((name) => (
            <Button
              key={name}
              aria-pressed={exception === name}
              className={exception === name ? "selected" : ""}
              onClick={() => setException(name)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
      <div className="exception-illustration">
        <Icon name={current.icon} size={58} />
        <div className="eyebrow">OPERATIONS REVIEW</div>
        <Heading level={3}>{current.title}</Heading>
        <p role="status">{current.text}</p>
        <span>
          <Icon name="check" size={18} />
          Accountable decisions stay on record.
        </span>
      </div>
    </section>
  )
}
