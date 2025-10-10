# Smoke Test – Expanded SaaS Template & Bank-to-Ledger Import

## Overview
This guide verifies the expanded SaaS industry template with 58 transaction patterns and 62 vendor mappings, and the complete bank-to-ledger import workflow.

---

## Test Suite 1: Template Application

### 1.1 Navigate to Company Edit
1. Sign in as admin or developer
2. Navigate to `/companies`
3. Click "Edit Company" button (pencil icon) on a test company
4. Confirm you're on `/companies/[id]/edit` page

**Expected**: Form loads with current company details, industry dropdown shows all templates

### 1.2 Apply SaaS Template
1. Select "Software as a Service (SaaS)" from industry dropdown
2. Scroll to "Reset Chart of Accounts" warning section
3. Click "Reset & Re-apply Template" button
4. Review confirmation modal showing:
   - 27 new GL accounts
   - 58 transaction patterns
   - 62 vendor mappings
5. Click "Reset COA" to confirm

**Expected**:
- Loading toast appears: "Resetting Chart of Accounts..."
- Success toast shows:
  ```
  ✅ Chart of Accounts Created!
  • Deleted: X old accounts
  • Created: 27 new accounts
  • Patterns: 58 transaction patterns
  • Vendors: 62 vendor mappings
  ```
- No error toast appears
- Redirects to `/companies` page

### 1.3 Verify Console Logs
Open browser console and verify:
```
[GL Patterns] Starting to process 58 patterns
[GL Patterns Batch] ✅ Successfully committed [N] pattern rules
[GL Vendors] Starting to process 62 vendors
[GL Vendors Batch] ✅ Successfully committed [N] vendor rules
```

**Expected**: No permission errors, all batch commits successful

---

## Test Suite 2: Chart of Accounts Verification

### 2.1 Navigate to Workspace COA Page
1. From companies list, click "Open Workspace" on the test company
2. Navigate to Chart of Accounts from sidebar
3. Verify URL is `/workspace/[companyId]/chart-of-accounts`

**Expected**:
- Page loads without errors
- Shows "Chart of Accounts" header
- No mock/dummy data visible
- Real account data from Firestore displayed

### 2.2 Verify Account Structure
Review the displayed accounts and verify:
- **Assets** section has accounts (Cash, Bank, Accounts Receivable, etc.)
- **Liabilities** section has accounts (Accounts Payable, Accrued Expenses, etc.)
- **Equity** section has accounts (Retained Earnings, etc.)
- **Revenue** section has accounts (Subscription Revenue, Professional Services, etc.)
- **Expenses** section has accounts (Cloud Infrastructure, Payroll, Software Tools, etc.)

**Expected**: 27 total accounts organized by type, no placeholder data

---

## Test Suite 3: Bank-to-Ledger Import UI

### 3.1 Navigate to Bank Import
1. From workspace sidebar, click "Bank Import"
2. Verify URL is `/workspace/[companyId]/bank-import`

**Expected**:
- Page loads with "Bank to Ledger Import" header
- Shows import statistics cards (even if 0)
- Shows recent imports section (or empty state if none)

### 3.2 Test Import Statistics Loading
1. Observe the statistics cards at top
2. Verify cards show:
   - Total Transactions
   - Auto-matched percentage
   - Total Amount

**Expected**:
- Cards load real data from Firestore
- Loading spinner appears briefly during data fetch
- No hardcoded mock numbers (like "1,234" or "$45,231")

### 3.3 Test GL Account Dropdowns
1. If no import session exists, upload a bank statement first
2. Click on a transaction to open mapping dialog
3. Click on "Debit Account" dropdown
4. Click on "Credit Account" dropdown

**Expected**:
- Dropdowns populate with 27 GL accounts
- Accounts formatted as: "1000 - Cash"
- Good visibility with dark text on white background
- Hover states show blue highlight
- Selected items show checkmark
- No "No chart of accounts found" message

---

## Test Suite 4: Auto-Matching with Expanded Patterns

### 4.1 Test Payment Processing Patterns
Upload a bank statement with transactions matching these patterns:
- "STRIPE TRANSFER" → Should auto-match to 4100 (Subscription Revenue)
- "STRIPE FEE" → Should auto-match to 5300 (Payment Processing Fees)
- "PAYPAL PAYOUT" → Should auto-match to 4100 (Subscription Revenue)
- "SQUARE PAYMENT" → Should auto-match to 4100 (Subscription Revenue)

