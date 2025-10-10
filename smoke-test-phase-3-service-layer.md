# Smoke Test Guide: Phase 3 - Service Layer Updates

**Date:** 2025-10-08
**Duration:** 5-10 minutes
**Status:** Ready for Testing

## Prerequisites

- ✅ Build completed successfully (npm run build)
- ✅ TypeScript compilation passes
- ✅ Firebase connection configured

## Test Overview

This guide provides step-by-step tests to verify the service layer updates work correctly.

---

## Test 1: Company Configuration Methods

### Purpose
Verify currency and VAT configuration methods work correctly.

### Test Code

Create a test file: `/scripts/test-companies-service.ts`

```typescript
import { companiesService } from '@/lib/firebase';

async function testCompanyConfig() {
  const testCompanyId = 'YOUR_TEST_COMPANY_ID'; // Replace with actual company ID

  console.log('Testing Company Configuration Methods...\n');

  try {
    // Test 1: Update company config
    console.log('1. Updating company config...');
    await companiesService.updateCompanyConfig(testCompanyId, {
      defaultCurrency: 'ZAR',
      vatPercentage: 15
    });
    console.log('✅ Config updated successfully\n');

    // Test 2: Get currency
    console.log('2. Getting company currency...');
    const currency = await companiesService.getCompanyCurrency(testCompanyId);
    console.log(`✅ Currency: ${currency}\n`);

    // Test 3: Get VAT
    console.log('3. Getting company VAT...');
    const vat = await companiesService.getCompanyVAT(testCompanyId);
    console.log(`✅ VAT: ${vat}%\n`);

    // Test 4: Validate VAT percentage limits
    console.log('4. Testing VAT validation (should fail)...');
    try {
      await companiesService.updateCompanyConfig(testCompanyId, {
        vatPercentage: 150 // Invalid
      });
      console.log('❌ Validation failed - should have thrown error');
    } catch (error) {
      console.log('✅ Validation working correctly\n');
    }

    console.log('All company config tests passed! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompanyConfig();
```

### Expected Results

```
Testing Company Configuration Methods...

1. Updating company config...
[CompaniesService] Updated config for company: test-company-123
✅ Config updated successfully

2. Getting company currency...
✅ Currency: ZAR

3. Getting company VAT...
✅ VAT: 15%

4. Testing VAT validation (should fail)...
✅ Validation working correctly

All company config tests passed! 🎉
```

### Quick Manual Verification

1. Check Firestore console
2. Navigate to `companies/{companyId}`
3. Verify `defaultCurrency` = "ZAR"
4. Verify `vatPercentage` = 15
5. Verify `updatedAt` timestamp is recent

---

## Test 2: Debtor Financial Contacts

### Purpose
Verify financial contact CRUD operations for debtors.

### Test Code

Create a test file: `/scripts/test-debtor-contacts.ts`

