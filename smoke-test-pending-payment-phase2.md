# 🧪 Smoke Test Guide: Pending Payment System (Phase 2)

**Status**: Phase 2 Complete - Ready for Testing
**Date**: 2025-10-12
**Duration**: ~30-45 minutes
**Prerequisites**: Phase 1 Entity Matching must be working

---

## 📋 Overview

Phase 2 implements the **Pending Payment System** that manages unallocated customer/supplier payments from bank transactions. This system:

- Creates pending payment records from matched entities
- Tracks payment allocation to invoices/bills
- Manages payment status lifecycle
- Supports credit note conversion for over-payments
- Provides summary statistics and filtering

---

## ✅ Pre-Test Checklist

- [ ] Development server is running (`npm run dev`)
- [ ] Firebase emulators are running (if testing locally)
- [ ] Browser console is open for log monitoring
- [ ] You have test company, debtors, creditors, and invoices set up
- [ ] Phase 1 Entity Matching services are working

---

## 🧪 Test Suite 1: TypeScript Interfaces & Types

### Test 1.1: Import Pending Payment Types

**File**: Any TypeScript file
**Action**: Test imports

```typescript
import {
  PendingPayment,
  PaymentAllocation,
  PaymentStatus,
  PaymentEntityType,
  CreatePendingPaymentOptions,
  AllocatePaymentOptions,
  PendingPaymentFilter,
} from '@/types/ai/pending-payment';
```

**Expected Result**:
- ✅ No TypeScript errors
- ✅ All types are properly recognized
- ✅ Intellisense shows all interface properties

### Test 1.2: Verify Type Definitions

**Action**: Create test variables

```typescript
const status: PaymentStatus = 'pending'; // Should autocomplete: 'pending' | 'partially-allocated' | 'fully-allocated' | 'credit-note'
const entityType: PaymentEntityType = 'debtor'; // Should autocomplete: 'debtor' | 'creditor'
```

**Expected Result**:
- ✅ Autocomplete shows all valid values
- ✅ No TypeScript errors

---

## 🧪 Test Suite 2: PendingPaymentService - CREATE Operations

### Test 2.1: Create Pending Payment for Customer (Debtor)

**File**: Create test file or use console
**Action**: Create pending payment

```typescript
import { pendingPaymentService } from '@/lib/accounting/pending-payment-service';

// Create pending payment for customer
const payment = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'debtor',
  entityId: 'debtor-id-123',
  entityName: 'ABC Company',
  matchConfidence: 95,
  matchedField: 'name',
  matchMethod: 'exact',
  amount: 5000.00,
  transactionDate: new Date('2025-10-01'),
  description: 'Payment from ABC Company',
  bankReference: 'REF123456',
  bankAccountId: 'bank-account-id',
  suggestedDocumentId: 'invoice-id-456',
  suggestedDocumentNumber: 'INV-2025-001',
  suggestedDocumentConfidence: 90,
  suggestedDocumentReasons: ['Exact amount match', 'Recent invoice'],
  notes: 'Test pending payment',
});

console.log('Created pending payment:', payment);
```

**Expected Console Output**:
```
[PendingPaymentService] Creating pending payment for debtor: ABC Company
[PendingPaymentService] Created pending payment: <payment-id>
  Entity: ABC Company (debtor)
  Amount: R5000.00
  Match Confidence: 95%
  Suggested Document: INV-2025-001 (90% confidence)
```

**Expected Result**:
- ✅ Pending payment created successfully
- ✅ `payment.id` exists
- ✅ `payment.status` is `'pending'`
- ✅ `payment.allocatedAmount` is `0`
- ✅ `payment.remainingAmount` equals `payment.amount`
- ✅ `payment.allocations` is empty array
- ✅ Suggested invoice details are stored

**Firestore Verification**:
- Navigate to Firebase Console → Firestore
- Go to `companies/{companyId}/pendingPayments`
- Verify the document exists with correct data

### Test 2.2: Create Pending Payment for Supplier (Creditor)

**Action**: Create pending payment for supplier

