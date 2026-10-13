"use client"

import { useState } from "react"
import { Async, Empty, Metrics, Notice, PageHeader, Panel, Pill, Table, Tabs, Two } from "@/components/app/kit"
import { Field, useForm } from "@/components/app/forms"
import { ConfirmDialog, Drawer } from "@/components/app/overlays"
import { Icon } from "@/components/Visuals"
import { api } from "@/lib/api/client"
import { fieldError, useAction, useResource } from "@/lib/api/hooks"
import type { AssistantMessage, KnowledgeArticle } from "@/lib/api/types"
import { humanise, relative, stamp } from "@/lib/format"
import { AdminList } from "../parts"

type Tab = "articles" | "conversations" | "insights" | "try"
const CATEGORIES = ["booking", "pricing", "payments", "washmen", "trust", "account", "business", "estates", "careers", "privacy", "other"]

/** The help articles the assistant answers from, what visitors asked it, where it fell short, and a place to try a question. */
export default function Knowledge() {
  const [tab, setTab] = useState<Tab>("articles")
  return (
    <>
      <PageHeader eyebrow="HELP CENTRE AND CHAT ASSISTANT" title="Help & assistant" description="The assistant answers only from published articles and live facts (prices, areas, plans). Anything else goes to the team." />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "articles", label: "Articles" }, { value: "conversations", label: "Conversations" }, { value: "insights", label: "Insights" }, { value: "try", label: "Try a question" }]} />
      {tab === "articles" && <Articles />}
      {tab === "conversations" && <Conversations />}
      {tab === "insights" && <Insights />}
      {tab === "try" && <TryIt />}
    </>
  )
}

function Articles() {
  const [editing, setEditing] = useState<KnowledgeArticle | "new" | null>(null)
  return (
    <>
      <div className="kit-row spread" style={{ marginBottom: 12 }}>
        <p className="kit-muted">Write for customers, in plain sentences: the assistant quotes from these. Add keywords for the words people use that the article does not.</p>
        <button className="primary" onClick={() => setEditing("new")}><Icon name="plus" size={16} /> New article</button>
      </div>
      <AdminList<KnowledgeArticle>
        title="Articles" path="/admin/knowledge-articles" rowKey={(a) => a.id}
        search={{ param: "q", placeholder: "Search articles" }}
        filters={[{ param: "status", label: "Any status", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] }, { param: "category", label: "Any topic", options: CATEGORIES.map((c) => ({ value: c, label: humanise(c) })) }]}
        columns={[
          { header: "Article", cell: (a) => <button className="kit-link" onClick={() => setEditing(a)}><Two top={a.title} bottom={`/${a.slug}`} /></button> },
          { header: "Topic", cell: (a) => humanise(a.category) },
          { header: "Status", cell: (a) => <Pill status={a.status} /> },
          { header: "Used", cell: (a) => <span className="kit-num">{a.uses}</span> },
          { header: "Rated", cell: (a) => <span className="kit-faint">{a.helpful} helpful · {a.unhelpful} not</span> },
          { header: "Updated", cell: (a) => relative(a.updated_at) },
        ]}
        empty={<Empty icon="book" title="No articles yet." action={<button className="primary" onClick={() => setEditing("new")}>Write the first one</button>} />}
      />
      {editing && <ArticleDrawer article={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ArticleDrawer({ article, onClose }: { article?: KnowledgeArticle; onClose: () => void }) {
  const form = useForm({ title: article?.title ?? "", category: article?.category ?? "booking", body: article?.body ?? "", keywords: article?.keywords.join(", ") ?? "", status: article?.status ?? "draft" })
  const [removing, setRemoving] = useState(false)
  const save = useAction(
    () => {
      const v = form.values
      const body = { title: v.title, category: v.category, body: v.body, status: v.status, keywords: String(v.keywords).split(",").map((k) => k.trim()).filter(Boolean) }
      return api(article ? `/admin/knowledge-articles/${article.id}` : "/admin/knowledge-articles", { method: article ? "PATCH" : "POST", body })
    },
    { invalidate: ["/admin/knowledge-articles"], success: article ? "Article saved." : "Article created.", onSuccess: onClose },
  )
  const remove = useAction(() => api(`/admin/knowledge-articles/${article!.id}`, { method: "DELETE" }), { invalidate: ["/admin/knowledge-articles"], success: "Article deleted.", onSuccess: onClose })
  return (
    <Drawer title={article ? "Edit article" : "New article"} eyebrow="HELP ARTICLE" onClose={onClose}>
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); save.run() }}>
        <Field label="Title" error={fieldError(save.error, "title")} hint="Phrase it as the question a customer would ask."><input {...form.field("title")} required /></Field>
        <div className="form-grid">
          <Field label="Topic" error={fieldError(save.error, "category")}><select {...form.field("category")}>{CATEGORIES.map((c) => <option key={c} value={c}>{humanise(c)}</option>)}</select></Field>
          <Field label="Status"><select {...form.field("status")}><option value="draft">Draft (hidden)</option><option value="published">Published</option></select></Field>
        </div>
        <Field label="Answer" error={fieldError(save.error, "body")} hint="Plain sentences. No prices or opening times: those come live from the system."><textarea {...form.field("body")} rows={9} required minLength={20} /></Field>
        <Field label="Keywords" error={fieldError(save.error, "keywords")} hint="Comma separated: words people use that the article does not, like “cost, how much, fee”."><input {...form.field("keywords")} /></Field>
        <div className="actions">
          {article && <button type="button" className="secondary kit-danger" onClick={() => setRemoving(true)}>Delete</button>}
          <button className="primary" disabled={save.pending}>{save.pending ? "Saving…" : "Save article"}</button>
        </div>
      </form>
      {removing && <ConfirmDialog title="Delete this article?" description="The assistant will stop using it at once. This cannot be undone." confirmLabel="Delete" danger pending={remove.pending} onConfirm={() => remove.run()} onClose={() => setRemoving(false)} />}
    </Drawer>
  )
}

