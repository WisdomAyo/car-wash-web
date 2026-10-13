"use client"

import { useState, type ReactNode } from "react"
import { Modal } from "@/components/app/overlays"
import { CheckField } from "@/components/app/forms"
import { api } from "@/lib/api/client"
import { useAction, useItems } from "@/lib/api/hooks"
import type { Consent } from "@/lib/api/types"
import { humanise } from "@/lib/format"
import Link from "next/link"

const documents: Record<string, { title: string; text: string; href?: string }> = {
  outdoor_policy: {
    title: "Outdoor-only service",
    text: "I understand Go-Wash washes cars outdoors only, at approved spots, and that staff never enter private indoor premises.",
  },
  privacy_notice: { title: "Privacy notice", text: "I have read the privacy notice and agree to how Go-Wash uses my details.", href: "/privacy" },
  location_tracking: {
    title: "Location tracking while working",
    text: "I agree that my phone's location is recorded while I work a job, to prove each wash happened at the right place.",
  },
}

/**
 * Nobody books (or works) before accepting the current terms. Shows what is still to accept, once, and lets the
 * rest of the space through when it is done. `path` is `/consents` or `/staff/consents`.
 */
export default function ConsentGate({ path, children }: { path: string; children: ReactNode }) {
  const consents = useItems<Consent>(path)
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const missing = consents.items.filter((c) => !c.accepted)

  const accept = useAction(
    async () => {
      for (const c of missing) {
        await api(path, { method: "POST", body: { type: c.type, version: c.version } })
      }
    },
    { invalidate: [path], success: "Thank you. You are all set." },
  )

  return (
    <>
      {children}
      {missing.length > 0 && (
        <Modal title="Before we begin" eyebrow="A QUICK AGREEMENT" onClose={() => {}}>
          <p>Please confirm the following. You can read the details at any time.</p>
          <form
            className="kit-form"
            onSubmit={(event) => {
              event.preventDefault()
              accept.run()
            }}
          >
            {missing.map((c) => {
              const doc = documents[c.type]
              return (
                <CheckField
                  key={c.type}
                  required
                  checked={Boolean(ticked[c.type])}
                  onChange={(event) => setTicked({ ...ticked, [c.type]: event.target.checked })}
                >
                  <b>{doc?.title ?? humanise(c.type)}.</b> {doc?.text ?? "I accept."}{" "}
                  {doc?.href && (
                    <Link href={doc.href} target="_blank" className="kit-link">
                      Read it
                    </Link>
                  )}
                </CheckField>
              )
            })}
            <div className="actions">
              <button className="primary" disabled={accept.pending || missing.some((c) => !ticked[c.type])}>
                {accept.pending ? "Saving…" : "I agree"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
