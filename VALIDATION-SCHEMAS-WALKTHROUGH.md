# Validation Schemas Implementation Walkthrough

## What Was Implemented

**Phase 2** of the customer/company configuration feature adds robust validation schemas for all company and contact forms.

---

## Files Created

### 1. Company Validation (`/src/lib/validation/company-validation.ts`)

**Purpose:** Validates company configuration settings (currency and VAT)

**Key Features:**
- **5 Supported Currencies:** USD, ZAR, EUR, ZWD, ZIG with UI-friendly labels
- **VAT Validation:** Enforces 0-100% range with clear error messages
- **Flexible Schemas:** Separate schemas for required vs optional validation
- **Currency Labels Export:** Ready-to-use labels for dropdown components

**Exported Items:**
```typescript
// Constants
SUPPORTED_CURRENCIES: SupportedCurrency[]
CURRENCY_LABELS: Record<SupportedCurrency, string>

// Schemas
companyCurrencySchema   // Required currency selection
companyVatSchema        // Required VAT percentage
companyConfigSchema     // Optional currency + VAT

// Types (inferred from schemas)
CompanyCurrencyInput
CompanyVatInput
CompanyConfigInput
```

### 2. Contact Validation (`/src/lib/validation/contact-validation.ts`)

**Purpose:** Validates primary and financial contact information

**Key Features:**
- **Primary Contact Schema:** Basic info with optional email
- **Financial Contact Schema:** Required email for mailing list functionality
- **Update Schema:** Extended with UUID validation for existing contacts
- **Helper Functions:** Email and phone validation utilities

**Exported Items:**
```typescript
// Schemas
primaryContactSchema           // Basic contact (optional email)
financialContactSchema         // Financial contact (required email)
updateFinancialContactSchema   // Existing contact with ID

// Helper Functions
validateEmail(email: string): boolean
validatePhone(phone: string): boolean

// Types (inferred from schemas)
PrimaryContactInput
FinancialContactInput
UpdateFinancialContactInput
```

---

## How to Use the Schemas

### Example 1: Currency Selection Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyCurrencySchema, CURRENCY_LABELS } from '@/lib/validation/company-validation';

