# Phase 4 UI Components - Smoke Test Guide

**Date:** 2025-10-08
**Phase:** Customer/Company Configuration - UI Components
**Status:** ✅ Complete

## Overview

Phase 4 implemented reusable UI components for managing company configuration and customer contacts. All components follow established patterns and integrate with the validation schemas and service layer from previous phases.

## Components Created

### 1. CompanyConfigForm
**Location:** `/src/components/company/CompanyConfigForm.tsx`

**Purpose:** Manage company currency and VAT settings

**Features:**
- Currency dropdown with 5 supported currencies (USD, ZAR, EUR, ZWD, ZIG)
- VAT percentage input with validation (0-100%)
- Real-time form validation with Zod
- Loading states during submission
- Toast notifications for success/error
- Integrates with `companiesService.updateCompanyConfig()`

**Props:**
- `companyId` - Company ID to update
- `initialCurrency` - Default currency (optional, defaults to 'ZAR')
- `initialVatPercentage` - Default VAT % (optional, defaults to 15)
- `onSuccess` - Callback after successful save

**Usage:**
```tsx
import { CompanyConfigForm } from '@/components/company';

<CompanyConfigForm
  companyId={companyId}
  initialCurrency="ZAR"
  initialVatPercentage={15}
  onSuccess={() => console.log('Config updated')}
/>
```

---

### 2. PrimaryContactForm
**Location:** `/src/components/contacts/PrimaryContactForm.tsx`

**Purpose:** Manage primary contact information for a customer

**Features:**
- Simple form with name (required), email, phone, position
- Inline editing mode with display/edit toggle
- Card layout or inline layout options
- Form validation with `primaryContactSchema`
- Edit/Cancel/Save workflow
- Integrates with `debtorService.updatePrimaryContact()`

**Props:**
- `companyId` - Company ID
- `debtorId` - Customer/debtor ID
- `initialData` - Existing contact data (optional)
- `onSuccess` - Callback after successful save
- `inline` - Use inline layout instead of Card (default: false)

**Usage:**
```tsx
import { PrimaryContactForm } from '@/components/contacts';

// Card layout
<PrimaryContactForm
  companyId={companyId}
  debtorId={debtorId}
  initialData={primaryContact}
  onSuccess={loadData}
/>

// Inline layout with edit toggle
<PrimaryContactForm
  companyId={companyId}
  debtorId={debtorId}
  initialData={primaryContact}
  onSuccess={loadData}
  inline
/>
```

---

### 3. FinancialContactsManager
**Location:** `/src/components/contacts/FinancialContactsManager.tsx`

**Purpose:** Full CRUD interface for managing financial department contacts

**Features:**
- Table view of all financial contacts
- Add new contact dialog
- Edit contact dialog
- Delete confirmation dialog
- Toggle active/inactive status
- Set primary financial contact
- Mailing list preview showing active contact emails
- Empty state with add button
- Real-time updates after operations
- Integrates with all `debtorService` financial contact methods

**Props:**
- `companyId` - Company ID
- `debtorId` - Customer/debtor ID
- `onContactsChange` - Callback after any contact change

**Usage:**
```tsx
import { FinancialContactsManager } from '@/components/contacts';

<FinancialContactsManager
  companyId={companyId}
  debtorId={debtorId}
  onContactsChange={() => console.log('Contacts updated')}
/>
```

**Key UI Elements:**
- **Mailing List Banner:** Shows all active contact emails
- **Actions Dropdown:** Edit, Set as Primary, Activate/Deactivate, Delete
- **Status Badge:** Active (green) or Inactive (gray)
- **Primary Indicator:** Star icon for primary contact
- **Table Columns:** Name, Position, Email, Phone, Status, Actions

---

### 4. ContactListDisplay
**Location:** `/src/components/contacts/ContactListDisplay.tsx`

**Purpose:** Read-only display of all contacts for viewing purposes

**Features:**
- Shows primary contact information
- Shows financial contacts list with status badges
- Mailing list preview
- Primary contact star indicator
- Clean, compact layout
- No edit functionality (display only)
- Loading skeleton states

**Props:**
- `companyId` - Company ID
- `debtorId` - Customer/debtor ID
- `showTitle` - Show card title/description (default: true)

**Usage:**
```tsx
import { ContactListDisplay } from '@/components/contacts';

<ContactListDisplay
  companyId={companyId}
  debtorId={debtorId}
  showTitle={true}
/>
```

---

## Design Patterns Used

### Form Handling
All components follow the established pattern:
```tsx
const form = useForm<FormDataType>({
  resolver: zodResolver(validationSchema),
  defaultValues: { ... }
});

const onSubmit = async (data: FormDataType) => {
  setIsSubmitting(true);
  try {
    await service.method(companyId, data);
    toast.success('Success message');
    onSuccess?.();
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error message');
  } finally {
    setIsSubmitting(false);
  }
};
```