type Conversation = { id: string; status: string; signed_in: boolean; contact: { name: string | null; email: string | null }; page: string | null; escalation_reason: string | null; urgency: string; summary: string | null; message_count: number; created_at: string; messages?: (AssistantMessage & { model: string | null; latency_ms: number | null })[] }

function Conversations() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <AdminList<Conversation>
        title="Conversations" path="/admin/assistant/conversations" rowKey={(c) => c.id}
        filters={[{ param: "status", label: "Any status", options: ["open", "awaiting_contact", "escalated", "resolved"].map((v) => ({ value: v, label: humanise(v) })) }]}
        columns={[
          { header: "Visitor", cell: (c) => <button className="kit-link" onClick={() => setOpen(c.id)}><Two top={c.contact.name ?? (c.signed_in ? "Signed-in customer" : "Anonymous visitor")} bottom={c.contact.email ?? c.page} /></button> },
          { header: "Summary", cell: (c) => c.summary ?? <span className="kit-faint">—</span> },
          { header: "Handed over", cell: (c) => (c.escalation_reason ? <span className="kit-row"><Pill status={c.urgency} />{humanise(c.escalation_reason)}</span> : <span className="kit-faint">Answered by the assistant</span>) },
          { header: "Messages", cell: (c) => c.message_count },
          { header: "Started", cell: (c) => relative(c.created_at) },
        ]}
        empty={<Empty icon="message" title="No conversations yet." />}
      />
      {open && <TranscriptDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function TranscriptDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const convo = useResource<Conversation>(`/admin/assistant/conversations/${id}`)
  return (
    <Drawer title="Transcript" eyebrow="CHAT WITH THE ASSISTANT" onClose={onClose}>
      <Async query={convo}>
        {(c) => (
          <>
            {c.summary && <Notice icon="alert" tone={c.urgency === "high" ? "bad" : "info"}><b>{humanise(c.escalation_reason)}</b> · {c.summary}</Notice>}
            <div className="kit-thread">
              {c.messages?.map((m) => (
                <div key={m.id} className={`kit-bubble ${m.role === "visitor" ? "" : m.role === "staff" ? "mine" : "internal"}`} style={m.role === "assistant" ? { background: "#eef6f8", border: 0 } : undefined}>
                  {m.text}
                  <small>{humanise(m.role)} · {stamp(m.created_at)}{m.outcome ? ` · ${m.outcome}` : ""}{m.sources.length ? ` · from: ${m.sources.map((s) => s.title).join(", ")}` : ""}{m.model ? ` · ${m.model}` : ""}{m.feedback ? ` · rated ${humanise(m.feedback)}` : ""}</small>
                </div>
              ))}
            </div>
          </>
        )}
      </Async>
    </Drawer>
  )
}

type InsightsData = {
  days: number; answered_rate: number | null; published_articles: number
  stats: { conversations: number; escalated: number; answers: number; handed_over: number; rated_helpful: number; rated_not_helpful: number }
  unanswered_questions: { question: string; times: number }[]
  most_used: KnowledgeArticle[]; least_helpful: KnowledgeArticle[]; never_used: KnowledgeArticle[]
}

