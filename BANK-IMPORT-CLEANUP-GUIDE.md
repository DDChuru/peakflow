# Bank Import Data Cleanup Script - Implementation Guide

## Quick Reference

### Collections That Need Cleanup

| Collection | Scope | Deletable | Notes |
|-----------|-------|----------|-------|
| `bank_statements` | Root | Yes (if orphaned) | Primary data source |
| `usage_tracking` | Root | Optional | Audit trail only |
| `companies/{cId}/bankImportSessions` | Company | Yes | Session tracking |
| `companies/{cId}/glMappingRules` | Company | Optional | Reusable rules |
| `journal_entries` | Root | Conditional* | *Must be draft or voided |
| `general_ledger` | Root | Conditional* | *Only if journal deleted |
| `companies/{cId}/reconciliations/{sId}/matches` | Session | Yes | If reconciled |
| `companies/{cId}/reconciliations/{sId}/adjustments` | Session | Yes | If reconciled |

### Field References to Track

```typescript
// Bank Statement → Import Session
bank_statements/{statementId}
  └─ metadata.statementId (referenced in sessions)

// Import Session → Journal Entry  
companies/{companyId}/bankImportSessions/{sessionId}
  └─ metadata.statementId (which statement it came from)

// Bank Transaction → Journal Entry
journal_entries/{journalEntryId}
  ├─ metadata.bankTransactionId (which bank tx it represents)
  ├─ source: 'bank_import' (how to find it)
  └─ lines: [] (each line creates a ledger entry)

// Journal Entry → Ledger Entry
general_ledger/{ledgerEntryId}
  ├─ journalEntryId (reference back)
  └─ metadata.bankTransactionId (original source)

// Journal Entry → Reconciliation
companies/{companyId}/reconciliations/{sessionId}/matches/{matchId}
  └─ ledgerTransactionId (which ledger entry)
```

---

## Implementation Steps

### Step 1: Query Pattern for Finding Related Documents

```typescript
// Given a bank statement ID, find all related documents
async function findAllRelatedDocuments(statementId: string, companyId: string) {
  const db = getFirestore();
  
  // 1. Get the bank statement
  const stmt = await getDoc(doc(db, 'bank_statements', statementId));
  if (!stmt.exists()) throw new Error('Statement not found');
  
  // 2. Find import sessions that reference this statement
  const sessionsSnap = await getDocs(query(
    collection(db, `companies/${companyId}/bankImportSessions`),
    where('metadata.statementId', '==', statementId)
  ));
  const sessionIds = sessionsSnap.docs.map(d => d.id);
  
  // 3. For each session, find journal entries created from it
  // Note: Sessions don't store journal IDs directly, but we can search by:
  // - Looking at metadata.bankTransactionId in journal entries
  // - And checking if the bank transaction was in the statement
  
  const journalSnap = await getDocs(query(
    collection(db, 'journal_entries'),
    where('tenantId', '==', companyId),
    where('source', '==', 'bank_import')
  ));
  
  // Filter to only those related to this statement's transactions
  const stmtTxIds = new Set(stmt.data().transactions.map(t => t.id));
  const journalIds = journalSnap.docs
    .filter(d => stmtTxIds.has(d.data().metadata?.bankTransactionId))
    .map(d => d.id);
  
  // 4. For each journal entry, find ledger entries
  const ledgerSnap = await getDocs(query(
    collection(db, 'general_ledger'),
    where('tenantId', '==', companyId)
  ));
  
  const ledgerIds = ledgerSnap.docs
    .filter(d => journalIds.includes(d.data().journalEntryId))
    .map(d => d.id);
  
  // 5. Find reconciliation matches for these ledger entries
  const reconciledTxIds = new Set(ledgerIds);
  let reconciliationMatches = [];
  
  const reconciliationSnap = await getDocs(
    collection(db, `companies/${companyId}/reconciliations`)
  );
  
  for (const reconSession of reconciliationSnap.docs) {
    const matchesSnap = await getDocs(
      collection(db, reconSession.ref.path + '/matches')
    );
    reconciliationMatches.push(...matchesSnap.docs
      .filter(d => reconciledTxIds.has(d.data().ledgerTransactionId))
      .map(d => ({ sessionId: reconSession.id, matchId: d.id, ref: d.ref }))
    );
  }
  
  return {
    statement: { id: statementId, ref: doc(db, 'bank_statements', statementId) },
    sessions: sessionIds.map(id => ({ id, ref: doc(db, `companies/${companyId}/bankImportSessions`, id) })),
    journalEntries: journalIds.map(id => ({ id, ref: doc(db, 'journal_entries', id) })),
    ledgerEntries: ledgerIds.map(id => ({ id, ref: doc(db, 'general_ledger', id) })),
    reconciliationMatches: reconciliationMatches
  };
}
```

### Step 2: Validation Before Deletion

