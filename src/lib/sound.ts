"use client"

import { useSyncExternalStore } from "react"

/**
 * The sound of a new notification. The tones are synthesised with the Web Audio API, so there is no audio
 * file to host, cache or lose. Browsers only allow sound after the person has touched the page once, so
 * `primeAudio()` listens for that first touch and unlocks the audio context; until then a new notification
 * is silent (the badge and the toast still appear).
 */
export type Tone = "soft" | "alert" | "success"

const PREF_KEY = "gowash.sound"

let context: AudioContext | null = null
let primed = false
const listeners = new Set<() => void>()

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }

const audio = (): AudioContext | null => {
  if (typeof window === "undefined") return null
  if (context) return context
  const Ctor = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
  if (!Ctor) return null
  try {
    context = new Ctor()
  } catch {
    context = null
  }
  return context
}

/** Whether the person wants sound. On unless they switched it off. */
export const soundEnabled = (): boolean => {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "off"
  } catch {
    return true
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, on ? "on" : "off")
  } catch {
    // private mode: the choice lasts until the tab closes
  }
  listeners.forEach((listener) => listener())
  if (on) playSound("soft", true)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => event.key === PREF_KEY && listener()
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}

/** `true` while sound is on; re-renders when it is switched (also from another tab). */
export const useSoundEnabled = (): boolean => useSyncExternalStore(subscribe, soundEnabled, () => true)

/** Unlocks audio on the first tap, click or key press anywhere on the page. Safe to call many times. */
export function primeAudio() {
  if (primed || typeof window === "undefined") return
  primed = true
  const unlock = () => {
    const ac = audio()
    if (ac && ac.state === "suspended") void ac.resume()
    window.removeEventListener("pointerdown", unlock)
    window.removeEventListener("keydown", unlock)
    window.removeEventListener("touchstart", unlock)
  }
  window.addEventListener("pointerdown", unlock, { passive: true })
  window.addEventListener("keydown", unlock)
  window.addEventListener("touchstart", unlock, { passive: true })
}

/** A bell-like note: a sine with a quieter octave on top, fading out quickly. */
function note(ac: AudioContext, frequency: number, start: number, length: number, volume: number) {
  for (const [multiple, level] of [[1, 1], [2, 0.28]] as const) {
    const oscillator = ac.createOscillator()
    const gain = ac.createGain()
    oscillator.type = multiple === 1 ? "sine" : "triangle"
    oscillator.frequency.setValueAtTime(frequency * multiple, start)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(volume * level, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
    oscillator.connect(gain)
    gain.connect(ac.destination)
    oscillator.start(start)
    oscillator.stop(start + length + 0.05)
  }
}

const PATTERNS: Record<Tone, { notes: [number, number][]; length: number; repeat?: number }> = {
  // A gentle two-note ding for everyday updates (A5 then E6).
  soft: { notes: [[880, 0], [1318.5, 0.16]], length: 0.55 },
  // Three rising notes, twice, for things that need someone to act (a new job, a wash to confirm).
  alert: { notes: [[987.8, 0], [1174.7, 0.13], [1480, 0.26]], length: 0.5, repeat: 2 },
  // A quick major arpeggio for good news.
  success: { notes: [[1046.5, 0], [1318.5, 0.1], [1568, 0.2]], length: 0.5 },
}

/** Plays a tone. Returns whether it could (sound off, or the browser has not unlocked audio yet). */
export function playSound(tone: Tone = "soft", force = false): boolean {
  if (!force && !soundEnabled()) return false
  const ac = audio()
  if (!ac) return false
  if (ac.state === "suspended") void ac.resume()
  if (ac.state !== "running") return false

  const { notes, length, repeat = 1 } = PATTERNS[tone]
  const span = Math.max(...notes.map(([, offset]) => offset)) + length * 0.6
  const volume = tone === "alert" ? 0.2 : 0.15
  for (let round = 0; round < repeat; round++) {
    for (const [frequency, offset] of notes) {
      note(ac, frequency, ac.currentTime + round * (span + 0.18) + offset, length, volume)
    }
  }
  return true
}

/** Notifications that ask someone to do something ring the stronger tone. */
const URGENT = new Set([
  "job_assigned",
  "verdict_needed",
  "job_frozen",
  "job_withdrawn",
  "company_verdict_alert",
  "application_approved",
])

export const toneFor = (kind: string | null | undefined): Tone => (kind && URGENT.has(kind) ? "alert" : "soft")
