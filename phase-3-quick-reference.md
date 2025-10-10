# Quick Reference: Phase 3 Service Layer APIs

**Last Updated:** 2025-10-08

---

## Company Configuration

### Import
```typescript
import { companiesService, SupportedCurrency } from '@/lib/firebase';
```

### Update Currency & VAT
```typescript
await companiesService.updateCompanyConfig(companyId, {
  defaultCurrency: 'ZAR',  // 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG'
  vatPercentage: 15        // 0-100
});
```

### Get Currency
```typescript
const currency: SupportedCurrency | undefined =
  await companiesService.getCompanyCurrency(companyId);
```

### Get VAT
```typescript
const vatPercentage: number | undefined =
  await companiesService.getCompanyVAT(companyId);
```

---

## Debtor Financial Contacts

### Import
```typescript
import { debtorService, FinancialContact, ContactPerson } from '@/lib/firebase';
```

### Add Contact
```typescript
const contact: FinancialContact = await debtorService.addFinancialContact(
  companyId,
  debtorId,
  {
    name: 'John Smith',
    email: 'john@company.com',  // Required
    phone: '+27123456789',       // Optional
    position: 'Financial Director',
    isPrimary: true              // Optional, default: false
  }
);
// Returns: { id, name, email, phone, position, isActive, isPrimary, createdAt, updatedAt }
```

### Update Contact
```typescript
await debtorService.updateFinancialContact(
  companyId,
  debtorId,
  contactId,
  {
    phone: '+27987654321',
    position: 'CFO',
    isActive: false  // Soft delete
  }
);
```

### Remove Contact
```typescript
await debtorService.removeFinancialContact(companyId, debtorId, contactId);
```

### Get Active Emails (Mailing List)
```typescript
const emails: string[] = await debtorService.getFinancialContactEmails(
  companyId,
  debtorId
);
// Returns only active contacts with email addresses
```

### Update Primary Contact
```typescript
await debtorService.updatePrimaryContact(
  companyId,
  debtorId,
  {
    name: 'Mike Wilson',
    email: 'mike@company.com',  // Optional
    phone: '+27111222333',      // Optional
    position: 'CEO'             // Optional
  }
);
```

---

## Creditor Financial Contacts

### Import
```typescript
import { creditorService, FinancialContact, ContactPerson } from '@/lib/firebase';
```

### API (Identical to Debtor)
```typescript
// All methods same as debtorService:
await creditorService.addFinancialContact(companyId, creditorId, contact);
await creditorService.updateFinancialContact(companyId, creditorId, contactId, updates);
await creditorService.removeFinancialContact(companyId, creditorId, contactId);
await creditorService.getFinancialContactEmails(companyId, creditorId);
await creditorService.updatePrimaryContact(companyId, creditorId, contact);
```

---

## Type Definitions

### SupportedCurrency
```typescript
type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG';
```

### ContactPerson
```typescript
interface ContactPerson {
  name: string;
  email?: string;
  phone?: string;
  position?: string;
}
```

### FinancialContact
```typescript
interface FinancialContact {
  id: string;           // Auto-generated UUID
  name: string;
  email: string;        // Required for mailing list
  phone?: string;
  position: string;
  isActive: boolean;    // For soft delete
  isPrimary: boolean;   // Mark as primary contact
  createdAt: string;    // ISO 8601 format
  updatedAt: string;    // ISO 8601 format
}
```

---

## Common Patterns

### Pattern 1: Complete Company Setup
```typescript
// Set up new company with currency and VAT
await companiesService.updateCompanyConfig(companyId, {
  defaultCurrency: 'ZAR',
  vatPercentage: 15
});
```

### Pattern 2: Build Mailing List
```typescript
// Get all active emails for invoice distribution
const debtorEmails = await debtorService.getFinancialContactEmails(
  companyId,
  debtorId
);

// Use for email sending
await sendInvoiceEmails(debtorEmails, invoiceData);
```

### Pattern 3: Add Multiple Contacts
```typescript
const contacts = [
  { name: 'John', email: 'john@co.com', position: 'CFO', isPrimary: true },
  { name: 'Sarah', email: 'sarah@co.com', position: 'Controller' }
];

for (const contact of contacts) {
  await debtorService.addFinancialContact(companyId, debtorId, contact);
}
```

