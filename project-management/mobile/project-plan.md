# PeakFlow Mobile Project Plan

## Quick Win Implementation Tracker
| Item | Status | Scope Notes | RN Adaptations | Source | Blockers |
| --- | --- | --- | --- | --- | --- |
| Authentication foundation | Planned | Port login, signup, and reset flows with Firebase auth parity. | Swap DOM refs, add Async Storage persistence, use `expo-auth-session` for Google SSO, replace toast system. | `src/app/login/page.tsx:1`, `src/app/signup/page.tsx:1`, `src/app/reset-password/page.tsx:1`, `src/contexts/AuthContext.tsx:1`, `src/lib/firebase/sms-service.ts:1` | Need decision on native toast library and SMS provider. |
| Access gating & empty states | Planned | Reuse role/company guard and fallback screens. | Convert guards to hooks, re-map redirects and alerts to `expo-router`, restyle pages in RN. | `src/components/auth/ProtectedRoute.tsx:1`, `src/app/no-company/page.tsx:1`, `src/app/unauthorized/page.tsx:1` | Requires navigation architecture choice (`expo-router` vs `react-navigation`). |
| Dashboard overview | Planned | Deliver profile summary, company status, and quick actions. | Card layout via RN components, offline cache for user/company, deep links for quick actions. | `src/app/dashboard/page.tsx:1` | Define mobile-friendly quick action targets. |
| Cash position snapshot | Planned | Render cash metrics, deltas, and breakdowns. | Replace Tailwind gradients with RN styling, adopt compatible icon set, ensure currency formatting polyfills. | `src/components/cash-flow/CashPositionCard.tsx:1`, `src/types/accounting/cash-flow.ts:1` | Need agreement on data refresh cadence and skeleton pattern. |
| Camera-first payables capture | Planned | Capture supplier invoices/petty cash slips, extract data, and create draft vendor bills that sync with AP workflows. | Integrate `expo-camera`/document scanner, run Document AI extraction, map to vendor bill schema, queue offline sync. | `src/types/accounting/vendor-bill.ts:6`, `src/lib/accounting/pending-payment-service.ts:356`, `project-management/phase-2-ap-simple-permissions.md:129` | Confirm OCR pipeline, storage limits, and background upload strategy. |

## Milestones & Tentative Timeline
- **Phase 0 (Weeks 1-2)** — Ship all quick wins behind internal beta flag, integrate crash/error reporting, validate Firebase configuration on Android + iOS simulators.
- **Phase 1 (Weeks 3-5)** — Add company switcher, lightweight activity feed, contact directory read-only view; begin design token extraction for shared component styling.
- **Phase 2 (Weeks 6-8)** — Layer in approvals or AI assistant preview, evaluate bank import handoff UX, prep for public beta with analytics instrumentation.

## Cross-Cutting Modernization Tasks
- **Authentication Layer**: Introduce a platform-neutral auth service that wraps `AuthContext` logic, adding `getReactNativePersistence` and abstracting Google login provider differences.
- **Component Library Audit**: Map `src/components/ui/*` atoms to React Native equivalents. Decide between NativeWind, Tamagui, or React Native Paper for baseline primitives.
- **State & Data**: Define a shared repository pattern for Firebase queries (e.g., `services/mobile` facade) so data fetching is consistent across platforms.
- **Design Tokens**: Extract color, spacing, and typography tokens from Tailwind config for reuse in RN styling.
- **Observability**: Configure Sentry or Expo Crash Reporting plus analytics (Amplitude/Segment) before beta.
- **Testing & CI**: Stand up Jest/RTL for unit coverage, add Detox/E2E smoke tests for auth flow, and integrate Expo Application Services build pipelines.

## Dependencies & Risks
- Google SSO on native requires configuration in Firebase console with iOS/Android client IDs.
- SMS reset flow currently stores codes in Firestore only; production launch needs a provider (Twilio, AWS SNS) and secure secret management.
- Expo build profiles must include environment variables currently supplied via `.env.local`; plan for `app.config.ts` secrets handling.
- Currency formatting relies on `Intl`; install polyfills for older Android runtimes to avoid crashes.
- Lucide icons are web-focused; pick a RN-compatible icon pack early to avoid redesign churn.

## Communication & Reporting
- Weekly status update referencing this tracker.
- Demo checkpoint at end of Phase 0 with instrumentation screenshots and Firebase auth logs.
- Keep `./mobile-prd.md` synchronized with any scope change or dependency resolution.

## Reference Links
- `./mobile-prd.md`
- `current-prompt.md`
- `project-management/modernization-roadmap.md`
- `custom-memory.md`

## Firebase & Auth Notes
- Expo runtime expects Firebase keys to be provided via `EXPO_PUBLIC_FIREBASE_*` variables (configure in `app.json` or via EAS secrets).
- Google SSO on native requires Expo Auth Session + Firebase credential exchange (pending implementation).
- SMS reset for payables capture depends on selecting a provider (Twilio/AWS SNS) and secure secret storage.
