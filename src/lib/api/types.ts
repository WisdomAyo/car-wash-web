/** What the Laravel API returns. Money is always in kobo (1/100 naira); times are ISO 8601 strings. */

export type VehicleType = "sedan" | "suv" | "van" | "pickup" | "bus"
export const vehicleTypes: VehicleType[] = ["sedan", "suv", "van", "pickup", "bus"]

export type User = {
  id: string
  name: string
  phone: string | null
  email: string | null
  email_verified: boolean
  phone_verified: boolean
  has_password: boolean
  status: string
  roles: string[]
  referral_code: string | null
  staff_code?: string
}

export type Vehicle = {
  id: string
  plate: string
  plate_temporary: boolean
  make: string
  model: string
  colour: string
  type: VehicleType
  organisation_id: string | null
  confirmer_id: string | null
}

export type Place = {
  id: string
  label: string
  address: string
  area: string
  state: string
  state_name: string
  notes: string | null
  lat: number
  lng: number
  geofence_radius_m: number
  is_approved: boolean
}

export type Service = {
  id: string
  slug: string
  name: string
  description: string | null
  duration_minutes: number
  is_active: boolean
  prices: Partial<Record<VehicleType, number>>
}

export type Slot = { starts_at: string; ends_at: string; label: string; available: boolean }

export type Plan = {
  id: string
  slug: string
  family: string
  version: number
  name: string
  scope: "individual" | "corporate"
  months: number
  washes_included: number
  rollover_max: number
  price_kobo: number
  discount_percent: number
  is_active: boolean
}

export type BookingStatus =
  | "pending_payment"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "expired"
  | (string & {})

export type JobRef = { id: string; state: string; result: string | null }

export type Booking = {
  id: string
  reference: string
  status: BookingStatus
  starts_at: string
  ends_at: string
  amount_kobo: number
  billing: string
  invoice_id: string | null
  reward_discount_kobo: number
  currency: string
  service_name: string
  vehicle_plate: string
  rescheduled_count: number | null
  cancelled_at: string | null
  vehicle?: Vehicle
  location?: Place
  job?: JobRef | null
}

export type Payment = {
  id: string
  booking_id: string | null
  subscription_id: string | null
  invoice_id: string | null
  reference: string
  status: string
  amount_kobo: number
  refunded_kobo: number | null
  currency: string
  authorization_url?: string
  paid_at: string | null
}

export type TrackingStage = { key: string; label: string; reached_at: string | null }

export type Tracking = {
  booking: Booking
  stages: TrackingStage[]
  trust_card: Record<string, unknown> | null
  photos: { before: string[]; after: string[] } | null
  [key: string]: unknown
}

export type Verdict = {
  job_id: string
  state: string
  service: string
  plate: string
  awaiting_verdict: boolean
  verdict_deadline: string | null
  photos: { before: string[]; after: string[] }
  outcomes: { key: string; remark_required: boolean }[]
  quick_reasons: string[]
}

export type Receipt = {
  receipt_no: string
  payment_id: string
  reference: string
  issued_at: string
  status: string
  currency: string
  amount_kobo: number
  refunded_kobo: number
  net_kobo: number
  for: { type: string; id: string; description: string; vehicle_plate: string | null; starts_at: string | null }
  refunds: { id: string; amount_kobo: number; status: string; reason: string }[]
}

export type Subscription = {
  id: string
  status: string
  organisation_id: string | null
  plan: Plan
  washes_included: number
  washes_used: number
  washes_remaining: number
  amount_kobo: number
  current_period: number
  starts_at: string | null
  ends_at: string | null
  auto_renew: boolean
  payment_method: string | null
  cancelled_at: string | null
  grace_ends_at: string | null
  next_payment_attempt_at: string | null
}

export type Ticket = {
  id: string
  type: string
  status: string
  job_id: string | null
  category: string | null
  body: string
  decision: string | null
  decision_note: string | null
  decided_at: string | null
  created_at: string
}

