"use client"

import Link from "next/link"
import { Async, Empty, PageHeader, Panel, Pill, Plate, Table, Two } from "@/components/app/kit"
import { Icon } from "@/components/Visuals"
import { useRaw } from "@/lib/api/hooks"
import type { Vehicle } from "@/lib/api/types"
import { day, humanise } from "@/lib/format"
import { jobResultLabel, verdictLabel } from "@/lib/labels"

type Entry = { job_id: string; date: string; service: string; washman: string; area: string; result: string; verdict: string; proofs: { gps: boolean; plate: boolean; verdict: boolean } }

/** A vehicle's Wash Passport: every wash with the three proofs behind it (right place, right plate, owner confirmed). */
export default function Passport({ vehicleId, back }: { vehicleId: string; back: string }) {
  const passport = useRaw<{ vehicle: Vehicle; data: Entry[] }>(`/vehicles/${vehicleId}/passport`)
  return (
    <Async query={passport}>
      {(p) => (
        <>
          <PageHeader
            eyebrow="WASH PASSPORT"
            title={`${p.vehicle.make} ${p.vehicle.model}`}
            description="A clear record of every wash, and what proved it happened."
            action={<Link className="secondary" href={back}>All vehicles</Link>}
          />
          <Panel title="Wash history" action={<Plate value={p.vehicle.plate} />}>
            {p.data.length === 0 ? (
              <Empty icon="shield" title="No washes yet.">Each completed wash is recorded here with its proof.</Empty>
            ) : (
              <Table rows={p.data} rowKey={(e) => e.job_id} columns={[
                { header: "Date", cell: (e) => <Two top={day(e.date)} bottom={e.area} /> },
                { header: "Service", cell: (e) => <Two top={e.service} bottom={`by ${e.washman}`} /> },
                { header: "Result", cell: (e) => <Pill status={e.result.includes("verified") ? "verified" : "pending"} label={jobResultLabel(e.result)} /> },
                { header: "Your verdict", cell: (e) => verdictLabel(e.verdict) },
                { header: "Proofs", cell: (e) => (
                  <span className="kit-row" style={{ gap: 6 }}>
                    {(["gps", "plate", "verdict"] as const).map((k) => (
                      <span key={k} className={`kit-pill tone-${e.proofs[k] ? "ok" : "neutral"}`}>{k === "gps" ? "Place" : humanise(k)}</span>
                    ))}
                  </span>
                ) },
              ]} />
            )}
            <p className="kit-hint"><Icon name="shield" size={16} /> Place = the washman was at your pin · Plate = the plate matched · Verdict = you confirmed.</p>
          </Panel>
        </>
      )}
    </Async>
  )
}
