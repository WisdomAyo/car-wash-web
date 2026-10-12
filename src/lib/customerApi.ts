import { supabase } from "./supabase"

export type Vehicle = {
  id: string
  make: string
  model: string
  plate: string
  colour: string
  vehicle_type: string
}
export type Location = {
  id: string
  label: string
  address: string
  city: string
  state: string
}
export type Service = {
  id: string
  name: string
  price_kobo: number
  cancellation_minutes: number
}
export type Booking = {
  id: string
  service_name: string
  vehicle_label: string
  plate: string
  location_label: string
  scheduled_at: string
  status: string
  price_kobo: number
  cancellation_minutes: number
}
export type Payment = {
  id: string
  booking_id: string
  provider: string
  reference: string
  amount_kobo: number
  currency: string
  status: string
  authorization_url: string | null
  created_at: string
}
export type Ticket = {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
}
export type CustomerRecords = {
  vehicles: Vehicle[]
  locations: Location[]
  services: Service[]
  bookings: Booking[]
  payments: Payment[]
  tickets: Ticket[]
}
function client() {
  if (!supabase) throw new Error("Supabase configuration is missing.")
  return supabase
}
type DatabaseFailure = {
  message: string
  code?: string
}
function failure(error: DatabaseFailure) {
  if (error.code === "23505")
    return new Error(
      "This number plate is already registered. Check the plate or contact support to resolve ownership.",
    )
  if (["42P01", "PGRST205", "PGRST202"].includes(error.code || ""))
    return new Error(
      "Account storage is not deployed yet. Apply the migration in SUPABASE_SETUP.md, then retry. Nothing has been saved.",
    )
  return new Error(error.message)
}
export async function loadCustomerRecords(): Promise<CustomerRecords> {
  const db = client()
  const results = await Promise.all([
    db.from("gw_vehicles").select("*").order("created_at"),
    db.from("gw_locations").select("*").order("created_at"),
    db.from("gw_services").select("*").eq("active", true).order("price_kobo"),
    db
      .from("gw_bookings")
      .select("*")
      .order("scheduled_at", { ascending: false }),
    db
      .from("gw_payments")
      .select("*")
      .order("created_at", { ascending: false }),
    db
      .from("gw_support_tickets")
      .select("*")
      .order("created_at", { ascending: false }),
  ])
  for (const result of results) if (result.error) throw failure(result.error)
  return {
    vehicles: results[0].data as Vehicle[],
    locations: results[1].data as Location[],
    services: results[2].data as Service[],
    bookings: results[3].data as Booking[],
    payments: results[4].data as Payment[],
    tickets: results[5].data as Ticket[],
  }
}
export async function addVehicle(value: Omit<Vehicle, "id">) {
  const { error } = await client().from("gw_vehicles").insert(value)
  if (error) throw failure(error)
}
export async function addLocation(value: Omit<Location, "id">) {
  const { error } = await client().from("gw_locations").insert(value)
  if (error) throw failure(error)
}
export async function requestBooking(value: {
  vehicleId: string
  locationId: string
  serviceId: string
  scheduledAt: string
  requestId: string
}) {
  const { error } = await client().rpc("gw_request_booking", {
    p_vehicle_id: value.vehicleId,
    p_location_id: value.locationId,
    p_service_id: value.serviceId,
    p_scheduled_at: value.scheduledAt,
    p_request_id: value.requestId,
  })
  if (error) throw failure(error)
}
export async function changeBooking(id: string, scheduledAt: string | null) {
  const { error } = await client().rpc("gw_change_booking", {
    p_booking_id: id,
    p_scheduled_at: scheduledAt,
  })
  if (error) throw failure(error)
}
export async function initializePayment(bookingId: string, requestId: string) {
  const { data, error } = await client().functions.invoke("payments", {
    body: { bookingId, requestId },
  })
  if (error)
    throw new Error(
      "Unable to initialize payment. Confirm the Paystack sandbox secret and Edge Function deployment.",
    )
  if (!data?.authorizationUrl)
    throw new Error(data?.error || "Payment provider did not return checkout.")
  return String(data.authorizationUrl)
}
export async function createTicket(subject: string, message: string) {
  const { error } = await client()
    .from("gw_support_tickets")
    .insert({ subject, message })
  if (error) throw failure(error)
}
