# Smoke Test Guide: Validation Schemas (Phase 2)

## Overview
Phase 2 validation schemas provide Zod-based validation for company configuration and contact forms.

**Files Created:**
- `/src/lib/validation/company-validation.ts` — Company currency and VAT schemas
- `/src/lib/validation/contact-validation.ts` — Contact validation schemas

**Completion Date:** 2025-10-08

---

## Test Suite 1: Company Validation Schemas

### 1.1 Currency Schema Validation
**Test:** Import and test currency validation
```typescript
import { companyCurrencySchema, CURRENCY_LABELS } from '@/lib/validation/company-validation';

// Valid currency
const validResult = companyCurrencySchema.safeParse({
  defaultCurrency: 'USD'
});
console.log('Valid:', validResult.success); // Should be true

// Invalid currency
const invalidResult = companyCurrencySchema.safeParse({
  defaultCurrency: 'XXX'
});
console.log('Invalid:', invalidResult.success); // Should be false
console.log('Error:', invalidResult.error?.errors[0].message); // Should show custom message
```

**Expected Results:**
- ✅ Valid currencies: USD, ZAR, EUR, ZWD, ZIG
- ✅ Invalid currencies rejected with custom error message
- ✅ CURRENCY_LABELS exports UI-friendly labels

### 1.2 VAT Schema Validation
**Test:** VAT percentage validation
```typescript
import { companyVatSchema } from '@/lib/validation/company-validation';

// Valid VAT
companyVatSchema.parse({ vatPercentage: 15 }); // Should pass
companyVatSchema.parse({ vatPercentage: 0 });  // Should pass
companyVatSchema.parse({ vatPercentage: 100 }); // Should pass

// Invalid VAT
try {
  companyVatSchema.parse({ vatPercentage: -5 }); // Should fail
} catch (e) {
  console.log('Error:', e.errors[0].message); // "VAT percentage must be at least 0%"
}

try {
  companyVatSchema.parse({ vatPercentage: 150 }); // Should fail
} catch (e) {
  console.log('Error:', e.errors[0].message); // "VAT percentage cannot exceed 100%"
}
```

**Expected Results:**
- ✅ VAT 0-100% accepted
- ✅ Negative values rejected
- ✅ Values > 100% rejected
- ✅ Non-numeric values rejected with clear message

### 1.3 Combined Config Schema
**Test:** Optional currency + VAT validation
```typescript
import { companyConfigSchema } from '@/lib/validation/company-validation';

// Both fields optional
companyConfigSchema.parse({}); // Should pass
companyConfigSchema.parse({ defaultCurrency: 'ZAR' }); // Should pass
companyConfigSchema.parse({ vatPercentage: 15 }); // Should pass
companyConfigSchema.parse({
  defaultCurrency: 'USD',
  vatPercentage: 15
}); // Should pass
```

**Expected Results:**
- ✅ All fields optional
- ✅ Validates present fields correctly
- ✅ Empty object passes validation

---

## Test Suite 2: Contact Validation Schemas

### 2.1 Primary Contact Schema
**Test:** Basic contact validation with optional email
```typescript
import { primaryContactSchema } from '@/lib/validation/contact-validation';

// Valid primary contact
primaryContactSchema.parse({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+27 11 123 4567',
  position: 'CEO'
});

// Name only (minimum requirement)
primaryContactSchema.parse({ name: 'Jane Smith' }); // Should pass

// Empty string email (allowed)
primaryContactSchema.parse({
  name: 'Bob Jones',
  email: ''
}); // Should pass
```

**Expected Results:**
- ✅ Name required, cannot be empty
- ✅ Email optional but validated if present
- ✅ Empty string email allowed
- ✅ Phone and position optional

### 2.2 Financial Contact Schema
**Test:** Financial contact with required email
```typescript
import { financialContactSchema } from '@/lib/validation/contact-validation';

// Valid financial contact
financialContactSchema.parse({
  name: 'CFO Name',
  email: 'cfo@example.com',
  position: 'Chief Financial Officer',
  isActive: true,
  isPrimary: false
});

// Missing email should fail
try {
  financialContactSchema.parse({
    name: 'CFO Name',
    position: 'CFO'
  });
} catch (e) {
  console.log('Error:', e.errors[0].message); // "Email is required for mailing list"
}
```

**Expected Results:**
- ✅ Name required
- ✅ Email required with custom message
- ✅ Position/title required
- ✅ isActive defaults to true
- ✅ isPrimary defaults to false
- ✅ Phone optional

### 2.3 Update Financial Contact Schema
**Test:** Extended schema with ID and timestamps
```typescript
import { updateFinancialContactSchema } from '@/lib/validation/contact-validation';

// Valid update
updateFinancialContactSchema.parse({
  id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Updated Name',
  email: 'updated@example.com',
  position: 'CFO',
  isActive: true,
  isPrimary: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z'
});

// Invalid UUID should fail
try {
  updateFinancialContactSchema.parse({
    id: 'not-a-uuid',
    name: 'Test',
    email: 'test@example.com',
    position: 'Test',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  });
} catch (e) {
  console.log('Error:', e.errors[0].message); // "Invalid contact ID"
}
```

