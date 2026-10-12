import { useEffect } from "react"

/** Modal navigation behavior without relocating workspace state owners. */
export default function useDismissiblePanel(
  open: boolean,
  onClose: () => void,
  selector: string,
) {
  useEffect(() => {
    if (!open) return
    const panel = document.querySelector<HTMLElement>(selector)
    if (!panel) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const controls = () =>
      [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input, select, textarea, [tabindex="0"]',
        ),
      ].filter((element) => element.getClientRects().length > 0)
    controls()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
      if (event.key !== "Tab") return
      const items = controls()
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener("keydown", onKey)
      previous?.focus()
    }
  }, [open, onClose, selector])
}
