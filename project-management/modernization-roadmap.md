# Modernization Execution Plan

This roadmap mirrors the enhanced prompt in `current-prompt.md` and tracks active priorities. Update it as milestones complete or scope shifts.

## Active Focus

1. **Financial Workspace Smoke Test**
   - Walk through financial dashboard → creditors → debtors → back.
   - Validate create/export/delete flows.
   - Capture UI/logic regressions for follow-up.

## Upcoming Phases

2. **Phase 5 – Auth Refresh**
   - Roll out `AuthLayout` across login/signup/reset.
   - Polish protected-route UX and error messaging.
   - Plan session handling & remember-me improvements.

3. **Phase 1 – Core Accounting Foundation**
   - Draft COA/Journal/GL schemas, posting rules, multi-currency plan.
   - See `project-management/phase-1-core-accounting.md` for detailed objectives.
   - Chart of Accounts model & UI.
   - Journal/GL data structures, posting rules, fiscal period management.
   - Currency engine with revaluation and gain/loss calculations.

4. **Phase 2 – Multi-Tenant Architecture**
   - Tenant hierarchy (company → managed accounts → departments).
   - Isolation middleware, access controls, tenant-aware queries.
   - Migration and backup tooling for onboarding.

5. **Phase 3 – Debtors/Creditors Lifecycle**
   - End-to-end AR/AP workflows (aging, documents, reminders).
   - Quote/PO/invoice integrations and approval rules.
   - Reporting hooks for aging analysis and ledgers.

6. **Phase 6 – QA & Release Strategy**
   - Automated test coverage plan (unit, integration, e2e).
   - Performance benchmarks and monitoring.
   - Release criteria, rollback, and audit logging.

> Keep this file in sync with the plan tool and `current-prompt.md` so we always have an offline source of truth.
