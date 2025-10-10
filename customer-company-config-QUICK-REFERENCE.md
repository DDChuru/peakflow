# Quick Reference Card - Customer & Company Configuration

**Last Updated:** 2025-10-08 | **Status:** Ready to Implement

---

## 🚀 Getting Started

```bash
# 1. Create feature branch
git checkout -b feature/customer-company-config

# 2. Install dependencies
npm install uuid @types/uuid

# 3. Start development server (if needed)
npm run dev
```

---

## 📋 Documents Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| `customer-company-config-SUMMARY.md` | Overview & decisions | Start here |
| `customer-company-config-implementation-plan.md` | Detailed code samples | During implementation |
| `customer-company-config-verification-checklist.md` | Testing steps | After each phase |
| `customer-company-config-coordination-strategy.md` | Agent delegation | When delegating work |

---

## 🗺️ Implementation Roadmap

### Phase 1: Types (1 hour)
```typescript
// Files to modify:
- src/types/auth.ts          // Add SupportedCurrency, extend Company
- src/types/financial.ts     // Add ContactPerson, FinancialContact

// Verify:
npm run build  // Should have no errors
```

### Phase 2: Services (4 hours)
```typescript
// Files to modify:
- src/lib/firebase/companies-service.ts   // Currency/VAT handling
- src/lib/firebase/debtor-service.ts      // Contact CRUD methods
- src/lib/firebase/creditor-service.ts    // Mirror debtor changes

// Test:
- Create company with currency
- Add financial contact to customer
```

### Phase 3: UI (5 hours)
```typescript
// Files to create:
- src/components/financial/PrimaryContactForm.tsx
- src/components/financial/FinancialContactsManager.tsx

// Files to modify:
- app/companies/[id]/edit/page.tsx        // Currency/VAT fields
- app/companies/[id]/debtors/new/page.tsx // Contact forms
- app/companies/[id]/creditors/new/page.tsx

// Test:
- Create company with currency UI
- Add contacts via UI
```

### Phase 4: Validation (2 hours)
```typescript
// Files to create:
- src/lib/validation/company-validation.ts
- src/lib/validation/contact-validation.ts

// Test:
- Invalid currency rejected
- Invalid VAT rejected
- Invalid email rejected
```

### Phase 5: Testing (2-3 hours)
```bash
# Run smoke tests
# Check verification checklist
# Test backward compatibility
```

---

## 🎯 Key Code Snippets

### Company Interface Extension
```typescript
// src/types/auth.ts
export type SupportedCurrency = 'USD' | 'ZAR' | 'EUR' | 'ZWD' | 'ZIG';

export interface Company {
  // ... existing fields
  defaultCurrency: SupportedCurrency; // NEW
  vatPercentage: number; // NEW (0-100)
  allowedCurrencies?: SupportedCurrency[]; // NEW (optional)
}
```

### Contact Types
```typescript
// src/types/financial.ts
export interface ContactPerson {
  name: string;
  email: string;
  phone?: string;
  position?: string;
}

export interface FinancialContact {
  id: string; // UUID
  name: string;
  email: string;
  phone?: string;
  position: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Debtor {
  // ... existing fields
  primaryContact?: ContactPerson; // NEW
  financialContacts: FinancialContact[]; // NEW
}
```

### Service Methods (Example)
```typescript
// src/lib/firebase/debtor-service.ts
async addFinancialContact(
  companyId: string,
  debtorId: string,
  contact: Omit<FinancialContact, 'id' | 'createdAt'>
): Promise<FinancialContact> {
  const debtor = await this.getDebtor(companyId, debtorId);
  const newContact: FinancialContact = {
    id: uuidv4(),
    ...contact,
    isActive: true,
    createdAt: new Date()
  };

  await this.updateDebtor(companyId, debtorId, {
    financialContacts: [...debtor.financialContacts, newContact]
  });

  return newContact;
}
```

---

## ✅ Quick Verification Checklist

### After Phase 1 (Types):
- [ ] `npm run build` passes
- [ ] No TypeScript errors in VS Code
- [ ] Types exported correctly

### After Phase 2 (Services):
- [ ] Can create company with currency
- [ ] Can fetch company (defaults work)
- [ ] Can add financial contact
- [ ] Can get contact emails

### After Phase 3 (UI):
- [ ] Currency dropdown visible
- [ ] VAT input visible
- [ ] Contact forms render
- [ ] Can submit forms successfully

### After Phase 4 (Validation):
- [ ] Invalid currency rejected
- [ ] VAT range enforced (0-100)
- [ ] Email validation works

### Before Deployment:
- [ ] All tests pass
- [ ] Backward compatibility verified
- [ ] Old records still work
- [ ] No console errors

---

## 🔧 Common Commands

