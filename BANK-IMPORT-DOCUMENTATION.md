# Bank Import Workflow - Complete Documentation Index

This directory contains comprehensive documentation for understanding and maintaining the bank statement import-to-ledger workflow in PeakFlow.

## Documents Overview

### 1. **BANK-IMPORT-DATA-FLOW.md** (Main Reference - 654 lines)
**Purpose**: Complete technical mapping of data flow from upload to ledger posting

**Sections**:
- Bank Statement Upload & Storage (bank_statements collection)
- Bank-to-Ledger Import Session (bankImportSessions, glMappingRules)
- Transaction Mapping & AI Pipeline (MappingPipeline, RuleLearningService)
- Journal Entry Creation & Posting (journal_entries, general_ledger)
- Supporting Data (Chart of Accounts, Fiscal Periods, Bank Accounts)
- Complete Data Dependency Graph
- Reconciliation Integration
- Data Cleanup Dependency Map
- All Key Files & Services
- Firestore Security Rules Implications
- Audit Trail & Usage Tracking

**Use When**: You need to understand the complete architecture, trace data flow, or identify all affected collections for a cleanup operation.

---

### 2. **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Visual Reference - 576 lines)
**Purpose**: ASCII diagrams and visual representations of the data flow

**Sections**:
1. High-Level Workflow (upload → storage)
2. Transaction Mapping & Posting (suggestion → journal → ledger)
3. Firestore Collections Structure (visual hierarchy)
4. Single Transaction Flow (step-by-step from PDF to posted entry)
5. Deletion/Cleanup Flow (safe deletion order)
6. Multi-Transaction Posting Scenario (bulk import example)

**Use When**: 
- You need to understand the workflow visually
- Explaining the system to someone new
- Planning data migrations or cleanups
- Debugging a specific transaction flow

---

### 3. **BANK-IMPORT-CLEANUP-GUIDE.md** (Implementation Guide - 485 lines)
**Purpose**: Step-by-step guide for writing safe data cleanup scripts

**Sections**:
- Quick Reference (collections table, field references)
- Implementation Steps:
  1. Query patterns for finding related documents
  2. Validation before deletion
  3. Impact reporting
  4. Deletion in safe order
  5. Main cleanup function
- Usage Examples
- Critical Gotchas (posted entries, transaction limits, reconciliation)
- Monitoring & Alerts
- Rollback Strategy

**Use When**: 
- Writing a bank import cleanup/rollback script
- Need to safely delete a bank import and all related data
- Want to understand deletion order and dependencies
- Debugging data integrity issues

**Key Takeaways**:
- Must delete in this order: reconciliation → rules → ledger → journal → sessions → statement
- Posted journal entries cannot be deleted without force flag
- Use Firestore batching to avoid transaction limits
- Always run with --dry-run first

---

## Data Collections At a Glance

```
ROOT LEVEL
├── bank_statements/                    - Uploaded PDFs + extracted data
├── journal_entries/                    - Posted bank import transactions
├── general_ledger/                     - Debit/credit entries from journals
├── fiscal_periods/                     - Accounting periods
├── usage_tracking/                     - Audit trail
└── industry-templates/                 - Shared COA templates

COMPANY SCOPED (companies/{companyId}/)
├── bankImportSessions/                 - Import session state
├── glMappingRules/                     - Pattern matching rules
├── reconciliations/                    - Reconciliation sessions
│   ├── {sessionId}/matches/            - Matched transactions
│   └── {sessionId}/adjustments/        - Adjustment entries
├── bankAccounts/                       - Bank account metadata
├── accountTemplate/                    - Company's chart of accounts
└── [other company data]
```

---

## Key Services & Their Roles

| Service | File | Purpose |
|---------|------|---------|
| BankStatementService | bank-statement-service.ts | Upload, parse, store PDFs |
| BankToLedgerService | bank-to-ledger-service.ts | Create sessions, manage mappings, post to ledger |
| PostingService | posting-service.ts | Validate entries, create ledger entries |
| MappingPipeline | mapping-pipeline.ts | AI-powered transaction mapping |
| RuleLearningService | rule-learning-service.ts | Create/update mapping rules from AI suggestions |
| JournalService | journal-service.ts | Query journal and ledger entries |
| ReconciliationService | reconciliation-service.ts | Match and reconcile transactions |

