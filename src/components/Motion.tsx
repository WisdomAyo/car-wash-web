import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import Button from "./ui/Button"
import { Icon } from "./Visuals"

const MotionContext = createContext({ enabled: true, toggle: () => {} })
export const useMotion = () => useContext(MotionContext)

export default function MotionProvider({ children }: { children: ReactNode }) {
  const [systemReduced, setSystemReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  )
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setSystemReduced(media.matches)
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])
  const enabled = !systemReduced && !paused
  return (
    <MotionContext.Provider
      value={{ enabled, toggle: () => setPaused(!paused) }}
    >
      <div className="motion-root" data-motion={enabled ? "on" : "off"}>
        {children}
        <Button
          className="motion-toggle"
          aria-label={
            paused
              ? "Resume decorative animation"
              : "Pause decorative animation"
          }
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
          title={
            systemReduced
              ? "Your reduced-motion preference is respected"
              : "Animation settings"
          }
        >
          <Icon name={enabled ? "clock" : "check"} size={14} />
          {systemReduced
            ? "Reduced motion"
            : paused
              ? "Motion paused"
              : "Pause motion"}
        </Button>
      </div>
    </MotionContext.Provider>
  )
}

/** Key only the visual wrapper, never the screen: page state survives transitions. */
export function PageTransition({
  transitionKey,
  children,
}: {
  transitionKey: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled } = useMotion()
  useEffect(() => {
    if (!enabled || !ref.current) return
    const animation = ref.current.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" },
    )
    return () => animation.cancel()
  }, [transitionKey, enabled])
  return (
    <div ref={ref} className="page-transition">
      {children}
    </div>
  )
}
