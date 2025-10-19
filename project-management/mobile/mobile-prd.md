# PeakFlow Mobile PRD (Expo)

## Document Metadata
- Last updated: 2025-10-17
- Source alignment: `current-prompt.md`, `project-management/modernization-roadmap.md`
- Prepared for: PeakFlow mobile feasibility and Expo implementation kickoff

## Vision
Deliver a focused mobile companion experience that extends PeakFlow’s financial management capabilities to on-the-go users. The app must surface the most actionable insights from the web platform—authenticate securely, show account status at a glance, and highlight cash position health—while laying groundwork for richer workflows such as company switching, approvals, and transaction review.

## Quick Win Scope (Phase 0)

### QW1 — Authentication Foundation
- **Source**: `src/app/login/page.tsx:1`, `src/app/signup/page.tsx:1`, `src/app/reset-password/page.tsx:1`, `src/contexts/AuthContext.tsx:1`, `src/lib/firebase/sms-service.ts:1`
- **Value**: Reuse existing validation, persistence rules, and Firebase interactions to stand up email/password, Google SSO, and SMS-assisted password reset on mobile.
- **Expo Adaptation**
  - Replace DOM-only logic (`document.getElementById`) with controlled component state.
  - Swap `react-hot-toast` notifications for a React Native alternative (`expo-router` `useLocalSearchParams` with `ToastAndroid`/`expo-notifications`).
  - Implement Firebase Auth persistence via `setPersistence` with `getReactNativePersistence` (`@react-native-async-storage/async-storage`).
  - Google SSO requires `expo-auth-session` + `signInWithCredential` (no `signInWithPopup` on native).
  - SMS reset flow will need a native-friendly code entry UI and integration with the eventual SMS provider; Firestore-backed rate limiting can be reused as-is.

### QW2 — Access Gating & Empty States
- **Source**: `src/components/auth/ProtectedRoute.tsx:1`, `src/app/no-company/page.tsx:1`, `src/app/unauthorized/page.tsx:1`
- **Value**: Consistent handling of role checks and company assignment ensures mobile respects the same access contracts as the web app.
- **Expo Adaptation**
  - Port guard logic into a hook (`useProtectedRoute`) to replace Next.js router redirects with `expo-router` stack navigation.
  - Convert the `No Company` and `Access Denied` screens into RN views with shared typography and CTA components.
  - Centralize toast/alert handling so authorization errors surface through a single native notification channel.

### QW3 — Dashboard Overview & Quick Actions
- **Source**: `src/app/dashboard/page.tsx:1`
- **Value**: Present user identity, company association, and role-driven shortcuts immediately after sign-in, matching the web experience.
- **Expo Adaptation**
  - Translate layout to a `ScrollView` with reusable card components; rely on design tokens instead of Tailwind utility classes.
  - Replace `Link` navigation targets with `expo-router` links or imperative navigation actions.
  - Adjust quick actions—for mobile, deep link to authentication settings, company directory, or upcoming approvals view.
  - Add offline-safe fallbacks for profile data by caching the `AuthContext` payload with Async Storage.

### QW4 — Cash Position Snapshot
- **Source**: `src/components/cash-flow/CashPositionCard.tsx:1`, `src/types/accounting/cash-flow.ts` (metrics contract)
- **Value**: A high-signal widget that shows available cash, pending balances, and currency breakdowns. Ideal for carriers who need fast insights.
- **Expo Adaptation**
  - Rebuild the card using RN components with conditional styling and iconography from `lucide-react-native` or `expo/vector-icons`.
  - Format currency with `Intl.NumberFormat` polyfill (`intl` package) to mirror web formatting.
  - Gate optional breakdown sections behind collapsible accordions to conserve vertical space.
  - Provide skeleton states using `expo-linear-gradient` or placeholder rectangles.

### QW5 — Camera-first Payables Capture
- **Source**: `src/types/accounting/vendor-bill.ts:6`, `src/lib/accounting/pending-payment-service.ts:356`, `project-management/phase-2-ap-simple-permissions.md:129`
- **Value**: Let SMEs snap supplier invoices, petty cash slips, and adhoc expense bills so AP stays current without desktop entry.
- **Expo Adaptation**
  - Use `expo-camera` / `expo-document-scanner` for capture, plus file picker for forwarded PDFs.
  - Preprocess on device (crop, orientation fix) then send to Document AI pipeline for data extraction.
  - Map extracted data into a vendor-bill draft (supplier lookup, expense GL suggestion) aligned with the vendor bill types.
  - Queue drafts offline with Expo Task Manager so payables sync once online; allow manual corrections before posting to ledger.

## MVP Feature Set (Phase 1 After Quick Wins)
1. **Company Switcher & Context** — lightweight list of assigned companies with status badges, backed by the same Firestore queries used in the dashboard.
2. **Activity Feed Lite** — surfaced alerts for cash anomalies, pending approvals, or reconciliations (leveraging existing toast texts as seed content).
3. **Contact Directory Read-Only** — expose debtor and supplier key contacts using `PrimaryContactForm` and `FinancialContactsManager` data models in view-only mode.
4. **AI Assistant Inbox (Optional)** — embed a trimmed version of `AIAssistantChat` for quick Q&A, deferring heavy PDF actions.

## Future Enhancements (Phase 2+)
- Cash flow forecasting charts and alerts (`src/components/cash-flow/*`).
- Bank statement upload stubs (mobile capture + web processing handoff).
- Approval workflows for invoices and contracts.
- Push notifications for threshold breaches and new assignments.

## Technical Considerations
- **Navigation**: Adopt `expo-router` for file-based routing and guard wrappers that mirror `ProtectedRoute`.
- **Styling**: Choose a RN UI kit (e.g., Tamagui or NativeWind), map Tailwind utility intent to tokens, and expose light/dark variants through a shared theme object.
- **State Management**: Lift `AuthContext` into a cross-platform provider, adding Async Storage hydration and deprecating browser-specific persistence.
- **Firebase**: Confirm Expo native Firebase support (use `@react-native-firebase` or modular web SDK with compatibility layer). Update `firebase/config.ts` to avoid direct DOM assumptions.
- **Notifications**: Replace `react-hot-toast` with native-friendly toast/snackbar primitives; consolidate alert copy for reuse.
- **Testing**: Define an initial Jest + React Native Testing Library harness and lightweight detox/E2E lanes for auth flows.
- **Performance & Offline**: Cache last-known cash metrics and dashboard payloads; design for intermittent connectivity.

## Success Criteria & KPIs
- Users authenticate (email + Google) and land on dashboard in <8 seconds on mid-tier Android hardware.
- Cash position card renders with parity data to web within one refresh cycle (<30 seconds after API availability).
- Role and company gating produces correct screens 100% of the time during pilot.
- Less than 5% crash-free session drop compared to baseline Expo template during beta.

## Open Questions & Risks
1. What SMS provider will back the mobile reset flow at launch? (Current implementation stores codes in Firestore only.)
2. Should the mobile dashboard include approval actions, or remain read-only for the first release?
3. Are there compliance constraints for caching financial data on device storage?
4. Does the AI assistant need voice input or push notifications in the initial scope?

## References
- `current-prompt.md`
- `project-management/modernization-roadmap.md`
- `custom-memory.md`
- `src/lib/firebase/config.ts:1`
- `src/components/ui/*` (audit for cross-platform parity)
