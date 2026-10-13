import Button from "@/components/ui/Button"
import { Icon } from "./Visuals"
import { createPortal } from "react-dom"

export default function SidebarControls({ onClose }: { onClose: () => void }) {
  return (
    <>
      {createPortal(
        <Button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={onClose}
          tabIndex={-1}
        />,
        document.body,
      )}
      <Button
        className="sidebar-dismiss"
        aria-label="Close navigation"
        onClick={onClose}
      >
        <Icon name="close" />
      </Button>
    </>
  )
}
