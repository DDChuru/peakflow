# Smoke Test Guide: Suppliers CRUD Functionality

## Overview
This guide provides step-by-step verification procedures for the complete CRUD (Create, Read, Update, Delete) functionality implemented for the Suppliers page.

## Test Environment
- **Page Location**: `/workspace/[companyId]/suppliers`
- **Prerequisites**:
  - User must be logged in
  - User must have access to a workspace/company
  - Development server should be running (`npm run dev`)

## Test Cases

### 1. Navigation & Initial Load
**Steps:**
1. Navigate to a workspace
2. Click on "Suppliers" in the sidebar navigation
3. Observe the page loads successfully

**Expected Results:**
- ✅ Page loads without errors
- ✅ Summary cards display (Total Suppliers, Active, Total Payable, Categories)
- ✅ Search bar is visible and functional
- ✅ "Add Supplier" button is visible in the header
- ✅ Empty state shows if no suppliers exist

### 2. Create New Supplier
**Steps:**
1. Click "Add Supplier" button
2. Fill in the form with test data:
   - Name: "Test Supplier ABC"
   - Email: "supplier@test.com"
   - Phone: "+27 11 123 4567"
   - Category: "Raw Materials"
   - Payment Terms: 30 days
   - Status: Active
3. Expand "Bank Details" section and add:
   - Bank Name: "Standard Bank"
   - Branch Code: "051001"
   - SWIFT Code: "SBZAZAJJ"
4. Add notes: "Test supplier for verification"
5. Click "Create Supplier"

**Expected Results:**
- ✅ Dialog opens with proper form layout
- ✅ Form validation works (try submitting without name)
- ✅ Bank Details section collapses/expands correctly
- ✅ Success toast appears: "Supplier created successfully"
- ✅ Dialog closes automatically
- ✅ New supplier appears in the table
- ✅ Summary cards update with new counts

### 3. Search Functionality
**Steps:**
1. Type "Test" in the search bar
2. Try searching by:
   - Name
   - Email
   - Phone number
   - Category

**Expected Results:**
- ✅ Search filters results in real-time
- ✅ Matching suppliers are displayed
- ✅ Non-matching suppliers are hidden
- ✅ Clear search shows all suppliers again

### 4. View/Edit Supplier
**Steps:**
1. Click on a supplier row in the table
2. Modify some fields:
   - Change status to "Inactive"
   - Update payment terms to 45 days
   - Add/modify notes
3. Click "Update Supplier"

**Alternative Method:**
1. Click the three-dot menu on a supplier row
2. Select "Edit" from dropdown
3. Make changes and save

**Expected Results:**
- ✅ Edit dialog opens with pre-populated data
- ✅ All fields are editable
- ✅ Bank details (if present) are shown
- ✅ Success toast: "Supplier updated successfully"
- ✅ Changes reflect immediately in the table
- ✅ Status badge color changes appropriately

### 5. Actions Dropdown Menu
**Steps:**
1. Click the three-dot (MoreHorizontal) icon in the Actions column
2. Observe the dropdown menu options

**Expected Results:**
- ✅ Dropdown opens with three options:
  - View Details (with Eye icon)
  - Edit (with Edit icon)
  - Delete (with Trash2 icon in red)
- ✅ Clicking outside closes the dropdown
- ✅ Each action works as expected

### 6. Delete Supplier
**Steps:**
1. Click the three-dot menu on a supplier
2. Select "Delete" from dropdown
3. Confirm deletion in the alert dialog

**Expected Results:**
- ✅ Confirmation dialog appears with supplier name
- ✅ Warning message about permanent deletion is shown
- ✅ Cancel button closes dialog without deletion
- ✅ Delete button shows loading state while processing
- ✅ Success toast: "Supplier deleted successfully"
- ✅ Supplier is removed from the table
- ✅ Summary cards update accordingly

### 7. Payment Reminders Section
**Steps:**
1. Create/Edit a supplier with a positive current balance
2. Scroll down to see Payment Reminders section

**Expected Results:**
- ✅ Section appears only when suppliers have outstanding balances
- ✅ Shows supplier name, category, and payment terms
- ✅ Displays balance amount in orange
- ✅ "Pay Now" button is visible (functionality pending)

### 8. Form Validation
**Steps:**
1. Open Add Supplier dialog
2. Try to submit with:
   - Empty name field
   - Invalid email format
   - Negative payment terms

**Expected Results:**
- ✅ Name field shows: "Supplier name is required"
- ✅ Email field shows: "Invalid email address"
- ✅ Payment terms shows: "Payment terms must be 0 or more days"
- ✅ Form does not submit with validation errors

### 9. Responsive Design
**Steps:**
1. Resize browser window to mobile size
2. Check all CRUD operations on mobile

**Expected Results:**
- ✅ Summary cards stack vertically on mobile
- ✅ Table is horizontally scrollable
- ✅ Dialogs are properly sized for mobile
- ✅ All functionality remains accessible

### 10. Error Handling
**Steps:**
1. Try operations with network disconnected (simulate)
2. Observe error handling

**Expected Results:**
- ✅ Error toasts appear for failed operations
- ✅ Loading states show during async operations
- ✅ Buttons disable during submission
- ✅ Error messages are user-friendly

## Verification Checklist
Complete this checklist to confirm full functionality:

- [ ] Page loads successfully
- [ ] Can create new supplier with all fields
- [ ] Form validation works correctly
- [ ] Can search/filter suppliers
- [ ] Can edit existing supplier
- [ ] Can delete supplier with confirmation
- [ ] Actions dropdown menu works
- [ ] Toast notifications appear for all actions
- [ ] Summary cards update in real-time
- [ ] Payment reminders section displays correctly
- [ ] Mobile responsive design works
- [ ] Error handling is in place
- [ ] Loading states display during operations
- [ ] Bank details section expands/collapses
- [ ] Status badges show correct colors

## Common Issues to Check

1. **Toast not appearing**: Ensure `react-hot-toast` is installed and `<Toaster />` is in the app layout
2. **Dialog not opening**: Check Dialog component implementation and state management
3. **Form not submitting**: Verify form validation and async error handling
4. **Dropdown not working**: Ensure click event propagation is handled correctly
5. **Search not filtering**: Check the filter logic in the component

## Test Data for Quick Entry

```json
{
  "name": "Acme Supplies Ltd",
  "email": "accounts@acmesupplies.com",
  "phone": "+27 11 234 5678",
  "address": "123 Industrial Road, Johannesburg, Gauteng, 2001",
  "taxId": "4123456789",
  "accountNumber": "ACC-2024-001",
  "category": "Raw Materials",
  "paymentTerms": 30,
  "bankName": "Standard Bank",
  "branchCode": "051001",
  "swiftCode": "SBZAZAJJ",
  "notes": "Preferred supplier for steel products. Contact: John Smith"
}
```

## Success Criteria
✅ All CRUD operations work without errors
✅ User experience is smooth and intuitive
✅ Form validation provides clear feedback
✅ Data persists correctly in Firebase
✅ UI updates reflect changes immediately
✅ Error states are handled gracefully

## Next Steps
After successful testing:
1. Test with multiple suppliers (10+) for performance
2. Verify data persistence across sessions
3. Test concurrent updates from multiple users
4. Consider adding bulk import/export functionality
5. Implement actual payment processing for "Pay Now" button