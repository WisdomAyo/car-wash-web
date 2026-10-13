"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { CarArt, Icon } from "@/components/Visuals"
import { careServices } from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"

const inclusionNotes = [
  "Thoughtful attention, with your vehicle's condition in mind.",
  "A careful finish that makes the everyday feel a little fresher.",
  "Part of the selected care package, carried out in an approved outdoor space.",
  "Your job remains tied to your vehicle, location and final confirmation.",
]

/** Service picker: the selected package drives both the detail card and its inclusions. */
export default function ServiceExplorer() {
  const [selected, setSelected] = useState(1)
  const care = careServices[selected]
  return (
    <>
      <section className="service-editorial">
        <div className="care-menu">
          {careServices.map((s, i) => (
            <Button
              key={s.name}
              className={selected === i ? "selected" : ""}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <span>0{i + 1}</span>
              <div>
                <strong>{s.name}</strong>
                <small>{s.time}</small>
              </div>
              <Icon name="arrow" />
            </Button>
          ))}
          <p>
            Illustrative launch pricing · Sedan
            <br />
            Vehicle type and final availability confirmed at booking.
          </p>
        </div>
        <div className="service-detail" key={selected}>
          <div className="eyebrow">{care.tag}</div>
          <Heading>{care.name}</Heading>
          <p>{care.text}</p>
          <div className="service-detail-car">
            <CarArt silver={selected === 0} />
          </div>
          <div className="service-detail-footer">
            <div>
              <strong>₦{care.price}</strong>
              <span>/ wash · sedan</span>
            </div>
            <ButtonLink
              className="primary"
              href={authHref("register", "Customer")}
            >
              Choose this care
              <Icon name="arrow" size={17} />
            </ButtonLink>
          </div>
        </div>
      </section>
      <section className="care-inclusions">
        <div className="eyebrow">SMALL DETAILS. A BIG DIFFERENCE.</div>
        <Heading>Know what goes into your care.</Heading>
        <div className="inclusion-grid">
          {care.items.map((item, i) => (
            <article key={item}>
              <span>0{i + 1}</span>
              <Icon name={i === 3 ? "shield" : "drop"} size={24} />
              <Heading level={3}>{item}</Heading>
              <p>{inclusionNotes[i]}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
