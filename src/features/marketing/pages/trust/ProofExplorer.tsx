"use client"

import { useState } from "react"
import Button from "@/components/ui/Button"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"

const proofs = [
  [
    "pin",
    "The right place.",
    "The assigned job's GPS trail connects travel and work to the approved location. Staff tracking is limited to assigned work, from acceptance to clock-out.",
  ],
  [
    "car",
    "The right vehicle.",
    "A scan at arrival and another at submission must match the registered number plate. A mismatch is an exception that needs review.",
  ],
  [
    "check",
    "Your final say.",
    "A customer, driver or named representative confirms the outcome. The customer's TREATED verdict is required before normal closure.",
  ],
] as const

/** The three proofs (place, vehicle, verdict) with a selectable detail panel. */
export default function ProofExplorer() {
  const [proof, setProof] = useState(0)
  return (
    <section className="trust-editorial">
      <div className="trust-graphic">
        <div className="trust-orbit" />
        <span className="trust-centre">
          <Icon name="shield" size={75} />
        </span>
        {proofs.map(([icon, title], i) => (
          <Button
            key={title}
            className={`trust-proof-node trust-node-${i} ${
              proof === i ? "selected" : ""
            }`}
            aria-pressed={proof === i}
            onClick={() => setProof(i)}
          >
            <Icon name={icon} size={25} />
            <span>0{i + 1}</span>
          </Button>
        ))}
        <small>THREE PROOFS. ONE PROMISE.</small>
      </div>
      <div className="trust-detail" key={proof}>
        <div className="eyebrow">PROOF 0{proof + 1} / 03</div>
        <Heading>{proofs[proof][1]}</Heading>
        <p>{proofs[proof][2]}</p>
        <div className="planner-tabs">
          {["GPS trail", "Plate scans", "Your verdict"].map((name, i) => (
            <Button
              key={name}
              className={proof === i ? "selected" : ""}
              aria-pressed={proof === i}
              onClick={() => setProof(i)}
            >
              {name}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
