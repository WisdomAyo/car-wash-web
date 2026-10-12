import { useState } from "react"
import PublicLayout from "../../components/PublicLayout"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import NeighbourhoodArt from "../../components/home/NeighbourhoodArt"
import {
  Benefits,
  Journey,
  Questions,
  Closing,
} from "../../components/home/HomeSections"
import { audiences, type Navigate } from "../../domain/publicContent"

export default function EstateHome({ navigate }: { navigate: Navigate }) {
  const content = audiences.estates
  const [window, setWindow] = useState("Morning")
  const [view, setView] = useState("Residents")
  const register = () => navigate("auth/register", "Estate")
  const perspectives = {
    Residents: [
      "A fresh start, close to home.",
      "Book through your estate link, leave your car in the approved outdoor space and review the result in your own account.",
      "Your private payment and vehicle records stay private.",
    ],
    Security: [
      "A clear handover at the gate.",
      "Know the named, screened staff scheduled for the estate run and follow the agreed access procedure.",
      "No unapproved entry. No private indoor work.",
    ],
    Managers: [
      "A little coordination. A calmer community.",
      "Agree wash windows, review aggregate activity and flag incidents without opening residents' private care records.",
      "Community visibility, with thoughtful boundaries.",
    ],
  } as const
  const detail = perspectives[(view as keyof typeof perspectives)]
  return (
    <PublicLayout page="estates" navigate={navigate} role="Estate">
      <section className="estate-home-hero">
        <div className="pill-eyebrow">GO-WASH FOR COMMUNITIES</div>
        <Heading level={1}>
          A fresher morning.
          <br />
          <em>For your whole estate.</em>
        </Heading>
        <p>
          A thoughtful wash morning begins before the first car. Agreed spaces,
          a named team and care that fits the way your community lives.
        </p>
        <div className="estate-hero-actions">
          <Button className="primary" onClick={register}>
            Plan your estate wash morning
            <Icon name="arrow" size={19} />
          </Button>
          <Button
            className="public-secondary"
            onClick={() =>
              document
                .getElementById("community-perspectives")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            See every perspective
            <Icon name="chevron" size={18} />
          </Button>
        </div>
        <NeighbourhoodArt />
      </section>
      <div className="community-promise">
        <Icon name="shield" size={34} />
        <p>
          Respect for your community isn't an extra.
          <br />
          <strong>It's where good care begins.</strong>
        </p>
        <span>OUTDOORS ONLY / APPROVED ACCESS / SCREENED PEOPLE</span>
      </div>
      <Benefits items={content.benefits} />
      <section className="community-perspectives" id="community-perspectives">
        <div className="home-editorial-heading">
          <div className="eyebrow">A COMMUNITY IS MORE THAN A CAR PARK</div>
          <Heading>
            One wash morning.
            <br />
            Three thoughtful perspectives.
          </Heading>
        </div>
        <div
          className="community-tabs"
          role="group"
          aria-label="Community perspectives"
        >
          {Object.keys(perspectives).map((name) => (
            <Button
              key={name}
              className={view === name ? "selected" : ""}
              aria-pressed={view === name}
              onClick={() => setView(name)}
            >
              {name}
              <Icon name="arrow" size={18} />
            </Button>
          ))}
        </div>
        <div className="community-detail" key={view}>
          <span className="community-detail-symbol">
            <Icon
              name={
                view === "Security"
                  ? "shield"
                  : view === "Managers"
                    ? "grid"
                    : "car"
              }
              size={70}
            />
          </span>
          <div>
            <Heading>{detail[0]}</Heading>
            <p>{detail[1]}</p>
            <span>
              <Icon name="check" size={19} />
              {detail[2]}
            </span>
          </div>
        </div>
      </section>
      <Journey
        steps={content.process}
        title="Make your next wash morning beautifully simple."
      />
      <section className="estate-window-planner">
        <div>
          <div className="eyebrow">PLAN A LITTLE. RELAX A LOT.</div>
          <Heading>Care on your community's clock.</Heading>
          <p>
            Preview an illustrative wash window. Actual times, access
            arrangements and capacity require operations approval.
          </p>
          <div className="planner-tabs">
            {["Morning", "Afternoon"].map((name) => (
              <Button
                key={name}
                aria-pressed={window === name}
                className={window === name ? "selected" : ""}
                onClick={() => setWindow(name)}
              >
                {name}
              </Button>
            ))}
          </div>
          <Button className="primary" onClick={register}>
            Discuss a wash window
            <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="estate-window-preview">
          <div className="eyebrow">SAMPLE ESTATE RUN</div>
          <div className="window-sun">
            <Icon name="clock" size={46} />
          </div>
          <Heading>
            {window === "Morning" ? "08:00 — 12:00" : "13:00 — 17:00"}
          </Heading>
          <p>
            {window === "Morning"
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
      <section className="resident-invitation">
        <div>
          <div className="eyebrow">A GOOD MORNING IS WORTH SHARING</div>
          <Heading>
            Invite residents.
            <br />
            Keep the details clear.
          </Heading>
          <p>
            Your estate booking link brings residents to their own care
            experience. Share the approved areas, agreed prices and wash
            window—not a spreadsheet of private data.
          </p>
          <Button
            className="public-secondary"
            onClick={() => navigate("workspace/estate", "Estate")}
          >
            Explore the resident-access tools
            <Icon name="arrow" size={18} />
          </Button>
        </div>
        <div className="invitation-paper">
          <span className="invitation-logo">
            <Icon name="drop" size={30} />
          </span>
          <div className="eyebrow">A NOTE TO YOUR COMMUNITY</div>
          <Heading level={3}>A fresher wash morning is on its way.</Heading>
          <p>
            Book your care. Park in the approved area. Keep your morning yours.
          </p>
          <div>
            <Icon name="pin" size={20} />
            Outdoor parking only
          </div>
          <div>
            <Icon name="shield" size={20} />
            Screened, assigned professionals
          </div>
          <small>
            Sample resident notice · Final details agreed by operations
          </small>
        </div>
      </section>
      <Questions items={content.faq} navigate={navigate} />
      <Closing
        title="A little more care for the place you call home."
        description="Build a wash morning that respects your estate, your residents and everyone's day."
        action="Bring Go-Wash to your estate"
        onClick={register}
      />
    </PublicLayout>
  )
}
