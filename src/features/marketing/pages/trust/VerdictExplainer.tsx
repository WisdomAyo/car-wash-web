"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

const outcomes = [
  "Treated and satisfied",
  "Treated and not pleased",
  "Untreated",
]

const explanations = [
  "Your confirmation unlocks the washman's final plate scan. All required evidence must still agree before normal closure.",
  "A remark is required. A quality complaint is opened while final submission may proceed with the required evidence.",
  "A remark is required. The job is disputed and final submission is blocked for operations review.",
]

/** What each customer verdict means for the job. */
export default function VerdictExplainer() {
  const [verdict, setVerdict] = useState(0)
  return (
    <section className="verdict-editorial">
      <div>
        <div className="eyebrow">YOU KEEP THE LAST WORD</div>
        <Heading>
          Your car.
          <br />
          Your verdict.
        </Heading>
        <p>
          Explore how each outcome changes the next step. This is an
          explanation, not an actual job confirmation.
        </p>
      </div>
      <div>
        <div className="verdict-options">
          {outcomes.map((name, i) => (
            <Button
              key={name}
              className={`verdict-option outcome-${i} ${
                verdict === i ? "selected" : ""
              }`}
              aria-pressed={verdict === i}
              onClick={() => setVerdict(i)}
            >
              <Icon name={i === 0 ? "check" : i === 1 ? "help" : "close"} />
              {name}
            </Button>
          ))}
        </div>
        <div className="verdict-explanation" role="status">
          {explanations[verdict]}
        </div>
        <ButtonLink className="public-secondary" href="/confirm">
          Try the sample driver verdict flow
          <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    </section>
  )
}
