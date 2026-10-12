"use client"

import React from "react"
import { Icon } from "@/components/Visuals"
import Button from "@/components/ui/Button"
import { roles, operationsRoles, type Role } from "@/domain/roles"
import { useAppNavigation } from "./NavigationProvider"

export default function ExperienceDock() {
  const { route, navigate, workspace, explorer, setExplorer } =
    useAppNavigation()

  // Hide dock on account page to match original Experience.tsx behavior
  if (route === "account") return null

  return (
    <>
      <div className="experience-dock">
        <Button onClick={() => navigate("account")}>My account</Button>
        <button
          className="dock-home"
          onClick={() => navigate("home")}
          aria-label="Public homepage"
        >
          <Icon name="drop" size={16} />
        </button>
        <button onClick={() => setExplorer(!explorer)}>
          <span className="dock-dot" /> Explore workspaces{" "}
          <Icon name="chevron" size={13} />
        </button>
      </div>

      {explorer && (
        <div className="role-explorer">
          <div className="explorer-heading">
            <div>
              <small>THE GO-WASH EXPERIENCE</small>
              <h3>One promise. Every perspective.</h3>
            </div>
            <button
              onClick={() => setExplorer(false)}
              aria-label="Close workspace menu"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <p>
            Explore the interactive prototype. These role switches are for
            demonstration, not production access control.
          </p>
          {roles.map((r, i) => (
            <button
              className="explorer-role"
              key={r}
              onClick={() => {
                workspace(r)
                setExplorer(false)
              }}
            >
              <span className="explorer-icon">
                <Icon
                  name={
                    i === 0
                      ? "car"
                      : i === 1
                        ? "drop"
                        : i === 2
                          ? "card"
                          : i === 3
                            ? "pin"
                            : "shield"
                  }
                />
              </span>
              <span>
                <strong>
                  {r === "Washman" ? "Washman & field staff" : r}
                  <small>
                    {
                      [
                        "Book, track and confirm your care",
                        "Assigned jobs, guided proof and shift summary",
                        "Fleet scheduling, confirmers and invoices",
                        "Wash windows, on-site teams and residents",
                        "Dispatch, evidence, screening and finance",
                      ][i]
                    }
                  </small>
                </strong>
              </span>
              <Icon name="arrow" size={17} />
            </button>
          ))}
          <div className="operations-role-links">
            <small>OPERATIONS STAFF</small>
            <div>
              {operationsRoles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    workspace(r)
                    setExplorer(false)
                  }}
                >
                  {r}
                  <Icon name="arrow" size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className="explorer-links">
            <button
              onClick={() => {
                navigate("auth/login")
                setExplorer(false)
              }}
            >
              Authentication flows
            </button>
            <button
              onClick={() => {
                navigate("confirm")
                setExplorer(false)
              }}
            >
              Driver verdict link
            </button>
          </div>
        </div>
      )}
    </>
  )
}
