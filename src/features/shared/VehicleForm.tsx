"use client"

import { Field, CheckField, useForm, FormError } from "@/components/app/forms"
import { Drawer } from "@/components/app/overlays"
import { api } from "@/lib/api/client"
import { fieldError, useAction } from "@/lib/api/hooks"
import { vehicleTypes, type Vehicle, type VehicleType } from "@/lib/api/types"
import { humanise } from "@/lib/format"

/** Add a vehicle, or edit one (the plate is fixed once registered: it is how washes are matched). */
export default function VehicleForm({
  vehicle,
  organisationId,
  onClose,
  onSaved,
}: {
  vehicle?: Vehicle
  /** Registers the vehicle to a company instead of the signed-in person. */
  organisationId?: string
  onClose: () => void
  onSaved?: (vehicle: Vehicle) => void
}) {
  const form = useForm({
    plate: vehicle?.plate ?? "",
    make: vehicle?.make ?? "",
    model: vehicle?.model ?? "",
    colour: vehicle?.colour ?? "",
    type: (vehicle?.type ?? "sedan") as string,
    plate_temporary: vehicle?.plate_temporary ?? false,
  })

  const save = useAction(
    async () => {
      const { plate, make, model, colour, type, plate_temporary } = form.values
      const body = vehicle
        ? { make, model, colour, type }
        : { plate: String(plate).trim(), make, model, colour, type, plate_temporary, organisation_id: organisationId }
      const response = await api<{ data: Vehicle }>(vehicle ? `/vehicles/${vehicle.id}` : "/vehicles", {
        method: vehicle ? "PATCH" : "POST",
        body,
      })
      return response.data
    },
    {
      invalidate: ["/vehicles", organisationId ? `/organisations/${organisationId}/bookings` : "/bookings"],
      success: vehicle ? "Vehicle updated." : "Vehicle added.",
      onSuccess: (saved) => {
        onSaved?.(saved)
        onClose()
      },
    },
  )

  return (
    <Drawer title={vehicle ? "Edit vehicle" : "Add a vehicle"} eyebrow="YOUR VEHICLE. OUR RESPONSIBILITY." onClose={onClose}>
      <form
        className="kit-form"
        onSubmit={(event) => {
          event.preventDefault()
          save.run()
        }}
      >
        <Field label="Number plate" error={fieldError(save.error, "plate")} hint={vehicle ? "The plate cannot be changed. Add a new vehicle instead." : "As it is on the car, e.g. LND 482 JK."}>
          <input
            {...form.field("plate")}
            required
            disabled={Boolean(vehicle)}
            className={vehicle ? "kit-readonly" : undefined}
            style={{ textTransform: "uppercase" }}
            placeholder="LND 482 JK"
          />
        </Field>
        <div className="form-grid">
          <Field label="Make" error={fieldError(save.error, "make")}>
            <input {...form.field("make")} required placeholder="Toyota" />
          </Field>
          <Field label="Model" error={fieldError(save.error, "model")}>
            <input {...form.field("model")} required placeholder="Corolla" />
          </Field>
        </div>
        <div className="form-grid">
          <Field label="Colour" error={fieldError(save.error, "colour")}>
            <input {...form.field("colour")} required placeholder="Silver" />
          </Field>
          <Field label="Vehicle type" error={fieldError(save.error, "type")} hint="The price depends on it.">
            <select {...form.field("type")}>
              {vehicleTypes.map((type: VehicleType) => (
                <option key={type} value={type}>
                  {type === "suv" ? "SUV" : humanise(type)}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {!vehicle && (
          <CheckField {...form.check("plate_temporary")}>This is a temporary or dealer plate (it will need correcting later).</CheckField>
        )}
        <FormError message={save.error && save.error.code !== "validation_failed" ? save.error.message : null} />
        <div className="actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={save.pending}>
            {save.pending ? "Saving…" : vehicle ? "Save changes" : "Add vehicle"}
          </button>
        </div>
      </form>
    </Drawer>
  )
}