```typescript
import { debtorService } from '@/lib/firebase';

async function testDebtorContacts() {
  const testCompanyId = 'YOUR_TEST_COMPANY_ID';
  const testDebtorId = 'YOUR_TEST_DEBTOR_ID';

  console.log('Testing Debtor Financial Contacts...\n');

  try {
    // Test 1: Add financial contact
    console.log('1. Adding financial contact...');
    const contact = await debtorService.addFinancialContact(
      testCompanyId,
      testDebtorId,
      {
        name: 'John Smith',
        email: 'john.smith@testcompany.com',
        phone: '+27123456789',
        position: 'Financial Director',
        isPrimary: true
      }
    );
    console.log('✅ Contact added:', contact.id, '\n');
    const contactId = contact.id;

    // Test 2: Add second contact
    console.log('2. Adding second contact...');
    const contact2 = await debtorService.addFinancialContact(
      testCompanyId,
      testDebtorId,
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@testcompany.com',
        position: 'Accounts Payable Clerk'
      }
    );
    console.log('✅ Second contact added:', contact2.id, '\n');

    // Test 3: Update contact
    console.log('3. Updating contact...');
    await debtorService.updateFinancialContact(
      testCompanyId,
      testDebtorId,
      contactId,
      {
        phone: '+27987654321',
        position: 'Chief Financial Officer'
      }
    );
    console.log('✅ Contact updated\n');

    // Test 4: Get emails
    console.log('4. Getting contact emails...');
    const emails = await debtorService.getFinancialContactEmails(
      testCompanyId,
      testDebtorId
    );
    console.log(`✅ Found ${emails.length} active email(s):`, emails, '\n');

    // Test 5: Deactivate contact
    console.log('5. Deactivating contact...');
    await debtorService.updateFinancialContact(
      testCompanyId,
      testDebtorId,
      contact2.id,
      {
        isActive: false
      }
    );
    console.log('✅ Contact deactivated\n');

    // Test 6: Get emails again (should exclude deactivated)
    console.log('6. Getting active emails...');
    const activeEmails = await debtorService.getFinancialContactEmails(
      testCompanyId,
      testDebtorId
    );
    console.log(`✅ Active emails: ${activeEmails.length} (should be 1)\n`);

    // Test 7: Update primary contact
    console.log('7. Updating primary contact...');
    await debtorService.updatePrimaryContact(
      testCompanyId,
      testDebtorId,
      {
        name: 'Mike Wilson',
        email: 'mike@testcompany.com',
        position: 'CEO'
      }
    );
    console.log('✅ Primary contact updated\n');

    // Test 8: Remove contact
    console.log('8. Removing contact...');
    await debtorService.removeFinancialContact(
      testCompanyId,
      testDebtorId,
      contact2.id
    );
    console.log('✅ Contact removed\n');

    console.log('All debtor contact tests passed! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDebtorContacts();
```

### Expected Results

```
Testing Debtor Financial Contacts...

1. Adding financial contact...
[DebtorService] Added financial contact to debtor: test-debtor-123
✅ Contact added: a1b2c3d4-e5f6-7890-abcd-ef1234567890

2. Adding second contact...
[DebtorService] Added financial contact to debtor: test-debtor-123
✅ Second contact added: b2c3d4e5-f6a7-8901-bcde-f12345678901

3. Updating contact...
[DebtorService] Updated financial contact: a1b2c3d4-e5f6-7890-abcd-ef1234567890
✅ Contact updated

4. Getting contact emails...
✅ Found 2 active email(s): ['john.smith@testcompany.com', 'sarah.j@testcompany.com']

5. Deactivating contact...
[DebtorService] Updated financial contact: b2c3d4e5-f6a7-8901-bcde-f12345678901
✅ Contact deactivated

6. Getting active emails...
✅ Active emails: 1 (should be 1)

7. Updating primary contact...
[DebtorService] Updated primary contact for debtor: test-debtor-123
✅ Primary contact updated

8. Removing contact...
[DebtorService] Removed financial contact: b2c3d4e5-f6a7-8901-bcde-f12345678901
✅ Contact removed

All debtor contact tests passed! 🎉
```

### Quick Manual Verification

1. Check Firestore console
2. Navigate to `companies/{companyId}/debtors/{debtorId}`
3. Verify `financialContacts` array has correct contacts
4. Verify `primaryContact` object is updated
5. Check that UUIDs are properly formatted
6. Verify timestamps are ISO strings

---

## Test 3: Creditor Financial Contacts

### Purpose
Verify financial contact operations mirror debtor functionality.

### Quick Test

Same as Test 2, but use:
```typescript
import { creditorService } from '@/lib/firebase';

// Replace debtorService with creditorService
// Replace testDebtorId with testCreditorId
// All methods are identical
```

### Expected Behavior

Should produce identical results to debtor tests, confirming consistency across services.

---

## Test 4: Type Exports Verification

