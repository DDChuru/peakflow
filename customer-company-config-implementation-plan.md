# Customer & Company Configuration Implementation Plan

**Date**: 2025-10-08
**Status**: Planning Phase
**Complexity**: High (Multi-faceted feature addition across types, services, and UI)

---

## Executive Summary

This document outlines the comprehensive implementation plan for adding:
1. Primary Contact Person to Customers/Debtors
2. Multiple Financial Department Contacts per Customer
3. Default Currency at Company level
4. Multi-Currency Support (basic registration)
5. VAT/Tax Percentage Configuration at company level
6. Bank Account currency association review
7. Bank Account CRUD UI audit

---

## Current State Analysis

### 1. Company Interface (`/src/types/auth.ts`)

**Current Structure:**
```typescript
interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry?: string;
  domain?: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string;
}
```

**Missing:**
- ❌ No `defaultCurrency` field
- ❌ No `vatPercentage` field
- ❌ No `allowedCurrencies` field
- ✅ Basic contact info exists (email, phone, address)

### 2. Debtor/Creditor Interface (`/src/types/financial.ts`)

**Current Structure:**
```typescript
interface Debtor {
  id: string;
  companyId: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxId?: string;
  creditLimit?: number;
  currentBalance: number;
  overdueAmount: number;
  paymentTerms: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

**Missing:**
- ❌ No primary contact person structure
- ❌ No financial contacts array
- ✅ Basic email/phone exists (but not structured as contact)
- ✅ Metadata field exists (could temporarily store contacts)

### 3. Bank Account Interface (`/src/types/accounting/bank-account.ts`)

**Current Structure:**
```typescript
interface BankAccount {
  id: string;
  companyId: string;
  name: string;
  accountNumber: string;
  accountType: BankAccountType;
  bankName: string;
  branch?: string;
  country?: string;
  currency: string; // ✅ Already has currency
  glAccountId: string;
  isPrimary: boolean;
  status: BankAccountStatus;
  signatories: BankSignatory[];
  balance: BankAccountBalance;
  // ... other fields
}
```

**Current State:**
- ✅ **Currency field already exists** on BankAccount
- ✅ Currency is also on BankAccountBalance
- ✅ BankTransfer has currency and exchangeRate fields
- ✅ Multi-currency infrastructure partially exists

### 4. Service Layer Analysis

**CompaniesService** (`/src/lib/firebase/companies-service.ts`):
- ✅ Clean CRUD pattern
- ✅ Uses serverTimestamp()
- ✅ Filters out undefined values
- ⚠️ Will need to add currency and VAT fields

**DebtorService** (`/src/lib/firebase/debtor-service.ts`):
- ✅ Company-Scoped Collection (CSC) pattern
- ✅ Good metadata handling
- ⚠️ Will need methods for contact management
- ⚠️ Could use sub-collection OR array for financial contacts

**BankAccountService** (`/src/lib/firebase/bank-account-service.ts`):
- ✅ **Already handles currency**
- ✅ Currency validation exists
- ✅ Multi-currency conversion logic present (CurrencyService integration)
- ✅ No changes needed for currency support

### 5. UI Layer Analysis

**Company Edit Page** (`/app/companies/[id]/edit/page.tsx`):
- ✅ React Hook Form + Zod validation
- ✅ Industry dropdown pattern
- ⚠️ Need to add currency dropdown
- ⚠️ Need to add VAT percentage input

**Debtors Page** (`/app/companies/[id]/debtors/page.tsx` & `new/page.tsx`):
- ✅ Table view with filters
- ✅ Modal-based forms
- ⚠️ Need to add contact person fields
- ⚠️ Need contact management sub-section

**Bank Account UI**:
- ⚠️ Need to audit existing UI (not found in workspace routes)
- ⚠️ Likely exists in admin or separate bank module

---

## Architecture Decisions

### 1. **Primary Contact Storage Strategy**

**Decision: Embedded Object in Debtor/Creditor Document**

Rationale:
- Primary contact is 1:1 with debtor
- Always loaded with debtor record
- No separate query needed
- Simple to update atomically

```typescript
interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

