# FNB Bank Statement Import - Quick Reference Guide

## The Three-Layer Solution

### Layer 1: Bank-Specific Parsing (`bank-parsers.ts`)
Handles FNB's unique format:
- **Credits**: `2,392.00Cr` → `{ credit: 2392.00 }`
- **Debits**: `5,534.00` → `{ debit: 5534.00 }`

**Key Function**: `parseAmount(amountText)`
```typescript
// Check for Cr suffix first (priority 1)
if (amountText.endsWith('Cr')) → return { credit: amount }

// Check for Dr suffix (priority 2)
if (amountText.endsWith('Dr')) → return { debit: amount }

// Plain number defaults to debit (priority 3) - FNB convention
→ return { debit: amount }
```

### Layer 2: Balance Validation & Fixing (`fix-statement-amounts.ts`)
Uses account balance changes to detect and correct misclassified amounts:
```
Before Balance: R54,034.72
Transaction: 95.00 (plain number)
After Balance: R53,939.72

Change = 53,939.72 - 54,034.72 = -95.00 (negative = money OUT)
Correct classification: DEBIT = 95.00 ✓
```

**Key Function**: `fixTransactionAmount(transaction, bankName, previousBalance)`
- Compares actual balance progression
- Identifies incorrect debits/credits
- Provides correction

**Validation**: `validateStatementBalance(statement)` - 2 cent tolerance (R0.02)

### Layer 3: Multi-Stage Matching (`reconciliation-utils.ts`)
Intelligent fuzzy matching with 5 confidence stages:

1. **Exact Match**: Same amount + same date = 1.0 confidence
2. **Reference Match**: Reference fields match
3. **Amount-Date Match**: Amount within 5% + date within 3 days
4. **Description Fuzzy**: Levenshtein distance text similarity
5. **Weighted Fallback**: Combination of all factors

**Weights** (from DEFAULT_CONFIG):
- Amount: 40% (most important)
- Date: 30%
- Reference: 20%
- Description: 10%

**Confidence Score Formula**:
```
confidence = (amountScore × 0.4) + (dateScore × 0.3) + 
             (refScore × 0.2) + (descScore × 0.1)
```

---

## Critical Implementation Details

### FNB Date Parsing
FNB uses "DD MMM" format without year (e.g., "21 Nov")
```typescript
// Solution: Extract year from statement period
parseFNBDate("21 Nov", { from: "2025-09-01" })
// Returns: "2025-11-21"
```

### Amount Direction Convention
**Key insight**: Money flow perspective
- **Bank Credit** = Money IN = Positive = `{ credit: amount }`
- **Bank Debit** = Money OUT = Negative = `{ debit: amount }`

### Tolerance Thresholds
```typescript
DEFAULT_CONFIG = {
  maxDateDifferenceInDays: 14,        // 2 weeks
  maxAmountDifferencePercent: 0.05,   // 5%
  maxAmountDifferenceAbsolute: 5.00,  // R5 flat
  minConfidenceThreshold: 0.4,        // 40% to suggest match
}
```

---

## Integration Points

### Bank Statement Service (`bank-statement-service.ts`)

**Processing Pipeline**:
1. Upload PDF → Gemini extraction
2. Detect bank: `detectBank('', accountInfo)` → 'FNB'
3. Normalize date: `parseFNBDate()` if FNB detected
4. Fix amounts: `fixStatementTransactions()` using balance progression
5. Validate: `validateStatementBalance()` - reports errors but doesn't reject
6. Store in Firestore with corrected debit/credit fields

### Reconciliation Service (`reconciliation-service.ts`)

**Auto-Matching Flow**:
1. Get bank transactions from statement
2. Get ledger entries for account/period
3. Run `performAutoMatching()` algorithm
4. Save matches with confidence scores to Firestore
5. User reviews and confirms matches
6. System marks as "confirmed" or "rejected"

---

## File Locations (Absolute Paths)

### Core Implementation Files
- `/home/dachu/Documents/projects/vercel/peakflow/src/lib/banking/bank-parsers.ts`
- `/home/dachu/Documents/projects/vercel/peakflow/src/lib/banking/fix-statement-amounts.ts`
- `/home/dachu/Documents/projects/vercel/peakflow/src/lib/accounting/reconciliation-utils.ts`
- `/home/dachu/Documents/projects/vercel/peakflow/src/lib/firebase/bank-statement-service.ts`
- `/home/dachu/Documents/projects/vercel/peakflow/src/lib/accounting/reconciliation-service.ts`

### Type Definitions
- `/home/dachu/Documents/projects/vercel/peakflow/src/types/bank-statement.ts`
- `/home/dachu/Documents/projects/vercel/peakflow/src/types/accounting/reconciliation.ts`

