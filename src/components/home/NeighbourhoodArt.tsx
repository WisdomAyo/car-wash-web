import { useId } from "react"
import { CarArt } from "../Visuals"

/** Architectural illustration; deliberately not a geographic or evidence map. */
export default function NeighbourhoodArt() {
  const id = useId()
  return (
    <div className="neighbourhood-art">
      <svg
        viewBox="0 0 1100 420"
        role="img"
        aria-label="Illustration of landscaped outdoor parking and a modern estate"
      >
        <defs>
          <linearGradient id={`${id}-sky`} x2="0" y2="1">
            <stop stopColor="var(--public-paper)" />
            <stop offset="1" stopColor="var(--public-water)" />
          </linearGradient>
          <linearGradient id={`${id}-building`} x2="1" y2="1">
            <stop stopColor="var(--scene-paper)" />
            <stop offset="1" stopColor="var(--scene-city)" />
          </linearGradient>
        </defs>
        <path d="M0 0h1100v420H0z" fill={`url(#${id}-sky)`} />
        <circle
          cx="825"
          cy="84"
          r="46"
          fill="var(--public-white)"
          opacity=".75"
        />
        <path
          d="M0 260 270 210l540 9 290 45v156H0z"
          fill="var(--public-border)"
        />
        <path
          d="m0 330 1100-42v70L0 406Z"
          fill="var(--scene-city)"
          opacity=".38"
        />
        <path
          d="m50 365 1000-37"
          stroke="var(--public-white)"
          strokeWidth="3"
          strokeDasharray="28 22"
        />
        {[90, 370, 650].map((x, i) => (
          <g key={x}>
            <path
              d={`m${x} 250 0-130 130-42 0 175Z`}
              fill={`url(#${id}-building)`}
            />
            <path
              d={`m${x + 130} 78 107 42v135l-107-2Z`}
              fill="var(--scene-city)"
            />
            <path
              d={`m${x - 9} 119 138-48 116 48-107 42Z`}
              fill="var(--public-white)"
            />
            {[0, 1, 2].map((w) => (
              <g key={w}>
                <path
                  d={`m${x + 20 + w * 34} ${142 - w * 11} 0 31 21-7 0-31Z`}
                  fill="var(--navy)"
                  opacity=".65"
                />
                <path
                  d={`m${x + 152 + w * 23} 149 0 31 15 3 0-31Z`}
                  fill="var(--navy)"
                  opacity=".55"
                />
              </g>
            ))}
            <path d={`m${x + 65} 255v-52l30-8v59Z`} fill="var(--navy)" />
            <path
              d={`m${x + 154} 217 67 10v26l-67-2Z`}
              fill="var(--scene-paper)"
            />
            <text x={x + 148} y="207" fontSize="12" fill="var(--navy)">
              0{i + 1}
            </text>
          </g>
        ))}
        {[50, 325, 590, 958, 1030].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} 282v-74`}
              stroke="var(--public-text)"
              strokeWidth="5"
            />
            <ellipse
              cx={x}
              cy={185 - (i % 2) * 12}
              rx="24"
              ry="44"
              fill="var(--scene-city)"
            />
            <path
              d={`M${x} 250v-51`}
              stroke="var(--public-paper)"
              strokeWidth="2"
            />
          </g>
        ))}
        <path
          d="M960 280v-139h47"
          fill="none"
          stroke="var(--public-text)"
          strokeWidth="3"
        />
        <path d="M1007 137h17v8h-17Z" fill="var(--public-white)" />
      </svg>
      <div className="neighbourhood-car">
        <CarArt silver />
      </div>
      <span className="neighbourhood-caption">
        APPROVED OUTDOOR SPACES / AN ILLUSTRATED WASH MORNING
      </span>
    </div>
  )
}
