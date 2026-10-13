import type { ReactNode } from "react"
import Brand from "@/components/Brand"
import ButtonLink from "@/components/ui/ButtonLink"
import { CarArt, Icon } from "@/components/Visuals"

/** The two-column sign-in layout: the story on the left, whatever form is needed on the right. */
export default function AuthFrame({
  eyebrow,
  title,
  description,
  children,
  topLink,
}: {
  eyebrow: string
  title: string
  description?: string
  children: ReactNode
  /** The "New to Go-Wash? Get started" link at the top right. */
  topLink?: { text: string; label: string; href: string }
}) {
  return (
    <div className="auth-page">
      <div className="auth-story">
        <Brand light />
        <div className="auth-story-content">
          <div className="pill-eyebrow">
            <span /> CARE THAT MEETS YOU WHERE YOU PARK
          </div>
          <h2>
            Five ways to move.
            <br />
            One calmer way
            <br /> to <em>stay fresh.</em>
          </h2>
          <p>
            Professional mobile car washing for homes, offices and approved
            outdoor spaces across Nigeria.
          </p>
          <div className="auth-car" aria-label="Five vehicle illustrations">
            <div className="auth-car-rail">
              <div className="auth-car-loop">
                <CarArt variant="suv" finish="emerald" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="pickup" finish="bronze" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="sedan" finish="silver" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="coupe" finish="sunset" />
              </div>
              <div className="auth-car-loop">
                <CarArt variant="jeep" finish="midnight" />
              </div>
            </div>
          </div>
          <div className="auth-story-proof">
            <Icon name="shield" size={20} />
            <span>
              Every wash has a clear record.
              <small>GPS tracked · Plate matched · You confirm</small>
            </span>
          </div>
        </div>
        <div className="auth-story-bottom">
          <span>HOME · OFFICE · ESTATE</span>
          <span>AVAILABLE ACROSS NIGERIA</span>
        </div>
      </div>
      <div className="auth-content">
        <div className="auth-content-brand">
          <Brand />
        </div>
        <div className="auth-top">
          <ButtonLink href="/">
            <Icon name="arrow" size={15} /> Back to Go-Wash
          </ButtonLink>
          {topLink && (
            <span>
              {topLink.text} <ButtonLink href={topLink.href}>{topLink.label}</ButtonLink>
            </span>
          )}
        </div>
        <div className="auth-form-wrap">
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p className="auth-description">{description}</p>}
          {children}
          <div className="auth-security">
            <Icon name="shield" size={15} /> Your details, treated with care.
          </div>
        </div>
        <div className="auth-bottom">
          Need a hand? <ButtonLink href="/contact">Talk to our team</ButtonLink>
          <span>Clean, proven, calm.</span>
        </div>
      </div>
    </div>
  )
}
