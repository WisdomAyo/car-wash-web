import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Heading from "../../components/ui/Typography"
import { Icon } from "../../components/Visuals"
import { nigeriaStates } from "../../domain/nigeria"
import { addLocation, type Location } from "../../lib/customerApi"
import { Select } from "./FormControls"
import type { SaveAction } from "./VehiclesPanel"

export default function LocationsPanel({
  locations,
  busy,
  save,
}: {
  locations: Location[]
  busy: boolean
  save: SaveAction
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="content-panel">
        <Heading level={2}>Where we meet you</Heading>
        <p className="mt-3 text-base text-(--muted)">
          All 36 states and the FCT. Every request is subject to team
          availability.
        </p>
        {!locations.length && (
          <p className="py-8">
            Save an outdoor location at home, work or your estate.
          </p>
        )}
        {locations.map((location) => (
          <article
            key={location.id}
            className="flex gap-4 border-b border-(--line) py-6"
          >
            <Icon name="pin" size={26} />
            <div>
              <Heading level={3} className="text-lg">
                {location.label}
              </Heading>
              <p className="mt-2">{location.address}</p>
              <p>
                {location.city}, {location.state}
              </p>
            </div>
          </article>
        ))}
      </section>
      <section className="content-panel">
        <Heading level={2}>Save an outdoor location</Heading>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            const field = (name: string) => String(data.get(name) || "").trim()
            if (
              await save(
                () =>
                  addLocation({
                    label: field("label"),
                    address: field("address"),
                    city: field("city"),
                    state: field("state"),
                  }),
                "Outdoor location saved.",
              )
            )
              form.reset()
          }}
        >
          <fieldset disabled={busy} className="border-0 p-0">
            <label>
              Location name
              <Input
                name="label"
                required
                maxLength={80}
                placeholder="Home car park"
              />
            </label>
            <label>
              Street address & access instructions
              <Input name="address" required minLength={5} maxLength={300} />
            </label>
            <div className="form-grid">
              <label>
                City / town
                <Input name="city" required maxLength={100} />
              </label>
              <label>
                State
                <Select name="state" required defaultValue="">
                  <option value="" disabled>
                    Select a state
                  </option>
                  {nigeriaStates.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </Select>
              </label>
            </div>
            <label className="checkbox-label">
              <Input type="checkbox" required />
              <span>
                This is an approved outdoor space. Staff will not enter private
                indoor premises.
              </span>
            </label>
            <Button type="submit" className="primary full">
              Save location <Icon name="plus" size={18} />
            </Button>
          </fieldset>
        </form>
      </section>
    </div>
  )
}
