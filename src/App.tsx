import { PageTransition } from "./components/Motion"
import { useCallback, useState } from "react"
import useDismissiblePanel from "./hooks/useDismissiblePanel"
import SidebarControls from "./components/navigation/SidebarControls"
import { Icon, CarArt, Plate } from "./components/Visuals"
import type { IconName } from "./components/Visuals"
const nav: {
  label: string
  icon: IconName
  section?: string
}[] = [
  { label: "Overview", icon: "grid" },
  { label: "My vehicles", icon: "car" },
  { label: "My bookings", icon: "calendar" },
  { label: "Wash Passport", icon: "shield" },
  { label: "Subscriptions", icon: "card" },
  { label: "Referrals & rewards", icon: "gift" },
]
const services = [
  {
    name: "Essential Wash",
    tag: "A fresh start",
    price: 5000,
    duration: "35–45 min",
    description: "Exterior hand wash, wheel clean and a streak-free finish.",
    icon: "drop" as IconName,
  },
  {
    name: "Signature Wash",
    tag: "MOST POPULAR",
    price: 8500,
    duration: "60–75 min",
    description:
      "Exterior shine, interior vacuum, dashboard and tyre dressing.",
    icon: "star" as IconName,
  },
  {
    name: "Premium Detail",
    tag: "The full treatment",
    price: 18000,
    duration: "100–120 min",
    description: "Deep interior care, premium wax and every detail perfected.",
    icon: "shield" as IconName,
  },
]
const money = (n: number) => `₦${n.toLocaleString()}`

