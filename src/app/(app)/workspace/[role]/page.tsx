import { notFound, redirect } from "next/navigation"
import { allRoles, roleFromSlug, roleSlug, workspaceHref } from "@/lib/roles"

type Props = { params: Promise<{ role: string }> }

export const dynamicParams = false
export const generateStaticParams = () => allRoles.map((role) => ({ role: roleSlug(role) }))

/** Old per-role addresses (`/workspace/dispatcher`, …) lead to the space that role now uses. */
export default async function WorkspaceRoleRedirect({ params }: Props) {
  const role = roleFromSlug((await params).role)
  if (!role) notFound()
  redirect(workspaceHref(role))
}
