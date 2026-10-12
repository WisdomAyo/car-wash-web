import Button from "../../components/ui/Button"
import Input from "../../components/ui/Input"
import Heading from "../../components/ui/Typography"
import { createTicket, type Ticket } from "../../lib/customerApi"
import Textarea from "./FormControls"
import type { SaveAction } from "./VehiclesPanel"

export default function SupportPanel({
  tickets,
  busy,
  save,
}: {
  tickets: Ticket[]
  busy: boolean
  save: SaveAction
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="content-panel">
        <Heading level={2}>Keep care in the conversation</Heading>
        <p className="mt-3 text-base text-(--muted)">
          Tickets are saved to your account. Agent routing and email
          notifications are not connected yet.
        </p>
        <form
          onSubmit={async (event) => {
            event.preventDefault()
            const form = event.currentTarget
            const data = new FormData(form)
            if (
              await save(
                () =>
                  createTicket(
                    String(data.get("subject")).trim(),
                    String(data.get("message")).trim(),
                  ),
                "Support ticket saved. This phase does not notify an agent.",
              )
            )
              form.reset()
          }}
        >
          <fieldset disabled={busy} className="border-0 p-0">
            <label>
              Subject
              <Input name="subject" required minLength={3} maxLength={120} />
            </label>
            <label>
              How can we help?
              <Textarea
                name="message"
                required
                minLength={10}
                maxLength={2000}
              />
            </label>
            <p className="policy-note">
              Include the booking reference if relevant. Do not include
              passwords, identity documents or payment details.
            </p>
            <Button className="primary full" type="submit">
              Save support ticket
            </Button>
          </fieldset>
        </form>
      </section>
      <section className="content-panel">
        <Heading level={2}>Your support history</Heading>
        {!tickets.length && (
          <p className="py-8">
            No tickets yet. Your saved concerns and questions will appear here.
          </p>
        )}
        {tickets.map((ticket) => (
          <article key={ticket.id} className="border-b border-(--line) py-6">
            <div className="flex items-center justify-between gap-3">
              <Heading level={3} className="text-lg">
                {ticket.subject}
              </Heading>
              <span className="status-badge">{ticket.status}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap break-words">
              {ticket.message}
            </p>
            <p className="policy-note">
              Reference {ticket.id.slice(0, 8).toUpperCase()}
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}