```typescript
async function validateCanDelete(documents: any, options: { force?: boolean } = {}) {
  const issues = [];
  
  // Check journal entries status
  for (const journal of documents.journalEntries) {
    const journalDoc = await getDoc(journal.ref);
    const status = journalDoc.data()?.status;
    
    if (status === 'posted' && !options.force) {
      issues.push(`Journal entry ${journal.id} is POSTED. Cannot delete without --force flag.`);
    }
  }
  
  // Check for other references to ledger entries (e.g., in other reconciliations)
  for (const ledger of documents.ledgerEntries) {
    const ledgerDoc = await getDoc(ledger.ref);
    const journalId = ledgerDoc.data()?.journalEntryId;
    
    // Check if this ledger entry is referenced elsewhere
    // (This shouldn't happen in normal cleanup, but good to verify)
  }
  
  if (issues.length > 0) {
    return {
      canDelete: false,
      issues: issues
    };
  }
  
  return {
    canDelete: true,
    issues: []
  };
}
```

### Step 3: Report Impact

```typescript
async function reportDeletionImpact(documents: any) {
  const db = getFirestore();
  
  let report = {
    bankStatements: 0,
    sessions: 0,
    journalEntries: 0,
    ledgerEntries: 0,
    reconciliationMatches: 0,
    totalTransactions: 0,
    totalAmount: 0
  };
  
  // Get bank statement details
  if (documents.statement) {
    const stmtDoc = await getDoc(documents.statement.ref);
    const stmtData = stmtDoc.data();
    report.bankStatements = 1;
    report.totalTransactions = stmtData?.transactions?.length || 0;
    report.totalAmount = stmtData?.summary?.closingBalance || 0;
  }
  
  report.sessions = documents.sessions.length;
  report.journalEntries = documents.journalEntries.length;
  report.ledgerEntries = documents.ledgerEntries.length;
  report.reconciliationMatches = documents.reconciliationMatches.length;
  
  return report;
}
```

### Step 4: Execute Deletion in Safe Order

```typescript
async function deleteDocumentsInOrder(documents: any, dryRun: boolean = false) {
  const db = getFirestore();
  const deletionLog = [];
  
  if (dryRun) {
    console.log('[DRY RUN] Would delete the following documents in order:');
  }
  
  const operations = [
    {
      name: 'Reconciliation Matches',
      docs: documents.reconciliationMatches,
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted reconciliation match: ${doc.matchId}`);
      }
    },
    {
      name: 'GL Mapping Rules',
      docs: [], // Only delete if --force specified
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted mapping rule: ${doc.id}`);
      }
    },
    {
      name: 'General Ledger Entries',
      docs: documents.ledgerEntries,
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted ledger entry: ${doc.id}`);
      }
    },
    {
      name: 'Journal Entries',
      docs: documents.journalEntries,
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted journal entry: ${doc.id}`);
      }
    },
    {
      name: 'Bank Import Sessions',
      docs: documents.sessions,
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted import session: ${doc.id}`);
      }
    },
    {
      name: 'Bank Statements',
      docs: documents.statement ? [documents.statement] : [],
      operation: async (doc) => {
        if (!dryRun) await deleteDoc(doc.ref);
        deletionLog.push(`Deleted bank statement: ${doc.id}`);
      }
    }
  ];
  
  for (const op of operations) {
    console.log(`\n${op.name} (${op.docs.length} documents)`);
    for (const doc of op.docs) {
      try {
        await op.operation(doc);
        console.log(`  ✓ ${doc.id}`);
      } catch (error) {
        console.error(`  ✗ Failed to delete ${doc.id}: ${error.message}`);
        deletionLog.push(`ERROR: Failed to delete ${doc.id}: ${error.message}`);
      }
    }
  }
  
  return deletionLog;
}
```

### Step 5: Main Cleanup Function

```typescript
async function cleanupBankImport(options: {
  companyId: string;
  statementId: string;
  dryRun?: boolean;
  force?: boolean;
  verbose?: boolean;
}) {
  const db = getFirestore();
  
  console.log(`\nBank Import Cleanup\n${'='.repeat(50)}`);
  console.log(`Company: ${options.companyId}`);
  console.log(`Statement: ${options.statementId}`);
  console.log(`Dry Run: ${options.dryRun ? 'YES' : 'NO'}`);
  console.log(`Force: ${options.force ? 'YES' : 'NO'}`);
  console.log(`${'='.repeat(50)}\n`);
  
  try {
    // Step 1: Find all related documents
    console.log('Step 1: Finding related documents...');
    const documents = await findAllRelatedDocuments(options.statementId, options.companyId);
    console.log(`  Found ${Object.values(documents).flat().length} related documents`);
    
    // Step 2: Validate deletability
    console.log('\nStep 2: Validating deletability...');
    const validation = await validateCanDelete(documents, { force: options.force });
    if (!validation.canDelete) {
      console.error('✗ Cannot delete:');
      validation.issues.forEach(issue => console.error(`  - ${issue}`));
      process.exit(1);
    }
    console.log('✓ All documents can be safely deleted');
    
    // Step 3: Report impact
    console.log('\nStep 3: Impact Report');
    const impact = await reportDeletionImpact(documents);
    console.log(`  Bank Statements: ${impact.bankStatements}`);
    console.log(`  Import Sessions: ${impact.sessions}`);
    console.log(`  Journal Entries: ${impact.journalEntries}`);
    console.log(`  Ledger Entries: ${impact.ledgerEntries}`);
    console.log(`  Reconciliation Matches: ${impact.reconciliationMatches}`);
    console.log(`  Total Transactions: ${impact.totalTransactions}`);
    console.log(`  Total Amount: $${impact.totalAmount.toFixed(2)}`);
    
    if (options.dryRun) {
      console.log('\n[DRY RUN] No documents were deleted');
      return { success: true, dryRun: true, deletionLog: [] };
    }
    
    // Confirm with user
    if (!options.force) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      await new Promise(resolve => {
        rl.question('\nProceed with deletion? (yes/no): ', (answer) => {
          if (answer.toLowerCase() !== 'yes') {
            console.log('Cancelled');
            process.exit(0);
          }
          rl.close();
          resolve(null);
        });
      });
    }
    
    // Step 4: Execute deletion
    console.log('\nStep 4: Executing deletion...');
    const deletionLog = await deleteDocumentsInOrder(documents, false);
    
    console.log('\n' + '='.repeat(50));
    console.log('✓ Cleanup completed successfully');
    console.log('='.repeat(50) + '\n');
    
    return { success: true, dryRun: false, deletionLog };
    
  } catch (error) {
    console.error('\n✗ Cleanup failed:', error.message);
    process.exit(1);
  }
}
```

---

## Usage Examples

```bash
# Dry run - see what would be deleted
npm run cleanup-bank-import -- \
  --company-id company123 \
  --statement-id statement456 \
  --dry-run

