# Smoke Test Guide - Quote Management System

## Overview
This guide provides step-by-step verification procedures for the new Quote Management UI system, ensuring all features work correctly after implementation.

## Prerequisites
- Development server running (`npm run dev`)
- Valid company with active debtors/customers
- Chart of accounts configured with revenue accounts
- User with appropriate permissions

## Test Environment Setup
1. Navigate to the application in your browser
2. Log in with admin credentials
3. Select a company with existing customers

## Test Procedures

### 1. Quote List Page Verification

**Navigation Test:**
- [ ] Go to `/companies/[id]/quotes`
- [ ] Verify page loads without errors
- [ ] Check breadcrumb navigation shows: Companies > [Company Name] > Quotes

**UI Components Test:**
- [ ] Verify header shows "Quotes" with quote count
- [ ] Check "Create Quote" button is present and styled correctly
- [ ] Confirm "Export" button is present
- [ ] Validate stats cards display:
  - [ ] Total Quotes
  - [ ] Open Value
  - [ ] Expiring Soon
  - [ ] Conversion Rate
  - [ ] This Month

**Filter Functionality:**
- [ ] Test search box for quote number/customer name
- [ ] Verify status filter buttons work (All, Draft, Sent, Accepted, etc.)
- [ ] Check date range filters (All Time, 30 days, 60 days, 90 days)
- [ ] Confirm "Clear filters" button resets all filters
- [ ] Validate filter results update quote list dynamically

**Quote Cards Display:**
- [ ] Verify quotes display in responsive grid layout
- [ ] Check each quote card shows:
  - [ ] Quote number with version badge (if > v1)
  - [ ] Customer name
  - [ ] Status badge with correct color/icon
  - [ ] Quote date and valid until date
  - [ ] Quote amount formatted correctly
  - [ ] "Expiring Soon" badge for quotes expiring within 7 days
- [ ] Test hover effects on quote cards
- [ ] Verify action buttons appear on hover (View, Edit, More)

**Empty State:**
- [ ] Test with no quotes (shows "Create First Quote" message)
- [ ] Test with no search results (shows "Try adjusting search criteria")

### 2. Quote Creation Page Verification

**Navigation Test:**
- [ ] Click "Create Quote" from quotes list
- [ ] Verify navigation to `/companies/[id]/quotes/new`
- [ ] Check breadcrumb shows: Companies > [Company Name] > Quotes > Create

**Customer Selection:**
- [ ] Test customer search autocomplete functionality
- [ ] Verify dropdown shows customer name and email
- [ ] Confirm customer selection updates form
- [ ] Test "Change" button to reselect customer
- [ ] Validate customer is required (error message on submit)

**Quote Details Section:**
- [ ] Verify quote date defaults to today
- [ ] Test validity period input (default 30 days)
- [ ] Check "Valid Until" field auto-calculates and displays correctly
- [ ] Test currency selection dropdown

**Line Items Management:**
- [ ] Verify initial line item is present
- [ ] Test "Add Item" button creates new line item
- [ ] Confirm line item fields:
  - [ ] Description (required)
  - [ ] Revenue Account dropdown (required)
  - [ ] Quantity input with validation
  - [ ] Unit Price input with validation
  - [ ] Tax Rate input (optional)
  - [ ] Amount auto-calculates correctly
- [ ] Test remove line item functionality (trash icon)
- [ ] Verify minimum one line item is maintained
- [ ] Check totals calculation updates dynamically

**Additional Information:**
- [ ] Test Notes textarea (optional)
- [ ] Test Terms and Conditions textarea (optional)

**Form Validation:**
- [ ] Test submit without customer (error message)
- [ ] Test submit without valid line items (error message)
- [ ] Test submit with invalid dates (error message)
- [ ] Verify successful validation proceeds to save

**Save Functionality:**
- [ ] Test "Save Draft" button creates quote with draft status
- [ ] Test "Save & Send" button creates quote with sent status
- [ ] Verify success message displays
- [ ] Confirm navigation to quote detail page after save

### 3. Quote Detail Page Verification

**Navigation Test:**
- [ ] Click on a quote card from quotes list
- [ ] Verify navigation to `/companies/[id]/quotes/[quoteId]`
- [ ] Check breadcrumb shows: Companies > [Company Name] > Quotes > [Quote Number]

**Quote Header:**
- [ ] Verify quote number displays with version badge (if applicable)
- [ ] Check status badge with correct color and icon
- [ ] Confirm customer name is displayed
- [ ] Validate total amount shows prominently

**Status Alerts:**
- [ ] For expired quotes: Red alert banner displays
- [ ] For expiring quotes: Yellow alert banner displays
- [ ] Alerts show appropriate dates and messages

**Quote Details Section:**
- [ ] Verify quote date, valid until, validity period, currency display
- [ ] Check conversion status (if quote was converted to invoice)

**Line Items Display:**
- [ ] Verify all line items display correctly
- [ ] Check descriptions, quantities, unit prices, tax rates
- [ ] Confirm individual amounts and totals calculate correctly
- [ ] Validate subtotal, tax, and total amounts

**Notes and Terms:**
- [ ] Verify notes section displays if present
- [ ] Check terms and conditions display if present

**Actions Sidebar:**
- [ ] For draft quotes: "Send Quote" button available
- [ ] For sent/accepted quotes: "Convert to Invoice" button available
- [ ] Verify disabled buttons show appropriate tooltips
- [ ] Test action buttons are properly enabled/disabled based on status