### Dialog Pattern
```tsx
<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>...</DialogTitle>
      <DialogDescription>...</DialogDescription>
    </DialogHeader>
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

### Loading States
```tsx
{loading ? (
  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
) : (
  <ActualContent />
)}
```

### Empty States
```tsx
{items.length === 0 ? (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3>No items found</h3>
    <p>Get started by adding...</p>
    <Button onClick={handleAdd}>Add Item</Button>
  </div>
) : (
  <ItemList />
)}
```

---

## Verification Checklist

### ✅ CompanyConfigForm
- [x] Component created with proper TypeScript types
- [x] Currency dropdown shows all 5 currencies with labels
- [x] VAT input validates 0-100 range
- [x] Form uses react-hook-form with zodResolver
- [x] Submit button shows loading state
- [x] Toast notifications on success/error
- [x] Integrates with companiesService
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] Follows established patterns

### ✅ PrimaryContactForm
- [x] Component created with proper TypeScript types
- [x] All fields (name, email, phone, position) working
- [x] Name field marked as required
- [x] Inline editing mode implemented
- [x] Display/edit toggle working
- [x] Card and inline layouts available
- [x] Form validation working
- [x] Integrates with debtorService
- [x] No TypeScript errors
- [x] No ESLint warnings

### ✅ FinancialContactsManager
- [x] Component created with proper TypeScript types
- [x] Table view displays all contacts
- [x] Add contact dialog working
- [x] Edit contact dialog working
- [x] Delete confirmation dialog working
- [x] Toggle active/inactive status
- [x] Set primary contact functionality
- [x] Mailing list preview shows active emails
- [x] Empty state with add button
- [x] All CRUD operations integrate with debtorService
- [x] Status badges (Active/Inactive)
- [x] Primary contact star indicator
- [x] No TypeScript errors
- [x] No ESLint warnings

### ✅ ContactListDisplay
- [x] Component created with proper TypeScript types
- [x] Displays primary contact info
- [x] Displays financial contacts list
- [x] Mailing list preview included
- [x] Primary contact star indicator
- [x] Read-only (no edit functionality)
- [x] Loading skeleton states
- [x] showTitle prop working
- [x] No TypeScript errors
- [x] No ESLint warnings

---

## Integration Points

### Validation Schemas Used
From `/src/lib/validation/`:
- `company-validation.ts`: `companyCurrencySchema`, `companyVatSchema`, `CURRENCY_LABELS`
- `contact-validation.ts`: `primaryContactSchema`, `financialContactSchema`

### Services Used
From `/src/lib/firebase/`:
- `companiesService.updateCompanyConfig()`
- `debtorService.updatePrimaryContact()`
- `debtorService.getPrimaryContact()`
- `debtorService.addFinancialContact()`
- `debtorService.updateFinancialContact()`
- `debtorService.removeFinancialContact()`
- `debtorService.getFinancialContacts()`
- `debtorService.setPrimaryFinancialContact()`

### UI Components Used
From `/src/components/ui/`:
- Button, Input, Label, Textarea
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- Card, CardContent, CardDescription, CardHeader, CardTitle
- Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
- AlertDialog and all related components
- DropdownMenu and all related components
- Badge

### Icons Used (lucide-react)
- DollarSign, Percent, User, Mail, Phone, Briefcase, Edit, X
- Plus, MoreHorizontal, Trash2, CheckCircle2, XCircle, Users, Star

---

## Quick Testing Guide

### Test CompanyConfigForm
1. Import and render with a valid companyId
2. Change currency dropdown - verify all 5 options available
3. Enter VAT percentage - try 0, 50, 100
4. Try invalid values - verify error messages
5. Submit form - verify toast notification
6. Check Firebase - verify data saved

### Test PrimaryContactForm
1. Render in card mode with no initial data
2. Fill out form with all fields
3. Submit - verify toast and callback
4. Render in inline mode with initial data
5. Verify display mode shows data
6. Click edit - verify form appears
7. Make changes and save
8. Click cancel - verify resets to original

### Test FinancialContactsManager
1. Render with empty contacts
2. Verify empty state shows
3. Click "Add Contact" - fill form and submit
4. Verify contact appears in table
5. Verify mailing list preview shows email
6. Click actions dropdown - test Edit
7. Test toggle active/inactive
8. Test set as primary (star appears)
9. Test delete with confirmation

### Test ContactListDisplay
1. Render with no contacts - verify "not set" messages
2. Add primary contact - verify displays
3. Add financial contacts - verify list shows
4. Verify mailing list preview
5. Verify primary star indicator
6. Verify no edit functionality (read-only)

---

## Common Issues to Check

### Forms Not Submitting
- Verify companyId and debtorId props are valid
- Check browser console for Firebase errors
- Verify user has proper permissions
- Check toast notifications for error messages

### Validation Errors
- Verify all required fields have values
- Check email format is valid
- Verify VAT percentage is 0-100
- Check position field is not empty for financial contacts

### UI Issues
- Loading states not showing: Check isSubmitting state
- Dialogs not closing: Verify onOpenChange handlers
- Icons not appearing: Check lucide-react imports
- Styles not applying: Verify Tailwind classes

### Data Not Loading
- Check debtorService methods are working
- Verify useEffect dependencies
- Check Firebase Firestore rules
- Verify document paths are correct

---

## Next Steps (Phase 5)

Now that UI components are complete, Phase 5 will:
1. Create customer detail page integrating these components
2. Create company settings page with CompanyConfigForm
3. Add email sending functionality
4. Implement end-to-end workflows
5. Add comprehensive testing

---

## Files Created

**Component Files:**
- `/src/components/company/CompanyConfigForm.tsx`
- `/src/components/company/index.ts`
- `/src/components/contacts/PrimaryContactForm.tsx`
- `/src/components/contacts/FinancialContactsManager.tsx`
- `/src/components/contacts/ContactListDisplay.tsx`
- `/src/components/contacts/index.ts`

**Documentation:**
- `/smoke-test-phase-4-ui-components.md` (this file)

**Total:** 7 files created

---

## Success Criteria - ALL MET ✅

- ✅ CompanyConfigForm component created
- ✅ PrimaryContactForm component created
- ✅ FinancialContactsManager component created
- ✅ ContactListDisplay component created
- ✅ All components use proper TypeScript types
- ✅ All forms have validation
- ✅ All components have loading states
- ✅ Toast notifications implemented
- ✅ Responsive design
- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ✅ Components follow existing app patterns
- ✅ Index files created for easy imports

**Phase 4 Status: COMPLETE** 🎉
