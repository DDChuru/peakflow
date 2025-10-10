# Customer & Company Configuration - Verification Checklist

**Implementation Plan Reference:** `customer-company-config-implementation-plan.md`
**Date:** 2025-10-08

---

## Pre-Implementation Checklist

- [ ] Review and approve implementation plan
- [ ] Confirm all requirements with stakeholder
- [ ] Verify no conflicting changes in main branch
- [ ] Backup current database (if needed)
- [ ] Create feature branch: `feature/customer-company-config`

---

## Phase 1: Type Definitions & Schema

### Company Types (`/src/types/auth.ts`)
- [ ] `SupportedCurrency` type exported with 5 currencies
- [ ] `Company.defaultCurrency` field added (type: `SupportedCurrency`)
- [ ] `Company.vatPercentage` field added (type: `number`)
- [ ] `Company.allowedCurrencies` optional field added
- [ ] No TypeScript compilation errors
- [ ] Type definitions exported correctly

### Financial Types (`/src/types/financial.ts`)
- [ ] `ContactPerson` interface defined with required fields
- [ ] `FinancialContact` interface defined with id, isActive, createdAt
- [ ] `Debtor.primaryContact` optional field added
- [ ] `Debtor.financialContacts` array field added
- [ ] `Creditor.primaryContact` optional field added
- [ ] `Creditor.financialContacts` array field added
- [ ] Old `email` and `phone` fields marked as deprecated (commented)
- [ ] No TypeScript compilation errors

### Verification Commands:
```bash
npm run build
# Should complete without type errors
```

**Pass Criteria:**
- ✅ No TypeScript errors
- ✅ All new types exported
- ✅ Backward compatible (old fields still exist)

---

## Phase 2: Service Layer Updates

### Companies Service (`/src/lib/firebase/companies-service.ts`)

#### Create Company Method:
- [ ] `defaultCurrency` field included in create with default 'USD'
- [ ] `vatPercentage` field included in create with default 0
- [ ] `allowedCurrencies` optional field handled correctly
- [ ] Firestore document created with new fields
- [ ] Test: Create company with USD and 15% VAT
- [ ] Test: Create company without currency (uses default)

#### Get Company Method:
- [ ] Returns `defaultCurrency` with fallback to 'USD'
- [ ] Returns `vatPercentage` with fallback to 0
- [ ] Old records without fields work correctly
- [ ] Test: Fetch existing company (should have defaults)
- [ ] Test: Fetch new company (should have explicit values)

#### Update Company Method:
- [ ] Can update `defaultCurrency`
- [ ] Can update `vatPercentage`
- [ ] Can update `allowedCurrencies`
- [ ] Test: Update company currency from USD to ZAR
- [ ] Test: Update VAT from 0% to 15%

**Verification Commands:**
```bash
# In Firebase Console or test script
# 1. Create new company with currency
# 2. Verify fields in Firestore
# 3. Fetch company and check defaults
```

### Debtor Service (`/src/lib/firebase/debtor-service.ts`)

#### Create Debtor Method:
- [ ] `financialContacts` defaults to empty array `[]`
- [ ] `primaryContact` optional field saved correctly
- [ ] Test: Create debtor with primary contact
- [ ] Test: Create debtor without contacts (backward compatible)

#### Financial Contact Management Methods:
- [ ] `addFinancialContact()` method exists
  - [ ] Generates UUID for new contact
  - [ ] Sets `isActive: true` by default
  - [ ] Sets `createdAt` timestamp
  - [ ] Appends to `financialContacts` array
  - [ ] Updates Firestore document
  - [ ] Test: Add contact with all fields
  - [ ] Test: Add contact with only required fields

- [ ] `updateFinancialContact()` method exists
  - [ ] Finds contact by ID
  - [ ] Updates only specified fields
  - [ ] Preserves unchanged fields
  - [ ] Test: Update contact name
  - [ ] Test: Update contact email
  - [ ] Test: Update contact position

- [ ] `removeFinancialContact()` method exists
  - [ ] Filters out contact by ID
  - [ ] Updates Firestore document
  - [ ] Test: Remove middle contact from list
  - [ ] Test: Remove last contact
  - [ ] Test: Error handling for non-existent contact

- [ ] `getFinancialContactEmails()` method exists
  - [ ] Returns only active contacts
  - [ ] Returns only contacts with email
  - [ ] Returns array of email strings
  - [ ] Test: Get emails with 3 active contacts
  - [ ] Test: Get emails with 1 inactive contact (excluded)
  - [ ] Test: Empty array when no contacts

