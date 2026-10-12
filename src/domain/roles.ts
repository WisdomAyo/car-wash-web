export type Role = "Customer" | "Washman" | "Corporate" | "Estate" | "Super admin" | "Dispatcher" | "Finance" | "Support"
export const roles: Role[] = [
  "Customer",
  "Washman",
  "Corporate",
  "Estate",
  "Super admin",
]
export const operationsRoles: Role[] = ["Dispatcher", "Finance", "Support"]

export const workspaceRoute = (role: Role) =>
  `workspace/${role.toLowerCase().replace(/ /g, "-")}`

const databaseRoles: Record<Exclude<Role, "Customer">, string> = {
  Washman: "washman",
  Corporate: "corporate_manager",
  Estate: "estate_manager",
  "Super admin": "super_admin",
  Dispatcher: "dispatcher",
  Finance: "finance",
  Support: "support",
}

export const databaseRole = (role: Role) =>
  role === "Customer" ? null : databaseRoles[role]
