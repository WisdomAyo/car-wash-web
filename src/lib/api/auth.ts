import { api } from "./client"
import type { Application, Organisation, User } from "./types"

type Signed = { token: string; user: User }

const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body, anonymous: true })

/** Every way to sign in or recover an account. None of these send a token: they are how you get one. */
export const authApi = {
  login: (identifier: string, password: string) => post<Signed>("/auth/login", { identifier, password, device_name: "Go-Wash web" }),

  register: (body: { name: string; email: string; password: string; phone?: string; referral_code?: string }) =>
    post<Signed>("/auth/register", { ...body, device_name: "Go-Wash web" }),

  forgot: (email: string) => post<{ message: string }>("/auth/password/forgot", { email }),

  reset: (body: { token: string; email: string; password: string }) => post<void>("/auth/password/reset", body),

  /** An invitation link: sets the first password and signs the person in. */
  setPassword: (body: { token: string; email: string; password: string }) => post<Signed>("/auth/password/set", body),

  verifyEmail: (body: { token: string; email: string }) => post<{ data: User }>("/auth/email/verify", body),

  staffLogin: (staff_code: string, pin: string, device_id: string) => post<Signed>("/auth/staff/login", { staff_code, pin, device_id }),

  applicantLogin: (identifier: string, pin: string) =>
    post<{ token: string; application: Application; user: User }>("/auth/applicant/login", { identifier, pin }),

  adminLogin: (email: string, password: string, totp: string) => post<Signed>("/auth/admin/login", { email, password, totp }),

  apply: (body: {
    name: string
    phone: string
    email?: string
    pin: string
    home_zone?: string
    guarantor_name?: string
    guarantor_phone?: string
  }) => post<{ token: string; application: Application; user: User }>("/applications/washman", body),

  resendConfirmation: () => api<{ message: string }>("/auth/email/resend", { method: "POST" }),
}

/** The organisations a signed-in customer belongs to (empty for a person with only a personal account). */
export const myOrganisations = () => api<{ data: Organisation[] }>("/organisations").then((r) => r.data)
