# Smoke Test: Contract Form Submission Fix

## Quick Verification (2 minutes)

### Test 1: Contract Creation - Happy Path
1. Navigate to `/workspace/{companyId}/contracts`
2. Click "New Agreement" button
3. Fill in form:
   - Contract Name: "Test Agreement 2025"
   - Customer: Select any customer
   - Start Date: Today's date
   - End Date: One year from today
   - Billing Frequency: Monthly
   - Payment Terms: 30
4. Add one line item:
   - Description: "Monthly Support"
   - Quantity: 1
   - Unit Price: 5000
   - GL Account: Select any revenue account
5. Open browser console (F12)
6. Click "Create Agreement"

**Expected Console Output (in order):**
```
🔘 Submit button clicked
Form line items: [{description: "Monthly Support", quantity: 1, ...}]
Is valid: true
🚀 Form submit event triggered
✅ handleCreate called with data: {contractName: "Test Agreement 2025", ...}
📊 Form validation errors: {}
```

**Expected UI Behavior:**
- ✅ Success toast: "Service agreement created successfully"
- ✅ Dialog closes
- ✅ New agreement appears in table
- ✅ Page data reloads

### Test 2: Form Validation - Missing Required Fields
1. Click "New Agreement" button
2. Leave all fields empty
3. Click "Create Agreement"

**Expected Behavior:**
- ✅ Form-level error alert appears showing all validation errors
- ✅ Individual field errors appear in red
- ✅ Form does NOT submit
- ✅ Dialog stays open

**Expected Alert Content:**
```
Please fix the following errors:
• contractName: Contract name is required
• customerId: Customer is required
• startDate: Start date is required
• endDate: End date is required
• lineItems: At least one line item is required
```

### Test 3: Line Items Validation
1. Click "New Agreement" button
2. Fill in all required fields EXCEPT line item details
3. Leave line item fields empty or incomplete
4. Click "Create Agreement"

**Expected Behavior:**
- ✅ Form shows validation errors for line item fields
- ✅ Button is disabled if no line items exist
- ✅ Form does NOT submit until line items are complete

### Test 4: Edit Existing Agreement
1. Click "..." menu on any existing agreement
2. Select "Edit"
3. Modify contract name
4. Click "Update Agreement"

**Expected Behavior:**
- ✅ Success toast: "Service agreement updated successfully"
- ✅ Dialog closes
- ✅ Updated data appears in table
- ✅ Console shows same log sequence as creation

## Debug Console Logs Reference

### Successful Submission Flow
```
📋 Line items synced: [{...}]           // On line item changes
🔘 Submit button clicked                // On button click
Form line items: [{...}]                // Button onClick handler
Is valid: true                          // Form validation state
🚀 Form submit event triggered          // Form onSubmit handler
✅ handleCreate called with data: {...} // Submit handler execution
📊 Form validation errors: {}           // No validation errors
```

### Failed Validation Flow
```
🔘 Submit button clicked
Form line items: []
Is valid: false
🚀 Form submit event triggered
// ❌ handleCreate NOT called - validation failed
```

## Common Issues to Check

### Issue: Button Click Does Nothing
**Check:**
- Browser console for any JavaScript errors
- Button `disabled` state: `disabled={isSubmitting || formLineItems.length === 0}`
- Network tab for failed API calls

**Fix:**
- Ensure at least one line item exists
- Ensure all required fields are filled
- Check console for validation errors

### Issue: Validation Errors Not Visible
**Check:**
- Form-level error alert should appear below form header
- Individual field errors should appear below each field

**Fix:**
- Validation errors are now displayed in Alert component
- Check console logs for `📊 Form validation errors:` output

### Issue: Form Submits But Fails
**Check:**
- Console logs for `handleCreate` execution
- Network tab for API call to SLA service
- Error toast message content

**Fix:**
- Check Firebase permissions
- Verify company ID is valid
- Check SLA service implementation

## Other Forms to Test (Priority)

This fix affects ALL forms using `<Button type="submit">`. Test these forms:

1. **Company Creation** (`/companies/new`)
   - Click "Create Company"
   - Verify submission works

2. **Customer Creation** (`/workspace/{companyId}/customers`)
   - Click "Add Customer"
   - Fill form and submit
   - Verify creation works

3. **Supplier Creation** (`/workspace/{companyId}/suppliers`)
   - Click "Add Supplier"
   - Fill form and submit
   - Verify creation works

4. **Invoice Creation** (`/workspace/{companyId}/invoices`)
   - Test invoice form submission

## Rollback Plan

If the fix causes issues:

1. **Revert Button Component:**
   ```bash
   git checkout HEAD -- src/components/ui/button.tsx
   ```

2. **Revert Contracts Page:**
   ```bash
   git checkout HEAD -- app/workspace/[companyId]/contracts/page.tsx
   ```

3. **Alternative Fix:**
   - Use native `<button type="submit">` instead of custom Button component
   - Or wrap form submission in explicit handler

## Performance Notes

- No performance impact expected
- Debug console logs can be removed after verification
- Form validation performance unchanged

## Browser Compatibility

The fix uses standard HTML form submission mechanics:
- ✅ Chrome/Edge (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Mobile browsers

## Next Steps After Verification

1. Remove debug console.log statements (optional - they're helpful for debugging)
2. Test all other forms using Button component
3. Consider adding unit tests for form submission
4. Update Button component documentation
