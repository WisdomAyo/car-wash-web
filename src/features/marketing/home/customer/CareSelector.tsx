"use client"

import { useState } from "react"
import Heading from "@/components/ui/Typography"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import { careServices } from "@/features/marketing/content/publicContent"
import { authHref } from "@/lib/roles"

/** Wash-package picker with a live preview of what each package includes. */
export default function CareSelector() {
  const [care, setCare] = useState(1)
  return (
    <section className="customer-care-selector">
      <div>
        <div className="eyebrow">YOUR EVERYDAY CLEAN. OR THE WHOLE GLOW.</div>
        <Heading>
          A little attention.
          <br />
          Exactly where it matters.
        </Heading>
        <p>
          Choose an illustrative sedan service to explore what&apos;s included.
          Final vehicle pricing and availability are confirmed during booking.
        </p>
        <div className="care-selector-tabs">
          {careServices.map((s, i) => (
            <Button
              key={s.name}
              className={care === i ? "selected" : ""}
              aria-pressed={care === i}
              onClick={() => setCare(i)}
            >
              <span>0{i + 1}</span>
              {s.name}
              <Icon name="arrow" size={18} />
            </Button>
          ))}
        </div>
      </div>
      <div className="customer-care-preview" key={care}>
        <div className="eyebrow">{careServices[care].tag}</div>
        <Heading>{careServices[care].name}</Heading>
        <p>{careServices[care].text}</p>
        <div className="care-price">
          <strong>₦{careServices[care].price}</strong>
          <span>/ sedan wash</span>
        </div>
        {careServices[care].items.map((item) => (
          <div className="audience-feature-item" key={item}>
            <Icon name="check" size={19} />
            {item}
          </div>
        ))}
        <ButtonLink
          className="primary full"
          href={authHref("register", "Customer")}
        >
          Choose your care
          <Icon name="arrow" size={18} />
        </ButtonLink>
        <small>Illustrative launch pricing · {careServices[care].time}</small>
      </div>
    </section>
  )
}
