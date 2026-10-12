import { PageTransition } from "./Motion"
import { useCallback, useEffect, useState } from "react"
import useDismissiblePanel from "../hooks/useDismissiblePanel"
import SidebarControls from "./navigation/SidebarControls"
import { CarArt, Icon, Plate } from "./Visuals"
import type { Role } from "../domain/roles"

import {
  initialJobs,
  staffList,
  menus,
  menuIcon,
  currency,
  people,
  type Job,
} from "../domain/portalConfig"

export default function Portal({
  role,
  onHome,
}: {
  role: Role
  onHome: () => void
}) {
  const [page, setPage] = useState(menus[role][0].pages[0])
  const [jobs, setJobs] = useState(initialJobs)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState("All statuses")
  const [drawer, setDrawer] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job>(initialJobs[0])
  const [toast, setToast] = useState("")
  const [mobile, setMobile] = useState(false)
  const closeMenu = useCallback(() => setMobile(false), [])
  useDismissiblePanel(mobile, closeMenu, ".portal-sidebar")
  const [shift, setShift] = useState(false)
  const [jobStep, setJobStep] = useState(0)
  const [scan, setScan] = useState("")
  const [scanError, setScanError] = useState("")
  const [customerVerdict, setCustomerVerdict] = useState("")
  const [reason, setReason] = useState("")
  const [photoBefore, setPhotoBefore] = useState(false)
  const [photoAfter, setPhotoAfter] = useState(false)
  const [assigned, setAssigned] = useState("Ibrahim Musa")
  const [suspendRenewal, setSuspendRenewal] = useState(false)
  const [audit, setAudit] = useState([
    "09:42 · Halima Yusuf · Assigned GW-1048 to Emeka Okafor",
    "09:30 · Halima Yusuf · Reviewed screening for GW-046",
    "09:12 · Finance team · Reconciled payment GW-PAY-1041",
    "08:55 · Halima Yusuf · Opened morning estate run",
  ])
  const [resolvedCases, setResolvedCases] = useState<string[]>([])
  const resolved = resolvedCases.length === 3
  const [extraVehicle, setExtraVehicle] = useState("")
  const [extraPlate, setExtraPlate] = useState("")
  const [incident, setIncident] = useState(false)
  const [windowText, setWindowText] = useState("Monday, Wednesday & Friday")
  const [staffApproved, setStaffApproved] = useState(false)
  const [savedPolicy, setSavedPolicy] = useState(false)
  useEffect(() => {
    if (!drawer) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDrawer(null)
        setReason("")
      }
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [drawer])
  const person = people[role]
  const admin = role === "Super admin",
    washer = role === "Washman",
    corporate = role === "Corporate",
    estate = role === "Estate"
  const dispatcher = admin || role === "Dispatcher"
  const finance = admin || role === "Finance"
  const support = admin || role === "Support"
  const operations =
    admin || role === "Dispatcher" || role === "Finance" || role === "Support"
  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(""), 4500)
  }
  const log = (text: string) =>
    setAudit((prev) => [`Demo · ${person.name} · ${text}`, ...prev])
  const changePage = (next: string) => {
    setPage(next)
    setQuery("")
    setFilter("All statuses")
    setMobile(false)
  }
  const jobDetail = (job: Job) => {
    setSelectedJob(job)
    setDrawer("job")
  }
  const filteredJobs = jobs.filter(
    (j) =>
      `${j.id} ${j.vehicle} ${j.plate} ${j.staff} ${j.area}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All statuses" || j.status === filter),
  )
  const fleet = [jobs[0], jobs[4], jobs[1], jobs[2], jobs[5], jobs[3]]
  const download = (name: string, content: string) => {
    const url = URL.createObjectURL(
      new Blob([content], { type: "text/csv;charset=utf-8" }),
    )
    const a = document.createElement("a")
    a.href = url
    a.download = `${name}.csv`
    a.click()
    URL.revokeObjectURL(url)
    notify("Sample CSV report downloaded.")
  }
  const exportJobs = () =>
    download(
      "go-wash-jobs",
      "Job,Vehicle,Plate,Area,Status\n" +
        jobs
          .map((j) => `${j.id},${j.vehicle},${j.plate},${j.area},${j.status}`)
          .join("\n"),
    )
  const title =
    page === "Overview"
      ? "Good morning, Halima."
      : page === "My day"
        ? "Ready for a good day, Emeka?"
        : page === "Fleet overview"
          ? "A brighter workday, Ngozi."
          : page === "Estate overview"
            ? "Good morning, Mr Adewale."
            : page
  const sectionHeading = (title: string, action?: string, fn?: () => void) => (
    <div className="section-heading">
      <h3>{title}</h3>
      {action && (
        <button className="text-button" onClick={fn}>
          {action}
          <Icon name="arrow" size={15} />
        </button>
      )}
    </div>
  )
  const toolbar = (placeholder = "Search jobs, plates or professionals") => (
    <div className="portal-toolbar">
      <div className="search-field">
        <Icon name="car" size={17} />
        <input
          aria-label={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
        />
      </div>
      <select
        aria-label="Filter jobs"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        {[
          "All statuses",
          "Booked",
          "On the way",
          "Washing",
          "Ready",
          "Needs review",
          "Verified",
        ].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <button className="secondary" onClick={exportJobs}>
        Export CSV <Icon name="arrow" size={15} />
      </button>
    </div>
  )
  const jobTable = (data: Job[], compact = false) => (
    <div className="table-scroll">
      <table className="portal-table">
        <thead>
          <tr>
            <th>VEHICLE / JOB</th>
            <th>{compact ? "LOCATION" : "SERVICE & LOCATION"}</th>
            <th>PROFESSIONAL</th>
            <th>STATUS</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {data.map((j) => (
            <tr key={j.id}>
              <td>
                <button className="table-vehicle" onClick={() => jobDetail(j)}>
                  <span className="table-car-icon">
                    <Icon name="car" size={19} />
                  </span>
                  <span>
                    <strong>{j.vehicle}</strong>
                    <small>
                      <Plate>{j.plate}</Plate>
                      <b>{j.id}</b>
                    </small>
                  </span>
                </button>
              </td>
              <td>
                <strong>{compact ? j.area : j.service}</strong>
                <small>{compact ? j.time : `${j.area} · ${j.time}`}</small>
              </td>
              <td>
                <strong>{j.staff}</strong>
                <small>
                  {j.staff === "Unassigned"
                    ? "Dispatch required"
                    : "Screened professional"}
                </small>
              </td>
              <td>
                <span
                  className={`portal-status ${
                    j.status === "Needs review" ? "review" : ""
                  }`}
                >
                  <i />
                  {j.status}
                </span>
              </td>
              <td>
                <button
                  className="table-more"
                  aria-label={`View ${j.id}`}
                  onClick={() => jobDetail(j)}
                >
                  <Icon name="chevron" size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!data.length && (
        <div className="empty-state">
          <Icon name="car" size={30} />
          <h3>No matching jobs.</h3>
          <p>Try another plate, name or status.</p>
          <button
            className="secondary"
            onClick={() => {
              setQuery("")
              setFilter("All statuses")
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
  const metrics = (
    items: {
      label: string
      value: string
      note: string
      icon: "car" | "shield" | "card" | "clock" | "drop" | "pin"
    }[],
  ) => (
    <div className="portal-metrics">
      {items.map((m, i) => (
        <article key={m.label}>
          <div>
            <span>{m.label}</span>
            <Icon name={m.icon} size={19} />
          </div>
          <h3>
            {m.value}
            <small>{i === 0 ? "TODAY" : "LIVE VIEW"}</small>
          </h3>
          <p>{m.note}</p>
        </article>
      ))}
    </div>
  )
  const map = (
    <div className="operations-map">
      <div className="map-grid" />
      <div className="map-lagoon" />
      <span className="district district-1">IKOYI</span>
      <span className="district district-2">VICTORIA ISLAND</span>
      <span className="district district-3">LEKKI PHASE 1</span>
      <span className="district district-4">LAGOS LAGOON</span>
      <div className="ops-route route-a" />
      <div className="ops-route route-b" />
      {[
        [26, 33, "EO", 0],
        [43, 61, "IM", 3],
        [68, 46, "DA", 2],
      ].map(([left, top, initials, index]) => (
        <button
          key={String(initials)}
          className="ops-map-marker"
          style={{ left: `${left}%`, top: `${top}%` }}
          onClick={() => jobDetail(jobs[Number(index)])}
        >
          <span>{initials}</span>
          <small>
            {initials === "EO"
              ? "On the way"
              : initials === "DA"
                ? "Washing"
                : "On site"}
          </small>
        </button>
      ))}
      <div className="map-legend">
        <span>
          <i />
          Assigned jobs only
        </span>
        <span>Illustrative map · Not live GPS</span>
      </div>
    </div>
  )
  const staffCards = (estateView = false) => (
    <div className="team-grid">
      {staffList
        .filter(
          (s) =>
            !estateView || s.name === "David Akin" || s.name === "Ibrahim Musa",
        )
        .map((s) => (
          <article className="team-card" key={s.id}>
            <div className="team-top">
              <div className="team-avatar">{s.initials}</div>
              <span className="portal-status">
                {s.status === "Screening pending" && staffApproved
                  ? "Verified"
                  : estateView
                    ? "On site"
                    : s.status}
              </span>
            </div>
            <h3>{s.name}</h3>
            <p>
              {s.id} · {s.zone}
            </p>
            <div className="team-stats">
              <span>
                <Icon name="star" size={14} />
                {s.rating} rating
              </span>
              <span>{s.jobs} washes</span>
            </div>
            <div className="screening-progress">
              <span
                style={{
                  width: `${
                    s.name === "Chidi Nwosu" && staffApproved
                      ? 100
                      : (s.verified / 6) * 100
                  }%`,
                }}
              />
            </div>
            <small>
              {s.name === "Chidi Nwosu" && staffApproved ? 6 : s.verified} / 6
              screening records verified
            </small>
            <button
              className="secondary full"
              onClick={() => {
                setAssigned(s.name)
                setDrawer(estateView ? "onsite" : "staff")
              }}
            >
              {estateView ? "View site assignment" : "View professional"}
              <Icon name="arrow" size={15} />
            </button>
          </article>
        ))}
    </div>
  )
  const evidence = (
    <div className="evidence-grid">
      {[
        "GPS trail",
        "Arrival plate scan",
        "Before & after",
        "Customer verdict",
        "Final plate scan",
        "Payment reference",
      ].map((name, i) => (
        <div key={name}>
          <span>
            <Icon
              name={
                i === 0
                  ? "pin"
                  : i === 1 || i === 4
                    ? "car"
                    : i === 5
                      ? "card"
                      : "shield"
              }
              size={18}
            />
          </span>
          <strong>{name}</strong>
          <small>
            {i === 0
              ? "Job-limited tracking"
              : i === 1
                ? "LND482JK · Matched"
                : i === 2
                  ? "Live-camera evidence required"
                  : i === 3
                    ? "Awaiting customer"
                    : i === 4
                      ? "Locked until verdict"
                      : "GW-PAY-1048 · Paid"}
          </small>
        </div>
      ))}
    </div>
  )
  return (
    <div className={`portal-shell ${washer ? "field-portal" : ""}`}>
      <aside
        className={`sidebar portal-sidebar ${mobile ? "mobile-open" : ""}`}
        id="workspace-navigation"
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label={`${role} navigation`}
      >
        {mobile && <SidebarControls onClose={closeMenu} />}
        <button className="brand x-brand" onClick={onHome}>
          <span className="brand-symbol">
            <Icon name="drop" size={23} />
          </span>
          go<span className="brand-dash">-</span>wash
          <span className="brand-dot">.</span>
        </button>
        <div className="workspace">
          <span className="workspace-icon">
            <Icon
              name={
                admin ? "shield" : washer ? "drop" : corporate ? "car" : "pin"
              }
            />
          </span>
          <div>
            {operations
              ? "Operations centre"
              : washer
                ? "Field workspace"
                : person.company}
            <small>
              {operations
                ? role + " access"
                : washer
                  ? "Your next step, made clear"
                  : role + " portal"}
            </small>
          </div>
        </div>
        {menus[role].map((group) => (
          <div className="portal-nav-group" key={group.group}>
            <div className="nav-label">{group.group}</div>
            <nav>
              {group.pages.map((p) => (
                <button
                  key={p}
                  className={`nav-item ${p === page ? "active" : ""}`}
                  onClick={() => changePage(p)}
                >
                  <Icon name={menuIcon(p)} size={18} />
                  <span>{p}</span>
                  {p === "Exceptions" && !resolved && (
                    <span className="nav-count">
                      {3 - resolvedCases.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        ))}
        <div className="portal-sidebar-bottom">
          <span className="prototype-label">
            <span />
            Prototype workspace
          </span>
          <button className="nav-item" onClick={onHome}>
            <Icon name="logout" size={18} />
            Back to website
          </button>
          <div className="user-card">
            <span className="avatar">{person.initials}</span>
            <div>
              <strong>{person.name}</strong>
              <small>{role === "Washman" ? "Field professional" : role}</small>
            </div>
            <button
              aria-label="Account profile"
              onClick={() => setDrawer("profile")}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Toggle navigation"
              aria-expanded={mobile}
              aria-controls="workspace-navigation"
            >
              <Icon name="grid" />
            </button>
            <span>
              {operations
                ? "Operations"
                : washer
                  ? "Field workspace"
                  : person.company}
            </span>
            <Icon name="chevron" size={13} />
            <strong>{page}</strong>
          </div>
          <div className="header-right">
            <span className="location-label">
              <Icon name="calendar" size={15} />
              Sat, 10 October 2026
            </span>
            <button
              className="notification-btn"
              aria-label="Open notifications"
              onClick={() => setDrawer("notifications")}
            >
              <Icon name="bell" />
              <i />
            </button>
            <button
              className="avatar small"
              onClick={() => setDrawer("profile")}
            >
              {person.initials}
            </button>
          </div>
        </header>
        <main className="portal-main">
          <PageTransition transitionKey={page}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">
                  {operations
                    ? "CLARITY. CONTROL. COMPLETE CONFIDENCE."
                    : washer
                      ? "YOUR WORK. YOUR PRIDE. YOUR PROOF."
                      : corporate
                        ? "YOUR FLEET. OUR RESPONSIBILITY."
                        : "YOUR COMMUNITY. OUR RESPONSIBILITY."}
                </div>
                <h1>{title}</h1>
                <p>
                  {/overview|Overview|My day/.test(page)
                    ? person.greeting
                    : "The details you need. Nothing you don't."}
                </p>
              </div>
              <button
                className="primary"
                onClick={() => {
                  if (washer) {
                    setShift(!shift)
                    notify(
                      shift
                        ? "Demo shift ended."
                        : "Demo shift started. Assigned jobs are ready.",
                    )
                  } else {
                    if (finance && !admin) {
                      setAssigned("GW-PAY-1048")
                      setDrawer("payment")
                    } else
                      setDrawer(
                        dispatcher
                          ? "create"
                          : role === "Support"
                            ? "support-case"
                            : corporate
                              ? "schedule"
                              : "window",
                      )
                  }
                }}
              >
                <Icon name={washer ? "clock" : "plus"} size={17} />
                {washer
                  ? shift
                    ? "End shift"
                    : "Start shift"
                  : dispatcher
                    ? "Create booking"
                    : role === "Finance"
                      ? "Review payment"
                      : role === "Support"
                        ? "Open care ticket"
                        : corporate
                          ? "Book fleet wash"
                          : "Manage windows"}
              </button>
            </div>
            {role === "Dispatcher" && page === "Dispatch overview" && (
              <>
                {metrics([
                  {
                    label: "Today's assigned work",
                    value: "48",
                    note: "32 completed · 16 in progress",
                    icon: "car",
                  },
                  {
                    label: "Active professionals",
                    value: "12",
                    note: "Assigned jobs, on shift",
                    icon: "pin",
                  },
                  {
                    label: "Bookings to assign",
                    value: String(
                      jobs.filter((j) => j.staff === "Unassigned").length,
                    ).padStart(2, "0"),
                    note: "Ranked staff suggestions ready",
                    icon: "clock",
                  },
                  {
                    label: "Exceptions to review",
                    value: String(3 - resolvedCases.length).padStart(2, "0"),
                    note: "Every override needs a reason",
                    icon: "shield",
                  },
                ])}
                <section className="portal-panel map-panel">
                  {sectionHeading(
                    "The day, beautifully connected",
                    "Open live operations",
                    () => changePage("Live operations"),
                  )}
                  {map}
                  <div className="map-panel-bottom">
                    <span>
                      <Icon name="shield" size={15} />
                      Job-limited location access
                    </span>
                    <button
                      className="text-button"
                      onClick={() => changePage("Exceptions")}
                    >
                      Review exceptions <Icon name="arrow" size={15} />
                    </button>
                  </div>
                </section>
                <section className="portal-panel">
                  {sectionHeading("Your dispatch board", "Assign work", () =>
                    changePage("Bookings & dispatch"),
                  )}
                  {jobTable(jobs)}
                </section>
                <div className="policy-locked">
                  <Icon name="shield" size={19} />
                  <span>
                    Dispatcher access covers assignment, evidence and releases.
                    Price changes, refunds and account configuration are
                    reserved for the appropriate roles.
                  </span>
                </div>
              </>
            )}
            {role === "Support" &&
              ["Support overview", "Complaints"].includes(page) && (
                <>
                  {page === "Support overview" &&
                    metrics([
                      {
                        label: "Open care tickets",
                        value: "06",
                        note: "Customers waiting for clarity",
                        icon: "help" as "shield",
                      },
                      {
                        label: "Responded today",
                        value: "14",
                        note: "Real conversations, thoughtful care",
                        icon: "shield",
                      },
                      {
                        label: "Awaiting operations",
                        value: "02",
                        note: "Evidence review and decisions",
                        icon: "clock",
                      },
                      {
                        label: "Resolution satisfaction",
                        value: "97%",
                        note: "After-care customer feedback",
                        icon: "drop",
                      },
                    ])}
                  <section className="support-hero">
                    <Icon name="help" size={36} />
                    <div>
                      <div className="eyebrow">
                        A LITTLE UNDERSTANDING GOES A LONG WAY
                      </div>
                      <h2>Care doesn't end at the shine.</h2>
                      <p>
                        Listen, respond and make the next step clear. Escalate
                        operational decisions to the people authorised to make
                        them.
                      </p>
                    </div>
                  </section>
                  <section className="portal-panel">
                    {sectionHeading(
                      "Your customer care queue",
                      "Create care ticket",
                      () => setDrawer("support-case"),
                    )}
                    <div className="table-scroll">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>TICKET / CUSTOMER</th>
                            <th>CONCERN</th>
                            <th>STATUS</th>
                            <th>OWNER</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            [
                              "CARE-029",
                              "Tolu Adebayo",
                              "Missed areas · Quality concern",
                              "Awaiting evidence",
                              "Operations",
                            ],
                            [
                              "CARE-031",
                              "Bola Adeyemi",
                              "Reschedule tomorrow's wash",
                              "New",
                              "Customer care",
                            ],
                            [
                              "CARE-034",
                              "Ada Nwankwo",
                              "Payment receipt request",
                              "Responding",
                              "Customer care",
                            ],
                            [
                              "CARE-036",
                              "Meridian Holdings",
                              "Untreated verdict inquiry",
                              "Escalated",
                              "Operations",
                            ],
                          ].map(([id, name, issue, status, owner]) => (
                            <tr key={id}>
                              <td>
                                <strong>{id}</strong>
                                <small>{name}</small>
                              </td>
                              <td>{issue}</td>
                              <td>
                                <span className="portal-status">{status}</span>
                              </td>
                              <td>{owner}</td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    setAssigned(`${id} · ${name}`)
                                    setDrawer("support-case")
                                  }}
                                >
                                  Open ticket
                                  <Icon name="arrow" size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                  <div className="policy-locked">
                    <Icon name="shield" size={20} />
                    <span>
                      Support can respond, reschedule and escalate. Support
                      cannot release a blocked job, change prices or issue a
                      refund.
                    </span>
                  </div>
                </>
              )}
            {role === "Support" && page === "Bookings & dispatch" && (
              <section className="portal-panel">
                {sectionHeading("Booking care & rescheduling")}
                {toolbar()}
                {jobTable(filteredJobs)}
                <p className="policy-note">
                  Assignment and release controls stay with operations. Open a
                  care ticket to request a reschedule or escalation.
                </p>
                <button
                  className="secondary"
                  onClick={() => setDrawer("support-case")}
                >
                  Request reschedule <Icon name="calendar" size={16} />
                </button>
              </section>
            )}
            {admin && page === "Overview" && (
              <>
                {metrics([
                  {
                    label: "Today's bookings",
                    value: "48",
                    note: "32 completed · 16 in progress",
                    icon: "car",
                  },
                  {
                    label: "Active professionals",
                    value: "12",
                    note: "8 on site · 4 travelling",
                    icon: "pin",
                  },
                  {
                    label: "Verified completion",
                    value: "96.8%",
                    note: "Three independent proofs",
                    icon: "shield",
                  },
                  {
                    label: "Today's revenue",
                    value: "₦384,500",
                    note: "44 payments reconciled",
                    icon: "card",
                  },
                ])}
                <div className="ops-dashboard-grid">
                  <section className="portal-panel map-panel">
                    {sectionHeading(
                      "Your city, in motion",
                      "Open live operations",
                      () => changePage("Live operations"),
                    )}
                    {map}
                    <div className="map-panel-bottom">
                      <span>
                        <Icon name="pin" size={15} /> 12 active jobs across
                        Lagos
                      </span>
                      <button
                        className="text-button"
                        onClick={() => changePage("Bookings & dispatch")}
                      >
                        Dispatch board <Icon name="arrow" size={14} />
                      </button>
                    </div>
                  </section>
                  <aside className="portal-panel exceptions-preview">
                    {sectionHeading("A little attention needed")}
                    <p className="panel-description">
                      Only the jobs that need your decision.
                    </p>
                    {(resolved
                      ? [
                          [
                            "Ready to go",
                            "All demo exceptions reviewed",
                            "Clear queue",
                          ],
                        ]
                      : [
                          [
                            "Verdict timeout",
                            "GW-1051 · Ibrahim Musa",
                            "18 min waiting",
                          ],
                          [
                            "Plate mismatch",
                            "GW-1037 · Lekki Phase 1",
                            "Clock-in blocked",
                          ],
                          [
                            "Quality complaint",
                            "GW-1029 · Signature Wash",
                            "Customer remark",
                          ],
                        ]
                    ).map(([title, text, tag], i) => (
                      <button
                        className="exception-preview-item"
                        key={title}
                        onClick={() => {
                          changePage("Exceptions")
                          setSelectedJob(jobs[3])
                        }}
                      >
                        <span className="exception-symbol">
                          <Icon
                            name={i === 0 ? "clock" : i === 1 ? "car" : "help"}
                            size={19}
                          />
                        </span>
                        <span>
                          <strong>{title}</strong>
                          <small>{text}</small>
                          <b>{tag}</b>
                        </span>
                        <Icon name="chevron" size={16} />
                      </button>
                    ))}
                    <button
                      className="secondary full"
                      onClick={() => changePage("Exceptions")}
                    >
                      Open exceptions queue <Icon name="arrow" size={16} />
                    </button>
                  </aside>
                </div>
                <section className="portal-panel">
                  {sectionHeading(
                    "Today's care, at a glance",
                    "All bookings",
                    () => changePage("Bookings & dispatch"),
                  )}
                  {jobTable(jobs.slice(0, 4), true)}
                </section>
                <div className="ops-bottom-grid">
                  <section className="portal-panel">
                    {sectionHeading(
                      "The week in perspective",
                      "View reports",
                      () => changePage("Reports"),
                    )}
                    <div className="weekly-chart">
                      {[58, 74, 62, 88, 69, 95, 72].map((h, i) => (
                        <div key={i}>
                          <span style={{ height: `${h}%` }}>
                            <b>{[32, 41, 35, 49, 38, 52, 40][i]}</b>
                          </span>
                          <small>
                            {
                              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                                i
                              ]
                            }
                          </small>
                        </div>
                      ))}
                    </div>
                    <div className="chart-summary">
                      <span>
                        <i /> Verified washes
                      </span>
                      <strong>
                        287 <small>this week</small>
                      </strong>
                    </div>
                  </section>
                  <section className="portal-panel">
                    {sectionHeading(
                      "Ready to make a difference",
                      "Manage people",
                      () => changePage("People & screening"),
                    )}
                    {staffList.slice(0, 3).map((s) => (
                      <div className="compact-person" key={s.id}>
                        <span className="team-avatar">{s.initials}</span>
                        <div>
                          <strong>{s.name}</strong>
                          <small>
                            {s.zone} · {s.jobs} verified washes
                          </small>
                        </div>
                        <span className="portal-status">{s.status}</span>
                      </div>
                    ))}
                  </section>
                </div>
              </>
            )}
            {dispatcher && page === "Bookings & dispatch" && (
              <>
                <div className="dispatch-banner">
                  <span className="stat-icon">
                    <Icon name="calendar" />
                  </span>
                  <div>
                    <h3>
                      {jobs.filter((j) => j.staff === "Unassigned").length}{" "}
                      booking needs a professional
                    </h3>
                    <p>
                      Ranked by availability, service capability, location and
                      existing estate runs.
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      setSelectedJob(jobs[1])
                      setDrawer("assign")
                    }}
                  >
                    Review suggestions <Icon name="arrow" size={16} />
                  </button>
                </div>
                <section className="portal-panel">
                  {toolbar()}
                  {jobTable(filteredJobs)}
                </section>
              </>
            )}
            {dispatcher && page === "Live operations" && (
              <>
                <div className="live-banner">
                  <span className="live-dot" /> Job-limited tracking only
                  <span>
                    Location is visible from Accept to Clock out. Illustrative
                    map.
                  </span>
                </div>
                <div className="large-map">{map}</div>
                <section className="portal-panel">
                  {sectionHeading("Active jobs")}
                  {jobTable(
                    jobs.filter(
                      (j) => !["Booked", "Verified"].includes(j.status),
                    ),
                  )}
                </section>
              </>
            )}
            {dispatcher && page === "Exceptions" && (
              <>
                <div className="exception-intro">
                  <Icon name="shield" size={25} />
                  <div>
                    <h3>Every exception deserves a clear decision.</h3>
                    <p>
                      Review evidence first. Every override needs a reason and
                      is added to the audit trail.
                    </p>
                  </div>
                </div>
                {resolved ? (
                  <section className="portal-panel empty-state">
                    <Icon name="check" size={40} />
                    <h3>Demo exception reviewed.</h3>
                    <p>
                      Your decision has been added to the session audit trail.
                    </p>
                    <button
                      className="secondary"
                      onClick={() => changePage("Audit trail")}
                    >
                      View audit trail
                    </button>
                  </section>
                ) : (
                  <div className="exception-grid">
                    {[
                      [
                        "Verdict timeout",
                        "Customer has not responded for 18 minutes.",
                        "GW-1051",
                        "Release unconfirmed",
                      ],
                      [
                        "Arrival plate mismatch",
                        "Scanned plate does not match the registered vehicle.",
                        "GW-1037",
                        "Review mismatch",
                      ],
                      [
                        "Treated, not pleased",
                        "Customer reported missed areas on the vehicle.",
                        "GW-1029",
                        "Review complaint",
                      ],
                    ].map(([title, text, id, action], i) => (
                      <section
                        className="portal-panel exception-detail"
                        key={id}
                      >
                        <div className="section-heading">
                          <span className="portal-status review">
                            Needs decision
                          </span>
                          <small>{id}</small>
                        </div>
                        <span className="exception-large-icon">
                          <Icon
                            name={i === 0 ? "clock" : i === 1 ? "car" : "help"}
                            size={25}
                          />
                        </span>
                        <h3>{title}</h3>
                        <p>{text}</p>
                        <div className="exception-proof-tags">
                          <span>GPS evidence</span>
                          <span>Plate scans</span>
                          <span>Remarks</span>
                        </div>
                        <button
                          disabled={resolvedCases.includes(id)}
                          className="secondary full"
                          onClick={() => {
                            setSelectedJob({ ...jobs[i === 0 ? 3 : i], id })
                            setDrawer(
                              i === 0
                                ? "release"
                                : i === 1
                                  ? "mismatch"
                                  : "complaint",
                            )
                          }}
                        >
                          {resolvedCases.includes(id)
                            ? "Decision recorded"
                            : action}
                          <Icon name="arrow" size={16} />
                        </button>
                      </section>
                    ))}
                  </div>
                )}
              </>
            )}
            {dispatcher && page === "People & screening" && (
              <>
                <div className="screening-notice">
                  <Icon name="shield" size={19} />
                  <span>
                    Activation is blocked until all six screening documents are
                    verified. Device changes require approval.
                  </span>
                </div>
                {staffCards()}
              </>
            )}
            {support && page === "Customers & vehicles" && (
              <section className="portal-panel">
                {sectionHeading("Customer directory", "Add customer", () =>
                  setDrawer("customer"),
                )}
                <div className="portal-toolbar">
                  <div className="search-field">
                    <Icon name="car" size={17} />
                    <input
                      aria-label="Search customers"
                      placeholder="Search customer, phone or plate"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  <button className="secondary" onClick={exportJobs}>
                    Export vehicles
                  </button>
                </div>
                <div className="table-scroll">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th>VEHICLE</th>
                        <th>LOCATION</th>
                        <th>ACCOUNT</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Tolu Adebayo",
                          "Mercedes-Benz C300",
                          "LND 482 JK",
                          "Lekki Phase 1",
                          "Personal",
                        ],
                        [
                          "Bola Adeyemi",
                          "Lexus RX350",
                          "EKY 203 AJ",
                          "Victoria Island",
                          "Personal",
                        ],
                        [
                          "Meridian Holdings",
                          "Toyota Camry",
                          "KJA 715 FC",
                          "Office car park",
                          "Corporate",
                        ],
                        [
                          "Ada Nwankwo",
                          "Honda Accord",
                          "LSD 441 GR",
                          "Parkview Estate",
                          "Estate resident",
                        ],
                      ]
                        .filter((row) =>
                          row
                            .join(" ")
                            .toLowerCase()
                            .includes(query.toLowerCase()),
                        )
                        .map(([name, car, plate, area, type]) => (
                          <tr key={plate}>
                            <td>
                              <strong>{name}</strong>
                              <small>Registered customer</small>
                            </td>
                            <td>
                              <strong>{car}</strong>
                              <small>
                                <Plate>{plate}</Plate>
                              </small>
                            </td>
                            <td>{area}</td>
                            <td>
                              <span className="portal-status">{type}</span>
                            </td>
                            <td>
                              <button
                                className="table-more"
                                onClick={() => {
                                  setAssigned(name)
                                  setDrawer("customer")
                                }}
                                aria-label={`View ${name}`}
                              >
                                <Icon name="chevron" size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {admin &&
              ["Corporate accounts", "Estate accounts"].includes(page) && (
                <>
                  <div className="organisation-grid">
                    {(page === "Corporate accounts"
                      ? [
                          [
                            "Meridian Holdings",
                            "24 vehicles",
                            "6-month Signature plan",
                            "Active",
                          ],
                          [
                            "Atlas Logistics",
                            "18 vehicles",
                            "3-month Essential plan",
                            "Active",
                          ],
                          [
                            "Northstar Partners",
                            "12 vehicles",
                            "Account request",
                            "Pending approval",
                          ],
                        ]
                      : [
                          [
                            "Parkview Estate",
                            "120 households",
                            "Mon / Wed / Fri · 8–11 AM",
                            "Active",
                          ],
                          [
                            "Oceanview Gardens",
                            "86 households",
                            "Tue / Thu · 9 AM–12 PM",
                            "Active",
                          ],
                          [
                            "Cedar Court",
                            "44 households",
                            "Access guidelines pending",
                            "Pending approval",
                          ],
                        ]
                    ).map(([name, count, plan, status], i) => (
                      <section className="portal-panel org-card" key={name}>
                        <span className="organisation-icon">
                          <Icon
                            name={page === "Corporate accounts" ? "car" : "pin"}
                            size={28}
                          />
                        </span>
                        <span className="portal-status">{status}</span>
                        <h3>{name}</h3>
                        <p>{count}</p>
                        <div className="org-plan">{plan}</div>
                        <button
                          className="secondary full"
                          onClick={() => {
                            setAssigned(name)
                            setDrawer(i === 2 ? "approve-org" : "organisation")
                          }}
                        >
                          Manage account
                          <Icon name="arrow" size={15} />
                        </button>
                      </section>
                    ))}
                  </div>
                </>
              )}
            {finance &&
              ["Payments & invoices", "Finance overview"].includes(page) && (
                <>
                  {metrics([
                    {
                      label: "Collected this month",
                      value: "₦2.84m",
                      note: "Reconciled by reference",
                      icon: "card",
                    },
                    {
                      label: "Outstanding invoices",
                      value: "₦240k",
                      note: "3 corporate invoices",
                      icon: "clock",
                    },
                    {
                      label: "Wash credit issued",
                      value: "₦18k",
                      note: "Customer service resolutions",
                      icon: "shield",
                    },
                    {
                      label: "Digital payments",
                      value: "94%",
                      note: "Card & bank transfer",
                      icon: "card",
                    },
                  ])}
                  <section className="portal-panel">
                    {sectionHeading("Payment ledger", "Export ledger", () =>
                      download(
                        "payment-ledger",
                        "Reference,Amount,Status\nGW-PAY-1048,8500,Paid\nGW-INV-024,240000,Pending\nGW-PAY-1041,5000,Paid",
                      ),
                    )}
                    <div className="table-scroll">
                      <table className="portal-table">
                        <thead>
                          <tr>
                            <th>REFERENCE</th>
                            <th>CUSTOMER</th>
                            <th>AMOUNT</th>
                            <th>STATUS</th>
                            <th />
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ["GW-PAY-1048", "Tolu Adebayo", "₦8,500", "Paid"],
                            [
                              "GW-INV-024",
                              "Meridian Holdings",
                              "₦240,000",
                              "Pending",
                            ],
                            ["GW-PAY-1041", "Bola Adeyemi", "₦5,000", "Paid"],
                            [
                              "GW-PAY-1038",
                              "Ada Nwankwo",
                              "₦8,500",
                              "Credited",
                            ],
                          ].map(([ref, name, amount, status]) => (
                            <tr key={ref}>
                              <td>
                                <strong>{ref}</strong>
                                <small>10 October 2026</small>
                              </td>
                              <td>{name}</td>
                              <td>
                                <strong>{amount}</strong>
                              </td>
                              <td>
                                <span className="portal-status">{status}</span>
                              </td>
                              <td>
                                <button
                                  className="text-button"
                                  onClick={() => {
                                    setAssigned(ref)
                                    setDrawer("payment")
                                  }}
                                >
                                  Details <Icon name="chevron" size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </section>
                </>
              )}
            {admin && page === "Services & policies" && (
              <div className="settings-grid">
                <section className="portal-panel">
                  <div className="eyebrow">CUSTOMER CARE</div>
                  <h3>Services & pricing</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setSavedPolicy(true)
                      log(
                        "Updated service prices with required reason: " +
                          reason,
                      )
                      notify("Demo service prices saved.")
                    }}
                  >
                    <label>
                      Vehicle category
                      <select>
                        <option>Sedan</option>
                        <option>SUV</option>
                        <option>Van</option>
                      </select>
                    </label>
                    {["Essential Wash", "Signature Wash", "Premium Detail"].map(
                      (s, i) => (
                        <label key={s}>
                          {s} (₦)
                          <input
                            type="number"
                            min="0"
                            required
                            defaultValue={[5000, 8500, 18000][i]}
                          />
                        </label>
                      ),
                    )}
                    <label>
                      Reason for change
                      <input
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Required for the audit trail"
                      />
                    </label>
                    <button className="primary full">
                      Save pricing <Icon name="check" size={16} />
                    </button>
                    {savedPolicy && (
                      <p className="saved-note">
                        Saved to the demo session audit trail.
                      </p>
                    )}
                  </form>
                </section>
                <section className="portal-panel">
                  <div className="eyebrow">VERIFICATION & SAFETY</div>
                  <h3>Job policies</h3>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      log("Updated job policy settings")
                      notify("Demo policy settings saved.")
                    }}
                  >
                    <div className="form-grid">
                      <label>
                        Geofence radius (m)
                        <input
                          type="number"
                          required
                          min="25"
                          defaultValue="100"
                        />
                      </label>
                      <label>
                        Release request (min)
                        <input
                          type="number"
                          required
                          min="15"
                          defaultValue="15"
                        />
                      </label>
                    </div>
                    <label>
                      Cancellation window (hours)
                      <input type="number" required min="0" defaultValue="2" />
                    </label>
                    <label>
                      Customer verdict window after release (hours)
                      <input type="number" required min="1" defaultValue="24" />
                    </label>
                    <div className="policy-locked">
                      <Icon name="shield" size={18} />
                      <span>
                        Outdoor-only work
                        <br />
                        Job-limited GPS tracking
                        <br />
                        Two plate scans required
                        <br />
                        Untreated verdict blocks submission
                      </span>
                    </div>
                    <button className="primary full">
                      Save policy settings <Icon name="check" size={16} />
                    </button>
                  </form>
                </section>
              </div>
            )}
            {admin && page === "Roles & access" && (
              <section className="portal-panel">
                {sectionHeading(
                  "The right access. Nothing more.",
                  "Invite administrator",
                  () => setDrawer("invite"),
                )}
                <p className="panel-description">
                  Permissions shown here are a prototype. Enforcement must
                  happen on the backend.
                </p>
                <div className="table-scroll">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>ROLE</th>
                        <th>OPERATIONAL ACCESS</th>
                        <th>FINANCIAL ACCESS</th>
                        <th>SECURITY</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Super admin",
                          "All operations, configuration & users",
                          "Reconcile, refund & credit",
                          "2-step sign-in",
                        ],
                        [
                          "Dispatcher",
                          "Assignment, evidence & release",
                          "No refunds or price changes",
                          "2-step sign-in",
                        ],
                        [
                          "Finance",
                          "Payments, invoices & subscriptions",
                          "Reconcile, refund & credit",
                          "2-step sign-in",
                        ],
                        [
                          "Support",
                          "Complaints, rescheduling & escalation",
                          "No refunds or releases",
                          "2-step sign-in",
                        ],
                      ].map((row) => (
                        <tr key={row[0]}>
                          {row.map((text, i) => (
                            <td key={text}>
                              {i === 0 ? <strong>{text}</strong> : text}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="policy-locked">
                  <Icon name="shield" size={20} />
                  <span>
                    Audit records cannot be edited or deleted. Staff cannot
                    assign jobs or view customer phone numbers.
                  </span>
                </div>
              </section>
            )}
            {operations && page === "Audit trail" && (
              <section className="portal-panel">
                {sectionHeading(
                  "An accountable record of every decision",
                  "Export audit",
                  () =>
                    download(
                      "audit-trail",
                      "Event\n" +
                        audit
                          .map((e) => `"${e.replace(/"/g, '""')}"`)
                          .join("\n"),
                    ),
                )}
                <p className="panel-description">
                  Append-only session log. No edit or delete actions.
                </p>
                <div className="audit-timeline">
                  {audit.map((event, i) => (
                    <div key={`${event}-${i}`}>
                      <span>
                        <Icon name="shield" size={16} />
                      </span>
                      <p>
                        {event}
                        <small>
                          {i === 0
                            ? "Most recent event"
                            : "Recorded in operations history"}
                        </small>
                      </p>
                      <span className="portal-status">Recorded</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {washer && page === "My day" && (
              <>
                <div className="field-status-bar">
                  <span>
                    <i className={shift ? "on-shift" : ""} />
                    {shift
                      ? "On shift · Available for assigned work"
                      : "Off shift · Start when you're ready"}
                  </span>
                  <span>
                    <Icon name="shield" size={15} />
                    Registered device · Android
                  </span>
                </div>
                {metrics([
                  {
                    label: "Assigned today",
                    value: "04",
                    note: "Only your assigned jobs",
                    icon: "calendar" as "clock",
                  },
                  {
                    label: "Completed",
                    value: jobStep === 7 ? "03" : "02",
                    note: "Proof-backed work",
                    icon: "shield",
                  },
                  {
                    label: "Customer satisfaction",
                    value: "98%",
                    note: "Last 30 verified washes",
                    icon: "drop",
                  },
                  {
                    label: "Open incidents",
                    value: incident ? "01" : "00",
                    note: "Operations is here to help",
                    icon: "help" as "shield",
                  },
                ])}
                <div className="field-dashboard-grid">
                  <section className="portal-panel next-job-card">
                    <div className="section-heading">
                      <span className="eyebrow">YOUR NEXT ASSIGNED JOB</span>
                      <span className="portal-status">
                        {jobStep > 0 ? "Accepted" : "Awaiting acceptance"}
                      </span>
                    </div>
                    <div className="field-car">
                      <CarArt />
                    </div>
                    <h2>Signature Wash</h2>
                    <p>10:00 – 11:00 AM · Lekki Phase 1</p>
                    {jobStep > 0 && (
                      <div className="accepted-address">
                        <Icon name="pin" size={17} />
                        12 Admiralty Way · Outdoor driveway
                        <br />
                        Gate note: Use the side parking entrance.
                      </div>
                    )}
                    <div className="field-job-summary">
                      <span>
                        <Icon name="clock" size={18} />
                        60–75 minutes
                      </span>
                      <span>
                        <Icon name="shield" size={18} />
                        Outdoor only
                      </span>
                    </div>
                    <div className="field-job-buttons">
                      <button
                        className="primary"
                        disabled={!shift}
                        onClick={() => {
                          if (jobStep === 0) setJobStep(1)
                          changePage("Active job")
                        }}
                      >
                        {jobStep > 0
                          ? "Continue assigned job"
                          : "Accept assigned job"}
                        <Icon name="arrow" size={17} />
                      </button>
                      {jobStep === 0 && (
                        <button
                          className="secondary"
                          onClick={() => setDrawer("decline")}
                        >
                          Decline with reason
                        </button>
                      )}
                    </div>
                    {!shift && (
                      <p className="policy-note">
                        Start your shift before accepting your assigned job.
                      </p>
                    )}
                    <p className="field-private">
                      <Icon name="shield" size={14} />
                      Customer name and address stay hidden until acceptance.
                    </p>
                  </section>
                  <div>
                    <section className="portal-panel">
                      {sectionHeading("Your route, thoughtfully planned")}
                      <div className="field-route">
                        {[
                          [
                            "10:00 AM",
                            "Signature Wash",
                            "Lekki Phase 1",
                            "Next up",
                          ],
                          [
                            "12:00 PM",
                            "Signature Wash",
                            "Victoria Island",
                            "Assigned",
                          ],
                          ["2:00 PM", "Essential Wash", "Lekki", "Assigned"],
                        ].map(([time, service, area, status], i) => (
                          <button
                            key={time}
                            onClick={() => {
                              if (i === 0) changePage("Active job")
                              else setDrawer("assigned-preview")
                            }}
                          >
                            <span className="route-number">{i + 1}</span>
                            <span>
                              <small>{time}</small>
                              <strong>{service}</strong>
                              <p>{area}</p>
                            </span>
                            <span className="portal-status">{status}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="field-conduct">
                      <Icon name="shield" size={24} />
                      <h3>Professional care. Clear boundaries.</h3>
                      <p>
                        Work outdoors only. Never enter private premises, handle
                        personal property or arrange private jobs.
                      </p>
                      <button
                        className="text-button"
                        onClick={() => changePage("Help & conduct")}
                      >
                        Your conduct guide <Icon name="arrow" size={15} />
                      </button>
                    </section>
                  </div>
                </div>
              </>
            )}
            {washer && page === "Assigned jobs" && (
              <>
                <div className="screening-notice">
                  <Icon name="shield" size={19} />
                  You see assigned work only. No open request list, customer
                  phone numbers or unassigned addresses.
                </div>
                <div className="assigned-job-grid">
                  {[
                    ["10:00 AM", "Signature Wash", "Lekki Phase 1"],
                    ["12:00 PM", "Signature Wash", "Victoria Island"],
                    ["2:00 PM", "Essential Wash", "Lekki"],
                  ].map(([time, service, area], i) => (
                    <section className="portal-panel" key={time}>
                      <span className="portal-status">
                        {i === 0 && jobStep > 0 ? "Accepted" : "Assigned"}
                      </span>
                      <h3>{service}</h3>
                      <p className="panel-description">
                        {area} · {time}
                      </p>
                      <div className="assigned-preview-icon">
                        <Icon name="car" size={44} />
                      </div>
                      <p className="policy-note">
                        Full address appears only after acceptance.
                      </p>
                      <button
                        className="primary full"
                        onClick={() =>
                          i === 0
                            ? changePage("Active job")
                            : setDrawer("assigned-preview")
                        }
                      >
                        {i === 0 ? "Open next job" : "View assignment"}
                        <Icon name="arrow" size={16} />
                      </button>
                    </section>
                  ))}
                </div>
              </>
            )}
            {washer && page === "Active job" && (
              <section className="portal-panel active-field-job">
                <div className="field-progress-label">
                  <span>JOB GW-1048 · SIGNATURE WASH</span>
                  <span>STEP {Math.min(jobStep + 1, 8)} OF 8</span>
                </div>
                <div className="field-step-progress">
                  {Array.from({ length: 8 }, (_, i) => (
                    <span className={i <= jobStep ? "current" : ""} key={i} />
                  ))}
                </div>
                {jobStep === 0 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="calendar" size={42} />
                    </span>
                    <h2>A clear next step.</h2>
                    <p>
                      Signature Wash · Lekki Phase 1 · 10:00–11:00 AM.
                      <br />
                      Accept this assigned job to reveal the address and begin
                      job-limited GPS tracking.
                    </p>
                    <button
                      className="primary full"
                      disabled={!shift}
                      onClick={() => setJobStep(1)}
                    >
                      Accept assignment <Icon name="check" size={18} />
                    </button>
                    {!shift && (
                      <button
                        className="secondary full"
                        onClick={() => setShift(true)}
                      >
                        Start demo shift
                      </button>
                    )}
                  </>
                ) : jobStep === 1 ? (
                  <>
                    <div className="tracking-indicator">
                      <span />
                      Tracking active for this assigned job · Simulated
                    </div>
                    <span className="field-action-icon">
                      <Icon name="pin" size={42} />
                    </span>
                    <h2>Head to your next fresh start.</h2>
                    <div className="address-card">
                      <strong>12 Admiralty Way, Lekki Phase 1</strong>
                      <p>Outdoor driveway · Side parking entrance</p>
                      <Plate />
                    </div>
                    <p>
                      Clock-in requires arrival inside the job's geofence. This
                      prototype simulates the location check.
                    </p>
                    <button
                      className="secondary full"
                      onClick={() =>
                        window.open(
                          "https://www.google.com/maps/search/?api=1&query=Admiralty+Way+Lekki+Lagos",
                          "_blank",
                          "noopener,noreferrer",
                        )
                      }
                    >
                      Open directions <Icon name="pin" size={18} />
                    </button>
                    <button
                      className="primary full"
                      onClick={() => {
                        setJobStep(2)
                        setScan("")
                      }}
                    >
                      Simulate arrival in geofence{" "}
                      <Icon name="arrow" size={18} />
                    </button>
                  </>
                ) : jobStep === 2 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="car" size={42} />
                    </span>
                    <h2>Right place. Now the right car.</h2>
                    <p>
                      Scan the registered plate before clock-in. A mismatch
                      blocks the wash.
                    </p>
                    <div className="scan-frame">
                      <Icon name="car" size={44} />
                      <Plate />
                      <span>
                        Demo scan input · Live-camera OCR required in production
                      </span>
                    </div>
                    <label>
                      Scanned plate
                      <input
                        value={scan}
                        onChange={(e) => setScan(e.target.value.toUpperCase())}
                        placeholder="LND 482 JK"
                      />
                    </label>
                    {scanError && (
                      <p className="form-error" role="alert">
                        {scanError}
                      </p>
                    )}
                    <button
                      className="primary full"
                      onClick={() => {
                        if (scan.replace(/[\s-]/g, "") !== "LND482JK")
                          setScanError(
                            "Plate mismatch. Clock-in blocked. Confirm the assigned vehicle or report an incident.",
                          )
                        else {
                          setScanError("")
                          setJobStep(3)
                        }
                      }}
                    >
                      Match plate & clock in <Icon name="check" size={18} />
                    </button>
                  </>
                ) : jobStep === 3 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="shield" size={42} />
                    </span>
                    <h2>Document before you begin.</h2>
                    <p>
                      Record the vehicle's condition and any existing damage.
                      Live camera only in production; gallery uploads are
                      disabled.
                    </p>
                    <div
                      className={`demo-photo ${photoBefore ? "captured" : ""}`}
                    >
                      <Icon name={photoBefore ? "check" : "car"} size={42} />
                      <strong>
                        {photoBefore
                          ? "Demo before-evidence attached"
                          : "Before-wash evidence"}
                      </strong>
                      <button
                        className="secondary"
                        onClick={() => setPhotoBefore(true)}
                      >
                        Simulate camera capture
                      </button>
                    </div>
                    <label>
                      Pre-existing damage (if any)
                      <textarea placeholder="Describe visible damage before washing." />
                    </label>
                    <button
                      className="primary full"
                      disabled={!photoBefore}
                      onClick={() => setJobStep(4)}
                    >
                      Begin washing <Icon name="drop" size={18} />
                    </button>
                  </>
                ) : jobStep === 4 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="drop" size={42} />
                    </span>
                    <h2>Make every detail count.</h2>
                    <p>
                      Follow the Signature checklist. Capture the after evidence
                      when you're done.
                    </p>
                    <div className="wash-checklist">
                      {[
                        "Exterior hand wash & wheel clean",
                        "Interior vacuum & dashboard wipe",
                        "Glass finish & tyre dressing",
                      ].map((c) => (
                        <label className="checkbox-label" key={c}>
                          <input type="checkbox" />
                          {c}
                        </label>
                      ))}
                    </div>
                    <div className="demo-photo">
                      <Icon name={photoAfter ? "check" : "car"} size={33} />
                      <strong>
                        {photoAfter
                          ? "Demo after-evidence attached"
                          : "After-wash evidence"}
                      </strong>
                      <button
                        className="secondary"
                        onClick={() => setPhotoAfter(true)}
                      >
                        Simulate camera capture
                      </button>
                    </div>
                    <button
                      className="primary full"
                      disabled={!photoAfter}
                      onClick={() => setJobStep(5)}
                    >
                      Ready · Request customer verdict{" "}
                      <Icon name="arrow" size={18} />
                    </button>
                  </>
                ) : jobStep === 5 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="clock" size={42} />
                    </span>
                    <h2>Your work. Their final say.</h2>
                    <p>
                      The customer has been asked to give their TREATED verdict.
                      Final submission is locked until a valid verdict is
                      recorded.
                    </p>
                    <div className="locked-scan">
                      <Icon name="shield" size={22} />
                      Final plate scan locked
                    </div>
                    <div className="verdict-simulator">
                      <small>
                        PROTOTYPE EVENT SIMULATOR · NOT A STAFF PERMISSION
                      </small>
                      <label>
                        Simulate incoming customer verdict
                        <select
                          value={customerVerdict}
                          onChange={(e) => setCustomerVerdict(e.target.value)}
                        >
                          <option value="">Awaiting verdict</option>
                          <option>Treated and satisfied</option>
                          <option>Treated and not pleased</option>
                          <option>Untreated</option>
                        </select>
                      </label>
                    </div>
                    {customerVerdict === "Untreated" && (
                      <p className="form-error">
                        Job disputed. Only operations can review and release
                        this job.
                      </p>
                    )}
                    <button
                      className="primary full"
                      disabled={
                        !customerVerdict || customerVerdict === "Untreated"
                      }
                      onClick={() => {
                        setScan("")
                        setJobStep(6)
                      }}
                    >
                      Continue after customer verdict{" "}
                      <Icon name="arrow" size={18} />
                    </button>
                    <button
                      className="secondary full"
                      onClick={() => setDrawer("release-request")}
                    >
                      Preview release request after 15-minute timeout
                    </button>
                  </>
                ) : jobStep === 6 ? (
                  <>
                    <span className="field-action-icon">
                      <Icon name="car" size={42} />
                    </span>
                    <h2>The last proof. The same plate.</h2>
                    <p>
                      {customerVerdict}. A matching final plate scan is required
                      before submission and clock-out.
                    </p>
                    <label>
                      Final scanned plate
                      <input
                        value={scan}
                        onChange={(e) => setScan(e.target.value.toUpperCase())}
                        placeholder="LND 482 JK"
                      />
                    </label>
                    {scanError && <p className="form-error">{scanError}</p>}
                    <button
                      className="primary full"
                      onClick={() => {
                        if (scan.replace(/[\s-]/g, "") !== "LND482JK")
                          setScanError(
                            "Submission rejected. The plate must match the registered vehicle.",
                          )
                        else {
                          setScanError("")
                          setJobStep(7)
                          notify(
                            "Demo job submitted. GPS tracking stopped at clock-out.",
                          )
                        }
                      }}
                    >
                      Match, submit & clock out <Icon name="check" size={18} />
                    </button>
                  </>
                ) : (
                  <div className="confirmation">
                    <span className="confirmation-icon">
                      <Icon name="shield" size={40} />
                    </span>
                    <h2>Good work. Fully accounted for.</h2>
                    <p>
                      GPS tracking stopped. Both plate scans matched. Your
                      customer's verdict is on record.
                    </p>
                    <span className="portal-status">
                      {customerVerdict === "Treated and not pleased"
                        ? "Closed · Complaint open"
                        : "Closed · Verified"}
                    </span>
                    <button
                      className="primary full"
                      onClick={() => changePage("Daily summary")}
                    >
                      View your day <Icon name="arrow" size={18} />
                    </button>
                  </div>
                )}
                <div className="field-safety-footer">
                  <Icon name="shield" size={15} />
                  Outdoors only. No personal property. No private arrangements.
                  <button onClick={() => setDrawer("incident")}>
                    Report incident
                  </button>
                </div>
              </section>
            )}
            {washer && page === "Daily summary" && (
              <>
                {metrics([
                  {
                    label: "Completed today",
                    value: jobStep === 7 ? "03" : "02",
                    note: "Every wash backed by evidence",
                    icon: "shield",
                  },
                  {
                    label: "Satisfied verdicts",
                    value: "100%",
                    note: "2 verified customer verdicts",
                    icon: "drop",
                  },
                  {
                    label: "Time on assigned jobs",
                    value: "3h 20m",
                    note: "Tracking limited to work",
                    icon: "clock",
                  },
                  {
                    label: "Open disputes",
                    value: customerVerdict === "Untreated" ? "01" : "00",
                    note: "Operations reviews every case",
                    icon: "car",
                  },
                ])}
                <section className="portal-panel">
                  {sectionHeading("Your work has a record")}
                  <div className="history-row">
                    <span className="stat-icon">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <h4>Essential Wash · 8:00 AM</h4>
                      <p>
                        Lekki · GPS, both scans and customer verdict verified
                      </p>
                    </div>
                    <span className="portal-status">Verified</span>
                  </div>
                  <div className="history-row">
                    <span className="stat-icon">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <h4>Signature Wash · 9:00 AM</h4>
                      <p>
                        Ikoyi · GPS, both scans and customer verdict verified
                      </p>
                    </div>
                    <span className="portal-status">Verified</span>
                  </div>
                  {jobStep === 7 && (
                    <div className="history-row">
                      <span className="stat-icon">
                        <Icon name="shield" />
                      </span>
                      <div>
                        <h4>Signature Wash · GW-1048</h4>
                        <p>
                          {customerVerdict} · Demo job completed this session
                        </p>
                      </div>
                      <span className="portal-status">Submitted</span>
                    </div>
                  )}
                </section>
              </>
            )}
            {washer && page === "Screening & device" && (
              <div className="settings-grid">
                <section className="portal-panel">
                  {sectionHeading("Your professional record")}
                  {[
                    "Valid identification",
                    "Guarantor verification",
                    "Guarantor documentation",
                    "Background verification",
                    "Written undertaking",
                    "Employment documentation",
                  ].map((doc) => (
                    <div className="screening-document" key={doc}>
                      <Icon name="shield" size={18} />
                      <span>{doc}</span>
                      <span className="portal-status">Verified</span>
                    </div>
                  ))}
                </section>
                <section className="portal-panel">
                  <span className="field-action-icon">
                    <Icon name="shield" size={35} />
                  </span>
                  <h3>One account. One registered device.</h3>
                  <p className="panel-description">
                    Samsung Galaxy A24 · Android
                    <br />
                    Registered 14 September 2026
                    <br />
                    Device status: approved
                  </p>
                  <div className="policy-locked">
                    <Icon name="pin" size={18} />
                    <span>
                      Tracking is on only between job acceptance and clock-out.
                      Offline evidence is queued for sync in the production app.
                    </span>
                  </div>
                  <button
                    className="secondary full"
                    onClick={() => setDrawer("device")}
                  >
                    Request a device change <Icon name="arrow" size={16} />
                  </button>
                </section>
              </div>
            )}
            {(washer || estate) && page === "Incidents" && (
              <section className="portal-panel">
                {sectionHeading(
                  "A safer service starts with speaking up.",
                  "Report incident",
                  () => setDrawer("incident"),
                )}
                {incident ? (
                  <div className="history-row">
                    <Icon name="shield" size={25} />
                    <div>
                      <h4>Demo incident INC-104</h4>
                      <p>Submitted this session · Awaiting operations review</p>
                    </div>
                    <span className="portal-status">Open</span>
                  </div>
                ) : (
                  <div className="empty-state">
                    <Icon name="shield" size={42} />
                    <h3>Nothing unresolved.</h3>
                    <p>
                      Report access, safety, weather or conduct concerns here.
                    </p>
                    <button
                      className="primary"
                      onClick={() => setDrawer("incident")}
                    >
                      Report an incident <Icon name="plus" size={17} />
                    </button>
                  </div>
                )}
              </section>
            )}
            {washer && page === "Help & conduct" && (
              <>
                <section className="passport-banner">
                  <Icon name="shield" size={42} />
                  <div>
                    <div className="eyebrow">
                      PROFESSIONAL CARE, CLEAR BOUNDARIES
                    </div>
                    <h2>Your work deserves protection.</h2>
                    <p>
                      The same rules keep you, the customer and the vehicle
                      safe.
                    </p>
                  </div>
                </section>
                <div className="conduct-grid">
                  {[
                    [
                      "Outdoor work only",
                      "Never enter homes or private indoor premises. Ask operations for help if a customer requests it.",
                    ],
                    [
                      "Protect their privacy",
                      "Customer numbers are hidden. Contact runs through in-app support or the dispatcher.",
                    ],
                    [
                      "Live evidence only",
                      "Capture the vehicle only. Avoid people, home interiors and neighbouring property.",
                    ],
                    [
                      "Assigned work only",
                      "Never create, swap or privately arrange jobs. All work is assigned by operations.",
                    ],
                  ].map(([title, text]) => (
                    <section className="portal-panel" key={title}>
                      <Icon name="shield" size={25} />
                      <h3>{title}</h3>
                      <p>{text}</p>
                    </section>
                  ))}
                </div>
                <button
                  className="primary"
                  onClick={() => setDrawer("support")}
                >
                  Contact dispatcher <Icon name="arrow" size={17} />
                </button>
              </>
            )}
            {corporate && page === "Fleet overview" && (
              <>
                {metrics([
                  {
                    label: "Vehicles in your fleet",
                    value: extraVehicle ? "25" : "24",
                    note: "One account. All your care.",
                    icon: "car",
                  },
                  {
                    label: "Washes this month",
                    value: "68",
                    note: "Scheduled across your fleet",
                    icon: "drop",
                  },
                  {
                    label: "Verified completion",
                    value: "98.5%",
                    note: "Proof ready for finance",
                    icon: "shield",
                  },
                  {
                    label: "Your plan balance",
                    value: "28",
                    note: "Washes remaining this term",
                    icon: "card",
                  },
                ])}
                <section className="fleet-hero">
                  <div>
                    <div className="eyebrow">
                      MERIDIAN HOLDINGS · SIGNATURE FLEET PLAN
                    </div>
                    <h2>
                      Looking sharp.
                      <br />
                      Running smoothly.
                    </h2>
                    <p>
                      Your next fleet wash is Monday, 12 October.
                      <br />8 vehicles. One outdoor car park. Every job
                      verified.
                    </p>
                    <button
                      className="primary"
                      onClick={() => changePage("Wash schedule")}
                    >
                      View your care calendar <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  <CarArt silver />
                  <span className="fleet-hero-tag">
                    <Icon name="shield" size={17} />
                    Every vehicle has a Wash Passport
                  </span>
                </section>
                <section className="portal-panel">
                  {sectionHeading(
                    "Your fleet shine board",
                    "All vehicles",
                    () => changePage("Vehicles"),
                  )}
                  <div className="shine-board">
                    {fleet.map((j, i) => (
                      <button key={j.id} onClick={() => jobDetail(j)}>
                        <span className={`shine-indicator shine-${i % 3}`} />
                        <Icon name="car" size={27} />
                        <strong>{j.vehicle}</strong>
                        <Plate>{j.plate}</Plate>
                        <small>
                          {
                            [
                              "Washed today",
                              "Ready for verdict",
                              "Due for care",
                              "Washed 2 days ago",
                              "Washed today",
                              "Scheduled Monday",
                            ][i]
                          }
                        </small>
                      </button>
                    ))}
                  </div>
                  <div className="shine-legend">
                    <span>
                      <i />
                      Recent verified care
                    </span>
                    <span>
                      <i />
                      Care coming up
                    </span>
                    <span>
                      <i />
                      Ready for confirmation
                    </span>
                  </div>
                </section>
                <section className="portal-panel">
                  {sectionHeading("Active care", "View all active washes", () =>
                    changePage("Active washes"),
                  )}
                  {jobTable(jobs.slice(0, 3))}
                </section>
              </>
            )}
            {corporate && page === "Vehicles" && (
              <>
                <div className="section-heading">
                  <h3>Your fleet, plate by plate.</h3>
                  <button
                    className="secondary"
                    onClick={() => setDrawer("fleet-vehicle")}
                  >
                    <Icon name="plus" size={16} />
                    Register vehicle
                  </button>
                </div>
                <section className="portal-panel">
                  {toolbar("Search your fleet plates or vehicles")}
                  {jobTable(filteredJobs)}
                  {extraVehicle && (
                    <div className="history-row">
                      <Icon name="car" />
                      <div>
                        <h4>{extraVehicle}</h4>
                        <Plate>{extraPlate}</Plate>
                      </div>
                      <span className="portal-status">
                        Registered this session
                      </span>
                    </div>
                  )}
                </section>
              </>
            )}
            {corporate && page === "Wash schedule" && (
              <section className="portal-panel">
                <div className="calendar-heading">
                  <div>
                    <div className="eyebrow">YOUR FLEET CARE CALENDAR</div>
                    <h3>October 2026</h3>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setDrawer("schedule")}
                  >
                    Set recurring wash <Icon name="plus" size={16} />
                  </button>
                </div>
                <div className="calendar-weekdays">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (d) => (
                      <span key={d}>{d}</span>
                    ),
                  )}
                </div>
                <div className="fleet-calendar">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - 2
                    return (
                      <button
                        key={i}
                        className={day === 10 ? "today" : ""}
                        disabled={day < 1 || day > 31}
                        onClick={() => setDrawer("schedule")}
                      >
                        <span>{day > 0 && day <= 31 ? day : ""}</span>
                        {[5, 12, 19, 26].includes(day) && (
                          <small>
                            <i />8 Signature washes
                          </small>
                        )}
                        {[8, 15, 22, 29].includes(day) && (
                          <small className="calendar-essential">
                            <i />4 Essential washes
                          </small>
                        )}
                      </button>
                    )
                  })}
                </div>
                <p className="policy-note">
                  <Icon name="shield" size={16} />
                  Operations assigns professionals to your schedule. Fleet
                  managers never assign staff.
                </p>
              </section>
            )}
            {corporate && page === "Active washes" && (
              <section className="portal-panel">
                {toolbar()}
                {jobTable(filteredJobs.filter((j) => j.status !== "Verified"))}
                <div className="delegated-reminder">
                  <Icon name="shield" size={24} />
                  <div>
                    <h3>The right person has the final say.</h3>
                    <p>
                      Named drivers confirm their own vehicles. You'll be
                      alerted only if a wash is not pleasing or untreated.
                    </p>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      setSelectedJob(jobs[4])
                      setDrawer("fleet-verdict")
                    }}
                  >
                    Preview confirmer verdict
                  </button>
                </div>
              </section>
            )}
            {corporate && page === "Wash records" && (
              <section className="portal-panel">
                {sectionHeading(
                  "Verified care. Ready for review.",
                  "Export records",
                  exportJobs,
                )}
                {fleet.slice(0, 5).map((j, i) => (
                  <div className="history-row" key={j.id}>
                    <span className="stat-icon">
                      <Icon name="shield" />
                    </span>
                    <div>
                      <h4>
                        {j.vehicle} · {j.service}
                      </h4>
                      <p>
                        {[6, 4, 3, 2, 1][i]} October · {j.staff} · Confirmed by{" "}
                        {i % 2 ? "Ngozi Eze" : "Musa Bello"}
                      </p>
                      <Plate>{j.plate}</Plate>
                    </div>
                    <div className="passport-proofs">
                      <span>
                        <Icon name="pin" size={13} />
                        GPS
                      </span>
                      <span>
                        <Icon name="car" size={13} />
                        Plate
                      </span>
                      <span>
                        <Icon name="check" size={13} />
                        Verdict
                      </span>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setSelectedJob(j)
                        setDrawer("record")
                      }}
                    >
                      Evidence pack <Icon name="arrow" size={15} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            {corporate && page === "Team & confirmers" && (
              <section className="portal-panel">
                {sectionHeading(
                  "The people behind your fleet.",
                  "Invite team member",
                  () => setDrawer("invite"),
                )}
                <div className="table-scroll">
                  <table className="portal-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>ROLE</th>
                        <th>ASSIGNED VEHICLE</th>
                        <th>ACCESS</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        [
                          "Ngozi Eze",
                          "Fleet manager",
                          "All company vehicles",
                          "Book, view & confirm",
                        ],
                        [
                          "Musa Bello",
                          "Driver / confirmer",
                          "Toyota Camry · KJA 715 FC",
                          "Verdict only",
                        ],
                        [
                          "Chinwe Obi",
                          "Driver / confirmer",
                          "Lexus RX350 · EKY 203 AJ",
                          "Verdict only",
                        ],
                        [
                          "Tunde Bakare",
                          "Company owner",
                          "All company vehicles",
                          "Account & billing",
                        ],
                      ].map(([name, r, car, access]) => (
                        <tr key={name}>
                          <td>
                            <strong>{name}</strong>
                            <small>Meridian Holdings</small>
                          </td>
                          <td>{r}</td>
                          <td>{car}</td>
                          <td>
                            <span className="portal-status">{access}</span>
                          </td>
                          <td>
                            <button
                              className="text-button"
                              onClick={() => {
                                setAssigned(name)
                                setDrawer("confirmer")
                              }}
                            >
                              Manage <Icon name="chevron" size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {corporate && page === "Plan & invoices" && (
              <>
                <section className="fleet-plan-panel">
                  <div>
                    <div className="eyebrow">YOUR CURRENT PLAN</div>
                    <h2>Signature Fleet · 6 months</h2>
                    <p>24 vehicles · Volume pricing · Prepaid term</p>
                    <span className="portal-status">
                      {suspendRenewal
                        ? "Renewal review requested"
                        : "Active through 31 December 2026"}
                    </span>
                  </div>
                  <div className="plan-balance">
                    <strong>
                      28 <small>/ 96</small>
                    </strong>
                    <span>washes remaining</span>
                  </div>
                  <button
                    className="secondary"
                    onClick={() => setDrawer("fleet-plan")}
                  >
                    Manage plan <Icon name="arrow" size={16} />
                  </button>
                </section>
                <section className="portal-panel">
                  {sectionHeading("One clear invoice.")}
                  <div className="table-scroll">
                    <table className="portal-table">
                      <thead>
                        <tr>
                          <th>INVOICE</th>
                          <th>PERIOD</th>
                          <th>AMOUNT</th>
                          <th>STATUS</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ["GW-INV-024", "October 2026", "₦240,000", "Pending"],
                          ["GW-INV-023", "September 2026", "₦240,000", "Paid"],
                          ["GW-INV-022", "August 2026", "₦240,000", "Paid"],
                        ].map(([id, month, amount, status]) => (
                          <tr key={id}>
                            <td>
                              <strong>{id}</strong>
                              <small>Meridian Holdings</small>
                            </td>
                            <td>{month}</td>
                            <td>
                              <strong>{amount}</strong>
                            </td>
                            <td>
                              <span className="portal-status">{status}</span>
                            </td>
                            <td>
                              <button
                                className="text-button"
                                onClick={() => {
                                  setAssigned(id)
                                  setDrawer("invoice")
                                }}
                              >
                                {status === "Pending"
                                  ? "View & pay"
                                  : "View invoice"}
                                <Icon name="arrow" size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </>
            )}
            {estate && page === "Estate overview" && (
              <>
                {metrics([
                  {
                    label: "Today's estate washes",
                    value: "18",
                    note: "12 verified · 6 in progress",
                    icon: "car",
                  },
                  {
                    label: "Professionals on site",
                    value: "03",
                    note: "Named, screened & assigned",
                    icon: "shield",
                  },
                  {
                    label: "Next wash window",
                    value: "Mon 12",
                    note: "8:00 – 11:00 AM",
                    icon: "clock",
                  },
                  {
                    label: "Open incidents",
                    value: incident ? "01" : "00",
                    note: "A calm, accountable community",
                    icon: "pin",
                  },
                ])}
                <section className="estate-hero">
                  <div>
                    <div className="eyebrow">
                      PARKVIEW ESTATE · WASH MORNINGS
                    </div>
                    <h2>
                      A fresher way to
                      <br />
                      start the neighbourhood.
                    </h2>
                    <p>
                      Next window: Monday, 12 October · 8:00–11:00 AM
                      <br />
                      Approved location: Residents' outdoor car park.
                    </p>
                    <button
                      className="primary"
                      onClick={() => changePage("Resident access")}
                    >
                      Share your estate booking link{" "}
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  <div className="estate-window-art">
                    <Icon name="pin" size={72} />
                    <span className="estate-art-ring" />
                    <span className="estate-art-label">
                      PARKVIEW ESTATE<small>APPROVED OUTDOOR CARE</small>
                    </span>
                  </div>
                </section>
                <section className="portal-panel">
                  {sectionHeading(
                    "Know who's inside. And why.",
                    "View on-site team",
                    () => changePage("On-site team"),
                  )}
                  {staffCards(true)}
                </section>
                <section className="portal-panel">
                  {sectionHeading("Today's estate run")}
                  <div className="estate-run-progress">
                    <div>
                      <strong>
                        12 <span>/ 18 completed</span>
                      </strong>
                      <small>Every completed job has all three proofs.</small>
                    </div>
                    <div className="estate-progress-track">
                      <span />
                    </div>
                    <span className="portal-status">Morning window</span>
                  </div>
                </section>
              </>
            )}
            {estate && page === "Wash windows" && (
              <>
                <div className="settings-grid">
                  <section className="portal-panel">
                    <div className="eyebrow">YOUR AGREED SCHEDULE</div>
                    <h3>{windowText}</h3>
                    <div className="window-time">
                      <Icon name="clock" size={28} />
                      <span>
                        8:00 – 11:00 AM
                        <small>Morning wash window · 24 bookings maximum</small>
                      </span>
                    </div>
                    <p className="panel-description">
                      All resident bookings are grouped into one estate run.
                      Operations assigns and approves the team.
                    </p>
                    <button
                      className="secondary full"
                      onClick={() => setDrawer("window")}
                    >
                      Request a window change <Icon name="arrow" size={16} />
                    </button>
                  </section>
                  <section className="portal-panel">
                    <div className="eyebrow">APPROVED OUTDOOR LOCATIONS</div>
                    <h3>Residents' car park</h3>
                    <div className="location-diagram">
                      <Icon name="pin" size={38} />
                      <span>Parkview Estate · Ikoyi</span>
                      <small>Outdoor zone · Geofence radius 250m</small>
                    </div>
                    <p className="panel-description">
                      Gate access via the east entrance. No washing in private
                      indoor garages or shared pedestrian paths.
                    </p>
                    <button
                      className="secondary full"
                      onClick={() => setDrawer("estate-guidelines")}
                    >
                      View access guidelines <Icon name="arrow" size={16} />
                    </button>
                  </section>
                </div>
              </>
            )}
            {estate && page === "On-site team" && (
              <>
                <div className="live-banner">
                  <span className="live-dot" /> Approved staff on site today
                  <span>10 October · Morning estate run</span>
                </div>
                {staffCards(true)}
                <section className="portal-panel">
                  {sectionHeading("Estate jobs, without resident private data")}
                  <div className="history-row">
                    <Icon name="car" />
                    <div>
                      <h4>David Akin · 6 assigned washes</h4>
                      <p>Residents' car park · 4 complete, 2 in progress</p>
                    </div>
                    <span className="portal-status">On site</span>
                  </div>
                  <div className="history-row">
                    <Icon name="car" />
                    <div>
                      <h4>Ibrahim Musa · 6 assigned washes</h4>
                      <p>Residents' car park · 5 complete, 1 ready</p>
                    </div>
                    <span className="portal-status">On site</span>
                  </div>
                  <p className="policy-note">
                    <Icon name="shield" size={15} />
                    Resident payment details and individual vehicle histories
                    are not available to estate managers.
                  </p>
                </section>
              </>
            )}
            {estate && page === "Resident access" && (
              <section className="resident-access-panel portal-panel">
                <div className="eyebrow">BRING THE SHINE TO YOUR COMMUNITY</div>
                <h2>One link. A fresher estate.</h2>
                <p>
                  Residents book into your approved wash windows and pay for
                  their own care at estate pricing.
                </p>
                <div className="resident-link-box">
                  <Icon name="pin" size={30} />
                  <div>
                    <strong>Parkview Estate</strong>
                    <small>
                      go-wash.ng/e/parkview · Illustrative booking URL
                    </small>
                  </div>
                  <button
                    className="primary"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}${window.location.pathname}#auth/register`,
                      )
                      notify(
                        "Prototype registration link copied. Estate tagging requires backend integration.",
                      )
                    }}
                  >
                    Copy demo link <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="announcement-pack">
                  <h3>Your resident announcement pack</h3>
                  <p>
                    Share the next window, approved locations and resident
                    prices.
                  </p>
                  <div className="announcement-message">
                    Good morning, Parkview! Go-Wash will be at the residents'
                    outdoor car park on {windowText}, 8:00–11:00 AM. Book your
                    vehicle's care in advance. Screened staff. Every wash
                    verified. Outdoor service only.
                  </div>
                  <button
                    className="secondary"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `Go-Wash at Parkview Estate: ${windowText}, 8:00–11:00 AM. Approved residents' outdoor car park. Book ahead. Every wash verified.`,
                      )
                      notify("Resident announcement copied.")
                    }}
                  >
                    Copy announcement <Icon name="arrow" size={16} />
                  </button>
                  <button
                    className="secondary"
                    onClick={() =>
                      download(
                        "parkview-price-list",
                        "Service,Sedan price\nEssential Wash,5000\nSignature Wash,8500\nPremium Detail,18000",
                      )
                    }
                  >
                    Download price list <Icon name="arrow" size={16} />
                  </button>
                </div>
                <p className="policy-note">
                  A live booking link and scannable QR are generated after the
                  estate account is approved. This demo does not display a fake
                  QR.
                </p>
              </section>
            )}
            {(((operations || corporate) && page === "Reports") ||
              (estate && page === "Monthly report")) && (
              <>
                {metrics([
                  {
                    label: estate
                      ? "Estate washes this month"
                      : "Washes this month",
                    value: estate ? "142" : corporate ? "68" : "328",
                    note: "Across the selected account",
                    icon: "car",
                  },
                  {
                    label: "Treated & satisfied",
                    value: "96.8%",
                    note: "Customer-confirmed outcomes",
                    icon: "shield",
                  },
                  {
                    label: "Arrived in window",
                    value: "92%",
                    note: "Inside booked time slots",
                    icon: "clock",
                  },
                  {
                    label: estate ? "Incidents reviewed" : "Repeat bookings",
                    value: estate ? "02" : "42%",
                    note: estate
                      ? "Reviewed by operations"
                      : "Customer confidence, returning",
                    icon: "drop",
                  },
                ])}
                <section className="portal-panel">
                  <div className="section-heading">
                    <h3>October 2026 · Your care in perspective</h3>
                    <button
                      className="secondary"
                      onClick={() =>
                        download(
                          "monthly-report",
                          `Metric,Value\nWashes,${
                            estate ? 142 : corporate ? 68 : 328
                          }\nSatisfied verdicts,96.8%\nPunctual arrival,92%\nIncidents reviewed,2`,
                        )
                      }
                    >
                      Export report
                      <Icon name="arrow" size={16} />
                    </button>
                  </div>
                  <div className="report-chart">
                    {[46, 64, 57, 82, 73, 94, 86, 65, 80, 90].map((h, i) => (
                      <div key={i}>
                        <span style={{ height: `${h}%` }} />
                        <small>{i + 1} Oct</small>
                      </div>
                    ))}
                  </div>
                  <div className="report-breakdown">
                    {[
                      ["Treated and satisfied", "96.8%"],
                      ["Treated and not pleased", "2.4%"],
                      ["Untreated", "0.8%"],
                    ].map(([title, val], i) => (
                      <div key={title}>
                        <span className={`verdict-dot dot-${i}`} />
                        <strong>{title}</strong>
                        <span>{val}</span>
                      </div>
                    ))}
                  </div>
                  <p className="policy-note">
                    Sample reporting data. Estate reports exclude residents'
                    payment information and private vehicle histories.
                  </p>
                </section>
              </>
            )}
            {((corporate && page === "Account settings") ||
              (estate && page === "Estate settings")) && (
              <section className="portal-panel organisation-settings">
                <div className="eyebrow">
                  YOUR ORGANISATION, BEAUTIFULLY CONNECTED
                </div>
                <h3>Account details</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    notify("Demo account preferences saved.")
                  }}
                >
                  <label>
                    Organisation name
                    <input required defaultValue={person.company} />
                  </label>
                  <div className="form-grid">
                    <label>
                      Account representative
                      <input required defaultValue={person.name} />
                    </label>
                    <label>
                      Contact email
                      <input
                        type="email"
                        required
                        defaultValue={
                          corporate
                            ? "ngozi@meridian.example"
                            : "manager@parkview.example"
                        }
                      />
                    </label>
                  </div>
                  <label>
                    Outdoor service location
                    <input
                      required
                      defaultValue={
                        corporate
                          ? "Meridian office car park, Victoria Island"
                          : "Parkview residents' car park, Ikoyi"
                      }
                    />
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked />
                    {corporate
                      ? "Email me only for not-pleased or untreated verdicts"
                      : "Notify me of on-site access and incident updates"}
                  </label>
                  <button className="primary">
                    Save preferences <Icon name="check" size={16} />
                  </button>
                </form>
                <div className="policy-locked">
                  <Icon name="shield" size={20} />
                  <span>
                    {corporate
                      ? "Your company data is visible only to authorised company users. Confirmer access is limited to their assigned vehicles."
                      : "You can view staff access and estate summaries, not resident payment details or individual care histories."}
                  </span>
                </div>
              </section>
            )}
            <footer>
              <span>
                go-wash <b>·</b>Your vehicle. Our responsibility.
              </span>
              <span>
                <Icon name="shield" size={13} /> Role-based prototype <b>·</b>No
                live payments or GPS
              </span>
            </footer>
          </PageTransition>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
        </div>
      )}
      {drawer && (
        <div
          className="portal-drawer-backdrop"
          onClick={() => {
            setDrawer(null)
            setReason("")
          }}
        >
          <section
            className="portal-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace details"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close details"
              onClick={() => {
                setDrawer(null)
                setReason("")
              }}
            >
              <Icon name="close" />
            </button>
            <div className="eyebrow">
              {operations
                ? "OPERATIONS · ACCOUNTABLE BY DESIGN"
                : "YOUR GO-WASH WORKSPACE"}
            </div>
            {drawer === "support-case" && (
              <>
                <h2>A thoughtful next step.</h2>
                <p>
                  {assigned.includes("CARE-")
                    ? assigned
                    : "Create a customer care ticket"}
                  <br />
                  Record your response or route the concern to operations or
                  finance.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const action = String(
                      new FormData(e.currentTarget).get("action"),
                    )
                    log(`Customer care: ${action} · ${reason}`)
                    setDrawer(null)
                    setReason("")
                    notify(
                      "Demo care response recorded. Any release or refund still requires an authorised decision.",
                    )
                  }}
                >
                  <label>
                    Customer or booking reference
                    <input
                      required
                      defaultValue={assigned.includes("CARE-") ? assigned : ""}
                      placeholder="Customer name or GW job ID"
                    />
                  </label>
                  <label>
                    Next action
                    <select name="action">
                      <option>Send customer response</option>
                      <option>Request booking reschedule</option>
                      <option>Escalate evidence review to operations</option>
                      <option>Request refund review from finance</option>
                    </select>
                  </label>
                  <label>
                    Response & internal note
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Give the customer a clear, considerate next step."
                    />
                  </label>
                  <button className="primary full">
                    Save demo care response <Icon name="arrow" size={17} />
                  </button>
                </form>
                <div className="policy-locked">
                  <Icon name="shield" size={20} />
                  <span>
                    Refunds and job releases cannot be performed from this
                    support workspace.
                  </span>
                </div>
              </>
            )}
            {drawer === "job" && (
              <>
                <h2>{selectedJob.service}</h2>
                <div className="drawer-job-header">
                  <CarArt
                    silver={selectedJob.vehicle !== "Mercedes-Benz C300"}
                  />
                  <h3>{selectedJob.vehicle}</h3>
                  <Plate>{selectedJob.plate}</Plate>
                  <p>
                    {selectedJob.id} · {selectedJob.area} · {selectedJob.time}
                  </p>
                  <span className="portal-status">{selectedJob.status}</span>
                </div>
                <h3>Every step, accounted for.</h3>
                <div className="job-event-timeline">
                  {[
                    "Booking paid & confirmed",
                    "Professional assigned",
                    "Accepted · GPS tracking starts",
                    "Arrival · Geofence & plate match",
                    "Wash ready · Customer verdict",
                    "Final plate scan & clock-out",
                  ].map((text, i) => (
                    <div key={text}>
                      <span className={i < 3 ? "event-complete" : ""}>
                        {i < 3 ? <Icon name="check" size={12} /> : i + 1}
                      </span>
                      <p>
                        {text}
                        <small>
                          {i < 3
                            ? "Recorded in demo timeline"
                            : "Awaiting next step"}
                        </small>
                      </p>
                    </div>
                  ))}
                </div>
                {dispatcher && selectedJob.staff === "Unassigned" && (
                  <button
                    className="primary full"
                    onClick={() => setDrawer("assign")}
                  >
                    Assign professional <Icon name="arrow" size={17} />
                  </button>
                )}
                {role === "Support" && (
                  <button
                    className="primary full"
                    onClick={() => setDrawer("support-case")}
                  >
                    Respond, reschedule or escalate{" "}
                    <Icon name="arrow" size={17} />
                  </button>
                )}
                {corporate && selectedJob.status === "Ready" && (
                  <button
                    className="primary full"
                    onClick={() => setDrawer("fleet-verdict")}
                  >
                    Give TREATED verdict <Icon name="arrow" size={17} />
                  </button>
                )}
                <h3 className="drawer-subheading">Evidence pack</h3>
                {evidence}
                <p className="policy-note">
                  Sample timeline and evidence placeholders. Actual GPS, scans
                  and photos require the backend.
                </p>
              </>
            )}
            {drawer === "assign" && (
              <>
                <h2>A good match for every job.</h2>
                <p>
                  {selectedJob.id} · {selectedJob.service}
                  <br />
                  {selectedJob.area} · {selectedJob.time}
                </p>
                <div className="ranking-note">
                  <Icon name="pin" size={17} />
                  Ranked by availability, capabilities and proximity.
                </div>
                <div className="suggested-staff">
                  {["Ibrahim Musa", "David Akin", "Emeka Okafor"].map(
                    (name, i) => (
                      <button
                        className={assigned === name ? "selected" : ""}
                        onClick={() => setAssigned(name)}
                        key={name}
                      >
                        <span className="team-avatar">
                          {name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <span>
                          <strong>{name}</strong>
                          <small>
                            {i === 0
                              ? "Available · 1.2km · All services"
                              : i === 1
                                ? "Available at 11:00 · Same estate"
                                : "On assigned job · Available at 12:00"}
                          </small>
                        </span>
                        {assigned === name && <Icon name="check" size={17} />}
                      </button>
                    ),
                  )}
                </div>
                <button
                  className="primary full"
                  onClick={() => {
                    setJobs((prev) =>
                      prev.map((j) =>
                        j.id === selectedJob.id
                          ? { ...j, staff: assigned, status: "Assigned" }
                          : j,
                      ),
                    )
                    log(`Assigned ${selectedJob.id} to ${assigned}`)
                    setDrawer(null)
                    notify("Assignment saved to demo dispatch and audit trail.")
                  }}
                >
                  Confirm assignment <Icon name="check" size={17} />
                </button>
              </>
            )}
            {["release", "mismatch", "complaint"].includes(drawer) && (
              <>
                <h2>
                  {drawer === "release"
                    ? "Review before you release."
                    : drawer === "mismatch"
                      ? "The plate must match."
                      : "Give the concern a fair review."}
                </h2>
                <p>
                  {selectedJob.id} · {selectedJob.vehicle}
                  <br />
                  Review the complete evidence before taking action.
                </p>
                {evidence}
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const decision = String(
                      new FormData(e.currentTarget).get("decision"),
                    )
                    log(`${decision} · ${selectedJob.id}: ${reason}`)
                    if (decision === "Continue waiting for customer") {
                      setDrawer(null)
                      setReason("")
                      notify(
                        "Waiting continued. The job remains open and submission stays locked.",
                      )
                      return
                    }
                    setResolvedCases((prev) => [
                      ...new Set([...prev, selectedJob.id]),
                    ])
                    setJobs((prev) =>
                      prev.map((j) =>
                        j.id === selectedJob.id
                          ? {
                              ...j,
                              status:
                                drawer === "release"
                                  ? "Closed, unconfirmed"
                                  : "Review decided",
                            }
                          : j,
                      ),
                    )
                    setDrawer(null)
                    setReason("")
                    notify("Demo decision recorded with your reason.")
                  }}
                >
                  <label>
                    Decision
                    <select name="decision">
                      {(drawer === "release"
                        ? [
                            "Release as closed, unconfirmed",
                            "Continue waiting for customer",
                          ]
                        : drawer === "mismatch"
                          ? [
                              "Contact customer for plate correction review",
                              "Vehicle not present · Re-dispatch",
                            ]
                          : [
                              "Offer a re-wash",
                              "Issue customer credit",
                              "No action after evidence review",
                            ]
                      ).map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mandatory decision reason
                    <textarea
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Explain the evidence and your decision."
                    />
                  </label>
                  <p className="policy-note">
                    {drawer === "release"
                      ? "On release, tracking stops and the customer keeps 24 hours to file a verdict. This is not a fully verified close."
                      : "Your identity, decision and reason are appended to the audit trail."}
                  </p>
                  <button className="primary full">
                    Record demo decision <Icon name="shield" size={17} />
                  </button>
                </form>
              </>
            )}
            {drawer === "staff" && (
              <>
                <h2>{assigned}</h2>
                <p>Professional screening & registered device</p>
                {[
                  "Valid identification",
                  "Guarantor",
                  "Guarantor documentation",
                  "Background verification",
                  "Written undertaking",
                  "Employment documentation",
                ].map((doc, i) => (
                  <div className="screening-document" key={doc}>
                    <Icon name="shield" size={18} />
                    <span>{doc}</span>
                    <span className="portal-status">
                      {assigned === "Chidi Nwosu" && i > 3 && !staffApproved
                        ? "Submitted"
                        : "Verified"}
                    </span>
                  </div>
                ))}
                <div className="policy-locked">
                  <Icon name="shield" size={20} />
                  <span>
                    {assigned === "Chidi Nwosu" && !staffApproved
                      ? "Activation blocked: 2 records require verification."
                      : "Screening complete. Registered device approved."}
                  </span>
                </div>
                {admin && assigned === "Chidi Nwosu" && !staffApproved && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setStaffApproved(true)
                      log(
                        `Verified remaining screening records for ${assigned}: ${reason}`,
                      )
                      notify("Demo screening verified. Activation eligible.")
                    }}
                  >
                    <label>
                      Verification review reason
                      <textarea
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                    <button className="primary full">
                      Verify remaining demo records{" "}
                      <Icon name="check" size={17} />
                    </button>
                  </form>
                )}
              </>
            )}
            {[
              "create",
              "schedule",
              "window",
              "fleet-vehicle",
              "invite",
              "incident",
              "device",
              "decline",
              "release-request",
              "support",
              "approve-org",
              "customer",
            ].includes(drawer) && (
              <>
                <h2>
                  {
                    {
                      create: "A new booking. A clear plan.",
                      schedule: "Put good care on the calendar.",
                      window: "Better mornings, by agreement.",
                      "fleet-vehicle": "Add another vehicle to your care.",
                      invite: "The right people. The right access.",
                      incident: "Tell us what happened.",
                      device: "Request a registered device change.",
                      decline: "A clear reason helps us reassign.",
                      "release-request": "Ask operations for a release.",
                      support: "Your dispatcher is here to help.",
                      "approve-org": "Review this account application.",
                      customer: "Customer account details.",
                    }[drawer]
                  }
                </h2>
                <p>
                  {drawer === "release-request"
                    ? "In production this is available only 15 minutes after Ready. Staff cannot release themselves; operations decides."
                    : drawer === "window"
                      ? "Estate schedule changes require operations agreement before becoming active."
                      : "Complete the details below. This action stays in the prototype session."}
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const form = new FormData(e.currentTarget)
                    if (drawer === "fleet-vehicle") {
                      setExtraVehicle(String(form.get("vehicle")))
                      setExtraPlate(String(form.get("plate")))
                    }
                    if (drawer === "incident") setIncident(true)
                    if (drawer === "window")
                      setWindowText(String(form.get("days")))
                    if (drawer === "create") {
                      setJobs((prev) => [
                        ...prev,
                        {
                          id: `GW-${1060 + prev.length}`,
                          vehicle: String(form.get("vehicle")),
                          plate: String(form.get("plate")),
                          area: String(form.get("area")),
                          time: "2:00 PM",
                          service: "Signature Wash",
                          staff: "Unassigned",
                          status: "Booked",
                        },
                      ])
                    }
                    log(`Submitted ${drawer} demo form`)
                    setDrawer(null)
                    notify(
                      drawer === "window"
                        ? "Window change requested. Prototype displays your proposed schedule; production needs approval."
                        : drawer === "decline"
                          ? "Demo decline sent to dispatch. Your next assignment will come from operations."
                          : "Demo request saved for review. No live message or charge was made.",
                    )
                  }}
                >
                  {["create", "fleet-vehicle"].includes(drawer) && (
                    <>
                      <label>
                        Vehicle make & model
                        <input
                          name="vehicle"
                          required
                          placeholder="e.g. Toyota Camry"
                        />
                      </label>
                      <label>
                        Number plate
                        <input
                          name="plate"
                          required
                          placeholder="e.g. KJA 715 FC"
                        />
                      </label>
                    </>
                  )}
                  {["create", "schedule"].includes(drawer) && (
                    <>
                      <label>
                        Outdoor location
                        <input
                          name="area"
                          required
                          defaultValue={
                            corporate ? "Meridian office car park" : ""
                          }
                          placeholder="Approved outdoor wash location"
                        />
                      </label>
                      <div className="form-grid">
                        <label>
                          Date
                          <input
                            type="date"
                            required
                            defaultValue="2026-10-12"
                            min="2026-10-10"
                          />
                        </label>
                        <label>
                          Time
                          <select>
                            <option>8:00–10:00 AM</option>
                            <option>10:00 AM–12:00 PM</option>
                            <option>2:00–4:00 PM</option>
                          </select>
                        </label>
                      </div>
                      <label>
                        {corporate ? "Vehicles to include" : "Service"}
                        <select>
                          {(corporate
                            ? [
                                "All fleet vehicles",
                                "8 executive vehicles",
                                "4 pool vehicles",
                              ]
                            : [
                                "Signature Wash",
                                "Essential Wash",
                                "Premium Detail",
                              ]
                          ).map((v) => (
                            <option key={v}>{v}</option>
                          ))}
                        </select>
                      </label>
                      {drawer === "schedule" && (
                        <label>
                          Repeat
                          <select>
                            <option>Every Monday</option>
                            <option>Every Wednesday</option>
                            <option>One-time wash</option>
                          </select>
                        </label>
                      )}
                    </>
                  )}
                  {drawer === "fleet-vehicle" && (
                    <>
                      <label>
                        Vehicle colour
                        <input required placeholder="Silver" />
                      </label>
                      <label>
                        Named confirmer
                        <input
                          required
                          placeholder="Driver or company representative"
                        />
                      </label>
                    </>
                  )}
                  {drawer === "window" && (
                    <>
                      <label>
                        Requested days
                        <select name="days">
                          <option>Monday, Wednesday & Friday</option>
                          <option>Tuesday & Thursday</option>
                          <option>Saturday mornings</option>
                        </select>
                      </label>
                      <label>
                        Approved outdoor location
                        <input required defaultValue="Residents' car park" />
                      </label>
                      <label>
                        Reason for change
                        <textarea required />
                      </label>
                    </>
                  )}
                  {drawer === "invite" && (
                    <>
                      <label>
                        Full name
                        <input required />
                      </label>
                      <label>
                        Work email
                        <input type="email" required />
                      </label>
                      <label>
                        Access role
                        <select>
                          {(admin
                            ? ["Dispatcher", "Finance", "Support"]
                            : ["Fleet manager", "Confirmer", "Company owner"]
                          ).map((r) => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      </label>
                    </>
                  )}
                  {drawer === "customer" && (
                    <>
                      <label>
                        Customer name
                        <input
                          required
                          defaultValue={
                            assigned === "Ibrahim Musa" ? "" : assigned
                          }
                        />
                      </label>
                      <label>
                        Phone
                        <input type="tel" required placeholder="+234" />
                      </label>
                      <label>
                        Account type
                        <select>
                          <option>Personal</option>
                          <option>Corporate</option>
                          <option>Estate resident</option>
                        </select>
                      </label>
                    </>
                  )}
                  {drawer === "incident" && (
                    <>
                      <label>
                        Incident type
                        <select>
                          <option>Access denied</option>
                          <option>Vehicle not present</option>
                          <option>Unsafe site</option>
                          <option>Weather conditions</option>
                          <option>Staff conduct</option>
                          <option>Damage concern</option>
                        </select>
                      </label>
                      <label>
                        What happened?
                        <textarea
                          required
                          placeholder="Describe the location and concern."
                        />
                      </label>
                    </>
                  )}
                  {["device", "decline", "release-request", "support"].includes(
                    drawer,
                  ) && (
                    <label>
                      {drawer === "device"
                        ? "New device details & reason"
                        : drawer === "release-request"
                          ? "Contact attempts & reason"
                          : "Your reason or message"}
                      <textarea required />
                    </label>
                  )}
                  {drawer === "approve-org" && (
                    <>
                      <label>
                        Approved plan
                        <select>
                          <option>3 months</option>
                          <option>6 months</option>
                          <option>12 months</option>
                        </select>
                      </label>
                      <label>
                        Review note
                        <textarea required />
                      </label>
                    </>
                  )}
                  <button className="primary full">
                    {drawer === "fleet-vehicle"
                      ? "Register demo vehicle"
                      : drawer === "create"
                        ? "Create demo booking"
                        : "Submit demo request"}
                    <Icon name="arrow" size={17} />
                  </button>
                  <p className="policy-note">
                    No production backend is connected. Sensitive details and
                    files are not transmitted.
                  </p>
                </form>
              </>
            )}
            {drawer === "fleet-verdict" && (
              <>
                <h2>Your vehicle. Your final say.</h2>
                <p>
                  {selectedJob.vehicle} · <Plate>{selectedJob.plate}</Plate>
                  <br />
                  Confirming as Ngozi Eze, authorised fleet manager.
                </p>
                <div className="reveal-art">
                  <CarArt silver />
                  <span>
                    Illustration · Actual job photos require a connected backend
                  </span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const outcome = String(
                      new FormData(e.currentTarget).get("outcome"),
                    )
                    log(
                      `Verdict by Ngozi Eze: ${outcome} for ${selectedJob.id}`,
                    )
                    setJobs((prev) =>
                      prev.map((j) =>
                        j.id === selectedJob.id
                          ? {
                              ...j,
                              status:
                                outcome === "Untreated"
                                  ? "Disputed"
                                  : "Verdict given",
                            }
                          : j,
                      ),
                    )
                    setDrawer(null)
                    notify(
                      outcome === "Untreated"
                        ? "Demo job disputed. Final submission is blocked."
                        : "Demo verdict recorded. Final plate scan is unlocked, not yet verified.",
                    )
                  }}
                >
                  <label>
                    TREATED verdict
                    <select
                      required
                      name="outcome"
                      value={customerVerdict}
                      onChange={(e) => setCustomerVerdict(e.target.value)}
                    >
                      <option value="">Choose an outcome</option>
                      <option>Treated and satisfied</option>
                      <option>Treated and not pleased</option>
                      <option>Untreated</option>
                    </select>
                  </label>
                  <label>
                    Remark{" "}
                    {customerVerdict !== "Treated and satisfied"
                      ? "(required)"
                      : "(optional)"}
                    <textarea
                      required={customerVerdict !== "Treated and satisfied"}
                    />
                  </label>
                  <button className="primary full">
                    Record verdict <Icon name="check" size={17} />
                  </button>
                </form>
              </>
            )}
            {drawer === "record" && (
              <>
                <h2>A verified care record.</h2>
                <div className="drawer-job-header">
                  <h3>{selectedJob.vehicle}</h3>
                  <Plate>{selectedJob.plate}</Plate>
                  <p>
                    {selectedJob.service} · 6 October 2026
                    <br />
                    Confirmed by Musa Bello
                  </p>
                  <span className="portal-status">Closed · Verified</span>
                </div>
                <div className="evidence-grid">
                  {[
                    "GPS trail verified",
                    "Arrival plate matched",
                    "Before / after recorded",
                    "Treated and satisfied",
                    "Final plate matched",
                    "Payment reconciled",
                  ].map((text) => (
                    <div key={text}>
                      <Icon name="shield" size={19} />
                      <strong>{text}</strong>
                      <small>Sample evidence entry</small>
                    </div>
                  ))}
                </div>
                <p className="policy-note">
                  Private evidence is served through expiring links in
                  production.
                </p>
              </>
            )}
            {["payment", "invoice", "fleet-plan"].includes(drawer) && (
              <>
                <h2>
                  {drawer === "fleet-plan"
                    ? "Care that fits your fleet."
                    : "One clear account of your care."}
                </h2>
                <div className="review-summary">
                  <h3>
                    {drawer === "fleet-plan"
                      ? "Signature Fleet Plan"
                      : assigned}
                  </h3>
                  <p>Meridian Holdings · 24 vehicles</p>
                  <hr />
                  <div>
                    <span>
                      {drawer === "fleet-plan"
                        ? "Prepaid term"
                        : "Invoice total"}
                    </span>
                    <strong>
                      {drawer === "fleet-plan" ? "6 months" : "₦240,000"}
                    </strong>
                  </div>
                  <div>
                    <span>Payment method</span>
                    <strong>Card / bank transfer</strong>
                  </div>
                  <div>
                    <span>Status</span>
                    <strong>
                      {drawer === "fleet-plan"
                        ? "Active through December"
                        : "Sample invoice"}
                    </strong>
                  </div>
                </div>
                {drawer === "fleet-plan" ? (
                  <>
                    <label>
                      Next term preference
                      <select>
                        <option>6 months</option>
                        <option>3 months</option>
                        <option>12 months</option>
                      </select>
                    </label>
                    <button
                      className="primary full"
                      onClick={() => {
                        setSuspendRenewal(true)
                        setDrawer(null)
                        notify(
                          "Demo plan review requested. Current term is unchanged.",
                        )
                      }}
                    >
                      Request plan review <Icon name="arrow" size={17} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="primary full"
                      onClick={() =>
                        notify(
                          "Demo checkout only. No real payment has been taken.",
                        )
                      }
                    >
                      Preview payment <Icon name="card" size={17} />
                    </button>
                    <button
                      className="secondary full"
                      onClick={() =>
                        download(
                          "invoice",
                          "Description,Amount\nFleet wash care,240000\nTotal,240000",
                        )
                      }
                    >
                      Download sample invoice
                    </button>
                    {finance && (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          log(`Payment adjustment ${assigned}: ${reason}`)
                          setDrawer(null)
                          notify("Demo payment adjustment recorded.")
                        }}
                      >
                        <label>
                          Refund / credit reason
                          <textarea
                            required
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </label>
                        <button className="secondary full">
                          Record demo credit review
                        </button>
                      </form>
                    )}
                  </>
                )}
                <p className="policy-note">
                  Gateway integration, reconciliation and refunds must be
                  enforced by the backend.
                </p>
              </>
            )}
            {[
              "onsite",
              "organisation",
              "estate-guidelines",
              "assigned-preview",
              "confirmer",
            ].includes(drawer) && (
              <>
                <h2>
                  {drawer === "onsite"
                    ? assigned
                    : drawer === "confirmer"
                      ? `Access for ${assigned}`
                      : drawer === "assigned-preview"
                        ? "A clear assignment. A protected address."
                        : drawer === "estate-guidelines"
                          ? "Care that respects your community."
                          : assigned}
                </h2>
                <div className="policy-locked">
                  <Icon name="shield" size={27} />
                  <span>
                    {drawer === "onsite"
                      ? "Named professional · Screened · Approved estate run. 6 assigned jobs at the residents' outdoor car park."
                      : drawer === "confirmer"
                        ? "Confirmer access is limited to verdicts for named vehicles. They cannot book, pay or see invoices."
                        : drawer === "assigned-preview"
                          ? "Signature Wash · Victoria Island · 12:00 PM. The full address stays hidden until this job is accepted. Finish the active assignment first."
                          : drawer === "estate-guidelines"
                            ? "Use east gate. Show the verified Trust Card. Work only in the residents' outdoor car park. Keep pedestrian access clear. Report safety concerns to operations."
                            : "Approved account. Named representatives. Agreed outdoor locations and a verified history for every job."}
                  </span>
                </div>
                {drawer === "confirmer" && (
                  <button
                    className="primary full"
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        `${window.location.origin}${window.location.pathname}#confirm`,
                      )
                      notify(
                        "Demo verdict link copied. Production links must be signed and single-use.",
                      )
                    }}
                  >
                    Copy sample verdict link <Icon name="arrow" size={16} />
                  </button>
                )}
                <button
                  className="secondary full"
                  onClick={() => setDrawer(null)}
                >
                  Back to workspace
                </button>
              </>
            )}
            {drawer === "profile" && (
              <>
                <h2>{person.name}</h2>
                <p>
                  {person.company} · {role}
                </p>
                <div className="policy-locked">
                  <Icon name="shield" size={25} />
                  <span>
                    {operations
                      ? role +
                        " · Role-limited demo access. Two-step authentication is required in production."
                      : washer
                        ? "Field professional · Assigned work only. Registered device approved."
                        : "Your organisation's data only. Operations retains assignment and exception controls."}
                  </span>
                </div>
                <button className="secondary full" onClick={onHome}>
                  Return to website <Icon name="logout" size={17} />
                </button>
              </>
            )}
            {drawer === "notifications" && (
              <>
                <h2>A little heads-up.</h2>
                {(operations
                  ? [
                      [
                        "1 booking needs assignment",
                        "Review GW-1049 and the ranked available professionals.",
                      ],
                      [
                        "3 jobs need a decision",
                        "Review timeout, plate mismatch and quality evidence.",
                      ],
                    ]
                  : washer
                    ? [
                        [
                          "Your next job is assigned",
                          "Signature Wash · Lekki Phase 1 · 10:00 AM",
                        ],
                        [
                          "Professional screening complete",
                          "Your registered device and six records are approved.",
                        ],
                      ]
                    : corporate
                      ? [
                          [
                            "8 vehicles scheduled for Monday",
                            "Your fleet care window starts at 8:00 AM.",
                          ],
                          [
                            "GW-1052 is ready for a verdict",
                            "The named confirmer has been notified.",
                          ],
                        ]
                      : [
                          [
                            "Your morning team is on site",
                            "Named, screened staff are in the approved wash area.",
                          ],
                          [
                            "Next window: Monday 12 October",
                            "Share the resident announcement in advance.",
                          ],
                        ]
                ).map(([title, text]) => (
                  <div className="notification-item" key={title}>
                    <Icon name="bell" size={19} />
                    <div>
                      <h4>{title}</h4>
                      <p>{text}</p>
                      <small>Sample workspace update</small>
                    </div>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