### Components
- `/home/dachu/Documents/projects/vercel/peakflow/src/components/bank-statement/BankStatementUpload.tsx`
- `/home/dachu/Documents/projects/vercel/peakflow/src/components/banking/BankToLedgerImport.tsx`

### Documentation
- `/home/dachu/Documents/projects/vercel/peakflow/BANK-SPECIFIC-IMPORT-SOLUTION.md` - Design document
- `/home/dachu/Documents/projects/vercel/peakflow/BANK-IMPORT-DATA-FLOW.md` - Complete data flow
- `/home/dachu/Documents/projects/vercel/peakflow/smoke-test-bank-import-improvements.md` - Test guide

---

## Adding Another Bank (ABSA Example)

### Step 1: Create Parser
```typescript
// In bank-parsers.ts
export const absaParser: BankParser = {
  bankName: 'ABSA',
  
  detect: (text, accountInfo) => {
    return text.toLowerCase().includes('absa') ||
           accountInfo?.bankName.toLowerCase().includes('absa');
  },
  
  parseAmount: (amountText) => {
    // ABSA convention: positive = credit, negative = debit
    const amount = parseFloat(amountText.replace(/,/g, ''));
    return amount > 0 ? { credit: amount } : 
           amount < 0 ? { debit: Math.abs(amount) } : {};
  }
};
```

### Step 2: Register in Registry
```typescript
export const bankParsers: BankParser[] = [
  fnbParser,
  standardBankParser,
  absaParser,  // Add here - order matters!
];
```

### Step 3: Test
```bash
# Upload ABSA statement
# Check console: "[Bank Parser] Detected bank: ABSA"
# Verify amounts parsed correctly
# Validate balance progression
```

---

## Debugging Checklist

### Bank Not Detected?
- [ ] PDF contains bank name
- [ ] Check Gemini extraction: `accountInfo.bankName`
- [ ] Add more keywords to detector
- [ ] Check case sensitivity

### Balance Doesn't Validate?
- [ ] Verify opening balance matches PDF
- [ ] Check balance column is continuous
- [ ] Verify all transactions extracted
- [ ] Allow R0.02 rounding tolerance

### Matching Has Low Confidence?
- [ ] Ensure ledger entries are posted
- [ ] Check date format consistency
- [ ] Review unmatched items manually
- [ ] Adjust tolerance in DEFAULT_CONFIG

---

## Success Metrics

| Metric | Target | How to Check |
|--------|--------|--------------|
| Bank Detection | 100% | Console: "Detected bank: FNB" |
| Amount Classification | 100% | Debit/credit fields populated correctly |
| Balance Validation | 100% | No validation errors in console |
| Auto-Match Rate | 70-90% | matchRatio > 0.7 |
| Confidence Score | > 0.4 | Only high-confidence matches suggested |

---

## Key Formulas

### Amount Calculation (Bank Transaction)
```
if (debit) → amount = -debit  (negative, money out)
if (credit) → amount = +credit (positive, money in)
```

### Amount Calculation (Ledger Entry)
```
amount = credit - debit
(since credit to bank = money in, debit to bank = money out)
```

### Confidence Score
```
score = (amountScore × 0.4) + (dateScore × 0.3) + 
        (refScore × 0.2) + (descScore × 0.1)
```

### Date Similarity
```
dateScore = 1 - (daysDifference / maxDaysAllowed)
```

### Amount Similarity
```
amountScore = 1 - (percentDifference / maxPercentAllowed)
(with absolute minimum of R5 allowed)
```

---

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "Balance mismatch. Expected: X, Actual: Y" | Incorrect debit/credit | Check FNB Cr suffix parsing |
| "Detected bank: Unknown" | Bank name not found | Add to fnbIndicators array |
| "Found 0 candidates" | Low confidence threshold | Increase minConfidenceThreshold |
| "Cannot determine amount" | No debit/credit fields | Ensure getBankTransactionAmount logic covers all cases |

---

## Architecture Pattern Summary

**What makes FNB work**: Multi-layered validation and tolerance
1. **Detect** precisely what bank it is
2. **Parse** amounts correctly per bank format
3. **Validate** using balance progression (objective truth)
4. **Fix** any misclassifications automatically
5. **Match** with intelligent fuzzy algorithm
6. **Confirm** user reviews before committing

This pattern is **extensible** - each layer can be adapted for new banks without changing others.

---

**For comprehensive details, see**: `/home/dachu/Documents/projects/vercel/peakflow/FNB-STATEMENT-IMPLEMENTATION-ANALYSIS.md`
