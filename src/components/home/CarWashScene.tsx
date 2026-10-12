import { memo, useId } from "react"
import { CarArt } from "../Visuals"
import LagosTraffic from "./LagosTraffic"

type WashProps = {
  setting: "home" | "office"
}
function CarWashScene({ setting }: WashProps) {
  const id = useId()
  const home = setting === "home"
  return (
    <svg
      className={`car-wash-scene wash-setting-${setting}`}
      viewBox="0 0 900 480"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={
        home
          ? "A washman rinsing a car in an outdoor Lagos home driveway, with water spray and passing vehicles"
          : "A professional polishing a car in an outdoor Lagos office car park, with moving street traffic"
      }
    >
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor="var(--lagos-sky-top)" />
          <stop offset="1" stopColor="var(--lagos-sky-bottom)" />
        </linearGradient>
        <linearGradient id={`${id}-facade`} x2="1" y2="1">
          <stop stopColor="var(--lagos-building-light)" />
          <stop offset="1" stopColor="var(--lagos-building)" />
        </linearGradient>
        <linearGradient id={`${id}-glass`} x2="1" y2="1">
          <stop stopColor="var(--lagos-water-light)" />
          <stop offset="1" stopColor="var(--lagos-glass)" />
        </linearGradient>
        <clipPath id={`${id}-spray`}>
          <path d="m608 301-105 10-7 27 116-30Z" />
        </clipPath>
      </defs>
      <path d="M0 0h900v480H0z" fill={`url(#${id}-sky)`} />
      <circle cx="738" cy="75" r="33" fill="var(--lagos-sun)" opacity=".7" />
      <g fill="var(--lagos-haze)" opacity=".3">
        <path d="M0 208V90h43v118Zm61 0V122h52v86Zm60 0V60h46v148ZM752 208V110h51v98Zm56 0V63h39v145Zm52 0V99h40v109Z" />
      </g>
      {home ? (
        <g className="wash-home-architecture">
          <path d="M109 237V77h353v160Z" fill={`url(#${id}-facade)`} />
          <path d="M462 77h87v160h-87Z" fill="var(--lagos-building)" />
          <path d="m93 76 193-32 193 32v14H93Z" fill="var(--lagos-roof)" />
          <path d="m479 76 75 14v10l-75-10Z" fill="var(--lagos-bridge-dark)" />
          <path
            d="M129 104h69v70h-69Zm105 0h69v70h-69Zm105 0h97v70h-97Z"
            fill={`url(#${id}-glass)`}
          />
          <path
            d="M139 114v51m14-51v51m-14-27h47m58-24v51m14-51v51m-14-27h47m70-24v50m21-50v50m-41-25h73"
            stroke="var(--lagos-cloud)"
            opacity=".3"
            fill="none"
          />
          <path d="M209 237v-34h256v34Z" fill="var(--lagos-roof)" />
          <path
            d="M231 209h91v28h-91Zm111 0h102v28H342Z"
            fill="var(--lagos-glass)"
          />
          <path d="M630 235v-66h161v66Z" fill="var(--lagos-building-light)" />
          <path
            d="M654 182v53m23-53v53m23-53v53m23-53v53m23-53v53m23-53v53"
            stroke="var(--lagos-building)"
            strokeWidth="5"
          />
          <path d="M609 167h202v13H609Z" fill="var(--lagos-roof)" />
        </g>
      ) : (
        <g className="wash-office-architecture">
          <path d="M150 240V36h268v204Z" fill={`url(#${id}-glass)`} />
          <path d="M418 36h85v204h-85Z" fill="var(--lagos-building)" />
          <path d="M166 48h235v17H166Z" fill="var(--lagos-building-light)" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M166 ${81 + i * 29}h236`}
              stroke="var(--lagos-cloud)"
              strokeWidth="2"
              opacity=".35"
            />
          ))}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <path
              key={i}
              d={`M${184 + i * 37} 81v140`}
              stroke="var(--lagos-cloud)"
              strokeWidth="2"
              opacity=".35"
            />
          ))}
          <path
            d="M170 217h238l85 24H104Z"
            fill="var(--lagos-building-light)"
          />
          <path
            d="M116 241v51m354-51v51"
            stroke="var(--lagos-building)"
            strokeWidth="8"
          />
          <path d="M566 247V98h137v149Z" fill={`url(#${id}-facade)`} />
          <path d="M704 98h50v149h-50Z" fill="var(--lagos-building)" />
          {[0, 1, 2].map((i) => (
            <path
              key={i}
              d={`M581 ${122 + i * 35}h106`}
              stroke="var(--lagos-glass)"
              strokeWidth="17"
              opacity=".6"
            />
          ))}
          <path d="M793 269v-96h46v96Z" fill="var(--lagos-cloud)" />
          <path d="M783 169h65v9h-65Z" fill="var(--lagos-roof)" />
          <path d="M802 191h29v27h-29Z" fill="var(--lagos-glass)" />
        </g>
      )}
      <path d="M0 265h900v159H0Z" fill="var(--lagos-ground)" />
      <path d="M0 414h900v66H0Z" fill="var(--lagos-road)" />
      <path
        d="M0 448h900"
        stroke="var(--lagos-road-line)"
        strokeWidth="2"
        strokeDasharray="27 19"
      />
      <path d="M0 411h900" stroke="var(--lagos-cloud)" strokeWidth="4" />
      <path
        d="M96 402h675m-636-17 18-33m560 33-13-30m-460 43h153m80 0h171"
        stroke="var(--lagos-parking-line)"
        strokeWidth="3"
        fill="none"
      />
      <g className="wash-scene-trees">
        {[53, 860].map((x) => (
          <g key={x}>
            <path
              d={`M${x} 320v-104`}
              stroke="var(--lagos-tree-trunk)"
              strokeWidth="7"
            />
            <path
              d={`m${x} 211c-32-35-60-24-66-5 22-10 44-7 66 5Zm0 0c39-40 63-18 63-2-21-10-39-9-63 2Zm0-5c-12-58 24-70 40-57-23 10-33 30-40 57Zm0 0c-39-12-54 6-55 23 17-14 35-20 55-23Zm0 0c43-12 57 10 52 22-22-15-37-20-52-22Z`}
              fill="var(--lagos-tree)"
            />
          </g>
        ))}
      </g>
      <ellipse
        cx="440"
        cy="389"
        rx="244"
        ry="20"
        fill="var(--lagos-water)"
        opacity=".17"
      />
      <g className="wash-scene-car">
        <svg x="130" y="167" width="610" height="286" viewBox="0 0 640 300">
          <CarArt silver={!home} />
        </svg>
      </g>
      <g className="wash-foam" fill="var(--scene-paper)">
        {[
          [275, 316, 26, 6],
          [338, 302, 32, 7],
          [402, 297, 23, 5],
          [461, 304, 25, 7],
          [514, 313, 32, 7],
          [560, 323, 21, 5],
        ].map(([x, y, rx, ry]) => (
          <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} />
        ))}
        <path
          d="M280 322v17m48-25v18m89-20v22m61-18v21m49-15v22"
          stroke="var(--scene-paper)"
          strokeWidth="3"
          opacity=".6"
        />
      </g>
      <g className="wash-water" clipPath={`url(#${id}-spray)`}>
        <path
          d="m610 299-110 9-5 30 115-29Z"
          fill="var(--scene-paper)"
          opacity=".2"
        />
        <path
          className="wash-water-stream"
          d="M610 302 505 315m105-10-107 18m107-17-104 26"
          stroke="var(--scene-paper)"
          strokeWidth="2"
          strokeDasharray="5 9"
        />
        <g className="wash-water-drops" fill="var(--scene-paper)">
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={525 + i * 14} cy={313 + (i % 2) * 6} r="2" />
          ))}
        </g>
      </g>
      <g className="washman-person">
        <ellipse
          cx="650"
          cy="392"
          rx="29"
          ry="6"
          fill="var(--lagos-bridge-dark)"
          opacity=".25"
        />
        <path d="m638 325-6 60h13l8-43 7 43h13l-10-63Z" fill="var(--navy)" />
        <path d="M632 383h14v10h-25Zm27 0h14l9 10h-23Z" fill="var(--navy)" />
        <circle cx="652" cy="259" r="13" fill="var(--scene-skin)" />
        <path d="M639 255c-1-20 28-20 28 1l-13-5Z" fill="var(--navy)" />
        <path
          d="m639 273-16 35 16 12-4 14h34l-3-57-13-7Z"
          fill="var(--scene-paper)"
        />
        <path d="M647 278h15l4 55h-25Z" fill="var(--aqua)" />
        <g className="washman-working-arm">
          <path
            d="m633 285-23 19-29 3 1 10 34-2 26-20Z"
            fill="var(--scene-skin)"
          />
          {home ? (
            <path d="m577 303 18-5 4 8-19 7Z" fill="var(--lagos-glass)" />
          ) : (
            <path d="m566 300 29 3-4 18-27-4Z" fill="var(--lagos-danfo)" />
          )}
        </g>
      </g>
      {home ? (
        <g>
          <path
            d="M590 310c13 57-5 54 12 65 26 20 39 17 25 5-12-12-27-8-17 11"
            stroke="var(--lagos-bridge-dark)"
            strokeWidth="3"
            fill="none"
          />
          <path d="M593 368h22l-3 23h-16Z" fill="var(--aqua)" />
          <path
            d="M596 367v-7q8-8 16 0v7"
            stroke="var(--lagos-bridge-dark)"
            strokeWidth="2"
            fill="none"
          />
        </g>
      ) : (
        <g>
          <path d="M581 366h24l-3 24h-18Z" fill="var(--aqua)" />
          <path
            d="M584 366v-8q9-8 17 0v8"
            stroke="var(--lagos-bridge-dark)"
            strokeWidth="2"
            fill="none"
          />
          <path d="M568 374h9v16h-9Z" fill="var(--lagos-cloud)" />
        </g>
      )}
      <g
        className="wash-finish-glints"
        stroke="var(--scene-paper)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      >
        <path d="M356 266v17m-8-8h16m175 53v14m-7-7h14" />
      </g>
      <LagosTraffic setting="care" />
    </svg>
  )
}

export default memo(CarWashScene)
