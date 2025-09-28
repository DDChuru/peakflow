# Phase 5 – Bank & Cash Management Delivery Plan

This phase builds on the modernised financial workspace and accounting scaffold to deliver full bank and cash management capabilities. It aligns with the Phase 5 objectives in `current-prompt.md` and assumes the auth, dashboard, company, and COA improvements that landed in commits up to `9a7b5a9`.

## Goals & Guardrails
- Introduce native bank account administration linked to GL accounts and tenant hierarchy.
- Expand bank statement ingestion beyond PDFs into structured imports with categorisation and deduplication.
- Ship a reconciliation workspace that balances imported statements with ledger postings.
- Provide forward-looking cash visibility (positions, forecasts, liquidity insights).
- Maintain double-entry integrity, tenant isolation, and auditability throughout.

## Current Baseline
- `BankStatementsView` delivers modern upload/history/transaction browsing with summary analytics.
- `bank-statement-service` supports PDF parsing via Firebase functions and stores results under `companies/{companyId}`.
- Accounting scaffolding (`PostingService`, `CurrencyService`, COA admin UI) exists but does not yet track bank accounts or reconciliations.
- No dedicated bank account collection, reconciliation data, or cash forecasting logic is present.

## Latest Progress (current session)
- [x] Wrapped `/dashboard/bank-statements/[companyId]` in a client shell so `ProtectedRoute` and async params cooperate with Next.js 15.
- [x] Hardened Gemini 2.0 Flash extraction with JSON sanitisation and `responseMimeType` to stop `Unexpected end of JSON input` failures.
- [x] Normalised bank statement payloads before persisting (strip undefineds, parse statement periods, clean references) to unblock Firestore writes.
- [ ] QA bank statement ingestion end-to-end once new rules deploy and sample statements are available.

## Workstreams & Checklists

### 1. Bank Account Management
- [x] Design Firestore schema for `companies/{companyId}/bankAccounts/{accountId}` with GL link, currency, signatories, limits.
- [x] Extend `chart-of-accounts` admin to flag accounts as bank-capable and map them to bank accounts.
- [x] Build bank account admin UI (list, detail drawer, add/edit, deactivate) sharing the new card/table primitives.
- [ ] Add signatory management (contact info, approval thresholds) and attach to approval flows.
- [ ] Surface account balances by aggregating reconciled ledger data + pending statements.
- [ ] Add transfer workflow: initiate, approval, posting of inter-account journals.

### 2. Enhanced Bank Statement Import
- [x] Audit existing PDF extraction prompts; extend to support multiple layouts (per regional banks) with metadata mapping.
- [ ] Introduce parser strategy layer that can ingest CSV/OFX/QIF; scaffold conversion utilities in `src/lib/bank-ingest`.
- [ ] Implement transaction categorisation (rule engine first, ML hook-friendly interface) and persist categories.
- [ ] Detect duplicates using hash of date/amount/reference + tolerance window; expose conflict resolution UI.
- [ ] Capture ingestion audit trail (source, parser, operator) for compliance.
- [x] Harden error handling with retry queue and user-facing toasts/snackbars (Gemini parser sanitiser landed; still owe retries + UX polish).

### 3. Bank Reconciliation Workspace
- [x] Model reconciliation sessions (`companies/{companyId}/reconciliations/{reconId}`) with period, accounts, status.
- [x] Build reconciliation UI: statement transactions vs ledger entries, auto-match suggestions, manual match flows.
- [x] Implement matching engine (exact, amount-date tolerance, reference heuristics) and expose confidence scoring.
- [x] Fix auto-match algorithm to properly load bank transactions from statements
- [x] Fix ledger entry queries and amount calculations
- [ ] Generate reconciliation adjustment entries via `PostingService` with reversal support (UI exists, needs integration).
- [ ] Enforce period locks after reconciliation completion; surface reopen workflow with audit trail.
- [ ] Produce reconciliation reports (summary, unmatched items, adjustments) and export to PDF/CSV.

### 4. Cash Flow Management
- [ ] Aggregate real-time cash position per tenant using bank account balances + scheduled inflows/outflows.
- [x] Build short-term forecasting engine (13-week rolling) leveraging open invoices, payables, and budgets (service exists).
- [ ] Visualise cash runway with charts/cards in dashboard and company financial overview (UI not integrated).
- [x] Implement payment prioritisation suggestions (scoring by due date, impact, vendor criticality) (service exists).
- [ ] Add liquidity analytics (days cash on hand, burn rate, variance vs forecast) with drill-downs.
- [ ] Wire alerts/notifications for threshold breaches.

### 5. Critical Gap - Ledger Entry Creation (NEW)
- [ ] **Create posting workflow for debtors** (customer invoices, receipts)
- [ ] **Create posting workflow for creditors** (supplier bills, payments)
- [ ] **Implement "Import from Bank" feature** to create ledger entries from unmatched bank transactions
- [ ] **Add transaction categorization rules** for automatic account assignment
- [ ] **Build approval workflow** for imported transactions before posting
- [ ] **This is ESSENTIAL** - without ledger entries, reconciliation cannot function properly

## Sequencing & Dependencies
1. **Schema + Services First**: land bank account models and ingestion utilities before UI polish.
2. **Reconcile with Accounting Layer**: align with `PostingService` to guarantee journal integrity for transfers and adjustments.
3. **Progressive Enhancements**: start reconciliation with rule-based matching; plug ML once baselines are stable.
4. **Cross-Team Touchpoints**: coordinate with PDF extraction function owners for parser updates and with auth team for signatory approvals.

## Data & Technical Considerations
- Use deterministic IDs (`bankAccount-${slug}`) to simplify referencing in GL entries.
- Ensure currency awareness: bank accounts store native currency, convert for consolidated dashboards via `CurrencyService`.
- Schedule Cloud Function for periodic revaluation of foreign currency accounts.
- Wrap multi-document writes in Firestore transactions/batches to keep reconciliations ACID.
- Track all user actions in `activities` with reconciliation context for audits.

## Testing & Validation Plan
- Unit tests for new parsers, duplicate detection, matching algorithms.
- Integration tests covering bank account CRUD and transfer postings.
- UI smoke tests: bank admin → statement import → reconciliation flow → cash dashboard.
- Load test ingestion with large statements (5k+ rows) to validate performance and pagination.
- UAT checklist for finance operators to validate reconciliation and cash planning workflows.

## Exit Criteria
- Every tenant can create and manage bank accounts linked to GL.
- Statements ingest from PDF + at least one structured format with dedupe + categorisation.
- Reconciliation workspace can match, adjust, lock periods, and generate reports.
- Cash dashboard reflects live balances, forecasts, and alerts without console errors.