export default function App() {
  const [page, setPage] = useState("Overview")
  const [modal, setModal] = useState<string | null>(null)
  const [bookingStep, setBookingStep] = useState(0)
  const [service, setService] = useState(1)
  const [vehicle, setVehicle] = useState("Mercedes-Benz C300")
  const [location, setLocation] = useState("Home · Lekki Phase 1")
  const [date, setDate] = useState("2026-10-12")
  const [slot, setSlot] = useState("8:00 – 10:00 AM")
  const [booked, setBooked] = useState(false)
  const [toast, setToast] = useState("")
  const [verdict, setVerdict] = useState("")
  const [remark, setRemark] = useState("")
  const [verdictDone, setVerdictDone] = useState(false)
  const [addedVehicle, setAddedVehicle] = useState("")
  const [newPlate, setNewPlate] = useState("")
  const [rating, setRating] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  useDismissiblePanel(menuOpen, closeMenu, ".app-shell .sidebar")
  const notify = (text: string) => {
    setToast(text)
    window.setTimeout(() => setToast(""), 4500)
  }
  const openBooking = (index = 1) => {
    setService(index)
    setBookingStep(0)
    setModal("booking")
  }

  return (
    <div className="app-shell">
      <aside
        className={`sidebar ${menuOpen ? "mobile-open" : ""}`}
        id="customer-navigation"
        role={menuOpen ? "dialog" : undefined}
        aria-modal={menuOpen || undefined}
        aria-label="Customer navigation"
      >
        {menuOpen && <SidebarControls onClose={closeMenu} />}
        <div className="brand">
          <span className="brand-symbol">
            <Icon name="drop" size={24} />
          </span>
          go<span className="brand-dash">-</span>wash
          <span className="brand-dot">.</span>
        </div>
        <div className="workspace">
          <span className="workspace-icon">
            <Icon name="car" />
          </span>
          <div>
            Personal account<small>Your everyday, elevated</small>
          </div>
          <Icon name="chevron" size={15} />
        </div>
        <div className="nav-label">YOUR SPACE</div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${page === item.label ? "active" : ""}`}
              onClick={() => {
                setPage(item.label)
                setMenuOpen(false)
              }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "My bookings" && (
                <span className="nav-count">{booked ? 3 : 2}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-bubble">
              <Icon name="help" size={23} />
            </span>
            <h4>A little help?</h4>
            <p>Real people. Ready to help.</p>
            <button onClick={() => setModal("support")}>
              Talk to us <Icon name="arrow" size={16} />
            </button>
          </div>
          <button className="nav-item" onClick={() => setModal("settings")}>
            <Icon name="help" />
            <span>Help & settings</span>
          </button>
          <div className="user-card">
            <div className="avatar">TA</div>
            <div>
              <strong>Tolu Adebayo</strong>
              <small>Personal account</small>
            </div>
            <button
              aria-label="Open account settings"
              onClick={() => setModal("settings")}
            >
              <Icon name="chevron" size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation"
              aria-expanded={menuOpen}
              aria-controls="customer-navigation"
            >
              <Icon name="grid" />
            </button>
            <span>My space</span>
            <Icon name="chevron" size={13} />
            <strong>{page}</strong>
          </div>
          <div className="header-right">
            <span className="location-label">
              <Icon name="pin" size={16} /> Lagos, Nigeria
            </span>
            <span className="header-divider" />
            <button
              className="notification-btn"
              aria-label="Notifications"
              onClick={() => setModal("notifications")}
            >
              <Icon name="bell" />
              <i />
            </button>
            <button
              className="avatar small"
              onClick={() => setModal("settings")}
            >
              TA
            </button>
          </div>
        </header>
        <main>
          <PageTransition transitionKey={page}>
            <div className="page-heading">
              <div>
                <div className="eyebrow">YOUR VEHICLE. OUR RESPONSIBILITY.</div>
                <h1>{page === "Overview" ? "A fresh start, Tolu." : page}</h1>
                <p>
                  {page === "Overview"
                    ? "Less time at the wash bay. More time for what matters."
                    : "A little more care. A lot more peace of mind."}
                </p>
              </div>
              <button className="primary" onClick={() => openBooking()}>
                <Icon name="plus" size={18} />
                Book a wash
              </button>
            </div>
            {page === "Overview" && (
              <>
                <section className="hero">
                  <div className="hero-copy">
                    <div className="hero-kicker">
                      <span /> THE CLEAN YOU CAN COUNT ON
                    </div>
                    <h2>
                      Your day moves fast.
                      <br />
                      Let us handle <em>the shine.</em>
                    </h2>
                    <p>
                      A spotless car, without going anywhere.
                      <br />
                      Screened professionals. Every wash, verified.
                    </p>
                    <button className="primary" onClick={() => openBooking()}>
                      Give your car a fresh start{" "}
                      <Icon name="arrow" size={18} />
                    </button>
                    <div className="hero-proof">
                      <Icon name="shield" size={15} />
                      GPS tracked <b>·</b> Plate matched <b>·</b> You confirm
                    </div>
                  </div>
                  <div className="hero-visual">
                    <div className="orbit orbit-one" />
                    <div className="orbit orbit-two" />
                    <span className="spark spark-one">✦</span>
                    <span className="spark spark-two">✦</span>
                    <CarArt />
                    <div className="floating-proof">
                      <span>
                        <Icon name="shield" size={18} />
                      </span>
                      <div>
                        Not just clean. Proven.
                        <small>The Go-Wash promise</small>
                      </div>
                      <Icon name="check" size={16} />
                    </div>
                  </div>
                </section>
                <section className="stats-row">
                  <div>
                    <span className="stat-icon">
                      <Icon name="car" />
                    </span>
                    <div>
                      <strong>{addedVehicle ? "03" : "02"}</strong>
                      <small>Vehicles in your garage</small>
                    </div>
                    <button
                      aria-label="View vehicles"
                      onClick={() => setPage("My vehicles")}
                    >
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                  <div>
                    <span className="stat-icon">
                      <Icon name="drop" />
                    </span>
                    <div>
                      <strong>
                        12 <span>washes</span>
                      </strong>
                      <small>A little care goes a long way</small>
                    </div>
                    <span className="tiny-tag">All verified</span>
                  </div>
                  <div>
                    <span className="stat-icon">
                      <Icon name="card" />
                    </span>
                    <div>
                      <strong>
                        02 <span>remaining</span>
                      </strong>
                      <small>Your Signature monthly plan</small>
                    </div>
                    <button
                      aria-label="View subscription"
                      onClick={() => setPage("Subscriptions")}
                    >
                      <Icon name="arrow" size={17} />
                    </button>
                  </div>
                </section>
                <div className="dashboard-grid">
                  <div className="dashboard-left">
                    <section className="section">
                      <div className="section-heading">
                        <h3>Your next fresh start</h3>
                        <button
                          className="text-button"
                          onClick={() => setPage("My bookings")}
                        >
                          All bookings <Icon name="arrow" size={16} />
                        </button>
                      </div>
                      <div className="active-booking">
                        <div className="booking-top">
                          <div className="booking-symbol">
                            <Icon name="drop" size={23} />
                          </div>
                          <div>
                            <h4>Signature Wash</h4>
                            <p>
                              Mercedes-Benz C300 <span>·</span> <Plate />
                            </p>
                          </div>
                          <span className="status-badge">
                            <i />
                            Washman on the way
                          </span>
                        </div>
                        <div className="booking-details">
                          <span>
                            <Icon name="calendar" size={16} />
                            Today, 10 Oct
                          </span>
                          <span>
                            <Icon name="clock" size={16} />
                            10:00 – 11:00 AM
                          </span>
                          <span>
                            <Icon name="pin" size={16} />
                            Home, Lekki Phase 1
                          </span>
                        </div>
                        <div className="water-line">
                          {[
                            "Assigned",
                            "On the way",
                            "Arrived",
                            "Washing",
                            "Ready",
                          ].map((stage, i) => (
                            <div
                              key={stage}
                              className={i < 2 ? "complete" : ""}
                            >
                              <span>
                                {i === 0 ? (
                                  <Icon name="check" size={12} />
                                ) : i === 1 ? (
                                  <span className="progress-dot" />
                                ) : null}
                              </span>
                              <small>{stage}</small>
                            </div>
                          ))}
                        </div>
                        <div className="washman-row">
                          <div className="washman-avatar">EO</div>
                          <div>
                            <strong>
                              Emeka Okafor{" "}
                              <span className="verified-inline">
                                <Icon name="shield" size={13} />
                                Verified
                              </span>
                            </strong>
                            <small>
                              <Icon name="star" size={12} /> 4.9 <span>·</span>{" "}
                              248 washes completed
                            </small>
                          </div>
                          <div className="eta">
                            <strong>12 min</strong>
                            <small>Estimated arrival</small>
                          </div>
                          <button
                            className="secondary"
                            onClick={() => setModal("tracking")}
                          >
                            Track wash <Icon name="arrow" size={15} />
                          </button>
                        </div>
                      </div>
                    </section>
                    <section className="section">
                      <div className="section-heading">
                        <h3>
                          Your garage{" "}
                          <span className="heading-count">
                            {addedVehicle ? 3 : 2}
                          </span>
                        </h3>
                        <button
                          className="text-button"
                          onClick={() => setModal("vehicle")}
                        >
                          <Icon name="plus" size={15} /> Add vehicle
                        </button>
                      </div>
                      <div className="garage-grid">
                        {["Mercedes-Benz C300", "Toyota Camry"].map(
                          (name, i) => (
                            <div className="vehicle-card" key={name}>
                              <div className="vehicle-card-top">
                                <span>
                                  {i ? "THE EVERYDAY ONE" : "YOUR DAILY DRIVE"}
                                </span>
                                <button
                                  aria-label={`View ${name} passport`}
                                  onClick={() => setPage("Wash Passport")}
                                >
                                  <Icon name="chevron" size={16} />
                                </button>
                              </div>
                              <CarArt silver={i === 1} />
                              <h4>{name}</h4>
                              <div className="vehicle-info">
                                <Plate>{i ? "KJA 715 FC" : "LND 482 JK"}</Plate>
                                <span>
                                  {i
                                    ? "Silver · Sedan"
                                    : "Midnight blue · Sedan"}
                                </span>
                              </div>
                              <div className="vehicle-footer">
                                <span>
                                  <Icon name="shield" size={14} />
                                  {i
                                    ? "Last washed 6 days ago"
                                    : "A fresh wash is on its way"}
                                </span>
                                <button
                                  onClick={() => {
                                    setVehicle(name)
                                    openBooking()
                                  }}
                                >
                                  Book again <Icon name="arrow" size={13} />
                                </button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </section>
                  </div>
                  <aside className="dashboard-right">
                    <section className="subscription-card">
                      <div className="subscription-top">
                        <span className="sub-icon">
                          <Icon name="drop" />
                        </span>
                        <span>YOUR SHINE, ON REPEAT</span>
                      </div>
                      <h3>
                        Good habits.
                        <br />
                        Great-looking car.
                      </h3>
                      <p>
                        You're on the Signature plan.
                        <br />A clean car is already on the calendar.
                      </p>
                      <div className="wash-credit">
                        <strong>
                          2 <span>/ 4 washes left</span>
                        </strong>
                        <span className="plan-pill">MONTHLY</span>
                      </div>
                      <div className="credit-progress">
                        <span />
                      </div>
                      <div className="renewal">
                        Renews 1 November <b>₦30,000 / mo</b>
                      </div>
                      <button onClick={() => setPage("Subscriptions")}>
                        Manage your plan <Icon name="arrow" size={17} />
                      </button>
                    </section>
                    <section className="trust-card">
                      <div className="trust-heading">
                        <span>
                          <Icon name="shield" size={22} />
                        </span>
                        <h4>
                          Clean is good.
                          <br />
                          Verified is better.
                        </h4>
                      </div>
                      <p>
                        Every wash comes with three proofs.
                        <br />
                        Because your peace of mind matters.
                      </p>
                      {[
                        {
                          icon: "pin" as IconName,
                          title: "Right place",
                          text: "GPS-verified arrival and wash",
                        },
                        {
                          icon: "car" as IconName,
                          title: "Right vehicle",
                          text: "Your plate, matched twice",
                        },
                        {
                          icon: "check" as IconName,
                          title: "Your say. Always.",
                          text: "You confirm before we close",
                        },
                      ].map((item) => (
                        <div className="proof-item" key={item.title}>
                          <span>
                            <Icon name={item.icon} size={17} />
                          </span>
                          <div>
                            <strong>{item.title}</strong>
                            <small>{item.text}</small>
                          </div>
                          <Icon name="check" size={14} />
                        </div>
                      ))}
                      <button
                        className="text-button"
                        onClick={() => setModal("proof")}
                      >
                        Meet the Verified Wash <Icon name="arrow" size={15} />
                      </button>
                    </section>
                  </aside>
                </div>
                <section className="section services-section">
                  <div className="section-heading">
                    <div>
                      <h3>A little clean. Or the whole glow.</h3>
                      <p>Carefully crafted care for every kind of day.</p>
                    </div>
                    <span className="pricing-note">
                      Sedan pricing <Icon name="car" size={16} />
                    </span>
                  </div>
                  <div className="service-grid">
                    {services.map((s, i) => (
                      <div
                        className={`service-card ${i === 1 ? "featured" : ""}`}
                        key={s.name}
                      >
                        <div className="service-top">
                          <span className="service-icon">
                            <Icon name={s.icon} size={24} />
                          </span>
                          <span
                            className={i === 1 ? "popular-tag" : "service-tag"}
                          >
                            {s.tag}
                          </span>
                        </div>
                        <h4>{s.name}</h4>
                        <p>{s.description}</p>
                        <div className="service-bottom">
                          <strong>
                            {money(s.price)}
                            <small>
                              <Icon name="clock" size={12} />
                              {s.duration}
                            </small>
                          </strong>
                          <button
                            aria-label={`Book ${s.name}`}
                            onClick={() => openBooking(i)}
                          >
                            <Icon name="arrow" size={19} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
                <div className="referral-strip">
                  <span className="referral-icon">
                    <Icon name="gift" size={24} />
                  </span>
                  <div>
                    <h4>Good things are better shared.</h4>
                    <p>
                      Give a friend ₦2,000 off their first wash. Get ₦2,000 when
                      they book.
                    </p>
                  </div>
                  <button onClick={() => setPage("Referrals & rewards")}>
                    Share the shine <Icon name="arrow" size={16} />
                  </button>
                </div>
              </>
            )}
            {page === "My vehicles" && (
              <>
                <div className="section-heading">
                  <h3>Your vehicles, cared for.</h3>
                  <button
                    className="secondary"
                    onClick={() => setModal("vehicle")}
                  >
                    <Icon name="plus" />
                    Add vehicle
                  </button>
                </div>
                <div className="vehicle-page-grid">
                  {[
                    "Mercedes-Benz C300",
                    "Toyota Camry",
                    ...(addedVehicle ? [addedVehicle] : []),
                  ].map((name, i) => (
                    <div className="vehicle-card" key={name}>
                      <CarArt silver={i > 0} />
                      <h3>{name}</h3>
                      <Plate>
                        {i === 0
                          ? "LND 482 JK"
                          : i === 1
                            ? "KJA 715 FC"
                            : newPlate}
                      </Plate>
                      <p>Registered vehicle · Sedan</p>
                      <div className="vehicle-actions">
                        <button
                          className="primary"
                          onClick={() => {
                            setVehicle(name)
                            openBooking()
                          }}
                        >
                          Book a wash
                        </button>
                        <button
                          className="secondary"
                          onClick={() => setPage("Wash Passport")}
                        >
                          View Passport
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {page === "My bookings" && (
              <section className="content-panel">
                <div className="section-heading">
                  <h3>Upcoming & recent washes</h3>
                  <span className="status-badge">Your care calendar</span>
                </div>
                {[
                  ...(booked ? [`${services[service].name} · ${date}`] : []),
                  "Signature Wash · Today, 10 October",
                  "Essential Wash · 6 October",
                  "Signature Wash · 1 October",
                ].map((name, i) => (
                  <div className="history-row" key={name}>
                    <span className="stat-icon">
                      <Icon name="drop" />
                    </span>
                    <div>
                      <h4>{name}</h4>
                      <p>
                        {i === 2 ? "Toyota Camry" : vehicle} · Home, Lekki Phase
                        1
                      </p>
                    </div>
                    <span className="status-badge">
                      {i === 0
                        ? booked
                          ? "Booked"
                          : "On the way"
                        : "Verified wash"}
                    </span>
                    <button
                      className="secondary"
                      onClick={() => setModal(i === 0 ? "tracking" : "receipt")}
                    >
                      View details <Icon name="chevron" size={15} />
                    </button>
                  </div>
                ))}
              </section>
            )}
            {page === "Wash Passport" && (
              <>
                <section className="passport-banner">
                  <Icon name="shield" size={48} />
                  <div>
                    <div className="eyebrow">
                      YOUR VEHICLE'S VERIFIED CARE RECORD
                    </div>
                    <h2>A clean history. A clear conscience.</h2>
                    <p>
                      Every wash, every proof, every little detail. All in one
                      place.
                    </p>
                  </div>
                  <Plate />
                </section>
                <section className="content-panel">
                  <div className="section-heading">
                    <h3>Mercedes-Benz C300</h3>
                    <span>8 verified washes</span>
                  </div>
                  {[
                    "6 October 2026",
                    "1 October 2026",
                    "24 September 2026",
                    "17 September 2026",
                  ].map((day, i) => (
                    <div className="history-row" key={day}>
                      <span className="stat-icon">
                        <Icon name="shield" />
                      </span>
                      <div>
                        <h4>{i === 0 ? "Essential" : "Signature"} Wash</h4>
                        <p>{day} · Emeka Okafor · Lekki Phase 1</p>
                      </div>
                      <div className="passport-proofs">
                        <span>
                          <Icon name="pin" size={13} /> GPS
                        </span>
                        <span>
                          <Icon name="car" size={13} /> Plate
                        </span>
                        <span>
                          <Icon name="check" size={13} /> Verdict
                        </span>
                      </div>
                      <button
                        className="text-button"
                        onClick={() => setModal("receipt")}
                      >
                        Evidence pack <Icon name="arrow" size={15} />
                      </button>
                    </div>
                  ))}
                </section>
              </>
            )}
            {page === "Subscriptions" && (
              <>
                <section className="passport-banner">
                  <Icon name="drop" size={45} />
                  <div>
                    <div className="eyebrow">LESS PLANNING. MORE SHINE.</div>
                    <h2>Your clean-car routine, sorted.</h2>
                    <p>
                      Monthly care delivered to your driveway. No wash-bay
                      detours.
                    </p>
                  </div>
                </section>
                <div className="service-grid">
                  {services.map((s, i) => (
                    <div
                      className={`service-card ${i === 1 ? "featured" : ""}`}
                      key={s.name}
                    >
                      <span className="popular-tag">
                        {i === 1 ? "YOUR CURRENT PLAN" : "4 WASHES / MONTH"}
                      </span>
                      <h3>{s.name}</h3>
                      <p>
                        Four professional washes. Three proofs per wash. One
                        less thing to worry about.
                      </p>
                      <h2>
                        {money(s.price * 4 - (i === 1 ? 4000 : 2000))}
                        <small className="per-month"> / month</small>
                      </h2>
                      <button
                        className={i === 1 ? "secondary" : "primary"}
                        onClick={() => {
                          setModal("plan")
                          setService(i)
                        }}
                      >
                        {i === 1 ? "Manage plan" : "Explore plan"}
                        <Icon name="arrow" size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {page === "Referrals & rewards" && (
              <section className="referral-page">
                <div className="large-gift">
                  <Icon name="gift" size={48} />
                </div>
                <div className="eyebrow">SPREAD A LITTLE SHINE</div>
                <h2>Clean cars. Happy friends.</h2>
                <p>
                  Your friend gets ₦2,000 off their first wash.
                  <br />
                  You get ₦2,000 in wash credit when they book.
                </p>
                <div className="referral-code">
                  <span>TOLU2000</span>
                  <button
                    className="primary"
                    onClick={() => {
                      navigator.clipboard?.writeText("TOLU2000")
                      notify("Your referral code has been copied.")
                    }}
                  >
                    Copy code <Icon name="arrow" size={16} />
                  </button>
                </div>
                <div className="referral-metrics">
                  <div>
                    <strong>3</strong>
                    <span>Friends referred</span>
                  </div>
                  <div>
                    <strong>₦6,000</strong>
                    <span>Credit earned</span>
                  </div>
                  <div>
                    <strong>₦2,000</strong>
                    <span>Available credit</span>
                  </div>
                </div>
              </section>
            )}
            <footer>
              <span>
                go-wash <b>·</b> Your vehicle. Our responsibility.
              </span>
              <span>
                <Icon name="shield" size={13} /> Clean, proven, calm. <b>·</b>{" "}
                Made for Nigeria.
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
      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <section
            className={`modal ${modal === "booking" ? "booking-modal" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={modal === "booking" ? "Book a wash" : "Go-Wash details"}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              aria-label="Close dialog"
              onClick={() => setModal(null)}
            >
              <Icon name="close" />
            </button>
            {modal === "booking" && (
              <>
                <div className="eyebrow">
                  A CLEAN CAR IS JUST A FEW TAPS AWAY
                </div>
                <h2>
                  {bookingStep === 2
                    ? "You're on the calendar."
                    : bookingStep === 1
                      ? "Everything look good?"
                      : "Make time for a little shine."}
                </h2>
                <div className="booking-steps">
                  {["Your wash", "Review & pay", "Confirmed"].map(
                    (label, i) => (
                      <span
                        className={i <= bookingStep ? "current" : ""}
                        key={label}
                      >
                        {i + 1}. {label}
                      </span>
                    ),
                  )}
                </div>
                {bookingStep === 0 ? (
                  <>
                    <label>
                      Your vehicle
                      <select
                        value={vehicle}
                        onChange={(e) => setVehicle(e.target.value)}
                      >
                        <option>Mercedes-Benz C300</option>
                        <option>Toyota Camry</option>
                        {addedVehicle && <option>{addedVehicle}</option>}
                      </select>
                    </label>
                    <label>Choose your care</label>
                    <div className="booking-service-list">
                      {services.map((s, i) => (
                        <button
                          className={service === i ? "selected" : ""}
                          key={s.name}
                          onClick={() => setService(i)}
                        >
                          <Icon name={s.icon} />
                          <span>
                            <strong>{s.name}</strong>
                            <small>{s.duration}</small>
                          </span>
                          <b>{money(s.price)}</b>
                          {service === i && <Icon name="check" size={17} />}
                        </button>
                      ))}
                    </div>
                    <label>
                      Outdoor wash location
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                      >
                        <option>Home · Lekki Phase 1</option>
                        <option>Office · Victoria Island</option>
                        <option>Estate car park · Ikoyi</option>
                      </select>
                    </label>
                    <div className="form-grid">
                      <label>
                        Date
                        <input
                          type="date"
                          min="2026-10-10"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                      </label>
                      <label>
                        Time slot
                        <select
                          value={slot}
                          onChange={(e) => setSlot(e.target.value)}
                        >
                          <option>8:00 – 10:00 AM</option>
                          <option>10:00 AM – 12:00 PM</option>
                          <option>2:00 – 4:00 PM</option>
                        </select>
                      </label>
                    </div>
                    <p className="policy-note">
                      <Icon name="shield" size={16} /> We work in approved
                      outdoor spaces only. Your washman never enters your home.
                    </p>
                    <button
                      className="primary full"
                      onClick={() => setBookingStep(1)}
                      disabled={!date}
                    >
                      Review booking <Icon name="arrow" size={17} />
                    </button>
                  </>
                ) : bookingStep === 1 ? (
                  <>
                    <div className="review-summary">
                      <h3>{services[service].name}</h3>
                      <p>{vehicle}</p>
                      <p>
                        <Icon name="pin" size={16} />
                        {location}
                      </p>
                      <p>
                        <Icon name="calendar" size={16} />
                        {date} · {slot}
                      </p>
                      <hr />
                      <div>
                        <span>Wash service</span>
                        <strong>{money(services[service].price)}</strong>
                      </div>
                      <div>
                        <span>Travel & verification</span>
                        <strong>Included</strong>
                      </div>
                      <hr />
                      <div>
                        <strong>Total</strong>
                        <h3>{money(services[service].price)}</h3>
                      </div>
                    </div>
                    <p className="policy-note">
                      Prototype checkout — no real payment will be taken.
                    </p>
                    <button
                      className="primary full"
                      onClick={() => {
                        setBookingStep(2)
                        setBooked(true)
                      }}
                    >
                      Confirm demo booking <Icon name="shield" size={17} />
                    </button>
                    <button
                      className="text-button centered"
                      onClick={() => setBookingStep(0)}
                    >
                      Back to your wash
                    </button>
                  </>
                ) : (
                  <div className="confirmation">
                    <span className="confirmation-icon">
                      <Icon name="check" size={38} />
                    </span>
                    <h3>We'll take care of the rest.</h3>
                    <p>
                      {services[service].name} for your {vehicle}
                      <br />
                      {date} · {slot}
                      <br />
                      {location}
                    </p>
                    <span className="status-badge">Demo booking #GW-1049</span>
                    <p>
                      You'll receive your washman's Trust Card when they're
                      assigned. No payment has been charged.
                    </p>
                    <button
                      className="primary full"
                      onClick={() => {
                        setModal(null)
                        setPage("My bookings")
                      }}
                    >
                      View my bookings <Icon name="arrow" size={17} />
                    </button>
                  </div>
                )}
              </>
            )}
            {modal === "tracking" && (
              <>
                <div className="eyebrow">LIVE WASH · #GW-1048</div>
                <h2>Your shine is on its way.</h2>
                <div className="map-illustration">
                  <div className="map-road road-1" />
                  <div className="map-road road-2" />
                  <div className="map-road road-3" />
                  <span className="map-label">LEKKI PHASE 1</span>
                  <div className="route-path" />
                  <span className="map-car">
                    <Icon name="car" size={24} />
                  </span>
                  <span className="map-home">
                    <Icon name="pin" size={24} />
                  </span>
                  <span className="map-water">LAGOS LAGOON</span>
                  <span className="map-demo">
                    Illustrative route · Not live GPS
                  </span>
                </div>
                <div className="washman-row tracking-washman">
                  <div className="washman-avatar">EO</div>
                  <div>
                    <strong>Emeka Okafor</strong>
                    <small>Verified professional · 4.9 rating</small>
                  </div>
                  <div className="eta">
                    <strong>12 min</strong>
                    <small>Estimated arrival</small>
                  </div>
                </div>
                <p>
                  We'll let you know when Emeka arrives. Your vehicle's plate
                  will be checked before the wash begins.
                </p>
                <button
                  className="primary full"
                  onClick={() => setModal("verdict")}
                >
                  Preview the TREATED verdict <Icon name="arrow" size={16} />
                </button>
                <p className="policy-note">
                  Demo: preview the ready-for-review stage of your wash.
                </p>
              </>
            )}
            {modal === "verdict" && (
              <>
                <div className="eyebrow">THE REVEAL · DEMO EXPERIENCE</div>
                <h2>
                  {verdictDone
                    ? "Your say has been recorded."
                    : "A little shine. Your final say."}
                </h2>
                {!verdictDone ? (
                  <>
                    <div className="reveal-art">
                      <CarArt />
                      <span>
                        Vehicle illustration · Live job photos will appear here
                      </span>
                    </div>
                    <p>
                      Confirm whether your vehicle was treated. Your verdict is
                      required before the washman can make the final plate scan.
                    </p>
                    <div className="verdict-options">
                      {[
                        "Treated and satisfied",
                        "Treated and not pleased",
                        "Untreated",
                      ].map((v, i) => (
                        <button
                          key={v}
                          className={`verdict-option outcome-${i} ${
                            verdict === v ? "selected" : ""
                          }`}
                          onClick={() => setVerdict(v)}
                        >
                          <Icon
                            name={
                              i === 0 ? "check" : i === 1 ? "help" : "close"
                            }
                          />
                          <span>
                            {v}
                            <small>
                              {i === 0
                                ? "All clean. All good."
                                : i === 1
                                  ? "The wash happened, but needs attention."
                                  : "My vehicle was not washed."}
                            </small>
                          </span>
                        </button>
                      ))}
                    </div>
                    {verdict && verdict !== "Treated and satisfied" && (
                      <div className="reason-chips">
                        {[
                          "Missed areas",
                          "Interior not done",
                          "Arrived late",
                          "Staff conduct",
                          "Damage concern",
                        ].map((r) => (
                          <button
                            key={r}
                            onClick={() => setRemark(r)}
                            className={remark === r ? "selected" : ""}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                    <label>
                      Your remark{" "}
                      {verdict && verdict !== "Treated and satisfied"
                        ? "(required)"
                        : "(optional)"}
                      <textarea
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                        placeholder="Tell us about your wash…"
                      />
                    </label>
                    <button
                      className="primary full"
                      disabled={
                        !verdict ||
                        (verdict !== "Treated and satisfied" && !remark.trim())
                      }
                      onClick={() => setVerdictDone(true)}
                    >
                      TREATED · Submit verdict <Icon name="check" size={16} />
                    </button>
                  </>
                ) : (
                  <div className="confirmation">
                    <span className="confirmation-icon">
                      <Icon name="shield" size={36} />
                    </span>
                    <h3>{verdict}</h3>
                    <p>
                      {verdict === "Untreated"
                        ? "The job is disputed. Final submission is locked until the operations team reviews the evidence."
                        : verdict === "Treated and not pleased"
                          ? "A complaint is open for the operations team. The washman can now make the final plate scan."
                          : "The washman can now make the final plate scan. Your Wash Passport is updated only after all three proofs are complete."}
                    </p>
                    {verdict !== "Untreated" && (
                      <>
                        <h4>How was your experience?</h4>
                        <div className="rating-stars">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <button
                              key={n}
                              aria-label={`Rate ${n} stars`}
                              className={rating >= n ? "rated" : ""}
                              onClick={() => setRating(n)}
                            >
                              <Icon name="star" size={30} />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    <button
                      className="primary full"
                      onClick={() => {
                        setModal(null)
                        notify(
                          "Demo verdict saved. Thank you for your feedback.",
                        )
                      }}
                    >
                      Done <Icon name="check" size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
            {modal === "vehicle" && (
              <>
                <div className="eyebrow">MAKE ROOM IN YOUR GARAGE</div>
                <h2>A new vehicle. The same care.</h2>
                <p>Your number plate is your vehicle's unique identity.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setAddedVehicle(
                      new FormData(e.currentTarget).get("model") as string,
                    )
                    setModal(null)
                    notify("Vehicle added to your garage.")
                  }}
                >
                  <label>
                    Number plate
                    <input
                      required
                      value={newPlate}
                      onChange={(e) =>
                        setNewPlate(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. LND 482 JK"
                    />
                  </label>
                  <label>
                    Make & model
                    <input
                      required
                      name="model"
                      placeholder="e.g. Lexus RX350"
                    />
                  </label>
                  <div className="form-grid">
                    <label>
                      Colour
                      <input required placeholder="e.g. Pearl white" />
                    </label>
                    <label>
                      Vehicle type
                      <select>
                        <option>Sedan</option>
                        <option>SUV</option>
                        <option>Van</option>
                      </select>
                    </label>
                  </div>
                  <p className="policy-note">
                    <Icon name="shield" size={16} /> In production, duplicate
                    plates are held for admin review.
                  </p>
                  <button className="primary full" type="submit">
                    Add to my garage <Icon name="plus" size={17} />
                  </button>
                </form>
              </>
            )}
            {modal === "support" && (
              <>
                <div className="eyebrow">REAL PEOPLE. REAL SUPPORT.</div>
                <h2>How can we help?</h2>
                <p>Tell our team what happened. We'll help make it right.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setModal(null)
                    notify(
                      "Demo support ticket GW-209 created. Your message has been saved in this session.",
                    )
                  }}
                >
                  <label>
                    What is it about?
                    <select>
                      <option>A booking or wash</option>
                      <option>A payment</option>
                      <option>Staff conduct</option>
                      <option>Privacy or data request</option>
                      <option>Something else</option>
                    </select>
                  </label>
                  <label>
                    Your message
                    <textarea required placeholder="Tell us a little more…" />
                  </label>
                  <button className="primary full">
                    Send message <Icon name="arrow" size={16} />
                  </button>
                </form>
              </>
            )}
            {modal === "notifications" && (
              <>
                <div className="eyebrow">YOUR LATEST UPDATES</div>
                <h2>A little heads-up.</h2>
                <div className="notification-item">
                  <Icon name="car" />
                  <div>
                    <h4>Emeka is on the way</h4>
                    <p>
                      Your Signature Wash is coming to you. Estimated arrival:
                      12 minutes.
                    </p>
                    <small>2 minutes ago</small>
                  </div>
                </div>
                <div className="notification-item">
                  <Icon name="shield" />
                  <div>
                    <h4>Your Wash Passport is up to date</h4>
                    <p>Your 6 October wash has all three proofs verified.</p>
                    <small>4 days ago</small>
                  </div>
                </div>
                <button
                  className="primary full"
                  onClick={() => setModal("tracking")}
                >
                  View active wash <Icon name="arrow" size={16} />
                </button>
              </>
            )}
            {modal === "proof" && (
              <>
                <div className="eyebrow">THE VERIFIED WASH PROMISE</div>
                <h2>Three proofs. Zero guesswork.</h2>
                {[
                  "GPS trail confirms the washman arrived and worked at your location.",
                  "Your registered plate is scanned at arrival and again before submission.",
                  "Your own TREATED verdict confirms the service happened — and how well.",
                ].map((text, i) => (
                  <div className="notification-item" key={text}>
                    <span className="step-number">{i + 1}</span>
                    <p>{text}</p>
                  </div>
                ))}
                <p>
                  A wash doesn't close until all three signals agree. If
                  something isn't right, our operations team reviews the
                  evidence.
                </p>
                <button
                  className="primary full"
                  onClick={() => setModal("verdict")}
                >
                  Explore your verdict <Icon name="arrow" size={16} />
                </button>
              </>
            )}
            {modal === "receipt" && (
              <>
                <div className="eyebrow">WASH PASSPORT · VERIFIED RECORD</div>
                <h2>Every detail, accounted for.</h2>
                <div className="review-summary">
                  <h3>Signature Wash</h3>
                  <p>Mercedes-Benz C300 · LND 482 JK</p>
                  <p>1 October 2026 · Home, Lekki Phase 1</p>
                  <p>Washman: Emeka Okafor</p>
                  <hr />
                  {[
                    "GPS · Arrival and clock-out verified",
                    "Plate · Arrival and final scans matched",
                    "Verdict · Treated and satisfied by Tolu",
                  ].map((text) => (
                    <p key={text}>
                      <Icon name="shield" size={17} />
                      {text}
                    </p>
                  ))}
                  <hr />
                  <div>
                    <strong>Paid · Demo reference GW-PAY-1041</strong>
                    <strong>₦8,500</strong>
                  </div>
                </div>
                <p className="policy-note">
                  Sample evidence record. Actual job photos and location trails
                  require a connected backend.
                </p>
              </>
            )}
            {modal === "plan" && (
              <>
                <div className="eyebrow">CARE ON YOUR TERMS</div>
                <h2>{services[service].name} monthly</h2>
                <p>
                  4 washes per month. Outdoor service at your saved locations.
                  Every wash includes GPS, plate matching and your verdict.
                </p>
                <div className="review-summary">
                  <div>
                    <strong>Monthly price</strong>
                    <h3>
                      {money(
                        services[service].price * 4 -
                          (service === 1 ? 4000 : 2000),
                      )}
                    </h3>
                  </div>
                  <p>Next renewal: 1 November 2026</p>
                  <p>Auto-renewal requires a saved payment method.</p>
                </div>
                <button
                  className="primary full"
                  onClick={() => {
                    setModal(null)
                    notify(
                      service === 1
                        ? "Your plan remains active. No changes made."
                        : "Demo plan selection saved. No charge has been made.",
                    )
                  }}
                >
                  {service === 1 ? "Keep my plan" : "Select demo plan"}
                  <Icon name="check" size={17} />
                </button>
              </>
            )}
            {modal === "settings" && (
              <>
                <div className="eyebrow">YOUR PERSONAL SPACE</div>
                <h2>Tolu Adebayo</h2>
                <p>Manage your preferences and saved outdoor locations.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setModal(null)
                    notify("Preferences saved for this demo session.")
                  }}
                >
                  <label>
                    Display name
                    <input defaultValue="Tolu Adebayo" required />
                  </label>
                  <label>
                    Default outdoor location
                    <select
                      defaultValue={location}
                      onChange={(e) => setLocation(e.target.value)}
                    >
                      <option>Home · Lekki Phase 1</option>
                      <option>Office · Victoria Island</option>
                      <option>Estate car park · Ikoyi</option>
                    </select>
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" defaultChecked /> Receive wash
                    progress notifications
                  </label>
                  <button className="primary full">
                    Save preferences <Icon name="check" size={16} />
                  </button>
                </form>
                <button
                  className="text-button centered"
                  onClick={() => setModal("support")}
                >
                  Request a copy or deletion of your data
                </button>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
