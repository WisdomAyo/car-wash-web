"use client"

import { PageTransition } from "@/components/Motion"
import { useCallback, useEffect, useState } from "react"
import useDismissiblePanel from "@/hooks/useDismissiblePanel"
import Brand from "@/components/Brand"
import ButtonLink from "@/components/ui/ButtonLink"
import SidebarControls from "@/components/SidebarControls"
import { CarArt, Icon, Plate } from "@/components/Visuals"
import type { PartnerRole } from "@/lib/roles"

import {
  initialJobs,
  staffList,
  menus,
  menuIcon,
  people,
  type Job,
} from "./portalConfig"

export default function PartnerPortal({ role }: { role: PartnerRole }) {
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
  const [customerVerdict, setCustomerVerdict] = useState("")
  const [assigned, setAssigned] = useState("Ibrahim Musa")
  const [suspendRenewal, setSuspendRenewal] = useState(false)
  const [extraVehicle, setExtraVehicle] = useState("")
  const [extraPlate, setExtraPlate] = useState("")
  const [incident, setIncident] = useState(false)
  const [windowText, setWindowText] = useState("Monday, Wednesday & Friday")
  useEffect(() => {
    if (!drawer) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawer(null)
    }
    window.addEventListener("keydown", closeOnEscape)
    return () => window.removeEventListener("keydown", closeOnEscape)
  }, [drawer])
  const person = people[role]
  const corporate = role === "Corporate"
  const estate = role === "Estate"
  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(""), 4500)
  }
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
    page === "Fleet overview"
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
  const staffCards = () => (
    <div className="team-grid">
      {staffList.map((s) => (
        <article className="team-card" key={s.id}>
          <div className="team-top">
            <div className="team-avatar">{s.initials}</div>
            <span className="portal-status">On site</span>
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
            <span style={{ width: `${(s.verified / 6) * 100}%` }} />
          </div>
          <small>{s.verified} / 6 screening records verified</small>
          <button
            className="secondary full"
            onClick={() => {
              setAssigned(s.name)
              setDrawer("onsite")
            }}
          >
            View site assignment
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
    <div className="portal-shell">
      <aside
        className={`sidebar portal-sidebar ${mobile ? "mobile-open" : ""}`}
        id="workspace-navigation"
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile || undefined}
        aria-label={`${role} navigation`}
      >
        {mobile && <SidebarControls onClose={closeMenu} />}
        <Brand />
        <div className="workspace">
          <span className="workspace-icon">
            <Icon name={corporate ? "car" : "pin"} />
          </span>
          <div>
            {person.company}
            <small>{role + " portal"}</small>
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
          <ButtonLink className="nav-item" href="/">
            <Icon name="logout" size={18} />
            Back to website
          </ButtonLink>
          <div className="user-card">
            <span className="avatar">{person.initials}</span>
            <div>
              <strong>{person.name}</strong>
              <small>{role}</small>
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
            <span>{person.company}</span>
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
                  {corporate
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
                  {
                    setDrawer(corporate ? "schedule" : "window")
                  }
                }}
              >
                <Icon name={"plus"} size={17} />
                {corporate ? "Book fleet wash" : "Manage windows"}
              </button>
            </div>
            {estate && page === "Incidents" && (
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
                      Named drivers confirm their own vehicles. You&apos;ll be
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
                      Approved location: Residents&apos; outdoor car park.
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
                  {staffCards()}
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
                    <h3>Residents&apos; car park</h3>
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
                {staffCards()}
                <section className="portal-panel">
                  {sectionHeading("Estate jobs, without resident private data")}
                  <div className="history-row">
                    <Icon name="car" />
                    <div>
                      <h4>David Akin · 6 assigned washes</h4>
                      <p>
                        Residents&apos; car park · 4 complete, 2 in progress
                      </p>
                    </div>
                    <span className="portal-status">On site</span>
                  </div>
                  <div className="history-row">
                    <Icon name="car" />
                    <div>
                      <h4>Ibrahim Musa · 6 assigned washes</h4>
                      <p>Residents&apos; car park · 5 complete, 1 ready</p>
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
                    Good morning, Parkview! Go-Wash will be at the
                    residents&apos; outdoor car park on {windowText}, 8:00–11:00
                    AM. Book your vehicle&apos;s care in advance. Screened
                    staff. Every wash verified. Outdoor service only.
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
            {((corporate && page === "Reports") ||
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
                    Sample reporting data. Estate reports exclude
                    residents&apos; payment information and private vehicle
                    histories.
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
        <div className="portal-drawer-backdrop" onClick={() => setDrawer(null)}>
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
              onClick={() => setDrawer(null)}
            >
              <Icon name="close" />
            </button>
            <div className="eyebrow">{"YOUR GO-WASH WORKSPACE"}</div>

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

            {[
              "schedule",
              "window",
              "fleet-vehicle",
              "invite",
              "incident",
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
                  {drawer === "window"
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

                    setDrawer(null)
                    notify(
                      drawer === "window"
                        ? "Window change requested. Prototype displays your proposed schedule; production needs approval."
                        : "Demo request saved for review. No live message or charge was made.",
                    )
                  }}
                >
                  {["fleet-vehicle"].includes(drawer) && (
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
                  {["schedule"].includes(drawer) && (
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
                          {["Fleet manager", "Confirmer", "Company owner"].map(
                            (r) => (
                              <option key={r}>{r}</option>
                            ),
                          )}
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

                  <button className="primary full">
                    {drawer === "fleet-vehicle"
                      ? "Register demo vehicle"
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
            {["invoice", "fleet-plan"].includes(drawer) && (
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
                  </>
                )}
                <p className="policy-note">
                  Gateway integration, reconciliation and refunds must be
                  enforced by the backend.
                </p>
              </>
            )}
            {["onsite", "estate-guidelines", "confirmer"].includes(drawer) && (
              <>
                <h2>
                  {drawer === "onsite"
                    ? assigned
                    : drawer === "confirmer"
                      ? `Access for ${assigned}`
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
                    {
                      "Your organisation's data only. Operations retains assignment and exception controls."
                    }
                  </span>
                </div>
                <ButtonLink className="secondary full" href="/">
                  Return to website <Icon name="logout" size={17} />
                </ButtonLink>
              </>
            )}
            {drawer === "notifications" && (
              <>
                <h2>A little heads-up.</h2>
                {(corporate
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
