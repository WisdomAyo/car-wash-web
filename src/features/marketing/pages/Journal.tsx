import Image from "next/image"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import PageIntro from "@/features/marketing/components/PageIntro"
import { Icon } from "@/components/Visuals"
import { journalArticles } from "@/features/marketing/content/publicContent"

const cardIcons = ["shield", "pin", "drop"] as const

export default function Journal() {
  return (
    <>
      <PageIntro
        eyebrow="THE CARE JOURNAL"
        title="A little care."
        accent="A clearer perspective."
        text="Thoughtful reads on vehicle care, better wash mornings and the proof behind our promise. Useful ideas for the road ahead."
      />
      <section className="journal-feature">
        <div className="journal-photo">
          <Image
            src="/images/care-journal.jpg"
            alt="A grey vehicle covered in soap during a wash"
            width={1200}
            height={1800}
            sizes="(max-width: 900px) 100vw, 55vw"
          />
          <small>Photo by mintosko / Unsplash · Editorial imagery</small>
        </div>
        <div>
          <div className="eyebrow">THE GO-WASH STANDARD · 3 MIN READ</div>
          <Heading>
            Clean is good.
            <br />
            Knowing is better.
          </Heading>
          <p>
            What a GPS trail, two plate scans and your own verdict tell us about
            every wash.
          </p>
          <ButtonLink className="public-secondary" href="/journal/three-proofs">
            Read the story
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </div>
      </section>
      <section className="journal-grid">
        {journalArticles.map((item, i) => (
          <article key={item.slug}>
            <div className={`journal-card-art journal-art-${i}`}>
              <Icon name={cardIcons[i]} size={70} />
              <span>0{i + 1}</span>
            </div>
            <div className="eyebrow">{item.category}</div>
            <Heading level={3}>{item.title}</Heading>
            <p>{item.intro}</p>
            <ButtonLink
              className="public-secondary"
              href={`/journal/${item.slug}`}
            >
              Take a little read
              <Icon name="arrow" size={16} />
            </ButtonLink>
          </article>
        ))}
      </section>
    </>
  )
}
