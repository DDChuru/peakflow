# Smoke Test Guide: Phase 5 - Customer/Company Configuration Integration

## Overview
This guide provides step-by-step verification procedures for the newly integrated customer/company configuration features including:
- Company currency and VAT settings
- Customer primary contacts
- Customer financial contacts
- Supplier primary contacts
- Supplier financial contacts

## Prerequisites
- Development server running (`npm run dev`)
- Valid user account with admin/developer role
- At least one company created in the system
- Browser DevTools open (F12) for Firebase/Network inspection

---

## Part 1: Company Configuration (Currency & VAT)

### Test Location
Navigate to: `/companies/[companyId]/edit`

### Step-by-Step Verification

#### 1.1 Visual Check
- [ ] Company Configuration card is visible below Company Information card
- [ ] Currency dropdown displays with label "Default Currency"
- [ ] VAT Percentage input displays with label "VAT Percentage"
- [ ] Save Configuration button is visible
- [ ] Card shows appropriate icons (DollarSign, Percent)

#### 1.2 Currency Dropdown Functionality
- [ ] Click currency dropdown
- [ ] Verify 5 currency options appear:
  - USD - United States Dollar
  - ZAR - South African Rand
  - EUR - Euro
  - ZWD - Zimbabwean Dollar
  - ZIG - Zimbabwean Gold
- [ ] Select "ZAR"
- [ ] Dropdown shows selected value

#### 1.3 VAT Percentage Functionality
- [ ] Enter "15" in VAT Percentage input
- [ ] Verify "%" symbol appears on right side of input
- [ ] Try entering "101" - should show validation error
- [ ] Try entering "-1" - should show validation error
- [ ] Enter valid value "15"

#### 1.4 Save and Persistence
- [ ] Click "Save Configuration"
- [ ] Success toast appears: "Company configuration updated successfully"
- [ ] Reload the page (F5)
- [ ] Verify currency shows "ZAR"
- [ ] Verify VAT shows "15"

#### 1.5 Firebase Verification
- [ ] Open DevTools > Network tab
- [ ] Click Save Configuration
- [ ] Check for Firebase update request
- [ ] In Firebase Console, verify company document has:
  ```json
  {
    "defaultCurrency": "ZAR",
    "vatPercentage": 15
  }
  ```

**Expected Result:** Company configuration saves successfully and persists across page reloads.

---

## Part 2: Customer Primary Contact (Create Flow)

### Test Location
Navigate to: `/workspace/[companyId]/customers`

### Step-by-Step Verification

#### 2.1 Create Customer Dialog - Primary Contact Section
- [ ] Click "Add Customer" button
- [ ] Dialog opens with customer form
- [ ] Scroll down to see "Primary Contact (Optional)" section
- [ ] Section is below "Notes" field and has border-top separator
- [ ] Four fields visible:
  - Contact Name
  - Position
  - Email
  - Phone

#### 2.2 Create Customer with Primary Contact
- [ ] Fill in customer basic info:
  - Name: "Acme Corporation"
  - Email: "billing@acme.com"
  - Payment Terms: 30
- [ ] Fill in Primary Contact:
  - Contact Name: "John Smith"
  - Position: "CFO"
  - Email: "john@acme.com"
  - Phone: "+27 11 123 4567"
- [ ] Click "Create Customer"
- [ ] Success toast appears: "Customer created successfully"
- [ ] Customer appears in customer list

#### 2.3 Verify Primary Contact Saved
- [ ] Find newly created customer in list
- [ ] Click on customer name to open View Details dialog
- [ ] Scroll to "Primary Contact" section (below customer details)
- [ ] Verify contact information displays:
  - Name: John Smith
  - Position: CFO
  - Email: john@acme.com
  - Phone: +27 11 123 4567

#### 2.4 Create Customer WITHOUT Primary Contact
- [ ] Click "Add Customer"
- [ ] Fill in basic customer info only (skip primary contact)
- [ ] Click "Create Customer"
- [ ] Verify customer creates successfully
- [ ] View customer details
- [ ] Primary contact section shows edit form (not display mode)

**Expected Result:** Primary contact can be optionally added during customer creation and displays correctly in customer details.

