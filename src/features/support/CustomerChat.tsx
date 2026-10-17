"use client"

import { usePathname } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import Button from "@/components/ui/Button"
import ButtonLink from "@/components/ui/ButtonLink"
import Input from "@/components/ui/Input"
import Heading from "@/components/ui/Typography"
import { Icon } from "@/components/Visuals"
import { api, ApiError } from "@/lib/api/client"
import type { AssistantConversation, AssistantMessage, AssistantTurn } from "@/lib/api/types"

type Widget = { enabled: boolean; ai: boolean; greeting: string; suggestions: string[]; max_message_chars: number }

const STORE = "gowash.assistant"

type Options = Parameters<typeof api>[1]

/** The API wraps every turn in `data`. */
const turnOf = async (path: string, options?: Options) => (await api<{ data: AssistantTurn }>(path, options)).data

/** The chat's conversation id and secret live for the browser tab, so a reload keeps the thread. */
const saved = (): { id: string; token: string } | null => {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? "null")
  } catch {
    return null
  }
}
const remember = (value: { id: string; token: string } | null) => {
  try {
    if (value) sessionStorage.setItem(STORE, JSON.stringify(value))
    else sessionStorage.removeItem(STORE)
  } catch {
    // storage blocked: the chat still works until the tab closes
  }
}

