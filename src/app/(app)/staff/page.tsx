import { redirect } from "next/navigation"
import { staffLoginHref } from "@/lib/roles"

/** `/staff` has no screen of its own: send people to the staff sign-in. */
export default function StaffIndexPage() {
  redirect(staffLoginHref())
}
