"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import Brand from "@/components/Brand"
import ButtonLink from "@/components/ui/ButtonLink"
import { api, ApiError } from "@/lib/api/client"
import type { Verdict } from "@/lib/api/types"
import { reasonLabel, verdictLabel } from "@/lib/labels"

const OUTCOME_ICON = ["check", "help", "close"] as const

/** The token out of a pasted link or a bare token. */
const tokenFrom = (text: string) => text.trim().replace(/\/+$/, "").split("/").pop() ?? ""

/**
 * One-tap verdict by signed link: the named driver or owner checks the wash and answers, with no account.
 * Without a link (`/confirm`) it explains where the link comes from and lets the person paste it.
 */
export default function Confirmer({ token }: { token?: string }) {
  const router = useRouter()
  const [verdict, setVerdict] = useState<Verdict | null>(null)
  const [problem, setProblem] = useState("")
  const [outcome, setOutcome] = useState("")
  const [remark, setRemark] = useState("")
  const [reasons, setReasons] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [pending, setPending] = useState(false)
  const [pasted, setPasted] = useState("")

  useEffect(() => {
    if (!token) return
    api<{ data: Verdict }>(`/public/verdict-links/${token}`, { anonymous: true })
      .then((r) => setVerdict(r.data))
      .catch((e) => setProblem(e instanceof ApiError ? e.message : "We could not open this link."))
  }, [token])

  const needsRemark = verdict?.outcomes.find((o) => o.key === outcome)?.remark_required ?? false
  const photos = verdict ? [...verdict.photos.after, ...verdict.photos.before] : []

  const submit = async () => {
    setPending(true)
    setProblem("")
    try {
      await api(`/public/verdict-links/${token}`, { method: "POST", anonymous: true, body: { outcome, remark: remark.trim() || undefined, reasons: reasons.length ? reasons : undefined } })
      setDone(true)
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "We could not record your answer. Please try again.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="confirmer-page">
      <Brand />
      <div className="confirmer-card">
        <div className="eyebrow">DELEGATED VERDICT</div>
        {!token ? (
          <>
            <h1>Your vehicle&apos;s final say.</h1>
            <p>When a wash is ready, the named confirmer gets a private link by message. Open it to check the wash and give the verdict. No account needed.</p>
            <div className="confirmer-vehicle">
              <CarArt silver />
            </div>
            <label>
              Paste your link
              <input value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="https://…/v/…" />
            </label>
            <button className="primary full" disabled={!tokenFrom(pasted)} onClick={() => router.push(`/v/${tokenFrom(pasted)}`)}>
              Open my link <Icon name="arrow" size={17} />
            </button>
          </>
        ) : problem && !verdict ? (
          <>
            <h1>This link can&apos;t be used.</h1>
            <p>{problem} Links work once and expire. Ask the person who manages your vehicles to send a fresh one.</p>
            <ButtonLink className="primary full" href="/">
              Back to Go-Wash <Icon name="arrow" size={16} />
            </ButtonLink>
          </>
        ) : !verdict ? (
          <>
            <h1>Opening your link…</h1>
            <div className="kit-loading"><span className="kit-spinner" /> One moment</div>
          </>
        ) : (
          <>
            <h1>{done ? "Your confirmation is on record." : verdict.awaiting_verdict ? "Your vehicle is ready." : "This wash is not waiting for you."}</h1>
            <p>
              {done
                ? outcome === "untreated"
                  ? "The job is disputed and final submission is blocked for review."
                  : "Your verdict is recorded. The washman's final plate scan is now unlocked."
                : verdict.awaiting_verdict
                  ? "You are the named confirmer for this vehicle. No account setup needed."
                  : "It has already been confirmed, or it is not ready yet."}
            </p>
            <div className="confirmer-vehicle">
              {photos.length ? (
                // Signed, expiring URL from the API.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photos[0]} alt="The vehicle after the wash" style={{ width: "100%", borderRadius: 12 }} />
              ) : (
                <CarArt silver />
              )}
              <h3>
                {verdict.service} <Plate>{verdict.plate}</Plate>
              </h3>
            </div>
            {done ? (
              <div className="confirmation">
                <Icon name="shield" size={42} />
                <h3>{verdictLabel(outcome)}</h3>
                <p>Thank you. Your verdict protects the vehicle and the professional.</p>
                <ButtonLink className="primary full" href="/">
                  Back to Go-Wash <Icon name="arrow" size={16} />
                </ButtonLink>
              </div>
            ) : verdict.awaiting_verdict ? (
              <>
                <div className="verdict-options">
                  {verdict.outcomes.map((o, i) => (
                    <button key={o.key} className={`verdict-option outcome-${i} ${outcome === o.key ? "selected" : ""}`} onClick={() => setOutcome(o.key)}>
                      <Icon name={OUTCOME_ICON[i] ?? "check"} />
                      {verdictLabel(o.key)}
                    </button>
                  ))}
                </div>
                {outcome && outcome !== "satisfied" && (
                  <div className="reason-chips">
                    {verdict.quick_reasons.map((r) => (
                      <button key={r} type="button" className={reasons.includes(r) ? "selected" : ""} onClick={() => setReasons(reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r])}>
                        {reasonLabel(r)}
                      </button>
                    ))}
                  </div>
                )}
                <label>
                  Your remark {needsRemark ? "(required)" : "(optional)"}
                  <textarea value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Tell us what you noticed." />
                </label>
                {problem && <p className="form-error" role="alert">{problem}</p>}
                <button disabled={!outcome || (needsRemark && !remark.trim()) || pending} className="primary full" onClick={submit}>
                  {pending ? "Recording…" : "Confirm the wash"} <Icon name="check" size={17} />
                </button>
              </>
            ) : null}
          </>
        )}
      </div>
      <small className="confirmer-footer">
        <Icon name="shield" size={13} /> Your verdict protects the vehicle and the professional.
      </small>
    </div>
  )
}
