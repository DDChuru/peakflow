# Smoke Test: Bank Import Improvements & AI Assistant Enhancements

**Date**: 2025-10-08
**Features**: AI Model Upgrade, UI Restructure, Delete Statements, FNB Auto-Fix Integration

---

## ✅ Quick Verification Checklist (2 minutes)

- [ ] AI Assistant responds with Sonnet 4.5 intelligence
- [ ] Chat interface appears on right side with adequate space
- [ ] Delete button removes statements successfully
- [ ] FNB statement imports with corrected debit/credit amounts
- [ ] Console shows "[Bank Parser] Fixed X transactions" log

---

## 1. AI Model Configuration Test

### Test Steps:
1. Navigate to `/workspace/[companyId]/bank-import`
2. Select an imported statement
3. Click on any transaction
4. Open the AI Assistant dialog
5. Ask AI: "What type of transaction is this? Explain the difference between a debit and credit in accounting terms."

### Expected Results:
- ✅ AI provides detailed, nuanced explanation (typical of Sonnet 4.5)
- ✅ Response includes accounting principles, not just transaction categorization
- ✅ Tone is professional and comprehensive
- ✅ Console log shows: `[AI Assistant] Using model: claude-sonnet-4-5-20250929`

### Common Issues:
- ❌ If AI gives short/basic responses → Check `.env.local` has `ANTHROPIC_MODEL=claude-sonnet-4-5-20250929`
- ❌ If console shows different model → Restart dev server to load new env vars

---

## 2. UI Restructure Test

### Test Steps:
1. Open any transaction in the bank import dialog
2. Ask AI Assistant a question
3. Observe layout and space allocation

### Expected Results:
- ✅ Dialog is wide (max-w-6xl)
- ✅ Left side (2/3 width) shows:
  - Transaction details at top
  - AI suggestion result (when available)
  - Debit/Credit account dropdowns
  - "Save as rule" checkbox
- ✅ Right side (1/3 width) shows:
  - "Chat with AI Assistant" heading
  - Conversation history (scrollable independently)
  - Chat input at bottom
  - Vertical border separating sections
- ✅ Both columns can scroll independently
- ✅ Chat input stays fixed at bottom of right column

### Common Issues:
- ❌ If layout looks cramped → Clear browser cache and hard refresh
- ❌ If columns don't scroll independently → Check `overflow-y-auto` is applied

---

## 3. Delete Statement Test

### Test Steps:
1. Go to bank statements list
2. Hover over any statement card
3. Click the red trash icon in top-right corner
4. Click "OK" in confirmation dialog

### Expected Results:
- ✅ Trash icon (Trash2) appears on hover in top-right of card
- ✅ Confirmation dialog appears: "Are you sure you want to delete this statement? This cannot be undone."
- ✅ After confirmation, statement disappears from list
- ✅ Toast notification: "Statement deleted successfully"
- ✅ Statement removed from Firestore (check Firebase console)

### Common Issues:
- ❌ If clicking trash also selects statement → `e.stopPropagation()` is working correctly
- ❌ If error occurs → Check console for Firestore permission issues

---

## 4. FNB Auto-Fix Integration Test (CRITICAL)

### Test Steps:
1. **Prepare test data**: Get an FNB bank statement PDF with transactions showing:
   - Credits with "Cr" suffix (e.g., "2,392.00Cr")
   - Debits without suffix (e.g., "95.00")

2. **Upload statement**:
   - Go to `/workspace/[companyId]/bank-import`
   - Click "Upload Bank Statement"
   - Select FNB PDF file
   - Wait for processing

3. **Check console logs** (IMPORTANT):
   ```
   [Bank Parser] Detecting bank...
   [Bank Parser] Detected bank: FNB
   [Bank Parser] Applying bank-specific corrections...
   [Bank Parser] Fixed X transactions
   ```

4. **Verify transaction amounts**:
   - Open the imported statement
   - Check transactions that had "Cr" suffix → Should be credits (money IN)
   - Check transactions without suffix → Should be debits (money OUT)

5. **Test AI accuracy**:
   - Select a debit transaction (e.g., "FNB App Prepaid Airtime - 95.00")
   - Ask AI: "Is this money coming in or going out?"
   - Expected: AI should correctly identify it as money OUT (debit)

### Expected Results:
- ✅ Console shows bank detection: "Detected bank: FNB"
- ✅ Console shows fixes applied: "Fixed X transactions" (where X > 0)
- ✅ Transactions with "Cr" suffix have `credit` amount, `debit` is undefined
- ✅ Transactions without suffix have `debit` amount, `credit` is undefined
- ✅ Balance progression is correct (no validation errors)
- ✅ AI Assistant provides accurate GL account suggestions
- ✅ Statement metadata includes: `accountInfo.bankName: "FNB"`