```typescript
const supplierPayment = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'creditor',
  entityId: 'creditor-id-789',
  entityName: 'Eskom',
  matchConfidence: 88,
  matchedField: 'name',
  matchMethod: 'fuzzy',
  amount: -1500.00, // Negative for payments out
  transactionDate: new Date('2025-10-05'),
  description: 'Payment to Eskom for electricity',
  bankReference: 'ESKOM-OCT',
});

console.log('Created supplier payment:', supplierPayment);
```

**Expected Result**:
- ✅ Creditor pending payment created
- ✅ Amount is negative (payment out)
- ✅ No suggested document (bills module not yet implemented)

---

## 🧪 Test Suite 3: PendingPaymentService - READ Operations

### Test 3.1: Get Pending Payment by ID

**Action**: Retrieve specific pending payment

```typescript
const retrieved = await pendingPaymentService.getPendingPayment(
  'your-company-id',
  payment.id
);

console.log('Retrieved payment:', retrieved);
```

**Expected Result**:
- ✅ Payment retrieved successfully
- ✅ All fields match created payment
- ✅ Returns `null` for non-existent ID

### Test 3.2: Get All Pending Payments

**Action**: Get all pending payments for company

```typescript
const allPayments = await pendingPaymentService.getPendingPayments('your-company-id');

console.log(`Found ${allPayments.length} pending payments`);
console.log('All payments:', allPayments);
```

**Expected Console Output**:
```
[PendingPaymentService] Getting pending payments for company: <company-id>
[PendingPaymentService] Found 2 pending payments
```

**Expected Result**:
- ✅ Returns array of all pending payments
- ✅ Sorted by `transactionDate` descending (newest first)
- ✅ Includes both debtor and creditor payments

### Test 3.3: Filter by Entity Type

**Action**: Get only customer payments

```typescript
const debtorPayments = await pendingPaymentService.getPendingPayments('your-company-id', {
  entityType: 'debtor',
});

console.log(`Debtor payments: ${debtorPayments.length}`);
```

**Expected Result**:
- ✅ Returns only debtor payments
- ✅ Excludes creditor payments

### Test 3.4: Filter by Status

**Action**: Get only pending/unallocated payments

```typescript
const pendingOnly = await pendingPaymentService.getPendingPayments('your-company-id', {
  status: 'pending',
});

console.log(`Pending payments: ${pendingOnly.length}`);
```

**Expected Result**:
- ✅ Returns only payments with status 'pending'
- ✅ Excludes partially/fully allocated payments

### Test 3.5: Filter by Entity ID

**Action**: Get payments for specific customer

```typescript
const customerPayments = await pendingPaymentService.getPendingPaymentsByEntity(
  'your-company-id',
  'debtor',
  'debtor-id-123'
);

console.log(`Payments for ABC Company: ${customerPayments.length}`);
```

**Expected Result**:
- ✅ Returns only payments for specific entity
- ✅ Only includes pending and partially-allocated payments

### Test 3.6: Get Summary Statistics

**Action**: Get payment summary

```typescript
const summary = await pendingPaymentService.getPendingPaymentSummary('your-company-id');

console.log('Payment Summary:', summary);
```

**Expected Result**:
```javascript
{
  totalCount: 2,
  totalPendingAmount: 5000.00,
  totalPartiallyAllocatedAmount: 0,
  totalFullyAllocatedAmount: 0,
  totalCreditNotesAmount: 0,
  countByEntityType: { debtor: 1, creditor: 1 },
  amountByEntityType: { debtor: 5000.00, creditor: -1500.00 },
  oldestPaymentDate: Date(...),
  newestPaymentDate: Date(...)
}
```

---

## 🧪 Test Suite 4: Payment Allocation

### Test 4.1: Allocate Full Payment to Invoice

**Prerequisites**: Create a test invoice with `amountDue` = 5000.00

**Action**: Allocate entire payment to invoice

```typescript
const allocationResult = await pendingPaymentService.allocatePayment({
  pendingPaymentId: payment.id,
  documentId: 'invoice-id-456',
  documentNumber: 'INV-2025-001',
  allocatedAmount: 5000.00,
  allocatedBy: 'your-user-id',
  notes: 'Full payment allocation',
});

console.log('Allocation result:', allocationResult);
```

**Expected Console Output**:
```
[PendingPaymentService] Allocating payment: <payment-id>
  Document: INV-2025-001
  Amount: R5000.00
[PendingPaymentService] Payment allocated successfully
  New Status: fully-allocated
  Remaining: R0.00
```

