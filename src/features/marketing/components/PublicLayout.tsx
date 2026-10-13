import type { ReactNode } from "react"
import Brand from "@/components/Brand"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon, type IconName } from "@/components/Visuals"
import { publicLinks } from "@/features/marketing/content/publicContent"
import PublicHeader from "./PublicHeader"

const footerGroups = [
  {
    title: "Your kind of care",
    links: publicLinks.slice(0, 4),
  },
  {
    title: "A little clarity",
    links: [
      { href: "/services", label: "Services & pricing" },
      { href: "/coverage", label: "Where we wash" },
      { href: "/trust", label: "Our trust standard" },
      { href: "/journal", label: "The Care Journal" },
    ],
  },
  {
    title: "Go-Wash",
    links: [
      { href: "/contact", label: "Talk to our team" },
      { href: "/operations", label: "Operations home" },
      { href: "/privacy", label: "Privacy & data" },
      { href: "/terms", label: "Service terms" },
    ],
  },
]

const explorePages: {
  href: string
  icon: IconName
  title: string
  label: string
}[] = [
  {
    href: "/services",
    icon: "drop",
    title: "Find your kind of clean",
    label: "Explore services & pricing",
  },
  {
    href: "/coverage",
    icon: "pin",
    title: "Care across Nigeria",
    label: "See where we wash",
  },
  {
    href: "/trust",
    icon: "shield",
    title: "Nothing left to guesswork",
    label: "Inside the trust standard",
  },
  {
    href: "/journal",
    icon: "star",
    title: "A little everyday inspiration",
    label: "Read the Care Journal",
  },
]

/** The public site chrome. Server-rendered; only the header is interactive. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="public-site editorial-site">
      <div className="announcement">
        <Icon name="shield" size={13} />
        Your vehicle. Our responsibility.<span>Made for Nigeria.</span>
      </div>
      <PublicHeader />
      <main className="public-main">
        {children}
        <ExplorePages />
      </main>
      <footer className="editorial-footer">
        <div>
          <Brand />
          <p>
            Your vehicle. Our responsibility.
            <br />A fresher way to move across Nigeria.
          </p>
          <small>Interactive prototype · Not a live service.</small>
        </div>
        {footerGroups.map(({ title, links }) => (
          <div key={title}>
            <Heading level={4}>{title}</Heading>
            {links.map(({ href, label }) => (
              <ButtonLink key={href} href={href}>
                {label}
              </ButtonLink>
            ))}
          </div>
        ))}
      </footer>
    </div>
  )
}

export function ExplorePages() {
  return (
    <section className="explore-editorial">
      <div>
        <div className="eyebrow">THERE&apos;S MORE TO GOOD CARE</div>
        <Heading>Get to know your Go-Wash.</Heading>
      </div>
      <div className="editorial-link-grid">
        {explorePages.map(({ href, icon, title, label }) => (
          <ButtonLink key={href} href={href}>
            <Icon name={icon} size={24} />
            <strong>{title}</strong>
            <span>
              {label}
              <Icon name="arrow" size={15} />
            </span>
          </ButtonLink>
        ))}
      </div>
    </section>
  )
}
