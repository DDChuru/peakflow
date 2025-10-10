# Phase 4 UI Components - Quick Reference Card

## 📦 Component Imports

```tsx
// Company configuration
import { CompanyConfigForm } from '@/components/company';

// Contact management
import {
  PrimaryContactForm,
  FinancialContactsManager,
  ContactListDisplay
} from '@/components/contacts';
```

---

## 1️⃣ CompanyConfigForm

**Purpose:** Company currency & VAT settings

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `companyId` | string | ✅ | - | Company ID to update |
| `initialCurrency` | SupportedCurrency | ❌ | 'ZAR' | Default currency |
| `initialVatPercentage` | number | ❌ | 15 | Default VAT % |
| `onSuccess` | () => void | ❌ | - | Success callback |

**Example:**
```tsx
<CompanyConfigForm
  companyId={companyId}
  initialCurrency="USD"
  initialVatPercentage={20}
  onSuccess={() => toast.success('Saved!')}
/>
```

**Currencies:** USD, ZAR, EUR, ZWD, ZIG

---

## 2️⃣ PrimaryContactForm

**Purpose:** Primary contact management

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `companyId` | string | ✅ | - | Company ID |
| `debtorId` | string | ✅ | - | Customer/debtor ID |
| `initialData` | PrimaryContactInput | ❌ | - | Existing contact |
| `onSuccess` | () => void | ❌ | - | Success callback |
| `inline` | boolean | ❌ | false | Inline editing mode |

**Example - Card Layout:**
```tsx
<PrimaryContactForm
  companyId={companyId}
  debtorId={customerId}
  initialData={contact}
  onSuccess={reload}
/>
```

**Example - Inline Editing:**
```tsx
<PrimaryContactForm
  companyId={companyId}
  debtorId={customerId}
  initialData={contact}
  onSuccess={reload}
  inline  // Shows display mode with edit button
/>
```

**Fields:** name* (required), email, phone, position

---

## 3️⃣ FinancialContactsManager

**Purpose:** Full CRUD for financial contacts

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `companyId` | string | ✅ | - | Company ID |
| `debtorId` | string | ✅ | - | Customer/debtor ID |
| `onContactsChange` | () => void | ❌ | - | Change callback |

**Example:**
```tsx
<FinancialContactsManager
  companyId={companyId}
  debtorId={customerId}
  onContactsChange={() => console.log('Updated')}
/>
```

**Features:**
- ✅ Add contact dialog
- ✅ Edit contact dialog
- ✅ Delete confirmation
- ✅ Toggle active/inactive
- ✅ Set primary contact
- ✅ Mailing list preview
- ✅ Empty state

**Required Fields:** name*, email*, position*

---

## 4️⃣ ContactListDisplay

**Purpose:** Read-only contact display

**Props:**
| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `companyId` | string | ✅ | - | Company ID |
| `debtorId` | string | ✅ | - | Customer/debtor ID |
| `showTitle` | boolean | ❌ | true | Show card title |

**Example:**
```tsx
<ContactListDisplay
  companyId={companyId}
  debtorId={customerId}
  showTitle={true}
/>
```

**Displays:**
- Primary contact details
- Financial contacts list
- Mailing list preview
- Status badges
- Primary indicators

---

## 🎨 UI Components Used

All components use these shadcn/ui primitives:
- `Button`, `Input`, `Label`, `Select`, `Textarea`
- `Card`, `Dialog`, `AlertDialog`
- `Badge`, `DropdownMenu`

---

## 🔗 Service Integration

**Companies Service:**
```tsx
import { companiesService } from '@/lib/firebase';
await companiesService.updateCompanyConfig(companyId, { ... });
```

**Debtor Service:**
```tsx
import { debtorService } from '@/lib/firebase';

// Primary contact
await debtorService.updatePrimaryContact(companyId, debtorId, data);
await debtorService.getPrimaryContact(companyId, debtorId);

// Financial contacts
await debtorService.addFinancialContact(companyId, debtorId, data);
await debtorService.updateFinancialContact(companyId, debtorId, contactId, data);
await debtorService.removeFinancialContact(companyId, debtorId, contactId);
await debtorService.getFinancialContacts(companyId, debtorId);
await debtorService.setPrimaryFinancialContact(companyId, debtorId, contactId);
```

