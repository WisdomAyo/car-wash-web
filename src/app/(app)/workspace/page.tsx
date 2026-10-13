import { redirect } from "next/navigation"
import { workspaceHref } from "@/lib/roles"

/** `/workspace` is the customer workspace; keep one canonical URL for it. */
export default function WorkspaceIndexPage() {
  redirect(workspaceHref("Customer"))
}
