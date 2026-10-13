"use client"

import { useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Input from "@/components/ui/Input"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { chatTopics, getChatReply, type ChatMessage } from "./chat"

export default function CustomerChat() {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 0,
      author: "guide",
      text: "Hi there. A fresher day starts with a little help. What would you like to know about Go-Wash?",
    },
  ])
  const input = useRef<HTMLInputElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const end = useRef<HTMLDivElement>(null)
  const close = () => {
    setOpen(false)
    launcher.current?.focus()
  }
  useEffect(() => {
    if (!open) return
    input.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false)
        launcher.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open])
  useEffect(() => {
    if (open) end.current?.scrollIntoView({ block: "nearest" })
  }, [messages, open])
  const send = (value: string) => {
    const text = value.trim()
    if (!text) return
    setMessages((previous) => [
      ...previous,
      { id: Date.now(), author: "customer", text },
      { id: Date.now() + 1, author: "guide", text: getChatReply(text) },
    ])
    setDraft("")
  }
  return (
    <div className="customer-chat">
      {open && (
        <section
          className="chat-panel"
          role="dialog"
          aria-label="Go-Wash customer care"
          id="customer-care-chat"
        >
          <header className="chat-header">
            <span className="chat-brand-mark">
              <Icon name="drop" size={26} />
            </span>
            <div>
              <Heading level={3}>Your care companion</Heading>
              <span>Go-Wash · Demo help guide</span>
            </div>
            <Button
              className="panel-icon-button"
              aria-label="Close chat"
              onClick={close}
            >
              <Icon name="close" />
            </Button>
          </header>
          <div className="chat-welcome">
            <span className="eyebrow">A LITTLE HELP. A LOT OF CARE.</span>
            <p>Less guesswork. More peace of mind.</p>
          </div>
          <div
            className="chat-messages"
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {messages.map((message) => (
              <div
                className={`chat-message ${message.author}`}
                key={message.id}
              >
                <small>
                  {message.author === "guide" ? "GO-WASH GUIDE" : "YOU"}
                </small>
                <p>{message.text}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          {messages.length === 1 && (
            <div className="chat-topics">
              {chatTopics.map((topic) => (
                <Button key={topic} onClick={() => send(topic)}>
                  {topic}
                  <Icon name="arrow" size={14} />
                </Button>
              ))}
            </div>
          )}
          <div className="chat-contact">
            <Icon name="shield" size={14} />
            <span>Local demo · No messages sent</span>
            <ButtonLink href="/contact" onClick={close}>
              Talk to our team
            </ButtonLink>
          </div>
          <form
            className="chat-composer"
            onSubmit={(event) => {
              event.preventDefault()
              send(draft)
            }}
          >
            <Input
              ref={input}
              aria-label="Your message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="How can we help?"
              maxLength={1000}
            />
            <Button
              type="submit"
              aria-label="Send message"
              disabled={!draft.trim()}
            >
              <Icon name="arrow" />
            </Button>
          </form>
        </section>
      )}
      <Button
        ref={launcher}
        className={`chat-launcher ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-label={
          open ? "Close customer care chat" : "Open customer care chat"
        }
        aria-controls="customer-care-chat"
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className="chat-launcher-icon">
          <Icon name={open ? "close" : "help"} size={24} />
        </span>
        <span>
          Need a hand?<small>Let&apos;s talk care</small>
        </span>
      </Button>
    </div>
  )
}
