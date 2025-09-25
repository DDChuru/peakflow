# Phase 1 – Component Audit

## Global Structure
- `app/layout.tsx` wraps every route in `AuthProvider` and `react-hot-toast`'s `Toaster`; the layout is currently a client component and imports `app/globals.css` directly.
- Authentication, company context, and role checks come from `src/contexts/AuthContext.tsx`; route protection is handled per page with `ProtectedRoute` from `src/components/auth/ProtectedRoute.tsx`.
- Core UI primitives live under `src/components/ui/` (button, card, badge, input, skeleton, navigation), while feature-specific pieces live under `src/components/<domain>/` (e.g. `bank-statement` widgets).
- Firebase-facing service classes are colocated under `src/lib/firebase/` (e.g. `admin-service`, `companies-service`, `bank-statement-service`) and are the primary data sources for the pages.
- There are two parallel `app` trees (`app/` and `src/app/`), but only the root-level `app/` directory contains the active layout and routing hierarchy.

## Routing Inventory
| Path | Guard | Purpose & Key Flows | Current Navigation / Back Behaviour | Shared Dependencies | Observations |
| --- | --- | --- | --- | --- | --- |
| `/` (`app/page.tsx`) | Auth required indirectly via redirect | Landing redirect that sends authenticated users to `/dashboard` and guests to `/login`. | No visible UI; spins while redirecting. | `useAuth`, `useRouter`. | Consider replacing with server redirect to avoid client-only flash. |
| `/login` (`app/login/page.tsx`) | Public | Email/password or Google sign-in with remember-me. | Links to `/signup` and `/reset-password`; no explicit "back" affordance. | `useAuth.login`, `useAuth.loginWithGoogle`, `react-hook-form`, `zod`. | Form uses raw inputs; no shared UI primitives yet. |
| `/signup` (`app/signup/page.tsx`) | Public | Creates a new account and logs user in. | Links back to `/login`; no multi-step UX despite schema comment. | `useAuth.signup`, `useAuth.loginWithGoogle`, `react-hook-form`, `zod`. | Shows static optional fields; no progress indicator. |
| `/reset-password` (`app/reset-password/page.tsx`) | Public | Two-step reset via email or SMS verification. | After email reset pushes to `/login`; verify step has "Request new code" button. | `useAuth.resetPassword`, `SMSService`, `react-hook-form`, `zod`. | SMS flow is stubbed (TODO comment about backend); none of the inputs use shared UI components. |
| `/unauthorized` (`app/unauthorized/page.tsx`) | Public | Informs user about insufficient permissions. | Primary button routes back to `/dashboard`. | Static page. | No breadcrumbs/back structure yet. |
| `/no-company` (`app/no-company/page.tsx`) | Public | Message for users without a company assignment. | Links to `/dashboard` and a `/logout` URL (route not implemented). | Static page. | Needs real logout button and breadcrumb/back consistency. |
| `/dashboard` (`app/dashboard/page.tsx`) | `ProtectedRoute` (any authenticated user) | Role-aware overview with top navigation, quick links, and user/company info. | Top nav tabs (Dashboard, Bank Statements, Companies, User Management, Developer Tools); quick-action cards linking deeper into modules. | `useAuth`, `ProtectedRoute`, Tailwind utility styling. | References `/developer` and `/profile` routes that do not exist; layout uses bespoke nav rather than shared header component. |
| `/bank-statements` (`app/bank-statements/page.tsx`) | `ProtectedRoute` (any authenticated user) | Tenant-specific bank statement upload, history, and transaction explorer. | Back button routes to company financial dashboard when companyId exists, otherwise `/dashboard`. Tab UI for upload/history/transactions. | `BankStatementUpload`, `TransactionTable`, `SummaryCards`, `getCompanyBankStatements`, `calculateSummaryStats`. | Heavy page-level state; tabs are manual buttons. Back nav conditional on company relationship. |
| `/dashboard/bank-statements/[companyId]` | No guard (manual checks only) | Same experience as `/bank-statements` but driven by explicit companyId param. | Back button returns to `/companies/[id]/financial-dashboard`. | Same as above plus `useParams`. | Missing `ProtectedRoute`; relies on manual auth redirect which can flash. Consider consolidating with generic page. |
| `/companies` (`app/companies/page.tsx`) | `ProtectedRoute` (`admin` or `developer`) | Company directory with filters, actions, and management controls. | Header lacks breadcrumb; actions link to `/companies/new`, `/companies/[id]`, `/dashboard/bank-statements/[id]`, `/companies/[id]/financial-dashboard`. | `CompaniesService`, `useAuth`, modal state, Tailwind table markup. | Mentions `/companies/[id]/edit` route that is not implemented; delete modal bespoke. |
| `/companies/new` (`app/companies/new/page.tsx`) | `ProtectedRoute` (`admin` or `developer`) | Form to create new company with animated type selector. | No breadcrumb/back control; relies on `router.push('/companies')` post-submit. | `CompaniesService`, `useAuth`, `react-hook-form`, `zod`. | UI already partially modern with cards but not using shared inputs. |
| `/companies/[id]` (`app/companies/[id]/page.tsx`) | `ProtectedRoute` (any auth) | Company summary with stats, assigned users, and management actions. | Inline link back to `/companies` plus CTAs to bank statements, edit (missing route), assign users modal. | `CompaniesService`, `AdminService`, `ActivityService`, `useAuth`, `toast`. | Lacks breadcrumb component; heavy bespoke cards. |
| `/companies/[id]/financial-dashboard` | `ProtectedRoute` (any auth) | KPI dashboard with tabs, charts, and recent activity. | Uses `PageHeader` with breadcrumbs to `/companies` and company detail; tab navigation component handles section switching. | `PageHeader`, `TabNavigation`, Framer Motion, multiple Firebase services, `Button`, `Card`, `Badge`, `Skeleton`. | Buttons link to `/transactions/new`, `/creditors/new`, `/debtors/new` (transactions route missing). |
| `/companies/[id]/creditors` | `ProtectedRoute` (any auth) | Creditors directory with filters, stats, and card list. | `PageHeader` provides breadcrumbs; actions for export and add; cards expand inline. | `PageHeader`, `Button`, `Card`, `Badge`, Framer Motion, `creditorService`, `adminService`. | Good breadcrumb usage; still manual state management for filters. |
| `/companies/[id]/creditors/new` | `ProtectedRoute` (any auth) | Form to add creditor with bank details. | `PageHeader` supplies breadcrumb & `backHref`; submit returns to `/companies/[id]/creditors`. | `Input`, `Button`, `Card`, `creditorService`, `adminService`, `toast`. | Form controls mix shared `Input` component (custom) with manual select elements. |
| `/companies/[id]/debtors` | `ProtectedRoute` (any auth) | Debtor roster with filters, stats, and grid/list toggle. | Sticky custom header with back button to `/companies/[id]/financial-dashboard`; CTA to `/debtors/new`. | `Button`, `Input`, Framer Motion, `debtorService`, `adminService`, `useAuth`. | Uses bespoke header instead of `PageHeader`; includes modal preview logic for selected debtor. |
| `/companies/[id]/debtors/new` | `ProtectedRoute` (any auth) | Debtor creation form with autocomplete stub. | `PageHeader` includes breadcrumbs back to debtors list. | `PageHeader`, `Input`, `Button`, Framer Motion, `debtorService`, `adminService`. | Autocomplete is mock data; needs API integration later. |
| `/admin/users` (`app/admin/users/page.tsx`) | `ProtectedRoute` (`admin`) | User management table with role toggles, company assignments, and modal editor. | No breadcrumb/back control; relies on table actions. | `AdminService`, modal component inside page, Tailwind table markup. | Inline modal component large; actions mention editing roles/companies. |
| `/pdf-extraction` (`app/pdf-extraction/page.tsx`) | Public | Hosts `PDFExtractor` tool for document parsing. | No breadcrumb/back; top-level heading only. | `PDFExtractor` component. | Page is publicly accessible; consider guard or note if intentional. |

