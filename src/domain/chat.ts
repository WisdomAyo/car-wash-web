export type ChatMessage = {
  id: number
  author: "customer" | "guide"
  text: string
}

export const chatTopics = [
  "Book a wash",
  "Track my booking",
  "Services & pricing",
  "Where do you wash?",
]

/** Local demo replies only; never imply an agent, live booking, or backend connection. */
export function getChatReply(text: string) {
  if (/price|cost|service|pricing/i.test(text))
    return "Our demo menu starts with Essential Wash at ₦5,000, Signature Wash at ₦8,500, and Premium Detail at ₦18,000. Open Services & pricing for the full details."
  if (/track|booking|status|late/i.test(text))
    return "In your customer workspace, open My bookings and select Track wash. This prototype shows sample progress, not a live professional's location."
  if (/where|location|coverage|nigeria|state/i.test(text))
    return "Go-Wash is designed for locations across Nigeria, at home and at work. Service is outdoors only. Actual availability will need confirmation once the live service is connected."
  if (/book|wash/i.test(text))
    return "Choose Book a wash in your customer workspace, then select your vehicle, service, outdoor location, and time. You can explore the demo now; it does not place a real booking."
  return "Thanks for sharing. This is a demo care guide, so messages aren't sent to support. For contact options, use Talk to our team below. Please don't share passwords, payment details, or sensitive information here."
}
