# Smoke Test Guide: SLA & Contract Billing System

This guide provides step-by-step verification procedures for the newly implemented Service Level Agreement (SLA) and Contract Billing system.

## Overview of Implementation

The SLA & Contract Billing system includes:
- **Data Models**: Comprehensive TypeScript types for service agreements and billing
- **Service Layer**: Full CRUD operations with multi-tenant isolation
- **Automated Billing**: Recurring invoice generation with proration support
- **Integration**: Seamless coordination with existing debtor and posting services
- **Revenue Recognition**: Automatic journal entry creation for GL posting

## Quick Verification Steps (2 Minutes)

### 1. Import Services
```typescript
import {
  slaService,
  SLAIntegrationService,
  RecurringInvoiceService
} from '@/lib/firebase';

// Per-company services
const slaIntegration = new SLAIntegrationService('your-company-id');
const recurringService = new RecurringInvoiceService('your-company-id');
```

### 2. Basic Service Availability Test
```typescript
// Test service instantiation
console.log('SLA Service:', typeof slaService); // Should be 'object'
console.log('Integration Service:', typeof slaIntegration); // Should be 'object'
console.log('Recurring Service:', typeof recurringService); // Should be 'object'
```

### 3. Type Definitions Available
```typescript
import type {
  ServiceAgreement,
  SLALineItem,
  SLAProcessingResult
} from '@/lib/firebase';

// Should import without TypeScript errors
```

### 4. Service Methods Available
```typescript
// Check core methods exist
console.log('createSLA method:', typeof slaService.createSLA); // Should be 'function'
console.log('getSLAs method:', typeof slaService.getSLAs); // Should be 'function'
console.log('processRecurringInvoices method:', typeof recurringService.processRecurringInvoices); // Should be 'function'
```

### 5. Firebase Collection Structure
```javascript
// Check in Firebase console that these collection paths exist when SLAs are created:
// companies/{companyId}/serviceAgreements
// companies/{companyId}/serviceAgreements/{slaId}/history
```

## Detailed Testing Procedures

### Test 1: SLA Creation and Validation

**Purpose**: Verify SLA can be created with proper validation

**Steps**:
1. Create a test SLA with the integration service:
```typescript
const testSLA = {
  customerId: 'test-customer-123',
  customerName: 'Test Customer Corp',
  contractNumber: 'SLA-2025-001',
  contractName: 'Monthly Software License',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  billingFrequency: 'monthly' as const,
  nextBillingDate: '2025-02-01',
  status: 'active' as const,
  autoGenerateInvoices: true,
  dayOfMonth: 1,
  advanceDays: 5,
  contractValue: 1200,
  currency: 'USD',
  paymentTerms: 30,
  lineItems: [{
    id: 'line-1',
    description: 'Software License - Pro Plan',
    quantity: 1,
    unitPrice: 100,
    amount: 100,
    glAccountId: 'revenue-software',
    effectiveFrom: '2025-01-01',
    status: 'active' as const,
    recurrence: 'always' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  }]
};

const result = await slaIntegration.createSLAWithCustomerIntegration(
  'your-company-id',
  testSLA,
  'test-user-id',
  { createCustomerIfNotExists: true }
);
```

**Expected Results**:
- SLA created successfully with generated ID
- Customer record created if it didn't exist
- Line items have proper validation
- Contract value calculated from line items
- No validation errors returned

**Common Issues to Check**:
- Missing required fields cause validation errors
- GL account IDs are properly referenced
- Date ranges are logical (end date after start date)
- Line item amounts match quantity × unit price

### Test 2: SLA Querying and Filtering

**Purpose**: Verify SLA retrieval with various filters

**Steps**:
1. Query all SLAs:
```typescript
const allSLAs = await slaService.getSLAs('your-company-id');
console.log('Total SLAs:', allSLAs.length);
```

2. Query with filters:
```typescript
const activeSLAs = await slaService.getSLAs('your-company-id', {
  status: 'active',
  autoGenerateOnly: true
});
console.log('Active auto-billing SLAs:', activeSLAs.length);
```

3. Query SLAs due for billing:
```typescript
const dueSLAs = await slaService.getDueSLAs('your-company-id');
console.log('SLAs due for billing:', dueSLAs.length);
```

**Expected Results**:
- Queries return appropriate SLA arrays
- Filters properly reduce result sets
- Due SLAs only include those with nextBillingDate <= today
- All returned SLAs have complete data structure

### Test 3: Recurring Invoice Processing

**Purpose**: Verify automated invoice generation from SLAs

**Steps**:
1. Process recurring invoices (dry run):
```typescript
const dryRunResults = await recurringService.processRecurringInvoices({
  companyId: 'your-company-id',
  dryRun: true,
  userId: 'test-user-id'
});
console.log('Dry run results:', dryRunResults);
```

2. Process recurring invoices (actual):
```typescript
const actualResults = await recurringService.processRecurringInvoices({
  companyId: 'your-company-id',
  dryRun: false,
  generateInvoices: true,
  updateNextBillingDate: true,
  userId: 'test-user-id'
});
console.log('Processing results:', actualResults);
```

