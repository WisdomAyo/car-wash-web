"use client"

import Link from "next/link"
import { useState } from "react"
import { AsyncList, Empty, PageHeader, Panel, Pill, Table, Two } from "@/components/app/kit"
import { ConfirmDialog } from "@/components/app/overlays"
import { Icon, Plate } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { useAction, useList } from "@/lib/api/hooks"
import type { Place, Vehicle } from "@/lib/api/types"
import { humanise } from "@/lib/format"
import PlaceForm from "@/features/shared/PlaceForm"
import VehicleForm from "@/features/shared/VehicleForm"
import { useCustomerUi } from "../CustomerUi"
import { VehicleArt, PageHeading } from "../parts"

export function Vehicles() {
  const { openModal } = useCustomerUi()
  const list = useList<Vehicle>("/vehicles")
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [removing, setRemoving] = useState<Vehicle | null>(null)
  const remove = useAction((v: Vehicle) => api(`/vehicles/${v.id}`, { method: "DELETE" }), {
    invalidate: ["/vehicles"],
    success: "Vehicle removed.",
    onSuccess: () => setRemoving(null),
  })

  return (
    <>
      <PageHeading title="My vehicles" />
      <div className="section-heading">
        <h3>Your vehicles, cared for.</h3>
        <button className="secondary" onClick={() => openModal("vehicle")}>
          <Icon name="plus" />
          Add vehicle
        </button>
      </div>
      <AsyncList
        list={list}
        empty={
          <Empty icon="car" title="No vehicles yet." action={<button className="primary" onClick={() => openModal("vehicle")}>Add your first vehicle</button>}>
            Add the car you want washed. You need its number plate, make, model and colour.
          </Empty>
        }
      >
        {(items) => (
          <div className="vehicle-page-grid">
            {items.map((v) => (
              <div className="vehicle-card" key={v.id}>
                <VehicleArt vehicle={v} />
                <h3>
                  {v.make} {v.model}
                </h3>
                <Plate>{v.plate}</Plate>
                <p>
                  Registered vehicle · {v.type === "suv" ? "SUV" : humanise(v.type)} · {v.colour}
                </p>
                <div className="vehicle-actions">
                  <button className="primary" onClick={() => openModal({ name: "booking", vehicleId: v.id })}>
                    Book a wash
                  </button>
                  <Link className="secondary" href={`/workspace/customer/vehicles/${v.id}`}>
                    View Passport
                  </Link>
                </div>
                <div className="vehicle-footer">
                  <button onClick={() => setEditing(v)}>Edit details</button>
                  <button onClick={() => setRemoving(v)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AsyncList>
      {editing && <VehicleForm vehicle={editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Remove this vehicle?"
          description={`${removing.make} ${removing.model} (${removing.plate}) will no longer appear in your garage. Past washes stay in your history.`}
          confirmLabel="Remove it"
          danger
          pending={remove.pending}
          onConfirm={() => remove.run(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}

export function Places() {
  const list = useList<Place>("/locations")
  const [editing, setEditing] = useState<Place | "new" | null>(null)
  const [removing, setRemoving] = useState<Place | null>(null)
  const remove = useAction((p: Place) => api(`/locations/${p.id}`, { method: "DELETE" }), {
    invalidate: ["/locations"],
    success: "Place removed.",
    onSuccess: () => setRemoving(null),
  })

  return (
    <>
      <PageHeader
        eyebrow="WHERE WE MEET YOUR CAR"
        title="My places"
        description="Outdoor spots where your car can be washed: a driveway, a car park, a street frontage."
        action={
          <button className="primary" onClick={() => setEditing("new")}>
            <Icon name="plus" size={17} /> Add a place
          </button>
        }
      />
      <Panel>
        <AsyncList
          list={list}
          empty={
            <Empty icon="pin" title="No places saved." action={<button className="primary" onClick={() => setEditing("new")}>Add a place</button>}>
              Save the spot where your car is usually parked. You choose it when you book.
            </Empty>
          }
        >
          {(items) => (
            <Table
              rows={items}
              rowKey={(p) => p.id}
              columns={[
                { header: "Place", cell: (p) => <Two top={p.label} bottom={p.notes} /> },
                { header: "Address", cell: (p) => <Two top={p.address} bottom={`${p.area}, ${p.state_name}`} /> },
                { header: "Status", cell: (p) => <Pill status={p.is_approved ? "approved" : "pending"} label={p.is_approved ? "Approved outdoor spot" : "Waiting for approval"} /> },
                { header: "", className: "right", cell: (p) => (
                  <span className="kit-row" style={{ justifyContent: "flex-end" }}>
                    <button className="kit-link" onClick={() => setEditing(p)}>Edit</button>
                    <button className="kit-link kit-danger" onClick={() => setRemoving(p)}>Remove</button>
                  </span>
                ) },
              ]}
            />
          )}
        </AsyncList>
      </Panel>
      {editing && <PlaceForm place={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
      {removing && (
        <ConfirmDialog
          title="Remove this place?"
          description={`${removing.label} (${removing.address}) will be removed from your saved places.`}
          confirmLabel="Remove it"
          danger
          pending={remove.pending}
          onConfirm={() => remove.run(removing)}
          onClose={() => setRemoving(null)}
        />
      )}
    </>
  )
}