#### Data Integrity:
- [ ] Contact IDs are unique (UUID v4)
- [ ] Array operations are atomic
- [ ] No duplicate contacts created
- [ ] Inactive contacts preserved in array

**Verification Commands:**
```bash
# Test script or Firebase Console
# 1. Create debtor
# 2. Add 3 financial contacts
# 3. Update 1 contact
# 4. Deactivate 1 contact
# 5. Verify getFinancialContactEmails returns 2 emails
# 6. Remove 1 contact
# 7. Verify array has 2 contacts remaining
```

### Creditor Service (`/src/lib/firebase/creditor-service.ts`)
- [ ] Same methods as DebtorService implemented
- [ ] All tests pass for creditor contacts

**Pass Criteria:**
- ✅ All service methods work correctly
- ✅ Firestore documents updated properly
- ✅ No data corruption
- ✅ Backward compatibility maintained
- ✅ Error handling works

---

## Phase 3: UI Components

### Company Edit Page (`/app/companies/[id]/edit/page.tsx`)

#### Currency Field:
- [ ] Currency dropdown visible in form
- [ ] Shows all 5 supported currencies
  - [ ] USD (US Dollar)
  - [ ] ZAR (South African Rand)
  - [ ] EUR (Euro)
  - [ ] ZWD (Zimbabwe Dollar)
  - [ ] ZIG (Zimbabwe Gold)
- [ ] Default value loads from company data
- [ ] Fallback to 'USD' for old companies
- [ ] Validation error shows for invalid selection
- [ ] Field marked as required (*)

#### VAT Percentage Field:
- [ ] Number input field visible
- [ ] Accepts decimal values (e.g., 15.5)
- [ ] Min value: 0
- [ ] Max value: 100
- [ ] Validation error shows for out-of-range values
- [ ] Default value loads from company data
- [ ] Fallback to 0 for old companies
- [ ] Field marked as required (*)
- [ ] Helper text shown (e.g., "Enter percentage")

#### Form Submission:
- [ ] Currency value saves to Firestore
- [ ] VAT percentage value saves to Firestore
- [ ] Success toast shows after update
- [ ] Page redirects or reloads after save
- [ ] Error toast shows on failure

**Manual Test Steps:**
1. Navigate to existing company edit page
2. Verify currency dropdown shows current value or USD
3. Verify VAT field shows current value or 0
4. Change currency to ZAR
5. Change VAT to 15
6. Submit form
7. Verify Firestore document updated
8. Reload page - verify values persisted

### Primary Contact Form Component (`/src/components/financial/PrimaryContactForm.tsx`)

#### Component Rendering:
- [ ] Card layout with title "Primary Contact Person"
- [ ] Description text shown
- [ ] Name field (required)
- [ ] Email field (required)
- [ ] Phone field (optional)
- [ ] Position field (optional)
- [ ] Fields arranged in 2-column grid

#### Component Functionality:
- [ ] `value` prop sets initial field values
- [ ] `onChange` prop called when fields change
- [ ] Email validation shows error for invalid format
- [ ] Required field validation works
- [ ] Test: Empty form shows placeholder text
- [ ] Test: Pre-filled form shows existing values
- [ ] Test: Typing updates form state
- [ ] Test: Validation errors display correctly

### Financial Contacts Manager Component (`/src/components/financial/FinancialContactsManager.tsx`)

#### Component Rendering:
- [ ] Card layout with title "Financial Department Contacts"
- [ ] Description about mailing list shown
- [ ] Empty state message when no contacts
- [ ] "Add Financial Contact" button visible
- [ ] Contact list shows all contacts

#### Contact List Display:
- [ ] Each contact shows name and position
- [ ] Email displayed with mail icon and clickable link
- [ ] Phone displayed if available
- [ ] Active contacts have normal styling
- [ ] Inactive contacts have grayed out styling
- [ ] Deactivate/Activate button visible
- [ ] Remove button (trash icon) visible
- [ ] Test: Display 3 contacts (1 inactive)

#### Add Contact Flow:
- [ ] Click "Add Financial Contact" opens form
- [ ] Form shows in blue-highlighted section
- [ ] Name field (required)
- [ ] Position field (required)
- [ ] Email field (required)
- [ ] Phone field (optional)
- [ ] "Add Contact" button enabled when form valid
- [ ] "Cancel" button closes form without adding
- [ ] Test: Add contact with all fields
- [ ] Test: Add contact without phone (optional field)
- [ ] Test: Cancel adding contact
- [ ] Test: Form validation prevents empty required fields

