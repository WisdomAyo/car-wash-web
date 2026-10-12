import { useState } from "react"
import PublicLayout from "../../components/PublicLayout"
import VehicleScene from "../../components/VehicleScene"
import Heading from "../../components/ui/Typography"
import Button from "../../components/ui/Button"
import { CarArt, Icon } from "../../components/Visuals"
import { Closing, ProofRibbon } from "../../components/home/HomeSections"
import { careServices, type Navigate } from "../../domain/publicContent"

const dayScenes = [
  {
    name: "At home",
    title: "A fresher morning. No extra errand.",
    text: "Park in an approved outdoor space, choose a window and let your professional take care of the wash while you take care of the day.",
    label: "HOME / APPROVED OUTDOOR PARKING",
    icon: "pin",
  },
  {
    name: "At work",
    title: "You handle the work. We handle the shine.",
    text: "Book around your office parking routine. Confirm access with your location, then review the result without adding a detour to your commute.",
    label: "OFFICE / APPROVED CAR PARK",
    icon: "card",
  },
  {
    name: "In your estate",
    title: "Good care, closer to your community.",
    text: "Use your estate's resident booking link and agreed wash window. Your personal vehicle history and payments stay within your own account.",
    label: "ESTATE / AGREED WASH WINDOW",
    icon: "gift",
  },
] as const
export default function CustomerHome({ navigate }: { navigate: Navigate }) {
  const [scene, setScene] = useState(0)
  const [care, setCare] = useState(1)
  const [faq, setFaq] = useState<number | null>(0)
  const book = () => navigate("auth/register", "Customer")
  const questions = [
    [
      "Do I have to stay beside my car?",
      "No. Leave your vehicle in an approved, accessible outdoor space. Review the result and give your verdict when the care is ready.",
    ],
    [
      "Where can I book?",
      "You can book from any location in Nigeria. Enter your address and choose an available slot for your home, office, estate or fleet parking area.",
    ],
    [
      "What if I'm not pleased?",
      "Choose Treated and not pleased and add a remark to open a quality complaint. If the vehicle wasn't washed, choose Untreated; the job is frozen for operations review.",
    ],
    [
      "Can staff come into my home?",
      "Never. Work takes place only in approved outdoor areas. Staff do not enter private indoor premises or handle personal property.",
    ],
  ]
  return (
    <PublicLayout page="home" navigate={navigate}>
      <section className="customer-home-hero">
        <div>
          <div className="pill-eyebrow">
            <span />
            MOBILE CAR CARE. ACROSS NIGERIA.
          </div>
          <Heading level={1}>
            Your car shines.
            <br />
            Your day <em>stays yours.</em>
          </Heading>
          <p>
            Professional care, right where you park. No queues. No detours. Just
            a beautifully clean car—with the proof to match.
          </p>
          <div className="audience-actions">
            <Button className="primary" onClick={book}>
              Give your car a fresh start
              <Icon name="arrow" size={19} />
            </Button>
            <Button
              className="public-secondary"
              onClick={() =>
                document
                  .getElementById("customer-how")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              See how it works
              <Icon name="chevron" size={18} />
            </Button>
          </div>
          <div className="customer-hero-signature">
            <Icon name="shield" size={25} />
            <span>
              Your vehicle. Our responsibility.
              <small>Screened people · Outdoor care · Three proofs</small>
            </span>
          </div>
        </div>
        <VehicleScene />
      </section>
      <ProofRibbon />
      <section className="customer-day-story">
        <div className="home-editorial-heading">
          <div className="eyebrow">CARE THAT FITS INTO YOUR LIFE</div>
          <Heading>
            Your day doesn't need
            <br />
            another detour.
          </Heading>
          <p>
            Home, office or estate—good care should meet your routine, not
            interrupt it.
          </p>
        </div>
        <div className="day-story-layout">
          <div>
            <div
              className="day-location-tabs"
              role="group"
              aria-label="Where your care happens"
            >
              {dayScenes.map((item, i) => (
                <Button
                  key={item.name}
                  aria-pressed={scene === i}
                  className={scene === i ? "selected" : ""}
                  onClick={() => setScene(i)}
                >
                  <Icon name={item.icon} size={23} />
                  {item.name}
                </Button>
              ))}
            </div>
            <div className="day-story-copy" key={scene}>
              <Heading>{dayScenes[scene].title}</Heading>
              <p>{dayScenes[scene].text}</p>
              <Button
                className="public-secondary"
                onClick={() => navigate("coverage")}
              >
                See where we wash
                <Icon name="arrow" size={18} />
              </Button>
            </div>
          </div>
          <div className={`day-parking-art scene-${scene}`}>
            <div className="parking-architecture">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="parking-bay">
              <CarArt silver={scene === 1} />
            </div>
            <div className="parking-pin">
              <Icon name={dayScenes[scene].icon} size={26} />
            </div>
            <small>{dayScenes[scene].label}</small>
          </div>
        </div>
      </section>
      <section className="customer-how" id="customer-how">
        <div className="eyebrow">A LITTLE LESS FRICTION</div>
        <Heading>From first tap to final shine.</Heading>
        <div className="customer-how-grid">
          {[
            [
              "car",
              "Tell us about your car",
              "Register its plate, choose the care, location and available window.",
            ],
            [
              "shield",
              "Meet your professional",
              "Dispatch assigns a screened washman. Review their verified Trust Card.",
            ],
            [
              "drop",
              "Keep your plans",
              "We arrive, match the plate and care for your car in the approved outdoor area.",
            ],
            [
              "check",
              "Have the final say",
              "Review the result, record your TREATED verdict and keep a Wash Passport.",
            ],
          ].map(([icon, title, text], i) => (
            <article key={title}>
              <span>0{i + 1}</span>
              <Icon name={icon as "car"} size={30} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="customer-care-selector">
        <div>
          <div className="eyebrow">YOUR EVERYDAY CLEAN. OR THE WHOLE GLOW.</div>
          <Heading>
            A little attention.
            <br />
            Exactly where it matters.
          </Heading>
          <p>
            Choose an illustrative sedan service to explore what's included.
            Final vehicle pricing and availability are confirmed during booking.
          </p>
          <div className="care-selector-tabs">
            {careServices.map((s, i) => (
              <Button
                key={s.name}
                className={care === i ? "selected" : ""}
                aria-pressed={care === i}
                onClick={() => setCare(i)}
              >
                <span>0{i + 1}</span>
                {s.name}
                <Icon name="arrow" size={18} />
              </Button>
            ))}
          </div>
        </div>
        <div className="customer-care-preview" key={care}>
          <div className="eyebrow">{careServices[care].tag}</div>
          <Heading>{careServices[care].name}</Heading>
          <p>{careServices[care].text}</p>
          <div className="care-price">
            <strong>₦{careServices[care].price}</strong>
            <span>/ sedan wash</span>
          </div>
          {careServices[care].items.map((item) => (
            <div className="audience-feature-item" key={item}>
              <Icon name="check" size={19} />
              {item}
            </div>
          ))}
          <Button className="primary full" onClick={book}>
            Choose your care
            <Icon name="arrow" size={18} />
          </Button>
          <small>Illustrative launch pricing · {careServices[care].time}</small>
        </div>
      </section>
      <section className="customer-trust-story">
        <div className="trust-story-visual">
          <div className="trust-story-ring" />
          <span className="trust-story-shield">
            <Icon name="shield" size={80} />
          </span>
          {[
            ["pin", "GPS trail"],
            ["car", "Plate matched twice"],
            ["check", "Your TREATED verdict"],
          ].map(([icon, title], i) => (
            <span className={`trust-story-label label-${i}`} key={title}>
              <Icon name={icon as "pin"} size={22} />
              {title}
              <Icon name="check" size={16} />
            </span>
          ))}
        </div>
        <div>
          <div className="eyebrow">NOT JUST CLEAN. PROVEN.</div>
          <Heading>
            Peace of mind.
            <br />
            With a paper trail.
          </Heading>
          <p>
            Your wash belongs to your vehicle, your location and your own
            confirmation. No single signal can tell the whole story—that's why
            we require three.
          </p>
          <div className="audience-feature-item">
            <Icon name="check" />
            Location tracking limited to assigned work
          </div>
          <div className="audience-feature-item">
            <Icon name="check" />
            Registered plate checked before and after
          </div>
          <div className="audience-feature-item">
            <Icon name="check" />
            Your verdict before normal closure
          </div>
          <Button
            className="public-secondary"
            onClick={() => navigate("trust")}
          >
            Inside our trust standard
            <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>
      <section className="customer-passport-story">
        <div>
          <div className="eyebrow">A GOOD ROUTINE LEAVES A RECORD</div>
          <Heading>
            Your car's care story.
            <br />
            Beautifully connected.
          </Heading>
          <p>
            A Wash Passport keeps verified care linked to the registered
            vehicle. Return to its history, review outcomes and build a routine
            without relying on memory.
          </p>
          <Button
            className="primary"
            onClick={() => navigate("workspace/customer", "Customer")}
          >
            Explore your sample workspace
            <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="care-history-art">
          <div className="care-history-header">
            <Icon name="shield" size={25} />
            <span>
              THE WASH PASSPORT<small>Illustrated care history</small>
            </span>
          </div>
          {[
            ["01", "Vehicle identity", "Registered number plate"],
            ["02", "Service & evidence", "Job-linked location and plate scans"],
            ["03", "Your confirmation", "Recorded customer verdict"],
          ].map(([number, title, text]) => (
            <div className="care-history-event" key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <small>{text}</small>
              </div>
              <Icon name="check" size={17} />
            </div>
          ))}
          <p>Sample record only · No live job evidence</p>
        </div>
      </section>
      <section className="customer-audiences">
        <div className="eyebrow">ONE PROMISE. EVERY SCALE.</div>
        <Heading>
          One car. A whole fleet.
          <br />
          An entire community.
        </Heading>
        <div className="customer-audience-links">
          {[
            [
              "business",
              "Corporate care",
              "Many vehicles. One account. Full visibility.",
            ],
            [
              "estates",
              "Estate wash mornings",
              "Approved teams. Agreed windows. Thoughtful boundaries.",
            ],
            [
              "careers",
              "A career in care",
              "Professional standards. Work to stand behind.",
            ],
          ].map(([url, title, text]) => (
            <Button key={url} onClick={() => navigate(url)}>
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
              <Icon name="arrow" size={23} />
            </Button>
          ))}
        </div>
      </section>
      <section className="audience-faq">
        <div>
          <div className="eyebrow">A LITTLE CLARITY</div>
          <Heading>
            Good questions.
            <br />
            Clear answers.
          </Heading>
          <Button
            className="public-secondary"
            onClick={() => navigate("contact")}
          >
            Talk to our team
            <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="faq-list">
          {questions.map(([question, answer], i) => (
            <div key={question}>
              <Button
                aria-expanded={faq === i}
                onClick={() => setFaq(faq === i ? null : i)}
              >
                {question}
                <Icon name={faq === i ? "close" : "plus"} size={18} />
              </Button>
              {faq === i && <p>{answer}</p>}
            </div>
          ))}
        </div>
      </section>
      <Closing
        title="A clean car. A little more freedom."
        description="Let us take care of the shine. You take care of your day."
        action="Let's make it a fresh start"
        onClick={book}
      />
    </PublicLayout>
  )
}
