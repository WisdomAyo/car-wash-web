import { redirect } from "next/navigation"
import { authHref } from "@/lib/roles"

/** `/auth` has no screen of its own: send people to sign-in. */
export default function AuthIndexPage() {
  redirect(authHref("login"))
}