**Customer Information:**
- [ ] Verify customer details display correctly
- [ ] Check email, phone, address if available
- [ ] Confirm customer ID shows

**Version History:**
- [ ] Test "Version History" toggle button
- [ ] Verify version history displays for quotes with multiple versions
- [ ] Check clicking on different versions navigates correctly
- [ ] Confirm current version is highlighted

**Metadata Section:**
- [ ] Verify created/updated timestamps
- [ ] Check created by/modified by information

### 4. Quote-to-Invoice Conversion Verification

**Modal Launch:**
- [ ] Click "Convert to Invoice" from quote detail page
- [ ] Verify modal opens without errors
- [ ] Check modal shows quote information in header

**Step 1 - Review Items:**
- [ ] Verify all quote line items display
- [ ] Check items are selected by default
- [ ] Test toggling item inclusion with checkboxes
- [ ] Verify quantity modification updates amounts
- [ ] Test unit price modification updates amounts
- [ ] Check tax rate modification updates amounts
- [ ] Test "Add Item" functionality
- [ ] Test remove item functionality
- [ ] Verify conversion summary updates dynamically
- [ ] Check "Continue" button is disabled with no items selected

**Step 2 - Invoice Settings:**
- [ ] Verify invoice date defaults to today
- [ ] Test payment terms input (default 30 days)
- [ ] Check invoice notes textarea
- [ ] Verify preview summary displays correctly
- [ ] Test due date calculation is accurate

**Step 3 - Confirm:**
- [ ] Verify conversion summary displays all details
- [ ] Check warning about quote status change
- [ ] Confirm final amounts match selections

**Conversion Process:**
- [ ] Test "Convert to Invoice" button
- [ ] Verify loading state during conversion
- [ ] Check success message displays
- [ ] Confirm modal closes on success
- [ ] Verify quote detail page refreshes with conversion status

### 5. Integration Tests

**Quote Service Integration:**
- [ ] Verify quotes are saved to database correctly
- [ ] Check quote numbers are auto-generated sequentially
- [ ] Confirm quote status updates persist
- [ ] Test quote filtering and searching works with database

**Customer Integration:**
- [ ] Verify customer data displays correctly in quotes
- [ ] Check customer search finds all active customers
- [ ] Confirm customer selection populates correctly

**Chart of Accounts Integration:**
- [ ] Verify revenue accounts load in line item dropdowns
- [ ] Check GL account selection saves correctly
- [ ] Confirm account codes display properly

**Invoice Integration:**
- [ ] Test quote-to-invoice conversion creates valid invoice
- [ ] Verify invoice contains correct line items and amounts
- [ ] Check invoice references original quote
- [ ] Confirm quote status updates to "converted"

### 6. Responsive Design Tests

**Desktop (1200px+):**
- [ ] Verify 3-column quote grid layout
- [ ] Check sidebar displays properly on detail page
- [ ] Confirm all buttons and elements are accessible

**Tablet (768px-1199px):**
- [ ] Verify 2-column quote grid layout
- [ ] Check responsive navigation works
- [ ] Confirm modal displays properly

**Mobile (< 768px):**
- [ ] Verify single-column quote grid layout
- [ ] Check mobile-friendly form layouts
- [ ] Confirm touch interactions work properly
- [ ] Test modal responsiveness

### 7. Error Handling Tests

**Network Errors:**
- [ ] Test behavior when quote creation fails
- [ ] Verify appropriate error messages display
- [ ] Check loading states handle errors gracefully

**Validation Errors:**
- [ ] Test form validation messages are clear
- [ ] Verify required field validation works
- [ ] Check data type validation (numbers, dates)

**Permission Errors:**
- [ ] Test access with insufficient permissions
- [ ] Verify proper error messages and redirects

## Expected Results

### Performance Expectations
- [ ] Page load times under 2 seconds
- [ ] Smooth animations and transitions
- [ ] No console errors in browser developer tools

### Accessibility Expectations
- [ ] All interactive elements are keyboard accessible
- [ ] Screen reader announcements for status changes
- [ ] Proper focus management in modals
- [ ] Adequate color contrast for all elements

### Data Integrity Expectations
- [ ] All quote data saves correctly
- [ ] Calculations are accurate
- [ ] Status changes persist properly
- [ ] Version history maintains correctly

## Common Issues to Check

1. **Loading States**: Ensure all async operations show appropriate loading indicators
2. **Error Boundaries**: Verify error messages are user-friendly
3. **Data Validation**: Check all form validations work correctly
4. **Responsive Design**: Test on multiple screen sizes
5. **Browser Compatibility**: Test on Chrome, Firefox, Safari, Edge

## Post-Test Verification

After completing all tests:
- [ ] All quote CRUD operations work correctly
- [ ] Quote-to-invoice conversion functions properly
- [ ] UI is responsive and accessible
- [ ] No console errors or warnings
- [ ] Performance meets expectations

## Test Completion Checklist

- [ ] All test procedures completed
- [ ] Issues documented and reported
- [ ] Verification screenshots taken (if required)
- [ ] Test results documented
- [ ] Sign-off obtained from stakeholder

---

**Test Date:** ___________
**Tester:** ___________
**Environment:** ___________
**Browser/Version:** ___________
**Overall Result:** [ ] Pass [ ] Fail [ ] Pass with Issues

**Notes:**
_Use this space to document any issues found or observations made during testing._