#### Edit/Remove Flow:
- [ ] Deactivate button toggles contact active state
- [ ] Inactive contact styling changes immediately
- [ ] Remove button deletes contact from list
- [ ] Test: Deactivate contact
- [ ] Test: Reactivate contact
- [ ] Test: Remove contact (confirm it disappears)

#### Read-Only Mode:
- [ ] `readOnly` prop hides edit buttons
- [ ] Contacts displayed but not editable
- [ ] Test: Component in readOnly mode

### Debtor Create/Edit Pages

#### Debtor New Page (`/app/companies/[id]/debtors/new/page.tsx`):
- [ ] Primary Contact Form integrated
- [ ] Financial Contacts Manager integrated
- [ ] Forms appear after basic debtor fields
- [ ] Primary contact data saved with debtor
- [ ] Financial contacts array saved with debtor
- [ ] Test: Create debtor with primary contact only
- [ ] Test: Create debtor with primary + 2 financial contacts
- [ ] Test: Create debtor without any contacts (backward compatible)

#### Debtor Edit Page (if exists):
- [ ] Primary Contact Form pre-filled with existing data
- [ ] Financial Contacts Manager shows existing contacts
- [ ] Can update primary contact
- [ ] Can add/edit/remove financial contacts
- [ ] Changes persist to Firestore
- [ ] Test: Edit existing debtor contact info

#### Debtor List Page (`/app/companies/[id]/debtors/page.tsx`):
- [ ] Primary contact email shown in list (if available)
- [ ] Contact info visible in detail view
- [ ] No layout breaking with new fields
- [ ] Test: List page displays correctly with old and new debtors

### Creditor Pages:
- [ ] Same integration as debtor pages
- [ ] All tests pass

**Manual Test Flow (Complete User Journey):**

1. **Create New Company:**
   - Navigate to `/companies/new`
   - Fill company name and industry
   - Select currency: ZAR
   - Enter VAT: 15
   - Submit
   - Verify company created in Firestore

2. **Edit Existing Company:**
   - Navigate to `/companies/[id]/edit`
   - Change currency from USD to EUR
   - Change VAT from 0 to 20
   - Submit
   - Reload page - verify changes persisted

3. **Create Debtor with Contacts:**
   - Navigate to `/companies/[id]/debtors/new`
   - Fill debtor name, etc.
   - Add primary contact:
     - Name: "John Doe"
     - Email: "john@example.com"
     - Phone: "+1234567890"
     - Position: "CFO"
   - Add financial contact 1:
     - Name: "Jane Smith"
     - Email: "jane@example.com"
     - Position: "Financial Director"
   - Add financial contact 2:
     - Name: "Bob Wilson"
     - Email: "bob@example.com"
     - Position: "Accounts Receivable"
   - Submit
   - Verify debtor created with all contacts

4. **Edit Debtor Contacts:**
   - Open existing debtor
   - Update primary contact email
   - Deactivate financial contact 1
   - Remove financial contact 2
   - Add new financial contact
   - Submit
   - Verify changes in Firestore

5. **Verify Mailing List:**
   - Call `getFinancialContactEmails()` for debtor
   - Verify only active contacts returned
   - Verify email array correct

**Pass Criteria:**
- ✅ All UI components render correctly
- ✅ Form validations work
- ✅ Data saves to Firestore
- ✅ Data loads from Firestore
- ✅ No console errors
- ✅ Responsive design works on mobile
- ✅ Loading states shown during async operations
- ✅ Success/error toasts displayed appropriately

---

## Phase 4: Validation & Error Handling

### Company Validation (`/src/lib/validation/company-validation.ts`)

#### Schema Validation:
- [ ] `companyCurrencySchema` defined
- [ ] Validates `defaultCurrency` against enum
- [ ] Validates `vatPercentage` range (0-100)
- [ ] Validates optional `allowedCurrencies` array
- [ ] Test: Valid company data passes
- [ ] Test: Invalid currency rejected
- [ ] Test: VAT -1 rejected
- [ ] Test: VAT 101 rejected

#### Helper Functions:
- [ ] `validateCurrency()` returns true for valid currencies
- [ ] `validateCurrency()` returns false for invalid currencies
- [ ] `validateVATPercentage()` validates range
- [ ] Test: validateCurrency('USD') === true
- [ ] Test: validateCurrency('INVALID') === false
- [ ] Test: validateVATPercentage(15) === true
- [ ] Test: validateVATPercentage(-1) === false

### Contact Validation (`/src/lib/validation/contact-validation.ts`)

