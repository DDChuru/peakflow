# Staging Ledger Implementation - "Import-Export Pack"

**Goal**: Add staging area for bank imports that allows preview, verification, and export before posting to production ledger.

---

## Architecture Overview

### The Concept

**Staging = Real ledger entries in separate collections**

Instead of mock data or temporary calculations, we create actual journal and GL entries in staging collections. This allows:
- ✅ Generate real reports (Balance Sheet, Trial Balance) from staging
- ✅ Preview before posting to production
- ✅ Export for external systems (Pastel, Sage)
- ✅ Archive processed imports

### Data Flow

```
Bank Statement Upload
    ↓
Map Transactions (AI/Rules)
    ↓
POST TO STAGING ← Creates real entries in staging collections
    ├─> staging_journal_entries (36 entries)
    └─> staging_general_ledger (72 entries)
    ↓
REVIEW & PREVIEW ← Generate reports from staging
    ├─> Staging Balance Sheet ✅
    ├─> Staging Trial Balance ✅
    └─> Staging Income Statement ✅
    ↓
USER DECISION:
    ├─> POST TO PRODUCTION ← Batch copy to production collections
    │       ├─> journal_entries
    │       └─> general_ledger
    │
    ├─> EXPORT CSV/EXCEL ← For Pastel/Sage/etc.
    │
    └─> DELETE/RE-MAP ← Adjust and re-stage
    ↓
ARCHIVE ← Mark as archived (view filter, not data movement)
```

---

## Collections Structure

### New Collections

#### 1. `staging_journal_entries`

**Purpose**: Staging area for journal entries before posting to production

**Structure**: Identical to `journal_entries` with additional fields

```typescript
{
  // Unique ID for staging entry
  id: "staging_journal_abc123",

  // Link to source
  tenantId: "Na1KU0ogKFLJ5cUzrMrU",
  bankImportSessionId: "import_xyz789",

  // Status tracking
  status: "staged" | "posted" | "exported" | "archived",

  // Standard journal entry fields (same as production)
  fiscalPeriodId: "2024-11",
  journalCode: "BANK_IMPORT",
  reference: "BANK-f4E2GCswekSwt468yIvE-tx-0",
  description: "Bank import: FNB App Prepaid Airtime",
  source: "bank_import",
  transactionDate: Timestamp,
  postingDate: Timestamp,
  lines: [
    {
      id: "line_1",
      accountId: "KjvZu8gqRiilE4Vbi6O9",
      accountCode: "6000",
      accountName: "Operating Expenses",
      debit: 89,
      credit: 0,
      currency: "ZAR"
    },
    {
      id: "line_2",
      accountId: "Yjp89d2fTXI2QTiocYlc",
      accountCode: "1000",
      accountName: "Current Assets",
      debit: 0,
      credit: 89,
      currency: "ZAR"
    }
  ],

  // Staging-specific fields
  stagedAt: Timestamp,
  postedAt: Timestamp | null,
  exportedAt: Timestamp | null,
  archivedAt: Timestamp | null,

  // Link to production entry after posting
  productionJournalId: "journal_real_123" | null,

  // Metadata
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdBy: "userId"
}
```

#### 2. `staging_general_ledger`

**Purpose**: Staging area for GL entries before posting to production

**Structure**: Identical to `general_ledger` with additional fields

```typescript
{
  // Unique ID for staging entry
  id: "staging_gl_abc123",

  // Link to source
  tenantId: "Na1KU0ogKFLJ5cUzrMrU",
  bankImportSessionId: "import_xyz789",

  // Status tracking
  status: "staged" | "posted" | "exported" | "archived",

  // Standard GL fields (same as production)
  journalEntryId: "staging_journal_abc123",
  journalLineId: "line_1",
  accountId: "KjvZu8gqRiilE4Vbi6O9",
  accountCode: "6000",
  accountName: "Operating Expenses",
  debit: 89,
  credit: 0,
  cumulativeBalance: 89,
  currency: "ZAR",
  transactionDate: Timestamp,
  postingDate: Timestamp,
  fiscalPeriodId: "2024-11",
  source: "bank_import",
  description: "Bank import: FNB App Prepaid Airtime",
  metadata: {
    bankTransactionId: "tx-0",
    originalDescription: "FNB App Prepaid Airtime"
  },

  // Staging-specific fields
  stagedAt: Timestamp,
  postedAt: Timestamp | null,
  exportedAt: Timestamp | null,
  archivedAt: Timestamp | null,

  // Link to production entry after posting
  productionGLId: "gl_real_123" | null,

  // Metadata
  createdAt: Timestamp
}
```