function Insights() {
  const [days, setDays] = useState("30")
  const insights = useResource<InsightsData>("/admin/assistant/insights", { days })
  return (
    <Async query={insights}>
      {(i) => (
        <>
          <div className="kit-toolbar"><select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Period">{["7", "30", "90"].map((d) => <option key={d} value={d}>Last {d} days</option>)}</select></div>
          <Metrics items={[
            { label: "Conversations", value: i.stats.conversations, icon: "message" },
            { label: "Answered by the assistant", value: i.answered_rate === null ? "—" : `${Math.round(i.answered_rate * 100)}%`, note: `${i.stats.answers} answers, ${i.stats.handed_over} hand-overs`, icon: "check" },
            { label: "Rated helpful", value: i.stats.rated_helpful, note: `${i.stats.rated_not_helpful} not helpful`, icon: "star" },
            { label: "Published articles", value: i.published_articles, icon: "book" },
          ]} />
          <Panel title="Questions nobody could answer" description="The most common questions that ended in a hand-over. Write an article for each.">
            {i.unanswered_questions.length === 0 ? <p className="kit-muted">No gaps in this period.</p> : (
              <Table rows={i.unanswered_questions} rowKey={(q) => q.question} columns={[{ header: "Question", cell: (q) => q.question }, { header: "Times asked", className: "right", cell: (q) => q.times }]} />
            )}
          </Panel>
          <div className="kit-grid cols-3">
            {([["Most used", i.most_used], ["Rated unhelpful", i.least_helpful], ["Never used", i.never_used]] as const).map(([title, rows]) => (
              <Panel key={title} title={title}>
                {rows.length === 0 ? <p className="kit-muted">None.</p> : rows.map((a) => <div key={a.id} className="kit-item"><div className="grow"><h4>{a.title}</h4><p>{a.uses} uses · {a.helpful} helpful · {a.unhelpful} not</p></div></div>)}
              </Panel>
            ))}
          </div>
        </>
      )}
    </Async>
  )
}

type Preview = { action: string; text: string; reason: string | null; summary: string | null; urgency: string; cited: string[]; ai: boolean; evidence: { id: string; title: string; category: string; score: number; live: boolean }[] }

function TryIt() {
  const [question, setQuestion] = useState("")
  const [result, setResult] = useState<Preview | null>(null)
  const ask = useAction((q: string) => api<{ data: Preview }>("/admin/assistant/preview", { method: "POST", body: { question: q } }).then((r) => r.data), { onSuccess: setResult })
  return (
    <Panel title="Try a question" description="See what the assistant finds and what it would do. Nothing is saved or counted.">
      <form className="kit-form" onSubmit={(e) => { e.preventDefault(); ask.run(question) }}>
        <Field label="A customer's question"><input value={question} onChange={(e) => setQuestion(e.target.value)} required placeholder="How much does a wash cost?" /></Field>
        <div className="actions"><button className="primary" disabled={ask.pending}>{ask.pending ? "Thinking…" : "Ask"}</button></div>
      </form>
      {result && (
        <div className="kit-stack" style={{ marginTop: 18 }}>
          <Notice tone={result.action === "escalate" ? "warn" : "info"} icon={result.action === "escalate" ? "alert" : "check"}>
            <b>{result.action === "answer" ? "It would answer:" : result.action === "clarify" ? "It would ask back:" : "It would hand over to the team."}</b>
            <div style={{ marginTop: 6, whiteSpace: "pre-wrap" }}>{result.text}</div>
            {result.summary && <div className="kit-faint" style={{ marginTop: 6 }}>For the team: {result.summary}</div>}
            <div className="kit-faint" style={{ marginTop: 6 }}>{result.ai ? "Worded by the AI model." : "No AI key is set: this is the article quoted as written."}</div>
          </Notice>
          <h4>What it found</h4>
          {result.evidence.length === 0 ? <p className="kit-muted">Nothing matched. Write an article for this question.</p> : (
            <Table rows={result.evidence} rowKey={(e) => e.id} columns={[
              { header: "Source", cell: (e) => <Two top={e.title} bottom={e.live ? "Live fact from the system" : "Article"} /> },
              { header: "Topic", cell: (e) => humanise(e.category) },
              { header: "Relevance", className: "right", cell: (e) => <span className="kit-num">{e.score}</span> },
              { header: "Used", cell: (e) => (result.cited.includes(e.id) ? <Pill status="success" label="Cited" /> : "") },
            ]} />
          )}
        </div>
      )}
    </Panel>
  )
}
