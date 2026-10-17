export type Role =
  | "Customer"
  | "Washman"
  | "Corporate"
  | "Estate"
  | "Super admin"
  | "Dispatcher"
  | "Finance"
  | "Support"

export const roles: Role[] = [
  "Customer",
  "Washman",
  "Corporate",
  "Estate",
  "Super admin",
]
export const operationsRoles: Role[] = ["Dispatcher", "Finance", "Support"]
export const allRoles: Role[] = [...roles, ...operationsRoles]

/** `Super admin` -> `super-admin`: the URL segment for a role's workspace. */
export const roleSlug = (role: Role) => role.toLowerCase().replace(/ /g, "-")

export const roleFromSlug = (slug: string): Role | undefined =>
  allRoles.find((role) => roleSlug(role) === slug.toLowerCase())

/** Accepts the `?role=` query value case-insensitively, falling back to the default. */
export const roleFromParam = (
  value: string | undefined,
  fallback: Role = "Customer",
): Role =>
  allRoles.find((role) => role.toLowerCase() === value?.toLowerCase()) ??
  fallback

/** Dispatcher, finance, support and super admin share one operations space; what they see follows their role. */
export const isAdminRole = (role: Role) =>
  role === "Super admin" || operationsRoles.includes(role)

export const workspaceHref = (role: Role) =>
  isAdminRole(role) ? "/workspace/admin" : `/workspace/${roleSlug(role)}`

export type AuthMode = "login" | "register" | "recover"
export const authModes: AuthMode[] = ["login", "register", "recover"]

/** The only audiences on the public sign-in / sign-up pages. Staff and operations have their own pages. */
export const publicAuthRoles: Role[] = ["Customer", "Corporate", "Estate"]

/** The field team's own sign-in, and the operations team's (same page, other tab). */
export const staffLoginHref = (options: { team?: "operations"; next?: string } = {}) => {
  const params = new URLSearchParams()
  if (options.team) params.set("team", options.team)
  if (options.next) params.set("next", options.next)
  const text = params.toString()
  return text ? `/staff/login?${text}` : "/staff/login"
}

/** Where someone applies to become a washman. */
export const washmanApplyHref = "/become-a-washman"

/** Where a washman is told how to get a PIN reset or a new phone approved. */
export const staffHelpHref = "/staff/help"

export const authHref = (mode: AuthMode, role?: Role) => {
  if (role === "Washman") {
    return mode === "register" ? washmanApplyHref : mode === "recover" ? staffHelpHref : staffLoginHref()
  }
  if (role && isAdminRole(role)) return staffLoginHref({ team: "operations" })
  return role ? `/auth/${mode}?role=${encodeURIComponent(role)}` : `/auth/${mode}`
}

/** Organisation roles get the partner portal; every other non-customer role gets live operations. */
export type PartnerRole = Extract<Role, "Corporate" | "Estate">
export const isPartnerRole = (role: Role): role is PartnerRole =>
  role === "Corporate" || role === "Estate"
