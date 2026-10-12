import Heading from "./ui/Typography"

export default function PageIntro({
  eyebrow,
  title,
  accent,
  text,
}: {
  eyebrow: string
  title: string
  accent: string
  text: string
}) {
  return (
    <section className="care-page-intro">
      <div className="pill-eyebrow">
        <span />
        {eyebrow}
      </div>
      <Heading level={1}>
        {title}
        <br />
        <em>{accent}</em>
      </Heading>
      <p>{text}</p>
    </section>
  )
}
