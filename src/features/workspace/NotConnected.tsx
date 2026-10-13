import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { workspaceHref } from "@/lib/roles"

/**
 * Shown where a screen needs a backend that is not connected yet (accounts and staff workspaces).
 * Replace it with the real screen once the Go-Wash API is wired in.
 */
export default function NotConnected({ title }: { title: string }) {
  return (
    <div className="workspace-loading">
      <Icon name="shield" size={35} />
      <div className="eyebrow">NOT CONNECTED YET</div>
      <Heading>{title}</Heading>
      <p>
        This area opens once Go-Wash accounts are connected. The public site and
        the sample workspaces keep working in the meantime.
      </p>
      <div className="audience-actions">
        <ButtonLink className="primary" href="/">
          Back to Go-Wash <Icon name="arrow" size={18} />
        </ButtonLink>
        <ButtonLink className="secondary" href={workspaceHref("Customer")}>
          Explore the sample workspace
        </ButtonLink>
      </div>
    </div>
  )
}
