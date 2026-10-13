"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

const day = [
  [
    "Before you begin",
    "Open your shift with a clear plan.",
    "Check your assigned jobs, confirm your registered device and review approved outdoor locations.",
    "calendar",
  ],
  [
    "At the vehicle",
    "The details matter.",
    "Match the registered plate, capture appropriate vehicle evidence and report unsafe access rather than proceeding.",
    "car",
  ],
  [
    "After the care",
    "Give your good work a record.",
    "Request the customer's verdict and follow the required final scan and evidence steps before submission.",
    "shield",
  ],
] as const

/** A walk through a washman's assigned-job day, one chapter at a time. */
export default function FieldDayStory() {
  const [chapter, setChapter] = useState(0)
  return (
    <section className="field-day-story">
      <div>
        <div className="eyebrow">A PROFESSIONAL DAY, IN FOCUS</div>
        <Heading>
          One assignment.
          <br />A clear next step.
        </Heading>
        <p>
          Explore a typical assigned-job journey. This is guidance, not a live
          staff shift.
        </p>
        <div className="field-chapter-tabs">
          {day.map(([name], i) => (
            <Button
              key={name}
              aria-pressed={chapter === i}
              className={chapter === i ? "selected" : ""}
              onClick={() => setChapter(i)}
            >
              <span>0{i + 1}</span>
              {name}
              <Icon name="arrow" size={18} />
            </Button>
          ))}
        </div>
      </div>
      <div className="field-work-card" key={chapter}>
        <div className="field-work-icon">
          <Icon name={day[chapter][3]} size={58} />
        </div>
        <div className="eyebrow">YOUR WORKDAY / CHAPTER 0{chapter + 1}</div>
        <Heading>{day[chapter][1]}</Heading>
        <p>{day[chapter][2]}</p>
        <div className="field-work-boundary">
          <Icon name="shield" size={20} />
          Assigned work only. Private time stays private.
        </div>
      </div>
    </section>
  )
}
