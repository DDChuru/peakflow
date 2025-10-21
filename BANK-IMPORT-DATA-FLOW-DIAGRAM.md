# Bank Statement Import - Visual Data Flow Diagrams

## 1. High-Level Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BANK STATEMENT IMPORT FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

                           USER UPLOADS PDF
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Bank Statement UI    │
                    │  BankStatementUpload   │
                    └────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   processBankStatement │
                    │  (bank-statement-srv)  │
                    └────────────────────────┘
                                 │
                ┌────────────────┼────────────────┐
                │                │                │
                ▼                ▼                ▼
         Convert to Base64   Call Firebase   Extract & Parse
         from PDF             Function        Transactions
                              (Gemini)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  bank_statements/{id}  │
                    │   (Firestore)          │
                    └────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            usage_tracking           BankStatementUpload
            (for audit)              Component displays
```

## 2. Transaction Mapping & Posting

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     BANK-TO-LEDGER IMPORT & POSTING                         │
└─────────────────────────────────────────────────────────────────────────────┘

                         USER: Select Statement
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  BankToLedgerImport UI     │
                    │  loads bank_statements     │
                    └────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  MappingPipeline           │
                    │  .processTransactions()    │
                    └────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
    Pattern Match          Fuzzy Match              AI Suggestion
    (glMappingRules)       (Vendor names)           (Claude API)
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────────┐
                    │  processingResult          │
                    │  - autoMapped              │
                    │  - needsReview             │
                    │  - needsAI                 │
                    └────────────────────────────┘
                                 │
                    USER: Review & Approve
                                 │
                                 ▼
    ┌─────────────────────────────────────────────────┐
    │  CREATE: bankImportSessions/{sessionId}         │
    │  - transactions[]                               │
    │  - status: 'pending'                            │
    └─────────────────────────────────────────────────┘
                                 │
          USER: Click "Post to Ledger"
                                 │
                                 ▼
    ┌──────────────────────────────────────────────────────┐
    │  BankToLedgerService.postToLedger()                  │
    │  - For each mapping:                                 │
    │    • Create journal entry (bank_import source)       │
    │    • Create 2 journal lines (debit + credit)         │
    │    • Call PostingService.post()                      │
    └──────────────────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
    journal_entries/{id}   general_ledger/{id}   Update Session
    - status: posted       - debit entry          - status: completed
    - metadata with        - credit entry         - processedTx count
      bankTransactionId
```

## 3. Firestore Collections Structure

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE COLLECTIONS                               │
└──────────────────────────────────────────────────────────────────────────────┘

ROOT LEVEL
──────────
├── bank_statements/                    ← Uploaded PDFs + extracted data
│   ├── {statementId}
│   │   ├── companyId (reference)
│   │   ├── transactions: BankTransaction[]
│   │   ├── summary: { period, balances, totals }
│   │   ├── accountInfo: { number, name, bank }
│   │   └── status: 'completed' | 'failed'
│   │
│
├── journal_entries/                    ← Posted transactions
│   ├── {journalEntryId}
│   │   ├── tenantId (companyId)
│   │   ├── source: 'bank_import'
│   │   ├── status: 'posted' | 'draft' | 'voided'
│   │   ├── metadata: { bankTransactionId, originalDescription }
│   │   ├── lines: JournalLine[] (debit + credit)
│   │   └── fiscalPeriodId (reference)
│   │
│
├── general_ledger/                     ← Ledger entries (debit/credit)
│   ├── {ledgerEntryId}
│   │   ├── tenantId (companyId)
│   │   ├── journalEntryId (reference)
│   │   ├── accountCode, accountName
│   │   ├── debit & credit (one per line)
│   │   ├── source: 'bank_import'
│   │   └── metadata
│   │
│
├── fiscal_periods/                     ← Accounting periods
│   ├── {periodId}
│   │   ├── companyId
│   │   ├── status: 'open' | 'closed'
│   │   └── startDate, endDate
│   │
│
└── usage_tracking/                     ← Audit trail
    ├── {trackingId}
    │   ├── function: 'processBankStatement'
    │   ├── userId, companyId
    │   └── timestamp, success


