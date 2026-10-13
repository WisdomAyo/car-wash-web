import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CustomerWorkspace from "@/features/customer/CustomerWorkspace"
import PartnerPortal from "@/features/partners/PartnerPortal"
import NotConnected from "@/features/workspace/NotConnected"
import { allRoles, isPartnerRole, roleFromSlug, roleSlug } from "@/lib/roles"

type Props = { params: Promise<{ role: string }> }

export const dynamicParams = false
export const generateStaticParams = () =>
  allRoles.map((role) => ({ role: roleSlug(role) }))

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const role = roleFromSlug((await params).role)
  return { title: role ? `${role} workspace` : "Workspace" }
}

export default async function WorkspacePage({ params }: Props) {
  const role = roleFromSlug((await params).role)
  if (!role) notFound()
  if (role === "Customer") return <CustomerWorkspace />
  if (isPartnerRole(role)) return <PartnerPortal role={role} />
  // Staff and operations workspaces need the backend, which is not connected yet.
  return <NotConnected title={`The ${role} workspace is on its way.`} />
}
