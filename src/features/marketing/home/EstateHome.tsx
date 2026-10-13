import Heading from "@/components/ui/Typography"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import { Benefits, Closing } from "@/features/marketing/components/HomeSections"
import {
  Journey,
  Questions,
} from "@/features/marketing/components/HomeInteractive"
import ScrollButton from "@/features/marketing/components/ScrollButton"
import { audiences } from "@/features/marketing/content/publicContent"
import NeighbourhoodArt from "@/features/marketing/scenes/NeighbourhoodArt"
import { authHref, workspaceHref } from "@/lib/roles"
import CommunityPerspectives from "./estate/CommunityPerspectives"
import WashWindowPlanner from "./estate/WashWindowPlanner"

const content = audiences.estates
const register = authHref("register", "Estate")

export default function EstateHome() {
  return (
    <>
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
          <ButtonLink className="primary" href={register}>
            Plan your estate wash morning
            <Icon name="arrow" size={19} />
          </ButtonLink>
          <ScrollButton
            className="public-secondary"
            targetId="community-perspectives"
          >
            See every perspective
            <Icon name="chevron" size={18} />
          </ScrollButton>
        </div>
        <NeighbourhoodArt />
      </section>
      <div className="community-promise">
        <Icon name="shield" size={34} />
        <p>
          Respect for your community isn&apos;t an extra.
          <br />
          <strong>It&apos;s where good care begins.</strong>
        </p>
        <span>OUTDOORS ONLY / APPROVED ACCESS / SCREENED PEOPLE</span>
      </div>
      <Benefits items={content.benefits} />
      <CommunityPerspectives />
      <Journey
        steps={content.process}
        title="Make your next wash morning beautifully simple."
      />
      <WashWindowPlanner />
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
          <ButtonLink
            className="public-secondary"
            href={workspaceHref("Estate")}
          >
            Explore the resident-access tools
            <Icon name="arrow" size={18} />
          </ButtonLink>
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
      <Questions items={content.faq} />
      <Closing
        title="A little more care for the place you call home."
        description="Build a wash morning that respects your estate, your residents and everyone's day."
        action="Bring Go-Wash to your estate"
        href={register}
      />
    </>
  )
}
