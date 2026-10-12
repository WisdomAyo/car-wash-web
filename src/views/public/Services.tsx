import { useState } from "react"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import PageIntro from "../../components/PageIntro"
import { CarArt, Icon } from "../../components/Visuals"
import type { Navigate } from "../../domain/publicContent"
import { careServices } from "../../domain/publicContent"

export default function Services({ navigate }: { navigate: Navigate }) {
  const [selected, setSelected] = useState(1)
  const care = careServices[selected]
  return (
    <>
      <PageIntro
        eyebrow="THE GO-WASH CARE MENU"
        title="Your kind of clean."
        accent="Beautifully considered."
        text="From an everyday refresh to a little extra attention, choose care that fits your vehicle and your day. Every service comes with the same standard of proof."
      />
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
            <Button
              className="primary"
              onClick={() => navigate("auth/register", "Customer")}
            >
              Choose this care
              <Icon name="arrow" size={17} />
            </Button>
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
              <p>
                {
                  [
                    "Thoughtful attention, with your vehicle's condition in mind.",
                    "A careful finish that makes the everyday feel a little fresher.",
                    "Part of the selected care package, carried out in an approved outdoor space.",
                    "Your job remains tied to your vehicle, location and final confirmation.",
                  ][i]
                }
              </p>
            </article>
          ))}
        </div>
      </section>
      <section className="care-note">
        <Icon name="shield" size={38} />
        <div>
          <Heading>What never changes?</Heading>
          <p>
            Screened professionals. Outdoor-only service. GPS evidence, two
            matching plate scans and your TREATED verdict before normal closure.
          </p>
        </div>
        <Button className="secondary" onClick={() => navigate("trust")}>
          Our trust standard
          <Icon name="arrow" size={16} />
        </Button>
      </section>
    </>
  )
}
