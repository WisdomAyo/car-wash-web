import { useEffect, useRef, useState, type CSSProperties } from "react"
import { useMotion } from "../Motion"
import LagosBackdrop from "./LagosBackdrop"
import CarWashScene from "./CarWashScene"
import useTourPlayback from "../../hooks/useTourPlayback"
import { lagosTour, tourFrame, tourShotStart } from "../../domain/lagosTour"

export default function LagosFilm() {
  const ref = useRef<HTMLDivElement>(null)
  const { enabled } = useMotion()
  const [visible, setVisible] = useState(true)
  const tour = useTourPlayback(enabled, visible, true)
  const { index, progress } = tourFrame(tour.elapsed)
  const shot = lagosTour[index]

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) =>
        setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15),
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const advance = (direction = 1) => {
    tour.seek(
      tourShotStart((index + direction + lagosTour.length) % lagosTour.length),
    )
  }

  return (
    <div
      className="lagos-film lagos-hero"
      ref={ref}
      data-light={shot.light}
      data-running={tour.running ? "yes" : "no"}
    >
      <div
        className="lagos-film-screen"
        role="button"
        tabIndex={0}
        aria-label="20-second illustrated Lagos and car-washing film. Activate or use arrow keys to advance scenes."
        onClick={() => advance()}
        onKeyDown={(event) => {
          if (["Enter", " ", "ArrowRight", "ArrowLeft"].includes(event.key)) {
            event.preventDefault()
            advance(event.key === "ArrowLeft" ? -1 : 1)
          }
        }}
        onPointerMove={(event) => {
          if (!tour.running || !window.matchMedia("(pointer: fine)").matches)
            return
          const bounds = event.currentTarget.getBoundingClientRect()
          event.currentTarget.style.setProperty(
            "--film-pointer-x",
            `${((event.clientX - bounds.left) / bounds.width - 0.5) * 1.2}%`,
          )
        }}
        onPointerLeave={(event) =>
          event.currentTarget.style.removeProperty("--film-pointer-x")
        }
      >
        {lagosTour.map((frame, i) => (
          <div
            className={`lagos-film-shot film-shot-${frame.location} film-kind-${frame.kind}`}
            data-active={index === i ? "yes" : "no"}
            aria-hidden={index !== i}
            key={`${frame.location}-${frame.kind}`}
            style={
              {
                "--camera-scale": 1.025 + (index === i ? progress : 1) * 0.055,
                "--camera-x": `${-0.8 + (index === i ? progress : 1) * 1.6}%`,
                "--care-progress": index === i ? progress : 1,
              } as CSSProperties
            }
          >
            <div className="film-camera">
              {frame.kind === "landmark" ? (
                <LagosBackdrop location={frame.location} cinematic />
              ) : (
                <CarWashScene setting={frame.kind} />
              )}
            </div>
          </div>
        ))}
        <div className="film-vignette" />
      </div>
    </div>
  )
}
