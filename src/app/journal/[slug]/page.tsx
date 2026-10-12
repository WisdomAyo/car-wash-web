"use client"

import { use } from "react"
import JournalArticle from "@/views/public/JournalArticle"
import { useAppNavigation } from "@/components/layout/NavigationProvider"

export default function JournalArticleRoute({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = use(params)
  const { navigate } = useAppNavigation()

  return (
    <JournalArticle
      page={`journal/${resolvedParams.slug}`}
      navigate={navigate}
    />
  )
}
