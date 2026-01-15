# Smoke Test: Trial Balance Excel Formatter

## Overview
This guide covers verification of the Trial Balance (TB) Excel report formatter implementation.

## What Was Implemented

### Files Created/Modified
1. **New File**: `/src/lib/reporting/tb-excel-formatter.ts`
   - `TBExcelFormatter` class for formatting Trial Balance data
   - Exports convenience functions: `exportTrialBalanceToExcel`, `getTrialBalanceExcelBlob`
   - Factory function: `createTBExcelFormatter`

2. **Modified File**: `/src/lib/reporting/index.ts`
   - Added exports for TB Excel formatter

## Quick Verification Steps (< 2 minutes)

### 1. Import Verification
In the reports page or any component, verify imports work:
```typescript
import {
  exportTrialBalanceToExcel,
  createTBExcelFormatter,
  type TBExcelFormatterOptions
} from '@/lib/reporting';
```

### 2. Basic Usage Pattern
```typescript
// Assuming you have a Trial Balance report from the GL service
const trialBalance = await glService.generateTrialBalance(new Date());

// Quick export
await exportTrialBalanceToExcel(trialBalance, {
  companyName: 'My Company',
  preparedBy: 'John Doe'
});

// Or with more control
const formatter = createTBExcelFormatter({
  companyName: 'My Company',
  includeGroupSubtotals: true,
  includeExternalRef: true
});
await formatter.downloadTrialBalanceExcel(trialBalance);
```

### 3. Visual Verification
After downloading the Excel file, verify:
- [ ] Company name appears in header
- [ ] "Trial Balance" title is visible
- [ ] "As of: [date]" shows correct date
- [ ] Column headers: External Ref | Account Code | Account Name | DR | CR
- [ ] Accounts are grouped by type (ASSETS, LIABILITIES, etc.)
- [ ] Each group has a subtotal row
- [ ] TOTALS row appears with double-line borders
- [ ] Net Profit/Loss row shows if applicable
- [ ] Balance verification message at bottom (green = balanced, red = not balanced)

## Template Structure

The Excel output follows this structure:

```
+------------------------------------------------------------------+
|                        Company Name                               |
|                        Trial Balance                              |
|                    As of: January 15, 2026                        |
|                   Prepared by: System Generated                   |
+------------------------------------------------------------------+
| External Ref | Account Code | Account Name        |   DR   |  CR  |
+------------------------------------------------------------------+
| ASSETS                                                            |
|              | 1000         | Cash                | 50,000 |      |
|              | 1100         | Accounts Receivable | 25,000 |      |
|              |              | Total ASSETS        | 75,000 |      |
+------------------------------------------------------------------+
| LIABILITIES                                                       |
|              | 2000         | Accounts Payable    |        |15,000|
|              |              | Total LIABILITIES   |        |15,000|
+------------------------------------------------------------------+
| ... (EQUITY, REVENUE, EXPENSES)                                   |
+------------------------------------------------------------------+
|              |              | TOTALS              |150,000 |150,000|
+------------------------------------------------------------------+
|              |              | Net Profit          |        | 5,000|
+------------------------------------------------------------------+
|                   Trial Balance is BALANCED                       |
+------------------------------------------------------------------+
```

## Features Implemented

1. **Column Structure**
   - External Ref (optional)
   - Account Code
   - Account Name
   - DR (Debit)
   - CR (Credit)

2. **Account Type Groupings**
   - ASSETS
   - LIABILITIES
   - EQUITY
   - REVENUE
   - EXPENSES

3. **Calculated Fields**
   - Group subtotals
   - Grand totals (must balance)
   - Net Profit/Loss

4. **Styling**
   - Blue header row
   - Light blue group headers
   - Yellow highlighted totals
   - Green/Red balance verification
   - Double-line borders on totals

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `companyName` | string | "Company Name" | Company name in header |
| `reportTitle` | string | "Trial Balance" | Report title |
| `includeGroupSubtotals` | boolean | true | Show subtotals per account type |
| `includeExternalRef` | boolean | true | Include External Ref column |
| `currencyFormat` | string | "R #,##0.00" | Excel number format |
| `preparedBy` | string | "System Generated" | Preparer name |

## Integration Points

The formatter integrates with:
- `GLReportsService.generateTrialBalance()` - source of Trial Balance data
- `ExcelService` - workbook creation and styling
- Reports page UI - trigger export from Trial Balance tab

## Common Issues to Check

1. **Missing ExcelJS**: Ensure `exceljs` package is installed
2. **Empty Report**: Verify Trial Balance has accounts data
3. **Formatting Issues**: Check currency format matches locale
4. **Balance Mismatch**: Ensure GL entries are properly balanced

## Next Steps for Full Integration

To add an "Export to Excel" button on the Trial Balance tab:

```tsx
// In reports/page.tsx
import { exportTrialBalanceToExcel } from '@/lib/reporting';

// Add to Trial Balance tab content
<Button
  onClick={() => trialBalance && exportTrialBalanceToExcel(trialBalance, {
    companyName: company?.name,
    preparedBy: user?.email
  })}
  disabled={!trialBalance}
>
  <Download className="h-4 w-4 mr-2" />
  Export to Excel
</Button>
```
