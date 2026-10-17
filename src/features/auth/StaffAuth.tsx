import Link from "next/link"
import type { ReactNode } from "react"
import Brand from "@/components/Brand"
import ButtonLink from "@/components/ui/ButtonLink"
import { Icon, type IconName } from "@/components/Visuals"
import { staffHelpHref, staffLoginHref, washmanApplyHref } from "@/lib/roles"
import LoginForm from "./LoginForm"

type Team = "field" | "operations" | "join"

const COPY: Record<
  Team,
  {
    badge: string
    title: string
    text: string
    foot: string
    points: [IconName, string, string][]
    shift: { tag: string; headline: string; checks: [string, string, string] }
  }
> = {
  field: {
    badge: "THE GO-WASH FIELD TEAM",
    title: "Your day starts here.",
    text: "Sign in with your staff code and PIN, on the phone you registered, to see the jobs assigned to you.",
    foot: "FIELD TEAM",
    points: [
      ["calendar", "Only your jobs", "Work is assigned to you by dispatch. There is nothing to hunt for."],
      ["pin", "Proof as you go", "Arrival check, photos and plate scan, guided step by step."],
      ["shield", "One phone, one you", "Your account is tied to your registered phone for everyone's safety."],
    ],
    shift: { tag: "On shift", headline: "Next job · 09:30", checks: ["GPS", "Plate", "Verdict"] },
  },
  operations: {
    badge: "GO-WASH OPERATIONS",
    title: "Run the day with a clear head.",
    text: "Dispatch, finance, support and administration share one record. Sign in with your work email, password and authenticator code.",
    foot: "OPERATIONS",
    points: [
      ["lock", "Two-step sign-in", "Every operations account uses an authenticator app."],
      ["list", "Every action recorded", "Changes are written to the audit log with who made them."],
      ["users", "Access by role", "You see only what your role is allowed to use."],
    ],
    shift: { tag: "Live", headline: "12 washes in progress", checks: ["Dispatch", "Evidence", "Audit"] },
  },
  join: {
    badge: "JOIN THE FIELD TEAM",
    title: "Wash with a team that has your back.",
    text: "Apply in three short steps. We verify every washman before their first job, and nobody works until every check is done.",
    foot: "NOW HIRING",
    points: [
      ["calendar", "Real, assigned work", "Dispatch assigns you jobs near where you operate."],
      ["shield", "Verified and protected", "Your ID, your guarantor and a background check, all before you start."],
      ["pin", "A fair record", "GPS, photos and the plate scan show the work you did."],
    ],
    shift: { tag: "Your application", headline: "Step 1 of 3", checks: ["Apply", "Papers", "Verified"] },
  },
}