**Expected Results:**
- ✅ ID must be valid UUID
- ✅ All fields from financialContactSchema inherited
- ✅ createdAt and updatedAt required strings
- ✅ Invalid UUID rejected with clear message

---

## Test Suite 3: Helper Functions

### 3.1 Email Validation Helper
**Test:** validateEmail() function
```typescript
import { validateEmail } from '@/lib/validation/contact-validation';

console.log(validateEmail('test@example.com')); // true
console.log(validateEmail('invalid-email')); // false
console.log(validateEmail('test@example')); // false
console.log(validateEmail('@example.com')); // false
```

**Expected Results:**
- ✅ Valid emails return true
- ✅ Invalid formats return false
- ✅ Missing @ or domain rejected

### 3.2 Phone Validation Helper
**Test:** validatePhone() function
```typescript
import { validatePhone } from '@/lib/validation/contact-validation';

console.log(validatePhone('+27 11 123 4567')); // true (10+ digits)
console.log(validatePhone('011-123-4567')); // true (10+ digits)
console.log(validatePhone('1234567890')); // true (10 digits)
console.log(validatePhone('123456789')); // false (9 digits)
console.log(validatePhone('abc')); // false
```

**Expected Results:**
- ✅ Phone with 10+ digits returns true
- ✅ Strips non-digit characters before validation
- ✅ Less than 10 digits returns false
- ✅ Non-numeric strings return false

---

## Test Suite 4: React Hook Form Integration

### 4.1 Currency Form Setup
**Example:** Using schemas with react-hook-form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyCurrencySchema, CURRENCY_LABELS } from '@/lib/validation/company-validation';

const form = useForm({
  resolver: zodResolver(companyCurrencySchema),
  defaultValues: {
    defaultCurrency: 'USD'
  }
});

// In component:
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
```

**Expected Results:**
- ✅ Form validation works automatically
- ✅ Error messages display correctly
- ✅ Currency labels render in dropdown

### 4.2 Contact Form Setup
**Example:** Financial contact form validation
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { financialContactSchema } from '@/lib/validation/contact-validation';

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
```

**Expected Results:**
- ✅ Required fields show validation errors
- ✅ Email format validated in real-time
- ✅ Form submission blocked on validation errors
- ✅ Error messages user-friendly

---

## Test Suite 5: TypeScript Type Safety

### 5.1 Exported Types
**Test:** Type inference from schemas
```typescript
import type {
  CompanyCurrencyInput,
  CompanyVatInput,
  CompanyConfigInput,
  PrimaryContactInput,
  FinancialContactInput,
  UpdateFinancialContactInput
} from '@/lib/validation/company-validation';
// and contact-validation

// Types should be correctly inferred from schemas
const currencyData: CompanyCurrencyInput = {
  defaultCurrency: 'USD' // TypeScript should enforce enum
};

const contactData: FinancialContactInput = {
  name: 'Test',
  email: 'test@example.com',
  position: 'Manager',
  isActive: true,
  isPrimary: false
};
```

**Expected Results:**
- ✅ All types properly exported
- ✅ TypeScript autocompletion works
- ✅ Type errors caught at compile time
- ✅ IntelliSense shows field requirements

---

## Quick Verification Checklist

### File Structure
- [ ] `/src/lib/validation/` directory exists
- [ ] `company-validation.ts` present and exports all schemas
- [ ] `contact-validation.ts` present and exports all schemas

### Company Validation
- [ ] Currency validation accepts 5 supported currencies
- [ ] Currency validation rejects invalid codes
- [ ] VAT validation enforces 0-100% range
- [ ] Config schema allows optional fields
- [ ] Currency labels exported for UI

### Contact Validation
- [ ] Primary contact requires name only
- [ ] Primary contact email optional
- [ ] Financial contact requires email
- [ ] Financial contact requires position
- [ ] Update schema includes UUID validation
- [ ] Helper functions work correctly

### Integration
- [ ] Schemas work with react-hook-form
- [ ] TypeScript types properly inferred
- [ ] No ESLint errors
- [ ] No TypeScript compilation errors

---

## Common Issues & Solutions

### Issue 1: "Cannot find module '@/lib/validation/...'"
**Solution:** Ensure TypeScript path mapping in tsconfig.json includes src directory

### Issue 2: "Type 'XXX' is not assignable to type SupportedCurrency"
**Solution:** Only use currencies defined in SUPPORTED_CURRENCIES array (USD, ZAR, EUR, ZWD, ZIG)

### Issue 3: Email validation passes but form shows error
**Solution:** Check if using optional() with or(z.literal('')) for optional email fields

### Issue 4: UUID validation fails for valid IDs
**Solution:** Ensure ID format is valid UUID v4 (8-4-4-4-12 hexadecimal pattern)

---

## Next Steps (Phase 3)

1. **Create UI Components** — Build form components using these validation schemas
2. **Company Settings Page** — Implement currency and VAT configuration UI
3. **Contact Management Forms** — Build primary and financial contact forms
4. **Service Layer Integration** — Connect forms to Firebase services
5. **Testing** — Write unit tests for validation logic

---

## Notes
- All schemas use Zod for runtime validation
- Error messages are user-friendly and actionable
- Schemas designed for react-hook-form integration
- Type safety maintained throughout with TypeScript
- Currency labels make UI development easier
- Helper functions provide additional validation utilities
