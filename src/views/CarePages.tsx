import PublicLayout from "../components/PublicLayout"
import type { Navigate } from "../domain/publicContent"
import Services from "./public/Services"
import Coverage from "./public/Coverage"
import Trust from "./public/Trust"
import Journal from "./public/Journal"
import JournalArticle from "./public/JournalArticle"

export default function CarePages({
  page,
  navigate,
}: {
  page: string
  navigate: Navigate
}) {
  return (
    <PublicLayout page={page} navigate={navigate}>
      {page === "services" ? (
        <Services navigate={navigate} />
      ) : page === "coverage" ? (
        <Coverage navigate={navigate} />
      ) : page === "trust" ? (
        <Trust navigate={navigate} />
      ) : page.startsWith("journal/") ? (
        <JournalArticle page={page} navigate={navigate} />
      ) : (
        <Journal navigate={navigate} />
      )}
    </PublicLayout>
  )
}