#### Contact Person Schema:
- [ ] `contactPersonSchema` defined
- [ ] Validates name (min 2 chars)
- [ ] Validates email format
- [ ] Phone optional
- [ ] Position optional
- [ ] Test: Valid contact passes
- [ ] Test: Empty name rejected
- [ ] Test: Invalid email rejected

#### Financial Contact Schema:
- [ ] `financialContactSchema` defined
- [ ] Validates UUID format for id
- [ ] Validates required fields
- [ ] Validates email format
- [ ] Validates position required
- [ ] Validates isActive boolean
- [ ] Validates createdAt date
- [ ] Test: Valid contact passes
- [ ] Test: Empty position rejected

#### Validation Function:
- [ ] `validateFinancialContacts()` validates array
- [ ] Returns true for valid array
- [ ] Returns false for invalid array
- [ ] Test: Array of valid contacts passes
- [ ] Test: Array with invalid email rejected

### Error Handling:

#### Service Layer Errors:
- [ ] Try-catch blocks in all service methods
- [ ] Meaningful error messages thrown
- [ ] Errors logged to console
- [ ] Test: Create company with missing currency (should use default)
- [ ] Test: Add contact without email (should throw error)
- [ ] Test: Update non-existent contact (should throw error)

#### UI Error Display:
- [ ] Form validation errors show inline
- [ ] API errors show in toast notifications
- [ ] Network errors handled gracefully
- [ ] Test: Submit form with invalid email
- [ ] Test: Simulate network error during save

**Pass Criteria:**
- ✅ All validation schemas work correctly
- ✅ Invalid data rejected
- ✅ Valid data accepted
- ✅ Error messages clear and helpful
- ✅ No unhandled exceptions

---

## Phase 5: Bank Account UI Audit

### Find Bank Account Pages:
- [ ] Located bank account management pages
- [ ] Documented page locations

### Currency Field Audit:
- [ ] Currency field visible in create form
- [ ] Currency field visible in edit form
- [ ] Currency dropdown shows supported currencies
- [ ] Currency validation prevents invalid values
- [ ] Test: Create bank account with USD
- [ ] Test: Create bank account with ZAR
- [ ] Test: Edit bank account currency

### Bank Account List View:
- [ ] Currency displayed in account list
- [ ] Multi-currency accounts display correctly
- [ ] Filtering by currency works (if applicable)
- [ ] Test: View list with accounts in different currencies

### GL Account Integration:
- [ ] Bank account links to GL account
- [ ] Currency compatibility checked
- [ ] Test: Link bank account to correct GL account

### Validation:
- [ ] Currency required when creating account
- [ ] Cannot save without currency
- [ ] Currency matches company allowed currencies (if enforced)
- [ ] Test: Validation prevents empty currency

**Pass Criteria:**
- ✅ Bank account currency fully functional
- ✅ No UI issues with currency display
- ✅ CRUD operations work correctly
- ✅ No regression in existing functionality

---

## Cross-Cutting Concerns

### Backward Compatibility:
- [ ] Existing companies without currency work (default to USD)
- [ ] Existing companies without VAT work (default to 0%)
- [ ] Existing debtors without contacts work
- [ ] Old bank accounts with currency work
- [ ] No data loss for existing records
- [ ] Test: Fetch old company record
- [ ] Test: Edit old company and save
- [ ] Test: Display old debtor in UI
- [ ] Test: Edit old debtor and save

### Performance:
- [ ] Company queries not slower
- [ ] Debtor queries not slower
- [ ] Contact array size limited (suggest max 10)
- [ ] No N+1 query problems
- [ ] Test: Load company list (check query count)
- [ ] Test: Load debtor with 5 contacts (check load time)

### Security:
- [ ] Company settings require admin/financial_admin role
- [ ] Contact editing requires appropriate permissions
- [ ] Email addresses not exposed inappropriately
- [ ] Firestore rules updated (if needed)
- [ ] Test: Non-admin cannot edit company currency
- [ ] Test: Regular user can view contacts
- [ ] Test: Unauthorized access properly denied

### Data Integrity:
- [ ] Contact emails unique within debtor (if enforced)
- [ ] Contact IDs unique (UUID guaranteed)
- [ ] VAT percentage within valid range
- [ ] Currency from allowed list only
- [ ] No orphaned contacts
- [ ] Test: Cannot add duplicate contact email
- [ ] Test: Contact removal doesn't corrupt array
- [ ] Test: Currency change doesn't break existing data

---

## Regression Testing

