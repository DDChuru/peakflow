# Smoke Test Guide: AI Accounting Assistant

**Feature**: AI-powered transaction analysis for bank-to-ledger mapping
**Implementation Date**: 2025-10-08
**Model**: Claude 3.5 Haiku (`claude-3-5-haiku-20241022`)
**Cost**: ~$0.0005 per transaction analysis

---

## Prerequisites

- ✅ ANTHROPIC_API_KEY configured in `.env.local`
- ✅ Company with Chart of Accounts setup
- ✅ Bank statements uploaded with transactions
- ✅ Development server running (`npm run dev`)

---

## Test Scenarios

### 1. Basic AI Suggestion - Expense Transaction

**Test Transaction**: `FNB App Prepaid Airtime 0769012562`

**Steps**:
1. Navigate to `/workspace/[companyId]/bank-import`
2. Click on "Import to Ledger" tab
3. Select a bank statement with the FNB Airtime transaction
4. Click "Review" to proceed to mapping step
5. Click on the FNB Airtime transaction row
6. In the mapping dialog, locate the "AI Accounting Assistant" section
7. Click the "Get AI Suggestion" button (purple/indigo with Sparkles icon)

**Expected Results**:
- ✅ Button shows "Analyzing..." with spinner
- ✅ API call to `/api/ai/analyze-transaction` succeeds
- ✅ AI suggestion appears within 2-5 seconds
- ✅ Suggestion includes:
  - **Confidence**: 85-95% (shown as 4-5 stars)
  - **Debit Account**: 5500 - Communications Expense (or similar)
  - **Credit Account**: 1000 - Cash (or your bank account)
  - **Explanation**: Clear description of why this mapping is correct
  - **Reasoning**: 3-4 bullet points explaining the logic
  - **Accounting Principle**: "Expense Recognition" badge
- ✅ Toast notification: "AI suggestion ready!"

**Common Issues**:
- ❌ "AI Assistant not configured" (503 error) → Check ANTHROPIC_API_KEY in .env.local
- ❌ "No chart of accounts found" → Setup COA first in Admin workspace
- ❌ Timeout error → Check API key validity or network connection

---

### 2. Apply AI Suggestion

**Steps** (continuing from Test 1):
1. Review the AI suggestion details
2. Click "Apply Suggestion" button (green)

**Expected Results**:
- ✅ Debit and Credit dropdowns automatically populate with suggested accounts
- ✅ "Save as Rule" checkbox is auto-checked (if AI recommends)
- ✅ Suggestion panel remains visible for reference
- ✅ No page refresh or reload

**Verify**:
- Check debit dropdown shows: `5500 - Communications Expense`
- Check credit dropdown shows: `1000 - Cash`
- Verify checkbox state matches `shouldSaveAsRule` from AI

---

### 3. Dismiss AI Suggestion

**Steps**:
1. Get an AI suggestion (as in Test 1)
2. Click "Dismiss" button

**Expected Results**:
- ✅ Suggestion panel disappears
- ✅ Original "Get AI Suggestion" button reappears
- ✅ Manual mapping dropdowns remain unchanged
- ✅ Can request a new suggestion by clicking button again

---

### 4. AI Rule Creation

**Steps**:
1. Get AI suggestion for FNB Airtime transaction
2. Click "Apply Suggestion"
3. Verify "Save as Rule" is checked
4. Click "Save Mapping"
5. Navigate to "Mapping Rules" tab
6. Search for "FNB" or "Prepaid"

**Expected Results**:
- ✅ Mapping saved successfully
- ✅ New GL mapping rule created
- ✅ Rule pattern: `FNB.*App.*Prepaid` (regex type)
- ✅ Rule maps to Communications Expense account
- ✅ Rule is active (green status)
- ✅ Toast: "Mapping saved and rule created for future auto-matching!"

**Verify Future Auto-Matching**:
1. Import another statement with similar FNB Airtime transaction
2. Review mapping stats
3. Confirm transaction is auto-matched (green checkmark in stats)

---

### 5. Revenue Transaction (Money In)

**Test Transaction**: Customer payment or deposit

**Steps**:
1. Select a transaction where credit > 0 (money coming in)
2. Get AI suggestion

**Expected Results**:
- ✅ AI suggests:
  - **Debit**: 1000 - Cash (increase cash)
  - **Credit**: 4000 - Revenue account OR 1200 - Accounts Receivable