**Expected Result**:
- ✅ `allocationResult.success` is `true`
- ✅ `allocationResult.newStatus` is `'fully-allocated'`
- ✅ `allocationResult.remainingAmount` is `0`
- ✅ Updated payment has one allocation
- ✅ Invoice `amountDue` reduced to 0
- ✅ Invoice `status` changed to `'paid'`

**Firestore Verification**:
- Check `pendingPayments/{paymentId}`:
  - `status`: `'fully-allocated'`
  - `allocatedAmount`: `5000.00`
  - `remainingAmount`: `0`
  - `allocations`: array with 1 item
- Check `invoices/{invoiceId}`:
  - `amountDue`: `0`
  - `status`: `'paid'`

### Test 4.2: Allocate Partial Payment to Invoice

**Prerequisites**: Create another pending payment for 3000.00 and invoice with amountDue = 5000.00

**Action**: Allocate partial payment

```typescript
const partialPayment = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'debtor',
  entityId: 'debtor-id-123',
  entityName: 'ABC Company',
  matchConfidence: 90,
  amount: 3000.00,
  transactionDate: new Date('2025-10-10'),
  description: 'Partial payment from ABC',
});

const result = await pendingPaymentService.allocatePayment({
  pendingPaymentId: partialPayment.id,
  documentId: 'invoice-id-789',
  documentNumber: 'INV-2025-002',
  allocatedAmount: 3000.00,
  allocatedBy: 'your-user-id',
});
```

**Expected Result**:
- ✅ `result.newStatus` is `'fully-allocated'` (full payment used)
- ✅ Invoice `amountDue` reduced from 5000 to 2000
- ✅ Invoice `status` changed to `'partially-paid'`

### Test 4.3: Allocate to Multiple Invoices

**Prerequisites**: Create payment for 10000.00 and two invoices with amountDue 6000 and 4000

**Action**: Allocate to multiple invoices

```typescript
const largePayment = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'debtor',
  entityId: 'debtor-id-123',
  entityName: 'ABC Company',
  matchConfidence: 92,
  amount: 10000.00,
  transactionDate: new Date('2025-10-12'),
  description: 'Large payment from ABC',
});

const multiResult = await pendingPaymentService.allocatePaymentMultiple(
  'your-company-id',
  largePayment.id,
  [
    { documentId: 'invoice-1', documentNumber: 'INV-001', allocatedAmount: 6000.00 },
    { documentId: 'invoice-2', documentNumber: 'INV-002', allocatedAmount: 4000.00 },
  ],
  'your-user-id'
);

console.log('Multi-allocation result:', multiResult);
```

**Expected Result**:
- ✅ Both allocations succeed
- ✅ Payment status is `'fully-allocated'`
- ✅ Payment has 2 allocations in array
- ✅ Both invoices are fully paid

### Test 4.4: Validation - Exceed Remaining Amount

**Action**: Try to allocate more than remaining

```typescript
const payment4 = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'debtor',
  entityId: 'debtor-id-123',
  entityName: 'ABC Company',
  matchConfidence: 85,
  amount: 1000.00,
  transactionDate: new Date(),
  description: 'Small payment',
});

const result = await pendingPaymentService.allocatePayment({
  pendingPaymentId: payment4.id,
  documentId: 'invoice-x',
  documentNumber: 'INV-X',
  allocatedAmount: 1500.00, // More than payment amount!
  allocatedBy: 'your-user-id',
});

console.log('Over-allocation result:', result);
```

**Expected Result**:
- ✅ `result.success` is `false`
- ✅ `result.error` contains message about exceeding remaining amount
- ✅ No changes to payment or invoice

### Test 4.5: Validation - Negative Allocation

**Action**: Try negative allocation

```typescript
const result = await pendingPaymentService.allocatePayment({
  pendingPaymentId: payment4.id,
  documentId: 'invoice-y',
  documentNumber: 'INV-Y',
  allocatedAmount: -100.00, // Negative!
  allocatedBy: 'your-user-id',
});
```

**Expected Result**:
- ✅ `result.success` is `false`
- ✅ `result.error` contains "must be greater than zero"

---

## 🧪 Test Suite 5: Credit Note Conversion

