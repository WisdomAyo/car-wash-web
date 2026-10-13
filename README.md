# Go-Wash web

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4.

```bash
npm install
npm run dev          # http://localhost:3000
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
    auth/                  Sign-in screens (demo flow)
    customer/              Driver verdict link and the customer workspace demo
    workspace/             "Not connected yet" page for screens that need the backend
    partners/              Corporate and estate portal
    support/               Customer-care chat
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

## Known limits

- **No backend is connected.** Supabase was removed. `/account` and the staff workspaces (washman, dispatcher,
  finance, support, super admin) show the "not connected yet" page, and sign-in is a demo flow. The Laravel
  API in `../api` is the intended backend; wire it in through a small API client plus a query library, then
  replace `features/workspace/NotConnected.tsx` with the real screens.
- The customer, corporate and estate workspaces are sample-data prototypes and need no sign-in.
- The workspace dock (`components/layout/ExperienceDock.tsx`) is a prototype navigation aid, not access control.