---

## Common Tasks & Which Document to Check

### Task: "How do bank transactions flow through the system?"
See: **BANK-IMPORT-DATA-FLOW.md** (Section 1-4)
Also: **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Section 4: Single Transaction Flow)

### Task: "I need to clean up a failed import"
See: **BANK-IMPORT-CLEANUP-GUIDE.md** (all sections)
Reference: **BANK-IMPORT-DATA-FLOW.md** (Section 8: Deletion Order)

### Task: "What's the deletion order for bank imports?"
See: **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Section 5: Deletion/Cleanup Flow)
Implementation: **BANK-IMPORT-CLEANUP-GUIDE.md** (Step 4: Deletion Order)

### Task: "Which collections does a bank import affect?"
See: **BANK-IMPORT-DATA-FLOW.md** (Section 6: Complete Dependency Graph)
Visual: **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Section 3: Collections Structure)

### Task: "How do I write a cleanup script?"
See: **BANK-IMPORT-CLEANUP-GUIDE.md** (Implementation Steps 1-5)
Implementation Example: Full TypeScript code provided in guide

### Task: "What's the relationship between journal entries and ledger entries?"
See: **BANK-IMPORT-DATA-FLOW.md** (Section 4: Journal Entry Creation & Posting)
Visual: **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Section 4: Single Transaction)

