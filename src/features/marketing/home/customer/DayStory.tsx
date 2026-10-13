"use client"

import { useState } from "react"
import Heading from "@/components/ui/Typography"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import { CarArt, Icon } from "@/components/Visuals"

const dayScenes = [
  {
    name: "At home",
    title: "A fresher morning. No extra errand.",
    text: "Park in an approved outdoor space, choose a window and let your professional take care of the wash while you take care of the day.",
    label: "HOME / APPROVED OUTDOOR PARKING",
    icon: "pin",
  },
  {
    name: "At work",
    title: "You handle the work. We handle the shine.",
    text: "Book around your office parking routine. Confirm access with your location, then review the result without adding a detour to your commute.",
    label: "OFFICE / APPROVED CAR PARK",
    icon: "card",
  },
  {
    name: "In your estate",
    title: "Good care, closer to your community.",
    text: "Use your estate's resident booking link and agreed wash window. Your personal vehicle history and payments stay within your own account.",
    label: "ESTATE / AGREED WASH WINDOW",
    icon: "gift",
  },
] as const

/** "Care that fits into your life": home / work / estate scene switcher. */
export default function DayStory() {
  const [scene, setScene] = useState(0)
  return (
    <section className="customer-day-story">
      <div className="home-editorial-heading">
        <div className="eyebrow">CARE THAT FITS INTO YOUR LIFE</div>
        <Heading>
          Your day doesn&apos;t need
          <br />
          another detour.
        </Heading>
        <p>
          Home, office or estate—good care should meet your routine, not
          interrupt it.
        </p>
      </div>
      <div className="day-story-layout">
        <div>
          <div
            className="day-location-tabs"
            role="group"
            aria-label="Where your care happens"
          >
            {dayScenes.map((item, i) => (
              <Button
                key={item.name}
                aria-pressed={scene === i}
                className={scene === i ? "selected" : ""}
                onClick={() => setScene(i)}
              >
                <Icon name={item.icon} size={23} />
                {item.name}
              </Button>
            ))}
          </div>
          <div className="day-story-copy" key={scene}>
            <Heading>{dayScenes[scene].title}</Heading>
            <p>{dayScenes[scene].text}</p>
            <ButtonLink className="public-secondary" href="/coverage">
              See where we wash
              <Icon name="arrow" size={18} />
            </ButtonLink>
          </div>
        </div>
        <div className={`day-parking-art scene-${scene}`}>
          <div className="parking-architecture">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="parking-bay">
            <CarArt silver={scene === 1} />
          </div>
          <div className="parking-pin">
            <Icon name={dayScenes[scene].icon} size={26} />
          </div>
          <small>{dayScenes[scene].label}</small>
        </div>
      </div>
    </section>
  )
}
