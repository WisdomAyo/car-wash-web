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

export const authHref = (mode: AuthMode, role?: Role) =>
  role ? `/auth/${mode}?role=${encodeURIComponent(role)}` : `/auth/${mode}`

/** Organisation roles get the partner portal; every other non-customer role gets live operations. */
export type PartnerRole = Extract<Role, "Corporate" | "Estate">
export const isPartnerRole = (role: Role): role is PartnerRole =>
  role === "Corporate" || role === "Estate"
