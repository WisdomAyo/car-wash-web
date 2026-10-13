import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

type PolicyProps = {
  title: string
  accent: string
  description: string
  sections: ReadonlyArray<readonly [string, string]>
}

/** Shared body for the privacy and terms pages. */
export default function PolicyLayout({
  title,
  accent,
  description,
  sections,
}: PolicyProps) {
  return (
    <>
      <section className="policy-intro">
        <div className="pill-eyebrow">
          <Icon name="shield" size={18} />
          YOUR PEACE OF MIND, IN PLAIN ENGLISH
        </div>
        <Heading level={1}>
          {title}
          <br />
          <em>{accent}</em>
        </Heading>
        <p>{description}</p>
      </section>
      <div className="policy-body">
        <div className="legal-sections">
          {sections.map(([name, text], i) => (
            <section key={name}>
              <small>0{i + 1}</small>
              <div>
                <Heading>{name}</Heading>
                <p>{text}</p>
              </div>
            </section>
          ))}
        </div>
        <aside className="policy-aside">
          <Icon name="shield" size={40} />
          <Heading level={3}>
            Clear boundaries.
            <br />
            Thoughtful care.
          </Heading>
          <p>
            Prototype notices. Final policies, retention schedules and legal
            obligations require review before launch.
          </p>
        </aside>
      </div>
    </>
  )
}
