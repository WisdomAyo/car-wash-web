"use client"

import { useState, type ReactNode } from "react"
import Heading from "@/components/ui/Typography"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import {
  audiences,
  type AudiencePage,
} from "@/features/marketing/content/publicContent"

/** Stateful homepage sections (client components). Static ones live in HomeSections.tsx. */
type Content = (typeof audiences)[AudiencePage]

export function Journey({
  steps,
  title = "A little structure. A lot less friction.",
}: {
  steps: Content["process"]
  title?: string
}) {
  const [step, setStep] = useState(0)
  return (
    <section className="audience-journey" id="audience-journey">
      <div>
        <div className="eyebrow">FROM FIRST HELLO TO FRESH START</div>
        <Heading>{title}</Heading>
        <p>Explore the journey, one thoughtful step at a time.</p>
        <div
          className="journey-step-buttons"
          role="group"
          aria-label="Journey steps"
        >
          {steps.map(([name], i) => (
            <Button
              key={name}
              aria-pressed={step === i}
              className={step === i ? "selected" : ""}
              onClick={() => setStep(i)}
            >
              <span>0{i + 1}</span>
              {name}
              <Icon name="arrow" size={18} />
            </Button>
          ))}
        </div>
      </div>
      <div className="audience-step-detail" key={step}>
        <span className="giant-step">0{step + 1}</span>
        <div className="eyebrow">YOUR NEXT CHAPTER</div>
        <Heading>{steps[step][0]}</Heading>
        <p>{steps[step][1]}</p>
        <div className="step-progress">
          {steps.map((_, i) => (
            <span className={i <= step ? "complete" : ""} key={i} />
          ))}
        </div>
        <Button
          className="public-secondary"
          onClick={() => setStep((step + 1) % steps.length)}
        >
          Next step
          <Icon name="arrow" size={18} />
        </Button>
      </div>
    </section>
  )
}

export function Questions({
  items,
  heading = (
    <>
      Your questions.
      <br />
      Thoughtfully answered.
    </>
  ),
  action = "Have a conversation",
}: {
  items: ReadonlyArray<readonly [string, string]>
  heading?: ReactNode
  action?: string
}) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="audience-faq">
      <div>
        <div className="eyebrow">A LITTLE CLARITY</div>
        <Heading>{heading}</Heading>
        <ButtonLink className="public-secondary" href="/contact">
          {action}
          <Icon name="arrow" size={18} />
        </ButtonLink>
      </div>
      <div className="faq-list">
        {items.map(([question, answer], i) => (
          <div key={question}>
            <Button
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
            >
              {question}
              <Icon name={open === i ? "close" : "plus"} size={18} />
            </Button>
            {open === i && <p>{answer}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