### 4.2 Test Cloud Infrastructure Patterns
Test transactions containing:
- "AWS" or "AMAZON WEB SERVICES" → 5100 (Cloud Infrastructure)
- "GOOGLE CLOUD" or "GCP" → 5100 (Cloud Infrastructure)
- "DIGITALOCEAN" → 5100 (Cloud Infrastructure)
- "HEROKU" → 5100 (Cloud Infrastructure)

### 4.3 Test Payroll Patterns
Test transactions containing:
- "GUSTO" → 5200 (Payroll & Benefits)
- "ADP PAYROLL" → 5200 (Payroll & Benefits)
- "RIPPLING" → 5200 (Payroll & Benefits)

### 4.4 Test Software Tools Patterns
Test transactions containing:
- "GITHUB" → 5400 (Software & Tools)
- "JIRA" → 5400 (Software & Tools)
- "FIGMA" → 5400 (Software & Tools)

**Expected**:
- Auto-matching engine recognizes patterns
- Confidence scores displayed for each match
- Transactions pre-populate with suggested accounts
- Manual override available for all suggestions

---

## Test Suite 5: Vendor Recognition

### 5.1 Test Major Vendors
Upload transactions with these vendor names (exact or partial):
- **Cloud**: AWS, Google Cloud, Azure, DigitalOcean, Linode, Heroku, Cloudflare, Netlify
- **Payroll**: Gusto, ADP, Rippling, Justworks, Paychex
- **Dev Tools**: GitHub, GitLab, JetBrains, Postman, Docker
- **Communication**: Slack, Zoom, Microsoft Teams, Google Workspace, Notion, Asana
- **Support**: Zendesk, Intercom, Freshdesk, Help Scout
- **APIs**: Twilio, SendGrid, Mailchimp, Mailgun, Stripe, Plaid
- **Sales/CRM**: Salesforce, HubSpot, Pipedrive, Close, Zoho

**Expected**:
- Vendor names recognized even with variations (e.g., "AMAZON WEB SERVICES" = "AWS")
- Each vendor maps to correct GL account
- Alternate names work (e.g., "AMZN" matches as AWS)

### 5.2 Test Vendor Confidence Scoring
1. Check suggested matches for vendor transactions
2. Verify confidence scores are high (>80%) for exact vendor matches
3. Verify confidence scores are moderate (60-80%) for pattern matches

---

## Test Suite 6: End-to-End Flow

### 6.1 Complete Import Workflow
1. Navigate to Bank Import page
2. Upload a bank statement PDF with mixed transactions
3. Wait for PDF processing to complete
4. Review auto-matched transactions
5. Manually map any unmatched transactions using dropdowns
6. Verify all accounts are visible and selectable
7. Save the import session

**Expected**:
- PDF processes successfully
- 50-80% auto-match rate for typical SaaS transactions
- Dropdowns work smoothly with no errors
- Import saves to Firestore
- Statistics update after save

### 6.2 Verify Firestore Data
Open Firebase Console → Firestore Database:
1. Navigate to `companies/[companyId]/glMappingRules`
2. Verify approximately 150+ mapping rules exist:
   - Pattern rules: ~58 documents
   - Vendor rules: ~100+ documents (62 vendors × alternates)
3. Check a few random rules for correct structure:
   ```json
   {
     "pattern": "STRIPE.*TRANSFER",
     "patternType": "regex",
     "glAccountCode": "4100",
     "priority": 5,
     "isActive": true,
     "metadata": {
       "description": "Stripe payment settlements",
       "category": "stripe-deposit"
     }
   }
   ```

**Expected**: All rules properly formatted, no missing required fields

---

## Test Suite 7: Error Handling & Edge Cases

### 7.1 Test Empty States
1. Test company with no Chart of Accounts
2. Navigate to Bank Import

**Expected**: Clear message "No chart of accounts found. Please apply an industry template."

### 7.2 Test Loading States
1. Open Bank Import page
2. Observe loading behavior

**Expected**:
- Statistics cards show loading spinner
- Dropdowns show "Loading accounts..." during fetch
- No flickering or layout shift

### 7.3 Test Permission Issues
1. Sign in as regular user (non-admin)
2. Attempt to access Bank Import

**Expected**: Access control working per workspace access rules

---

