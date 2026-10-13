"use client"

import { useState } from "react"
import { Icon } from "@/components/Visuals"

export default function ContactForm() {
  const [sent, setSent] = useState(false)
  return (
    <section className="contact-form public-section">
      <div className="eyebrow">LET&apos;S TALK</div>
      <h2>
        {sent
          ? "We've captured your message."
          : "A real conversation starts here."}
      </h2>
      {sent ? (
        <p>Demo inquiry created. No message was sent to a live support team.</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
        >
          <div className="form-grid">
            <label>
              Your name
              <input required placeholder="Full name" />
            </label>
            <label>
              Email
              <input type="email" required placeholder="you@company.com" />
            </label>
          </div>
          <label>
            How can we help?
            <textarea
              required
              placeholder="Tell us about your vehicles, estate or question."
            />
          </label>
          <button className="primary">
            Send demo inquiry <Icon name="arrow" size={17} />
          </button>
        </form>
      )}
    </section>
  )
}
