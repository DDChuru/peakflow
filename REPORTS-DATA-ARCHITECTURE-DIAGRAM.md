# Financial Reports Data Architecture - Visual Reference

## System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    USER REQUESTS REPORT                        │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│           Reports Page: /reports/page.tsx                      │
│  (Client component that calls report services)                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ GL Reports  │  │ Financial    │  │ AP/AR        │
    │ Service     │  │ Statements   │  │ Reports      │
    │             │  │ Service      │  │ Service      │
    └──────────────┘  └──────────────┘  └──────────────┘
          ↓                   ↓                   ↓
          └───────────────────┼───────────────────┘
                              ↓
          ┌───────────────────┼───────────────────┐
          ↓                   ↓                   ↓
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │ general_     │  │ journal_     │  │ invoices/    │
    │ ledger       │  │ entries      │  │ vendorBills  │
    │ (Firestore)  │  │ (Firestore)  │  │ (Firestore)  │
    └──────────────┘  └──────────────┘  └──────────────┘
          
    (COMPUTATION HAPPENS HERE IN MEMORY)
    (NO DATA WRITTEN BACK TO FIRESTORE)
          ↓
    ┌──────────────────────────────────┐
    │  Report Object (in browser RAM)  │
    │  {                               │
    │    accounts: [...],              │
    │    totalDebits: 50000,           │
    │    totalCredits: 50000,          │
    │    balanced: true                │
    │  }                               │
    └──────────────────────────────────┘
          ↓
    ┌──────────────────────────────────┐
    │  Display in UI (temporary)       │
    │  Destroyed when user navigates   │
    └──────────────────────────────────┘
```

---

## Data Flow: Report Generation (Detailed)

```
┌─ REPORT GENERATION PROCESS ──────────────────────────────────────┐
│                                                                   │
│  Step 1: Query Phase                                             │
│  ────────────────────                                            │
│  const ledgerEntries = await collection(general_ledger)          │
│    .where('tenantId', '==', companyId)                           │
│    .where('transactionDate', '<=', asOfDate)                     │
│    .getDocs();                                                   │
│  (This reads from Firestore)                                     │
│                                                                   │
│  Step 2: Computation Phase (IN MEMORY)                           │
│  ──────────────────────────────────────                          │
│  ledgerEntries.forEach(entry => {                                │
│    accountBalances[entry.accountCode].debit += entry.debit;      │
│    accountBalances[entry.accountCode].credit += entry.credit;    │
│  });                                                              │
│  (Nothing written to Firestore)                                  │
│                                                                   │
│  Step 3: Return Phase                                            │
│  ──────────────────────                                          │
│  return {                                                         │
│    companyId,                                                    │
│    asOfDate,                                                     │
│    generatedAt: new Date(),  // Set to current time              │
│    accounts: [...],          // Computed in memory                │
│    totalDebits,              // Computed in memory                │
│    totalCredits,             // Computed in memory                │
│    balanced: true            // Computed in memory                │
│  };                                                              │
│  (Result never persisted to Firestore)                           │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Report Types and Their Sources