---

## Part 3: Customer Primary Contact (Edit Flow)

### Test Location
Customer View/Details Dialog

### Step-by-Step Verification

#### 3.1 Edit Existing Primary Contact
- [ ] Open customer with existing primary contact
- [ ] In Primary Contact section, click Edit button (pencil icon)
- [ ] Form appears with editable fields
- [ ] Change name to "Jane Smith"
- [ ] Change position to "CEO"
- [ ] Click "Save Contact"
- [ ] Success toast appears
- [ ] Contact switches back to display mode
- [ ] Verify changes show: Jane Smith, CEO

#### 3.2 Add Primary Contact to Customer Without One
- [ ] Open customer without primary contact
- [ ] Fill in Primary Contact form:
  - Name: "Bob Johnson"
  - Email: "bob@customer.com"
  - Position: "Manager"
- [ ] Click "Save Contact"
- [ ] Success toast appears
- [ ] Form switches to display mode
- [ ] Edit button appears

#### 3.3 Cancel Edit
- [ ] Click Edit on existing contact
- [ ] Change name to something different
- [ ] Click "Cancel" button
- [ ] Form switches to display mode
- [ ] Verify original values are still shown (not changed values)

**Expected Result:** Primary contact can be edited inline with changes persisting and cancel reverting changes.

---

## Part 4: Customer Financial Contacts

### Test Location
Customer View/Details Dialog

### Step-by-Step Verification

#### 4.1 Add First Financial Contact
- [ ] Open customer details dialog
- [ ] Scroll to "Financial Contacts" section
- [ ] If no contacts exist, empty state shows:
  - Users icon
  - "No financial contacts" message
  - "Add First Contact" button
- [ ] Click "Add Contact" (or "Add First Contact")
- [ ] Dialog opens with form fields:
  - Name (required)
  - Email (required)
  - Phone (optional)
  - Position (required)
- [ ] Fill in:
  - Name: "Sarah Williams"
  - Email: "sarah@customer.com"
  - Phone: "+27 11 234 5678"
  - Position: "Accountant"
- [ ] Click "Add Contact"
- [ ] Success toast appears
- [ ] Dialog closes
- [ ] Contact appears in table

#### 4.2 Verify Mailing List Preview
- [ ] Above contacts table, blue box appears with:
  - "Mailing List (1 active)"
  - Email address: sarah@customer.com
- [ ] Verify email is shown in preview

#### 4.3 Add Second Financial Contact
- [ ] Click "Add Contact" button
- [ ] Fill in different contact:
  - Name: "Mike Davis"
  - Email: "mike@customer.com"
  - Position: "Finance Manager"
- [ ] Save contact
- [ ] Verify both contacts appear in table
- [ ] Mailing list shows: "Mailing List (2 active)"
- [ ] Emails shown: sarah@customer.com, mike@customer.com

#### 4.4 Edit Financial Contact
- [ ] Click three-dot menu on Sarah's contact
- [ ] Click "Edit"
- [ ] Change position to "Senior Accountant"
- [ ] Click "Save Changes"
- [ ] Verify position updates in table

#### 4.5 Set Primary Financial Contact
- [ ] Click three-dot menu on Mike's contact
- [ ] Click "Set as Primary"
- [ ] Success toast appears
- [ ] Yellow star icon appears next to Mike's name
- [ ] "Set as Primary" option no longer available for Mike
- [ ] Sarah can still be set as primary

#### 4.6 Deactivate Contact
- [ ] Click three-dot menu on Sarah's contact
- [ ] Click "Deactivate"
- [ ] Success toast appears
- [ ] Badge changes from green "Active" to gray "Inactive"
- [ ] Mailing list updates: "Mailing List (1 active)"
- [ ] Only Mike's email shows in preview
- [ ] Click menu again, option says "Activate"

#### 4.7 Reactivate Contact
- [ ] Click "Activate" from menu
- [ ] Badge changes back to green "Active"
- [ ] Mailing list: "Mailing List (2 active)"
- [ ] Both emails show again

