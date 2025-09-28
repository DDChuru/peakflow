# Smoke Test Guide: Ad-Hoc Invoice System

## Overview
This test guide verifies the implementation of the ad-hoc invoice system with multiple creation paths and automatic GL posting.

## Pre-Test Setup Requirements

### 1. Environment Variables
- Verify Firebase configuration is active
- Ensure user has appropriate company access and roles

### 2. Chart of Accounts Setup
- Verify Accounts Receivable account exists (`ar-default`)
- Verify Revenue accounts exist for line items
- Verify Tax Payable account exists (`tax-payable-default`)

### 3. Customer/Debtor Data
- Ensure at least one active customer/debtor exists for testing

## Test Procedures

### Phase 1: Direct Invoice Creation (Manual Path)

#### Test 1.1: Create Basic Invoice
1. **Setup**: Import invoice service
   ```typescript
   import { invoiceIntegrationService } from '@/lib/firebase';
   ```

2. **Action**: Create a direct invoice
   ```typescript
   const invoiceData = {
     customerId: 'test-customer-id',
     invoiceDate: '2024-01-15',
     paymentTerms: 30,
     source: 'manual' as const,
     currency: 'USD',
     lineItems: [
       {
         description: 'Web Development Services',
         quantity: 10,
         unitPrice: 150,
         glAccountId: 'revenue-services',
         accountCode: '4000'
       }
     ]
   };

   const result = await invoiceIntegrationService.createDirectInvoiceWithPosting(
     'company-id',
     invoiceData,
     'user-id'
   );
   ```

3. **Expected Results**:
   - Invoice created with auto-generated number (format: `INV-2024-0001`)
   - Status should be 'draft'
   - Total amount: $1,500 (10 × $150)
   - Due date: 30 days from invoice date
   - Journal entry created automatically
   - Debtor balance updated

#### Test 1.2: Verify GL Posting
1. **Action**: Check journal entry creation
2. **Expected Results**:
   - Journal entry exists with invoice ID reference
   - DR: Accounts Receivable $1,500
   - CR: Revenue Services $1,500
   - Entry status: 'posted'

### Phase 2: Quote-to-Invoice Flow

#### Test 2.1: Create Quote
1. **Action**: Create a quote
   ```typescript
   import { quoteService } from '@/lib/firebase';

   const quoteData = {
     customerId: 'test-customer-id',
     quoteDate: '2024-01-10',
     validityPeriod: 30,
     currency: 'USD',
     lineItems: [
       {
         description: 'Mobile App Development',
         quantity: 1,
         unitPrice: 5000,
         glAccountId: 'revenue-development'
       }
     ]
   };

   const quote = await quoteService.createQuote('company-id', quoteData, 'user-id');
   ```

2. **Expected Results**:
   - Quote created with auto-generated number (format: `QUO-2024-0001`)
   - Status: 'draft'
   - Valid until: 30 days from quote date

#### Test 2.2: Accept Quote and Convert to Invoice
1. **Action**: Update quote status and convert
   ```typescript
   await quoteService.updateQuoteStatus('company-id', quote.id, 'accepted', 'user-id');

   const invoiceResult = await invoiceIntegrationService.createInvoiceFromQuoteWithPosting(
     'company-id',
     quote.id,
     {
       invoiceDate: '2024-01-15',
       paymentTerms: 30
     },
     'user-id'
   );
   ```

2. **Expected Results**:
   - Quote status changes to 'converted'
   - Invoice created with quote data
   - Invoice references quote ID and number
   - GL entry posted automatically

### Phase 3: Sales Order Flow

#### Test 3.1: Create Sales Order from Quote
1. **Action**: Convert quote to sales order
   ```typescript
   import { salesOrderService } from '@/lib/firebase';

   const salesOrder = await salesOrderService.createFromQuote(
     'company-id',
     quote.id,
     {
       orderDate: '2024-01-12',
       requestedDeliveryDate: '2024-02-15'
     },
     'user-id'
   );
   ```

2. **Expected Results**:
   - Sales order created (format: `SO-2024-0001`)
   - Quote status: 'converted'
   - Sales order status: 'confirmed'

