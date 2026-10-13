import type { Metadata } from "next"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

export const metadata: Metadata = { title: "Page not found" }

export default function NotFound() {
  return (
    <div className="workspace-loading">
      <Icon name="pin" size={35} />
      <Heading>We couldn&apos;t find that page.</Heading>
      <p>The link may be out of date, or the page may have moved.</p>
      <ButtonLink className="primary" href="/">
        Back to Go-Wash <Icon name="arrow" size={18} />
      </ButtonLink>
    </div>
  )
}
