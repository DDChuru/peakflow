# Smoke Test: AI Mapping Integration

**Feature**: Intelligent Bank-to-Ledger Transaction Mapping with AI Assistance
**Components**: BankToLedgerImport + MappingPipeline + RuleLearningService + AIMappingArtifact
**Date**: 2025-10-12
**Test Duration**: ~10-15 minutes

## Overview

This test verifies the complete AI mapping integration that processes bank transactions through a tri-state pipeline:
- **Auto-Mapped** (≥85% confidence): High-confidence rule matches - ready to apply
- **Needs Review** (60-84% confidence): Medium-confidence matches - quick verification needed
- **Needs AI** (<60% confidence): Low/no confidence - AI assistance required

## Prerequisites

✅ Firebase project configured with Firestore
✅ Company created with at least one user assigned
✅ Chart of Accounts populated (use `npm run seed:charts` if needed)
✅ OpenAI API key configured in environment variables
✅ Development server running (`npm run dev`)

## Test Setup

### 1. Prepare Test Data

Create a test bank statement CSV with these transactions (mix of known and unknown vendors):

```csv
Date,Description,Debit,Credit,Balance
2025-10-01,Starbucks Coffee Shop,15.50,,984.50
2025-10-02,Office Depot Supplies,125.00,,859.50
2025-10-03,AWS Cloud Services,89.99,,769.51
2025-10-04,Unknown Vendor XYZ,250.00,,519.51
2025-10-05,Microsoft Office 365,12.99,,506.52
2025-10-06,Stripe Payment Processing,45.00,,461.52
2025-10-07,Mystery Transaction ABC,500.00,,
```

### 2. Clear Existing Rules (Optional - for clean test)

Navigate to `/workspace/[companyId]/chart-of-accounts` and note any existing mapping rules. You may want to clear them for a baseline test.

## Test Execution

### Phase 1: Upload & Automatic Processing

#### Step 1.1: Upload Bank Statement
1. Navigate to `/workspace/[companyId]/bank-import`
2. Click "Upload Bank Statement"
3. Select your test CSV file
4. Click "Next" to proceed to statement details

**Expected Result**:
- ✅ File uploads successfully
- ✅ Statement details form appears (bank name, statement period, etc.)

#### Step 1.2: Review Statement Details
1. Fill in bank name: "Test Bank"
2. Set statement period (use current month)
3. Click "Load Transactions"

**Expected Result**:
- ✅ Transactions load into preview table
- ✅ Shows transaction count (7 in our test data)
- ✅ "Next: Map Transactions" button is enabled

#### Step 1.3: Trigger AI Pipeline Processing
1. Click "Next: Map Transactions"
2. Wait for MappingPipeline to process transactions (~2-3 seconds)

**Expected Result**:
- ✅ Tri-state dashboard appears with three stat cards:
  - **Auto-Mapped**: Green card with count (likely 0 on first run)
  - **Needs Review**: Yellow card with count (likely 0 on first run)
  - **Needs AI**: Blue card with count (all 7 transactions on first run)
- ✅ Console logs show pipeline processing:
  ```
  [MAPPING PIPELINE] Processing 7 transactions...
  [AI NEEDED] Starbucks Coffee Shop (no suitable rule match)
  [AI NEEDED] Office Depot Supplies (no suitable rule match)
  ...
  [MAPPING PIPELINE] Complete in XXXms
  ```

### Phase 2: Auto-Mapped Transactions (Skip if empty on first run)

If the Auto-Mapped tab shows transactions (will happen on subsequent imports after rules are created):

#### Step 2.1: Review Auto-Mapped Tab
1. Click "Auto-Mapped" tab
2. Review the transactions listed

**Expected Result**:
- ✅ Transactions show with confidence scores (≥85%)
- ✅ GL account mappings displayed (Debit/Credit)
- ✅ "Apply All" button is available