## Performance Checks

### 7.1 Initial Load Time
- Page should load in < 2 seconds on typical connection
- GL accounts should load in < 1 second
- No blocking JavaScript errors in console

### 7.2 Dropdown Performance
- Dropdowns with 27 accounts should open instantly
- Searching/filtering should be smooth
- No lag when selecting items

---

## Common Issues to Watch

### Issue 1: Zero Auto-Matches
**Symptoms**: All transactions show 0% match
**Check**:
1. Verify glMappingRules collection has 150+ documents
2. Check console for pattern matching errors
3. Verify transaction descriptions are not empty

### Issue 2: Empty Dropdowns
**Symptoms**: "No chart of accounts found"
**Check**:
1. Verify chartOfAccounts subcollection has 27 documents
2. Check component is using IndustryTemplateService
3. Verify race condition fix is applied (separate useEffect)

### Issue 3: toast.warning Error
**Symptoms**: Runtime error "toast.warning is not a function"
**Check**:
1. Verify `/app/companies/[id]/edit/page.tsx` line 166 uses `toast()` not `toast.warning()`
2. Custom styling applied for warning appearance

### Issue 4: Batch Write Failures
**Symptoms**: Only 3-8 mapping rules created
**Check**:
1. Verify firestore.rules includes glMappingRules security rules
2. Check console for permission errors
3. Confirm batch writes are being used (not individual writes)

---

## Verification Checklist

### Pre-Test Setup
- [ ] Signed in as admin or developer
- [ ] Test company selected
- [ ] Firebase Console access available for verification

### Template Application
- [ ] SaaS template selection works
- [ ] Reset confirmation modal shows correct counts
- [ ] Template applies successfully (27 accounts, 58 patterns, 62 vendors)
- [ ] No permission errors in console
- [ ] Success toast shows correct statistics

### Chart of Accounts
- [ ] Workspace COA page loads real data
- [ ] All 27 accounts visible and organized by type
- [ ] No mock/dummy data present
- [ ] Account structure matches SaaS template

### Bank Import UI
- [ ] Bank import page loads without errors
- [ ] Statistics cards show real data (not mock numbers)
- [ ] GL account dropdowns populate with 27 accounts
- [ ] Dropdown visibility is good (contrast, hover states)
- [ ] No "No chart of accounts found" error

### Auto-Matching
- [ ] Payment processing patterns recognized (Stripe, PayPal, Square)
- [ ] Cloud infrastructure patterns recognized (AWS, GCP, Azure)
- [ ] Payroll patterns recognized (Gusto, ADP)
- [ ] Software tool patterns recognized (GitHub, Figma, Slack)
- [ ] Confidence scores displayed for matches

### Vendor Recognition
- [ ] Major vendors recognized (AWS, Google, Stripe, etc.)
- [ ] Alternate names work (AMZN = AWS, GCP = Google Cloud)
- [ ] Vendor mappings point to correct GL accounts
- [ ] High confidence scores for exact vendor matches

### Firestore Verification
- [ ] glMappingRules has 150+ documents
- [ ] Pattern rules properly formatted
- [ ] Vendor rules include alternate names
- [ ] All rules have required fields (pattern, glAccountCode, priority)

### Error Handling
- [ ] Empty states display helpful messages
- [ ] Loading states show spinners/indicators
- [ ] Access control prevents unauthorized access
- [ ] No JavaScript errors in console

### Performance
- [ ] Page loads in < 2 seconds
- [ ] Dropdowns open instantly
- [ ] No lag or flickering during interactions

---

## Quick 2-Minute Verification

If you only have 2 minutes, run these critical tests:

1. **Template Application** (30 sec)
   - Apply SaaS template, verify success toast shows 27/58/62 counts

2. **COA Verification** (30 sec)
   - Open workspace COA page, verify 27 real accounts (no mock data)

3. **Dropdown Test** (30 sec)
   - Open bank import, click on transaction, verify dropdowns have 27 accounts

4. **Firestore Check** (30 sec)
   - Open Firebase Console → glMappingRules, verify 150+ documents exist

**All 4 pass = Core functionality working** ✅

---

## Next Steps After Verification

Once verified:
1. Update modernization-roadmap.md with ✅ for completed items
2. Document any issues found in GitHub issues
3. Proceed to Phase 6 access control implementation
4. Consider expanding other industry templates using same pattern
