import type { Role } from "@/lib/roles"

export type NavLink = { href: string; label: string }

/** Primary public navigation (header, mobile menu, footer). */
export const publicLinks: readonly NavLink[] = [
  { href: "/", label: "For you" },
  { href: "/business", label: "Businesses" },
  { href: "/estates", label: "Estates" },
  { href: "/careers", label: "Our team" },
  { href: "/services", label: "Our care" },
  { href: "/coverage", label: "Locations" },
]

/** Which audience's call-to-action the header shows on each audience page. */
export const audienceByPath: Record<string, Role> = {
  "/business": "Corporate",
  "/estates": "Estate",
  "/careers": "Washman",
  "/operations": "Super admin",
}
export const audiences = {
  business: {
    role: "Corporate" as Role,
    eyebrow: "GO-WASH FOR BUSINESS",
    title: "A fleet that shines.",
    accent: "A workday that flows.",
    description:
      "From the first pool car to your whole company fleet, give every vehicle a reliable care routine. One account. Named confirmers. A clear record of every wash.",
    action: "Design your fleet plan",
    label: "THE CONNECTED FLEET",
    benefits: [
      [
        "car",
        "Every vehicle, connected",
        "Register your fleet by plate, then keep its care history in one place.",
      ],
      [
        "calendar",
        "Your rhythm, built in",
        "Agree recurring wash days around your team's parking and work schedules.",
      ],
      [
        "card",
        "Clarity for finance",
        "Agreed volume pricing, consolidated invoices and term billing.",
      ],
      [
        "shield",
        "A record you can trust",
        "Location evidence, matched plates and a named confirmer for every job.",
      ],
    ],
    process: [
      [
        "Map your fleet",
        "Add vehicle details, approved parking locations and the people who confirm each wash.",
      ],
      [
        "Agree your plan",
        "Operations agrees your volume pricing and a 3, 6 or 12-month term.",
      ],
      [
        "Let the team take over",
        "Dispatch assigns screened professionals; drivers review the result through a verdict link.",
      ],
      [
        "Review, without chasing",
        "See active washes, vehicle histories and invoices from your corporate workspace.",
      ],
    ],
    featureTitle: "Many vehicles. One beautifully clear picture.",
    featureText:
      "A Wash Passport follows the vehicle, not a spreadsheet. Your fleet team can see service outcomes while finance keeps its billing view.",
    featureItems: [
      "Named drivers and delegated confirmers",
      "Fleet scheduling and wash records",
      "Consolidated term invoices",
      "Vehicle-level proof and outcome history",
    ],
    faq: [
      [
        "How is fleet pricing calculated?",
        "Operations agrees pricing based on fleet size, service mix and the approved wash schedule. Public sedan prices are illustrative, not a corporate quote.",
      ],
      [
        "Can drivers confirm without an account?",
        "Yes. A named driver or representative uses a delegated verdict link. Production links must be signed, expiring and single-use.",
      ],
      [
        "Which contract terms are available?",
        "Corporate plans run for 3, 6 or 12 months. Card and bank-transfer billing arrangements are agreed with operations.",
      ],
    ],
  },
  estates: {
    role: "Estate" as Role,
    eyebrow: "GO-WASH FOR COMMUNITIES",
    title: "A fresh start.",
    accent: "For the whole estate.",
    description:
      "Turn a busy parking area into a thoughtfully organised wash morning. Approved outdoor spaces, agreed access windows and screened people your security team can identify.",
    action: "Plan your estate wash morning",
    label: "THE NEIGHBOURHOOD, IN SYNC",
    benefits: [
      [
        "clock",
        "Agreed wash windows",
        "Care that fits your community's access rules, not the other way around.",
      ],
      [
        "shield",
        "Know who's on site",
        "Named, screened staff and assigned jobs provide a clearer security handover.",
      ],
      [
        "gift",
        "An invitation, made simple",
        "Share the resident booking link and agreed service information.",
      ],
      [
        "pin",
        "Respect for your space",
        "Outdoor-only service in approved areas. No entry into private homes.",
      ],
    ],
    process: [
      [
        "Agree the ground rules",
        "Define approved wash areas, access procedures and available time windows.",
      ],
      [
        "Welcome your residents",
        "Share your estate's booking link and communicate the agreed service prices.",
      ],
      [
        "Coordinate the morning",
        "View on-site professionals and follow progress for the estate run.",
      ],
      [
        "Keep the community informed",
        "Review aggregate activity, flag incidents and use monthly reporting.",
      ],
    ],
    featureTitle: "A calmer morning starts with a little coordination.",
    featureText:
      "Give security a named team and residents a clear window. Estate managers see community activity without gaining access to private payment details.",
    featureItems: [
      "Approved access and outdoor wash areas",
      "Resident invitations and service notices",
      "On-site staff visibility",
      "Incident reporting and monthly summaries",
    ],
    faq: [
      [
        "Can staff enter residents' homes?",
        "No. Work is limited to approved outdoor vehicle locations. Staff never enter private indoor premises.",
      ],
      [
        "Does an estate manager see resident payments?",
        "No. The estate view is designed around access and aggregate activity, not residents' private payment or vehicle histories.",
      ],
      [
        "What happens if the weather changes?",
        "Unsafe conditions can lead to a rescheduled wash window. Operations coordinates changes and communication.",
      ],
    ],
  },
  careers: {
    role: "Washman" as Role,
    eyebrow: "A CAREER IN CARE",
    title: "Good hands.",
    accent: "Great possibilities.",
    description:
      "Do work you can stand behind. Join a professional vehicle-care team with clear assignments, a guided workday and evidence that gives your effort a record.",
    action: "Start your application",
    label: "PRIDE IN EVERY DETAIL",
    benefits: [
      [
        "calendar",
        "A clear assignment",
        "Dispatch assigns your jobs. You never need to compete for customer requests.",
      ],
      [
        "shield",
        "Proof that protects",
        "GPS, plate scans and customer verdicts connect your work to the right vehicle.",
      ],
      [
        "help",
        "Support within reach",
        "Raise access, weather or safety issues through the assigned-job workflow.",
      ],
      [
        "star",
        "Professional standards",
        "Screening, outdoor-only conduct and registered-device security set the tone.",
      ],
    ],
    process: [
      [
        "Introduce yourself",
        "Begin your application and supply identification and guarantor details.",
      ],
      [
        "Complete screening",
        "Operations reviews the required records before activating staff access.",
      ],
      [
        "Prepare your device",
        "Use your approved staff identity and registered device to begin a shift.",
      ],
      [
        "Make every job count",
        "Follow arrival, evidence and verdict steps before final submission.",
      ],
    ],
    featureTitle: "Your work has a standard. And a story.",
    featureText:
      "A guided job journey helps you know exactly what comes next. When something is unsafe or unclear, report it rather than skipping a required step.",
    featureItems: [
      "Central job assignment",
      "Guided plate and photo evidence steps",
      "GPS limited to assigned work",
      "Clear incident and conduct guidance",
    ],
    faq: [
      [
        "Can I choose my own customers?",
        "No. The company centrally assigns jobs to approved professionals.",
      ],
      [
        "When does location tracking begin?",
        "Staff tracking begins at assigned-job acceptance and ends at clock-out. It is not intended to track your private time.",
      ],
      [
        "Does applying activate my account?",
        "No. Operations must review all required screening records and approve the device before production access is activated.",
      ],
    ],
  },
  operations: {
    role: "Super admin" as Role,
    eyebrow: "GO-WASH OPERATIONS",
    title: "Every moving part.",
    accent: "One clear standard.",
    description:
      "A dedicated entrance for the people behind the promise. Coordinate assignments, review exceptions and keep finance, support and field teams working from the same record.",
    action: "Sign in to operations",
    label: "CARE, ORCHESTRATED",
    benefits: [
      [
        "calendar",
        "Dispatch with purpose",
        "Assign approved staff to bookings and keep the day's routes accountable.",
      ],
      [
        "shield",
        "Review the exceptions",
        "Untreated verdicts and mismatched evidence need an auditable decision.",
      ],
      [
        "card",
        "Keep payments clear",
        "Review invoices and reconciliation with a dedicated finance perspective.",
      ],
      [
        "help",
        "Close the loop",
        "Connect customer concerns to the job, its evidence and its outcome.",
      ],
    ],
    process: [
      [
        "An approved invitation",
        "A super admin creates operations access with an agreed role.",
      ],
      [
        "Your own perspective",
        "Dispatch, finance and support each have focused workspaces.",
      ],
      [
        "Evidence before decisions",
        "Review location, plate and verdict signals before releasing exceptions.",
      ],
      [
        "An accountable record",
        "Administrative actions require a reason and remain auditable.",
      ],
    ],
    featureTitle: "Not more dashboards. Better decisions.",
    featureText:
      "Job closure is a verification decision, not a cosmetic status change. Backend permission checks and append-only records are required before launch.",
    featureItems: [
      "Role-specific operations views",
      "Screening and registered-device review",
      "Evidence-led exception handling",
      "Reasoned administrative actions",
    ],
    faq: [
      [
        "Can anyone register as an administrator?",
        "No. Operations access is invitation-only and cannot be granted through public registration.",
      ],
      [
        "Can an Untreated job close normally?",
        "No. It is disputed and frozen for operations review. An administrative release requires a reason and an audit record.",
      ],
      [
        "Are these workspaces connected to production?",
        "Not yet. This is a frontend prototype using sample data, not live authentication or permission enforcement.",
      ],
    ],
  },
} as const