COMPANY SUBCOLLECTIONS
──────────────────────
companies/{companyId}/
├── bankImportSessions/                 ← Import sessions
│   ├── import_{timestamp}_{random}
│   │   ├── transactions: BankTransaction[]
│   │   ├── status: 'pending' | 'processing' | 'completed'
│   │   ├── metadata: { statementId reference, processedTx count }
│   │   └── createdBy, createdAt
│   │
│
├── glMappingRules/                     ← Pattern matching rules
│   ├── {ruleId}
│   │   ├── pattern: "SALARY" | "RENT" etc
│   │   ├── glAccountCode & glAccountId (references GL account)
│   │   ├── priority: number (lower = higher priority)
│   │   ├── isActive: boolean
│   │   ├── metadata: { source: 'ai-assisted' | 'user-created' }
│   │   └── usageCount, lastUsed
│   │
│
├── reconciliations/                    ← Reconciliation sessions
│   ├── {sessionId}
│   │   ├── matches/                    ← Matched transactions
│   │   │   ├── {matchId}
│   │   │   │   ├── bankTransactionId (reference)
│   │   │   │   ├── ledgerTransactionId (reference)
│   │   │   │   └── status: 'matched' | 'unmatched'
│   │   │   │
│   │   └── adjustments/                ← Adjustment entries
│   │       ├── {adjustmentId}
│   │       │   ├── journalEntryId (reference)
│   │       │   └── description
│   │
│
├── bankAccounts/                       ← Bank account metadata
│   ├── {accountId}
│   │   ├── accountNumber
│   │   ├── accountName
│   │   └── currency
│   │
│
└── accountTemplate/                    ← Chart of Accounts
    ├── {templateId}
    │   ├── code: "1100" | "5000" etc
    │   ├── name: "Bank Account" | "Salaries"
    │   ├── type: 'asset' | 'liability' | 'revenue' | 'expense'
    │   └── balance
