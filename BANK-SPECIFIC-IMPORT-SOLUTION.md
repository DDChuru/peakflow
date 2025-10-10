# Bank-Specific Import Solution

## Problem Identified

FNB (First National Bank) uses a unique format for bank statements:
- **Credits (money IN)**: Amount with "Cr" suffix → `2,392.00Cr`
- **Debits (money OUT)**: Plain amount, no suffix → `5,534.00`

The current generic import logic doesn't handle this FNB-specific format, causing:
- ❌ Debits incorrectly classified as credits
- ❌ AI Assistant confused about transaction direction
- ❌ Incorrect GL account suggestions
- ❌ Balance validation failures

## Solution Implemented

### 1. Bank-Specific Parsers (`/src/lib/banking/bank-parsers.ts`)

Created parser system with:

**FNB Parser:**
```typescript
- Detects FNB statements (keywords: "FNB", "First National Bank", etc.)
- parseAmount() logic:
  * "2,392.00Cr" → { credit: 2392.00 }
  * "5,534.00" → { debit: 5534.00 }
  * "95.00" → { debit: 95.00 }
```

**Standard Bank Parser:**
```typescript
- Handles negative numbers as debits
- Positive numbers as credits
```

**Generic Parser (Fallback):**
```typescript
- Handles common formats when bank unknown
- Supports Cr/Dr suffixes, negative numbers
```

### 2. Statement Fix Utility (`/src/lib/banking/fix-statement-amounts.ts`)

**Key Functions:**

**`fixStatementTransactions(statement)`**
- Uses balance progression to determine correct debit/credit
- Logic: `balance increased = credit, balance decreased = debit`
- Returns detailed fix report

**`validateStatementBalance(statement)`**
- Checks if transactions balance correctly
- Identifies mismatched debits/credits
- Provides detailed error messages

**`diagnoseStatement(statement)`**
- Auto-detects bank
- Validates balance
- Recommends fixes if needed

### 3. How It Works

**Balance Progression Method:**

Given opening balance = R59,568.72Cr:

```
Transaction: "FNB App Prepaid Airtime" - 95.00
Balance after: R53,939.72Cr

Calculation:
  Balance decreased from 59,568.72 to 53,939.72
  Change = -5,629.00 (negative = money OUT)
  Therefore: DEBIT = 5,629.00

Wait, that doesn't match the 95.00!
Let me recalculate using the actual balance...

Actually looking at your screenshot:
  Before: 54,034.72Cr
  Transaction: 95.00 (no Cr)
  After: 53,939.72Cr

  Change = 53,939.72 - 54,034.72 = -95.00
  Negative change = money OUT = DEBIT

  ✅ Correct: { debit: 95.00 }
```

## Integration Steps (TODO)

### Phase 1: Quick Fix (Manual)

Add a "Fix Statement" button to bank import page:

```typescript
// In bank-import page
import { diagnoseStatement, applyStatementFixes } from '@/lib/banking/fix-statement-amounts';

const handleFixStatement = async (statementId: string) => {
  const statement = await bankStatementService.getBankStatement(statementId);
  const diagnosis = diagnoseStatement(statement);

  if (diagnosis.suggestedFixes) {
    const fixed = applyStatementFixes(statement, diagnosis.suggestedFixes);
    await bankStatementService.updateBankStatement(statementId, fixed);
    toast.success(`Fixed ${diagnosis.suggestedFixes.transactionsFixed} transactions`);
  }
};
```

### Phase 2: Auto-Detect on Upload

Update Gemini extraction prompt or post-processing:

```typescript
// After Gemini extracts data
const bankName = detectBank(pdfText, extractedData.accountInfo);
const parser = getBankParser(bankName);

// Re-parse amounts with correct parser
const correctedTransactions = extractedData.transactions.map(tx => {
  if (tx.amountText) {
    const amounts = parser.parseAmount(tx.amountText);
    return { ...tx, ...amounts };
  }
  return tx;
});
```

### Phase 3: Bank Selection UI

Add dropdown in upload component:

```tsx
<Select
  label="Bank"
  options={[
    { value: 'FNB', label: 'FNB - First National Bank' },
    { value: 'Standard Bank', label: 'Standard Bank' },
    { value: 'ABSA', label: 'ABSA' },
    { value: 'Nedbank', label: 'Nedbank' },
    { value: 'Capitec', label: 'Capitec' },
    { value: 'Auto', label: 'Auto-detect' }
  ]}
/>
```

### Phase 4: Diagnostic Dashboard

Create `/workspace/[companyId]/bank-statements/diagnose` page:

**Features:**
- List all statements with balance validation status
- Show statements with errors in red
- "Fix All" button to batch-fix misclassified transactions
- Before/After preview of corrections

## Immediate Action Required

### For Your Current FNB Statement:

**Option A: Re-upload with manual bank selection** (when implemented)
1. Delete current statement
2. Re-upload PDF
3. Select "FNB" from bank dropdown
4. Import will use FNB parser automatically

**Option B: Fix existing statement** (manual fix)
```typescript
// Run this in browser console or create a script
import { diagnoseStatement, applyStatementFixes } from '@/lib/banking/fix-statement-amounts';

const statement = await bankStatementService.getBankStatement('YOUR_STATEMENT_ID');
const diagnosis = diagnoseStatement(statement);

console.log('Diagnosis:', diagnosis);
// Should show: "Found X transactions with incorrect debit/credit classification"

if (diagnosis.suggestedFixes) {
  const fixed = applyStatementFixes(statement, diagnosis.suggestedFixes);
  await bankStatementService.updateBankStatement(statement.id, fixed);
  console.log('Fixed!');
}
```

## Benefits

✅ **Accurate imports** - Correct debit/credit detection per bank format
✅ **AI works correctly** - Proper transaction direction for AI suggestions
✅ **Balance validation** - Catch import errors immediately
✅ **Multi-bank support** - Easy to add parsers for ABSA, Nedbank, Capitec, etc.
✅ **Future-proof** - Extensible parser system for new bank formats

## Next Steps

1. **Immediate**: Add "Fix Statement" button to bank import page
2. **Short-term**: Integrate bank detection into upload flow
3. **Medium-term**: Add bank selection dropdown
4. **Long-term**: Build diagnostic dashboard for all statements

## Testing

Test with real statements:
- ✅ FNB (Cr suffix format) - Parser created
- ⏳ Standard Bank (negative numbers)
- ⏳ ABSA
- ⏳ Nedbank
- ⏳ Capitec

---

**Files Created:**
- `/src/lib/banking/bank-parsers.ts` - Bank-specific amount parsers
- `/src/lib/banking/fix-statement-amounts.ts` - Balance-based correction utility
- `BANK-SPECIFIC-IMPORT-SOLUTION.md` - This documentation

**Ready for Integration** ✅