#### 4.8 Delete Financial Contact
- [ ] Click three-dot menu on Sarah's contact
- [ ] Click "Delete"
- [ ] Confirmation dialog appears
- [ ] Shows: "Are you sure you want to delete Sarah Williams?"
- [ ] Click "Delete Contact"
- [ ] Success toast appears
- [ ] Contact removed from table
- [ ] Mailing list: "Mailing List (1 active)"
- [ ] Only Mike's email shown

**Expected Result:** Financial contacts can be added, edited, activated/deactivated, set as primary, and deleted with mailing list updating accordingly.

---

## Part 5: Supplier Primary Contact (Create Flow)

### Test Location
Navigate to: `/workspace/[companyId]/suppliers`

### Step-by-Step Verification

#### 5.1 Create Supplier Dialog - Primary Contact Section
- [ ] Click "Add Supplier" button
- [ ] Dialog opens with supplier form
- [ ] Scroll down past "Notes" section
- [ ] "Primary Contact (Optional)" section visible
- [ ] Four fields present:
  - Contact Name
  - Position
  - Email
  - Phone

#### 5.2 Create Supplier with Primary Contact
- [ ] Fill in supplier basic info:
  - Supplier Name: "Office Supplies Ltd"
  - Category: "Office Supplies"
  - Email: "orders@officesupplies.com"
  - Payment Terms: 30
- [ ] Fill in Primary Contact:
  - Contact Name: "Alice Cooper"
  - Position: "Account Manager"
  - Email: "alice@officesupplies.com"
  - Phone: "+27 11 987 6543"
- [ ] Click "Create Supplier"
- [ ] Success toast appears
- [ ] Supplier appears in list

#### 5.3 Verify Primary Contact Saved
- [ ] Find newly created supplier
- [ ] Click on supplier row to open edit (or use View Details)
- [ ] Scroll to Primary Contact section
- [ ] Verify contact displays:
  - Alice Cooper
  - Account Manager
  - alice@officesupplies.com
  - +27 11 987 6543

**Expected Result:** Supplier primary contact integration works identically to customer primary contact.

---

## Part 6: Supplier Financial Contacts

### Test Location
Supplier View/Details Dialog

### Step-by-Step Verification

#### 6.1 Add Financial Contact to Supplier
- [ ] Open supplier details dialog
- [ ] Scroll to "Financial Contacts" section
- [ ] Click "Add Contact"
- [ ] Fill in:
  - Name: "Robert Taylor"
  - Email: "robert@officesupplies.com"
  - Position: "Billing Coordinator"
- [ ] Click "Add Contact"
- [ ] Success toast appears
- [ ] Contact appears in table

#### 6.2 Verify Supplier Mailing List
- [ ] Mailing list preview shows: "Mailing List (1 active)"
- [ ] Email shows: robert@officesupplies.com

#### 6.3 Test All Contact Operations
- [ ] Add second contact
- [ ] Set one as primary (star icon appears)
- [ ] Deactivate a contact
- [ ] Verify mailing list updates
- [ ] Reactivate contact
- [ ] Edit contact
- [ ] Delete contact

**Expected Result:** Supplier financial contacts work identically to customer financial contacts.

---

## Common Issues to Check

### Issue 1: Data Not Persisting
**Symptom:** Changes save but disappear on reload
**Check:**
- [ ] Open browser DevTools > Network tab
- [ ] Look for successful Firebase update calls
- [ ] Check Firebase Console for updated documents
- [ ] Verify no console errors

### Issue 2: Toast Notifications Not Appearing
**Symptom:** Actions complete but no feedback
**Check:**
- [ ] Look for toast container in DOM
- [ ] Check console for errors
- [ ] Verify react-hot-toast is installed

### Issue 3: Validation Errors Not Showing
**Symptom:** Invalid data doesn't show error messages
**Check:**
- [ ] Try submitting empty required fields
- [ ] Try invalid email format
- [ ] Try VAT > 100
- [ ] Error messages should appear in red below fields

### Issue 4: Components Not Rendering
**Symptom:** Sections missing or blank
**Check:**
- [ ] Check browser console for errors
- [ ] Verify component imports are correct
- [ ] Check that companyId/debtorId/creditorId props are valid