## Navigation Relationships & Notes
- Dashboard top nav is the primary entry point post-authentication, but only the Dashboard tab is styled as active; other modules rely on page-level buttons for back navigation.
- Company-centric workflow typically flows: `/companies` → `/companies/[id]` → module pages (`financial-dashboard`, `creditors`, `debtors`, `/dashboard/bank-statements/[id]`). Breadcrumb coverage is inconsistent across these routes.
- Bank statement experiences exist in two variations (tenant-scoped vs. admin-specified company); consolidating them could simplify navigation and back button logic.
- Several links reference non-existent routes (`/developer`, `/profile`, `/companies/[id]/edit`, `/companies/[id]/transactions/new`, `/logout`), which creates dead-ends for back navigation planning.
- Modal-driven actions (delete company, assign users, edit user roles) currently rely on bespoke overlay implementations without shared dialog components.

## Shared Component & Dependency Map (Current Usage)
- **Auth & Guarding:** `useAuth` context for identity/role checks, `ProtectedRoute` wrapper for client-side gating.
- **UI Primitives:** `src/components/ui/{button, card, badge, input, skeleton, navigation}` used variably across financial dashboards and forms; legacy pages (auth screens, admin tables) still rely on raw HTML inputs/buttons.
- **Navigation Helpers:** `PageHeader` and `TabNavigation` already power the financial dashboard and creditors/debtors creation flows; adoption elsewhere is inconsistent.
- **Data Services:** `src/lib/firebase` exposes namespaced services for companies, bank statements, creditors, debtors, transactions, SMS, and admin utilities—pages import them directly rather than through hooks.
- **Feature Modules:** Bank statement pages compose `BankStatementUpload`, `TransactionTable`, and `SummaryCards`. Creditor/Debtor pages use inline cards and filter controls rather than extracted subcomponents.