```

## 4. Data Flow: From Bank Transaction to Posted Entry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              SINGLE TRANSACTION: From Upload to Ledger Post                  │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: PDF Upload
─────────────────
Bank Statement PDF
    │
    ▼
Convert to Base64 → Firebase Function (extractPDFContent) → Gemini API
    │                           │
    └───────────────────────────┘
                 │
                 ▼
       ┌─────────────────────┐
       │   Extracted Data    │
       │  {date, desc, amt}  │
       └─────────────────────┘


STEP 2: Store in Firestore
──────────────────────────
┌─────────────────────────────────────────────────┐
│  bank_statements/{statementId}                  │
│  - companyId: "company123"                      │
│  - transactions: [                              │
│      {                                           │
│        date: "2024-10-15",                      │
│        description: "SALARY PAYMENT",           │
│        debit: 5000,                             │
│        credit: 0,                               │
│        balance: 45000                           │
│      }                                           │
│    ]                                             │
└─────────────────────────────────────────────────┘


STEP 3: Load in UI & Map
────────────────────────
BankToLedgerImport Component
    │
    ├─ Load: bank_statements/{statementId}
    ├─ Load: companies/{companyId}/glMappingRules (all active)
    ├─ Load: companies/{companyId}/accountTemplate (GL accounts)
    │
    ▼
Apply MappingPipeline:
    1. Check rules: pattern "SALARY" → glAccount "5100" (Salaries Expense)
    2. Confidence: 95% (exact match from rule)
    3. Suggest: debit account = Bank (1100), credit account = Salaries (5100)


STEP 4: User Approves Mapping
─────────────────────────────
User reviews suggestion:
  - From: Bank (1100) - debit 5000
  - To: Salaries (5100) - credit 5000
  └─ Click "Post to Ledger"


STEP 5: Create Import Session
──────────────────────────────
┌────────────────────────────────────────────────────┐
│  companies/{companyId}/bankImportSessions/{id}     │
│  - transactions: [...]                             │
│  - status: 'pending' → 'processing' → 'completed'  │
│  - metadata: { statementId, processedTx: 1 }       │
└────────────────────────────────────────────────────┘


STEP 6: Create Journal Entry
────────────────────────────
BankToLedgerService.createJournalEntry():
┌────────────────────────────────────────────────────────┐
│  journal_entries/{id}                                  │
│  - id: "bank_tx123_1729100000"                        │
│  - tenantId: "company123"                             │
│  - source: "bank_import"                              │
│  - status: "draft" → "posted"                         │
│  - journalCode: "BANK_IMPORT"                         │
│  - reference: "BANK-tx123"                            │
│  - description: "Bank import: SALARY PAYMENT"         │
│  - fiscalPeriodId: "2024-10"                          │
│  - transactionDate: 2024-10-15                        │
│  - metadata: {                                         │
│      bankTransactionId: "tx123",                      │
│      originalDescription: "SALARY PAYMENT"           │
│    }                                                   │
│  - lines: [                                            │
│      {                                                 │
│        id: "tx123_debit",                             │
│        accountId: "acc1100",                          │
│        accountCode: "1100",                           │
│        accountName: "Bank Account",                   │
│        debit: 5000,                                   │
│        credit: 0                                      │
│      },                                               │
│      {                                                 │
│        id: "tx123_credit",                            │
│        accountId: "acc5100",                          │
│        accountCode: "5100",                           │
│        accountName: "Salaries Expense",              │
│        debit: 0,                                      │
│        credit: 5000                                   │
│      }                                                 │
│    ]                                                   │
└────────────────────────────────────────────────────────┘


STEP 7: Validate & Post
──────────────────────
PostingService.validate():
  - Check: total debit (5000) == total credit (5000) ✓ BALANCED
  - Check: fiscal period is OPEN ✓
  - Check: all accounts exist ✓

PostingService.post():
  Creates 2 ledger entries (one for each journal line)


STEP 8: Create Ledger Entries
──────────────────────────────
Entry 1 - Debit (Money OUT):
┌────────────────────────────────────────────────────┐
│  general_ledger/{ledgerId1}                         │
│  - id: auto-generated                              │
│  - tenantId: "company123"                           │
│  - journalEntryId: "bank_tx123_1729100000"         │
│  - journalLineId: "tx123_debit"                     │
│  - accountId: "acc1100"                             │
│  - accountCode: "1100"                              │
│  - accountName: "Bank Account"                      │
│  - debit: 5000                                      │
│  - credit: 0                                        │
│  - source: "bank_import"                            │
│  - metadata: { bankTransactionId: "tx123" }         │
│  - postingDate: 2024-10-15                          │
└────────────────────────────────────────────────────┘

Entry 2 - Credit (Money IN):
┌────────────────────────────────────────────────────┐
│  general_ledger/{ledgerId2}                         │
│  - id: auto-generated                              │
│  - tenantId: "company123"                           │
│  - journalEntryId: "bank_tx123_1729100000"         │
│  - journalLineId: "tx123_credit"                    │
│  - accountId: "acc5100"                             │
│  - accountCode: "5100"                              │
│  - accountName: "Salaries Expense"                 │
│  - debit: 0                                         │
│  - credit: 5000                                     │
│  - source: "bank_import"                            │
│  - metadata: { bankTransactionId: "tx123" }         │
│  - postingDate: 2024-10-15                          │
└────────────────────────────────────────────────────┘


RESULT
──────
Bank Account (1100):  -5000 (debit)
Salaries Expense (5100): +5000 (credit)
NET: 0 (balanced journal entry posted successfully)
```

## 5. Deletion/Cleanup Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               SAFE DATA CLEANUP ORDER (Reverse Dependency)                   │
└─────────────────────────────────────────────────────────────────────────────┘

                              START CLEANUP
                                    │
                    ┌───────────────┴───────────────┐
                    │ Find all affected documents  │
                    └───────────────┬───────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: bank_statements/statementId    │
                    └───────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: bankImportSessions by statement │
                    └───────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: journal_entries by session      │
                    │ WHERE source = 'bank_import'          │
                    └───────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: general_ledger by journalId     │
                    │ WHERE journalEntryId IN [...]          │
                    └───────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: glMappingRules by company       │
                    └───────────────┬───────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────────────┐
                    │ Query: reconciliationMatches          │
                    │ by journalEntryId                      │
                    └───────────────┬───────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │ VALIDATION                    │
                    │ - Are all entries draft/void? │
                    │ - No other references exist?  │
                    └───────────────┬───────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                   ✓ SAFE              ✗ BLOCKED
                        │                       │
                        ▼                       ▼
                DELETE SEQUENCE        HALT & REPORT
                        │              (dependencies exist)
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
    DELETE        DELETE           DELETE
    reconciliation glMappingRules   bank_statements
    matches/      (optional)        /statements
    adjustments
        │               │               │
        └───────────────┼───────────────┘
                        ▼
        ┌───────────────────────────────────────┐
        │ DELETE journal_entries                │
        │ BEFORE general_ledger entries!        │
        │ (if no fiscal period validation)      │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │ DELETE general_ledger entries         │
        │ (ledger entries orphaned)             │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │ DELETE bankImportSessions             │
        │ (transaction data removed)            │
        └───────────────┬───────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────────────┐
        │ DELETE bank_statements                │
        │ (original data removed)               │
        └───────────────────────────────────────┘
                        │
                        ▼
                    CLEANUP COMPLETE