#### Step 2.2: Batch Apply Auto-Mapped
1. Click "Apply All Auto-Mapped"
2. Observe toast notification

**Expected Result**:
- ✅ Success toast: "X transactions auto-mapped successfully"
- ✅ Transactions move to "Selected Transactions" section
- ✅ Auto-Mapped count decreases to 0

### Phase 3: Needs Review Transactions (Skip if empty on first run)

#### Step 3.1: Review Medium-Confidence Matches
1. Click "Needs Review" tab
2. Review suggested mappings

**Expected Result**:
- ✅ Transactions show with confidence scores (60-84%)
- ✅ Suggested GL accounts displayed
- ✅ Each transaction has "Approve" and "Edit" buttons

#### Step 3.2: Approve a Review Item
1. Click "Approve" on first transaction
2. Observe toast notification

**Expected Result**:
- ✅ Success toast: "Mapping approved and rule saved!"
- ✅ Transaction moves to Selected Transactions
- ✅ Needs Review count decreases by 1

### Phase 4: Needs AI Transactions (Primary Test Focus)

This is where the AIMappingArtifact integration is tested.

#### Step 4.1: View AI Queue
1. Click "Needs AI" tab
2. Observe the transaction list

**Expected Result**:
- ✅ All 7 transactions displayed as cards
- ✅ Each card shows:
  - Transaction description
  - Date and amount
  - "No Rule Match" badge
  - Chevron right icon
- ✅ Cards are clickable with hover effect

#### Step 4.2: Analyze First Transaction with AI
1. Click on the first transaction card ("Starbucks Coffee Shop")
2. Wait for AI analysis (~2-3 seconds)

**Expected Result**:
- ✅ Loading state shows briefly
- ✅ AIMappingArtifact component appears with:
  - **Header**: "AI Analysis" with Sparkles icon
  - **Transaction Info**: Description, amount, date
  - **Progress Badge**: "Transaction 1 of 7"
  - **Navigation Buttons**: Previous (disabled), Next (enabled)
  - **Confidence Badge**: Shows percentage (e.g., "92% Confidence")
  - **Mapping Suggestion**:
    - Debit account (e.g., "6200 - Meals & Entertainment")
    - Credit account (e.g., "1000 - Cash in Bank")
    - Amounts displayed
  - **Reasoning Section**: Bullet points explaining the mapping
  - **Explanation**: Accounting principle details
  - **Action Buttons**: "Skip", "Edit Details", "Approve & Save Rule"
  - **Keyboard Shortcuts**: Displayed at bottom

**Console Output**:
```
✅ AI-approved mapping saved as rule: {
  ruleId: "...",
  pattern: "starbucks coffee",
  account: "6200",
  priority: 90
}
```

#### Step 4.3: Test Keyboard Shortcuts
With the artifact open:
1. Press `→` (right arrow) to navigate to next transaction
2. Press `←` (left arrow) to go back
3. Press `E` to open edit dialog (should open mapping dialog)
4. Press `Escape` to close dialog
5. Press `Enter` to approve current mapping

**Expected Result**:
- ✅ Navigation keys work smoothly
- ✅ Edit dialog opens/closes correctly
- ✅ Enter key approves and saves mapping + rule

#### Step 4.4: Approve AI Suggestion
1. With transaction displayed in artifact, click "Approve & Save Rule"
2. Observe the workflow

**Expected Result**:
- ✅ Success toast appears:
  ```
  ✅ Mapping applied and rule saved!
  📋 Future transactions matching "starbucks coffee" will auto-map to 6200 - Meals & Entertainment
  ```
- ✅ Transaction is removed from Needs AI list
- ✅ Selected Transactions count increases by 1
- ✅ Artifact clears and shows next transaction (or returns to list if last)
- ✅ Console logs rule creation:
  ```
  ✅ AI-approved mapping saved as rule: {
    ruleId: "rule-xxx",
    pattern: "starbucks coffee",
    account: "6200",
    priority: 90
  }
  ```

