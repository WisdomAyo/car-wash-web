import { humanise } from "./format"

/** How a job's state reads to the customer. */
const JOB_FOR_CUSTOMER: Record<string, string> = {
  booked: "Waiting for a washman",
  assigned: "Washman assigned",
  accepted: "On the way",
  clocked_in: "Washing now",
  ready: "Ready for your check",
  verdict_given: "You confirmed",
  submitted: "Finishing up",
  closed: "Completed",
  disputed: "Under review",
  unconfirmed: "Closed",
  cancelled: "Cancelled",
}

export const jobForCustomer = (state: string | undefined | null) => (state ? (JOB_FOR_CUSTOMER[state] ?? humanise(state)) : "—")

/** A booking's one-line status, preferring what the job is doing once there is a job. */
export const bookingStatusLabel = (status: string, jobState?: string | null) => {
  if (status === "pending_payment") return "Awaiting payment"
  if (status === "cancelled") return "Cancelled"
  if (status === "expired") return "Expired"
  if (jobState && status === "confirmed") return jobForCustomer(jobState)
  return humanise(status)
}

export const jobResultLabel = (result: string | null | undefined) =>
  ({
    closed_verified: "Verified and confirmed",
    closed_complaint_open: "Closed, complaint open",
    closed_unconfirmed: "Closed without your confirmation",
    closed_upheld: "Completion upheld after review",
    closed_override: "Closed by Go-Wash",
    closed_rewash: "Re-wash arranged",
  })[result ?? ""] ?? humanise(result)

export const verdictLabel = (key: string) =>
  ({ satisfied: "Looks great", not_pleased: "Not pleased", untreated: "Wash not done" })[key] ?? humanise(key)

export const reasonLabel = (key: string) =>
  ({
    missed_areas: "Missed areas",
    interior_not_done: "Interior not done",
    arrived_late: "Arrived late",
    staff_conduct: "Staff conduct",
    damage_concern: "Damage concern",
    other: "Something else",
  })[key] ?? humanise(key)

export const SCREENING_STATUS: Record<string, string> = {
  missing: "Not provided",
  submitted: "Submitted",
  verified: "Verified",
  rejected: "Needs attention",
}