### Existing Features:
- [ ] Company creation still works
- [ ] Company editing still works
- [ ] Company deletion still works
- [ ] Debtor creation still works
- [ ] Debtor editing still works
- [ ] Debtor listing still works
- [ ] Bank account creation still works
- [ ] Bank account editing still works
- [ ] Transaction currency handling still works
- [ ] Invoice generation still works

### Integration Points:
- [ ] Industry template application works
- [ ] Chart of accounts reset works
- [ ] Bank statement import works
- [ ] Transaction reconciliation works
- [ ] Payment recording works

**Test Suite:**
```bash
# Run existing tests
npm run test

# Expected: All tests pass
```

---

## User Acceptance Testing (UAT)

### Scenario 1: New Company Setup
**Steps:**
1. Admin creates new company
2. Sets default currency to ZAR
3. Sets VAT to 15%
4. Creates first customer/debtor
5. Adds primary contact
6. Adds 2 financial contacts
7. Creates invoice
8. Verifies financial contacts receive invoice

**Expected:**
- Company saved with ZAR and 15% VAT
- Customer has primary contact and financial contacts
- Invoice uses correct currency and VAT
- All financial contacts receive invoice email

### Scenario 2: Existing Company Update
**Steps:**
1. Open existing company (pre-feature)
2. Edit company settings
3. Add default currency EUR
4. Add VAT 20%
5. Save changes
6. Open existing customer
7. Add primary contact
8. Add financial contact
9. Generate invoice

**Expected:**
- Old company data preserved
- New fields added successfully
- Customer contacts saved correctly
- Invoice reflects new settings

### Scenario 3: Multi-Currency Operations
**Steps:**
1. Company default currency: USD
2. Create bank account: ZAR
3. Create bank account: EUR
4. Create customer with contacts
5. Record transaction in ZAR
6. Verify currency handling

**Expected:**
- Both bank accounts saved with correct currencies
- Transactions respect bank account currency
- No currency conversion errors
- All amounts display correctly

### Scenario 4: Contact Management
**Steps:**
1. Create customer with 3 financial contacts
2. Deactivate 1 contact
3. Remove 1 contact
4. Add new contact
5. Export contact mailing list
6. Verify only active contacts included

**Expected:**
- Contact list accurate after changes
- Inactive contact not in mailing list
- Removed contact permanently gone
- New contact appears in list

---

## Production Deployment Checklist

### Pre-Deployment:
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Firestore rules updated (if needed)
- [ ] Firestore indexes created (if needed)
- [ ] Environment variables set (if needed)
- [ ] Backup database taken

### Deployment:
- [ ] Merge to main branch
- [ ] Deploy to staging environment
- [ ] Run smoke tests on staging
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Verify no breaking changes

### Post-Deployment:
- [ ] Verify company creation works
- [ ] Verify company editing works
- [ ] Verify customer contact management works
- [ ] Verify bank account operations work
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Update changelog
- [ ] Notify stakeholders

---

## Known Issues / Limitations

Document any known issues or limitations discovered during testing:

1. **Contact Array Size**: No hard limit enforced (suggest max 10)
2. **Currency Change Impact**: Changing company currency doesn't auto-convert existing transactions
3. **Email Validation**: Basic format check only, no verification emails sent
4. **Contact Deduplication**: No automatic deduplication of contacts by email
5. **Migration**: Old email/phone fields remain on debtor (not migrated to primaryContact)

---

## Success Metrics

### Functional Metrics:
- [ ] 100% of companies can set default currency
- [ ] 100% of companies can set VAT percentage
- [ ] Users can add primary contacts to customers
- [ ] Users can manage financial contacts (add/edit/remove)
- [ ] Financial contact emails retrievable for mailing lists
- [ ] Bank accounts support all 5 currencies
- [ ] No data corruption or loss

### Quality Metrics:
- [ ] Zero critical bugs
- [ ] Zero data loss incidents
- [ ] Page load times unchanged
- [ ] No TypeScript errors
- [ ] No console errors in production
- [ ] 100% backward compatibility

### User Experience Metrics:
- [ ] Users can complete tasks without errors
- [ ] Forms intuitive and easy to use
- [ ] Validation messages clear
- [ ] No training required for basic operations

---

## Sign-Off

### Completed By:
- [ ] Developer: _______________
- [ ] QA Tester: _______________
- [ ] Product Owner: _______________

### Approval Date: _______________

### Notes:
_Add any additional notes or observations here_

---

**Checklist Version:** 1.0
**Last Updated:** 2025-10-08
**Status:** Ready for Implementation