- ✅ Explanation mentions "revenue recognition" or "accounts receivable collection"
- ✅ Confidence appropriate to transaction clarity

---

### 6. Error Handling - No API Key

**Steps**:
1. Temporarily remove ANTHROPIC_API_KEY from .env.local
2. Restart dev server
3. Attempt to get AI suggestion

**Expected Results**:
- ✅ Toast error: "AI Assistant not configured"
- ✅ API returns 503 status
- ✅ Fallback message shown
- ✅ Manual mapping still works

**Restore**: Add API key back and restart server

---

### 7. Edge Case - Unclear Transaction

**Test Transaction**: Generic description like "PAYMENT" or "TRANSFER"

**Steps**:
1. Select transaction with vague description
2. Get AI suggestion

**Expected Results**:
- ✅ AI may return no suggestion
- ✅ OR AI asks clarifying question in response
- ✅ Toast: "AI needs more information. Try describing the transaction." (with 💬 icon)
- ✅ User can still map manually

---

## Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Response time | < 3 seconds | < 5 seconds |
| Success rate | > 95% | > 90% |
| Confidence (avg) | > 85% | > 70% |
| Cost per 1000 | $0.50 | < $1.00 |

---

## Visual Verification Checklist

### UI Elements Present:
- ✅ AI section has gradient background (blue-50 to indigo-50)
- ✅ Sparkles icon (✨) next to "AI Accounting Assistant" header
- ✅ "Get AI Suggestion" button is indigo/purple
- ✅ Loading state shows spinning refresh icon
- ✅ Suggestion card has white background with indigo border
- ✅ Star rating (★) shows in yellow/gold
- ✅ Debit account text is green-700
- ✅ Credit account text is blue-700
- ✅ Explanation has blue-50 background with 💡 emoji
- ✅ Reasoning shows as bulleted list
- ✅ Accounting principle has purple-50 background with 🎓 emoji
- ✅ "Apply Suggestion" button is green
- ✅ "Dismiss" button is outlined/secondary style

---

## Integration Points

### Dependencies:
1. **API Endpoint**: `/app/api/ai/analyze-transaction/route.ts`
2. **AI Service**: `/src/lib/ai/accounting-assistant.ts`
3. **Anthropic SDK**: `@anthropic-ai/sdk` package
4. **Company Accounts**: Chart of Accounts from IndustryTemplateService
5. **Bank Transactions**: BankTransaction type with description, amount, date

### Data Flow:
```
User clicks "Get AI Suggestion"
  ↓
Frontend sends POST to /api/ai/analyze-transaction
  ↓
API calls AccountingAssistant.analyzeTransaction()
  ↓
Service calls Claude 3.5 Haiku via Anthropic SDK
  ↓
Claude analyzes transaction + available accounts
  ↓
Returns JSON with debit/credit suggestion + explanation
  ↓
Frontend displays suggestion in artifact widget
  ↓
User clicks "Apply Suggestion"
  ↓
Accounts auto-populate in dropdowns
```

---

## Rollback Instructions

If AI integration causes issues:

1. **Disable AI UI** (quick fix):
   - Comment out lines 960-1072 in `BankToLedgerImport.tsx`
   - Manual mapping still works normally

2. **Remove API endpoint**:
   - Delete `/app/api/ai/analyze-transaction/route.ts`
   - No impact on existing features

3. **Uninstall package** (optional):
   ```bash
   npm uninstall @anthropic-ai/sdk
   ```

---

## Next Steps After Testing

If tests pass:
- ✅ Mark Phase 5 AI Assistant as complete in roadmap
- ✅ Test with 10+ different transaction types
- ✅ Monitor API costs in Anthropic dashboard
- ✅ Collect user feedback on suggestion quality

Future Enhancements (Phase 6+):
- 🎯 Conversational refinement (follow-up questions)
- 🎯 Contextual tools (access debtors, creditors, invoices)
- 🎯 Batch analysis for multiple transactions
- 🎯 Voice input for transaction descriptions
- 🎯 Learning from user corrections

---

## Support

**API Key Issues**: Check `.env.local` has valid key starting with `sk-ant-api03-`
**Model Errors**: Ensure using `claude-3-5-haiku-20241022` (not older Haiku 3.0)
**Firestore Rules**: Configuration subcollection must be readable by company users
**Cost Monitoring**: https://console.anthropic.com/ → Usage tab

---

**Last Updated**: 2025-10-08
**Feature Status**: ✅ Ready for Testing
**Breaking Changes**: None - additive feature only