```bash
# Build and check for errors
npm run build

# Run linter
npm run lint

# Run tests (if available)
npm test

# Check git status
git status

# Commit changes
git add .
git commit -m "feat: add customer contacts and company currency config"

# Push to remote
git push origin feature/customer-company-config
```

---

## 🐛 Troubleshooting

### TypeScript Errors
```bash
# Problem: Types not found
# Solution: Restart TS server in VS Code (Cmd+Shift+P → "Restart TS Server")

# Problem: Build fails
# Solution: Check import paths, verify all exports
```

### Firestore Errors
```bash
# Problem: Permission denied
# Solution: Check Firestore rules, verify user authentication

# Problem: Document not found
# Solution: Verify collection paths, check tenant isolation
```

### UI Issues
```bash
# Problem: Form not submitting
# Solution: Check validation schema, verify onChange handlers

# Problem: Components not rendering
# Solution: Check imports, verify props passed correctly
```

---

## 🎓 Best Practices

### Do ✅
- Test after each phase
- Commit frequently
- Use defaults for new fields
- Verify backward compatibility
- Run `npm run build` often

### Don't ❌
- Skip type definitions
- Forget to update Creditor when updating Debtor
- Allow unlimited contacts (suggest max 10)
- Change bank account types (already correct)
- Skip validation schemas

---

## 📊 Progress Tracking

Update in `project-management/modernization-roadmap.md` after each phase:

```markdown
## Active Focus: Customer & Company Configuration (X% complete)

### Completed ✅
- [x] Phase 1: Type Definitions (Day 1)
- [x] Phase 2: Service Layer (Day 1)
- [ ] Phase 3: UI Components (Day 2)
- [ ] Phase 4: Validation (Day 3)
- [ ] Phase 5: Testing (Day 4)

### 🔄 Next
- Implement PrimaryContactForm component
- Integrate into debtor pages

### ⏳ Pending
- Final testing and deployment
```

---

## 🧪 Critical Tests

### Test 1: Company Currency
```typescript
// 1. Create company with ZAR and 15% VAT
// 2. Edit to EUR and 20% VAT
// 3. Verify Firestore document
// 4. Check old companies (should have defaults)
```

### Test 2: Contact Management
```typescript
// 1. Create customer with primary contact
// 2. Add 3 financial contacts
// 3. Deactivate 1 contact
// 4. Remove 1 contact
// 5. Verify getFinancialContactEmails() returns 2 emails
```

### Test 3: Backward Compatibility
```typescript
// 1. Load existing company (should have defaults)
// 2. Load existing customer (should work)
// 3. Edit and save both (should add new fields)
// 4. Verify no errors
```

---

## 🔍 Code Locations

### Type Definitions
- `/src/types/auth.ts` - Company types
- `/src/types/financial.ts` - Debtor/Creditor/Contact types
- `/src/types/accounting/bank-account.ts` - Bank types (no changes)

### Services
- `/src/lib/firebase/companies-service.ts` - Company CRUD
- `/src/lib/firebase/debtor-service.ts` - Debtor CRUD + contacts
- `/src/lib/firebase/creditor-service.ts` - Creditor CRUD + contacts

### UI Components
- `/src/components/financial/PrimaryContactForm.tsx` - NEW
- `/src/components/financial/FinancialContactsManager.tsx` - NEW
- `/app/companies/[id]/edit/page.tsx` - Company edit form
- `/app/companies/[id]/debtors/new/page.tsx` - Debtor create form
- `/app/companies/[id]/creditors/new/page.tsx` - Creditor create form

### Validation
- `/src/lib/validation/company-validation.ts` - NEW
- `/src/lib/validation/contact-validation.ts` - NEW

---

## 📞 Need Help?

### For Implementation Details:
→ See `customer-company-config-implementation-plan.md`

### For Testing Procedures:
→ See `customer-company-config-verification-checklist.md`

### For Agent Delegation:
→ See `customer-company-config-coordination-strategy.md`

### For Architecture Questions:
→ Use Codex Orchestrator with `model_reasoning_effort="high"`

---

## ⚡ Quick Wins

**Easiest First Steps:**
1. ✅ Add types (straightforward, no dependencies)
2. ✅ Update companies service (simple field additions)
3. ✅ Add currency dropdown to company edit page

**Most Impact:**
1. 🎯 Financial contacts manager (enables invoice automation)
2. 🎯 Company currency setting (enables multi-currency)
3. 🎯 VAT configuration (enables accurate tax calculations)

---

## 🎉 When You're Done

1. ✅ Update `modernization-roadmap.md` with completion
2. ✅ Create smoke test guide (follow CLAUDE.md protocol)
3. ✅ Update this file if you found better approaches
4. ✅ Commit all changes
5. ✅ Create pull request
6. ✅ Demo to stakeholder

---

**Quick Reference Version:** 1.0
**Print this page for easy access during implementation! 📄**