interface Debtor {
  // ... existing fields
  primaryContact?: ContactPerson;
}
```

### 2. **Multiple Financial Contacts Storage Strategy**

**Decision: Array Field in Debtor Document (NOT Sub-collection)**

Rationale:
- **For**:
  - Typically 2-5 contacts max (not hundreds)
  - Always loaded with debtor (no lazy loading needed)
  - Simpler queries and updates
  - Atomic updates with parent document
  - Less Firestore read costs
- **Against Sub-collection**:
  - More complex (separate queries)
  - Higher cost (extra reads)
  - Overkill for small lists

```typescript
interface FinancialContact {
  id: string; // UUID for array management
  name: string;
  email: string; // Required for mailing list
  phone?: string;
  position: string; // Free text: "Financial Director", "Creditor Controller"
  isActive: boolean; // Can disable without deleting
  createdAt: Date;
}

interface Debtor {
  // ... existing fields
  financialContacts: FinancialContact[];
}
```

### 3. **Currency Storage Strategy**

**Decision: Enum Type + Basic Registration (Preparation for Full Multi-Currency)**

Rationale:
- Start simple with hardcoded supported currencies
- Company has `defaultCurrency` field
- BankAccount already has `currency` field ✅
- Prepare for future exchange rate tables

```typescript
type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG';

interface Company {
  // ... existing fields
  defaultCurrency: SupportedCurrency;
  allowedCurrencies?: SupportedCurrency[]; // Optional: restrict which currencies can be used
}
```

**Future Expansion Path:**
- Add `currency_rates` collection with exchange rates
- Implement rate update service
- Add historical rate tracking
- Implement automatic conversion in transactions

### 4. **VAT/Tax Percentage Storage**

**Decision: Number Field with Percentage (0-100)**

```typescript
interface Company {
  // ... existing fields
  vatPercentage: number; // e.g., 15 for 15%, 20 for 20%
}
```

Validation:
- Must be between 0 and 100
- Defaults to 0 if not set
- Can be decimal (e.g., 7.5 for 7.5%)

### 5. **Backward Compatibility Strategy**

**Decision: Optional Fields with Sensible Defaults**

All new fields are optional with fallback logic:
- `defaultCurrency` defaults to 'USD' if not set
- `vatPercentage` defaults to 0 if not set
- `primaryContact` is optional (backward compatible)
- `financialContacts` defaults to empty array `[]`

Migration:
- No data migration script needed initially
- Existing records work without changes
- New fields populate on first edit

---

## Detailed Implementation Plan

### Phase 1: Type Definitions & Schema (Priority: HIGH)

#### File: `/src/types/auth.ts`

```typescript
// Add currency type
export type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG';

// Extend Company interface
export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry?: string;
  domain?: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;

  // NEW FIELDS
  defaultCurrency: SupportedCurrency; // Default: 'USD'
  vatPercentage: number; // Default: 0 (0% to 100%)
  allowedCurrencies?: SupportedCurrency[]; // Optional restriction

  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string;
}
```

#### File: `/src/types/financial.ts`

```typescript
// Add contact types
export interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
  position?: string; // e.g., "Accounts Payable Manager"
}

export interface FinancialContact {
  id: string; // UUID for array management
  name: string;
  email: string; // Required for invoice mailing list
  phone?: string;
  position: string; // Free text: "Financial Director", "Creditor Controller"
  isActive: boolean; // Can disable without removing
  createdAt: Date;
}

// Extend Debtor interface
export interface Debtor {
  id: string;
  companyId: string;
  name: string;

  // Deprecated: Keep for backward compatibility, migrate to primaryContact
  email?: string;
  phone?: string;

  // NEW: Primary contact person
  primaryContact?: ContactPerson;

  // NEW: Financial department contacts for invoicing
  financialContacts: FinancialContact[];

