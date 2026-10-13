import Image from "next/image"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { Benefits, Closing } from "@/features/marketing/components/HomeSections"
import {
  Journey,
  Questions,
} from "@/features/marketing/components/HomeInteractive"
import { audiences } from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"
import FieldDayStory from "./careers/FieldDayStory"

const content = audiences.careers
const apply = authHref("register", "Washman")

const workingStandard = [
  "Never enter private indoor premises.",
  "Never skip a required verification step.",
  "Report unsafe or unclear conditions.",
  "Keep customer information within the assigned job.",
]

const screening = [
  ["Identification", "The right person behind the staff profile."],
  ["Guarantor details", "An accountable introduction, reviewed by operations."],
  ["Screening records", "Required records checked before activation."],
  ["Registered device", "Approved access connected to your work identity."],
]

export default function CareersHome() {
  return (
    <>
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
          <ButtonLink className="primary" href={apply}>
            Start your application
            <Icon name="arrow" size={19} />
          </ButtonLink>
          <span className="careers-application-note">
            Screening first. Professional standards, always.
          </span>
        </div>
        <div className="careers-hero-photo">
          <Image
            src="/images/care-craft.jpg"
            alt="A professional carefully cleaning a vehicle with a cloth"
            width={1200}
            height={1500}
            sizes="(max-width: 900px) 100vw, 50vw"
            priority
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
          protects their work and where to turn when something isn&apos;t right.
        </p>
      </section>
      <Benefits items={content.benefits} />
      <FieldDayStory />
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
            Care isn&apos;t only the finish on a vehicle. It&apos;s how you
            respect a location, frame evidence, handle a concern and keep the
            customer informed.
          </p>
          <div className="craft-rules">
            {workingStandard.map((text, i) => (
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
          <ButtonLink className="public-secondary" href="/trust">
            Read the trust standard
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
        <div className="screening-checklist">
          {screening.map(([title, text], i) => (
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
          <ButtonLink className="primary" href={apply}>
            Introduce yourself
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
      </section>
      <Questions items={content.faq} />
      <Closing
        title="Bring your good hands. Build a better routine."
        description="Start with an application. We'll take the next steps thoughtfully."
        action="Start your application"
        href={apply}
      />
    </>
  )
}
