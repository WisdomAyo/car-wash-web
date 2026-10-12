import PublicLayout from "../../components/PublicLayout"
import ContactForm from "../../components/ContactForm"
import Heading from "../../components/ui/Typography"
import Button from "../../components/ui/Button"
import { Icon } from "../../components/Visuals"
import type { Navigate } from "../../domain/publicContent"

export default function ContactPage({ navigate }: { navigate: Navigate }) {
  return (
    <PublicLayout page="contact" navigate={navigate}>
      <section className="contact-page-heading">
        <div className="eyebrow">REAL PEOPLE. REAL CLARITY.</div>
        <Heading level={1}>
          A little help.
          <br />
          <em>A real conversation.</em>
        </Heading>
        <p>
          A booking question, a fleet plan or a concern on your mind—good care
          begins with listening.
        </p>
      </section>
      <div className="contact-page-grid">
        <ContactForm />
        <aside className="contact-guidance">
          <Icon name="help" size={45} />
          <Heading level={3}>An active wash needs a little attention?</Heading>
          <p>
            Use the job's support flow to keep your concern connected to its
            evidence. This prototype inquiry form does not send messages to a
            live team.
          </p>
          <Button
            className="secondary"
            onClick={() => navigate("auth/login", "Customer")}
          >
            Open your account
            <Icon name="arrow" size={18} />
          </Button>
        </aside>
      </div>
    </PublicLayout>
  )
}
