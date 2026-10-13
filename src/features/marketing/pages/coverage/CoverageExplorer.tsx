"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { authHref } from "@/lib/roles"

const serviceSettings = {
  "At home": [
    "Your outdoor parking space",
    "Available at homes across Nigeria",
    "Convenient care where your vehicle already parks",
  ],
  "At work": [
    "Your office car park",
    "Available for workplaces across Nigeria",
    "Access procedures agreed before arrival",
  ],
  "Estates & fleets": [
    "Your community or fleet location",
    "Coordinated wash windows anywhere in Nigeria",
    "Thoughtful plans for multiple vehicles",
  ],
} as const
type ServiceSetting = keyof typeof serviceSettings
const settingNames = Object.keys(serviceSettings) as ServiceSetting[]

/** Illustrated "where we wash" map with a setting picker. */
export default function CoverageExplorer() {
  const [setting, setSetting] = useState<ServiceSetting>("At home")
  return (
    <section className="coverage-editorial">
      <div className="coverage-map">
        <svg viewBox="0 0 600 430" aria-hidden="true">
          <path
            className="coverage-land"
            d="M0 0h600v156l-75 31-90-15-51 51-62-18-61 46-39-20-64 69L0 275Z"
          />
          <path
            className="coverage-land"
            d="m260 310 103-52 60 15 95-52 82 3v90l-124 34-84-24-101 49Z"
          />
          <path
            className="coverage-roads"
            d="m50 180 140-46 80 69 124-69 125 16M170 0l20 134 31 82m113 95 50-87 10-90M435 0l-41 134m-123 69 63 108 140 2"
          />
        </svg>
        <span className="lagoon-label">ACROSS NIGERIA</span>
        {settingNames.map((name, i) => (
          <Button
            key={name}
            className={`coverage-marker marker-${i} ${
              setting === name ? "selected" : ""
            }`}
            aria-pressed={setting === name}
            onClick={() => setSetting(name)}
          >
            <Icon name="pin" size={19} />
            <span>{name}</span>
          </Button>
        ))}
        <small>Illustrated service view · Nationwide availability</small>
      </div>
      <div className="coverage-detail">
        <div className="eyebrow">EXPLORE WHERE WE WASH</div>
        <div className="planner-tabs">
          {settingNames.map((name) => (
            <Button
              key={name}
              className={setting === name ? "selected" : ""}
              onClick={() => setSetting(name)}
              aria-pressed={setting === name}
            >
              {name}
            </Button>
          ))}
        </div>
        <Heading>{setting}</Heading>
        <p>{serviceSettings[setting][0]}</p>
        {serviceSettings[setting].slice(1).map((text) => (
          <div className="audience-feature-item" key={text}>
            <Icon name="check" size={17} />
            {text}
          </div>
        ))}
        <div className="coverage-disclaimer">
          <Icon name="help" size={18} />
          Enter your location when booking and choose an available time. This
          prototype does not check live scheduling.
        </div>
        <ButtonLink className="primary" href={authHref("register", "Customer")}>
          Explore booking
          <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    </section>
  )
}
