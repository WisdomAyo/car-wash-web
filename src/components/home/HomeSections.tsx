import { useState } from "react"
import Heading from "../ui/Typography"
import Button from "../ui/Button"
import { Icon } from "../Visuals"
import {
  audiences,
  type AudiencePage,
  type Navigate,
} from "../../domain/publicContent"

type Content = typeof audiences[AudiencePage]
export function Benefits({ items }: { items: Content["benefits"] }) {
  return (
    <section className="audience-benefits">
      {items.map(([icon, title, text]) => (
        <article key={title}>
          <span>
            <Icon name={icon} size={28} />
          </span>
          <Heading level={3}>{title}</Heading>
          <p>{text}</p>
        </article>
      ))}
    </section>
  )
}
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
  navigate,
}: {
  items: Content["faq"]
  navigate: Navigate
}) {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="audience-faq">
      <div>
        <div className="eyebrow">A LITTLE CLARITY</div>
        <Heading>
          Your questions.
          <br />
          Thoughtfully answered.
        </Heading>
        <Button
          className="public-secondary"
          onClick={() => navigate("contact")}
        >
          Have a conversation
          <Icon name="arrow" size={18} />
        </Button>
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
export function Closing({
  title,
  description,
  action,
  onClick,
}: {
  title: string
  description: string
  action: string
  onClick: () => void
}) {
  return (
    <section className="audience-final">
      <div className="eyebrow">YOUR VEHICLE. OUR RESPONSIBILITY.</div>
      <Heading>{title}</Heading>
      <p>{description}</p>
      <Button className="primary" onClick={onClick}>
        {action}
        <Icon name="arrow" size={18} />
      </Button>
    </section>
  )
}
export function ProofRibbon() {
  return (
    <div className="home-proof-ribbon">
      {[
        ["pin", "The right place", "GPS trail"],
        ["car", "The right vehicle", "Two plate scans"],
        ["check", "Your final say", "TREATED verdict"],
      ].map(([icon, title, text], i) => (
        <div key={title}>
          <span>0{i + 1}</span>
          <Icon name={icon as "pin"} size={26} />
          <div>
            <strong>{title}</strong>
            <small>{text}</small>
          </div>
        </div>
      ))}
    </div>
  )
}