export function CurrencySettingsForm() {
  const form = useForm({
    resolver: zodResolver(companyCurrencySchema),
    defaultValues: {
      defaultCurrency: 'USD'
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <Select
        value={form.watch('defaultCurrency')}
        onValueChange={(value) => form.setValue('defaultCurrency', value)}
      >
        {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </Select>
      {form.formState.errors.defaultCurrency && (
        <p className="text-red-500">
          {form.formState.errors.defaultCurrency.message}
        </p>
      )}
      <button type="submit">Save</button>
    </form>
  );
}
```

### Example 2: VAT Configuration Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyVatSchema } from '@/lib/validation/company-validation';

export function VatSettingsForm() {
  const form = useForm({
    resolver: zodResolver(companyVatSchema),
    defaultValues: {
      vatPercentage: 15
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        type="number"
        min="0"
        max="100"
        step="0.01"
        {...form.register('vatPercentage', { valueAsNumber: true })}
      />
      {form.formState.errors.vatPercentage && (
        <p className="text-red-500">
          {form.formState.errors.vatPercentage.message}
        </p>
      )}
      <button type="submit">Save</button>
    </form>
  );
}
```

### Example 3: Financial Contact Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { financialContactSchema } from '@/lib/validation/contact-validation';

export function FinancialContactForm() {
  const form = useForm({
    resolver: zodResolver(financialContactSchema),
    defaultValues: {
      name: '',
      email: '',
      position: '',
      phone: '',
      isActive: true,
      isPrimary: false
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input
        type="text"
        placeholder="Name"
        {...form.register('name')}
      />
      <input
        type="email"
        placeholder="Email (required for mailing list)"
        {...form.register('email')}
      />
      <input
        type="text"
        placeholder="Position/Title"
        {...form.register('position')}
      />
      <input
        type="tel"
        placeholder="Phone (optional)"
        {...form.register('phone')}
      />
      <button type="submit">Add Contact</button>
    </form>
  );
}
```

### Example 4: Combined Company Configuration

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyConfigSchema, CURRENCY_LABELS } from '@/lib/validation/company-validation';

export function CompanyConfigForm() {
  const form = useForm({
    resolver: zodResolver(companyConfigSchema),
    defaultValues: {
      defaultCurrency: undefined, // Optional
      vatPercentage: undefined    // Optional
    }
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Currency (optional) */}
      <Select
        value={form.watch('defaultCurrency')}
        onValueChange={(value) => form.setValue('defaultCurrency', value)}
      >
        <SelectItem value="">No preference</SelectItem>
        {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </Select>

      {/* VAT (optional) */}
      <input
        type="number"
        placeholder="VAT percentage (optional)"
        {...form.register('vatPercentage', { valueAsNumber: true })}
      />

      <button type="submit">Save Configuration</button>
    </form>
  );
}
```

---

## Validation Rules Summary

### Currency Validation
- **Supported:** USD, ZAR, EUR, ZWD, ZIG
- **Error Message:** "Please select a valid currency"
- **Use Case:** Company settings, invoice defaults

### VAT Validation
- **Range:** 0-100%
- **Type:** Number (supports decimals)
- **Error Messages:**
  - Required: "VAT percentage is required"
  - Invalid type: "VAT percentage must be a number"
  - Below 0: "VAT percentage must be at least 0%"
  - Above 100: "VAT percentage cannot exceed 100%"

### Primary Contact Validation
- **Name:** Required, minimum 1 character
- **Email:** Optional, validated if present
- **Phone:** Optional
- **Position:** Optional

### Financial Contact Validation
- **Name:** Required, minimum 1 character
- **Email:** Required with custom message: "Email is required for mailing list"
- **Phone:** Optional (can be empty string)
- **Position:** Required, minimum 1 character
- **isActive:** Boolean, defaults to true
- **isPrimary:** Boolean, defaults to false

### Update Financial Contact
- All fields from financial contact schema
- **ID:** Required, must be valid UUID v4
- **createdAt:** Required string (ISO timestamp)
- **updatedAt:** Required string (ISO timestamp)

---

## Helper Functions

### validateEmail(email: string): boolean
- Returns true if email matches basic email regex
- Pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$`
- Use for manual validation or custom components

### validatePhone(phone: string): boolean
- Returns true if phone contains 10+ digits
- Strips non-digit characters before validation
- Flexible with formatting (accepts +, -, spaces, etc.)

---

## Quick Verification Steps

### 1. Check Files Exist
```bash
ls -lah /src/lib/validation/
# Should show:
# - company-validation.ts
# - contact-validation.ts
```

### 2. Import Test (TypeScript)
```typescript
// In any .ts file
import {
  companyCurrencySchema,
  CURRENCY_LABELS
} from '@/lib/validation/company-validation';

import {
  financialContactSchema,
  validateEmail
} from '@/lib/validation/contact-validation';

console.log('Schemas imported successfully!');
```

### 3. Validation Test
```typescript
import { companyCurrencySchema } from '@/lib/validation/company-validation';

// Should pass
const result = companyCurrencySchema.safeParse({ defaultCurrency: 'USD' });
console.log('Validation passed:', result.success); // true

// Should fail
const invalid = companyCurrencySchema.safeParse({ defaultCurrency: 'XXX' });
console.log('Validation failed:', !invalid.success); // true
```

### 4. Currency Labels Test
```typescript
import { CURRENCY_LABELS } from '@/lib/validation/company-validation';

console.log('Currency labels:', CURRENCY_LABELS);
// Output:
// {
//   USD: 'US Dollar ($)',
//   ZAR: 'South African Rand (R)',
//   EUR: 'Euro (€)',
//   ZWD: 'Zimbabwe Dollar (ZWD)',
//   ZIG: 'Zimbabwe Gold (ZIG)'
// }
```

---

## What's Next (Phase 3)

### UI Components to Build
1. **Company Settings Page** — Currency and VAT configuration UI
2. **Primary Contact Form** — Basic contact info during company creation
3. **Financial Contacts Manager** — Add/edit/delete financial contacts
4. **Contact Mailing List** — Display all financial contacts with email

### Service Layer Modifications
1. **CompanyService Updates** — Add currency and VAT to company creation/update
2. **Contact Service** — CRUD operations for financial contacts subcollection
3. **Validation Integration** — Use schemas in service layer for data integrity

### Where These Schemas Will Be Used
- `/app/companies/new/page.tsx` — Company creation form
- `/app/companies/[id]/edit/page.tsx` — Company settings/edit form
- `/app/workspace/[companyId]/settings/page.tsx` — Company configuration (when created)
- Contact management dialogs — Add/edit financial contacts

---

## Benefits of This Implementation

1. **Type Safety** — TypeScript catches errors at compile time
2. **Consistent Validation** — Same rules across all forms
3. **User-Friendly Messages** — Clear, actionable error messages
4. **Reusable** — Import schemas anywhere forms are needed
5. **Maintainable** — Single source of truth for validation rules
6. **Integration Ready** — Works seamlessly with react-hook-form
7. **Currency UI Helper** — CURRENCY_LABELS makes dropdowns easy
8. **Flexible** — Separate schemas for required vs optional validation

---

## Technical Notes

- **Zod Version:** Compatible with zod@^3.x
- **React Hook Form:** Use with @hookform/resolvers/zod
- **TypeScript:** Full type inference from schemas
- **Performance:** Validation is fast, schemas are lightweight
- **Testing:** All schemas pass ESLint and TypeScript compilation

---

## Troubleshooting

### Import Errors
If you get "Cannot find module '@/lib/validation/...'", check:
1. tsconfig.json has proper path mapping for `@/*`
2. Files are in correct directory: `/src/lib/validation/`
3. No typos in import statements

### Validation Not Working
If form validation doesn't trigger:
1. Check zodResolver is configured correctly
2. Verify you're using the right schema for the form
3. Ensure form fields match schema property names
4. Check console for Zod validation errors

### TypeScript Errors
If TypeScript shows type errors:
1. Import types explicitly if needed
2. Check currency values match SUPPORTED_CURRENCIES
3. Ensure number fields use `valueAsNumber: true` in register()
4. Verify UUID format for update operations

---

## Summary

Phase 2 is complete! You now have:
- ✅ Robust validation schemas for all company and contact forms
- ✅ Type-safe validation with Zod
- ✅ UI-friendly currency labels
- ✅ Helper functions for email/phone validation
- ✅ Full TypeScript type inference
- ✅ Ready for react-hook-form integration
- ✅ Comprehensive testing guide

**Next:** Phase 3 will build the UI components that use these schemas.