```

## 6. Multi-Transaction Posting Scenario

```
┌─────────────────────────────────────────────────────────────────────────────┐
│               BULK POSTING: Multiple Transactions from Statement             │
└─────────────────────────────────────────────────────────────────────────────┘

Bank Statement: Oct 2024 (5 transactions)
│
├─ Tx1: Salary Payment (5000) → Pattern Match → 95% confidence
├─ Tx2: Rent Payment (1500) → Pattern Match → 90% confidence
├─ Tx3: Office Supplies (250) → Fuzzy Match → 70% confidence → NEEDS REVIEW
├─ Tx4: Unknown Payment (300) → No Match → NEEDS AI
└─ Tx5: Interest Income (50) → Pattern Match → 85% confidence

                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ MappingPipeline.processTransactions()
                    │ Result:                          │
                    │ - autoMapped: 3 (Tx1,2,5)       │
                    │ - needsReview: 1 (Tx3)          │
                    │ - needsAI: 1 (Tx4)              │
                    └──────────────────────────────────┘
                                    │
                        ┌───────────┴───────────┐
                        │                       │
                        ▼                       ▼
                  USER REVIEWS              AI PROCESSING
                        │                       │
                    User approves            Claude suggests:
                    Tx3 mapping              "Unknown Payment"
                                             → Could be:
                    User manually            - Office expense?
                    maps Tx4 to              - Vendor payment?
                    Utilities account        - Supply purchase?
                                             │
                                             ▼
                                         User confirms
                                         or modifies
                                             │
                        ┌───────────────────┘
                        │
                        ▼
                    ┌────────────────────────────────────┐
                    │ BankImportSession created          │
                    │ - 5 transactions ready             │
                    │ - All have mappings                │
                    │ - status: 'pending'                │
                    └────────────────────────────────────┘
                                    │
                    USER: Click "Post All to Ledger"
                                    │
                                    ▼
                    ┌────────────────────────────────────┐
                    │ postToLedger() processing:         │
                    │                                    │
                    │ For each of 5 transactions:        │
                    │  1. Create journal entry           │
                    │  2. Create 2 journal lines         │
                    │  3. Call PostingService.post()     │
                    │  4. Create 2 ledger entries        │
                    └────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────────────────────┐
                    │                                                │
                    ▼                                                ▼
         ┌────────────────────────┐              ┌──────────────────────────┐
         │ 5 Journal Entries      │              │ 10 Ledger Entries        │
         │ Created & Posted       │              │ (2 per journal entry)    │
         ├────────────────────────┤              ├──────────────────────────┤
         │ bank_tx1_..._timestamp │              │ Ledger 1a: Bank Debit    │
         │ bank_tx2_..._timestamp │              │ Ledger 1b: Salary Credit │
         │ bank_tx3_..._timestamp │              │ Ledger 2a: Bank Debit    │
         │ bank_tx4_..._timestamp │              │ Ledger 2b: Rent Credit   │
         │ bank_tx5_..._timestamp │              │ ... (8 more entries)     │
         └────────────────────────┘              └──────────────────────────┘
                    │                                        │
                    └────────────────┬──────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │ Account Balances Updated:          │
                    │ - Bank: -6850 (all debits)         │
                    │ - Salary: +5000 (credit)           │
                    │ - Rent: +1500 (credit)             │
                    │ - Utilities: +300 (credit)         │
                    │ - Interest: +50 (credit)           │
                    │ - Supplies: +250 (credit)          │
                    │ NET: 0 (balanced)                  │
                    └────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────────┐
                    │ Session Updated                    │
                    │ - status: 'completed'              │
                    │ - processedTransactions: 5         │
                    │ - updatedAt: timestamp             │
                    └────────────────────────────────────┘
```