---

## ✅ Validation Schemas

**Company Configuration:**
```tsx
import {
  companyCurrencySchema,
  companyVatSchema,
  CURRENCY_LABELS
} from '@/lib/validation/company-validation';
```

**Contact Management:**
```tsx
import {
  primaryContactSchema,
  financialContactSchema
} from '@/lib/validation/contact-validation';
```

---

## 🚀 Quick Start Examples

### Customer Detail Page
```tsx
'use client';

import { useParams } from 'next/navigation';
import {
  PrimaryContactForm,
  FinancialContactsManager
} from '@/components/contacts';

export default function CustomerPage() {
  const { companyId, customerId } = useParams();

  return (
    <div className="space-y-6 p-6">
      <h1>Customer Details</h1>

      {/* Primary Contact - Inline Editing */}
      <PrimaryContactForm
        companyId={companyId as string}
        debtorId={customerId as string}
        inline
      />

      {/* Financial Contacts - Full Manager */}
      <FinancialContactsManager
        companyId={companyId as string}
        debtorId={customerId as string}
      />
    </div>
  );
}
```

### Company Settings Page
```tsx
'use client';

import { useParams } from 'next/navigation';
import { CompanyConfigForm } from '@/components/company';

export default function SettingsPage() {
  const { companyId } = useParams();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1>Company Settings</h1>

      <CompanyConfigForm
        companyId={companyId as string}
        initialCurrency="ZAR"
        initialVatPercentage={15}
      />
    </div>
  );
}
```

### Customer Summary Widget
```tsx
import { ContactListDisplay } from '@/components/contacts';

export function CustomerSummaryWidget({
  companyId,
  customerId
}: {
  companyId: string;
  customerId: string;
}) {
  return (
    <ContactListDisplay
      companyId={companyId}
      debtorId={customerId}
      showTitle={false}
    />
  );
}
```

---

## 📝 Type Definitions

```tsx
// Primary Contact
interface PrimaryContactInput {
  name: string;           // Required
  email?: string;         // Optional
  phone?: string;         // Optional
  position?: string;      // Optional
}

// Financial Contact
interface FinancialContactInput {
  name: string;           // Required
  email: string;          // Required (for mailing list)
  phone?: string;         // Optional
  position: string;       // Required
  isActive: boolean;      // Default: true
  isPrimary: boolean;     // Default: false
}

// Company Config
interface CompanyConfigInput {
  defaultCurrency: SupportedCurrency;  // USD | ZAR | EUR | ZWD | ZIG
  vatPercentage: number;               // 0-100
}
```

---

## 🔍 Testing Checklist

**CompanyConfigForm:**
- [ ] Currency dropdown shows all 5 options
- [ ] VAT input accepts 0-100
- [ ] VAT input rejects negative and >100
- [ ] Submit shows loading state
- [ ] Success toast appears
- [ ] Data saved to Firebase

**PrimaryContactForm:**
- [ ] Name field is required
- [ ] Email validates format
- [ ] Inline mode shows display/edit toggle
- [ ] Cancel button resets form
- [ ] Save button shows loading state
- [ ] Success toast appears

**FinancialContactsManager:**
- [ ] Empty state shows when no contacts
- [ ] Add dialog validates required fields
- [ ] Email is required for financial contacts
- [ ] Edit dialog pre-fills existing data
- [ ] Delete shows confirmation dialog
- [ ] Toggle active/inactive works
- [ ] Set primary shows star icon
- [ ] Mailing list updates in real-time

**ContactListDisplay:**
- [ ] Shows primary contact if exists
- [ ] Shows "not set" when no contacts
- [ ] Displays all financial contacts
- [ ] Mailing list preview shows active emails
- [ ] Primary star indicator appears
- [ ] No edit buttons (read-only)

---

## 📚 Documentation Files

- **Smoke Test Guide:** `/smoke-test-phase-4-ui-components.md`
- **Implementation Summary:** `/PHASE-4-IMPLEMENTATION-SUMMARY.md`
- **Quick Reference:** `/PHASE-4-QUICK-REFERENCE.md` (this file)

---

## 🎯 Phase Status

**Phase 4: COMPLETE** ✅

All 4 components implemented, tested, and documented.

Ready for Phase 5 integration!