```
┌────────────────────────────────────────────────────────────────┐
│                    REPORT TYPES                                │
└────────────────────────────────────────────────────────────────┘

GENERAL LEDGER REPORTS
├── Trial Balance Report
│   Source: general_ledger
│   Computation: Sum(debit) and Sum(credit) by account
│   Storage: ❌ NONE
│
├── GL by Account Report
│   Source: general_ledger (filtered by accountCode)
│   Computation: Running balance, sort by transaction date
│   Storage: ❌ NONE
│
└── Journal Entries Report
    Source: journal_entries + general_ledger
    Computation: Group lines by journal entry
    Storage: ❌ NONE

FINANCIAL STATEMENTS
├── Income Statement (P&L)
│   Source: general_ledger (accounts 4000-4999, 5000-5999)
│   Computation: Group by revenue/COGS/expenses, calculate net income
│   Storage: ❌ NONE
│
├── Balance Sheet
│   Source: general_ledger (accounts 1000-1999, 2000-2999, 3000-3999)
│   Computation: Group by asset/liability/equity, verify balance equation
│   Storage: ❌ NONE
│
└── Cash Flow Statement
    Source: general_ledger (accounts 1000-1099)
    Computation: Categorize by operating/investing/financing activities
    Storage: ❌ NONE

AP/AR REPORTS
├── Aged Receivables
│   Source: companies/{companyId}/invoices
│   Computation: Calculate aging buckets, group by customer
│   Storage: ❌ NONE
│
├── Aged Payables
│   Source: companies/{companyId}/vendorBills
│   Computation: Calculate aging buckets, group by vendor
│   Storage: ❌ NONE
│
├── AR Summary by Customer
│   Source: companies/{companyId}/invoices
│   Computation: Aggregate outstanding by customer
│   Storage: ❌ NONE
│
└── AP Summary by Vendor
    Source: companies/{companyId}/vendorBills
    Computation: Aggregate outstanding by vendor
    Storage: ❌ NONE
```

---

## Firestore Collections: What Exists vs. What Doesn't

```
┌─ FIRESTORE COLLECTIONS ──────────────────────────────────────┐
│                                                              │
│  EXISTS (Global Collections):                              │
│  ├── ✅ general_ledger        (Source data for reports)     │
│  ├── ✅ journal_entries       (Source data for reports)     │
│  ├── ✅ accounting_accounts   (Metadata for reports)        │
│  └── ✅ fiscal_periods        (Metadata only, no balances)  │
│                                                              │
│  EXISTS (Company-Scoped Collections):                       │
│  ├── ✅ companies/{id}/invoices     (Source for AR reports) │
│  ├── ✅ companies/{id}/vendorBills  (Source for AP reports) │
│  ├── ✅ companies/{id}/statements   (NOT financial reports) │
│  └── ✅ companies/{id}/cashFlow...  (Forecasts, not actuals)│
│                                                              │
│  DOES NOT EXIST (No report storage):                        │
│  ├── ❌ reports               (No report collection)        │
│  ├── ❌ trial_balance         (No TB snapshots)             │
│  ├── ❌ balance_sheet         (No BS snapshots)             │
│  ├── ❌ income_statements     (No IS snapshots)             │
│  ├── ❌ cash_flow_statements  (No CF snapshots)             │
│  ├── ❌ report_cache          (No caching layer)            │
│  ├── ❌ report_snapshots      (No historical reports)       │
│  ├── ❌ report_archives       (No archives)                 │
│  └── ❌ account_balances      (No cached balances)          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Deletion Impact Matrix

```
┌─────────────────────────────────────────────────────────────┐
│  IF YOU DELETE...          THEN REPORTS...                 │
├─────────────────────────────────────────────────────────────┤
│  general_ledger entries    Automatically update ✅           │
│                            (reflect the deletion)            │
│                                                              │
│  journal_entries           Automatically update ✅           │
│                            (reflect the deletion)            │
│                                                              │
│  invoices                  Aged receivables ✅               │
│                            (show fewer lines)               │
│                                                              │
│  vendorBills               Aged payables ✅                 │
│                            (show fewer lines)               │
│                                                              │
│  accounting_accounts       Reports regenerate ✅             │
│                            (with missing account names)     │
└─────────────────────────────────────────────────────────────┘

NOTHING ELSE TO DELETE:
├── No report collections to clean
├── No caches to invalidate
├── No snapshots to purge
├── No archives to remove
└── No balance tables to reset
```

---

## Service Layer Architecture

```
┌────────────────────────────────────────────────────────────────┐
│               REPORTING SERVICES STRUCTURE                     │
└────────────────────────────────────────────────────────────────┘

/src/lib/reporting/

