import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import PageIntro from "../../components/PageIntro"
import { Icon } from "../../components/Visuals"
import { journalArticles, type Navigate } from "../../domain/publicContent"

export default function Journal({ navigate }: { navigate: Navigate }) {
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
          <img
            src="/images/care-journal.jpg"
            alt="A grey vehicle covered in soap during a wash"
            loading="lazy"
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
          <Button
            className="public-secondary"
            onClick={() => navigate("journal/three-proofs")}
          >
            Read the story
            <Icon name="arrow" size={18} />
          </Button>
        </div>
      </section>
      <section className="journal-grid">
        {journalArticles.map((item, i) => (
          <article key={item.slug}>
            <div className={`journal-card-art journal-art-${i}`}>
              <Icon
                name={i === 0 ? "shield" : i === 1 ? "pin" : "drop"}
                size={70}
              />
              <span>0{i + 1}</span>
            </div>
            <div className="eyebrow">{item.category}</div>
            <Heading level={3}>{item.title}</Heading>
            <p>{item.intro}</p>
            <Button
              className="public-secondary"
              onClick={() => navigate(`journal/${item.slug}`)}
            >
              Take a little read
              <Icon name="arrow" size={16} />
            </Button>
          </article>
        ))}
      </section>
    </>
  )
}
