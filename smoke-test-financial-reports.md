# Smoke Test Guide: Financial Reports Export Feature

This guide provides step-by-step verification procedures for testing the financial reports export functionality in Peakflow.

**Last Updated**: January 2026
**Component**: `/app/workspace/[companyId]/reports/page.tsx`
**Route**: `/workspace/[companyId]/reports`

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Accessing the Reports Page](#accessing-the-reports-page)
3. [Report Types Overview](#report-types-overview)
4. [Test Procedures by Report Type](#test-procedures-by-report-type)
   - [Trial Balance](#trial-balance)
   - [Income Statement](#income-statement)
   - [Balance Sheet](#balance-sheet)
   - [General Ledger](#general-ledger)
5. [Common Issues and Troubleshooting](#common-issues-and-troubleshooting)
6. [Verification Checklist](#verification-checklist)
7. [Quick Verification Steps](#quick-verification-steps)

---

## Prerequisites

### Required Data

Before testing the financial reports export feature, ensure the following data exists in the system:

1. **Chart of Accounts**: At least 5-10 accounts across different types:
   - Assets (e.g., Cash, Accounts Receivable)
   - Liabilities (e.g., Accounts Payable)
   - Equity (e.g., Share Capital, Retained Earnings)
   - Revenue (e.g., Sales Revenue)
   - Expenses (e.g., Salaries, Rent)

2. **Journal Entries**: At least 3-5 posted journal entries with:
   - Debits and credits that balance
   - Various dates within the selected date range
   - Different source types (manual journal, invoice, payment)

3. **User Authentication**:
   - Logged in with a user who has access to the company workspace
   - User should have at least `user` role (preferably `admin` or `financial_admin`)

### How to Verify Prerequisites

```bash
# Seed chart of accounts (if not already done)
npm run seed:charts

# Seed ledger entries (if not already done)
npm run seed:ledger
```

Alternatively, manually create accounts and journal entries through the UI:
- Chart of Accounts: `/workspace/[companyId]/chart-of-accounts`
- Journal Entries: `/workspace/[companyId]/journal`

### Browser Requirements

- Modern browser (Chrome, Firefox, Edge, Safari)
- JavaScript enabled
- Pop-up blocker disabled (for PDF preview)
- Downloads enabled (for Excel/PDF exports)

---

## Accessing the Reports Page

1. **Login** to the application at `/login`
2. **Select a Company** from the company selector in the sidebar
3. **Navigate to Reports** using one of these methods:
   - Click "Reports" in the sidebar navigation
   - Direct URL: `/workspace/[companyId]/reports`

4. **Verify Page Load**:
   - Page title shows "Financial Reports"
   - Tab navigation is visible with 10 report types
   - Default tab is "Aged Receivables"

---

## Report Types Overview

The Reports page contains 10 tabs organized into categories:

### AP/AR Reports (Legacy Export - Placeholders)
| Tab | Description | Export Status |
|-----|-------------|---------------|
| Aged Receivables | Customer aging by due date | Placeholder (TODO) |
| Aged Payables | Vendor aging by due date | Placeholder (TODO) |
| AR Summary | Summary by customer | Placeholder (TODO) |
| AP Summary | Summary by vendor | Placeholder (TODO) |

### Financial Statements (Full Export Implemented)
| Tab | Description | Export Status |
|-----|-------------|---------------|
| Income Statement | P&L for date range | PDF + Excel |
| Balance Sheet | Assets/Liabilities/Equity snapshot | PDF + Excel |
| Cash Flow | Cash movement analysis | Placeholder (TODO) |

### GL Reports (Full Export Implemented)
| Tab | Description | Export Status |
|-----|-------------|---------------|
| Trial Balance | All accounts with DR/CR balances | PDF + Excel |
| General Ledger | Transaction detail by account | Placeholder (TODO) |
| Journal Entries | Journal entry listing | Placeholder (TODO) |

---

## Test Procedures by Report Type

### Trial Balance

#### Location
- Tab: "Trial Balance" (9th tab from left, icon: BookCheck)
- Service: `GLReportsService.generateTrialBalance()`
- Export: PDF via `pdfService.downloadTBPDF()`, Excel via `exportTrialBalanceToExcel()`

#### Test Steps

**Step 1: Generate the Report**
1. Click the "Trial Balance" tab
2. Set the "As of Date" using the date picker (default: today)
3. Toggle "Show Zero Balances" checkbox if needed
4. Click "Generate Report" button

**Expected Result**:
- Loading spinner appears briefly
- Report displays in a table format with columns:
  - Account Code
  - Account Name
  - Account Type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)
  - Debit (DR)
  - Credit (CR)
  - Balance
- Footer shows:
  - Total Debits
  - Total Credits
  - Balance status badge (green "Balanced" or red "Unbalanced")

**Step 2: Test PDF Export**
1. Ensure report is generated (table is visible)
2. Click the "PDF" button (with Download icon)
3. Observe loading spinner in button

**Expected Result**:
- Toast notification: "Generating Trial Balance PDF..."
- PDF file downloads to browser
- Filename format: `Trial-Balance-YYYY-MM-DD.pdf`
- Toast success: "Trial Balance PDF exported successfully"

**PDF Content Verification**:
- Header: Company name, "Trial Balance", As of Date
- Prepared By: Current user's display name or email
- Table with all accounts from the UI
- Totals row with DR/CR sums
- Balance verification indicator

**Step 3: Test Excel Export**
1. Ensure report is generated (table is visible)
2. Click the "Excel" button (with FileSpreadsheet icon)
3. Observe loading spinner in button

**Expected Result**:
- Toast notification: "Generating Trial Balance Excel..."
- Excel file downloads to browser
- Filename format: `Trial-Balance-YYYY-MM-DD.xlsx`
- Toast success: "Trial Balance Excel exported successfully"

**Excel Content Verification**:
- Open the downloaded .xlsx file
- Header row with: External Ref | Account Code | Account Name | DR | CR
- Accounts grouped by type (Assets, Liabilities, Equity, Revenue, Expenses)
- Subtotals per group
- Grand totals row with double-line formatting
- Net Profit/Loss calculation at bottom
- Currency formatting applied to DR/CR columns

---

### Income Statement

#### Location
- Tab: "Income Statement" (5th tab from left, icon: TrendingUp)
- Service: `FinancialStatementsService.generateIncomeStatement()`
- Export: PDF via `pdfService.downloadISPDF()`, Excel via `exportIncomeStatementToExcel()`

#### Test Steps

**Step 1: Generate the Report**
1. Click the "Income Statement" tab
2. Set the "Start Date" (default: January 1 of current year)
3. Set the "End Date" (default: today)
4. Click "Generate Report" button

**Expected Result**:
- Report displays with collapsible sections:
  - **REVENUE** section with revenue accounts and subtotal
  - **COST OF GOODS SOLD** section (if applicable)
  - **Gross Profit** line
  - **OPERATING EXPENSES** section with expense accounts and subtotal
  - **Operating Income** calculation
  - **OTHER INCOME/EXPENSES** section
  - **Net Income Before Tax**
  - **Income Tax Expense**
  - **NET INCOME** (bottom line, highlighted)

**Step 2: Test PDF Export**
1. Ensure report is generated
2. Click the "PDF" button

**Expected Result**:
- Toast: "Generating Income Statement PDF..."
- PDF downloads with filename: `Income-Statement-YYYY-MM-DD-to-YYYY-MM-DD.pdf`
- Toast success: "Income Statement PDF exported successfully"

**PDF Content Verification**:
- Header with company name and "Income Statement"
- Period displayed (From/To dates)
- Hierarchical layout matching UI sections
- All subtotals and totals visible
- Net Income prominently displayed

**Step 3: Test Excel Export**
1. Ensure report is generated
2. Click the "Excel" button

**Expected Result**:
- Toast: "Generating Income Statement Excel..."
- Excel downloads with filename: `Income-Statement-YYYY-MM-DD-to-YYYY-MM-DD.xlsx`
- Toast success: "Income Statement Excel exported successfully"

**Excel Content Verification**:
- Worksheet named "Income Statement"
- Section headers with bold formatting
- Indented account lines
- Subtotal rows with formatting
- Currency formatting on amount columns
- Net Income highlighted

---

### Balance Sheet

#### Location
- Tab: "Balance Sheet" (6th tab from left, icon: Scale)
- Service: `FinancialStatementsService.generateBalanceSheet()`
- Export: PDF via `pdfService.downloadBSPDF()`, Excel via `exportBalanceSheetToExcel()`

#### Test Steps

**Step 1: Generate the Report**
1. Click the "Balance Sheet" tab
2. Set the "As of Date" using the date picker
3. Click "Generate Report" button

**Expected Result**:
- Report displays with sections:
  - **ASSETS**
    - Current Assets (with subsection lines)
    - Non-Current Assets (with subsection lines)
    - Total Assets
  - **LIABILITIES**
    - Current Liabilities (with subsection lines)
    - Non-Current Liabilities (with subsection lines)
    - Total Liabilities
  - **EQUITY**
    - Equity accounts and subsections
    - Total Equity
  - **Total Liabilities and Equity**
  - Balance indicator (should show balanced if Assets = Liabilities + Equity)

**Step 2: Test PDF Export**
1. Ensure report is generated
2. Click the "PDF" button

**Expected Result**:
- Toast: "Generating Balance Sheet PDF..."
- PDF downloads with filename: `Balance-Sheet-YYYY-MM-DD.pdf`
- Toast success: "Balance Sheet PDF exported successfully"

**PDF Content Verification**:
- Header with company name and "Balance Sheet"
- As of Date displayed
- Traditional balance sheet layout
- Contra accounts shown with appropriate formatting (e.g., Accumulated Depreciation)
- Total Assets equals Total Liabilities + Equity

**Step 3: Test Excel Export**
1. Ensure report is generated
2. Click the "Excel" button

**Expected Result**:
- Toast: "Generating Balance Sheet Excel..."
- Excel downloads with filename: `Balance-Sheet-YYYY-MM-DD.xlsx`
- Toast success: "Balance Sheet Excel exported successfully"

**Excel Content Verification**:
- Worksheet named "Balance Sheet"
- Hierarchical layout with indentation
- Section totals with bold/underline formatting
- Currency formatting on amount columns
- Grand total row for verification

---

### General Ledger

#### Location
- Tab: "General Ledger" (9th tab from left, icon: BookOpen)
- Service: `GLReportsService.generateGLByAccount()`
- Export: Currently uses placeholder handlers (TODO)

#### Test Steps

**Step 1: Generate the Report**
1. Click the "General Ledger" tab
2. Enter an Account Code (e.g., "1000" for Cash)
3. Set the "Start Date" and "End Date"
4. Click "Generate Report" button

**Expected Result**:
- Report displays transaction detail for the selected account:
  - Account header with code and name
  - Opening Balance
  - Transaction table with columns:
    - Date
    - Description
    - Source
    - Reference
    - Debit
    - Credit
    - Running Balance
  - Summary showing:
    - Total Debits
    - Total Credits
    - Closing Balance

**Step 2: Test PDF Export**
1. Ensure report is generated
2. Click the "PDF" button

**Expected Result**:
- Toast: "Generating PDF..."
- Currently: Placeholder toast after 1.5 seconds
- Note: Full GL PDF export is available via `pdfService.downloadGLPDF()` but not yet wired to this page

**Step 3: Test Excel Export**
1. Ensure report is generated
2. Click the "Excel" button

**Expected Result**:
- Toast: "Generating Excel..."
- Currently: Placeholder toast after 1.5 seconds
- Note: Full GL Excel export is available via `exportGeneralLedgerToExcel()` but not yet wired to this page

---

## Common Issues and Troubleshooting

### Issue 1: "Please generate the report first" Toast

**Cause**: Export button clicked before generating the report.

**Solution**:
1. Set appropriate date filters
2. Click "Generate Report" first
3. Wait for the data to load
4. Then click PDF or Excel export

### Issue 2: PDF/Excel Export Button Stays in Loading State

**Cause**: Export process failed silently.

**Solutions**:
1. Check browser console for errors
2. Verify user has proper permissions
3. Ensure data exists for the selected date range
4. Check network connectivity

### Issue 3: Empty Report Generated

**Cause**: No journal entries or accounts exist for the selected criteria.

**Solutions**:
1. Expand the date range
2. Check "Show Zero Balances" for Trial Balance
3. Verify chart of accounts has been seeded
4. Create some test journal entries

### Issue 4: Balance Sheet Shows "Unbalanced"

**Cause**: Journal entries don't balance, or opening balances are incorrect.

**Solutions**:
1. Review recent journal entries for imbalances
2. Check opening balance entries
3. Verify all accounts are properly categorized (Asset, Liability, etc.)

### Issue 5: PDF Opens in New Tab Instead of Downloading

**Cause**: Browser PDF handling settings.

**Solution**: This is expected behavior in some browsers. The PDF can be saved from the preview.

### Issue 6: Excel File Won't Open / Shows Error

**Cause**: File corruption or browser download issue.

**Solutions**:
1. Clear browser downloads and try again
2. Try a different browser
3. Check disk space
4. Verify the file size is not 0 bytes

### Issue 7: Currency Formatting Incorrect

**Cause**: Company default currency not set.

**Solution**:
1. Go to company settings
2. Set the default currency (e.g., USD, ZAR, EUR)
3. Regenerate the report

---

## Verification Checklist

Use this checklist to verify the complete export feature:

### Trial Balance
- [ ] Report generates with correct data
- [ ] Debits and credits balance (or imbalance is correctly shown)
- [ ] PDF exports successfully
- [ ] PDF contains all accounts from the UI
- [ ] PDF has proper formatting (headers, totals, footer)
- [ ] Excel exports successfully
- [ ] Excel contains grouped accounts by type
- [ ] Excel has subtotals per account type
- [ ] Excel has correct currency formatting

### Income Statement
- [ ] Report generates with revenue and expense sections
- [ ] Sections are collapsible/expandable
- [ ] Net Income calculation is correct
- [ ] PDF exports successfully
- [ ] PDF has hierarchical section layout
- [ ] PDF shows period dates (From/To)
- [ ] Excel exports successfully
- [ ] Excel has proper indentation for subsections
- [ ] Excel has section totals

### Balance Sheet
- [ ] Report generates with Assets, Liabilities, Equity
- [ ] Contra accounts display correctly
- [ ] Total Assets = Total Liabilities + Equity
- [ ] PDF exports successfully
- [ ] PDF shows As of Date
- [ ] PDF has traditional balance sheet format
- [ ] Excel exports successfully
- [ ] Excel has hierarchical layout
- [ ] Excel subtotals are correct

### General Ledger
- [ ] Report generates for specific account
- [ ] Opening and closing balances display
- [ ] Running balance is calculated correctly
- [ ] Transaction detail is accurate
- [ ] PDF button is present (placeholder/TODO)
- [ ] Excel button is present (placeholder/TODO)

### General UI/UX
- [ ] Loading spinners appear during generation
- [ ] Loading spinners appear on export buttons
- [ ] Toast notifications for success/error
- [ ] Buttons are disabled when no report generated
- [ ] Date pickers function correctly
- [ ] All 10 tabs are accessible

---

## Quick Verification Steps

For a rapid smoke test, complete these 5 steps in under 2 minutes:

### 1. Navigate to Reports (15 seconds)
- Go to `/workspace/[companyId]/reports`
- Verify the page loads with tabs visible

### 2. Generate Trial Balance (20 seconds)
- Click "Trial Balance" tab
- Click "Generate Report"
- Verify table appears with accounts

### 3. Export Trial Balance PDF (20 seconds)
- Click the "PDF" button
- Verify file downloads
- Open and verify content

### 4. Generate Income Statement (20 seconds)
- Click "Income Statement" tab
- Click "Generate Report"
- Verify sections appear (Revenue, Expenses, Net Income)

### 5. Export Income Statement Excel (20 seconds)
- Click the "Excel" button
- Verify file downloads
- Open and verify worksheet structure

**Pass Criteria**: All 5 steps complete without errors and produce valid exports.

---

## Setup Required

### Environment Variables
No additional environment variables required for the export feature. The existing Firebase configuration is sufficient.

### NPM Packages Used
- `pdfmake` - PDF generation
- `exceljs` - Excel generation

These are already installed in the project.

### Firebase Configuration
No changes required. Reports read from existing Firestore collections:
- `companies/{companyId}/chartOfAccounts`
- `companies/{companyId}/generalLedger`
- `companies/{companyId}/journalEntries`

---

## Related Documentation

- PDF Service Architecture: `/src/lib/pdf/pdf.service.ts`
- Excel Service Architecture: `/src/lib/excel/excel.service.ts`
- Reporting Module: `/src/lib/reporting/index.ts`
- Trial Balance Formatter: `/src/lib/reporting/tb-excel-formatter.ts`
- Income Statement Formatter: `/src/lib/reporting/is-excel-formatter.ts`
- Balance Sheet Formatter: `/src/lib/reporting/bs-excel-formatter.ts`
- General Ledger Formatter: `/src/lib/reporting/gl-excel-formatter.ts`

---

**End of Smoke Test Guide**
