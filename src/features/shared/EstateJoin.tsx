"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import Brand from "@/components/Brand"
import { Icon } from "@/components/Visuals"
import { api, ApiError } from "@/lib/api/client"
import { useSession } from "@/lib/auth"
import type { EstateWindow } from "@/lib/api/types"
import { describeWindows } from "@/features/shared/WindowsEditor"

type Info = { name: string; discount_percent: number; windows: EstateWindow[] }

/** What an estate's QR code opens: its name and wash days, then join (signing in first if needed). */
export default function EstateJoin({ code }: { code: string }) {
  const router = useRouter()
  const session = useSession()
  const [info, setInfo] = useState<Info | null>(null)
  const [problem, setProblem] = useState("")
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    api<{ data: Info }>(`/estates/${encodeURIComponent(code)}`, { anonymous: true })
      .then((r) => setInfo(r.data))
      .catch((e) => setProblem(e instanceof ApiError && e.status === 404 ? "We can't find an estate for this link. Check it with your estate office." : "We could not open this link. Please try again."))
  }, [code])

  const join = async () => {
    setJoining(true)
    setProblem("")
    try {
      await api("/estates/join", { method: "POST", body: { code } })
      router.push("/workspace/customer/book")
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "We could not add you. Please try again.")
      setJoining(false)
    }
  }

  const next = encodeURIComponent(`/estate/${code}`)
  const customer = session?.kind === "customer"

  return (
    <div className="confirmer-page">
      <Brand />
      <div className="confirmer-card">
        <div className="eyebrow">YOUR ESTATE · WASH MORNINGS</div>
        {problem && !info ? (
          <>
            <h1>This link can&apos;t be opened.</h1>
            <p>{problem}</p>
          </>
        ) : !info ? (
          <div className="kit-loading"><span className="kit-spinner" /> Opening your estate…</div>
        ) : (
          <>
            <h1>{info.name}</h1>
            <p>Washes come to you at the estate&apos;s approved outdoor spot, on the days it agreed. Every washman is screened and every wash verified.</p>
            <div className="review-summary">
              <div><span>Wash days</span><strong>{describeWindows(info.windows) || "Agreed with the estate"}</strong></div>
              {info.discount_percent > 0 && <div><span>Resident pricing</span><strong>{info.discount_percent}% off</strong></div>}
              <div><span>Where</span><strong>Outdoors only</strong></div>
            </div>
            {problem && <p className="form-error" role="alert">{problem}</p>}
            {session === undefined ? null : customer ? (
              <button className="primary full" disabled={joining} onClick={join}>
                {joining ? "Joining…" : `Join ${info.name}`} <Icon name="arrow" size={17} />
              </button>
            ) : (
              <>
                <Link className="primary full link-btn" href={`/auth/login?next=${next}`}>Sign in to join <Icon name="arrow" size={17} /></Link>
                <Link className="secondary full link-btn" href={`/auth/register?next=${next}`}>Create an account</Link>
                <p className="kit-hint">Already on Go-Wash? Sign in with your customer account.</p>
              </>
            )}
          </>
        )}
      </div>
      <small className="confirmer-footer">
        <Icon name="shield" size={13} /> Go-Wash · Your vehicle. Our responsibility.
      </small>
    </div>
  )
}
