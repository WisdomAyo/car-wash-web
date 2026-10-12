import type { Metadata, Viewport } from "next"
import { Suspense, type ReactNode } from "react"
import "./globals.css"
import { NavigationProvider } from "@/components/layout/NavigationProvider"
import AppShell from "@/components/layout/AppShell"

export const metadata: Metadata = {
  title: "Go-Wash · Mobile car care across Nigeria",
  description:
    "Nigeria's premium mobile car care service. On-demand and recurring vehicle washing with GPS verification and proof.",
  icons: {
    icon: "/favicon.ico",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;550;600;650;700&family=Plus+Jakarta+Sans:wght@400;500;600;650;700;750;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Suspense fallback={null}>
          <NavigationProvider>
            <AppShell>{children}</AppShell>
          </NavigationProvider>
        </Suspense>
      </body>
    </html>
  )
}