### Task: "Can I delete a posted bank import?"
See: **BANK-IMPORT-CLEANUP-GUIDE.md** (Critical Gotchas #1)
Also: **BANK-IMPORT-DATA-FLOW.md** (Section 8: Critical Constraints)

### Task: "How are bank transactions mapped to GL accounts?"
See: **BANK-IMPORT-DATA-FLOW.md** (Section 3: Transaction Mapping & Matching)
Also: **BANK-IMPORT-DATA-FLOW-DIAGRAM.md** (Section 2: Mapping Pipeline)

---

## Data Flow Summary

```
1. UPLOAD
   User uploads PDF → BankStatementService.processBankStatement()
   └─ Creates: bank_statements/{statementId}

2. IMPORT SESSION
   User selects statement → UI loads transactions
   └─ Creates: companies/{cId}/bankImportSessions/{sessionId}

3. MAPPING
   MappingPipeline processes transactions:
   - Checks glMappingRules (pattern matching)
   - Applies fuzzy matching
   - Calls AI for suggestions
   └─ Output: Map<transactionId, GLMapping>

4. REVIEW
   User reviews & approves mappings
   Optional: RuleLearningService saves AI suggestions as rules
   └─ Creates: companies/{cId}/glMappingRules/{ruleId}

5. POSTING
   User clicks "Post to Ledger"
   BankToLedgerService.postToLedger():
   - For each mapping, create journal entry
   - Call PostingService.post()
   - This creates ledger entries
   
   └─ Creates: 
      - journal_entries/{journalEntryId} (status: posted)
      - general_ledger/{ledgerEntryId} × 2 (debit + credit)

6. RECONCILIATION (Optional)
   ReconciliationService matches bank transactions to ledger entries
   └─ Creates:
      - companies/{cId}/reconciliations/{sId}/matches/{matchId}
      - Adjustment journal entries if needed
```

---

## Data Relationships Quick Reference

```
bank_statements/{id}
    ├─ Contains: transactions[]
    ├─ Referenced by: bankImportSessions (metadata.statementId)
    └─ Linked to: journal_entries via metadata.bankTransactionId

companies/{cId}/bankImportSessions/{id}
    ├─ Contains: transactions[] (copy from bank_statements)
    ├─ References: bank_statements (metadata.statementId)
    ├─ Links to: journal_entries via metadata.bankTransactionId
    └─ Status: pending → processing → completed

companies/{cId}/glMappingRules/{id}
    ├─ Contains: pattern + glAccountId
    ├─ Used by: MappingPipeline.processTransactions()
    ├─ Created by: User or RuleLearningService
    └─ Referenced by: journal_entries metadata

journal_entries/{id}
    ├─ tenantId: companyId (multi-tenant filtering)
    ├─ source: 'bank_import' (how to find bank imports)
    ├─ status: 'posted' (after PostingService.post())
    ├─ metadata.bankTransactionId (back-reference)
    ├─ Contains: lines[] (always 2: debit + credit)
    └─ Links to: general_ledger via journalEntryId

general_ledger/{id}
    ├─ journalEntryId (reference back)
    ├─ source: 'bank_import' (filtering)
    ├─ One entry per journal line (usually 2 per transaction)
    └─ metadata.bankTransactionId (audit trail)

companies/{cId}/reconciliations/{sId}/matches/{id}
    ├─ bankTransactionId (from bank_statements)
    ├─ ledgerTransactionId (from general_ledger)
    └─ status: 'matched' | 'unmatched'
```

---

## Critical File Locations

### Core Services
- `/src/lib/firebase/bank-statement-service.ts` - PDF upload & processing
- `/src/lib/accounting/bank-to-ledger-service.ts` - Session & posting management
- `/src/lib/accounting/posting-service.ts` - Ledger posting logic
- `/src/lib/ai/mapping-pipeline.ts` - Transaction mapping algorithms
- `/src/lib/ai/rule-learning-service.ts` - Rule creation from AI suggestions

### Type Definitions
- `/src/types/bank-statement.ts` - BankStatement, BankTransaction
- `/src/types/accounting/bank-import.ts` - ImportedTransaction, GLMapping
- `/src/types/accounting/journal.ts` - JournalEntry, JournalLine
- `/src/types/accounting/general-ledger.ts` - LedgerEntry

### UI Components
- `/src/components/banking/BankToLedgerImport.tsx` - Main import UI
- `/src/components/bank-statement/BankStatementUpload.tsx` - Upload component

### Configuration
- `/firestore.rules` - Security rules for all collections
- `/firestore.indexes.json` - Required indexes

---

## Related Documents

Previous bank import fixes and enhancements documented elsewhere:
- `BANK-IMPORT-CURRENCY-FIX.md` - Currency handling in imports
- `BANK-IMPORT-POSTING-DEBUG.md` - Debugging posting issues
- `BANK-IMPORT-POSTING-FIX.md` - Posting service improvements
- `BANK-IMPORT-UI-CURRENCY-FIX.md` - UI currency display

---

## Firestore Query Reference

### Find Bank Imports for a Company
```typescript
const imports = await getDocs(query(
  collection(db, `companies/${companyId}/bankImportSessions`),
  where('status', '==', 'completed')
));
```

### Find Journal Entries from Bank Imports
```typescript
const journals = await getDocs(query(
  collection(db, 'journal_entries'),
  where('tenantId', '==', companyId),
  where('source', '==', 'bank_import')
));
```

### Find Ledger Entries from Bank Imports
```typescript
const ledgers = await getDocs(query(
  collection(db, 'general_ledger'),
  where('tenantId', '==', companyId),
  where('source', '==', 'bank_import')
));
```

### Find Mapping Rules for a Company
```typescript
const rules = await getDocs(query(
  collection(db, `companies/${companyId}/glMappingRules`),
  where('isActive', '==', true),
  orderBy('priority', 'asc')
));
```

---

## Safety Checklist

Before running any cleanup or migration:

- [ ] Read BANK-IMPORT-CLEANUP-GUIDE.md (all sections)
- [ ] Run with --dry-run first
- [ ] Verify no journal entries have status='posted' (unless using --force)
- [ ] Check fiscal period is still open
- [ ] Verify all GL accounts exist (referenced accounts)
- [ ] Export data backup before cleanup
- [ ] Test on staging environment first
- [ ] Review deletion impact report
- [ ] Have rollback plan ready
- [ ] Monitor account balances after cleanup

---

## Support

For questions about specific sections:
1. Check the relevant document above
2. Review the inline code comments in the actual service files
3. Consult the Firestore security rules (firestore.rules)
4. Check the TypeScript type definitions for data structure details