#### Step 4.5: Test Edit Functionality
1. Click on another transaction (e.g., "Office Depot Supplies")
2. Wait for AI analysis
3. Click "Edit Details" button

**Expected Result**:
- ✅ Manual mapping dialog opens
- ✅ Shows GL account dropdowns
- ✅ Can manually select different accounts
- ✅ Can save manual mapping

#### Step 4.6: Test Skip Functionality
1. With artifact open, click "Skip" button

**Expected Result**:
- ✅ Artifact clears and returns to transaction list
- ✅ No mapping applied
- ✅ Transaction remains in Needs AI list

#### Step 4.7: Test Alternative Mappings (if available)
1. Analyze a transaction that has alternative suggestions
2. Look for "Alternative Mappings" section
3. Click on an alternative option

**Expected Result**:
- ✅ Alternative mapping becomes the primary suggestion
- ✅ Confidence score updates
- ✅ Can approve the alternative

### Phase 5: Account Creation Flow

This tests the scenario where AI suggests creating a new GL account.

#### Step 5.1: Trigger Account Creation Scenario
1. Analyze a transaction with an unknown vendor (e.g., "Unknown Vendor XYZ")
2. Wait for AI analysis

**Expected Result**:
- ✅ Artifact shows **"Missing Account Detected"** section with AlertCircle icon
- ✅ Yellow/amber color scheme indicates special case
- ✅ Shows reasoning: "Why this account is needed"
- ✅ **"Suggested New Account"** card displays:
  - Code (e.g., "6850")
  - Name (e.g., "Vendor XYZ Expenses")
  - Type (e.g., "expense")
  - Category
  - Normal Balance
- ✅ **"Proposed Mapping"** shows how it will be used
- ✅ **"Create Account & Apply"** button is prominent (amber/yellow color)
- ✅ Indicates rule will be saved

#### Step 5.2: Create Account and Apply
1. Review the suggested account details
2. Click "Create Account & Apply" button
3. Wait for processing (~2-3 seconds)

**Expected Result**:
- ✅ Loading state: Button shows "Creating..."
- ✅ Success toast appears:
  ```
  ✨ Success!
  📊 6850 - Vendor XYZ Expenses
  📋 Future transactions matching "unknown vendor xyz" will auto-map to this account
  ```
- ✅ Transaction is mapped and removed from Needs AI
- ✅ New account is created in Chart of Accounts
- ✅ Rule is saved for future auto-mapping
- ✅ Console logs both operations:
  ```
  ✅ GL Account created from AI suggestion: {
    accountId: "...",
    code: "6850",
    name: "Vendor XYZ Expenses",
    type: "expense"
  }
  ✅ AI-approved mapping saved as rule: {
    ruleId: "...",
    pattern: "unknown vendor xyz",
    account: "6850",
    priority: 90
  }
  ```

#### Step 5.3: Verify Account Creation
1. Open Chart of Accounts in a new tab: `/workspace/[companyId]/chart-of-accounts`
2. Search for the newly created account code (e.g., "6850")

**Expected Result**:
- ✅ New account exists in the Chart of Accounts
- ✅ Account metadata shows `createdBy: "ai-assistant"`
- ✅ Account is marked as active

### Phase 6: Progressive Learning Test

This verifies that rules created in Phase 4 and 5 actually work on subsequent imports.

#### Step 6.1: Complete First Import
1. Process all remaining Needs AI transactions (analyze and approve each)
2. Click "Post to Ledger" to complete the import

**Expected Result**:
- ✅ All transactions mapped
- ✅ Import completes successfully
- ✅ Multiple rules created (check console logs)

#### Step 6.2: Upload Same Statement Again
1. Return to bank import page
2. Upload the same CSV file again
3. Proceed through upload flow
4. Click "Map Transactions" to trigger pipeline

