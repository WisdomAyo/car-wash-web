export const lagosLocations = {
  lekki: {
    name: "Lekki",
    landmark: "The bridge-side rhythm",
    description:
      "A bridge silhouette, lagoon breeze and residential streets. A little care, close to your everyday routine.",
    setting: "Home & estate parking",
    detail:
      "Inspired by the Lekki–Ikoyi Link Bridge: its tall central pylon and fan of cables make an unmistakable part of the Lagos skyline.",
  },
  ikoyi: {
    name: "Ikoyi",
    landmark: "A quieter corner of the island",
    description:
      "Leafy streets, waterside homes and outdoor parking. Thoughtful care without another trip across town.",
    setting: "Approved residential spaces",
    detail:
      "Ikoyi's lagoon edges and leafy residential streets inspire this view. The illustrated homes are a setting, not named service addresses.",
  },
  victoria: {
    name: "Victoria Island",
    landmark: "The city, at your pace",
    description:
      "Waterfront towers and a busy workday. Let your car get a fresh start while you keep your plans.",
    setting: "Office & residential car parks",
    detail:
      "Victoria Island's waterfront and high-rise silhouette inspire the skyline. The buildings are stylised, not exact architectural or geographic models.",
  },
} as const

export type LagosLocation = keyof typeof lagosLocations
export const locationKeys: LagosLocation[] = ["lekki", "ikoyi", "victoria"]
export const washChapters = [
  {
    name: "Arrive",
    icon: "pin",
    title: "Care comes to your corner.",
    text: "A screened professional. An approved outdoor space.",
  },
  {
    name: "Care",
    icon: "drop",
    title: "A little Lagos shine.",
    text: "Thoughtful vehicle care while you keep your day.",
  },
  {
    name: "Review",
    icon: "shield",
    title: "Your car. Your final say.",
    text: "GPS, two plate scans and your TREATED verdict are required.",
  },
] as const