**Expected Results**:
- Dry run shows preview without creating invoices
- Actual processing creates invoices in Firebase
- Next billing dates are updated correctly
- Processing results include success/failure status
- Customer balances are updated for successful invoices

### Test 4: Integration with Existing Services

**Purpose**: Verify SLA system works with debtor and posting services

**Steps**:
1. Check customer integration:
```typescript
const dashboardData = await slaIntegration.getSLADashboardData('your-company-id');
console.log('Dashboard data:', dashboardData);
```

2. Verify accounting validation:
```typescript
const sla = await slaService.getSLA('your-company-id', 'test-sla-id');
if (sla) {
  const accountingValidation = await slaIntegration.validateSLAAccounting('your-company-id', sla);
  console.log('Accounting validation:', accountingValidation);
}
```

**Expected Results**:
- Dashboard data includes SLA summary and projections
- Customer breakdown shows proper aggregation
- Accounting validation checks GL account references
- Integration doesn't break existing debtor/creditor functionality

### Test 5: Line Item History Tracking

**Purpose**: Verify audit trail for SLA changes

**Steps**:
1. Update an SLA with line item changes:
```typescript
const existingSLA = await slaService.getSLA('your-company-id', 'test-sla-id');
if (existingSLA) {
  // Modify line items
  const updatedLineItems = [
    ...existingSLA.lineItems,
    {
      id: 'line-2',
      description: 'Additional Service',
      quantity: 1,
      unitPrice: 50,
      amount: 50,
      glAccountId: 'revenue-services',
      effectiveFrom: new Date().toISOString().split('T')[0],
      status: 'active' as const,
      recurrence: 'always' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await slaService.updateSLA('your-company-id', 'test-sla-id', {
    lineItems: updatedLineItems
  }, 'test-user-id');
}
```

2. Check history was created:
```typescript
// Check in Firebase console:
// companies/{companyId}/serviceAgreements/{slaId}/history
// Should contain history records for the changes
```

**Expected Results**:
- History records created for line item additions/modifications
- Previous values preserved in history
- Effective dates recorded correctly
- Audit trail shows who made changes when

## Verification Checklist

- [ ] SLA services import without errors
- [ ] Type definitions are available and complete
- [ ] SLA creation works with validation
- [ ] SLA querying and filtering functions correctly
- [ ] Recurring invoice processing generates invoices
- [ ] Customer balances update after invoice generation
- [ ] Integration with debtor service works
- [ ] GL posting integration functions (journal entries created)
- [ ] Line item history tracking works
- [ ] Firebase collections created with correct structure
- [ ] Multi-tenant data isolation maintained
- [ ] Error handling works for invalid data
- [ ] Proration calculations are accurate
- [ ] Next billing dates update correctly
- [ ] Revenue recognition journal entries created

## Common Issues and Solutions

### Issue: "SLA validation failed"
**Solution**: Check that all required fields are provided and line items have valid GL account IDs

### Issue: "Customer not found"
**Solution**: Use `createCustomerIfNotExists: true` option or create customer first using DebtorService

### Issue: "Fiscal period not found"
**Solution**: Ensure fiscal periods are set up in the system before posting journal entries

### Issue: "Collection permission denied"
**Solution**: Verify Firebase security rules allow company-scoped collection access

### Issue: "Proration calculations incorrect"
**Solution**: Check that effective dates are within the billing period and date calculations are using UTC

## Firebase Collection Structure

```
companies/{companyId}/
├── serviceAgreements/
│   ├── {slaId}/
│   │   ├── id: string
│   │   ├── companyId: string
│   │   ├── customerId: string
│   │   ├── contractNumber: string
│   │   ├── lineItems: SLALineItem[]
│   │   └── ...other SLA fields
│   └── history/
│       └── {historyId}/
│           ├── slaId: string
│           ├── lineItemId: string
│           ├── action: 'created' | 'modified' | 'removed'
│           ├── changes: Partial<SLALineItem>
│           └── ...audit fields
├── invoices/
│   └── {invoiceId}/
│       ├── slaId?: string (reference to source SLA)
│       ├── contractNumber?: string
│       ├── billingPeriodStart?: string
│       └── ...invoice fields
└── debtors/
    └── {customerId}/
        ├── metadata.activeSLAs: string[] (SLA references)
        └── ...debtor fields
```

## Success Criteria

The SLA & Contract Billing system is working correctly when:

1. **Data Integrity**: All SLAs can be created, read, updated with proper validation
2. **Automation**: Recurring invoices generate automatically on schedule
3. **Integration**: Works seamlessly with existing debtor and accounting services
4. **Audit Trail**: All changes tracked with proper history records
5. **Financial Accuracy**: Amounts calculate correctly and GL entries post properly
6. **Multi-tenancy**: Data properly isolated between companies
7. **Error Handling**: Graceful handling of edge cases and invalid data

This implementation provides a robust foundation for contract billing and automated revenue recognition within the existing accounting framework.