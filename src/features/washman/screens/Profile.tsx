"use client"

import { Async, Facts, Notice, PageHeader, Panel, Pill, Table } from "@/components/app/kit"
import { useResource } from "@/lib/api/hooks"
import type { StaffProfile } from "@/lib/api/types"
import { stamp } from "@/lib/format"
import { SCREENING_STATUS } from "@/lib/labels"

/** The washman's own record: who they are, what Go-Wash verified, which phone is theirs. */
export default function Profile() {
  const profile = useResource<StaffProfile>("/staff/me")
  return (
    <>
      <PageHeader eyebrow="YOUR RECORD" title="My profile" description="What Go-Wash has verified about you." />
      <Async query={profile}>
        {(p) => (
          <>
            {p.device.change_requested_at && (
              <Notice tone="warn" icon="alert">A sign-in from a different phone was held on {stamp(p.device.change_requested_at)}. Operations must approve a new phone before it can be used. Ask your dispatcher.</Notice>
            )}
            <div className="kit-grid side">
              <Panel title="Verification" action={<Pill status={p.screening_verified ? "verified" : "pending"} label={p.screening_verified ? "Fully verified" : "In progress"} />}>
                <Table rows={p.screening} rowKey={(s) => s.item} columns={[
                  { header: "Check", cell: (s) => s.label },
                  { header: "Status", cell: (s) => <Pill status={s.status === "verified" ? "verified" : s.status === "rejected" ? "rejected" : "pending"} label={SCREENING_STATUS[s.status] ?? s.status} /> },
                ]} />
              </Panel>
              <Panel title="You">
                <Facts items={[
                  ["Name", p.name], ["Staff code", p.staff_code], ["Phone", p.phone], ["Email", p.email], ["Home area", p.home_zone],
                  ["Skills", p.skills?.join(", ")], ["Jobs completed", p.jobs_completed],
                  ["Rating", p.rating ? `${p.rating.average.toFixed(1)} (${p.rating.count})` : "No ratings yet"],
                  ["Phone registered", p.device.registered ? "Yes" : "Not yet: the first phone you sign in on is registered"],
                ]} />
              </Panel>
            </div>
          </>
        )}
      </Async>
    </>
  )
}
