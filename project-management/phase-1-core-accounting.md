# Phase 1 – Core Accounting Foundation

## Objectives
- Establish double-entry accounting data structures across Firestore (or chosen persistence layer).
- Provide an initial UI/UX for chart of accounts (COA) administration.
- Implement journal + general ledger pipeline with posting rules and fiscal period controls.
- Lay groundwork for multi-currency support (rates, conversions, revaluation).

## Deliverables
1. **Data Model Specs**
   - COA collection schema with account type, normal balance, hierarchy.
   - Journal entry (header + line items) schema with validations.
   - General ledger entry schema and indexing strategy.
   - Fiscal period document design (status, open/close timestamps).
   - Currency master + rate storage layout.

2. **Posting Rules Engine**
   - Validation rules (balanced entries, account status, period status).
   - Reversal/adjustment handling.
   - Batch posting support for imports.

3. **COA Management UI**
   - Page layout using existing design system (filters, search, add/edit drawer).
   - Account templates for base tenants.
   - Activation/deactivation flows with confirmation modals.

4. **Multi-Currency Plan**
   - Rate types (spot, average, historical) and fallback logic.
   - Conversion utility interface.
   - Realized vs unrealized gain/loss approach.
   - Revaluation job design (triggering, logging).

5. **Open Questions / Dependencies**
   - Storage location (Firestore vs dedicated collection structure).
   - Integration points with existing transaction services.
   - Audit trail strategy (reuse ActivityService vs new log).

## Implementation Plan
- [x] Draft ERD / schema diagrams for COA, JournalEntry, GLEntry, FiscalPeriod, CurrencyRate.
- [x] Document posting rules + validation scenarios (initial balancing + period checks).
- [x] Prototype API/service layer for journal posting.
- [ ] Design COA admin UI wireframes leveraging stat cards + tables.
- [ ] Outline currency conversion utilities and revaluation workflow.

## Risks / Mitigations
- **Data integrity**: enforce balanced journal entries with validation + tests.
- **Performance**: plan indexes early for GL queries (by account, period).
- **Period control**: ensure posting respects open/closed periods to avoid leaks.
- **Currency volatility**: build rate caching + fallback strategy.

## Next Steps
1. Socialize this plan with stakeholders for alignment.
2. Begin schema/proto work in `/src/types/accounting` or similar.
3. Spike on posting engine to validate Firestore transactional needs.
4. Expand roadmap with Phase 1 tasks as JIRA/issue tracker items.
