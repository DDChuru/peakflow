# Smoke Test Guide: Bank Statement Archive & Export

## Overview
This guide helps you verify the bank statement export and archive functionality.

## Features Implemented

### Phase 1: Export from Staging Area ✅
- CSV export button in staging review
- Excel export button in staging review
- PDF export button in staging review

### Phase 2: Archive System ✅
- Automatic archiving after posting to production
- Sessions moved from staging to archive
- Archived sessions no longer visible in staging

### Phase 3: Archive Page ✅
- New "Archived Statements" page in navigation
- View archived sessions
- Export functionality (CSV, Excel, PDF)

---

## Test Procedure

### Pre-Test Setup
1. Have at least one bank statement uploaded
2. Have the statement imported and staged
3. Ensure you're logged in with appropriate permissions

### Test 1: Export from Staging Area

**Steps:**
1. Navigate to Bank Import page: `/workspace/[companyId]/bank-import`
2. Go to the "Staging Review" tab
3. Select a staged session
4. Look for the export buttons in the session details card header

**Expected Results:**
- ✅ Three export buttons visible: CSV, Excel, PDF
- ✅ Buttons appear next to "View GL Entries" button
- ✅ Clicking CSV downloads a .csv file
- ✅ Clicking Excel downloads a .xls file
- ✅ Clicking PDF opens browser print dialog
- ✅ Toast notifications appear on success
- ✅ Exported files contain correct data

**CSV Export Check:**
- File format: `staging-session-[ID]-[DATE].csv`
- Contains: Entry ID, Date, Reference, Description, Account Code, Account Name, Debit, Credit, Status
- Each journal entry line is a separate row

**Excel Export Check:**
- File format: `staging-session-[ID]-[DATE].xls`
- Same columns as CSV
- Tab-separated format

**PDF Export Check:**
- Opens browser print/save dialog
- Contains session summary
- Shows all journal entries with formatting

---

### Test 2: Post to Production & Archive

**Steps:**
1. From the staging review tab, select a staged session
2. Click "Post to Production" button
3. Confirm the posting action
4. Wait for success message

**Expected Results:**
- ✅ "Successfully posted to production ledger" toast appears
- ✅ Console shows: "[BankToLedger] Archiving posted session..."
- ✅ Console shows: "[BankToLedger] Session archived: X journals, Y GL entries"
- ✅ Session disappears from staging review list
- ✅ No errors in console related to archiving

**Check Production Collections:**
Open browser DevTools → Application → Firestore:
- ✅ `journal_entries` collection has new entries
- ✅ `general_ledger` collection has new entries
- ✅ `staging_journal_entries` for this session are deleted
- ✅ `staging_general_ledger` for this session are deleted

**Check Archive Collections:**
- ✅ New collection: `companies/[companyId]/archivedBankImportSessions`
- ✅ New collection: `archived_journal_entries`
- ✅ New collection: `archived_general_ledger`
- ✅ Session data preserved with `status: 'archived'`
- ✅ `archivedAt` timestamp present

---

### Test 3: View Archived Statements

**Steps:**
1. Navigate to workspace
2. Look in left sidebar under "Banking & Cash"
3. Click "Archived Statements"

**Expected Results:**
- ✅ "Archived Statements" link visible in navigation
- ✅ Archive icon displayed next to link
- ✅ Page loads: `/workspace/[companyId]/archived-statements`
- ✅ Page title: "Archived Bank Statements"
- ✅ Subtitle: "View and export posted bank statement imports"

**Archived Sessions List:**
- ✅ Table shows all archived sessions
- ✅ Columns: Session ID, Import Date, Archived Date, Transactions, Status, Actions
- ✅ Session ID shows last 8 characters with # prefix
- ✅ Dates formatted correctly
- ✅ Status badge shows "Archived"
- ✅ "View Details" button present

---

### Test 4: Export from Archive

**Steps:**
1. On archived statements page, click "View Details" for a session
2. Session details card should appear below
3. Look for export buttons in card header

**Expected Results:**
- ✅ Session details card displays
- ✅ Four buttons visible: CSV, Excel, PDF, View GL Entries
- ✅ Journal entries table populated
- ✅ Summary section shows: Total Entries, Total Debits, Total Credits

**Export Tests:**
- ✅ CSV export works (downloads .csv file)
- ✅ Excel export works (downloads .xls file)
- ✅ PDF export works (opens print dialog)
- ✅ File naming: `archived-session-[ID]-[DATE]`
- ✅ Data matches what was posted

