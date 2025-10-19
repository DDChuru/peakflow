# Firestore Roles & Rules Reference

This document captures the current access-control approach for accounting collections and flags follow-up items. The emphasis right now is scoping access by `companyId`, while broader role granularity (multi-company access, feature-level roles) will be revisited later.

## Guiding Principles
- **Tenant Isolation**: Every query/write must target `companies/{companyId}/...` and checks `companyId` equality.
- **Role Awareness**: Platform `admin` / `developer` roles retain elevated capabilities.
- **Workspace Membership**: Regular users may interact only with the company they belong to (or companies explicitly granted later).
- **Auditability**: Immutable identifiers (`companyId`, `createdBy`) are protected from mutation; timestamps are server-controlled.

## Collections & Intended Permissions

### Statements (`companies/{companyId}/statements`)
- **Read**: Any authenticated user that belongs to the company (or platform admin/developer).
- **Create / Update**: Same scope as read; future enhancement will narrow creation to finance roles.
- **Delete**: Company admin or platform admin only.
- **Notes**: Generation writes statement summaries plus transaction snapshots; ensure generated data is immutable post-finalisation.

### Credit Notes (`companies/{companyId}/creditNotes`)
- **Read**: Company members & platform admins.
- **Create / Update**: Company members (future: enforce approval workflow with role separation).
- **Delete**: Company admin or platform admin.
- **Related Collections**: Requires read/update on invoices/bills when allocating.

### Payments (`companies/{companyId}/payments`)
- **Read**: Company members & platform admins.
- **Create / Update**: Company members; keep `companyId` immutable.
- **Delete**: Company admin or platform admin (should be rare; prefer reversing transactions).
- **Usage**: Statements, allocations, reconciliation pull from this dataset.

### Fiscal Periods (`/fiscal_periods`)
- **Read**: Company members with access to the tenant.
- **Create / Update / Delete**: Platform admins/developers only (central configuration).
- **Purpose**: Posting flows must confirm the target period is open before writing ledger data.

### Journal Entries (`/journal_entries`)
- **Read**: Company members & platform admins for their tenant.
- **Create / Update**: Allowed when request carries `tenantId` the user can access (enables automated posting); deletes disabled.
- **Notes**: Consider approval workflows if manual entry editing becomes necessary.

### General Ledger (`/general_ledger`)
- **Read**: Company members & platform admins for their tenant.
- **Create**: Allowed for automated posting with matching `tenantId`; updates/deletes disabled to preserve audit integrity.
- **Notes**: Ledger entries are append-only; corrections flow through reversing journals.

### Invoices (`companies/{companyId}/invoices`) & Bills (`companies/{companyId}/bills`) *(Bills rules pending)*
- **Read**: Company members & platform admins.
- **Create / Update**: Company members; ensure status/amount changes retain audit data.
- **Delete**: Company admin or platform admin (deletion discouraged in production).
- **Action**: Add explicit rules for `bills` mirroring `invoices` to support supplier statements and credit-note allocations.

### Journal Entries (`companies/{companyId}/journalEntries`)
- **Read**: Company members & platform admins.
- **Create / Update**: Currently restricted to `canManageCompanies()` (platform admins/developers). Decide whether finance managers should gain this capability when credit-note approvals auto-post entries.
- **Delete**: Denied; journal entries should remain immutable.

## Multi-Company Access
- Multiple-company access is highlighted in the modernization roadmap (`project-management/modernization-roadmap.md:1335`).
- Current support: users can carry an `accessibleCompanyIds` array; both `useWorkspaceAccess` and Firestore’s `belongsToCompany` helper treat these as delegated companies.
- **Next Actions**
  1. Audit UI flows (statements, credit notes, invoicing) to ensure company switching respects delegated access.
  2. Add admin tooling to manage `accessibleCompanyIds`.
  3. Layer finer-grained roles (viewer/editor/approver) once multi-company basics prove stable.

## Next Steps
1. Add Firestore rules block for `companies/{companyId}/bills/{billId}`.
2. Evaluate journal entry write permissions for non-admin finance roles.
3. Model role tiers (viewer, editor, approver) and align Firestore checks accordingly.
4. Implement multi-company access once data model & rules support the roadmap requirements.