# Delete with confirmation prompt
npm run cleanup-bank-import -- \
  --company-id company123 \
  --statement-id statement456

# Force delete without confirmation (use with caution)
npm run cleanup-bank-import -- \
  --company-id company123 \
  --statement-id statement456 \
  --force

# Verbose output
npm run cleanup-bank-import -- \
  --company-id company123 \
  --statement-id statement456 \
  --verbose \
  --dry-run
```

---

## Critical Gotchas

### 1. Posted Journal Entries Cannot Be Deleted

If `journal_entries/{id}.status == 'posted'`, you must either:
- Void the entry first (set status to 'voided')
- Use `--force` flag (development only)
- Manually update the status before running cleanup

### 2. Firestore Transaction Limits

Deleting many documents may hit Firestore transaction limits. Use batching:

```typescript
async function deleteInBatches(refs: any[], batchSize = 500) {
  const db = getFirestore();
  
  for (let i = 0; i < refs.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = refs.slice(i, i + batchSize);
    
    chunk.forEach(ref => batch.delete(ref.ref));
    await batch.commit();
  }
}
```

### 3. References from Reconciliation

If a bank transaction was reconciled (matched to ledger entries), you must:
1. Delete reconciliation matches first
2. Then delete adjustment journal entries
3. Then delete the main journal entry

### 4. GL Mapping Rules

GL mapping rules (from `companies/{cId}/glMappingRules`) are typically reusable and should NOT be deleted unless:
- They were created specifically for this statement (check metadata.source)
- You're certain no other imports use them

---

## Monitoring & Alerts

### What to Check After Cleanup

1. **Account Balances**: Verify GL account balances are correct after deletion
2. **Fiscal Period**: Check if fiscal period is still open/valid
3. **General Ledger**: Query `general_ledger` to ensure no orphaned entries remain
4. **Journal Entries**: Query `journal_entries` where `source='bank_import'` to verify only intended entries were deleted

### Queries for Verification

```typescript
// Check for orphaned ledger entries
const orphanedLedgers = await getDocs(query(
  collection(db, 'general_ledger'),
  where('tenantId', '==', companyId),
  where('source', '==', 'bank_import')
));

// Check remaining bank imports
const remainingImports = await getDocs(query(
  collection(db, `companies/${companyId}/bankImportSessions`),
  where('status', '==', 'completed')
));

// Check account balances changed
const accountsAfter = await coaService.listAccounts();
// Compare with before snapshot
```

---

## Rollback Strategy

If something goes wrong:

1. **Immediate Recovery** (within 24 hours):
   - Use Firestore backups/restore points if available
   - Contact Firebase support for recovery

2. **Manual Recovery**:
   - Recreate bank statement document (you may have a copy)
   - Recreate journal entries from backup
   - Recreate import session for audit trail

3. **Best Practice**:
   - Export important data before cleanup
   - Maintain backup of bank statements
   - Test cleanup on staging first