#### Test 3.2: Create Invoice from Sales Order
1. **Action**: Invoice partial quantities
   ```typescript
   const invoiceResult = await invoiceIntegrationService.createInvoiceFromSalesOrderWithPosting(
     'company-id',
     salesOrder.id,
     {
       invoiceDate: '2024-01-20',
       lineItems: [
         {
           lineItemId: 'line-1',
           quantityToInvoice: 0.5 // 50% of order
         }
       ]
     },
     'user-id'
   );
   ```

2. **Expected Results**:
   - Invoice for $2,500 (50% of $5,000)
   - Sales order quantities updated
   - GL entry for partial amount

### Phase 4: Payment Processing

#### Test 4.1: Record Payment
1. **Action**: Record a payment against invoice
   ```typescript
   const payment = {
     paymentDate: '2024-01-25',
     amount: 1000,
     paymentMethod: 'bank_transfer' as const,
     reference: 'TXN-12345'
   };

   await invoiceIntegrationService.recordPaymentWithPosting(
     'company-id',
     invoice.id,
     payment,
     'bank-account-id',
     'user-id'
   );
   ```

2. **Expected Results**:
   - Invoice status changes to 'partial'
   - Amount paid: $1,000
   - Amount due: $500
   - Payment GL entry created:
     - DR: Bank Account $1,000
     - CR: Accounts Receivable $1,000

### Phase 5: Integration Verification

#### Test 5.1: Check Debtor Balance
1. **Action**: Verify debtor service integration
   ```typescript
   import { debtorService } from '@/lib/firebase';
   const debtor = await debtorService.getDebtor('company-id', 'test-customer-id');
   ```

2. **Expected Results**:
   - Current balance reflects all unpaid invoices
   - Balance increases with new invoices
   - Balance decreases with payments

#### Test 5.2: Verify Journal Entries
1. **Action**: Check general ledger entries
2. **Expected Results**:
   - All invoice transactions in GL
   - Balanced entries (debits = credits)
   - Proper account classifications
   - Correct posting dates

## Common Issues to Check

### Issue 1: Missing GL Accounts
- **Symptom**: Error creating invoice/posting
- **Check**: Verify chart of accounts setup
- **Fix**: Create required GL accounts

### Issue 2: Unbalanced Entries
- **Symptom**: Journal entry fails validation
- **Check**: Line item calculations
- **Fix**: Verify tax calculations

### Issue 3: Customer Not Found
- **Symptom**: Customer validation errors
- **Check**: Customer/debtor exists and is active
- **Fix**: Create customer record first

### Issue 4: Fiscal Period Closed
- **Symptom**: Posting fails with period error
- **Check**: Fiscal period status
- **Fix**: Use open fiscal period or create new one

## Performance Verification

### Load Test: Batch Invoice Creation
1. **Action**: Create 100 invoices simultaneously
2. **Expected**: All complete within 30 seconds
3. **Monitor**: Firebase write quota usage

### Memory Test: Large Invoice Processing
1. **Action**: Create invoice with 50+ line items
2. **Expected**: Processes without timeout
3. **Monitor**: Client memory usage

## Success Criteria

### ✅ Functional Requirements
- [ ] Direct invoice creation works
- [ ] Quote-to-invoice conversion works
- [ ] Sales order flow works
- [ ] Payment recording works
- [ ] GL posting automatic
- [ ] Debtor balances update

### ✅ Technical Requirements
- [ ] No console errors
- [ ] Balanced journal entries
- [ ] Proper error handling
- [ ] Multi-tenant data isolation
- [ ] Audit trail complete

### ✅ Business Requirements
- [ ] Invoice numbering sequential
- [ ] Payment terms calculated correctly
- [ ] Tax calculations accurate
- [ ] Aging reports functional
- [ ] Reconciliation data available

## Post-Test Verification

1. **Check Bank Reconciliation**: Verify invoice payments appear for matching
2. **Review GL Reports**: Confirm revenue and AR postings are correct
3. **Test Aging Reports**: Verify overdue calculations work
4. **Validate Audit Trail**: Check all transactions are logged

## Rollback Procedure

If critical issues are found:
1. Disable auto-posting in invoice services
2. Mark problematic invoices as 'draft'
3. Reverse any incorrect GL entries
4. Fix issues and re-test
5. Re-enable auto-posting

This comprehensive test ensures the invoice system provides the missing revenue journal entries needed for effective bank reconciliation.