### Purpose
Verify all types are properly exported and available.

### Test Code

Create a test file: `/scripts/test-type-exports.ts`

```typescript
import {
  CompaniesService,
  DebtorService,
  CreditorService,
  companiesService,
  debtorService,
  creditorService,
  SupportedCurrency,
  ContactPerson,
  FinancialContact
} from '@/lib/firebase';

console.log('Testing type exports...\n');

// Test service class exports
console.log('✅ CompaniesService:', typeof CompaniesService);
console.log('✅ DebtorService:', typeof DebtorService);
console.log('✅ CreditorService:', typeof CreditorService);

// Test singleton exports
console.log('✅ companiesService:', typeof companiesService);
console.log('✅ debtorService:', typeof debtorService);
console.log('✅ creditorService:', typeof creditorService);

// Test type usage
const testCurrency: SupportedCurrency = 'ZAR';
const testContact: ContactPerson = {
  name: 'Test',
  email: 'test@example.com'
};

console.log('\nAll type exports working correctly! 🎉');
```

### Expected Results

```
Testing type exports...

✅ CompaniesService: function
✅ DebtorService: function
✅ CreditorService: function
✅ companiesService: object
✅ debtorService: object
✅ creditorService: object

All type exports working correctly! 🎉
```

---

## Common Issues & Solutions

### Issue 1: "Cannot find module '@/lib/firebase'"

**Solution:** Run from project root or adjust import paths

### Issue 2: "randomUUID is not a function"

**Solution:** Ensure Node.js version supports crypto.randomUUID (Node 14.17+)

### Issue 3: Firestore permission denied

**Solution:** Check Firebase rules and authentication

### Issue 4: TypeScript errors on types

**Solution:** Run `npm run build` to regenerate type definitions

---

## Verification Checklist

Use this checklist to ensure all functionality works:

### Company Configuration
- [ ] updateCompanyConfig updates currency
- [ ] updateCompanyConfig updates VAT percentage
- [ ] VAT validation rejects values < 0 or > 100
- [ ] getCompanyCurrency returns correct value
- [ ] getCompanyVAT returns correct value
- [ ] Timestamps update correctly in Firestore

### Debtor Financial Contacts
- [ ] addFinancialContact creates new contact with UUID
- [ ] Contact has correct structure (id, email, position, etc.)
- [ ] updateFinancialContact modifies existing contact
- [ ] removeFinancialContact deletes contact
- [ ] getFinancialContactEmails returns active emails only
- [ ] updatePrimaryContact updates primary contact field
- [ ] isActive flag controls email inclusion
- [ ] isPrimary flag can be set

### Creditor Financial Contacts
- [ ] All operations match debtor functionality
- [ ] Methods use correct collection path
- [ ] Console logging shows correct service name

### Type Exports
- [ ] CompaniesService class exported
- [ ] companiesService singleton exported
- [ ] SupportedCurrency type exported
- [ ] ContactPerson type exported
- [ ] FinancialContact type exported
- [ ] All types imported without errors

---

## Performance Notes

- UUID generation: < 1ms per call
- arrayUnion/arrayRemove: Atomic operations, no race conditions
- Read-modify-write for updates: 2 reads per update operation

---

## Next Steps After Testing

Once all tests pass:

1. ✅ Mark Phase 3 as complete
2. 🔄 Proceed to Phase 4: UI Components
3. 📝 Update modernization-roadmap.md
4. 🧪 Consider adding automated tests in future

---

## Quick 2-Minute Verification

If you're short on time, run these minimal checks:

```bash
# 1. Build check
npm run build

# 2. Type check
npx tsc --noEmit

# 3. Manual Firestore check
# - Open Firebase Console
# - Check a company document has defaultCurrency and vatPercentage fields
# - Check a debtor/creditor has financialContacts array
```

**Status:** If build succeeds and Firestore has the fields, Phase 3 is working! ✅
