/** Sample data and menus for the corporate and estate partner portals (prototype content). */

import type { PartnerRole } from "@/lib/roles"

export type Job = {
  id: string
  vehicle: string
  plate: string
  area: string
  time: string
  service: string
  staff: string
  status: string
}
export const initialJobs: Job[] = [
  {
    id: "GW-1048",
    vehicle: "Mercedes-Benz C300",
    plate: "LND 482 JK",
    area: "Lekki Phase 1",
    time: "10:00 AM",
    service: "Signature Wash",
    staff: "Emeka Okafor",
    status: "On the way",
  },
  {
    id: "GW-1049",
    vehicle: "Lexus RX350",
    plate: "EKY 203 AJ",
    area: "Victoria Island",
    time: "10:30 AM",
    service: "Premium Detail",
    staff: "Unassigned",
    status: "Booked",
  },
  {
    id: "GW-1050",
    vehicle: "Toyota Corolla",
    plate: "AAA 618 KT",
    area: "Parkview Estate",
    time: "11:00 AM",
    service: "Essential Wash",
    staff: "David Akin",
    status: "Washing",
  },
  {
    id: "GW-1051",
    vehicle: "Range Rover Sport",
    plate: "FST 902 ML",
    area: "Ikoyi",
    time: "11:30 AM",
    service: "Signature Wash",
    staff: "Ibrahim Musa",
    status: "Needs review",
  },
  {
    id: "GW-1052",
    vehicle: "Toyota Camry",
    plate: "KJA 715 FC",
    area: "Meridian office",
    time: "12:00 PM",
    service: "Signature Wash",
    staff: "Emeka Okafor",
    status: "Ready",
  },
  {
    id: "GW-1053",
    vehicle: "Honda Accord",
    plate: "LSD 441 GR",
    area: "Parkview Estate",
    time: "1:00 PM",
    service: "Essential Wash",
    staff: "David Akin",
    status: "Verified",
  },
]

/** The professionals on site for the estate run. */
export const staffList = [
  {
    name: "David Akin",
    id: "GW-031",
    zone: "Ikoyi",
    initials: "DA",
    rating: "4.8",
    jobs: 192,
    status: "On a job",
    verified: 6,
  },
  {
    name: "Ibrahim Musa",
    id: "GW-018",
    zone: "Victoria Island",
    initials: "IM",
    rating: "4.9",
    jobs: 310,
    status: "Available",
    verified: 6,
  },
]

type MenuGroup = {
  group: string
  pages: string[]
}
export const menus: Record<PartnerRole, MenuGroup[]> = {
  Corporate: [
    {
      group: "YOUR FLEET",
      pages: [
        "Fleet overview",
        "Vehicles",
        "Wash schedule",
        "Active washes",
        "Wash records",
      ],
    },
    {
      group: "YOUR ORGANISATION",
      pages: [
        "Team & confirmers",
        "Plan & invoices",
        "Reports",
        "Account settings",
      ],
    },
  ],
  Estate: [
    {
      group: "YOUR COMMUNITY",
      pages: [
        "Estate overview",
        "Wash windows",
        "On-site team",
        "Resident access",
      ],
    },
    {
      group: "ESTATE CARE",
      pages: ["Incidents", "Monthly report", "Estate settings"],
    },
  ],
}
export const menuIcon = (
  page: string,
): "grid" | "calendar" | "pin" | "shield" | "car" | "card" | "help" | "gift" =>
  /Overview|overview|day|summary|Reports|report/.test(page)
    ? "grid"
    : /jobs|Job|job|wash|Wash|Booking|schedule|windows/.test(page)
      ? "calendar"
      : /Live|On-site|Estate/.test(page)
        ? "pin"
        : /screening|Screening|Roles|Audit|records/.test(page)
          ? "shield"
          : /vehicles|Vehicles|Customers/.test(page)
            ? "car"
            : /invoice|Payments|Plan/.test(page)
              ? "card"
              : /access|Team|People|accounts/.test(page)
                ? "gift"
                : "help"
export const people: Record<
  PartnerRole,
  {
    name: string
    initials: string
    company: string
    greeting: string
  }
> = {
  Corporate: {
    name: "Ngozi Eze",
    initials: "NE",
    company: "Meridian Holdings",
    greeting: "Every vehicle. One less worry.",
  },
  Estate: {
    name: "Adewale Johnson",
    initials: "AJ",
    company: "Parkview Estate",
    greeting: "A fresher day for your community.",
  },
}