### Test 5.1: Convert Over-Payment to Credit Note

**Prerequisites**: Create payment with remaining unallocated amount

**Action**: Convert to credit note

```typescript
const overPayment = await pendingPaymentService.createPendingPayment({
  companyId: 'your-company-id',
  createdBy: 'your-user-id',
  entityType: 'debtor',
  entityId: 'debtor-id-123',
  entityName: 'ABC Company',
  matchConfidence: 88,
  amount: 5500.00,
  transactionDate: new Date(),
  description: 'Over-payment from ABC',
});

// Allocate partial amount
await pendingPaymentService.allocatePayment({
  pendingPaymentId: overPayment.id,
  documentId: 'invoice-z',
  documentNumber: 'INV-Z',
  allocatedAmount: 5000.00,
  allocatedBy: 'your-user-id',
});

// Now convert remaining 500.00 to credit note
const creditNoteResult = await pendingPaymentService.convertToCreditNote({
  pendingPaymentId: overPayment.id,
  createdBy: 'your-user-id',
  amount: 500.00,
  reason: 'Customer over-payment',
});

console.log('Credit note result:', creditNoteResult);
```

**Expected Console Output**:
```
[PendingPaymentService] Converting to credit note: <payment-id>
[PendingPaymentService] Converted to credit note: CN-<timestamp>
```

**Expected Result**:
- ✅ Payment status changed to `'credit-note'`
- ✅ `creditNoteNumber` assigned (e.g., "CN-1728691234567")
- ✅ `creditNoteDate` set to current timestamp
- ✅ Notes updated with reason

### Test 5.2: Helper Method - canConvertToCreditNote

**Action**: Test validation helper

```typescript
// Should be true for debtor payments with remaining amount
const canConvert1 = pendingPaymentService.canConvertToCreditNote(overPayment);
console.log('Can convert over-payment:', canConvert1); // true

// Should be false for creditor payments
const canConvert2 = pendingPaymentService.canConvertToCreditNote(supplierPayment);
console.log('Can convert supplier payment:', canConvert2); // false

// Should be false for fully allocated payments
const fullyAllocated = { ...overPayment, remainingAmount: 0, status: 'fully-allocated' };
const canConvert3 = pendingPaymentService.canConvertToCreditNote(fullyAllocated);
console.log('Can convert fully allocated:', canConvert3); // false
```

