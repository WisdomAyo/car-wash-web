import Link from "next/link"
import type { ComponentProps } from "react"

/**
 * A real link that takes the same classes as `Button`. Use it for navigation so the
 * destination is crawlable, prefetched in the viewport and openable in a new tab.
 */
export default function ButtonLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={className ? `link-btn ${className}` : "link-btn"}
      {...props}
    />
  )
}