const merge = (current: AssistantMessage[], incoming: AssistantMessage[]) => {
  const byId = new Map(current.map((m) => [m.id, m]))
  for (const m of incoming) byId.set(m.id, m)
  return [...byId.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
}

/** The care companion: answers from Go-Wash's help centre, and hands over to the team when it cannot. */
export default function CustomerChat() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const [widget, setWidget] = useState<Widget | null>(null)
  const [conversation, setConversation] = useState<AssistantConversation | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState("")
  const input = useRef<HTMLInputElement>(null)
  const launcher = useRef<HTMLButtonElement>(null)
  const end = useRef<HTMLDivElement>(null)

  const close = () => {
    setOpen(false)
    launcher.current?.focus()
  }

  const headers = useCallback((secret: string | null) => (secret ? { "X-Assistant-Token": secret } : undefined), [])

  const apply = useCallback((turn: AssistantTurn) => {
    setConversation(turn.conversation)
    setMessages((current) => merge(current, turn.messages))
    if (turn.token) {
      setToken(turn.token)
      remember({ id: turn.conversation.id, token: turn.token })
    }
  }, [])

  // First open: fetch the greeting and suggestions, and pick the saved conversation back up.
  useEffect(() => {
    if (!open || widget) return
    api<{ data: Widget }>("/assistant", { anonymous: true })
      .then((r) => setWidget(r.data))
      .catch(() => setWidget({ enabled: false, ai: false, greeting: "", suggestions: [], max_message_chars: 1000 }))
    const previous = saved()
    if (previous) {
      turnOf(`/assistant/conversations/${previous.id}`, { headers: headers(previous.token) })
        .then((turn) => {
          setToken(previous.token)
          apply(turn)
        })
        .catch(() => remember(null))
    }
  }, [open, widget, apply, headers])

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
  }, [messages, open, busy])

  // Once the team has the conversation, their replies arrive here.
  const handedOver = conversation?.handed_over ?? false
  const conversationId = conversation?.id
  const lastId = messages.at(-1)?.id
  useEffect(() => {
    if (!open || !handedOver || !conversationId) return
    const timer = window.setInterval(() => {
      turnOf(`/assistant/conversations/${conversationId}`, { headers: headers(token), query: { after: lastId } })
        .then(apply)
        .catch(() => undefined)
    }, 15_000)
    return () => window.clearInterval(timer)
  }, [open, handedOver, conversationId, token, lastId, apply, headers])

  const run = async (work: () => Promise<AssistantTurn>) => {
    setBusy(true)
    setProblem("")
    try {
      apply(await work())
    } catch (error) {
      setProblem(error instanceof ApiError ? error.message : "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const send = async (value: string) => {
    const text = value.trim()
    if (!text || busy) return
    setDraft("")
    await run(() =>
      conversation
        ? turnOf(`/assistant/conversations/${conversation.id}/messages`, { method: "POST", body: { message: text }, headers: headers(token) })
        : turnOf("/assistant/conversations", { method: "POST", body: { message: text, page: pathname, locale: "en" } }),
    )
  }

  const askForPerson = () => conversation && run(() => turnOf(`/assistant/conversations/${conversation.id}/handover`, { method: "POST", headers: headers(token) }))
  const giveContact = (details: { name: string; email: string; phone: string }) =>
    conversation && run(() => turnOf(`/assistant/conversations/${conversation.id}/contact`, { method: "POST", body: { ...details, phone: details.phone || undefined }, headers: headers(token) }))
  const rate = async (message: AssistantMessage, helpful: boolean) => {
    if (!conversation) return
    try {
      const updated = await api<{ data: AssistantMessage }>(`/assistant/conversations/${conversation.id}/messages/${message.id}/rating`, { method: "POST", body: { helpful }, headers: headers(token) })
      setMessages((current) => merge(current, [updated.data]))
    } catch {
      // a missed rating is not worth interrupting the chat for
    }
  }

  const unavailable = widget !== null && !widget.enabled
  const startOver = () => {
    remember(null)
    setConversation(null)
    setToken(null)
    setMessages([])
    setProblem("")
  }

  return (
    <div className="customer-chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Go-Wash customer care" id="customer-care-chat">
          <header className="chat-header">
            <span className="chat-brand-mark">
              <Icon name="drop" size={26} />
            </span>
            <div>
              <Heading level={3}>Your care companion</Heading>
              <span>Go-Wash · Help guide{widget?.ai ? " · AI assisted" : ""}</span>
            </div>
            <Button className="panel-icon-button" aria-label="Close chat" onClick={close}>
              <Icon name="close" />
            </Button>
          </header>
          <div className="chat-welcome">
            <span className="eyebrow">A LITTLE HELP. A LOT OF CARE.</span>
            <p>Less guesswork. More peace of mind.</p>
          </div>
          <div className="chat-messages" role="log" aria-live="polite" aria-relevant="additions">
            <div className="chat-message guide">
              <small>GO-WASH GUIDE</small>
              <p>{unavailable ? "The chat is resting right now. You can still reach the team from the contact page." : (widget?.greeting ?? "Hi there. A fresher day starts with a little help. What would you like to know about Go-Wash?")}</p>
            </div>
            {messages.map((message) => (
              <div className={`chat-message ${message.role === "visitor" ? "customer" : "guide"}`} key={message.id}>
                <small>{message.role === "visitor" ? "YOU" : message.role === "staff" ? "GO-WASH TEAM" : "GO-WASH GUIDE"}</small>
                <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
                {message.role === "assistant" && message.sources.length > 0 && <small style={{ marginTop: 8 }}>From: {message.sources.map((s) => s.title).join(" · ")}</small>}
                {message.role === "assistant" && message.outcome === "answered" && (
                  <div className="chat-rating">
                    <button type="button" aria-label="This helped" aria-pressed={message.feedback === "helpful"} onClick={() => rate(message, true)}>Helpful</button>
                    <button type="button" aria-label="This did not help" aria-pressed={message.feedback === "not_helpful"} onClick={() => rate(message, false)}>Not quite</button>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="chat-message guide">
                <small>GO-WASH GUIDE</small>
                <p>Looking that up…</p>
              </div>
            )}
            {conversation?.needs_contact && <ContactForm email={conversation.contact_email} onSubmit={giveContact} busy={busy} />}
            {handedOver && (
              <div className="chat-message guide">
                <small>GO-WASH GUIDE</small>
                <p>The team has your question{conversation?.reference ? ` (reference ${conversation.reference})` : ""}. Their reply will appear here{conversation?.contact_email ? ` and in your email` : ""}.</p>
              </div>
            )}
            {problem && <div className="chat-message guide" role="alert"><small>GO-WASH GUIDE</small><p>{problem}</p></div>}
            <div ref={end} />
          </div>
          {messages.length === 0 && !unavailable && (
            <div className="chat-topics">
              {(widget?.suggestions ?? []).map((topic) => (
                <Button key={topic} onClick={() => send(topic)}>
                  {topic}
                  <Icon name="arrow" size={14} />
                </Button>
              ))}
            </div>
          )}
          <div className="chat-contact">
            <Icon name="shield" size={14} />
            <span>Please don&apos;t share passwords or card details.</span>
            {conversation && !handedOver && !conversation.needs_contact ? (
              <Button onClick={askForPerson}>Talk to a person</Button>
            ) : (
              <ButtonLink href="/contact" onClick={close}>Talk to our team</ButtonLink>
            )}
            {conversation && <Button onClick={startOver}>New chat</Button>}
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
              placeholder={unavailable ? "The chat is unavailable" : "How can we help?"}
              maxLength={widget?.max_message_chars ?? 1000}
              disabled={unavailable}
            />
            <Button type="submit" aria-label="Send message" disabled={!draft.trim() || busy || unavailable}>
              <Icon name="arrow" />
            </Button>
          </form>
        </section>
      )}
      <Button
        ref={launcher}
        className={`chat-launcher ${open ? "is-open" : ""}`}
        aria-expanded={open}
        aria-label={open ? "Close customer care chat" : "Open customer care chat"}
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

/** The team needs a name and email before it can reply by email. */
function ContactForm({ email, onSubmit, busy }: { email: string | null; onSubmit: (d: { name: string; email: string; phone: string }) => void; busy: boolean }) {
  const [name, setName] = useState("")
  const [mail, setMail] = useState(email ?? "")
  const [phone, setPhone] = useState("")
  return (
    <form
      className="chat-message guide"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit({ name, email: mail, phone })
      }}
    >
      <small>GO-WASH GUIDE</small>
      <p>I&apos;ll pass this to the team. Where should they reply?</p>
      <Input aria-label="Your name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
      <Input aria-label="Your email" placeholder="Your email" type="email" value={mail} onChange={(e) => setMail(e.target.value)} required />
      <Input aria-label="Phone (optional)" placeholder="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <Button type="submit" disabled={busy}>Send to the team</Button>
    </form>
  )
}