## Forms & Data Tables Inventory

### Forms
- **Login form** (`app/login/page.tsx`) – `react-hook-form` + `zod` validation for email/password/remember-me; uses raw `<input>` controls and inline error text. Opportunity to migrate to shared `Input` component and add modern layout + OAuth button variant support.
- **Signup form** (`app/signup/page.tsx`) – Collects name, email, optional phone, password/confirm with `react-hook-form`; similar upgrade path to shared inputs and multi-step/progress UX outlined in modernization goals.
- **Password reset flows** (`app/reset-password/page.tsx`) – Step 1 request form (email vs phone) and step 2 verification/password update; both rely on basic `<input>` fields. SMS verification is stubbed via `SMSService` and would need cohesive UI treatment and feedback states.
- **Company creation** (`app/companies/new/page.tsx`) – Rich type-selection cards plus a simple details form powered by `react-hook-form`; inputs remain native elements while the surrounding layout is already modernized.
- **Bank statement upload** (`src/components/bank-statement/BankStatementUpload.tsx`) – Custom drag-and-drop file upload surface with progress toast handling; should align with overall form styling and add breadcrumb/back integration when embedded in pages.
- **Creditor creation** (`app/companies/[id]/creditors/new/page.tsx`) – Uses shared `Input` component with icons, select elements, and nested bank detail fields; needs consistent validation messaging and responsive layout tuning.
- **Debtor creation** (`app/companies/[id]/debtors/new/page.tsx`) – Similar to creditor form with additional autocomplete dropdown and status controls; autocomplete is currently mocked.
- **Admin role/company editor** (`app/admin/users/page.tsx`, modal) – Inline modal with checkboxes and select for assigning roles/companies; leverages native controls and manual state handling.
- **Company assign users modal** (`app/companies/[id]/page.tsx`) – Modal housing search + checkbox list for user assignment; built with bespoke markup and would benefit from consistent dialog primitives.

### Data Tables & Structured Lists
- **Company directory table** (`app/companies/page.tsx`) – Full-width table with filter toolbar, action column, and status badges; manual responsive handling (no stacking on small screens).
- **User management table** (`app/admin/users/page.tsx`) – Similar table with inline switches, selects, and action buttons; modal triggered per row for detailed editing.
- **Bank transaction table** (`src/components/bank-statement/TransactionTable.tsx`) – Feature-rich table component supporting search, filters, sorting, and responsive overflow; currently styled with raw inputs/selects.
- **Creditors/Debtors card grids** (`app/companies/[id]/creditors/page.tsx`, `.../debtors/page.tsx`) – Card-based lists with expandable sections instead of tables; should be considered when planning responsive breakpoints and potential table/card toggles.

### UI Primitives in Active Use
- **Button** (`src/components/ui/button.tsx`) – Gradient-enabled variants with Framer Motion interactions, loading state, and size scale; older pages still use native `<button>` styling.
- **Input** (`src/components/ui/input.tsx`) – Animated label, icon slot, and error/success indicators; adoption is inconsistent across forms.
- **Card** (`src/components/ui/card.tsx`) – Rounded, motion-enabled container with optional hover elevation; widely used in financial dashboards but not in auth/admin screens.
- **PageHeader & TabNavigation** (`src/components/ui/navigation.tsx`) – Provide breadcrumbs, back button, action slots, and animated tabs; currently limited to financial dashboards and creditor/debtor workflows.
- **Skeletons** (`src/components/ui/skeleton.tsx`) – Present for loading states in financial modules; other pages still use spinners or blank screens.
- **Bank-statement feature components** (`src/components/bank-statement/*`) – Upload, summary, and table abstractions encapsulating domain-specific UI logic ready for re-styling.

## Public Page Follow-ups
- **PDF extraction tool** (`app/pdf-extraction/page.tsx`) still uses a plain layout; consider wrapping with `AuthLayout` or an equivalent modern shell once we confirm intended audience and guard requirements.
- **Root redirect** (`app/page.tsx`) remains a client-side spinner; evaluate converting to a server redirect or branded loading screen after broader navigation updates.
