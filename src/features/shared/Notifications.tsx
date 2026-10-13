"use client"

import { AsyncList, Empty, PageHeader, Panel } from "@/components/app/kit"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { useAction, useList } from "@/lib/api/hooks"
import type { AppNotification } from "@/lib/api/types"
import { relative } from "@/lib/format"

/** The signed-in person's notifications. `path` is `/notifications` for customers and `/staff/notifications` for washmen. */
export default function Notifications({ path }: { path: string }) {
  const list = useList<AppNotification>(path)
  const markRead = useAction(() => api(`${path}/read`, { method: "POST" }), { invalidate: [path] })
  const unread = list.items.filter((n) => !n.read).length

  return (
    <>
      <PageHeader
        eyebrow="STAY IN THE LOOP"
        title="Notifications"
        description="Updates about your washes, payments and support."
        action={
          unread > 0 ? (
            <button className="secondary" onClick={() => markRead.run()} disabled={markRead.pending}>
              <Icon name="check" size={16} /> Mark all read
            </button>
          ) : undefined
        }
      />
      <Panel>
        <AsyncList list={list} empty={<Empty icon="bell" title="Nothing new.">We will tell you here when something happens.</Empty>}>
          {(items) => (
            <div className="kit-list">
              {items.map((n) => (
                <div className="kit-item" key={n.id}>
                  <span className="kit-icon-tile">
                    <Icon name="bell" size={18} />
                  </span>
                  <div className="grow">
                    <h4>
                      {n.title} {!n.read && <span className="kit-pill tone-info">New</span>}
                    </h4>
                    <p>{n.body}</p>
                  </div>
                  <span className="kit-faint">{relative(n.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </AsyncList>
      </Panel>
    </>
  )
}
