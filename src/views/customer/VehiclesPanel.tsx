import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Heading from "../../components/ui/Typography"
import { Icon, Plate } from "../../components/Visuals"
import { addVehicle, type Vehicle } from "../../lib/customerApi"
import { Select } from "./FormControls"

export type SaveAction = (
  action: () => Promise<void>,
  message: string,
) => Promise<boolean>
export default function VehiclesPanel({
  vehicles,
  busy,
  save,
}: {
  vehicles: Vehicle[]
  busy: boolean
  save: SaveAction
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="content-panel">
        <Heading level={2}>Your garage</Heading>
        <p className="mt-3 text-base text-(--muted)">
          A unique plate connects every request to the right vehicle.
        </p>
        {!vehicles.length && (
          <p className="py-8">
            Your garage is empty. Add your first vehicle to get started.
          </p>
        )}
        {vehicles.map((vehicle) => (
          <article
            className="flex items-center gap-4 border-b border-(--line) py-6"
            key={vehicle.id}
          >
            <Icon name="car" size={30} />
            <div className="flex-1">
              <Heading level={3} className="text-lg">
                {vehicle.make} {vehicle.model}
              </Heading>
              <p className="mt-2">
                {vehicle.colour} · {vehicle.vehicle_type}
              </p>
            </div>
            <Plate>{vehicle.plate}</Plate>
          </article>
        ))}
      </section>
      <section className="content-panel">
        <Heading level={2}>Add a vehicle</Heading>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            const field = (name: string) => String(data.get(name) || "").trim()
            if (
              await save(
                () =>
                  addVehicle({
                    make: field("make"),
                    model: field("model"),
                    plate: field("plate").toUpperCase(),
                    colour: field("colour"),
                    vehicle_type: field("vehicle_type"),
                  }),
                "Vehicle saved to your account.",
              )
            )
              form.reset()
          }}
        >
          <fieldset disabled={busy} className="border-0 p-0">
            <label>
              Number plate
              <Input
                name="plate"
                required
                minLength={4}
                maxLength={20}
                placeholder="e.g. LND 482 JK"
              />
            </label>
            <div className="form-grid">
              <label>
                Make
                <Input
                  name="make"
                  required
                  maxLength={80}
                  placeholder="Toyota"
                />
              </label>
              <label>
                Model
                <Input
                  name="model"
                  required
                  maxLength={80}
                  placeholder="Camry"
                />
              </label>
            </div>
            <div className="form-grid">
              <label>
                Colour
                <Input name="colour" required maxLength={60} />
              </label>
              <label>
                Vehicle type
                <Select name="vehicle_type">
                  {["Sedan", "SUV", "Truck", "Sports car", "Jeep", "Van"].map(
                    (type) => (
                      <option key={type}>{type}</option>
                    ),
                  )}
                </Select>
              </label>
            </div>
            <Button type="submit" className="primary full">
              Save vehicle <Icon name="plus" size={18} />
            </Button>
          </fieldset>
        </form>
      </section>
    </div>
  )
}