├── gl-reports-service.ts
│   ├── class GLReportsService
│   │   ├── generateTrialBalance(asOfDate): Promise<TrialBalanceReport>
│   │   ├── generateGLByAccount(accountCode, startDate?, endDate?): Promise<GLAccountReport>
│   │   ├── generateJournalEntriesReport(startDate, endDate, filters?): Promise<JournalEntriesReport>
│   │   └── private helper methods (getAccountBalances, getJournalLines, etc.)
│   └── export createGLReportsService()
│
├── financial-statements-service.ts
│   ├── class FinancialStatementsService
│   │   ├── generateIncomeStatement(startDate, endDate): Promise<IncomeStatement>
│   │   ├── generateBalanceSheet(asOfDate): Promise<BalanceSheet>
│   │   ├── generateCashFlowStatement(startDate, endDate): Promise<CashFlowStatement>
│   │   └── private helper methods (getAccountBalances, groupAccountsByRange, etc.)
│   └── export createFinancialStatementsService()
│
├── ap-ar-reports-service.ts
│   ├── class APARReportsService
│   │   ├── generateAgedReceivables(asOfDate?): Promise<AgedReceivablesReport>
│   │   ├── generateAgedPayables(asOfDate?): Promise<AgedPayablesReport>
│   │   ├── getARSummaryByCustomer(): Promise<ARSummary[]>
│   │   ├── getAPSummaryByVendor(): Promise<APSummary[]>
│   │   └── private helper methods
│   └── export createAPARReportsService()
│
└── index.ts
    └── Re-exports all services and types

KEY PATTERN: All services are STATELESS
- No database writes
- No caching
- No local state persistence
- Pure computation from Firestore queries
```

---

## Performance Characteristics

```
┌────────────────────────────────────────────────────────────────┐
│              REPORT GENERATION PERFORMANCE                     │
└────────────────────────────────────────────────────────────────┘

Per Report Generation:

1. QUERY PHASE (I/O bound)
   ├── Query general_ledger: O(n) where n = ledger entries
   ├── Query journal_entries: O(m) where m = journal entries
   ├── Query accounting_accounts: O(k) where k = chart size
   └── Total Firestore reads: ~3 queries

2. COMPUTATION PHASE (CPU bound)
   ├── Aggregate calculations: O(n)
   ├── Sorting/grouping: O(n log n)
   ├── Balance verification: O(k)
   └── Total CPU time: Proportional to data size

3. RETURN PHASE (Memory)
   └── Result object created and returned to UI

CACHING OPPORTUNITIES (Not currently implemented):
- Could cache chart of accounts (changes rarely)
- Could add client-side caching (between report refreshes)
- Could implement Firestore collection-level caching
- But NO persistent report storage needed
```

---

## File Locations Quick Reference

```
src/lib/reporting/
├── gl-reports-service.ts              (1,000+ lines)
│   └── Trial balance, GL by account, journal entries reports
├── financial-statements-service.ts    (1,100+ lines)
│   └── Income statement, balance sheet, cash flow statements
├── ap-ar-reports-service.ts           (700+ lines)
│   └── Aged receivables, aged payables, summaries
└── index.ts                           (46 lines)
    └── Public API exports

app/workspace/[companyId]/reports/page.tsx
└── UI that consumes these services

firestore.rules (lines 206-216)
└── Defines general_ledger and journal_entries collections
   (NO report collections defined)

No API endpoints store reports (/app/api/ contains only AI utilities)
```

---

## Summary Decision Tree

```
                    Need to delete ledger data?
                            ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            Delete GL entries?   Delete Journal entries?
                    ↓                   ↓
              Delete from:          Delete from:
          general_ledger        journal_entries
            collection              collection
                    ↓                   ↓
            Reports auto-        Reports auto-
            matically update    matically update
                    ↓                   ↓
          All done ✅           All done ✅
          No additional
          cleanup needed
          
          
              NOTES:
              ⚠️ Do NOT try to delete report collections
                 (they don't exist)
              ⚠️ Do NOT invalidate report caches
                 (there are none)
              ⚠️ Do NOT update fiscal period balances
                 (periods don't store balances)
              ✅ Simply delete the source data
              ✅ Reports reflect changes automatically
```

