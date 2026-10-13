import Heading from "@/components/ui/Typography"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import {
  audiences,
  type AudiencePage,
} from "@/features/marketing/content/publicContent"

/** Static homepage sections. The stateful ones live in HomeInteractive.tsx. */
type Content = (typeof audiences)[AudiencePage]

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

export function Closing({
  title,
  description,
  action,
  href,
}: {
  title: string
  description: string
  action: string
  href: string
}) {
  return (
    <section className="audience-final">
      <div className="eyebrow">YOUR VEHICLE. OUR RESPONSIBILITY.</div>
      <Heading>{title}</Heading>
      <p>{description}</p>
      <ButtonLink className="primary" href={href}>
        {action}
        <Icon name="arrow" size={18} />
      </ButtonLink>
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
