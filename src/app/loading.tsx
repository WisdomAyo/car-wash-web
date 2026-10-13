import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

export default function Loading() {
  return (
    <div className="workspace-loading" role="status">
      <Icon name="drop" size={35} />
      <Heading>A little clarity is on its way.</Heading>
      <p>Opening your Go-Wash workspace…</p>
    </div>
  )
}
