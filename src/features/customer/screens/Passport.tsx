"use client"

import { useState } from "react"
import { Async, Empty } from "@/components/app/kit"
import { Icon, Plate } from "@/components/Visuals"
import { useList, useRaw } from "@/lib/api/hooks"
import type { Vehicle } from "@/lib/api/types"
import { longDay } from "@/lib/format"
import { jobResultLabel, verdictLabel } from "@/lib/labels"
import { useCustomerUi } from "../CustomerUi"
import { PageHeading } from "../parts"

type Entry = { job_id: string; booking_id: string; date: string; service: string; washman: string | null; area: string; result: string | null; verdict: string | null; proofs: { gps: boolean; plate: boolean; verdict: boolean } }

/** Every vehicle's Wash Passport: each wash, the three proofs behind it, and its evidence pack. */
export default function Passport({ vehicleId }: { vehicleId?: string }) {
  const vehicles = useList<Vehicle>("/vehicles")
  const [picked, setPicked] = useState(vehicleId ?? "")
  const vehicle = vehicles.items.find((v) => v.id === (picked || vehicles.items[0]?.id))
  return (
    <>
      <PageHeading title="Wash Passport" />
      {vehicles.items.length > 1 && (
        <div className="reason-chips" role="group" aria-label="Choose a vehicle">
          {vehicles.items.map((v) => (
            <button type="button" key={v.id} className={v.id === vehicle?.id ? "selected" : ""} onClick={() => setPicked(v.id)}>
              {v.make} {v.model}
            </button>
          ))}
        </div>
      )}
      {vehicle ? <VehiclePassport vehicle={vehicle} /> : vehicles.isPending ? null : <Empty icon="shield" title="No vehicle yet.">Add a vehicle and book a wash to start its passport.</Empty>}
    </>
  )
}

function VehiclePassport({ vehicle }: { vehicle: Vehicle }) {
  const { openModal } = useCustomerUi()
  const passport = useRaw<{ vehicle: Vehicle; data: Entry[] }>(`/vehicles/${vehicle.id}/passport`)
  return (
    <>
      <section className="passport-banner">
        <Icon name="shield" size={48} />
        <div>
          <div className="eyebrow">YOUR VEHICLE&apos;S VERIFIED CARE RECORD</div>
          <h2>A clean history. A clear conscience.</h2>
          <p>Every wash, every proof, every little detail. All in one place.</p>
        </div>
        <Plate>{vehicle.plate}</Plate>
      </section>
      <section className="content-panel">
        <div className="section-heading">
          <h3>
            {vehicle.make} {vehicle.model}
          </h3>
          <span>{passport.data ? `${passport.data.data.length} verified wash${passport.data.data.length === 1 ? "" : "es"}` : ""}</span>
        </div>
        <Async query={passport} empty={<Empty icon="shield" title="No washes yet.">Each completed wash is recorded here with its proof.</Empty>} isEmpty={(p) => p.data.length === 0}>
          {(p) => (
            <>
              {p.data.map((e) => (
                <div className="history-row" key={e.job_id}>
                  <span className="stat-icon">
                    <Icon name="shield" />
                  </span>
                  <div>
                    <h4>{e.service}</h4>
                    <p>
                      {longDay(e.date)} · {e.washman ?? "Go-Wash team"} · {e.area}
                      {e.result ? ` · ${jobResultLabel(e.result)}` : ""}
                      {e.verdict ? ` · ${verdictLabel(e.verdict)}` : ""}
                    </p>
                  </div>
                  <div className="passport-proofs">
                    {(
                      [
                        ["gps", "pin", "GPS"],
                        ["plate", "car", "Plate"],
                        ["verdict", "check", "Verdict"],
                      ] as const
                    ).map(([key, icon, label]) => (
                      <span key={key} style={e.proofs[key] ? undefined : { opacity: 0.4 }} title={e.proofs[key] ? `${label} proof recorded` : `${label} proof missing`}>
                        <Icon name={icon} size={13} /> {label}
                      </span>
                    ))}
                  </div>
                  <button className="text-button" onClick={() => openModal({ name: "receipt", id: e.booking_id })}>
                    Evidence pack <Icon name="arrow" size={15} />
                  </button>
                </div>
              ))}
            </>
          )}
        </Async>
      </section>
    </>
  )
}
