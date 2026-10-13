import { useId } from "react"

export type IconName =
  | "grid"
  | "car"
  | "calendar"
  | "shield"
  | "card"
  | "gift"
  | "help"
  | "arrow"
  | "pin"
  | "clock"
  | "check"
  | "plus"
  | "bell"
  | "chevron"
  | "drop"
  | "star"
  | "close"
  | "logout"

type IconProps = {
  name: IconName
  size?: number
}

export function Icon({ name, size = 20 }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    car: (
      <>
        <path d="m5 8 2-5h10l2 5M3 9h18v9H3zM6 18v3m12-3v3M3 13h4m10 0h4" />
        <path d="M7 8h10" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="3" />
        <path d="M7 3v4m10-4v4M3 11h18m-13 4h2m4 0h2" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    card: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M6 15h4" />
      </>
    ),
    gift: (
      <>
        <path d="M3 10h18v4H3zM5 14v7h14v-7M12 10v11" />
        <path d="M12 10C3 10 4 2 8 4c3 1 4 6 4 6s1-5 4-6c4-2 5 6-4 6Z" />
      </>
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5m0 3h.01" />
      </>
    ),
    arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: (
      <>
        <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    bell: (
      <>
        <path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5zM10 21h4" />
      </>
    ),
    chevron: <path d="m9 5 7 7-7 7" />,
    drop: <path d="M12 2S4 11 4 15a8 8 0 0 0 16 0c0-4-8-13-8-13Z" />,
    star: <path d="m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    logout: (
      <>
        <path d="M10 3H4v18h6m5-15 6 6-6 6M8 12h13" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type CarVariant =
  "sedan" | "suv" | "hatchback" | "coupe" | "pickup" | "jeep"

export type CarFinish = "midnight" | "silver" | "emerald" | "sunset" | "bronze"

const carFinishes: Record<
  CarFinish,
  { label: string; colors: [string, string, string, string] }
> = {
  midnight: {
    label: "Midnight blue",
    colors: ["#90aab7", "#35556d", "#172d43", "#071422"],
  },
  silver: {
    label: "Pearl silver",
    colors: ["#f7fafc", "#aeb9c5", "#e5eaee", "#6f7b89"],
  },
  emerald: {
    label: "Deep emerald",
    colors: ["#a4dbc5", "#39836d", "#145043", "#082c27"],
  },
  sunset: {
    label: "Sunset red",
    colors: ["#ffc19d", "#e76c4c", "#9b342b", "#431519"],
  },
  bronze: {
    label: "Satin bronze",
    colors: ["#f0d79a", "#b3873c", "#684819", "#2c1d0a"],
  },
}

const carProfiles: Record<
  CarVariant,
  {
    label: string
    body: string
    windows: [string, string]
    wheels: [number, number]
  }
> = {
  sedan: {
    label: "sedan",
    body: "M88 181c10-27 37-39 87-51l65-56c12-9 88-13 144-3 36 7 75 29 109 64l68 21c23 7 35 23 35 54l-11 27-465 3-40-24Z",
    windows: [
      "m201 127 49-45c15-8 75-8 105-4l5 49Z",
      "m372 81 4 47 89 5c-30-28-64-47-93-52Z",
    ],
    wheels: [179, 468],
  },
  suv: {
    label: "SUV",
    body: "M72 181c13-27 43-40 101-49l42-69c13-13 134-16 184-4 36 9 72 39 101 77l63 18c23 7 34 24 33 56l-11 27-474 3-40-24Z",
    windows: [
      "m196 127 32-55c18-8 77-9 122-5l3 60Z",
      "m365 68 4 60 101 5c-30-37-68-59-105-65Z",
    ],
    wheels: [172, 477],
  },
  hatchback: {
    label: "hatchback",
    body: "M103 184c11-29 37-40 88-51l57-61c14-10 99-12 145-1 35 9 64 33 89 67l69 20c23 7 34 24 34 52l-11 27-448 3-42-23Z",
    windows: [
      "m212 128 48-47c14-8 64-9 94-4l2 51Z",
      "m368 80 4 49 78 5c-24-27-53-45-82-54Z",
    ],
    wheels: [194, 463],
  },
  coupe: {
    label: "sports coupe",
    body: "M75 190c19-35 54-49 116-59l75-47c29-16 112-18 154-1 25 10 52 29 79 55l65 21c22 8 32 25 32 51l-11 27-475 3-39-22Z",
    windows: [
      "m219 128 58-37c22-10 61-12 89-7l-1 44Z",
      "m379 87 2 42 83 4c-27-23-59-39-85-46Z",
    ],
    wheels: [177, 478],
  },
  pickup: {
    label: "pickup truck",
    body: "M72 183c15-28 43-39 96-48l51-62c13-11 99-14 137-4 27 8 49 30 67 62h139c20 0 34 17 34 51v28l-11 27-474 3-41-24Z",
    windows: [
      "m194 128 38-47c13-9 57-10 83-5l2 52Z",
      "m329 78 4 51 62 2c-17-28-39-46-66-53Z",
    ],
    wheels: [170, 482],
  },
  jeep: {
    label: "off-road Jeep",
    body: "M67 179c12-27 39-39 92-47l35-72c12-14 142-16 191-5 31 8 65 41 91 79l84 19c24 6 36 24 36 57l-11 27-476 3-42-24Z",
    windows: [
      "m176 127 31-58c17-8 73-9 112-5l2 63Z",
      "m335 65 3 63 103 5c-26-38-67-61-106-68Z",
    ],
    wheels: [164, 482],
  },
}

export function CarArt({
  silver = false,
  variant = "sedan",
  finish,
}: {
  silver?: boolean
  variant?: CarVariant
  finish?: CarFinish
}) {
  const id = useId()
  const bodyId = `${id}-body`
  const glassId = `${id}-glass`
  const shadowId = `${id}-shadow`
  const profile = carProfiles[variant]
  const paint = carFinishes[finish ?? (silver ? "silver" : "midnight")]
  return (
    <svg
      className="car-art"
      viewBox="0 0 640 300"
      fill="none"
      aria-label={`${paint.label} ${profile.label} illustration`}
      role="img"
    >
      <defs>
        <linearGradient
          id={bodyId}
          x1="240"
          y1="90"
          x2="280"
          y2="240"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor={paint.colors[0]} />
          <stop offset=".35" stopColor={paint.colors[1]} />
          <stop offset=".7" stopColor={paint.colors[2]} />
          <stop offset="1" stopColor={paint.colors[3]} />
        </linearGradient>
        <linearGradient id={glassId} x1="250" y1="70" x2="330" y2="140">
          <stop stopColor="#93c2cf" />
          <stop offset="1" stopColor="#152b3c" />
        </linearGradient>
        <radialGradient id={shadowId}>
          <stop stopColor="#000" stopOpacity=".5" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="335" cy="254" rx="267" ry="24" fill={`url(#${shadowId})`} />
      <path
        d={profile.body}
        fill={`url(#${bodyId})`}
        stroke="#7693a5"
        strokeWidth="1.5"
      />
      <path
        d={profile.windows[0]}
        fill={`url(#${glassId})`}
        stroke="#90a6b4"
        strokeWidth="2"
      />
      <path
        d={profile.windows[1]}
        fill={`url(#${glassId})`}
        stroke="#90a6b4"
        strokeWidth="2"
      />
      {variant === "suv" && (
        <g stroke="#dce8eb" strokeWidth="3" strokeLinecap="round">
          <path d="M224 56h154" />
          <path d="M242 54v11m117-11v11" />
        </g>
      )}
      {variant === "pickup" && (
        <g>
          <path d="M421 132h142v54H421Z" fill="#071826" opacity=".34" />
          <path d="M429 145h125M493 145v65" stroke="#d7e4e7" opacity=".55" />
          <rect x="516" y="157" width="22" height="5" rx="2.5" fill="#d7e4e7" />
        </g>
      )}
      {variant === "coupe" && (
        <g>
          <path
            d="M103 167h79l-10 10h-71Zm368-32 63-10 5 8-62 12Z"
            fill="#071826"
          />
          <path
            d="M267 91 402 191"
            stroke="#fff"
            strokeOpacity=".28"
            strokeWidth="7"
          />
        </g>
      )}
      {variant === "jeep" && (
        <g>
          <path
            d="M204 51h190M220 43v17m157-17v17"
            stroke="#dce8eb"
            strokeWidth="3"
          />
          <circle
            cx="103"
            cy="171"
            r="35"
            fill="#09131d"
            stroke="#738894"
            strokeWidth="5"
          />
          <circle cx="103" cy="171" r="17" fill="#263b48" />
          <path
            d="M515 190v27m12-29v29m12-31v31m12-29v29m12-25v25"
            stroke="#a9bbc3"
            strokeWidth="3"
          />
        </g>
      )}
      {variant === "sedan" && (
        <path
          d="M170 229h337"
          stroke="#e8f2f4"
          strokeOpacity=".55"
          strokeWidth="3"
        />
      )}
      <path
        d="m176 136 318 6M363 138l5 86M209 138l-9 85m174-77h17m-164 0h17"
        stroke="#a0b2bc"
        strokeOpacity=".5"
        strokeWidth="2"
      />
      <path
        d="M88 181c120-20 263-19 405-33l65 21M103 219l443-3"
        stroke="#91a9b7"
        strokeOpacity=".4"
        strokeWidth="2"
      />
      <path d="m97 176 65-7-10 17-58 9Z" fill="#e6faff" />
      <path d="m547 168 31 9 7 12-36-7Z" fill="#d9f2f5" />
      <path d="m82 202 48-5-3 19-40 2Z" fill="#071526" />
      <path d="m497 196 91 3-6 21-84-3Z" fill="#0a1929" stroke="#81929d" />
      <path d="M505 203h74m-72 5h70m-69 5h65" stroke="#94a0a6" />
      <circle cx="540" cy="207" r="7" stroke="#d1dade" />
      <path d="m540 200 0 7 6 4m-6-4-6 4" stroke="#d1dade" />
      {profile.wheels.map((x) => (
        <g className="car-wheel" key={x}>
          <circle cx={x} cy="219" r="41" fill="#09101a" />
          <circle
            cx={x}
            cy="219"
            r="30"
            fill="#a5afb9"
            stroke="#263644"
            strokeWidth="4"
          />
          <circle cx={x} cy="219" r="22" fill="#233343" />
          {[0, 60, 120, 180, 240, 300].map((a) => (
            <path
              key={a}
              d={`M${x} 198l4 19-4 3-4-3Z`}
              fill="#c7d1d9"
              transform={`rotate(${a} ${x} 219)`}
            />
          ))}
          <circle cx={x} cy="219" r="6" fill="#748896" />
        </g>
      ))}
      <path d="m359 119 23-3 10 8-5 10-24-3Z" fill={paint.colors[1]} />
    </svg>
  )
}

export function Plate({ children = "LND 482 JK" }: { children?: string }) {
  return (
    <span className="plate">
      <small>LAGOS</small>
      {children}
    </span>
  )
}
