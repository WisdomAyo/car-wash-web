import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { journalArticles } from "@/features/marketing/content/publicContent"
import JournalArticle from "@/features/marketing/pages/JournalArticle"

type Params = { params: Promise<{ slug: string }> }

// Every article is known at build time: prerender them all and 404 anything else.
export const dynamicParams = false
export const generateStaticParams = () =>
  journalArticles.map(({ slug }) => ({ slug }))

const findArticle = (slug: string) =>
  journalArticles.find((article) => article.slug === slug)

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = findArticle((await params).slug)
  return article ? { title: article.title, description: article.intro } : {}
}

export default async function JournalArticlePage({ params }: Params) {
  const article = findArticle((await params).slug)
  if (!article) notFound()
  return <JournalArticle article={article} />
}