  address?: string;
  taxId?: string;
  creditLimit?: number;
  currentBalance: number;
  overdueAmount: number;
  paymentTerms: number;
  status: 'active' | 'inactive' | 'blocked';
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Extend Creditor interface (same pattern)
export interface Creditor {
  // ... same additions as Debtor
  primaryContact?: ContactPerson;
  financialContacts: FinancialContact[];
}
```

#### File: `/src/types/accounting/bank-account.ts`
- ✅ **No changes needed** - currency already exists

---

### Phase 2: Service Layer Updates (Priority: HIGH)

#### File: `/src/lib/firebase/companies-service.ts`

**Changes Needed:**

```typescript
// Update createCompany method
async createCompany(company: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>, userId: string): Promise<string> {
  try {
    const cleanCompanyData: Record<string, unknown> = {
      name: company.name,
      type: company.type,
      defaultCurrency: company.defaultCurrency || 'USD', // NEW: Default to USD
      vatPercentage: company.vatPercentage ?? 0, // NEW: Default to 0%
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isActive: company.isActive !== undefined ? company.isActive : true
    };

    // Optional fields
    if (company.industry) cleanCompanyData.industry = company.industry;
    if (company.domain) cleanCompanyData.domain = company.domain;
    if (company.logoUrl) cleanCompanyData.logoUrl = company.logoUrl;
    if (company.description) cleanCompanyData.description = company.description;
    if (company.address) cleanCompanyData.address = company.address;
    if (company.phone) cleanCompanyData.phone = company.phone;
    if (company.email) cleanCompanyData.email = company.email;
    if (company.allowedCurrencies) cleanCompanyData.allowedCurrencies = company.allowedCurrencies; // NEW

    const docRef = await addDoc(collection(db, this.collectionName), cleanCompanyData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating company:', error);
    throw error;
  }
}

// Update getCompanyById to handle defaults
async getCompanyById(id: string): Promise<Company | null> {
  try {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      defaultCurrency: data.defaultCurrency || 'USD', // NEW: Fallback for old records
      vatPercentage: data.vatPercentage ?? 0, // NEW: Fallback for old records
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date()
    } as Company;
  } catch (error) {
    console.error('Error fetching company:', error);
    throw error;
  }
}
```

#### File: `/src/lib/firebase/debtor-service.ts`

**Changes Needed:**

```typescript
import { v4 as uuidv4 } from 'uuid'; // Add dependency

// Add helper to convert old email/phone to primaryContact
private migrateToContactPerson(debtor: any): ContactPerson | undefined {
  if (debtor.email || debtor.phone) {
    return {
      name: debtor.name, // Use debtor name as contact name
      email: debtor.email || '',
      phone: debtor.phone,
      position: 'Primary Contact'
    };
  }
  return undefined;
}

// Update createDebtor method
async createDebtor(
  companyId: string,
  debtor: Omit<Debtor, 'id' | 'createdAt' | 'updatedAt' | 'companyId'>,
  userId: string
): Promise<Debtor> {
  try {
    const debtorsRef = collection(db, this.getCollectionPath(companyId));
    const debtorRef = doc(debtorsRef);

    const newDebtor: Debtor = {
      ...debtor,
      id: debtorRef.id,
      companyId,
      financialContacts: debtor.financialContacts || [], // NEW: Default to empty array
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId || debtor.createdBy
    };

    await setDoc(debtorRef, {
      ...newDebtor,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return newDebtor;
  } catch (error) {
    console.error('Error creating debtor:', error);
    throw new Error(`Failed to create debtor: ${error}`);
  }
}

// NEW: Add financial contact management methods
async addFinancialContact(
  companyId: string,
  debtorId: string,
  contact: Omit<FinancialContact, 'id' | 'createdAt'>
): Promise<FinancialContact> {
  try {
    const debtor = await this.getDebtor(companyId, debtorId);
    if (!debtor) {
      throw new Error('Debtor not found');
    }

    const newContact: FinancialContact = {
      id: uuidv4(),
      ...contact,
      isActive: contact.isActive ?? true,
      createdAt: new Date()
    };

    const updatedContacts = [...debtor.financialContacts, newContact];

    await this.updateDebtor(companyId, debtorId, {
      financialContacts: updatedContacts
    });

    return newContact;
  } catch (error) {
    console.error('Error adding financial contact:', error);
    throw new Error(`Failed to add financial contact: ${error}`);
  }
}

async updateFinancialContact(
  companyId: string,
  debtorId: string,
  contactId: string,
  updates: Partial<Omit<FinancialContact, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const debtor = await this.getDebtor(companyId, debtorId);
    if (!debtor) {
      throw new Error('Debtor not found');
    }

    const updatedContacts = debtor.financialContacts.map(contact =>
      contact.id === contactId ? { ...contact, ...updates } : contact
    );

    await this.updateDebtor(companyId, debtorId, {
      financialContacts: updatedContacts
    });
  } catch (error) {
    console.error('Error updating financial contact:', error);
    throw new Error(`Failed to update financial contact: ${error}`);
  }
}

async removeFinancialContact(
  companyId: string,
  debtorId: string,
  contactId: string
): Promise<void> {
  try {
    const debtor = await this.getDebtor(companyId, debtorId);
    if (!debtor) {
      throw new Error('Debtor not found');
    }

    const updatedContacts = debtor.financialContacts.filter(
      contact => contact.id !== contactId
    );

    await this.updateDebtor(companyId, debtorId, {
      financialContacts: updatedContacts
    });
  } catch (error) {
    console.error('Error removing financial contact:', error);
    throw new Error(`Failed to remove financial contact: ${error}`);
  }
}

// NEW: Get all active financial contact emails for mailing lists
async getFinancialContactEmails(companyId: string, debtorId: string): Promise<string[]> {
  try {
    const debtor = await this.getDebtor(companyId, debtorId);
    if (!debtor) {
      return [];
    }

    return debtor.financialContacts
      .filter(contact => contact.isActive && contact.email)
      .map(contact => contact.email);
  } catch (error) {
    console.error('Error getting financial contact emails:', error);
    return [];
  }
}
```

#### File: `/src/lib/firebase/creditor-service.ts`
- Apply same patterns as DebtorService

---

### Phase 3: UI Components (Priority: MEDIUM)

#### File: `/app/companies/[id]/edit/page.tsx`

**Add Currency and VAT Fields:**

```typescript
// Update Zod schema
const companyEditSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  defaultCurrency: z.enum(['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG']), // NEW
  vatPercentage: z.number().min(0).max(100), // NEW
  domain: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

// In the form JSX, add after industry field:
<div className="grid grid-cols-2 gap-4">
  {/* Default Currency */}
  <div>
    <Label htmlFor="defaultCurrency">Default Currency *</Label>
    <select
      id="defaultCurrency"
      {...register('defaultCurrency')}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      <option value="USD">US Dollar (USD)</option>
      <option value="ZAR">South African Rand (ZAR)</option>
      <option value="EUR">Euro (EUR)</option>
      <option value="ZWD">Zimbabwe Dollar (ZWD)</option>
      <option value="ZIG">Zimbabwe Gold (ZIG)</option>
    </select>
    {errors.defaultCurrency && (
      <p className="text-sm text-red-600 mt-1">{errors.defaultCurrency.message}</p>
    )}
  </div>

  {/* VAT Percentage */}
  <div>
    <Label htmlFor="vatPercentage">VAT/Tax Percentage *</Label>
    <Input
      id="vatPercentage"
      type="number"
      step="0.01"
      min="0"
      max="100"
      {...register('vatPercentage', { valueAsNumber: true })}
      placeholder="15"
      className="mt-1"
    />
    <p className="text-xs text-gray-500 mt-1">Enter percentage (e.g., 15 for 15%)</p>
    {errors.vatPercentage && (
      <p className="text-sm text-red-600 mt-1">{errors.vatPercentage.message}</p>
    )}
  </div>
</div>
```

#### New Component: `/src/components/financial/PrimaryContactForm.tsx`

```typescript
'use client';

import { ContactPerson } from '@/types/financial';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PrimaryContactFormProps {
  value?: ContactPerson;
  onChange: (contact: ContactPerson | undefined) => void;
  errors?: {
    name?: string;
    email?: string;
    phone?: string;
    position?: string;
  };
}

export function PrimaryContactForm({ value, onChange, errors }: PrimaryContactFormProps) {
  const updateField = (field: keyof ContactPerson, fieldValue: string) => {
    onChange({
      name: value?.name || '',
      email: value?.email || '',
      phone: value?.phone,
      position: value?.position,
      [field]: fieldValue || undefined
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Primary Contact Person</CardTitle>
        <CardDescription>Main point of contact for this customer</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryContactName">Contact Name *</Label>
            <Input
              id="primaryContactName"
              value={value?.name || ''}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="John Doe"
            />
            {errors?.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="primaryContactEmail">Email *</Label>
            <Input
              id="primaryContactEmail"
              type="email"
              value={value?.email || ''}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="john@example.com"
            />
            {errors?.email && (
              <p className="text-sm text-red-600 mt-1">{errors.email}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primaryContactPhone">Phone</Label>
            <Input
              id="primaryContactPhone"
              type="tel"
              value={value?.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div>
            <Label htmlFor="primaryContactPosition">Position/Title</Label>
            <Input
              id="primaryContactPosition"
              value={value?.position || ''}
              onChange={(e) => updateField('position', e.target.value)}
              placeholder="CEO, Manager, etc."
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### New Component: `/src/components/financial/FinancialContactsManager.tsx`

```typescript
'use client';

import { useState } from 'react';
import { FinancialContact } from '@/types/financial';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Mail, Phone, User } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface FinancialContactsManagerProps {
  contacts: FinancialContact[];
  onChange: (contacts: FinancialContact[]) => void;
  readOnly?: boolean;
}

export function FinancialContactsManager({
  contacts,
  onChange,
  readOnly = false
}: FinancialContactsManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newContact, setNewContact] = useState<Partial<FinancialContact>>({
    name: '',
    email: '',
    phone: '',
    position: '',
    isActive: true
  });

  const addContact = () => {
    if (!newContact.name || !newContact.email || !newContact.position) {
      return;
    }

    const contact: FinancialContact = {
      id: uuidv4(),
      name: newContact.name,
      email: newContact.email,
      phone: newContact.phone,
      position: newContact.position,
      isActive: true,
      createdAt: new Date()
    };

    onChange([...contacts, contact]);
    setNewContact({ name: '', email: '', phone: '', position: '', isActive: true });
    setIsAdding(false);
  };

  const removeContact = (contactId: string) => {
    onChange(contacts.filter(c => c.id !== contactId));
  };

  const toggleActive = (contactId: string) => {
    onChange(
      contacts.map(c =>
        c.id === contactId ? { ...c, isActive: !c.isActive } : c
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Department Contacts</CardTitle>
        <CardDescription>
          Manage contacts for invoice mailing list and financial communications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contact List */}
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No financial contacts added yet
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`p-4 border rounded-lg ${
                  contact.isActive ? 'bg-white' : 'bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{contact.name}</span>
                      <span className="text-sm text-gray-500">- {contact.position}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-3 w-3" />
                      <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                        {contact.email}
                      </a>
                    </div>
                    {contact.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(contact.id)}
                      >
                        {contact.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContact(contact.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add New Contact Form */}
        {!readOnly && (
          <>
            {isAdding ? (
              <div className="space-y-3 p-4 border rounded-lg bg-blue-50">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newContactName">Name *</Label>
                    <Input
                      id="newContactName"
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newContactPosition">Position *</Label>
                    <Input
                      id="newContactPosition"
                      value={newContact.position}
                      onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                      placeholder="Financial Director"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="newContactEmail">Email *</Label>
                    <Input
                      id="newContactEmail"
                      type="email"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="jane@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="newContactPhone">Phone</Label>
                    <Input
                      id="newContactPhone"
                      type="tel"
                      value={newContact.phone}
                      onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={addContact} size="sm">
                    Add Contact
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      setNewContact({ name: '', email: '', phone: '', position: '', isActive: true });
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAdding(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Financial Contact
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

#### File: `/app/companies/[id]/debtors/new/page.tsx`

**Integrate Contact Components:**

```typescript
import { PrimaryContactForm } from '@/components/financial/PrimaryContactForm';
import { FinancialContactsManager } from '@/components/financial/FinancialContactsManager';

// In the form state, add:
const [primaryContact, setPrimaryContact] = useState<ContactPerson | undefined>();
const [financialContacts, setFinancialContacts] = useState<FinancialContact[]>([]);

// In the form JSX, add sections:
{/* After basic debtor fields */}

<PrimaryContactForm
  value={primaryContact}
  onChange={setPrimaryContact}
  errors={/* validation errors */}
/>

<FinancialContactsManager
  contacts={financialContacts}
  onChange={setFinancialContacts}
/>

// In the submit handler:
const debtorData = {
  // ... existing fields
  primaryContact,
  financialContacts
};
```

---

### Phase 4: Validation & Error Handling (Priority: MEDIUM)

#### Create: `/src/lib/validation/company-validation.ts`

```typescript
import { z } from 'zod';
import { SupportedCurrency } from '@/types/auth';

export const companyCurrencySchema = z.object({
  defaultCurrency: z.enum(['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG']),
  vatPercentage: z.number().min(0).max(100),
  allowedCurrencies: z.array(z.enum(['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG'])).optional()
});

export function validateCurrency(currency: string): currency is SupportedCurrency {
  return ['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG'].includes(currency);
}

export function validateVATPercentage(vat: number): boolean {
  return vat >= 0 && vat <= 100;
}
```

#### Create: `/src/lib/validation/contact-validation.ts`

```typescript
import { z } from 'zod';

export const contactPersonSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  position: z.string().optional()
});

export const financialContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  position: z.string().min(1, 'Position is required'),
  isActive: z.boolean(),
  createdAt: z.date()
});

export function validateFinancialContacts(contacts: unknown): boolean {
  try {
    z.array(financialContactSchema).parse(contacts);
    return true;
  } catch {
    return false;
  }
}
```

---

### Phase 5: Bank Account UI Audit (Priority: LOW)

**Need to locate and review:**
1. Find bank account management UI pages
2. Verify currency dropdown exists
3. Ensure currency is required field
4. Check if GL account mapping works correctly

**Expected Locations:**
- `/app/workspace/[companyId]/bank-accounts/*`
- `/app/admin/bank-accounts/*`
- Or integrated into bank statement pages

**Audit Checklist:**
- [ ] Can create bank account with currency
- [ ] Can edit bank account currency
- [ ] Currency shows in bank account list
- [ ] Currency is validated against company allowed currencies
- [ ] Multi-currency bank accounts display correctly

---

## File Change Summary

### Files to Create (8 new files):
1. `/src/components/financial/PrimaryContactForm.tsx`
2. `/src/components/financial/FinancialContactsManager.tsx`
3. `/src/lib/validation/company-validation.ts`
4. `/src/lib/validation/contact-validation.ts`
5. `/src/hooks/useFinancialContacts.ts` (optional helper hook)
6. `/src/lib/firebase/creditor-service.ts` updates (mirror debtor changes)

### Files to Modify (10 files):
1. `/src/types/auth.ts` - Add currency and VAT to Company
2. `/src/types/financial.ts` - Add contact types and extend Debtor/Creditor
3. `/src/lib/firebase/companies-service.ts` - Handle new Company fields
4. `/src/lib/firebase/debtor-service.ts` - Add contact management methods
5. `/src/lib/firebase/creditor-service.ts` - Add contact management methods
6. `/app/companies/[id]/edit/page.tsx` - Add currency and VAT fields
7. `/app/companies/[id]/debtors/new/page.tsx` - Add contact forms
8. `/app/companies/[id]/debtors/page.tsx` - Update list view for contacts
9. `/app/companies/[id]/creditors/new/page.tsx` - Add contact forms
10. `/app/companies/[id]/creditors/page.tsx` - Update list view for contacts

### Files Already Complete (No changes needed):
1. ✅ `/src/types/accounting/bank-account.ts` - Currency already exists
2. ✅ `/src/lib/firebase/bank-account-service.ts` - Currency handling complete
3. ✅ `/src/lib/accounting/currency-service.ts` - Already exists and functional

---

## Dependencies to Add

```json
{
  "dependencies": {
    "uuid": "^9.0.0" // For generating contact IDs
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0"
  }
}
```

---

## Data Migration Considerations

### No Immediate Migration Needed ✅

**Why:**
- All new fields are optional with defaults
- Existing records continue to work
- Fields populate on first edit

**Future Migration (Optional):**
If we want to migrate `email` and `phone` from root level to `primaryContact`:

```typescript
// Migration script (future - Phase 6+)
async function migrateDebtorContacts(companyId: string) {
  const debtors = await debtorService.getDebtors(companyId);

  for (const debtor of debtors) {
    if ((debtor.email || debtor.phone) && !debtor.primaryContact) {
      await debtorService.updateDebtor(companyId, debtor.id, {
        primaryContact: {
          name: debtor.name,
          email: debtor.email || '',
          phone: debtor.phone,
          position: 'Primary Contact'
        }
      });
    }
  }
}
```

---

## Testing Strategy

### Unit Tests Needed:
1. Company service currency validation
2. Contact validation schemas
3. Financial contact CRUD operations
4. Currency defaults application

### Integration Tests Needed:
1. Create company with currency and VAT
2. Update existing company with new fields
3. Add/update/remove financial contacts
4. Bank account currency validation

### Manual Testing Checklist:
- [ ] Create new company with USD currency and 15% VAT
- [ ] Edit existing company to add currency
- [ ] Create debtor with primary contact
- [ ] Add multiple financial contacts to debtor
- [ ] Remove financial contact
- [ ] Deactivate/reactivate financial contact
- [ ] Verify contact emails returned for mailing list
- [ ] Create bank account with matching currency
- [ ] Verify backward compatibility (old records still work)

---

## Security & Permissions

### Access Control:
- Company settings (currency, VAT): `admin` or `financial_admin` roles
- Customer/debtor contacts: `admin`, `financial_admin`, or `user` with edit permissions
- Financial contacts view: All authenticated users with company access
- Financial contacts edit: `admin` or `financial_admin` only

### Data Validation:
- Server-side validation in Firestore rules
- Client-side validation with Zod schemas
- Email format validation for all contact emails
- Currency must be in supported list
- VAT percentage must be 0-100

---

## Performance Considerations

### Firestore Reads:
- Contact data loaded with parent document (no extra reads) ✅
- Currency dropdown uses hardcoded values (no reads) ✅
- Bank account queries unchanged (currency already exists) ✅

### Optimization:
- Financial contacts array limited to reasonable size (suggest max 10)
- Index on `financialContacts.email` not needed (in-document array)
- Company currency cached in auth context

---

## Future Enhancements

### Phase 6+ Possibilities:
1. **Full Multi-Currency Exchange Rates**
   - Add `currency_rates` collection
   - Implement exchange rate update service
   - Historical rate tracking
   - Automatic transaction conversion

2. **Contact Import/Export**
   - CSV import for bulk contact addition
   - Export contact list for external systems

3. **Contact Communication History**
   - Track emails sent to financial contacts
   - Invoice delivery confirmation
   - Payment reminders log

4. **Smart Contact Suggestions**
   - Auto-detect contact info from invoice uploads
   - Suggest contacts based on email domain

5. **Multi-VAT Support**
   - Different VAT rates for different product categories
   - VAT exemptions by customer type
   - Regional VAT overrides

---

## Risk Assessment

### Low Risk:
- ✅ Adding optional fields to Company
- ✅ Bank account currency (already exists)
- ✅ Backward compatibility (defaults provided)

### Medium Risk:
- ⚠️ Contact array size growth (mitigate with UI limits)
- ⚠️ Email validation for mailing lists (handle bounces)
- ⚠️ Currency changes affecting existing transactions (prevent if transactions exist)

### High Risk:
- ❌ None identified

---

## Success Criteria

### Must Have (MVP):
- [x] Company can set default currency
- [x] Company can set VAT percentage
- [x] Customer can have primary contact person
- [x] Customer can have multiple financial contacts
- [x] Financial contacts can be added/edited/removed
- [x] Contact emails can be retrieved for mailing lists
- [x] Bank accounts already support currency ✅
- [x] All changes backward compatible

### Should Have:
- [ ] Currency validation against allowed list
- [ ] Financial contact deactivation (soft delete)
- [ ] Contact email validation
- [ ] UI for managing contacts in existing customers

### Nice to Have:
- [ ] Contact import/export
- [ ] Email format validation with suggestions
- [ ] Contact communication history

---

## Implementation Timeline Estimate

**Total Estimated Time: 12-16 hours**

- **Phase 1** (Type Definitions): 1-2 hours
- **Phase 2** (Service Layer): 3-4 hours
- **Phase 3** (UI Components): 5-7 hours
- **Phase 4** (Validation): 1-2 hours
- **Phase 5** (Bank UI Audit): 1 hour
- **Testing & Refinement**: 2-3 hours

**Recommended Approach:**
- Day 1: Phases 1 & 2 (Types + Services)
- Day 2: Phase 3 Part 1 (Company Settings UI)
- Day 3: Phase 3 Part 2 (Contact Management UI)
- Day 4: Phases 4 & 5 + Testing

---

## Next Steps

1. **Review & Approve Plan** ✅ (You are here)
2. **Create Verification Checklist** (Next document)
3. **Determine Agent Coordination Strategy** (Next document)
4. **Begin Implementation** (Phase 1: Types)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-08
**Status:** Draft - Awaiting Review