### Common Issues:
- ❌ If bank detected as "Unknown" → FNB indicators not found in PDF text
  - Check `accountInfo.bankName` after Gemini extraction
  - Add more FNB indicators to `bank-parsers.ts` if needed
- ❌ If "Fixed 0 transactions" → Transactions were already correct OR balance data missing
  - Check if `balance` field exists on each transaction
  - Verify opening balance is present
- ❌ If AI still gives wrong suggestions → Clear previous statement and re-upload
  - Old statement may still be in Firestore without fixes

---

## 5. Balance Validation Test

### Test Steps:
1. After importing FNB statement, run manual validation:
   ```typescript
   // In browser console
   import { validateStatementBalance } from '@/lib/banking/fix-statement-amounts';
   const statement = /* get from Firestore */;
   const result = validateStatementBalance(statement);
   console.log(result);
   ```

2. Expected output:
   ```json
   {
     "valid": true,
     "errors": []
   }
   ```

### Expected Results:
- ✅ `valid: true` (no balance mismatches)
- ✅ `errors: []` (empty array)
- ✅ Closing balance matches calculated balance

### Common Issues:
- ❌ If validation fails → Check opening balance is correct
- ❌ If small rounding errors (< R0.02) → Acceptable tolerance

---

## 6. End-to-End Workflow Test

### Test Steps:
1. Upload new FNB statement (with auto-fix)
2. Click on first transaction
3. AI Assistant auto-suggests GL accounts
4. Review suggestion in left panel
5. Ask follow-up question in right chat: "Why did you choose this account?"
6. Adjust accounts if needed
7. Click "Save Mapping"
8. Select next transaction
9. Repeat process
10. Delete test statement when done

### Expected Results:
- ✅ Smooth workflow with no UI glitches
- ✅ AI suggestions are contextually accurate
- ✅ Chat history persists across suggestions
- ✅ Mappings save correctly
- ✅ Delete removes statement cleanly

---

## 7. Multi-Bank Support Test (Future)

### Test Steps (when available):
1. Upload Standard Bank statement
2. Check console: Should detect "Standard Bank"
3. Verify negative numbers parsed as debits
4. Upload ABSA statement
5. Check detection and parsing

### Expected Results:
- ✅ Each bank detected correctly
- ✅ Bank-specific parsing rules applied
- ✅ Transactions import accurately

---

## Environment Verification

Before testing, ensure:
```bash
# Check environment variables
cat .env.local | grep ANTHROPIC

# Should show:
# ANTHROPIC_API_KEY=sk-ant-api03-...
# ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

If missing or incorrect:
```bash
# Restart dev server
npm run dev
```

---

## Success Criteria

**All features pass if:**
1. ✅ AI responds with Sonnet 4.5 intelligence
2. ✅ UI layout provides adequate chat space
3. ✅ Delete button works with confirmation
4. ✅ FNB statements import with correct debit/credit
5. ✅ Console logs show bank detection and fixes
6. ✅ AI suggestions are accurate for FNB transactions
7. ✅ Balance validation passes
8. ✅ End-to-end workflow is smooth

---

## Rollback Plan

If critical issues found:
1. Revert to previous commit: `git reset --hard 4e1ae67`
2. Remove new files:
   ```bash
   rm src/lib/banking/bank-parsers.ts
   rm src/lib/banking/fix-statement-amounts.ts
   rm BANK-SPECIFIC-IMPORT-SOLUTION.md
   ```
3. Restore old `.env.local` (Haiku model)
4. Report issues for investigation

---

## Files Modified in This Session

- ✅ `.env.local` - Added ANTHROPIC_MODEL config
- ✅ `src/lib/ai/accounting-assistant.ts` - Dynamic model selection, increased tokens
- ✅ `src/components/banking/BankToLedgerImport.tsx` - UI restructure, delete button
- ✅ `src/lib/firebase/bank-statement-service.ts` - Auto-fix integration
- ✅ `src/lib/banking/bank-parsers.ts` - NEW: Bank parser system
- ✅ `src/lib/banking/fix-statement-amounts.ts` - NEW: Balance correction utility
- ✅ `BANK-SPECIFIC-IMPORT-SOLUTION.md` - NEW: Solution documentation

---

**Ready to Test!** 🚀

Start with the Quick Verification Checklist, then proceed to detailed tests if issues arise.
