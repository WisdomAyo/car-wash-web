import type { TourLocation } from "./lagosTour"

export default function LagosLandmarks({
  location,
}: {
  location: TourLocation
}) {
  if (location === "mainland")
    return (
      <g className="lagos-mainland-landmark">
        <path
          d="M-80 350C205 347 394 305 514 281S738 251 986 238"
          fill="none"
          stroke="var(--lagos-bridge-dark)"
          strokeWidth="19"
        />
        <path
          d="M-80 344C205 341 394 299 514 275S738 245 986 232"
          fill="none"
          stroke="var(--lagos-bridge)"
          strokeWidth="15"
        />
        <path
          d="M-80 341C205 338 394 296 514 272S738 242 986 229"
          fill="none"
          stroke="var(--lagos-cloud)"
          strokeWidth="2"
        />
        {[65, 150, 235, 320, 405, 490, 575, 660, 745, 830].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} ${344 - i * 12}v63h12v-65Z`}
              fill="var(--lagos-bridge-dark)"
            />
            <path
              d={`M${x + 2} ${346 - i * 12}v59h4v-60Z`}
              fill="var(--lagos-building-light)"
              opacity=".5"
            />
            <path
              d={`M${x - 8} ${413 - i * 12}h30`}
              stroke="var(--lagos-water-line)"
              opacity=".35"
            />
          </g>
        ))}
      </g>
    )
  if (location !== "marina") return null
  return (
    <g className="lagos-marina-landmark">
      <path d="M0 257h900v32H0Z" fill="var(--lagos-ground)" />
      <path
        d="M105 254V108h68v146Zm68 0V95h38v159ZM710 254V83h61v171ZM773 254V134h46v120Z"
        fill="var(--lagos-building)"
      />
      <path
        d="M110 120h58m-58 17h58m-58 17h58m-58 17h58m-58 17h58m-58 17h58M719 105h43m-43 20h43m-43 20h43m-43 20h43m-43 20h43m-43 20h43"
        stroke="var(--lagos-window)"
        strokeWidth="2"
        opacity=".7"
      />
      <path
        d="M298 258V168h303v90h-44v-49h-59v49h-42v-49h-59v49h-44v-49h-18v49Z"
        fill="var(--lagos-cloud)"
      />
      <path
        d="M289 163h321v12H289ZM281 256h339v9H281Z"
        fill="var(--lagos-building-light)"
      />
      {[319, 387, 483, 551].map((x) => (
        <g key={x} transform={`translate(${x} 113)`}>
          <path
            d="m0 40 4-19 9-10 8-1 4-12 12-5 7 8-7 5-4 14-12 11-4 18h-6l3-19-5 1-2 19Z"
            fill="var(--lagos-cloud)"
          />
          <path
            d="m25 11 5 8 10-6m-25 8-10-4-7 3"
            fill="none"
            stroke="var(--lagos-cloud)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path d="M-3 46h39v5H-3Z" fill="var(--lagos-building-light)" />
        </g>
      ))}
      <path d="M0 283h900" stroke="var(--lagos-bridge-dark)" strokeWidth="5" />
      {[45, 85, 230, 655, 815, 860].map((x) => (
        <g key={x}>
          <path
            d={`M${x} 259v-31`}
            stroke="var(--lagos-tree-trunk)"
            strokeWidth="3"
          />
          <ellipse cx={x} cy="221" rx="13" ry="20" fill="var(--lagos-tree)" />
        </g>
      ))}
    </g>
  )
}