/** The shared frame of the staff pages: a dark story panel on the left, the form on the right. */
export function StaffFrame({
  team,
  eyebrow,
  title,
  description,
  tabs,
  children,
  below,
}: {
  team: Team
  eyebrow: string
  title: string
  description?: string
  /** Shown above the heading; pass the tab strip. */
  tabs?: ReactNode
  children: ReactNode
  below?: ReactNode
}) {
  const copy = COPY[team]

  return (
    <div className={`sa-page sa-${team}`}>
      <aside className="sa-aside">
        <Brand light />
        <div className="sa-aside-body">
          <span className="sa-badge">
            <i /> {copy.badge}
          </span>
          <h2>{copy.title}</h2>
          <p>{copy.text}</p>
          <ul className="sa-points">
            {copy.points.map(([icon, heading, text]) => (
              <li key={heading}>
                <span>
                  <Icon name={icon} size={18} />
                </span>
                <div>
                  <strong>{heading}</strong>
                  <small>{text}</small>
                </div>
              </li>
            ))}
          </ul>
          <div className="sa-shift" aria-hidden="true">
            <div className="sa-shift-top">
              <span className="sa-live">
                <i /> {copy.shift.tag}
              </span>
              <b>{copy.shift.headline}</b>
            </div>
            <div className="sa-shift-bar">
              <span />
            </div>
            <div className="sa-shift-checks">
              {copy.shift.checks.map((check) => (
                <span key={check}>
                  <Icon name="check" size={13} /> {check}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="sa-aside-foot">
          <span>GO-WASH · NIGERIA</span>
          <span>{copy.foot}</span>
        </div>
      </aside>

      <main className="sa-main">
        <div className="sa-top">
          <ButtonLink href="/">
            <Icon name="arrow" size={15} /> Back to Go-Wash
          </ButtonLink>
          
        </div>
        <div className="sa-card auth-form-wrap">
          {tabs}
          <div className="eyebrow">{eyebrow}</div>
          <h1>{title}</h1>
          {description && <p className="auth-description">{description}</p>}
          {children}
        </div>
        {below}
        <p className="sa-foot">
          Need a hand? <ButtonLink href="/contact">Talk to the team</ButtonLink>
        </p>
      </main>
    </div>
  )
}

/** Sign-in for the field team (staff code + PIN) and, on the other tab, for operations (email + password + code). */
export function StaffLogin({ team, next, expired }: { team?: "operations"; next?: string; expired?: boolean }) {
  const ops = team === "operations"
  return (
    <StaffFrame
      team={ops ? "operations" : "field"}
      eyebrow={ops ? "OPERATIONS SIGN-IN" : "STAFF SIGN-IN"}
      title={ops ? "Welcome back to operations." : "Welcome back to the team."}
      description={ops ? "Work email, password and the code from your authenticator app." : "Your staff code and PIN. If you applied recently, use the PIN you chose to see your application."}
      tabs={
        <nav className="sa-tabs" aria-label="Who is signing in">
          <Link className={ops ? "" : "selected"} href={staffLoginHref({ next })} aria-current={ops ? undefined : "page"}>
            <Icon name="drop" size={16} /> Field team
          </Link>
          <Link className={ops ? "selected" : ""} href={staffLoginHref({ team: "operations", next })} aria-current={ops ? "page" : undefined}>
            <Icon name="shield" size={16} /> Operations
          </Link>
        </nav>
      }
      below={
        ops ? (
          <div className="sa-note">
            <Icon name="lock" size={18} />
            <p>
              Operations accounts cannot be created here. A super admin issues them with a one-time password and an authenticator secret.
            </p>
          </div>
        ) : (
          <div className="sa-invite">
            <div>
              <strong>New here?</strong>
              <small>Apply to become a Go-Wash washman. It takes about three minutes.</small>
            </div>
            <ButtonLink className="sa-invite-link" href={washmanApplyHref}>
              Become a washman <Icon name="arrow" size={15} />
            </ButtonLink>
          </div>
        )
      }
    >
      <LoginForm key={ops ? "operations" : "field"} role={ops ? "Super admin" : "Washman"} next={next} expired={expired} />
    </StaffFrame>
  )
}

/** Where a washman goes when the PIN is forgotten or the phone has changed: it is the operations team who resets both. */
export function StaffHelp() {
  return (
    <StaffFrame
      team="field"
      eyebrow="STAFF HELP"
      title="PIN forgotten or new phone?"
      description="For your security, only the operations team can do either of these."
    >
      <div className="sa-help">
        <div className="sa-help-item">
          <span>
            <Icon name="lock" size={20} />
          </span>
          <div>
            <strong>Forgotten PIN</strong>
            <p>Ask your dispatcher to reset it. They will give you a new PIN to sign in with.</p>
          </div>
        </div>
        <div className="sa-help-item">
          <span>
            <Icon name="phone" size={20} />
          </span>
          <div>
            <strong>Changed phone</strong>
            <p>
              Try to sign in on the new phone first. That sends the operations team a request to approve it, and once they do the new phone
              becomes your registered phone.
            </p>
          </div>
        </div>
        <ButtonLink className="primary full" href={staffLoginHref()}>
          Back to sign-in <Icon name="arrow" size={17} />
        </ButtonLink>
        <ButtonLink className="sa-ghost" href="/contact">
          Contact the operations team
        </ButtonLink>
        <p className="sa-help-link">
          Not on the team yet? <ButtonLink href={washmanApplyHref}>Become a washman</ButtonLink> · <ButtonLink href={staffHelpHref}>Help</ButtonLink>
        </p>
      </div>
    </StaffFrame>
  )
}
