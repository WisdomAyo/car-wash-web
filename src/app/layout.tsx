import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import type { ReactNode } from "react"
import "./globals.css"
import MotionProvider from "@/components/Motion"
import FloatingChrome from "@/components/layout/FloatingChrome"
import Providers from "@/components/app/Providers"

// Self-hosted, subsetted variable fonts (Latin + the Naira sign): see scripts/subset-fonts.py.
// Weights are a continuous range, so the fractional weights in the stylesheets (450, 550, 650,
// 750) render exactly. Nothing is fetched from Google and nothing extra loads for `₦`.
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  weight: "400 800",
  display: "swap",
})
const jakarta = localFont({
  src: "./fonts/plus-jakarta-sans-latin.woff2",
  variable: "--font-jakarta",
  weight: "400 800",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Go-Wash · Mobile car care across Nigeria",
    template: "%s · Go-Wash",
  },
  description:
    "Nigeria's premium mobile car care service. On-demand and recurring vehicle washing with GPS verification and proof.",
  // Prototype: keep out of search results until launch.
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0b1f3a",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body>
        <MotionProvider>
          <Providers>
            {children}
            <FloatingChrome />
          </Providers>
        </MotionProvider>
      </body>
    </html>
  )
}
