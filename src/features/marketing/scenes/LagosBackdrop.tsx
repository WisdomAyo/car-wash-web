import { memo, useId } from "react"
import type { TourLocation } from "./lagosTour"
import LagosLandmarks from "./LagosLandmarks"
import LagosTraffic from "./LagosTraffic"

/** Stylised Lagos landmarks, not an exact geographic map or coverage boundary. */
function LagosBackdrop({
  location,
  cinematic = false,
}: {
  location: TourLocation
  cinematic?: boolean
}) {
  const id = useId()
  return (
    <svg
      className="lagos-backdrop"
      viewBox={cinematic ? "0 0 900 480" : "0 0 900 640"}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={
        location === "mainland"
          ? "Illustrated Third Mainland Bridge with long concrete spans over the Lagos lagoon"
          : location === "marina"
            ? "Illustrated Marina waterfront and Tafawa Balewa Square-inspired entrance with horse sculptures"
            : "Illustrated Lagos lagoon, cable-stayed bridge, waterfront skyline, palms and a yellow danfo bus"
      }
    >
      <defs>
        <linearGradient id={`${id}-sky`} x2="0" y2="1">
          <stop stopColor="var(--lagos-sky-top)" />
          <stop offset="1" stopColor="var(--lagos-sky-bottom)" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x2="0" y2="1">
          <stop stopColor="var(--lagos-water-light)" />
          <stop offset="1" stopColor="var(--lagos-water)" />
        </linearGradient>
        <linearGradient id={`${id}-tower`} x2="1" y2="1">
          <stop stopColor="var(--lagos-building-light)" />
          <stop offset="1" stopColor="var(--lagos-building)" />
        </linearGradient>
        <linearGradient id={`${id}-ground`} x2="0" y2="1">
          <stop stopColor="var(--lagos-ground)" />
          <stop offset="1" stopColor="var(--lagos-ground-dark)" />
        </linearGradient>
      </defs>
      <path d="M0 0h900v640H0z" fill={`url(#${id}-sky)`} />
      <g className="lagos-sun">
        <circle cx="686" cy="111" r="39" fill="var(--lagos-sun)" />
        <circle
          cx="686"
          cy="111"
          r="57"
          fill="var(--lagos-sun)"
          opacity=".08"
        />
      </g>
      <g className="lagos-clouds" fill="var(--lagos-cloud)" opacity=".55">
        <path d="M88 79c12-19 37-19 46-6 21-10 40 1 43 14H70c2-5 9-9 18-8Z" />
        <path d="M434 49c8-14 26-18 39-7 18-5 32 6 32 15h-85c2-5 8-8 14-8Z" />
      </g>
      <path
        d="M0 254c122-19 182 13 299-5s238-12 322 4 190-21 279-8v54H0z"
        fill="var(--lagos-haze)"
      />
      <g
        className={`lagos-skyline skyline-${location}`}
        fill={`url(#${id}-tower)`}
      >
        <path d="M506 244V167l27-9 26 9v77ZM553 244V118h51v126ZM603 244V152h39v92ZM640 244V86l27-15 35 15v158ZM705 244V131h51v113ZM760 244V169h34v75ZM793 244V119l35-12 35 12v125Z" />
        <g stroke="var(--lagos-window)" strokeWidth="2" opacity=".7">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M566 ${136 + i * 17}h25M650 ${109 + i * 21}h40M718 ${148 + i * 17}h24M807 ${137 + i * 17}h40`}
            />
          ))}
        </g>
        <path
          d="M668 72V54m-90 66v-13"
          stroke="var(--lagos-building)"
          strokeWidth="2"
        />
      </g>
      <g className={`lagos-houses houses-${location}`}>
        {[44, 135, 226, 317].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} 253v-54h66v54Z`}
              fill="var(--lagos-building-light)"
            />
            <path d={`m${x - 9} 202 41-28 43 28Z`} fill="var(--lagos-roof)" />
            <path
              d={`M${x + 9} 213h13v14h-13ZM${x + 44} 213h13v14h-13Z`}
              fill="var(--lagos-window)"
            />
            <path
              d={`M${x + 28} 253v-22h14v22Z`}
              fill="var(--lagos-building)"
            />
            <path
              d={`M${x - 6} 254h79`}
              stroke="var(--lagos-cloud)"
              strokeWidth="2"
            />
            {i % 2 === 0 && (
              <path
                d={`M${x + 70} 253v-44`}
                stroke="var(--lagos-tree)"
                strokeWidth="3"
              />
            )}
          </g>
        ))}
      </g>
      <path d="M0 259h900v173H0z" fill={`url(#${id}-water)`} />
      <g
        stroke="var(--lagos-water-line)"
        fill="none"
        opacity=".45"
        strokeLinecap="round"
      >
        <path d="M44 305h88m26 0h46m48 20h91m120-34h61m49 33h69m38-27h81M10 360h80m57-19h93m176 17h94m93-10h91m29 34h90M40 395h133m195-12h77m77 17h112m45-22h124" />
      </g>
      <g className="lagos-ferry">
        <path d="m583 343 69 0-9 13h-52Z" fill="var(--lagos-bridge-dark)" />
        <path d="M597 330h38v13h-38Z" fill="var(--lagos-cloud)" />
        <path
          d="M603 334h8m5 0h9"
          stroke="var(--lagos-water)"
          strokeWidth="4"
        />
        <path d="M607 321v9" stroke="var(--lagos-cloud)" strokeWidth="2" />
        <path
          d="M571 360h61"
          stroke="var(--lagos-water-line)"
          strokeWidth="2"
          opacity=".6"
        />
      </g>
      <g className={`lagos-bridge bridge-${location}`}>
        <path
          d="m-30 291 470-31 88 13 395 49v13l-396-49-88-13-470 30Z"
          fill="var(--lagos-bridge)"
        />
        <path
          d="M440 262V135l14-9 13 9v128"
          fill="none"
          stroke="var(--lagos-bridge)"
          strokeWidth="7"
          strokeLinejoin="round"
        />
        <g stroke="var(--lagos-cable)" strokeWidth="1.5">
          {[70, 125, 180, 235, 290, 345, 390].map((x) => (
            <path key={x} d={`M452 141 ${x} ${291 - x * 0.064}`} />
          ))}
          {[510, 555, 600, 650, 700, 755, 810].map((x) => (
            <path key={x} d={`M458 141 ${x} ${274 + (x - 510) * 0.124}`} />
          ))}
        </g>
        <path
          d="M435 275v105h30V275M233 286v66h15v-67M682 306v71h16v-70"
          fill="var(--lagos-bridge-dark)"
          opacity=".7"
        />
        <path
          d="m-30 286 470-31 88 13 395 49"
          stroke="var(--lagos-cloud)"
          strokeWidth="2"
          fill="none"
          opacity=".7"
        />
      </g>
      <LagosLandmarks location={location} />
      <path
        d="M0 417c218-29 352-20 536 10 131 21 248-20 364-10v223H0Z"
        fill={`url(#${id}-ground)`}
      />
      <path d="M0 438 900 454v61L0 499Z" fill="var(--lagos-road)" />
      <path
        d="M0 467 900 483"
        stroke="var(--lagos-road-line)"
        strokeWidth="2"
        strokeDasharray="29 22"
      />
      <path
        d="M0 434 900 450M0 503 900 519"
        stroke="var(--lagos-cloud)"
        strokeWidth="3"
        opacity=".4"
      />
      <g className="lagos-danfo" transform="translate(540 16)">
        <path d="M87 435v-23q0-6 7-6h71l14 14v21Z" fill="var(--lagos-danfo)" />
        <path
          d="M98 412h49v13H98Zm55 0h9l10 13h-19Z"
          fill="var(--lagos-glass)"
        />
        <path
          d="M92 430h82"
          stroke="var(--lagos-bridge-dark)"
          strokeWidth="3"
        />
        <path
          d="M111 412v13m19-13v13m22 4v9"
          stroke="var(--lagos-danfo)"
          strokeWidth="2"
        />
        <circle cx="108" cy="439" r="8" fill="var(--lagos-bridge-dark)" />
        <circle cx="162" cy="439" r="8" fill="var(--lagos-bridge-dark)" />
        <circle cx="108" cy="439" r="3" fill="var(--lagos-cloud)" />
        <circle cx="162" cy="439" r="3" fill="var(--lagos-cloud)" />
      </g>
      <LagosTraffic bridge={location === "mainland" ? "mainland" : "link"} />
      <g className="lagos-palms">
        {[35, 840].map((x, i) => (
          <g key={x}>
            <path
              d={`M${x} ${520 - i * 24}q12-40 8-130`}
              stroke="var(--lagos-tree-trunk)"
              strokeWidth="8"
              fill="none"
            />
            <path
              d={`m${x + 8} 390c-8-50-52-59-66-29 20-10 43-4 66 29Zm0 0c25-44 56-35 66-11-21-9-42-7-66 11Zm0-5c-23-48 10-78 33-66-21 7-30 27-33 66Zm0 0c-38-26-65-4-67 18 15-18 37-23 67-18Zm0 0c44-22 69 1 68 21-21-18-38-22-68-21Z`}
              fill="var(--lagos-tree)"
            />
          </g>
        ))}
      </g>
      <path
        d="m166 551 480 12 113 77H78Z"
        fill="var(--lagos-parking)"
        opacity=".72"
      />
      <path
        d="m200 570-54 70m488-54 82 54M198 586l426 9"
        stroke="var(--lagos-parking-line)"
        strokeWidth="2"
        opacity=".45"
      />
    </svg>
  )
}

export default memo(LagosBackdrop)
