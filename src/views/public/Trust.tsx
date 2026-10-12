import { useState } from "react"
import Button from "../../components/ui/Button"
import Heading from "../../components/ui/Typography"
import PageIntro from "../../components/PageIntro"
import { Icon } from "../../components/Visuals"
import type { Navigate } from "../../domain/publicContent"

export default function Trust({ navigate }: { navigate: Navigate }) {
  const [proof, setProof] = useState(0)
  const [verdict, setVerdict] = useState(0)
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
  return (
    <>
      <PageIntro
        eyebrow="THE VERIFIED WASH STANDARD"
        title="Trust isn't a tagline."
        accent="It's a process."
        text="A beautifully clean car is the beginning. The record behind it is what makes Go-Wash different. Three independent signals must agree before a job closes normally."
      />
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
      <section className="verdict-editorial">
        <div>
          <div className="eyebrow">YOU KEEP THE LAST WORD</div>
          <Heading>
            Your car.
            <br />
            Your verdict.
          </Heading>
          <p>
            Explore how each outcome changes the next step. This is an
            explanation, not an actual job confirmation.
          </p>
        </div>
        <div>
          <div className="verdict-options">
            {[
              "Treated and satisfied",
              "Treated and not pleased",
              "Untreated",
            ].map((name, i) => (
              <Button
                key={name}
                className={`verdict-option outcome-${i} ${
                  verdict === i ? "selected" : ""
                }`}
                aria-pressed={verdict === i}
                onClick={() => setVerdict(i)}
              >
                <Icon name={i === 0 ? "check" : i === 1 ? "help" : "close"} />
                {name}
              </Button>
            ))}
          </div>
          <div className="verdict-explanation" role="status">
            {
              [
                "Your confirmation unlocks the washman's final plate scan. All required evidence must still agree before normal closure.",
                "A remark is required. A quality complaint is opened while final submission may proceed with the required evidence.",
                "A remark is required. The job is disputed and final submission is blocked for operations review.",
              ][verdict]
            }
          </div>
          <Button
            className="public-secondary"
            onClick={() => navigate("confirm")}
          >
            Try the sample driver verdict flow
            <Icon name="arrow" size={17} />
          </Button>
        </div>
      </section>
      <section className="care-inclusions">
        <div className="eyebrow">CARE WITH CLEAR BOUNDARIES</div>
        <Heading>People first. Always.</Heading>
        <div className="inclusion-grid">
          {[
            [
              "Screened professionals",
              "Required records are reviewed before staff activation.",
            ],
            [
              "Outdoors only",
              "Staff never enter private homes or indoor premises.",
            ],
            [
              "Privacy by design",
              "Vehicle evidence should avoid people and neighbouring property.",
            ],
            [
              "Auditable exceptions",
              "Administrative releases require a reason and an enduring record.",
            ],
          ].map(([title, text]) => (
            <article key={title}>
              <Icon name="shield" size={25} />
              <Heading level={3}>{title}</Heading>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  )
}
