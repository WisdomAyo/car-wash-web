"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Heading from "@/components/ui/Typography"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import { workspaceHref } from "@/lib/roles"

const vehicles = [
  ["Mercedes-Benz C300", "LND 482 JK", "Confirmed · TREATED"],
  ["Toyota Camry", "KJA 715 FC", "Awaiting named confirmer"],
  ["Lexus RX350", "EKY 203 AJ", "Scheduled · Not yet verified"],
] as const

/** Sample fleet vehicles with an illustrated Wash Passport preview. */
export default function FleetPassport() {
  const [active, setActive] = useState(0)
  return (
    <section className="fleet-passport-story">
      <div>
        <div className="eyebrow">FOLLOW THE VEHICLE, NOT THE PAPERWORK</div>
        <Heading>
          A care record.
          <br />
          With a number plate.
        </Heading>
        <p>
          Select a sample vehicle to explore how a fleet care record stays
          connected to its assigned job and confirmer.
        </p>
        <div className="fleet-vehicle-tabs">
          {vehicles.map(([name, plate], i) => (
            <Button
              key={plate}
              aria-pressed={active === i}
              className={active === i ? "selected" : ""}
              onClick={() => setActive(i)}
            >
              <Icon name="car" size={22} />
              <span>
                {name}
                <small>{plate}</small>
              </span>
              <Icon name="chevron" size={17} />
            </Button>
          ))}
        </div>
      </div>
      <div className="fleet-passport-preview" key={active}>
        <div className="eyebrow">SAMPLE WASH PASSPORT</div>
        <div className="passport-preview-car">
          <CarArt silver={active !== 0} />
        </div>
        <Heading level={3}>{vehicles[active][0]}</Heading>
        <Plate>{vehicles[active][1]}</Plate>
        <div className="passport-status">
          <Icon name={active === 0 ? "shield" : "clock"} />
          {vehicles[active][2]}
        </div>
        <p>
          This is an illustrated record, not live job evidence. Only fully
          verified jobs may close normally.
        </p>
        <ButtonLink
          className="secondary full"
          href={workspaceHref("Corporate")}
        >
          Explore the fleet workspace
          <Icon name="arrow" size={17} />
        </ButtonLink>
      </div>
    </section>
  )
}
