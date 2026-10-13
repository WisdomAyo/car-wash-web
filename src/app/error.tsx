"use client"

import Button from "@/components/ui/Button"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

/** Route-level error boundary. A reload also clears stale chunks after a new deployment. */
export default function ErrorPage() {
  return (
    <div className="workspace-loading" role="alert">
      <Icon name="help" size={35} />
      <Heading>This page couldn&apos;t load.</Heading>
      <p>
        The connection may have changed, or a new version may be available.
        Reload to get the latest page.
      </p>
      <Button className="primary" onClick={() => window.location.reload()}>
        Reload page <Icon name="arrow" size={18} />
      </Button>
    </div>
  )
}
