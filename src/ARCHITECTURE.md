# Go-Wash frontend

This is an interactive prototype. UI roles are not security boundaries; authentication,
payment, evidence, dispatch permissions and job closure must be enforced by a backend.
The product reference is the Go-Wash PRD, especially its GPS + two plate scans +
TREATED verdict requirements.

## Boundaries

- `Experience.tsx`: hash routing, workspace selection and application composition.
- `domain/roles.ts`: role names and canonical workspace route generation. Import
  domain types here, not from a screen.
- `pages/home/`: five independently composed customer, business, estate, careers
  and operations homepages. Each owns its hero, sections and interactive state.
  There is no audience-switching homepage template.
- `components/home/`: reusable sections and illustrations, not entire pages.
- `domain/publicContent.ts`: shared audience copy, service data and journal content.
- `pages/public/ContactPage.tsx`, `PrivacyPage.tsx` and `TermsPage.tsx`:
  individual contact and policy routes, with policy copy in `domain/policies.ts`.
- `pages/CarePages.tsx`: composition for services, coverage, trust and journal routes.
  Independent screen components live under `pages/public/`, including separate
  journal index and article files.
- `components/PublicLayout.tsx`: shared public navigation, discovery links and footer.
  Public pages share a shell, not workspace UI.
- `pages/Auth.tsx`: shared authentication layout; configured Supabase uses
  `pages/SupabaseAuth.tsx` for live email-code authentication. The old demonstration
  flow is only used when no Supabase client is configured.
- `pages/CustomerAccount.tsx`: session-gated customer account at `#account`.
  Feature panels in `pages/customer/` persist vehicles, nationwide locations,
  booking requests and support tickets through `lib/customerApi.ts`.
- `supabase/migrations/`: deployable RLS and server-owned request operations.
  These must be applied to the hosted project separately; see `SUPABASE_SETUP.md`.
- `components/ProtectedWorkspace.tsx`: session and database-membership gate for
  every staff, organisation and operations workspace.
- `pages/LiveOperations.tsx`: real staff, dispatch, support and finance job records,
  server transitions, private evidence links and refund approval.
- `lib/evidenceApi.ts`: private uploads, assistive OCR and opt-in foreground GPS.
- `pages/customer/BillingPanel.tsx`: reconciled receipts, refund requests and
  monthly-plan requests (not active recurring subscriptions).
- `lib/accessApi.ts`: read-only access to the signed-in user's approved,
  organisation-scoped memberships.
- `lib/verifiedWashApi.ts`: typed clients for server-owned assignment, GPS,
  evidence, verdict, submission and release transitions.
- `supabase/functions/payments/`: authenticated Paystack checkout initialization.
- `supabase/functions/paystack-webhook/`: raw-body signature verification and
  idempotent payment reconciliation. Provider callbacks never set browser state.
- `tests/customer-database.mjs`: isolated PostgreSQL migration/RLS regression
  checks, run with `node tests/customer-database.mjs`.
- `tests/role-access.mjs`: isolated membership and organisation RLS checks, run
  with `node tests/role-access.mjs`.
- `tests/payment-jobs-database.mjs`: payment and Verified Wash state-machine
  regression checks.
- `tests/paystack-adapter.mjs`: raw-body signature and provider adapter checks.
- `pages/Confirmer.tsx`: delegated customer-verdict experience.
- `App.tsx`: existing customer workspace.
- `components/Portal.tsx`: existing role workspaces and simulated operations.
- `components/Brand.tsx` and `Visuals.tsx`: shared brand, icons and vehicle assets.
- `components/ui/`: small semantic UI primitives; extend these rather than adding
  another component library.
- `components/support/CustomerChat.tsx`: persistent customer-care panel; local
  demo replies live in `domain/chat.ts`. No support messages are transmitted.
- `components/navigation/`: public sidebar and workspace dismissal controls.
  `hooks/useDismissiblePanel.ts` owns focus trapping, Escape and scroll locking.
- `domain/portalConfig.ts`: workspace menu definitions, demo people and jobs,
  separate from the portal's state and interaction handlers.
- `interactions.css`: chat and sidebar presentation plus the illustration-free
  auth layout. `responsive.css` remains the shared responsive layout layer.

The customer and portal modules remain candidates for incremental feature-level
extraction. Keep their state owners stable while extracting views; changing a page
must not silently erase bookings, evidence steps or edits.

## Motion

`MotionProvider` is the single owner of decorative-animation preferences.
`PageTransition` uses the native Web Animations API, cancels animations on cleanup,
and does not remount children to animate them. Workspace state is preserved.
`VehicleScene` is an illustrated story, not simulated verification evidence.
Its chapter timer stops when paused or reduced motion is requested.

`VehicleScene` delegates to the label-free `LagosFilm.tsx` pane via
`LagosHeroScene.tsx`. Landmark geometry lives in `LagosBackdrop.tsx`.
The bridge, lagoon and skyline are stylised inspiration, not an accurate map or
service boundary.

The hero is `LagosFilm.tsx`: a silent, automatically looping 20-second illustrated tour,
not recorded footage. `domain/lagosTour.ts` defines seven variable-length chapters:
five landmarks plus outdoor home and office washes, totalling 20 seconds.
`useTourPlayback` advances a monotonic clock only while motion is enabled, the
pane is in view, and the browser tab is visible. The pane has no visible labels,
menus or playback controls; the shared global motion preference still pauses it.
`LagosLandmarks.tsx` supplies the distinct Marina/TBS and Third Mainland Bridge
artwork. Keep the landmark tour separate from actual pilot service coverage.

`CarWashScene.tsx` owns the outdoor wash illustrations, with animated working
arms, water and foam. `LagosTraffic.tsx` supplies moving road and bridge vehicles.
Inactive scenes pause their local animations. The unlabelled pane can advance
on tap/click or Enter/Space/arrow keys, with pointer parallax on fine-pointer
devices. All film motion remains controlled by the shared pause preference.

`public-pages.css` adds audience illustrations, editorial imagery and public-page
motion. All decorative motion remains governed by the shared pause control.
Pilot maps, plan previews and sample care records are illustrative, not live data.

`homepages.css` owns the readable public type scale and distinct homepage layouts.
`readability.css` increases existing workspace and authentication text without
scaling their layouts. Keep small annotation text secondary, not essential reading.
Editorial photos are served locally from `public/images/` to avoid broken remote
image requests; retain their on-page photographer credits.

`motion.css` owns shared motion durations, easing, illustration palette and
responsive motion styles. The existing navy/aqua variables from `index.css` are
the source of brand colors. Prefer opacity and transforms, avoid layout animation,
and always retain a usable static state. All SVG definitions must use unique IDs
when multiple instances can appear on one page.

## Working on the app

The host already runs Vite; do not start another server.

- Production validation: `pnpm build`
- Type validation: `pnpm exec tsc --noEmit`
- Formatting: `pnpm format <changed files>`

Smoke-test the public routes, authentication, each workspace, customer navigation,
illustration controls, mobile layout and reduced-motion behavior when changing
shared infrastructure. Never treat illustrative evidence as actual proof.