**GL Entries Dialog:**
- ✅ Clicking "View GL Entries" opens dialog
- ✅ Dialog shows full general ledger entries
- ✅ Columns: Date, Account, Reference, Description, Debit, Credit, Balance
- ✅ All entries visible and scrollable

---

## Common Issues & Checks

### Issue: Export buttons not showing
**Check:**
- Browser console for errors
- Verify imports in StagingReview.tsx
- Ensure export-helpers.ts file exists

### Issue: Archive fails after posting
**Check:**
- Console for "[BankToLedger] Archive failed" message
- Firestore rules allow writing to archive collections
- Session status is 'posted' before archiving

### Issue: Archived page shows no sessions
**Check:**
- At least one session has been posted
- Archive collections created in Firestore
- Console for query errors
- ArchiveService.getArchivedSessions() logs

### Issue: Export contains no data
**Check:**
- Journal entries loaded (check React state)
- formatJournalEntriesForExport() returning data
- Browser console for export errors

---

## Firestore Collections Reference

### Before Posting (Staging):
```
staging_journal_entries/
  - [entryId]: { status: 'staged', bankImportSessionId: ... }

staging_general_ledger/
  - [entryId]: { status: 'staged', bankImportSessionId: ... }

companies/[companyId]/bankImportSessions/
  - [sessionId]: { status: 'staged' }
```

### After Posting (Production + Archive):
```
journal_entries/
  - [entryId]: { status: 'posted', ... }

general_ledger/
  - [entryId]: { ... }

archived_journal_entries/
  - [entryId]: { status: 'archived', archivedAt: ... }

archived_general_ledger/
  - [entryId]: { status: 'archived', archivedAt: ... }

companies/[companyId]/archivedBankImportSessions/
  - [sessionId]: { status: 'archived', archivedAt: ... }
```

**Note:** Staging collections should be empty after archiving!

---

## Success Criteria

✅ **All tests pass without errors**
✅ **Export buttons work in both staging and archive**
✅ **Posted sessions automatically archive**
✅ **Staging area cleaned up after posting**
✅ **Archive page displays all posted sessions**
✅ **Exported files contain accurate data**
✅ **No console errors during workflow**

---

## Next Steps After Testing

If all tests pass:
1. Test with multiple sessions
2. Test with large datasets (100+ transactions)
3. Verify export file quality (open in Excel/Google Sheets)
4. Test archive performance with 50+ archived sessions
5. Consider adding search/filter to archive page

If issues found:
1. Check browser console for specific errors
2. Verify Firestore security rules
3. Check network tab for failed requests
4. Review component state in React DevTools

---

## Files Modified/Created

**Created:**
- `/src/lib/utils/export-helpers.ts` - Export utility functions
- `/src/lib/accounting/archive-service.ts` - Archive service
- `/app/workspace/[companyId]/archived-statements/page.tsx` - Archive page

**Modified:**
- `/src/components/banking/StagingReview.tsx` - Added export buttons
- `/src/lib/accounting/bank-to-ledger-service.ts` - Added archive call after posting
- `/src/components/layout/WorkspaceLayout.tsx` - Added archive navigation link

---

## User Manual Snippet

### Exporting Bank Statement Data

**From Staging Area:**
1. Navigate to Bank Import → Staging Review
2. Select a staged session
3. Click CSV, Excel, or PDF button to export
4. For CSV/Excel: File downloads automatically
5. For PDF: Use browser print dialog to save

**From Archive:**
1. Navigate to Banking & Cash → Archived Statements
2. Click "View Details" on any archived session
3. Click CSV, Excel, or PDF button to export
4. Exported file includes all posted transactions

**Export Formats:**
- **CSV**: Comma-separated, Excel-compatible
- **Excel**: Tab-separated .xls format
- **PDF**: Printable report with summary

---

## Testing Checklist

- [ ] Export CSV from staging
- [ ] Export Excel from staging
- [ ] Export PDF from staging
- [ ] Post session to production
- [ ] Verify session archived automatically
- [ ] Verify staging cleaned up
- [ ] View archived statements page
- [ ] Select archived session
- [ ] Export CSV from archive
- [ ] Export Excel from archive
- [ ] Export PDF from archive
- [ ] View GL entries dialog
- [ ] Refresh archive list
- [ ] Test with multiple archived sessions
- [ ] Verify file contents match data

---

**Date Created:** 2025-10-21
**Feature Version:** Bank Statement Archive v1.0
**Developer:** Claude Code Agent
