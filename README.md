# Go-Wash web

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4.

```bash
npm install
npm run dev          # http://localhost:3000 (set NEXT_PUBLIC_API_URL in .env.local, e.g. http://localhost:8000/api/v1)
npm run build && npm start
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run format       # Prettier (src/**/*.{ts,tsx})
```

## How it is organised

```
src/
  app/                     Routes only. Each page is a few lines: metadata + a feature component.
    (marketing)/           Public site. layout.tsx supplies the header, footer and "explore" grid once.
    (app)/                 Auth, account, driver verdict link, and role workspaces (no site chrome).
    layout.tsx             Fonts, global CSS, motion preference, floating chat + dock.
    template.tsx           Page-entrance animation (plays on navigation, never on first load).
    error.tsx loading.tsx not-found.tsx
    fonts/                 Self-hosted variable fonts (see "Fonts").
  features/                One folder per product area. Import from here, not across features' internals.
    marketing/             home/ (5 audience pages) · pages/ · components/ · scenes/ (Lagos film) · content/
    auth/                  Sign in, register, recover, email links (real API)
    customer/              Personal space: dashboard, garage, bookings, passport, plans, rewards, dialogs; driver verdict link
    partners/              Corporate and estate portals (fleet hero, shine board, calendar, estate hero, team cards, charts)
    washman/               Washman workspace and applicant onboarding
    admin/                 Operations screens by role (dispatch, finance, support, super admin)
    shared/                Pieces used by several spaces (booking detail, payments, tickets, forms)
    support/               The chat assistant (answers from the help centre, hands over to the team)
  components/              Shared UI: ui/ (Button, ButtonLink, Heading, Input), Brand, Visuals, Motion, layout/
  hooks/  lib/             Small shared helpers (roles + route helpers live in lib/roles.ts)
  styles/                  Global stylesheets (see "Styling")
```

### Conventions

- **Server by default.** A component only gets `"use client"` when it needs state or browser APIs.
  Pages stay static; the interactive part is a small named island (e.g. `CareSelector`, `TermPlanner`).
- **Real links.** Navigate with `ButtonLink` / `<Link>`, never `onClick` + `router.push`, so pages are
  crawlable, prefetched and open in a new tab. Build URLs with the helpers in `lib/roles.ts`
  (`authHref`, `workspaceHref`) instead of string literals.
- **One shell.** Public pages never render their own header/footer; the `(marketing)` layout does.
- **Static where possible.** Dynamic segments declare `generateStaticParams` and `dynamicParams = false`
  (unknown values are a 404). Only `/auth/[mode]` is dynamic, because it reads `?role=`.

## Styling

The look is a set of hand-tuned global stylesheets in `src/styles/` plus Tailwind utilities for newer
screens (`postcss.config.mjs` enables Tailwind). Import order in `app/globals.css` matters.

- Anything that styles the `button` tag is written `:is(button,a)` so the same rule also applies to links.
- `styles/links.css` restores the two button defaults a link lacks (inline-block, shrink-to-fit width).
- If you convert another button to a link and its box changes, check it against that rule first.

## Fonts

Inter and Plus Jakarta Sans are self-hosted as subsetted variable fonts in `src/app/fonts/`
(Latin, common punctuation and the Naira sign `₦`). `next/font/google` was dropped because it declares
every Unicode subset, and one `₦` made the browser download ~100 KB of extra fonts before first paint.
To regenerate or add characters, edit `scripts/subset-fonts.py` and re-run it (instructions inside).

## Talking to the API

Everything signed-in is wired to the Laravel API in `../api` through `src/lib/api/`: `client.ts` (bearer token, error
envelope, idempotency keys), `hooks.ts` (TanStack Query: `useResource`, `useList`, `useAction`), `types.ts`. The session
is kept in the browser (`lib/session.ts`); each space guards itself with `RequireSession`.

Design rule: **the original screens keep their markup and graphics; only the data is real.** The dashboards use the
global `styles/*.css` classes (`.hero`, `.stats-row`, `.water-line`, `.fleet-hero`, …). Screens that had no original
design use the `kit-*` classes in `styles/app-kit.css`, which follow the same look.

Public deep links: `/v/[token]` (one-tap verdict by signed link), `/estate/[code]` (what an estate's QR code opens),
`/confirm` (paste a verdict link), `/pay/return` (after the payment gateway).

## Known limits

- The assistant's Claude call needs `ANTHROPIC_API_KEY` on the API; without it the extractive (no-AI) model answers
  from the help centre, which is what the tests exercise.
- The workspace dock (`components/layout/ExperienceDock.tsx`) is a navigation aid, not access control.