export type TicketMessage = {
  id: string
  kind: string
  from: string
  body: string
  attachments: { id: string; name: string; url: string }[]
  at: string
  author?: { id: string; name: string }
}

export type AppNotification = {
  id: string
  kind: string
  title: string
  body: string
  data: Record<string, unknown>
  read: boolean
  created_at: string
}

export type Consent = { type: string; version: string; accepted: boolean; accepted_at: string | null }

export type Preferences = {
  language: string
  notifications: { push: boolean; marketing: boolean }
  default_vehicle_id: string | null
  default_location_id: string | null
}

export type Referrals = {
  enabled: boolean
  code: string
  share_url: string
  offer: { friend_gets_kobo: number; you_get_kobo: number; valid_days: number }
  stats: { invited: number; qualified: number; earned_kobo: number; available_kobo: number; pending_kobo: number; spent_kobo: number }
  rewards: { id: string; type: string; amount_kobo: number; status: string; friend: { name: string } | null; expires_at: string | null; created_at: string }[]
}

export type DataRequest = {
  id: string
  type: "copy" | "deletion"
  status: "pending" | "completed" | "rejected"
  note: string | null
  person?: { id: string; name: string; email: string | null; phone: string | null }
  requested_at: string
  due_at: string
  overdue: boolean
  decided_at: string | null
  decision_note: string | null
  download_url: string | null
  download_size_bytes: number | null
}

export type Organisation = {
  id: string
  type: "corporate" | "estate"
  name: string
  status: string
  discount_percent: number
  plan_months: number | null
  payment_terms: string
  invoice_due_days: number
  join_code: string | null
  address: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  billing_email: string | null
  my_role?: "owner" | "manager" | "confirmer" | "estate_manager" | "resident"
}

export type Member = { id: string; name: string; email: string | null; phone: string | null; role: string }

export type Invoice = {
  id: string
  number: string
  organisation?: { id: string; name: string }
  period: string
  status: "issued" | "paid" | "void"
  overdue: boolean
  total_kobo: number
  currency: string
  washes: number
  issued_at: string
  due_at: string
  paid_at: string | null
  paid_via: string | null
  subtotal_kobo?: number
  paid_reference?: string | null
  lines?: { booking_id: string; reference: string; date: string; plate: string; service: string; amount_kobo: number }[]
}

export type EstateWindow = { weekday: number; starts_at: string }

export type WindowRequest = {
  id: string
  organisation_id: string
  estate?: { id: string; name: string }
  requested_by?: { id: string; name: string }
  windows: EstateWindow[]
  note: string | null
  status: "pending" | "approved" | "rejected"
  decision_note: string | null
  decided_at: string | null
  created_at: string
}

export type EstateInfo = {
  id: string
  name: string
  status: string
  discount_percent: number
  join_code: string
  windows: EstateWindow[]
  locations: { id: string; label: string; address: string; area: string; geofence_radius_m: number }[]
  pending_request: string | null
}

/** A job as the washman sees it: plate and exact place appear only once they are allowed to. */
export type StaffJob = {
  id: string
  state: string
  reference: string
  service: string
  plate: string | null
  vehicle: { make: string; model: string; colour: string } | null
  slot: { starts_at: string; ends_at: string }
  area: string
  location: { address: string; notes: string | null; lat: number; lng: number; geofence_radius_m: number } | null
  conduct_rule: string
  job_code: string | null
  release_available_at: string | null
  release_requested: boolean
  waiting_for_verdict: boolean
  frozen: boolean
  can_submit: boolean
}

export type StaffProfile = {
  id: string
  name: string
  staff_code: string
  phone: string
  email: string | null
  status: string
  home_zone: string | null
  skills: string[]
  screening: { item: string; label: string; status: string }[]
  screening_verified: boolean
  device: { registered: boolean; change_requested_at: string | null }
  shift: { on_shift: boolean; available: boolean }
  rating: { average: number; count: number } | null
  jobs_completed: number
}

