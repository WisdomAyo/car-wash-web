import { useState } from "react"
import { CarArt, Icon, Plate } from "../components/Visuals"
import Brand from "../components/Brand"

export default function Confirmer({ onHome }: { onHome: () => void }) {
  const [outcome, setOutcome] = useState("")
  const [remark, setRemark] = useState("")
  const [done, setDone] = useState(false)
  return (
    <div className="confirmer-page">
      <Brand onClick={onHome} />
      <div className="confirmer-card">
        <div className="eyebrow">DELEGATED VERDICT · DEMO LINK</div>
        <h1>
          {done
            ? "Your confirmation is on record."
            : "Musa, your vehicle is ready."}
        </h1>
        <p>
          {done
            ? outcome === "Untreated"
              ? "The job is disputed and final submission is blocked for admin review."
              : "Your name and verdict are recorded. The washman's final plate scan is now unlocked."
            : "You are the named confirmer for this vehicle. No account setup needed."}
        </p>
        <div className="confirmer-vehicle">
          <CarArt silver />
          <h3>
            Toyota Camry <Plate>KJA 715 FC</Plate>
          </h3>
          <span>Meridian Holdings · Signature Wash · #GW-1052</span>
        </div>
        {done ? (
          <div className="confirmation">
            <Icon name="shield" size={42} />
            <h3>{outcome}</h3>
            <p>
              Confirmed by Musa Bello.
              <br />
              Sample verdict only. Production links must be signed, single-use
              and expiring.
            </p>
            <button className="primary full" onClick={onHome}>
              Back to Go-Wash <Icon name="arrow" size={16} />
            </button>
          </div>
        ) : (
          <>
            <p className="policy-note">
              Vehicle illustration only. Actual before-and-after job photos
              appear in a connected service.
            </p>
            <div className="verdict-options">
              {[
                "Treated and satisfied",
                "Treated and not pleased",
                "Untreated",
              ].map((v, i) => (
                <button
                  key={v}
                  className={`verdict-option outcome-${i} ${
                    outcome === v ? "selected" : ""
                  }`}
                  onClick={() => setOutcome(v)}
                >
                  <Icon name={i === 0 ? "check" : i === 1 ? "help" : "close"} />
                  {v}
                </button>
              ))}
            </div>
            <label>
              Your remark{" "}
              {outcome && outcome !== "Treated and satisfied"
                ? "(required)"
                : "(optional)"}
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Tell us what you noticed."
              />
            </label>
            <button
              disabled={
                !outcome ||
                (outcome !== "Treated and satisfied" && !remark.trim())
              }
              className="primary full"
              onClick={() => setDone(true)}
            >
              TREATED · Confirm as Musa Bello <Icon name="check" size={17} />
            </button>
          </>
        )}
      </div>
      <small className="confirmer-footer">
        <Icon name="shield" size={13} /> Your verdict protects the vehicle and
        the professional.
      </small>
    </div>
  )
}
