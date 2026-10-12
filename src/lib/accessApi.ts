import { supabase } from "./supabase"

export type WorkspaceAccess = {
  role: string
  status: "pending" | "approved" | "suspended"
  organisation_id: string | null
  organisation: {
    name: string
    kind: "corporate" | "estate"
    status: "pending" | "active" | "suspended"
  } | null
}

type DatabaseFailure = {
  message: string
  code?: string
}

function failure(error: DatabaseFailure) {
  if (["42P01", "PGRST205"].includes(error.code || ""))
    return new Error(
      "Protected workspace access is not deployed yet. Apply the role-access migration in SUPABASE_SETUP.md.",
    )
  return new Error(error.message)
}

export async function loadWorkspaceAccess(): Promise<WorkspaceAccess[]> {
  if (!supabase) throw new Error("Supabase configuration is missing.")
  const { data, error } = await supabase
    .from("gw_memberships")
    .select(
      "role,status,organisation_id,organisation:gw_organisations(name,kind,status)",
    )
    .order("created_at")
  if (error) throw failure(error)
  return (data || []) as unknown as WorkspaceAccess[]
}
