# Staging Ledger - Deployment Instructions

## Status: Core Implementation Complete ✅

The staging ledger system has been fully implemented with the following components:

### Completed Components

1. **TypeScript Types** - [src/types/accounting/staging.ts](src/types/accounting/staging.ts)
   - `StagingJournalEntry`
   - `StagingGeneralLedgerEntry`
   - `BalanceVerification`
   - `StagingStatus` enum

2. **Service Methods** - [src/lib/accounting/bank-to-ledger-service.ts](src/lib/accounting/bank-to-ledger-service.ts:635-981)
   - `postToStaging()` - Posts bank import to staging collections
   - `postToProduction()` - Migrates staging entries to production

3. **Firestore Indexes** - [firestore.indexes.json](firestore.indexes.json:248-302)
   - `staging_journal_entries` by `bankImportSessionId + status`
   - `staging_journal_entries` by `tenantId + status`
   - `staging_general_ledger` by `bankImportSessionId + status`
   - `staging_general_ledger` by `tenantId + status`

## Pending Deployment Steps

### 1. Deploy Firestore Indexes

**Option A: Via Firebase CLI (Recommended)**
```bash
firebase deploy --only firestore:indexes --project peakflow-3a2ed
```

**Option B: Via Firebase Console** (if CLI has network issues)
1. Go to: https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes
2. Click "Create Index"
3. Manually create these 4 indexes:

**Index 1: staging_journal_entries (by session)**
- Collection: `staging_journal_entries`
- Fields:
  - `bankImportSessionId` (Ascending)
  - `status` (Ascending)

**Index 2: staging_journal_entries (by tenant)**
- Collection: `staging_journal_entries`
- Fields:
  - `tenantId` (Ascending)
  - `status` (Ascending)

**Index 3: staging_general_ledger (by session)**
- Collection: `staging_general_ledger`
- Fields:
  - `bankImportSessionId` (Ascending)
  - `status` (Ascending)

**Index 4: staging_general_ledger (by tenant)**
- Collection: `staging_general_ledger`
- Fields:
  - `tenantId` (Ascending)
  - `status` (Ascending)

### 2. Test the Staging Workflow

Once indexes are deployed, test with an actual bank import:

```bash
# Navigate to the bank import page
# URL: https://your-app.com/workspace/[companyId]/bank-import

# Import a bank statement
# Map transactions using the UI
# Click "Post to Staging" (instead of "Post Directly")

# Verify staging entries created:
# - Check staging_journal_entries collection in Firestore
# - Check staging_general_ledger collection in Firestore
# - Verify session status = 'staged'

# Review and balance
# Generate reports from staging data

# Post to production
# Click "Post to Production" button
# Verify session status = 'posted'
```

## Network Issue Encountered

During deployment, a network error occurred:

```
Error: Failed to make request to https://firestore.googleapis.com/v1/projects/peakflow-3a2ed/databases/(default)/collectionGroups/-/indexes
```

**Resolution**: Deploy indexes manually via Firebase Console (Option B above) or retry CLI deployment when network is stable.

## Next Steps After Deployment

1. **Modify UI** - Update [BankToLedgerImport.tsx](src/components/banking/BankToLedgerImport.tsx) component to:
   - Add "Post to Staging" button
   - Add "Post to Production" button
   - Display balance verification before posting
   - Show staging status in session

2. **Add Report Dual-Mode** - Update report services to accept `dataSource` parameter:
   - `financial-statements-service.ts`
   - `gl-reports-service.ts`
   - Allow generating reports from staging OR production

3. **Create Staging Review Component** - Build `StagingReview.tsx`:
   - Display staged entries
   - Show balance verification
   - Preview reports
   - Export to CSV/Excel
   - Post to production button

4. **Add Export Functionality**:
   - CSV export for Pastel
   - CSV export for Sage
   - Generic Excel export

5. **Implement Archive System**:
   - View filtering by status
   - Auto-cleanup after fiscal year
   - Manual delete option

## Technical Architecture

### Data Flow

```
Bank Import → postToStaging() → staging_journal_entries + staging_general_ledger
                                 ↓
                         Balance Verification
                                 ↓
                    [Review, Reports, Export]
                                 ↓
                         postToProduction()
                                 ↓
                    journal_entries + general_ledger
```

### Key Features

- **Real entries in staging** - Not mock data, actual accounting entries
- **Balance verification** - Total debits must equal total credits
- **Dual-mode reports** - Generate Balance Sheet, P&L from staging
- **Export capability** - CSV/Excel for external systems
- **Archive system** - Status flags, no data movement
- **Marketable** - "Import-Export Pack" service for accounting firms

## Safety Mechanisms

1. **Balance validation** - `postToStaging()` throws error if debits ≠ credits
2. **Re-verification** - `postToProduction()` re-checks balance before migration
3. **Batch operations** - All writes use Firestore batch for atomicity
4. **Linked records** - Production entries store `productionJournalId` and `productionGLId` for traceability
5. **Session tracking** - `bankImportSession` stores staging and production summaries

## Performance Considerations

- Batch size: 500 operations per batch (Firestore limit)
- Indexes optimize queries by session and tenant
- In-memory generation before write reduces round-trips
- Single batch commit for atomicity

## File References

- Types: [src/types/accounting/staging.ts](src/types/accounting/staging.ts)
- Service: [src/lib/accounting/bank-to-ledger-service.ts](src/lib/accounting/bank-to-ledger-service.ts:635-981)
- Indexes: [firestore.indexes.json](firestore.indexes.json:248-302)
- Implementation Guide: [STAGING-LEDGER-IMPLEMENTATION.md](STAGING-LEDGER-IMPLEMENTATION.md)

---

**Status**: Ready for index deployment and testing
**Blocker**: Network error during index deployment (workaround: manual creation via console)