**Expected Result**:
- ✅ **Auto-Mapped count is now HIGH** (should be 5-7 transactions)
- ✅ **Needs AI count is now LOW** (should be 0-2 transactions)
- ✅ Console shows rule matches:
  ```
  [AUTO-MAP] Starbucks Coffee Shop → 6200 - Meals & Entertainment (100%)
  [AUTO-MAP] Office Depot Supplies → 6500 - Office Expenses (100%)
  [AUTO-MAP] Unknown Vendor XYZ → 6850 - Vendor XYZ Expenses (100%)
  ...
  ```
- ✅ Auto-mapping percentage: **70-100%**

#### Step 6.3: Batch Apply Auto-Mapped
1. Click "Auto-Mapped" tab
2. Review all auto-mapped transactions
3. Click "Apply All Auto-Mapped"

**Expected Result**:
- ✅ All auto-mapped transactions apply instantly
- ✅ Success toast confirms batch application
- ✅ Import can be completed in seconds vs. minutes

### Phase 7: Edge Cases & Error Handling

#### Test 7.1: API Failure Handling
1. Temporarily disable network or simulate API error
2. Try analyzing a transaction with AI

**Expected Result**:
- ✅ Error toast: "Failed to analyze transaction"
- ✅ No crash or broken state
- ✅ Can retry or skip

#### Test 7.2: Empty State Handling
1. Process all Needs AI transactions
2. Verify empty state

**Expected Result**:
- ✅ Message: "All transactions processed! 🎉"
- ✅ Returns to transaction list view
- ✅ No errors in console

#### Test 7.3: Navigation Boundaries
1. On first AI transaction, verify "Previous" button is disabled
2. On last AI transaction, verify "Next" button is disabled

**Expected Result**:
- ✅ Navigation buttons disabled correctly
- ✅ No errors when trying to navigate beyond bounds

## Verification Checklist

### ✅ Core Functionality
- [ ] Tri-state dashboard displays correctly with stat cards
- [ ] MappingPipeline processes transactions on "Map Transactions" click
- [ ] Auto-Mapped tab shows high-confidence matches (≥85%)
- [ ] Needs Review tab shows medium-confidence matches (60-84%)
- [ ] Needs AI tab shows low-confidence transactions (<60%)

### ✅ AIMappingArtifact Integration
- [ ] Artifact renders when clicking on Needs AI transaction
- [ ] Shows transaction details, amount, date
- [ ] Displays AI mapping suggestion with debit/credit accounts
- [ ] Shows confidence score with color-coded badge
- [ ] Reasoning section explains the mapping logic
- [ ] Accounting principle explanation provided
- [ ] Alternative mappings displayed (if available)
- [ ] Navigation buttons (Previous/Next) work correctly
- [ ] Progress indicator shows "Transaction X of Y"

### ✅ Action Handlers
- [ ] "Approve & Save Rule" button works
  - [ ] Applies mapping to transaction
  - [ ] Saves rule via RuleLearningService
  - [ ] Shows success toast with rule details
  - [ ] Removes transaction from Needs AI list
  - [ ] Moves to next transaction or clears artifact
- [ ] "Edit Details" opens manual mapping dialog
- [ ] "Skip" button returns to transaction list without mapping
- [ ] Keyboard shortcuts work (Enter, E, S, arrows)

### ✅ Account Creation Flow
- [ ] "Missing Account Detected" scenario triggers correctly
- [ ] Suggested new account details are logical and complete
- [ ] "Create Account & Apply" button creates account
- [ ] New account appears in Chart of Accounts
- [ ] Rule is saved with new account mapping
- [ ] Success toast confirms both operations

### ✅ Rule Learning & Progressive Improvement
- [ ] Rules are saved on AI approval (check console logs)
- [ ] Rules have high priority (90)
- [ ] Rules include metadata (pattern, vendor, confidence)
- [ ] Second import with same data shows high auto-mapping rate
- [ ] Auto-mapping percentage improves from ~0% to 70-100%

