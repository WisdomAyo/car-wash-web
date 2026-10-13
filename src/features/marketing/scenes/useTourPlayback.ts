import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { TOUR_DURATION } from "./lagosTour"

const subscribeToTabVisibility = (onChange: () => void) => {
  document.addEventListener("visibilitychange", onChange)
  return () => document.removeEventListener("visibilitychange", onChange)
}

/** Advance by visible playback time, never by time spent in a hidden tab. */
export default function useTourPlayback(
  enabled: boolean,
  visible: boolean,
  loopInitially = false,
) {
  const [elapsed, setElapsed] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [loop, setLoop] = useState(loopInitially)
  // The server has no tab: assume visible, then follow the real value.
  const tabVisible = useSyncExternalStore(
    subscribeToTabVisibility,
    () => !document.hidden,
    () => true,
  )
  const time = useRef(0)
  const running =
    enabled && visible && tabVisible && playing && elapsed < TOUR_DURATION
  useEffect(() => {
    if (!running) return
    let frame = 0
    let previous = performance.now()
    let published = previous
    const advance = (now: number) => {
      time.current = Math.min(
        TOUR_DURATION,
        time.current + Math.max(0, now - previous),
      )
      previous = now
      if (time.current >= TOUR_DURATION) {
        if (loop) {
          time.current = 0
          setElapsed(0)
          published = now
        } else {
          setElapsed(TOUR_DURATION)
          setPlaying(false)
          return
        }
      } else if (now - published >= 80) {
        setElapsed(time.current)
        published = now
      }
      frame = requestAnimationFrame(advance)
    }
    frame = requestAnimationFrame(advance)
    return () => cancelAnimationFrame(frame)
  }, [running, loop])
  const seek = useCallback((next: number) => {
    time.current = Math.max(0, Math.min(TOUR_DURATION, next))
    setElapsed(time.current)
  }, [])
  const toggle = () => {
    if (time.current >= TOUR_DURATION) {
      seek(0)
      setPlaying(true)
    } else setPlaying((current) => !current)
  }
  const replay = () => {
    seek(0)
    setPlaying(true)
  }
  return {
    elapsed,
    running,
    playing,
    loop,
    setLoop,
    seek,
    toggle,
    replay,
    pause: () => setPlaying(false),
  }
}
