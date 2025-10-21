# Staging Ledger - Test Guide

## ✅ What's Been Implemented

1. **Backend Service Methods** - [src/lib/accounting/bank-to-ledger-service.ts](src/lib/accounting/bank-to-ledger-service.ts:835-909)
   - `postToStaging()` - Posts bank imports to staging collections
   - `postToProduction()` - Migrates staging to production (not yet exposed in UI)

2. **UI Updates** - [src/components/banking/BankToLedgerImport.tsx](src/components/banking/BankToLedgerImport.tsx:2028-2058)
   - Added "Post to Staging" button (primary action)
   - Added "Post Directly to Production" button (secondary action)
   - Updated alert message to recommend staging workflow

3. **Data Cleanup** - Orlicron company ledger data has been cleared
   - 72 journal entries deleted ✅
   - 144 GL entries deleted ✅
   - Ready for fresh test

## 🧪 Test Procedure

### Step 1: Start Development Server

```bash
npm run dev
```

### Step 2: Navigate to Bank Import

1. Go to: `http://localhost:3000`
2. Login with your credentials
3. Select **Orlicron** company
4. Navigate to: **Workspace → Bank Import**
   - URL should be: `/workspace/Na1KU0ogKFLJ5cUzrMrU/bank-import`

### Step 3: Import Bank Statement

1. Click "Upload Bank Statement" or use existing statement
2. Select transactions to import
3. Map transactions to GL accounts using the mapping interface
4. Proceed to **Preview** step

### Step 4: Test Staging Workflow

You should now see two buttons:

**Option A: Post to Staging (Recommended)** ⭐
- Click "Post to Staging" button
- Expected result:
  ```
  ✅ Posted X transactions to staging ledger.
  Debits: R1,234.56, Credits: R1,234.56
  ✅ Balanced
  ```

**Option B: Post Directly to Production**
- Click "Post Directly to Production" button
- Expected result:
  ```
  ✅ Posted X transactions to the general ledger
  ```

### Step 5: Verify Staging Data in Firestore

After clicking "Post to Staging":

1. Go to Firebase Console: https://console.firebase.google.com/project/peakflow-3a2ed/firestore
2. Check these collections were created:
   - `staging_journal_entries` - Should have journal entries
   - `staging_general_ledger` - Should have GL entries (2x the journal count)
   - `bankImportSessions` - Should have session with `status: 'staged'`

3. Verify balance:
   - Sum all `debit` amounts in `staging_general_ledger`
   - Sum all `credit` amounts in `staging_general_ledger`
   - They should be equal!

### Step 6: Check Session Data

In Firestore, find your session document in `bankImportSessions`:

```json
{
  "id": "session-xyz",
  "status": "staged",
  "staging": {
    "journalCount": 10,
    "glEntryCount": 20,
    "totalDebits": 5000.00,
    "totalCredits": 5000.00,
    "isBalanced": true,
    "stagedAt": "2025-01-21T..."
  }
}
```

## 🔍 What to Look For

### ✅ Success Indicators

1. **Toast Notification**
   - Shows transaction count
   - Shows total debits and credits
   - Shows "✅ Balanced" if debits = credits

2. **Firestore Collections**
   - `staging_journal_entries` has documents
   - `staging_general_ledger` has documents (2x journal entries)
   - Each document has `status: 'staged'`
   - Each document has `bankImportSessionId`
   - Each document has `tenantId: 'Na1KU0ogKFLJ5cUzrMrU'`

3. **Balance Verification**
   - Total debits = Total credits
   - `isBalanced: true` in session

### ❌ Potential Issues

1. **"Failed to post to staging" Error**
   - Check browser console for detailed error
   - Likely issue: Missing Firestore indexes
   - **Workaround**: Firestore will automatically create indexes on first use

2. **Balance Not Matching**
   - Check transaction mappings
   - Verify debit/credit accounts are correct
   - Check amounts are positive numbers

3. **Network Errors**
   - Verify Firebase connection
   - Check service account permissions

## 📊 Expected Data Structure

### Staging Journal Entry

```typescript
{
  id: "bank_session_tx_123",
  tenantId: "Na1KU0ogKFLJ5cUzrMrU",
  bankImportSessionId: "session-xyz",
  status: "staged",
  transactionDate: "2025-01-15",
  description: "Bank import: Payment to ABC Corp",
  reference: "REF123",
  stagedAt: Timestamp,
  lines: [
    {
      id: "line-1",
      accountCode: "1100",
      accountName: "Bank Account",
      debit: 0,
      credit: 1000
    },
    {
      id: "line-2",
      accountCode: "6200",
      accountName: "Operating Expenses",
      debit: 1000,
      credit: 0
    }
  ]
}
```

### Staging GL Entry

```typescript
{
  id: "staging_gl_123",
  tenantId: "Na1KU0ogKFLJ5cUzrMrU",
  bankImportSessionId: "session-xyz",
  status: "staged",
  journalEntryId: "bank_session_tx_123",
  journalLineId: "line-1",
  accountCode: "1100",
  accountName: "Bank Account",
  debit: 0,
  credit: 1000,
  transactionDate: "2025-01-15",
  description: "Bank import: Payment to ABC Corp",
  stagedAt: Timestamp
}
```

## 🚀 Next Steps After Successful Test

1. **Post to Production** (not yet in UI)
   - Need to add "Review Staging" page
   - Will have "Post to Production" button
   - Will migrate staging → production

2. **Generate Reports from Staging**
   - Need to update report services
   - Add `dataSource: 'staging'` parameter
   - Can preview Balance Sheet before posting

3. **Export Functionality**
   - Export staged data to CSV (Pastel format)
   - Export staged data to CSV (Sage format)
   - Export staged data to Excel

4. **Archive System**
   - Mark sessions as archived
   - Auto-cleanup after fiscal year

## 🐛 Troubleshooting

### Firestore Index Errors

If you see: `The query requires an index`

**Solution**: Firestore will automatically create the index. Wait 1-2 minutes and retry.

Or manually create indexes via Firebase Console:
https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes

### Type Errors in Browser Console

If you see TypeScript errors about `postToStaging`:

**Solution**: The types are defined in [src/types/accounting/staging.ts](src/types/accounting/staging.ts). Make sure the service exports are correct.

### Balance Not Matching

If `isBalanced: false`:

**Check**:
1. All amounts are positive numbers
2. Debit/credit accounts are correctly assigned
3. Transaction type is correctly detected ('debit' or 'credit')

## 📝 Test Checklist

- [ ] Development server running
- [ ] Logged into Orlicron company
- [ ] Bank statement uploaded
- [ ] Transactions mapped to GL accounts
- [ ] Clicked "Post to Staging" button
- [ ] Received success toast notification
- [ ] Verified `staging_journal_entries` collection created
- [ ] Verified `staging_general_ledger` collection created
- [ ] Checked session status is 'staged'
- [ ] Verified balance (debits = credits)
- [ ] Checked browser console for errors

---

**Ready to test!** Start with Step 1 above and report any issues you encounter.
