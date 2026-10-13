import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { journalArticles } from "@/features/marketing/content/publicContent"

type Article = (typeof journalArticles)[number]

export default function JournalArticle({ article }: { article: Article }) {
  return (
    <section className="journal-article">
      <ButtonLink className="public-secondary" href="/journal">
        <Icon name="arrow" size={16} />
        Back to the Care Journal
      </ButtonLink>
      <div className="eyebrow">{article.category} · 3 MIN READ</div>
      <Heading level={1}>{article.title}</Heading>
      <p className="article-lead">{article.intro}</p>
      <div className="article-byline">
        <span className="brand-symbol">
          <Icon name="drop" size={20} />
        </span>
        From the Go-Wash care desk · Product guidance
      </div>
      {article.sections.map(([title, text], i) => (
        <section key={title}>
          <span>0{i + 1}</span>
          <div>
            <Heading>{title}</Heading>
            <p>{text}</p>
          </div>
        </section>
      ))}
      <div className="care-note">
        <Icon name="drop" size={30} />
        <div>
          <Heading level={3}>
            A fresh start, whenever you&apos;re ready.
          </Heading>
          <p>Explore the care that fits your day.</p>
        </div>
        <ButtonLink className="secondary" href="/services">
          Explore services
          <Icon name="arrow" size={15} />
        </ButtonLink>
      </div>
    </section>
  )
}