**Expected Result**:
- ✅ `canConvert1` is `true`
- ✅ `canConvert2` is `false` (creditors can't have credit notes)
- ✅ `canConvert3` is `false` (no remaining amount)

---

## 🧪 Test Suite 6: DELETE Operations

### Test 6.1: Soft Delete Pending Payment

**Action**: Soft delete a payment

```typescript
const success = await pendingPaymentService.deletePendingPayment(
  'your-company-id',
  payment.id,
  'your-user-id'
);

console.log('Soft delete success:', success);

// Try to get deleted payment
const deleted = await pendingPaymentService.getPendingPayment('your-company-id', payment.id);
console.log('Deleted payment (without includeDeleted):', deleted); // Should return null

// Get with includeDeleted filter
const allIncludingDeleted = await pendingPaymentService.getPendingPayments('your-company-id', {
  includeDeleted: true,
});
console.log('All payments including deleted:', allIncludingDeleted.length);
```

**Expected Result**:
- ✅ `success` is `true`
- ✅ `deleted` is `null` (filtered out by default)
- ✅ Payment appears in results when `includeDeleted: true`
- ✅ Payment has `isDeleted: true` in Firestore

### Test 6.2: Permanent Delete (Admin Only)

**Action**: Permanently delete payment

```typescript
const permanentSuccess = await pendingPaymentService.permanentlyDeletePendingPayment(
  'your-company-id',
  payment.id
);

console.log('Permanent delete success:', permanentSuccess);

// Verify document no longer exists
const gone = await pendingPaymentService.getPendingPayment('your-company-id', payment.id);
console.log('After permanent delete:', gone); // null
```

**Expected Result**:
- ✅ Document removed from Firestore
- ✅ Cannot be retrieved even with `includeDeleted: true`

---

## 🧪 Test Suite 7: Helper Methods

### Test 7.1: canAllocate Helper

**Action**: Test allocation validation

```typescript
const pendingPayment = { status: 'pending', remainingAmount: 1000, isDeleted: false };
const partiallyAllocated = { status: 'partially-allocated', remainingAmount: 500, isDeleted: false };
const fullyAllocated = { status: 'fully-allocated', remainingAmount: 0, isDeleted: false };
const deletedPayment = { status: 'pending', remainingAmount: 1000, isDeleted: true };

console.log('Can allocate pending:', pendingPaymentService.canAllocate(pendingPayment)); // true
console.log('Can allocate partial:', pendingPaymentService.canAllocate(partiallyAllocated)); // true
console.log('Can allocate full:', pendingPaymentService.canAllocate(fullyAllocated)); // false
console.log('Can allocate deleted:', pendingPaymentService.canAllocate(deletedPayment)); // false
```

**Expected Result**:
- ✅ Pending and partially-allocated payments can be allocated
- ✅ Fully-allocated and deleted payments cannot be allocated

---

## 🧪 Test Suite 8: Firestore Security Rules

### Test 8.1: Read Access - Company Isolation

**Action**: Try to read pending payments from different company

**Setup**: Create pending payment for Company A, try to read as user from Company B

**Expected Result**:
- ✅ User from Company A can read pending payments
- ❌ User from Company B cannot read pending payments
- ✅ Admin/developer can read all pending payments

### Test 8.2: Create Access - Validation

**Action**: Try to create pending payment with invalid data

**Test Cases**:
1. Wrong `companyId` (user's company ≠ payment's company)
2. Wrong `createdBy` (user ID ≠ payment's createdBy)

**Expected Result**:
- ❌ Both create attempts should fail
- ✅ Only matching companyId and createdBy should succeed

### Test 8.3: Update Access - Protected Fields

**Action**: Try to update protected fields

```typescript
// Try to change core fields (should fail)
await updateDoc(paymentRef, {
  amount: 9999.00, // Protected!
  entityId: 'different-entity', // Protected!
  transactionDate: new Date(), // Protected!
});
```

**Expected Result**:
- ❌ Update should be rejected by security rules
- ✅ Updating allocations, status, notes should succeed

### Test 8.4: Delete Access - Admin Only

**Action**: Try to delete as regular user vs admin

**Expected Result**:
- ❌ Regular user cannot delete (unless company admin)
- ✅ Company admin can delete
- ✅ Global admin can delete

---

## 🧪 Test Suite 9: Integration with Entity Matching

### Test 9.1: Create Pending Payment from DebtorMatch

**Action**: Use entity matching + pending payment together

```typescript
import { DebtorMatchingService } from '@/lib/ai/debtor-matching-service';
import { pendingPaymentService } from '@/lib/accounting/pending-payment-service';

const debtorMatcher = new DebtorMatchingService();

// Step 1: Match entity from bank transaction
const match = await debtorMatcher.findMatchingDebtor(
  'your-company-id',
  'Payment from ABC Company - INV-001',
  5000.00,
  new Date()
);

console.log('Debtor match:', match);

// Step 2: Create pending payment from match
if (match) {
  const pendingPayment = await pendingPaymentService.createPendingPayment({
    companyId: 'your-company-id',
    createdBy: 'your-user-id',
    entityType: 'debtor',
    entityId: match.debtor.id,
    entityName: match.debtor.name,
    matchConfidence: match.confidence,
    matchedField: match.matchedField,
    matchMethod: match.matchMethod,
    amount: 5000.00,
    transactionDate: new Date(),
    description: 'Payment from ABC Company - INV-001',
    suggestedDocumentId: match.suggestedInvoice?.invoice.id,
    suggestedDocumentNumber: match.suggestedInvoice?.invoice.invoiceNumber,
    suggestedDocumentConfidence: match.suggestedInvoice?.confidence,
    suggestedDocumentReasons: match.suggestedInvoice?.matchReasons,
  });

  console.log('Created pending payment from match:', pendingPayment);
}
```

**Expected Result**:
- ✅ Entity matching finds correct debtor
- ✅ Suggested invoice is identified
- ✅ Pending payment created with all match details
- ✅ High confidence match (>80%)

### Test 9.2: Create Pending Payment from CreditorMatch

**Action**: Same workflow for creditor

```typescript
import { CreditorMatchingService } from '@/lib/ai/creditor-matching-service';

const creditorMatcher = new CreditorMatchingService();

const match = await creditorMatcher.findMatchingCreditor(
  'your-company-id',
  'Eskom payment for electricity',
  -1500.00,
  new Date()
);

if (match) {
  const pendingPayment = await pendingPaymentService.createPendingPayment({
    companyId: 'your-company-id',
    createdBy: 'your-user-id',
    entityType: 'creditor',
    entityId: match.creditor.id,
    entityName: match.creditor.name,
    matchConfidence: match.confidence,
    matchedField: match.matchedField,
    matchMethod: match.matchMethod,
    amount: -1500.00,
    transactionDate: new Date(),
    description: 'Eskom payment for electricity',
  });

  console.log('Created supplier payment from match:', pendingPayment);
}
```

**Expected Result**:
- ✅ Creditor matched successfully
- ✅ Creditor type boost applied if applicable
- ✅ Negative amount for payment out

---

## 📊 Success Criteria

### Phase 2 Complete When:

- ✅ All TypeScript interfaces compile without errors
- ✅ PendingPaymentService CRUD operations work correctly
- ✅ Payment allocation updates both payment and invoice
- ✅ Payment status lifecycle works (pending → partially-allocated → fully-allocated)
- ✅ Credit note conversion works for over-payments
- ✅ Summary statistics are accurate
- ✅ Firestore security rules enforce multi-tenant isolation
- ✅ Integration with Phase 1 entity matching works seamlessly
- ✅ All validation rules prevent invalid operations
- ✅ Soft delete and permanent delete work correctly

---

## 🐛 Common Issues & Troubleshooting

### Issue 1: "Pending payment not found"

**Cause**: Wrong companyId in path or payment ID doesn't exist

**Fix**:
- Verify companyId matches the company in the pending payment document
- Check that payment ID is correct
- Ensure payment wasn't permanently deleted

### Issue 2: "Allocation amount exceeds remaining amount"

**Cause**: Trying to allocate more than `remainingAmount`

**Fix**:
- Check `payment.remainingAmount` before allocating
- Ensure previous allocations are accounted for

### Issue 3: Invoice not updating after allocation

**Cause**: Invoice service integration not working

**Fix**:
- Verify invoice exists in Firestore
- Check that invoice has `amountDue` field
- Ensure batch write commits successfully

### Issue 4: Security rules blocking operation

**Cause**: User doesn't belong to company or lacks permissions

**Fix**:
- Verify user's `companyId` matches pending payment's `companyId`
- Check user roles (admin, financial_admin)
- Review Firestore security rules for `pendingPayments` collection

### Issue 5: TypeScript import errors

**Cause**: Types not exported correctly

**Fix**:
```typescript
// Use correct import paths
import { pendingPaymentService } from '@/lib/accounting/pending-payment-service';
import { PendingPayment } from '@/types/ai/pending-payment';
```

---

## 📈 Performance Benchmarks

### Expected Performance:

- **Create pending payment**: <100ms
- **Get all pending payments**: <300ms (up to 100 records)
- **Allocate payment**: <200ms (includes invoice update)
- **Get summary statistics**: <500ms (up to 500 records)
- **Filter by entity**: <200ms

---

## ✅ Final Verification Checklist

After completing all tests:

- [ ] All CRUD operations working
- [ ] Payment allocation updates both payment and invoice
- [ ] Status lifecycle correct (pending → partially → fully)
- [ ] Credit note conversion works
- [ ] Summary statistics accurate
- [ ] Firestore security rules enforced
- [ ] Integration with entity matching works
- [ ] All validation rules prevent bad data
- [ ] Console logs provide useful debugging info
- [ ] TypeScript types are correct and compile
- [ ] No runtime errors in browser console
- [ ] Firestore collections created correctly

---

## 🎯 Next Steps

**After Phase 2 is verified**:

→ **Proceed to Phase 3: Invoice Matching & Suggestions** (4-5 hours)

Phase 3 will enhance the invoice suggestion logic with:
- Multi-invoice matching algorithms
- Partial payment distribution
- Payment term analysis
- Historical payment pattern learning

---

**Test completed by**: _____________
**Date**: _____________
**Result**: ✅ Pass / ❌ Fail
**Notes**: _____________