export type AudiencePage = keyof typeof audiences
export const careServices = [
  {
    name: "Essential Wash",
    price: "5,000",
    time: "35–45 min",
    tag: "THE EVERYDAY RESET",
    text: "A fresh exterior, clear glass and a thoughtful wheel finish. The simple way to keep your everyday car looking cared for.",
    items: [
      "Exterior hand wash",
      "Wheel clean",
      "Glass finish",
      "Three-proof verification",
    ],
  },
  {
    name: "Signature Wash",
    price: "8,500",
    time: "60–75 min",
    tag: "INSIDE. OUTSIDE. ALL SET.",
    text: "Your everyday favourite, with more attention inside. An exterior refresh meets interior vacuuming, dashboard care and tyre dressing.",
    items: [
      "Everything in Essential",
      "Interior vacuum",
      "Dashboard care",
      "Tyre dressing",
    ],
  },
  {
    name: "Premium Detail",
    price: "18,000",
    time: "100–120 min",
    tag: "THE WHOLE GLOW",
    text: "For the moments your vehicle deserves a little more. Deeper interior attention, protective wax and careful finishing in the details.",
    items: [
      "Deep interior clean",
      "Premium wax protection",
      "Detailed trim care",
      "Complete finishing",
    ],
  },
] as const
export const journalArticles = [
  {
    slug: "three-proofs",
    category: "THE GO-WASH STANDARD",
    title: "What does a verified wash actually mean?",
    intro: "Clean is what you see. Verification is the record behind it.",
    sections: [
      [
        "Right place",
        "A GPS trail records travel and work at the assigned location. Tracking belongs to the job, not the washman's personal time.",
      ],
      [
        "Right vehicle",
        "The registered number plate is scanned at arrival and again at final submission. A mismatch needs review, not a workaround.",
      ],
      [
        "Your say",
        "The customer or named confirmer records a TREATED verdict. Treated and not pleased raises a quality complaint; Untreated freezes the job for review.",
      ],
    ],
  },
  {
    slug: "wash-morning",
    category: "COMMUNITY CARE",
    title: "A better estate wash morning starts before arrival.",
    intro: "A little preparation makes more space for a calmer community.",
    sections: [
      [
        "Choose the right space",
        "Agree a safe, accessible outdoor wash area. Keep pedestrian routes and access lanes clear.",
      ],
      [
        "Make the window clear",
        "Tell residents when the team is expected, which areas are approved and how to book.",
      ],
      [
        "Give security a clear handover",
        "Named, screened staff and an agreed access procedure help the estate team know who should be on site.",
      ],
    ],
  },
  {
    slug: "car-care",
    category: "A LITTLE EVERYDAY CARE",
    title: "Keep the fresh feeling between washes.",
    intro: "Small habits can make a cared-for vehicle feel better for longer.",
    sections: [
      [
        "Less clutter, more calm",
        "Remove everyday litter and loose personal items regularly. Before a booked wash, make the approved outdoor vehicle location accessible.",
      ],
      [
        "Give glass a little attention",
        "Clear visibility matters. Choose suitable automotive products and follow your vehicle manufacturer's care guidance.",
      ],
      [
        "Build a routine that fits",
        "Book care around where your vehicle already parks. A convenient routine is easier to keep than another detour.",
      ],
    ],
  },
] as const
