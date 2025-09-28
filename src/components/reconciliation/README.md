# Reconciliation Adjustment Components

This package provides comprehensive components for managing adjustment entries in bank reconciliation processes, ensuring proper double-entry bookkeeping and audit trails.

## Components

### 1. AdjustmentEntryManager
Full-featured component for creating and managing adjustment entries with complete form validation and journal entry generation.

```tsx
import { AdjustmentEntryManager } from '@/components/reconciliation';

<AdjustmentEntryManager
  companyId="company-id"
  sessionId="reconciliation-session-id"
  bankAccountId="bank-account-id"
  bankAccountCode="1010"
  currency="USD"
  fiscalPeriodId="fiscal-period-id"
  availableAccounts={expenseAccounts}
  onAdjustmentCreated={(adjustment) => console.log('Created:', adjustment)}
  onAdjustmentReversed={(reversal) => console.log('Reversed:', reversal)}
/>
```

### 2. QuickAdjustmentForm
Streamlined component for rapid creation of common adjustments with predefined templates.

```tsx
import { QuickAdjustmentForm } from '@/components/reconciliation';

<QuickAdjustmentForm
  companyId="company-id"
  sessionId="reconciliation-session-id"
  bankAccountId="bank-account-id"
  bankAccountCode="1010"
  currency="USD"
  fiscalPeriodId="fiscal-period-id"
  availableAccounts={expenseAccounts}
  onAdjustmentCreated={(adjustment) => handleNewAdjustment(adjustment)}
  onCancel={() => setShowQuickForm(false)}
/>
```

### 3. AdjustmentSummary
Dashboard component showing adjustment statistics and balance validation.

```tsx
import { AdjustmentSummary } from '@/components/reconciliation';

<AdjustmentSummary
  companyId="company-id"
  sessionId="reconciliation-session-id"
  currency="USD"
/>
```

### 4. ManualMatchingInterface
Existing component for manual transaction matching (enhanced with adjustment integration).

## Features

### Adjustment Types
- **fee**: Bank fees and service charges
- **interest**: Interest earned on account balances
- **timing**: Timing differences for outstanding checks/deposits
- **other**: Custom adjustment types

### Double-Entry Bookkeeping
All adjustments automatically create proper journal entries:
- **Bank Account**: Debit (money in) or Credit (money out)
- **Expense/Income Account**: Offsetting entry to maintain balance

### Validation & Controls
- **Balance Validation**: Ensures adjustments maintain reconciliation balance
- **Form Validation**: Comprehensive field validation with Zod schemas
- **Account Selection**: Filtered to appropriate expense/income accounts
- **Amount Validation**: Prevents negative amounts and validates decimal precision

### Audit Trail
- **Journal Entry Linking**: Each adjustment links to its posted journal entry
- **Reversal Tracking**: Full reversal capability with reason tracking
- **Metadata Storage**: Captures adjustment context and reconciliation session
- **Creation Tracking**: User and timestamp tracking for all changes

### Error Handling
- **Transaction Safety**: Uses Firebase transactions for data consistency
- **Validation Feedback**: Real-time validation with user-friendly error messages
- **Graceful Degradation**: Handles missing accounts and invalid data

## Service Integration

### ReconciliationService Methods

#### Create Adjustment Journal
```typescript
const journalEntry = await reconciliationService.createAdjustmentJournal(companyId, {
  sessionId: 'session-id',
  adjustmentId: 'adjustment-id',
  bankAccountId: 'bank-account-id',
  bankAccountCode: '1010',
  expenseAccountId: 'expense-account-id',
  expenseAccountCode: '6200',
  description: 'Bank service charge',
  amount: 25.00,
  adjustmentType: 'fee',
  transactionDate: new Date(),
  fiscalPeriodId: 'fiscal-period-id',
  currency: 'USD',
  createdBy: 'user-id',
});
```

#### Create Reversal
```typescript
const reversal = await reconciliationService.createReversalJournal(companyId, {
  originalJournalId: 'original-journal-id',
  reason: 'Incorrect amount entered',
  reversalDate: new Date(),
  createdBy: 'user-id',
});
```

#### Validate Balance
```typescript
const validation = await reconciliationService.validateAdjustmentBalance(
  companyId,
  sessionId,
  [{ amount: 25.00 }, { amount: -10.00 }]
);

if (!validation.isValid) {
  console.log('Balance issue:', validation.message);
}
```

#### Bulk Create Adjustments
```typescript
const adjustments = await reconciliationService.bulkCreateAdjustments(
  companyId,
  sessionId,
  [
    {
      adjustmentId: 'adj-1',
      description: 'Service charge',
      amount: 25.00,
      adjustmentType: 'fee',
      // ... other fields
    },
    // ... more adjustments
  ],
  true // validateBalance
);
```

## Data Flow

1. **User Input**: Form captures adjustment details
2. **Validation**: Zod schema validates form data
3. **Account Selection**: Validates expense/income account selection
4. **Balance Check**: Validates adjustment won't break reconciliation
5. **Record Creation**: Creates adjustment record in Firestore
6. **Journal Entry**: Creates and posts double-entry journal
7. **Audit Link**: Links adjustment to posted journal entry
8. **State Update**: Updates UI with new adjustment

## Type Definitions

### AdjustmentJournalEntry
```typescript
interface AdjustmentJournalEntry {
  journalEntryId: string;
  adjustmentId: string;
  sessionId: string;
  amount: number;
  description: string;
  adjustmentType: 'fee' | 'interest' | 'timing' | 'other';
  createdAt: Date;
  ledgerEntries: LedgerEntry[];
  isReversal?: boolean;
  originalJournalId?: string;
}
```

### ReconciliationAdjustment
```typescript
interface ReconciliationAdjustment {
  id: string;
  sessionId: string;
  companyId: string;
  description: string;
  amount: number;
  adjustmentType: 'fee' | 'interest' | 'timing' | 'other';
  ledgerAccountId: string;
  ledgerAccountCode?: string;
  createdBy: string;
  createdAt: Date;
  postedJournalId?: string;
  reversalJournalId?: string;
  reversalReason?: string;
  reversedAt?: Date;
  metadata?: Record<string, unknown>;
}
```

## Best Practices

1. **Always validate balances** before creating adjustments
2. **Use appropriate adjustment types** for proper categorization
3. **Provide clear descriptions** for audit trail purposes
4. **Test reversal functionality** in development environments
5. **Monitor balance validation** to prevent reconciliation errors
6. **Use bulk operations** for multiple related adjustments
7. **Implement proper error handling** for all user actions

## Dependencies

- React Hook Form with Zod validation
- Firebase Firestore for data persistence
- Tailwind CSS for styling
- Framer Motion for animations (via ui/motion)
- React Hot Toast for notifications