### Pattern 4: Soft Delete (Deactivate)
```typescript
// Don't remove, just deactivate
await debtorService.updateFinancialContact(companyId, debtorId, contactId, {
  isActive: false
});

// Contact still exists but won't appear in email list
const emails = await debtorService.getFinancialContactEmails(companyId, debtorId);
// Deactivated contact email won't be included
```

### Pattern 5: Primary Contact Management
```typescript
// Update basic contact info
await debtorService.updatePrimaryContact(companyId, debtorId, {
  name: 'New Person',
  email: 'new@company.com',
  position: 'Manager'
});

// Or mark a financial contact as primary
await debtorService.updateFinancialContact(companyId, debtorId, contactId, {
  isPrimary: true
});
```

---

## Error Handling

### VAT Validation Error
```typescript
try {
  await companiesService.updateCompanyConfig(companyId, {
    vatPercentage: 150  // Invalid!
  });
} catch (error) {
  // Error: "VAT percentage must be between 0 and 100"
}
```

### Missing Contact Error
```typescript
try {
  await debtorService.updateFinancialContact(companyId, debtorId, 'invalid-id', {
    name: 'New Name'
  });
} catch (error) {
  // Error: "No financial contacts found"
}
```

### General Service Error
```typescript
try {
  await creditorService.addFinancialContact(companyId, creditorId, contact);
} catch (error) {
  console.error('Failed to add contact:', error);
  // Error format: "Failed to add financial contact: {original error}"
}
```

---

## Best Practices

### ✅ DO

- Validate email format before adding contacts
- Use `isActive` flag instead of removing contacts
- Mark one contact as `isPrimary` for clarity
- Handle errors with try/catch
- Use `getFinancialContactEmails()` for mailing lists
- Update `primaryContact` for main contact info

### ❌ DON'T

- Set VAT percentage outside 0-100 range
- Remove contacts if you might need history (use isActive instead)
- Forget to check for undefined when getting config
- Add duplicate emails (implement your own deduplication if needed)
- Use `removeFinancialContact` unless permanently deleting

---

## Performance Tips

1. **Batch Operations**: If adding multiple contacts, consider collecting them first
2. **Email Fetching**: `getFinancialContactEmails()` is filtered client-side
3. **Array Updates**: Firestore operations are atomic, no race conditions
4. **UUID Generation**: Uses Node.js crypto, very fast

---

## Firestore Structure

### Company Document
```
companies/{companyId}
  ├─ name: "Company Name"
  ├─ defaultCurrency: "ZAR"
  ├─ vatPercentage: 15
  └─ updatedAt: Timestamp
```

### Debtor/Creditor Document
```
companies/{companyId}/debtors/{debtorId}
  ├─ name: "Debtor Name"
  ├─ primaryContact: {
  │   name: "Main Contact",
  │   email: "contact@debtor.com",
  │   position: "Manager"
  │ }
  ├─ financialContacts: [
  │   {
  │     id: "uuid-1",
  │     name: "Financial Contact",
  │     email: "finance@debtor.com",
  │     position: "CFO",
  │     isActive: true,
  │     isPrimary: true,
  │     createdAt: "2025-10-08T10:00:00.000Z",
  │     updatedAt: "2025-10-08T10:00:00.000Z"
  │   }
  │ ]
  └─ updatedAt: Timestamp
```

---

## Migration Notes

### Existing Data
- New fields are optional
- Existing debtors/creditors work without changes
- Add currency/VAT as needed during migration

### Backward Compatibility
- All new methods are additive
- Existing service methods unchanged
- No breaking changes to existing functionality

---

## File Paths (Absolute)

- Companies Service: `/home/dachu/Documents/projects/vercel/peakflow/src/lib/firebase/companies-service.ts`
- Debtor Service: `/home/dachu/Documents/projects/vercel/peakflow/src/lib/firebase/debtor-service.ts`
- Creditor Service: `/home/dachu/Documents/projects/vercel/peakflow/src/lib/firebase/creditor-service.ts`
- Service Index: `/home/dachu/Documents/projects/vercel/peakflow/src/lib/firebase/index.ts`
- Type Definitions: `/home/dachu/Documents/projects/vercel/peakflow/src/types/financial.ts`

---

**Need Help?** Check the smoke test guide: `smoke-test-phase-3-service-layer.md`
