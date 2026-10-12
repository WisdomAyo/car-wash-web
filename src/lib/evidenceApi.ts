import { supabase } from "./supabase"
import { recordJobPhoto, recordGpsPoint } from "./verifiedWashApi"

function client() {
  if (!supabase) throw new Error("Supabase configuration is missing.")
  return supabase
}

export function currentCoordinates() {
  return new Promise<GeolocationCoordinates>((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error("Location is unavailable on this device."))
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(new Error(error.message)),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    )
  })
}

export async function uploadEvidence(
  bookingId: string,
  phase: "before" | "after",
  file: File,
) {
  if (
    !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
    file.size > 10485760
  )
    throw new Error("Use a JPEG, PNG or WebP image up to 10 MB.")
  const db = client()
  const {
    data: { user },
  } = await db.auth.getUser()
  if (!user) throw new Error("Sign in before capturing evidence.")
  const extension = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
  const path = `${user.id}/${bookingId}/${phase}/${crypto.randomUUID()}.${extension}`
  const { error } = await db.storage
    .from("job-evidence")
    .upload(path, file, { upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  // Do not delete uploads on RPC failure: retain them for operational recovery.
  await recordJobPhoto(bookingId, phase, path)
  return path
}

export async function signedEvidence(path: string) {
  const { data, error } = await client()
    .storage.from("job-evidence")
    .createSignedUrl(path, 60)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function recognizePlate(bookingId: string, file: File) {
  if (file.type !== "image/jpeg" || file.size > 5242880)
    throw new Error("Plate recognition accepts JPEG images up to 5 MB.")
  const image = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(",")[1])
    reader.onerror = () => reject(new Error("Unable to read plate image."))
    reader.readAsDataURL(file)
  })
  const { data, error } = await client().functions.invoke("plate-ocr", {
    body: { bookingId, image },
  })
  if (error || !data?.plate)
    throw new Error(
      "OCR unavailable. Configure the provider or enter the plate manually.",
    )
  return String(data.plate)
}

/** Foreground-only, opt-in tracking; callers must stop on job change and unmount. */
export function sampleRoute(
  bookingId: string,
  report: (message: string) => void,
) {
  if (!navigator.geolocation) throw new Error("Location is unavailable.")
  let stopped = false
  let sending = false
  let lastSent = 0
  const watch = navigator.geolocation.watchPosition(
    async ({ coords }) => {
      if (
        stopped ||
        sending ||
        document.hidden ||
        coords.accuracy > 500 ||
        Date.now() - lastSent < 15000
      )
        return
      sending = true
      try {
        await recordGpsPoint(bookingId, coords)
        lastSent = Date.now()
        if (!stopped) report("Route point saved securely.")
      } catch (error) {
        if (!stopped)
          report(
            error instanceof Error ? error.message : "Route sampling failed.",
          )
      } finally {
        sending = false
      }
    },
    (error) => report(error.message),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
  )
  return () => {
    stopped = true
    navigator.geolocation.clearWatch(watch)
  }
}
