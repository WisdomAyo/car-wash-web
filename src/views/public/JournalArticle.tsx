import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import { journalArticles, type Navigate } from "../../domain/publicContent"

import Journal from "./Journal"

type ArticleProps = {
  page: string
  navigate: Navigate
}
export default function JournalArticle({ page, navigate }: ArticleProps) {
  const article = journalArticles.find(
    (item) => page === `journal/${item.slug}`,
  )
  if (!article) return <Journal navigate={navigate} />
  return (
    <>
      <section className="journal-article">
        <Button
          className="public-secondary"
          onClick={() => navigate("journal")}
        >
          <Icon name="arrow" size={16} />
          Back to the Care Journal
        </Button>
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
            <Heading level={3}>A fresh start, whenever you're ready.</Heading>
            <p>Explore the care that fits your day.</p>
          </div>
          <Button className="secondary" onClick={() => navigate("services")}>
            Explore services
            <Icon name="arrow" size={15} />
          </Button>
        </div>
      </section>
    </>
  )
}
