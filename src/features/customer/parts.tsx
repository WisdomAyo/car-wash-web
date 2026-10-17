"use client"

import type { ReactNode } from "react"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import type { CarFinish, CarVariant } from "@/components/Visuals"
import { useResource } from "@/lib/api/hooks"
import type { Booking, Tracking, TrackingStage, Vehicle, VehicleType } from "@/lib/api/types"
import { useCustomerUi } from "./CustomerUi"

const VARIANTS: Record<VehicleType, CarVariant> = { sedan: "sedan", suv: "suv", van: "suv", pickup: "pickup", bus: "suv" }

/** The paint the owner described, as the closest finish the illustration has. */
const finishFor = (colour: string): CarFinish => {
  const c = colour.toLowerCase()
  if (/silver|grey|gray|white|pearl|steel/.test(c)) return "silver"
  if (/green|emerald/.test(c)) return "emerald"
  if (/red|orange|maroon|burgundy|sunset/.test(c)) return "sunset"
  if (/gold|bronze|brown|beige|champagne|tan/.test(c)) return "bronze"
  return "midnight"
}

/** A vehicle's own illustration: body shape from its type, paint from its colour. */
export const VehicleArt = ({ vehicle }: { vehicle: Pick<Vehicle, "type" | "colour"> }) => (
  <CarArt variant={VARIANTS[vehicle.type] ?? "sedan"} finish={finishFor(vehicle.colour)} />
)

/** A plate as the workspace has always drawn it. */
export const VehiclePlate = ({ plate }: { plate: string }) => <Plate>{plate}</Plate>

/** Every page of the personal space opens the same way: eyebrow, title, line, and the booking button. */
export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  const { openModal } = useCustomerUi()
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">YOUR VEHICLE. OUR RESPONSIBILITY.</div>
        <h1>{title}</h1>
        <p>{children ?? "A little more care. A lot more peace of mind."}</p>
      </div>
      <button className="primary" onClick={() => openModal("booking")}>
        <Icon name="plus" size={18} />
        Book a wash
      </button>
    </div>
  )
}

/** A wash that is under way or about to be: the one the dashboard puts first. */
const LIVE = ["assigned", "accepted", "clocked_in", "ready", "verdict_given", "submitted"]

export const isLive = (b: Booking) => b.status === "confirmed" && LIVE.includes(b.job?.state ?? "")
export const isUpcoming = (b: Booking) => b.status === "confirmed" && !["closed", "cancelled", "unconfirmed", "disputed"].includes(b.job?.state ?? "")

/** The booking's live tracking, polled while the wash is under way. */
export const useTracking = (booking: Booking | undefined) =>
  useResource<Tracking>(booking ? `/bookings/${booking.id}/tracking` : null, undefined, { refetchInterval: booking && isLive(booking) ? 20_000 : undefined })

export type TrustCardData = { name: string; staff_code: string; verified: boolean; jobs_completed: number; rating: number | null; rating_count: number }

/** The workspace's water-line, drawn from a booking's real stages: done, the one under way, and what is still to come. */
export function WaterLine({ stages }: { stages: TrackingStage[] }) {
  const now = stages.findIndex((s) => !s.reached_at)
  return (
    <div className="water-line">
      {stages.map((s, i) => (
        <div key={s.key} className={[s.reached_at ? "complete reached" : "", i === now ? "now" : "", s.reached_at && stages[i + 1]?.reached_at ? "linked" : ""].join(" ").trim()}>
          <span>{s.reached_at ? <Icon name="check" size={12} /> : i === now ? <span className="progress-dot" /> : null}</span>
          <small>{s.label}</small>
        </div>
      ))}
    </div>
  )
}
