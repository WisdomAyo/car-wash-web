"use client"

import { useState } from "react"
import { Field, FormError, useForm } from "@/components/app/forms"
import { Drawer } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useItems } from "@/lib/api/hooks"
import type { Place } from "@/lib/api/types"

type Coverage = { state: string; name: string; available: boolean }

/**
 * A place where a car is washed: it must be outdoors, and its pin is what the washman's arrival is checked
 * against. The pin comes from the phone's location, or typed coordinates.
 */
export default function PlaceForm({
  place,
  /** Saves under another path, e.g. an estate's approved spots (admin). */
  createPath = "/locations",
  invalidate = ["/locations"],
  onClose,
  onSaved,
}: {
  place?: Place
  createPath?: string
  invalidate?: string[]
  onClose: () => void
  onSaved?: (place: Place) => void
}) {
  const coverage = useItems<Coverage>("/coverage")
  const form = useForm({
    label: place?.label ?? "",
    address: place?.address ?? "",
    area: place?.area ?? "",
    state: place?.state ?? "LA",
    notes: place?.notes ?? "",
    lat: place ? String(place.lat) : "",
    lng: place ? String(place.lng) : "",
  })
  const [locating, setLocating] = useState(false)
  const [locationError, setLocationError] = useState("")

  const locate = () => {
    setLocating(true)
    setLocationError("")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        form.setValues((v) => ({ ...v, lat: position.coords.latitude.toFixed(6), lng: position.coords.longitude.toFixed(6) }))
        setLocating(false)
      },
      () => {
        setLocationError("We could not read your location. Allow location access, or type the coordinates.")
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const save = useAction(
    async () => {
      const v = form.values
      const body = {
        label: v.label,
        address: v.address,
        area: v.area,
        state: v.state,
        notes: String(v.notes).trim() || null,
        lat: Number(v.lat),
        lng: Number(v.lng),
      }
      const response = await api<{ data: Place }>(place ? `/locations/${place.id}` : createPath, {
        method: place ? "PATCH" : "POST",
        body,
      })
      return response.data
    },
    {
      invalidate,
      success: place ? "Place updated." : "Place saved.",
      onSuccess: (saved) => {
        onSaved?.(saved)
        onClose()
      },
    },
  )

  const hasPin = form.values.lat !== "" && form.values.lng !== ""

  return (
    <Drawer title={place ? "Edit place" : "Add a place"} eyebrow="WHERE THE WASH HAPPENS" onClose={onClose}>
      <form
        className="kit-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.run()
        }}
      >
        <Field label="Name" error={fieldError(save.error, "label")} hint="e.g. Home, Office car park.">
          <input {...form.field("label")} required />
        </Field>
        <Field label="Street address" error={fieldError(save.error, "address")}>
          <input {...form.field("address")} required placeholder="12 Admiralty Way" />
        </Field>
        <div className="form-grid">
          <Field label="Area" error={fieldError(save.error, "area")}>
            <input {...form.field("area")} required placeholder="Lekki Phase 1" />
          </Field>
          <Field label="State" error={fieldError(save.error, "state")}>
            <select {...form.field("state")}>
              {coverage.items.map((s) => (
                <option key={s.state} value={s.state}>
                  {s.name}
                  {s.available ? "" : " (not served yet)"}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="How to find the car" error={fieldError(save.error, "notes")} hint="A gate colour, a landmark, where to park.">
          <textarea {...form.field("notes")} rows={2} />
        </Field>
        <div className="kit-file">
          <div className="kit-strong">Pin the spot</div>
          <p className="kit-muted">
            The washman has to be at this pin to start the job. It must be an outdoor spot (driveway, car park, street frontage).
          </p>
          <div>
            <button type="button" className="secondary" onClick={locate} disabled={locating}>
              <Icon name="pin" size={16} />
              {locating ? "Finding you…" : hasPin ? "Use my location again" : "Use my current location"}
            </button>
          </div>
          {locationError && <span className="kit-danger">{locationError}</span>}
          <div className="form-grid">
            <Field label="Latitude" error={fieldError(save.error, "lat")}>
              <input {...form.field("lat")} required inputMode="decimal" placeholder="6.4474" />
            </Field>
            <Field label="Longitude" error={fieldError(save.error, "lng")}>
              <input {...form.field("lng")} required inputMode="decimal" placeholder="3.4723" />
            </Field>
          </div>
        </div>
        <FormError message={save.error && save.error.code !== "validation_failed" ? save.error.message : null} />
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={save.pending || !hasPin}>
            {save.pending ? "Saving…" : place ? "Save changes" : "Save place"}
          </button>
        </div>
      </form>
    </Drawer>
  )
}
