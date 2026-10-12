import { supabase } from "./supabase"

export type AssignedJob = {
  booking_id: string
  service_name: string
  vehicle_label: string
  plate: string
  scheduled_at: string
  status: string
  location_label: string | null
}

type Coordinates = {
  latitude: number
  longitude: number
  accuracy: number
}

function client() {
  if (!supabase) throw new Error("Supabase configuration is missing.")
  return supabase
}

async function rpc<T = unknown>(
  name: string,
  parameters: Record<string, unknown>,
) {
  const { data, error } = await client().rpc(name, parameters)
  if (error) throw new Error(error.message)
  return data as T
}

export async function loadAssignedJobs() {
  return rpc<AssignedJob[]>("gw_my_assigned_jobs", {})
}

export async function assignJob(bookingId: string, staffId: string) {
  await rpc("gw_assign_job", {
    p_booking_id: bookingId,
    p_staff_id: staffId,
  })
}

export async function acceptJob(bookingId: string) {
  await rpc("gw_staff_accept", { p_booking_id: bookingId })
}

export async function recordGpsPoint(
  bookingId: string,
  coordinates: Coordinates,
) {
  await rpc("gw_record_gps_point", {
    p_booking_id: bookingId,
    p_latitude: coordinates.latitude,
    p_longitude: coordinates.longitude,
    p_accuracy_m: coordinates.accuracy,
  })
}

export async function clockIn(
  bookingId: string,
  plate: string,
  source: "ocr" | "manual",
  coordinates: Coordinates,
) {
  return rpc<string>("gw_staff_clock_in", {
    p_booking_id: bookingId,
    p_scanned_plate: plate,
    p_source: source,
    p_latitude: coordinates.latitude,
    p_longitude: coordinates.longitude,
    p_accuracy_m: coordinates.accuracy,
  })
}

export async function recordJobPhoto(
  bookingId: string,
  phase: "before" | "after",
  storagePath: string,
) {
  return rpc<string>("gw_record_job_photo", {
    p_booking_id: bookingId,
    p_phase: phase,
    p_storage_path: storagePath,
  })
}

export async function startWash(bookingId: string) {
  await rpc("gw_start_wash", { p_booking_id: bookingId })
}

export async function markWashReady(bookingId: string) {
  await rpc("gw_mark_ready", { p_booking_id: bookingId })
}

export async function giveVerdict(
  bookingId: string,
  outcome: "satisfied" | "not_pleased" | "untreated",
  remark?: string,
) {
  await rpc("gw_give_verdict", {
    p_booking_id: bookingId,
    p_outcome: outcome,
    p_remark: remark || null,
  })
}

export async function submitJob(
  bookingId: string,
  plate: string,
  source: "ocr" | "manual",
  coordinates: Coordinates,
) {
  return rpc<string>("gw_staff_submit", {
    p_booking_id: bookingId,
    p_scanned_plate: plate,
    p_source: source,
    p_latitude: coordinates.latitude,
    p_longitude: coordinates.longitude,
    p_accuracy_m: coordinates.accuracy,
  })
}

export async function clockOut(bookingId: string) {
  await rpc("gw_staff_clock_out", { p_booking_id: bookingId })
}

export async function releaseJob(bookingId: string, reason: string) {
  await rpc("gw_admin_release_job", {
    p_booking_id: bookingId,
    p_reason: reason,
  })
}
