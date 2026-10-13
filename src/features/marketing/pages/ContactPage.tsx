import ContactForm from "@/features/marketing/components/ContactForm"
import Heading from "@/components/ui/Typography"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon } from "@/components/Visuals"
import { authHref } from "@/lib/roles"

export default function ContactPage() {
  return (
    <>
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
            Use the job&apos;s support flow to keep your concern connected to
            its evidence. This prototype inquiry form does not send messages to
            a live team.
          </p>
          <ButtonLink
            className="secondary"
            href={authHref("login", "Customer")}
          >
            Open your account
            <Icon name="arrow" size={18} />
          </ButtonLink>
        </aside>
      </div>
    </>
  )
}
