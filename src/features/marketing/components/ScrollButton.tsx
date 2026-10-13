"use client"

import type { ReactNode } from "react"
import Button from "@/components/ui/Button"

/** Smooth-scrolls to an element on the same page. */
export default function ScrollButton({
  targetId,
  className,
  children,
}: {
  targetId: string
  className?: string
  children: ReactNode
}) {
  return (
    <Button
      className={className}
      onClick={() =>
        document
          .getElementById(targetId)
          ?.scrollIntoView({ behavior: "smooth" })
      }
    >
      {children}
    </Button>
  )
}
