import { useState } from "react"
import PublicLayout from "../../components/PublicLayout"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import {
  Benefits,
  Journey,
  Questions,
  Closing,
} from "../../components/home/HomeSections"
import { audiences, type Navigate } from "../../domain/publicContent"

export default function CareersHome({ navigate }: { navigate: Navigate }) {
  const content = audiences.careers
  const [chapter, setChapter] = useState(0)
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
  const apply = () => navigate("auth/register", "Washman")
  return (
    <PublicLayout page="careers" navigate={navigate} role="Washman">
      <section className="careers-home-hero">
        <div className="careers-hero-copy">
          <div className="eyebrow">GOOD HANDS. GREAT POSSIBILITIES.</div>
          <Heading level={1}>
            Take pride
            <br />
            in every
            <br />
            <em>fresh start.</em>
          </Heading>
          <p>
            Good work deserves clear expectations and real support. Join a
            professional care team with a guided workday and a standard you can
            stand behind.
          </p>
          <Button className="primary" onClick={apply}>
            Start your application
            <Icon name="arrow" size={19} />
          </Button>
          <span className="careers-application-note">
            Screening first. Professional standards, always.
          </span>
        </div>
        <div className="careers-hero-photo">
          <img
            src="/images/care-craft.jpg"
            alt="A professional carefully cleaning a vehicle with a cloth"
          />
          <div className="craft-photo-caption">
            <span>THE CRAFT OF GOOD CARE</span>
            <p>
              A little attention.
              <br />A visible difference.
            </p>
            <small>Photo by Muhammad Saad / Unsplash · Editorial imagery</small>
          </div>
        </div>
        <div className="careers-vertical-note">
          PEOPLE BEHIND THE PROMISE / NIGERIA
        </div>
      </section>
      <div className="craft-values-strip">
        <span>
          <Icon name="calendar" />
          Clear assignments
        </span>
        <span>
          <Icon name="shield" />
          Proof that protects
        </span>
        <span>
          <Icon name="help" />
          Support when it matters
        </span>
      </div>
      <section className="home-editorial-heading">
        <div className="eyebrow">WORK YOU CAN BE PROUD OF</div>
        <Heading>
          The care is in the details.
          <br />
          So is the respect.
        </Heading>
        <p>
          We want field professionals to know what the day asks of them, what
          protects their work and where to turn when something isn't right.
        </p>
      </section>
      <Benefits items={content.benefits} />
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
      <Journey
        steps={content.process}
        title="Your next chapter starts with a good foundation."
      />
      <section className="craft-manifesto">
        <span>OUR WORKING STANDARD</span>
        <Heading>
          Be thoughtful.
          <br />
          Be accountable.
          <br />
          <em>Leave it better.</em>
        </Heading>
        <div>
          <p>
            Care isn't only the finish on a vehicle. It's how you respect a
            location, frame evidence, handle a concern and keep the customer
            informed.
          </p>
          <div className="craft-rules">
            {[
              "Never enter private indoor premises.",
              "Never skip a required verification step.",
              "Report unsafe or unclear conditions.",
              "Keep customer information within the assigned job.",
            ].map((text, i) => (
              <div key={text}>
                <span>0{i + 1}</span>
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="screening-editorial">
        <div>
          <div className="eyebrow">BEFORE YOUR FIRST ASSIGNMENT</div>
          <Heading>
            Professional trust.
            <br />
            Built from the start.
          </Heading>
          <p>
            Your application is the beginning, not automatic activation.
            Operations reviews required records and approves the registered
            device before access is enabled.
          </p>
          <Button
            className="public-secondary"
            onClick={() => navigate("trust")}
          >
            Read the trust standard
            <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="screening-checklist">
          {[
            ["Identification", "The right person behind the staff profile."],
            [
              "Guarantor details",
              "An accountable introduction, reviewed by operations.",
            ],
            [
              "Screening records",
              "Required records checked before activation.",
            ],
            [
              "Registered device",
              "Approved access connected to your work identity.",
            ],
          ].map(([title, text], i) => (
            <div key={title}>
              <span>0{i + 1}</span>
              <div>
                <Heading level={3}>{title}</Heading>
                <p>{text}</p>
              </div>
              <Icon name="shield" size={22} />
            </div>
          ))}
        </div>
      </section>
      <section className="audience-planner">
        <div>
          <div className="eyebrow">PICTURE YOUR NEXT CHAPTER</div>
          <Heading>
            Professional care.
            <br />
            Across Nigeria.
          </Heading>
          <p>
            Build a professional care career serving customers in communities
            across the country. Applying does not confirm a vacancy, shift or
            guaranteed earnings.
          </p>
        </div>
        <div className="planner-options">
          <div className="eyebrow">NATIONWIDE OPPORTUNITY</div>
          <Heading level={3}>A clearer workday, wherever you are.</Heading>
          <p>Assigned outdoor jobs · Screening first · Operations support</p>
          <Button className="primary" onClick={apply}>
            Introduce yourself
            <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>
      <Questions items={content.faq} navigate={navigate} />
      <Closing
        title="Bring your good hands. Build a better routine."
        description="Start with an application. We'll take the next steps thoughtfully."
        action="Start your application"
        onClick={apply}
      />
    </PublicLayout>
  )
}
