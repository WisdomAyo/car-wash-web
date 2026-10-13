"use client"

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import Button from "./ui/Button"
import { Icon } from "./Visuals"

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)"
const subscribeToReducedMotion = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_MOTION)
  media.addEventListener("change", onChange)
  return () => media.removeEventListener("change", onChange)
}

const MotionContext = createContext({ enabled: true, toggle: () => {} })
export const useMotion = () => useContext(MotionContext)

/** The single owner of decorative-animation preferences (system setting + manual pause). */
export default function MotionProvider({ children }: { children: ReactNode }) {
  // Server and first client render assume motion is allowed, then follow the system setting.
  const systemReduced = useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  )
  const [paused, setPaused] = useState(false)
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

/**
 * Fades its content in when `transitionKey` changes. Key only the visual wrapper, never
 * the screen: page state survives transitions. `animateOnMount={false}` skips the entrance
 * on first render so server-rendered content never flashes.
 */
export function PageTransition({
  transitionKey,
  animateOnMount = true,
  children,
}: {
  transitionKey: string
  animateOnMount?: boolean
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const mounted = useRef(false)
  const { enabled } = useMotion()
  useEffect(() => {
    const firstRun = !mounted.current
    mounted.current = true
    if (firstRun && !animateOnMount) return
    if (!enabled || !ref.current) return
    const animation = ref.current.animate(
      [
        { opacity: 0, transform: "translateY(12px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 380, easing: "cubic-bezier(.22,1,.36,1)" },
    )
    return () => animation.cancel()
  }, [transitionKey, enabled, animateOnMount])
  return (
    <div ref={ref} className="page-transition">
      {children}
    </div>
  )
}
