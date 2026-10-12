import type { LagosLocation } from "./lagosScene"

export type TourLocation = LagosLocation | "marina" | "mainland"
export const TOUR_DURATION = 20_000
export const lagosTour = [
  {
    location: "lekki",
    kind: "landmark",
    duration: 3_000,
    title: "Lekki–Ikoyi Link Bridge",
    label: "THE CITY, CONNECTED",
    description:
      "A fan of cables over the lagoon. A familiar silhouette, a fresh beginning.",
    light: "day",
    detail:
      "An illustrated interpretation of the cable-stayed Lekki–Ikoyi Link Bridge, not an exact architectural model.",
  },
  {
    location: "ikoyi",
    kind: "home",
    duration: 4_000,
    title: "Outdoor care at home",
    label: "YOUR MORNING, UNINTERRUPTED",
    description:
      "A screened professional rinses your vehicle in an approved outdoor driveway.",
    light: "day",
    detail: "An illustrated residential wash, not live service evidence.",
  },
  {
    location: "ikoyi",
    kind: "landmark",
    duration: 2_000,
    title: "Ikoyi, along the lagoon",
    label: "ROOM TO BREATHE",
    description:
      "Waterside streets, leafy corners and a softer side of the island.",
    light: "day",
    detail:
      "Inspired by Ikoyi's lagoon edges and residential greenery. The homes are stylised, not named addresses.",
  },
  {
    location: "victoria",
    kind: "office",
    duration: 4_000,
    title: "A fresh finish at work",
    label: "CARE WHILE YOU KEEP YOUR PLANS",
    description: "Careful finishing in an approved outdoor office car park.",
    light: "day",
    detail: "An illustrated office-parking wash, not live service evidence.",
  },
  {
    location: "victoria",
    kind: "landmark",
    duration: 2_000,
    title: "Victoria Island",
    label: "THE WORKDAY, IN MOTION",
    description:
      "Waterfront towers. Island energy. A city that keeps finding its next rhythm.",
    light: "day",
    detail:
      "A stylised waterfront skyline inspired by Victoria Island, rather than a model of specific towers.",
  },
  {
    location: "marina",
    kind: "landmark",
    duration: 2_000,
    title: "Marina & Tafawa Balewa Square",
    label: "THE HEART OF THE STORY",
    description:
      "Lagos Island's waterfront meets a square woven into the city's history.",
    light: "evening",
    detail:
      "Marina and Tafawa Balewa Square are combined in an editorial scene, with simplified horse sculptures inspired by the square's entrance. This is not a geographic map.",
  },
  {
    location: "mainland",
    kind: "landmark",
    duration: 3_000,
    title: "Third Mainland Bridge",
    label: "ONE CITY. MANY CONNECTIONS.",
    description:
      "A long sweep over the lagoon, connecting the island to the mainland.",
    light: "evening",
    detail:
      "An illustrated interpretation of Third Mainland Bridge's long concrete spans over the Lagos lagoon. No live traffic or route data is shown.",
  },
] as const

export function tourFrame(elapsed: number) {
  const time = Math.max(0, Math.min(TOUR_DURATION, elapsed))
  let start = 0
  for (let index = 0; index < lagosTour.length; index++) {
    const shot = lagosTour[index]
    if (time < start + shot.duration || index === lagosTour.length - 1) {
      return { index, progress: Math.min(1, (time - start) / shot.duration) }
    }
    start += shot.duration
  }
  return { index: 0, progress: 0 }
}

export function tourShotStart(index: number) {
  return lagosTour
    .slice(0, index)
    .reduce((time, shot) => time + shot.duration, 0)
}