export type StaffSummary = {
  date: string
  timezone: string
  total: number
  upcoming: number
  in_progress: number
  completed: number
  cancelled: number
  next_job: { id: string; starts_at: string; service: string; area: string } | null
  jobs: { id: string; state: string; starts_at: string; service: string; area: string }[]
}

export type ApplicationItem = { item: string; label: string; status: string; needs_upload: boolean; documents: { id: string; name: string; uploaded_at?: string }[] }

export type Application = {
  stage: "incomplete" | "in_review" | "approved" | "declined"
  staff_code: string
  name: string
  phone: string
  email: string | null
  home_zone: string | null
  skills: string[] | null
  guarantor: { name: string | null; phone: string | null }
  applied_at: string
  decision_note: string | null
  still_to_provide: string[]
  items: ApplicationItem[]
}

/** The job row the dispatcher works from. */
export type AdminJob = {
  id: string
  state: string
  result: string | null
  flagged: boolean
  flags: string[]
  verdict_outcome: string | null
  ready_at: string | null
  release_requested_at: string | null
  closed_at: string | null
  proofs: { gps: boolean; plate: boolean; verdict: boolean } | null
  washman?: { id: string; name: string; staff_code: string } | null
  booking: { id: string; reference: string; service_name: string; vehicle_plate: string; starts_at: string; ends_at: string }
}

export type AdminStaff = {
  id: string
  name: string
  phone: string
  email: string | null
  staff_code: string
  status: string
  screening: Record<string, string>
  screening_verified: boolean
  skills: string[] | null
  home_zone: string | null
  applied_at: string | null
  guarantor: { name: string | null; phone: string | null } | null
  decision_note: string | null
  documents?: { id: string; item: string; name: string; url: string; uploaded_at: string }[]
  on_shift: boolean
  is_available: boolean
  device_bound: boolean
  pending_device_requested_at: string | null
  jobs_completed: number
  rating: number | null
  integrity_flags: number
  last_location: { lat: number; lng: number; at: string } | null
}

export type AdminPayment = Payment

export type Refund = {
  id: string
  payment_id: string
  amount_kobo: number
  reason: string
  status: string
  requested_at: string
  decided_at: string | null
  completed_at: string | null
  note?: string | null
  requested_by_id?: string | null
  decided_by_id?: string | null
  attempts?: number
  gateway_refund_id?: string | null
  outcome_unknown_at?: string | null
  failure_reason?: string | null
  payment?: Payment
}

export type Inquiry = {
  id: string
  reference: string
  kind: "contact" | "organisation" | "assistant"
  name: string
  email: string
  phone: string | null
  message: string
  details: Record<string, unknown> | null
  status: "new" | "answered" | "closed"
  reply: string | null
  answered_at: string | null
  created_at: string
}

export type KnowledgeArticle = {
  id: string
  slug: string
  title: string
  category: string
  body: string
  keywords: string[]
  status: "draft" | "published"
  sort_order: number
  uses: number
  helpful: number
  unhelpful: number
  published_at: string | null
  updated_at: string
}

export type HelpArticle = { slug: string; title: string; category: string; body: string; updated_at: string }

export type AssistantMessage = {
  id: string
  role: "visitor" | "assistant" | "staff"
  text: string
  outcome: "answered" | "clarify" | "escalated" | null
  sources: { title: string; slug: string | null }[]
  feedback: "helpful" | "not_helpful" | null
  created_at: string
}

export type AssistantConversation = {
  id: string
  status: string
  needs_contact: boolean
  handed_over: boolean
  reference?: string | null
  contact_email: string | null
}

export type AssistantTurn = { conversation: AssistantConversation; token?: string; messages: AssistantMessage[] }

export type AdminUser = {
  id: string
  name: string
  email: string
  phone: string | null
  status: string
  role: string
  two_factor: boolean
  last_login_at: string | null
  created_at: string
}

export type RoleInfo = {
  role: string
  label: string
  summary: string
  permissions: { key: string; label: string }[]
  holders: number
}