### ✅ Error Handling & Edge Cases
- [ ] API failure shows error toast, no crash
- [ ] Empty Needs AI list shows appropriate message
- [ ] Navigation boundaries respected (disabled buttons at ends)
- [ ] Can recover from errors (retry, skip)

## Performance Metrics

Track these metrics during testing:

| Metric | First Import | Second Import | Target |
|--------|-------------|---------------|--------|
| **Auto-Mapping Rate** | 0-20% | 70-100% | ≥90% steady state |
| **AI Calls Required** | 7 (all) | 0-2 (new only) | <10% of transactions |
| **Time to Complete** | ~5-7 min | ~30 sec | <5 min for 100 txns |
| **User Actions Required** | ~14 (2 per txn) | ~2-4 (batch apply) | <0.2 per transaction |

## Common Issues & Troubleshooting

### Issue 1: Pipeline doesn't trigger automatically
**Symptom**: Clicking "Map Transactions" doesn't show tri-state dashboard
**Check**:
- Console logs for MappingPipeline initialization
- Verify `suggestMappings()` is called in useEffect
- Check that `currentStep === 2` triggers the dashboard render

**Fix**: Ensure `suggestMappings()` is called when step changes to 2

### Issue 2: AI artifact doesn't appear
**Symptom**: Clicking transaction card does nothing
**Check**:
- Console for API errors (/api/ai/analyze-transaction)
- Verify OpenAI API key is configured
- Check that `handleAnalyzeWithAI` is called

**Fix**: Verify API route is working, check API key in .env.local

### Issue 3: Rules not saving
**Symptom**: Second import shows same low auto-mapping rate
**Check**:
- Console for "AI-approved mapping saved as rule" logs
- Verify RuleLearningService instantiation
- Check Firestore permissions for `mappingRules` collection

**Fix**: Ensure RuleLearningService is properly initialized and has Firestore access

### Issue 4: Account creation fails
**Symptom**: "Create Account & Apply" shows error
**Check**:
- Console for error details
- Verify IndustryTemplateService has write permissions
- Check that account code doesn't already exist

**Fix**: Ensure unique account codes and proper Firestore permissions

### Issue 5: Transaction remains in Needs AI after approval
**Symptom**: Approved transaction doesn't move to Selected
**Check**:
- Verify `setNeedsAI(needsAI.filter(...))` is called
- Check `saveMapping()` is invoked
- Ensure `setSelectedTransactions()` adds transaction ID

**Fix**: Review handler logic, ensure all state updates execute

## Success Criteria

✅ **Workflow Efficiency**: First import takes ~5-7 minutes, second import <1 minute
✅ **Automation Rate**: Second import achieves ≥70% auto-mapping
✅ **Rule Learning**: All AI approvals automatically save as rules
✅ **Account Creation**: Can create new GL accounts from AI suggestions
✅ **User Experience**: Artifact UI is intuitive, keyboard shortcuts work
✅ **Error Resilience**: Gracefully handles API failures without crashing
✅ **Progressive Learning**: System demonstrably improves with each import

## Next Steps After Testing

1. **Document Issues**: Note any bugs or UX improvements needed
2. **Update Roadmap**: Mark this feature as complete in modernization-roadmap.md
3. **Performance Optimization**: If processing >100 transactions, consider batch API calls
4. **Add Analytics**: Track auto-mapping rates over time for metrics dashboard
5. **User Training**: Create user guide with screenshots for end users

## Related Documentation

- `/AI-MAPPING-INTEGRATION-PLAN.md` - Architecture and design decisions
- `/project-management/phase-5-bank-and-cash-management.md` - Overall phase plan
- `/src/lib/ai/mapping-pipeline.ts` - Pipeline implementation details
- `/src/lib/ai/rule-learning-service.ts` - Rule learning logic
- `/src/components/banking/AIMappingArtifact.tsx` - Artifact component code