### Enhanced Existing Collections

#### 3. `bankImportSessions` (enhanced)

**Add new fields:**

```typescript
{
  // Existing fields
  sessionId: "import_xyz789",
  bankStatementId: "stmt_123",
  companyId: "Na1KU0ogKFLJ5cUzrMrU",
  transactionCount: 36,
  mappedCount: 36,

  // NEW: Enhanced status
  status: "draft" | "mapped" | "staged" | "posted" | "exported" | "archived",

  // NEW: Staging summary
  staging: {
    journalEntryCount: 36,
    glEntryCount: 72,
    totalDebits: 238249.19,
    totalCredits: 238249.19,
    isBalanced: true,
    stagedAt: Timestamp
  },

  // NEW: Production posting summary
  production: {
    journalEntryIds: ["journal_1", "journal_2", ...],
    glEntryIds: ["gl_1", "gl_2", ...],
    postedAt: Timestamp,
    postedBy: "userId"
  } | null,

  // NEW: Export tracking
  exports: [{
    format: "csv" | "excel",
    system: "pastel" | "sage" | "generic",
    exportedAt: Timestamp,
    downloadUrl: "...",
    filename: "import_xyz789_pastel.csv"
  }],

  // NEW: Archive tracking
  archivedAt: Timestamp | null,
  archivedBy: "userId" | null,

  // Existing fields
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### 4. `bank_statements` (enhanced)

**Add new field:**

```typescript
{
  // Existing fields
  id: "stmt_123",
  companyId: "Na1KU0ogKFLJ5cUzrMrU",
  // ... other fields

  // NEW: Archive flag (view filter, not separate collection)
  archived: boolean,
  archivedAt: Timestamp | null
}
```

---

## Service Implementation

### 1. Enhanced Bank-to-Ledger Service

**File**: `/src/lib/accounting/bank-to-ledger-service.ts`

#### Method: `postToStaging()`

**Purpose**: Create journal and GL entries in staging collections

```typescript
async postToStaging(sessionId: string): Promise<StagingResult> {
  // 1. Load bank import session
  const session = await this.getSession(sessionId);

  // 2. Load mapped transactions
  const transactions = await this.getSessionTransactions(sessionId);

  // 3. Generate journal entries (in memory)
  const journalEntries = transactions.map(tx => this.createJournalEntry(tx, session));

  // 4. Generate GL entries from journal entries (in memory)
  const glEntries = journalEntries.flatMap(je => this.createGLEntries(je));

  // 5. Verify balance
  const balance = this.verifyBalance(glEntries);
  if (!balance.isBalanced) {
    throw new Error(`Import not balanced: ${balance.difference}`);
  }

  // 6. Batch write to staging_journal_entries
  const stagingJournalIds = await this.batchWriteToCollection(
    'staging_journal_entries',
    journalEntries.map(je => ({
      ...je,
      bankImportSessionId: sessionId,
      status: 'staged',
      stagedAt: Timestamp.now(),
      productionJournalId: null
    }))
  );

  // 7. Batch write to staging_general_ledger
  const stagingGLIds = await this.batchWriteToCollection(
    'staging_general_ledger',
    glEntries.map(gl => ({
      ...gl,
      bankImportSessionId: sessionId,
      status: 'staged',
      stagedAt: Timestamp.now(),
      productionGLId: null
    }))
  );

  // 8. Update session with staging summary
  await this.updateSession(sessionId, {
    status: 'staged',
    staging: {
      journalEntryCount: journalEntries.length,
      glEntryCount: glEntries.length,
      totalDebits: balance.totalDebits,
      totalCredits: balance.totalCredits,
      isBalanced: balance.isBalanced,
      stagedAt: Timestamp.now()
    }
  });

  return {
    success: true,
    journalCount: journalEntries.length,
    glCount: glEntries.length,
    balance
  };
}
```

#### Method: `postToProduction()`

**Purpose**: Batch copy from staging → production collections

```typescript
async postToProduction(sessionId: string): Promise<ProductionResult> {
  // 1. Load staging entries for this session
  const stagingJournals = await db.collection('staging_journal_entries')
    .where('bankImportSessionId', '==', sessionId)
    .where('status', '==', 'staged')
    .get();

  const stagingGLs = await db.collection('staging_general_ledger')
    .where('bankImportSessionId', '==', sessionId)
    .where('status', '==', 'staged')
    .get();

  if (stagingJournals.empty || stagingGLs.empty) {
    throw new Error('No staged entries found for this session');
  }

  // 2. Verify still balanced (safety check)
  const balance = this.verifyBalanceFromDocs(stagingGLs.docs);
  if (!balance.isBalanced) {
    throw new Error('Staging data no longer balanced - cannot post');
  }

  // 3. Prepare production journal entries
  const productionJournals = stagingJournals.docs.map(doc => {
    const data = doc.data();
    return {
      // Copy all fields except staging-specific ones
      tenantId: data.tenantId,
      fiscalPeriodId: data.fiscalPeriodId,
      journalCode: data.journalCode,
      reference: data.reference,
      description: data.description,
      status: 'posted',
      source: data.source,
      transactionDate: data.transactionDate,
      postingDate: Timestamp.now(), // Use current time for posting
      lines: data.lines,
      metadata: data.metadata,
      createdBy: data.createdBy,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
  });

  // 4. Batch write to journal_entries (production)
  const productionJournalIds = await this.batchWriteToCollection(
    'journal_entries',
    productionJournals
  );

  // 5. Create mapping: staging journal ID → production journal ID
  const journalIdMap = new Map();
  stagingJournals.docs.forEach((doc, idx) => {
    journalIdMap.set(doc.id, productionJournalIds[idx]);
  });

  // 6. Prepare production GL entries (with updated journal references)
  const productionGLs = stagingGLs.docs.map(doc => {
    const data = doc.data();
    const productionJournalId = journalIdMap.get(data.journalEntryId);

    return {
      tenantId: data.tenantId,
      journalEntryId: productionJournalId, // ← Updated reference
      journalLineId: data.journalLineId,
      accountId: data.accountId,
      accountCode: data.accountCode,
      accountName: data.accountName,
      debit: data.debit,
      credit: data.credit,
      cumulativeBalance: data.cumulativeBalance,
      currency: data.currency,
      transactionDate: data.transactionDate,
      postingDate: Timestamp.now(),
      fiscalPeriodId: data.fiscalPeriodId,
      source: data.source,
      description: data.description,
      metadata: data.metadata,
      createdAt: Timestamp.now()
    };
  });

  // 7. Batch write to general_ledger (production)
  const productionGLIds = await this.batchWriteToCollection(
    'general_ledger',
    productionGLs
  );

  // 8. Update staging entries with production links and status
  const stagingUpdates = [];

  stagingJournals.docs.forEach((doc, idx) => {
    stagingUpdates.push(
      doc.ref.update({
        status: 'posted',
        postedAt: Timestamp.now(),
        productionJournalId: productionJournalIds[idx]
      })
    );
  });

  stagingGLs.docs.forEach((doc, idx) => {
    stagingUpdates.push(
      doc.ref.update({
        status: 'posted',
        postedAt: Timestamp.now(),
        productionGLId: productionGLIds[idx]
      })
    );
  });

  await Promise.all(stagingUpdates);

  // 9. Update session
  await this.updateSession(sessionId, {
    status: 'posted',
    production: {
      journalEntryIds: productionJournalIds,
      glEntryIds: productionGLIds,
      postedAt: Timestamp.now(),
      postedBy: auth.currentUser?.uid
    }
  });

  return {
    success: true,
    journalCount: productionJournalIds.length,
    glCount: productionGLIds.length
  };
}
```

#### Method: `exportStaging()`

**Purpose**: Export staging data to CSV/Excel for external systems

```typescript
async exportStaging(
  sessionId: string,
  format: 'csv' | 'excel',
  system: 'pastel' | 'sage' | 'generic'
): Promise<ExportResult> {
  // 1. Load staging journal entries
  const stagingJournals = await db.collection('staging_journal_entries')
    .where('bankImportSessionId', '==', sessionId)
    .where('status', '==', 'staged')
    .get();

  if (stagingJournals.empty) {
    throw new Error('No staged entries to export');
  }

  // 2. Format data based on target system
  let formattedData;
  switch (system) {
    case 'pastel':
      formattedData = this.formatForPastel(stagingJournals.docs);
      break;
    case 'sage':
      formattedData = this.formatForSage(stagingJournals.docs);
      break;
    default:
      formattedData = this.formatGeneric(stagingJournals.docs);
  }

  // 3. Generate file
  let file;
  let filename;

  if (format === 'csv') {
    file = this.generateCSV(formattedData);
    filename = `bank_import_${sessionId}_${system}.csv`;
  } else {
    file = this.generateExcel(formattedData);
    filename = `bank_import_${sessionId}_${system}.xlsx`;
  }

  // 4. Update staging entries status
  await Promise.all(
    stagingJournals.docs.map(doc =>
      doc.ref.update({
        status: 'exported',
        exportedAt: Timestamp.now()
      })
    )
  );

  // 5. Track export in session
  await this.updateSession(sessionId, {
    status: 'exported',
    exports: FieldValue.arrayUnion({
      format,
      system,
      exportedAt: Timestamp.now(),
      filename
    })
  });

  return {
    success: true,
    file,
    filename
  };
}
```

#### Method: `archiveImport()`

**Purpose**: Mark import as archived (view filter, not data movement)

```typescript
async archiveImport(sessionId: string): Promise<void> {
  // 1. Update session
  await this.updateSession(sessionId, {
    status: 'archived',
    archivedAt: Timestamp.now(),
    archivedBy: auth.currentUser?.uid
  });

  // 2. Update staging entries
  const updates = [];

  // Archive staging journals
  const journals = await db.collection('staging_journal_entries')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  journals.docs.forEach(doc => {
    updates.push(doc.ref.update({
      status: 'archived',
      archivedAt: Timestamp.now()
    }));
  });

  // Archive staging GLs
  const gls = await db.collection('staging_general_ledger')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  gls.docs.forEach(doc => {
    updates.push(doc.ref.update({
      status: 'archived',
      archivedAt: Timestamp.now()
    }));
  });

  await Promise.all(updates);

  // 3. Mark bank statement as archived
  const session = await this.getSession(sessionId);
  if (session.bankStatementId) {
    await db.collection('bank_statements')
      .doc(session.bankStatementId)
      .update({
        archived: true,
        archivedAt: Timestamp.now()
      });
  }
}
```

---

## Report Service Modifications

### Dual-Mode Reports

**Modify existing report services to accept data source parameter**

**File**: `/src/lib/reporting/financial-statements-service.ts`

```typescript
class FinancialStatementsService {

  async generateBalanceSheet(
    tenantId: string,
    options: {
      dataSource?: 'production' | 'staging',  // ← NEW
      sessionId?: string,  // ← NEW: For specific import preview
      startDate?: Date,
      endDate?: Date,
      fiscalPeriodId?: string
    } = {}
  ): Promise<BalanceSheet> {

    const {
      dataSource = 'production',  // Default to production
      sessionId
    } = options;

    // Select collection based on data source
    const glCollection = dataSource === 'staging'
      ? 'staging_general_ledger'
      : 'general_ledger';

    // Build query
    let query = db.collection(glCollection)
      .where('tenantId', '==', tenantId);

    // If viewing specific import, filter by session
    if (sessionId && dataSource === 'staging') {
      query = query.where('bankImportSessionId', '==', sessionId);
      // Only show staged/posted entries, not archived
      query = query.where('status', 'in', ['staged', 'posted']);
    }

    // Add date filters if provided
    if (options.startDate) {
      query = query.where('transactionDate', '>=', options.startDate);
    }
    if (options.endDate) {
      query = query.where('transactionDate', '<=', options.endDate);
    }

    // Rest of balance sheet logic stays the same!
    const glEntries = await query.get();
    return this.computeBalanceSheet(glEntries.docs);
  }

  // Same pattern for other reports
  async generateIncomeStatement(tenantId, options = {}) { ... }
  async generateTrialBalance(tenantId, options = {}) { ... }
}
```

---

## UI Implementation

### Staging Review Screen

**Component**: `/src/components/banking/StagingReview.tsx`

```tsx
interface StagingReviewProps {
  sessionId: string;
  onPost: () => void;
  onExport: (format: string, system: string) => void;
  onDelete: () => void;
}

export function StagingReview({ sessionId, onPost, onExport, onDelete }: StagingReviewProps) {
  const [session, setSession] = useState<BankImportSession>();
  const [activeReport, setActiveReport] = useState<'balance-sheet' | 'trial-balance' | 'income'>('balance-sheet');

  return (
    <div className="staging-review">
      {/* Header */}
      <div className="header">
        <h2>Bank Import Review - Staging Area</h2>
        <Badge>Not Posted Yet</Badge>
      </div>

      {/* Balance Summary */}
      <Card>
        <h3>Balance Verification</h3>
        <div className="balance-grid">
          <div>
            <label>Total Debits</label>
            <p>{formatCurrency(session.staging.totalDebits)}</p>
          </div>
          <div>
            <label>Total Credits</label>
            <p>{formatCurrency(session.staging.totalCredits)}</p>
          </div>
          <div>
            <label>Difference</label>
            <p className={session.staging.isBalanced ? 'balanced' : 'error'}>
              {formatCurrency(session.staging.totalDebits - session.staging.totalCredits)}
            </p>
          </div>
          <div>
            <label>Status</label>
            <p>{session.staging.isBalanced ? '✅ Balanced' : '❌ Unbalanced'}</p>
          </div>
        </div>
      </Card>

      {/* Report Preview Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="income">Income Statement</TabsTrigger>
        </TabsList>

        <TabsContent value="balance-sheet">
          <BalanceSheetReport
            tenantId={session.companyId}
            dataSource="staging"
            sessionId={sessionId}
          />
        </TabsContent>

        <TabsContent value="trial-balance">
          <TrialBalanceReport
            tenantId={session.companyId}
            dataSource="staging"
            sessionId={sessionId}
          />
        </TabsContent>

        <TabsContent value="income">
          <IncomeStatementReport
            tenantId={session.companyId}
            dataSource="staging"
            sessionId={sessionId}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="actions">
        <Button
          onClick={onPost}
          disabled={!session.staging.isBalanced}
          variant="primary"
        >
          ✅ Post to PeakFlow Ledger
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              📊 Export CSV ▼
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onExport('csv', 'pastel')}>
              Pastel Format (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv', 'sage')}>
              Sage Format (.csv)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('csv', 'generic')}>
              Generic CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport('excel', 'generic')}>
              Excel (.xlsx)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={onDelete} variant="ghost">
          🗑️ Delete Staging
        </Button>
      </div>
    </div>
  );
}
```

---

## Archive System

### View Filtering (Not Data Movement)

**Query Pattern for Active Imports:**

```typescript
// Show only active (non-archived) imports
const activeImports = await db.collection('companies')
  .doc(companyId)
  .collection('bankImportSessions')
  .where('archived', '!=', true)  // ← Filter out archived
  .orderBy('createdAt', 'desc')
  .get();
```

**Query Pattern for Archived Imports:**

```typescript
// Show archived imports
const archivedImports = await db.collection('companies')
  .doc(companyId)
  .collection('bankImportSessions')
  .where('archived', '==', true)  // ← Only archived
  .orderBy('archivedAt', 'desc')
  .get();
```

### Automatic Cleanup (Fiscal Year End)

**Cloud Function**: `/functions/src/scheduled/cleanup-archived-staging.ts`

```typescript
// Run daily at midnight
export const cleanupArchivedStaging = functions.pubsub
  .schedule('0 0 * * *')  // Every day at midnight
  .timeZone('Africa/Johannesburg')
  .onRun(async (context) => {

    // Calculate fiscal year end cutoff
    const currentFiscalYearEnd = getCurrentFiscalYearEnd();
    const cutoffDate = Timestamp.fromDate(currentFiscalYearEnd);

    // Find staging entries archived before fiscal year end
    const oldStagingJournals = await admin.firestore()
      .collection('staging_journal_entries')
      .where('status', '==', 'archived')
      .where('archivedAt', '<', cutoffDate)
      .get();

    const oldStagingGLs = await admin.firestore()
      .collection('staging_general_ledger')
      .where('status', '==', 'archived')
      .where('archivedAt', '<', cutoffDate)
      .get();

    // Batch delete
    const batch = admin.firestore().batch();

    oldStagingJournals.docs.forEach(doc => batch.delete(doc.ref));
    oldStagingGLs.docs.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    console.log(`Cleaned up ${oldStagingJournals.size + oldStagingGLs.size} old staging entries`);
  });
```

### Manual Delete

**Service Method:**

```typescript
async deleteStaging(sessionId: string): Promise<void> {
  // 1. Verify not posted yet
  const session = await this.getSession(sessionId);
  if (session.status === 'posted') {
    throw new Error('Cannot delete staging - already posted to production');
  }

  // 2. Delete staging journals
  const journals = await db.collection('staging_journal_entries')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  const journalDeletes = journals.docs.map(doc => doc.ref.delete());

  // 3. Delete staging GLs
  const gls = await db.collection('staging_general_ledger')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  const glDeletes = gls.docs.map(doc => doc.ref.delete());

  await Promise.all([...journalDeletes, ...glDeletes]);

  // 4. Update session
  await this.updateSession(sessionId, {
    status: 'deleted',
    staging: null
  });
}
```

---

## Marketing: "Import-Export Pack"

### Value Proposition

**For Accounting Firms:**
> **Smart Bank Statement Processing**
>
> Process client bank statements with AI-powered mapping, preview financial reports before posting, and export to any accounting system.
>
> ✅ Preview Balance Sheet, Trial Balance before committing
> ✅ Export to Pastel, Sage, or any system
> ✅ Verify balance before posting
> ✅ Perfect for multi-client firms

**Use Cases:**
1. **Review with Client**: Generate staging reports, review together, then post
2. **External System Users**: Import & map intelligently, export for Pastel/Sage
3. **Error Prevention**: Catch issues in staging before affecting books
4. **Audit Trail**: Complete history of imports, staging, posting

---

## Implementation Phases

### Phase 1: Core Staging (High Priority)
- [ ] Create `staging_journal_entries` and `staging_general_ledger` collections
- [ ] Implement `postToStaging()` method
- [ ] Implement `postToProduction()` batch migration
- [ ] Add balance verification
- [ ] Update `bankImportSessions` structure

### Phase 2: Report Integration (High Priority)
- [ ] Modify report services to accept `dataSource` parameter
- [ ] Update BalanceSheet component for dual-mode
- [ ] Update TrialBalance component for dual-mode
- [ ] Update IncomeStatement component for dual-mode

### Phase 3: UI (Medium Priority)
- [ ] Create StagingReview component
- [ ] Add report preview tabs
- [ ] Add Post/Export action buttons
- [ ] Add staging balance summary

### Phase 4: Export (Medium Priority)
- [ ] Research Pastel format
- [ ] Research Sage format
- [ ] Implement CSV generation
- [ ] Implement Excel generation
- [ ] Add export tracking

### Phase 5: Archive (Lower Priority)
- [ ] Add archive view filtering
- [ ] Implement manual delete
- [ ] Create cleanup Cloud Function
- [ ] Add "Show Archived" toggle to UI

---

## Success Criteria

✅ Bank import creates entries in staging collections
✅ Reports generate from staging data (Balance Sheet, Trial Balance, etc.)
✅ Posting migrates staging → production in batch
✅ Export generates CSV/Excel from staging
✅ Archive system filters views (not moves data)
✅ Auto-cleanup removes old staging data after fiscal year
✅ All existing functionality continues to work

---

## Next Steps

1. Review this implementation plan
2. Confirm approach
3. Start with Phase 1 implementation
4. Test with Orlicron data (currently in production)
5. Iterate based on findings
