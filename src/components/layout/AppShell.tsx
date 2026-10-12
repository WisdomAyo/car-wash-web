"use client"

import React, { Suspense, type ReactNode } from "react"
import MotionProvider, { PageTransition } from "@/components/Motion"
import PageErrorBoundary from "@/components/PageErrorBoundary"
import CustomerChat from "@/components/support/CustomerChat"
import ExperienceDock from "./ExperienceDock"
import { useAppNavigation } from "./NavigationProvider"
import { Icon } from "@/components/Visuals"

function FallbackLoading() {
  return (
    <div className="workspace-loading">
      <Icon name="drop" size={35} />
      <h2>A little clarity is on its way.</h2>
      <p>Opening your Go-Wash workspace…</p>
    </div>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { route, navigate } = useAppNavigation()

  return (
    <MotionProvider>
      <PageTransition transitionKey={route}>
        <PageErrorBoundary key={route}>
          <Suspense fallback={<FallbackLoading />}>{children}</Suspense>
        </PageErrorBoundary>
      </PageTransition>

      {route !== "account" && <CustomerChat navigate={navigate} />}
      <ExperienceDock />
    </MotionProvider>
  )
}