---

## Quick Verification Checklist

### Company Edit Page
- [ ] Currency dropdown with 5 options
- [ ] VAT input with % symbol
- [ ] Save button works
- [ ] Values persist after reload

### Customer Create
- [ ] Primary contact section visible
- [ ] Can create customer with contact
- [ ] Can create customer without contact
- [ ] Contact data saves correctly

### Customer Details
- [ ] Primary contact displays correctly
- [ ] Can edit primary contact inline
- [ ] Can add/edit/delete financial contacts
- [ ] Mailing list updates properly
- [ ] Set primary financial contact works
- [ ] Activate/deactivate works

### Supplier Create
- [ ] Primary contact section visible
- [ ] Can create supplier with contact
- [ ] Contact data saves correctly

### Supplier Details
- [ ] Primary contact displays correctly
- [ ] Can edit primary contact inline
- [ ] Can manage financial contacts
- [ ] All contact operations work

---

## Integration Points

### Firebase Structure Verification

**Company Document:**
```
companies/[companyId]
├── defaultCurrency: "ZAR"
├── vatPercentage: 15
└── ... (other company fields)
```

**Customer/Debtor Document:**
```
companies/[companyId]/debtors/[debtorId]
├── primaryContact: {
│   name: string,
│   email?: string,
│   phone?: string,
│   position?: string
│ }
└── financialContacts: [
    {
      id: string,
      name: string,
      email: string,
      phone?: string,
      position: string,
      isActive: boolean,
      isPrimary: boolean,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
```

**Supplier/Creditor Document:**
```
companies/[companyId]/creditors/[creditorId]
├── primaryContact: {
│   name: string,
│   email?: string,
│   phone?: string,
│   position?: string
│ }
└── financialContacts: [
    {
      id: string,
      name: string,
      email: string,
      phone?: string,
      position: string,
      isActive: boolean,
      isPrimary: boolean,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  ]
```

---

## Success Criteria

All features are working correctly if:
- ✅ Company configuration saves and persists
- ✅ Primary contacts save during customer/supplier creation
- ✅ Primary contacts can be edited inline
- ✅ Financial contacts can be added, edited, deleted
- ✅ Mailing list updates automatically based on active contacts
- ✅ Primary financial contact can be set (star icon)
- ✅ Contacts can be activated/deactivated
- ✅ All toast notifications appear
- ✅ All validation works correctly
- ✅ Data persists across page reloads
- ✅ Firebase documents structure matches expected schema

---

## Demo Walkthrough

### For showing the features to stakeholders:

1. **Start with Company Settings**
   - Navigate to company edit page
   - Show currency dropdown and VAT input
   - Save configuration
   - Demonstrate persistence

2. **Customer with Contacts**
   - Create new customer with primary contact
   - View customer to show contact display
   - Edit primary contact inline
   - Add financial contacts
   - Show mailing list preview
   - Demonstrate set primary, activate/deactivate

3. **Supplier Mirror**
   - Create supplier with primary contact
   - Show that all contact management works identically

4. **Highlight Key Features**
   - Mailing list auto-generation
   - Active/inactive status management
   - Primary contact designation
   - Inline editing of primary contact
   - Validation and error handling

---

## Environment Setup Required

Before testing, ensure:
- [ ] Firebase configuration is correct
- [ ] User has appropriate permissions (admin/developer role)
- [ ] At least one company exists
- [ ] Development server is running on correct port
- [ ] Browser cache cleared if testing persistence

---

## Timing

- Company Configuration: ~2 minutes
- Customer Primary Contact: ~3 minutes
- Customer Financial Contacts: ~5 minutes
- Supplier Primary Contact: ~2 minutes
- Supplier Financial Contacts: ~3 minutes

**Total Test Time:** ~15 minutes for complete verification

---

## Next Steps After Successful Testing

1. Update progress in `/project-management/modernization-roadmap.md`
2. Document any bugs found
3. Create tickets for any improvements
4. Update user documentation if needed
5. Prepare for production deployment

---

**Test Conducted By:** _________________
**Date:** _________________
**Result:** ☐ Pass  ☐ Fail
**Notes:** _________________
