"use client"

import { setSoundEnabled, useSoundEnabled } from "@/lib/sound"

/** The speaker button next to the bell: switches notification sound on or off, and asks once for desktop alerts. */
export default function SoundToggle() {
  const on = useSoundEnabled()

  const toggle = () => {
    setSoundEnabled(!on)
    // Turning sound on is a clear request to be told: this is the moment to ask for desktop alerts too.
    if (!on && typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission()
    }
  }

  return (
    <button
      type="button"
      className={`notification-btn sound-toggle ${on ? "is-on" : "is-off"}`}
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Notification sound is on. Turn it off" : "Notification sound is off. Turn it on"}
      title={on ? "Sound on" : "Sound off"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        {on ? <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /> : <path d="m16 9 5 6m0-6-5 6" />}
      </svg>
    </button>
  )
}
