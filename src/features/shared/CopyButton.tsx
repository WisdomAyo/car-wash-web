"use client"

import { useState } from "react"
import { Icon } from "@/components/Visuals"

/** Copies `text` to the clipboard and says so for a moment. */
export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      className="secondary"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          window.setTimeout(() => setCopied(false), 2500)
        } catch {
          // clipboard blocked: the text is on screen to select
        }
      }}
    >
      <Icon name={copied ? "check" : "copy"} size={15} /> {copied ? "Copied" : label}
    </button>
  )
}
