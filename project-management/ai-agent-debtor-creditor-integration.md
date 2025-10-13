# AI Agent Integration: Intelligent Debtor & Creditor Recognition

**Status**: Planned Enhancement
**Priority**: High
**Estimated Effort**: 25-30 hours across 5 phases
**Dependencies**: Current AI Mapping System (Phase 2 Complete)

---

## 🎯 Strategic Objective

Enhance the AI mapping system to intelligently recognize customers and suppliers in bank transactions, enabling automatic payment-to-entity linking while preserving flexibility for traditional invoice-first workflows.

### **Business Value:**
- **Faster reconciliation** - Automatic customer/supplier detection saves 60%+ time
- **Better accuracy** - AI matching reduces manual entry errors by 80%
- **Flexible workflows** - Supports both invoice-first and payment-first processes
- **Complete audit trail** - Full payment allocation history per customer/supplier
- **Cash flow clarity** - Real-time view of unallocated payments and customer credits

---

## 🏗️ Architecture Overview

### **Core Components:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Bank Transaction                          │
│              "Magtape Credit Tsebo R4634.50"                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              Enhanced AI Mapping Pipeline                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Rule-Based Matching (Existing)                    │   │
│  │    ├─ Exact match                                    │   │
│  │    ├─ Pattern match                                  │   │
│  │    ├─ Fuzzy match                                    │   │
│  │    └─ Category match                                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 2. Entity Recognition (NEW)                          │   │
│  │    ├─ Direction Detection (Credit vs Debit)         │   │
│  │    ├─ Debtor Matching Service (if credit)           │   │
│  │    ├─ Creditor Matching Service (if debit)          │   │
│  │    └─ Confidence Scoring (60-100%)                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                         │
│                     ▼                                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 3. Invoice Matching (NEW)                            │   │
│  │    ├─ Find outstanding invoices                      │   │
│  │    ├─ Amount-based matching                          │   │
│  │    ├─ Date proximity scoring                         │   │
│  │    └─ Suggest invoice allocation                     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              AI Mapping Artifact UI                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Scenario 1: Standard Mapping (Existing)              │   │
│  │ Scenario 2: Create Account (Existing)                │   │
│  │ Scenario 3: Customer Payment Detected (NEW)          │   │
│  │ Scenario 4: Supplier Payment Detected (NEW)          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            User Decision & Allocation                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Option A: Match to Specific Invoice(s)               │   │
│  │ Option B: Allocate to Entity (Pending)               │   │
│  │ Option C: Generic GL Entry                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 New Services & Components

### **1. DebtorMatchingService** (`/src/lib/ai/debtor-matching-service.ts`)

**Purpose**: Intelligently match bank transaction descriptions to customer records

**Key Methods:**
```typescript
class DebtorMatchingService {
  // Find matching customer with confidence scoring
  async findMatchingDebtor(
    description: string,
    amount?: number
  ): Promise<DebtorMatch | null>

  // Get outstanding invoices for matched customer
  async getOutstandingInvoices(
    debtorId: string
  ): Promise<Invoice[]>

  // Find exact invoice match by amount and proximity
  async suggestInvoiceMatch(
    debtorId: string,
    amount: number,
    transactionDate: Date
  ): Promise<InvoiceSuggestion | null>

  // Calculate match confidence using multiple factors
  private calculateMatchScore(
    description: string,
    debtor: Debtor
  ): number
}

interface DebtorMatch {
  debtor: Debtor;
  confidence: number;
  matchedField: 'name' | 'tradingName' | 'abbreviation';
  outstandingBalance: number;
  outstandingInvoices: Invoice[];
  suggestedInvoice?: InvoiceSuggestion;
}

interface InvoiceSuggestion {
  invoice: Invoice;
  matchScore: number;
  matchReasons: string[];
  exactAmountMatch: boolean;
  dateProximityDays: number;
}
```

**Matching Algorithm:**
1. **Exact Name Match** - 100% confidence
2. **Trading Name Match** - 95% confidence
3. **Fuzzy String Match** - 70-90% confidence (Levenshtein distance)
4. **Abbreviation Match** - 85% confidence
5. **Combined with Amount** - +5% bonus if matches outstanding invoice exactly

---

### **2. CreditorMatchingService** (`/src/lib/ai/creditor-matching-service.ts`)

**Purpose**: Match outgoing payments to supplier records

**Key Methods:**
```typescript
class CreditorMatchingService {
  // Find matching supplier
  async findMatchingCreditor(
    description: string,
    amount?: number
  ): Promise<CreditorMatch | null>

  // Get outstanding bills for matched supplier
  async getOutstandingBills(
    creditorId: string
  ): Promise<Bill[]>

  // Suggest bill match
  async suggestBillMatch(
    creditorId: string,
    amount: number,
    transactionDate: Date
  ): Promise<BillSuggestion | null>
}

interface CreditorMatch {
  creditor: Creditor;
  confidence: number;
  matchedField: 'name' | 'tradingName';
  outstandingBalance: number;
  outstandingBills: Bill[];
  suggestedBill?: BillSuggestion;
}
```

---

### **3. PendingPaymentService** (`/src/lib/accounting/pending-payment-service.ts`)

**Purpose**: Track payments linked to customers/suppliers but not yet allocated to specific invoices

**Key Methods:**
```typescript
class PendingPaymentService {
  // Create pending payment record
  async createPendingPayment(
    transaction: BankTransaction,
    entityId: string,
    entityType: 'debtor' | 'creditor',
    glMapping: TransactionMapping
  ): Promise<PendingPayment>

  // Get all unallocated payments for an entity
  async getPendingPayments(
    entityId: string,
    entityType: 'debtor' | 'creditor'
  ): Promise<PendingPayment[]>

  // Allocate payment to invoice(s)
  async allocateToInvoices(
    paymentId: string,
    allocations: PaymentAllocation[]
  ): Promise<AllocationResult>

  // Handle over-payment / customer credit
  async createCustomerCredit(
    paymentId: string,
    creditAmount: number
  ): Promise<CustomerCredit>
}

interface PendingPayment {
  id: string;
  entityId: string;
  entityType: 'debtor' | 'creditor';
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  transactionDate: Date;
  bankTransactionId: string;
  description: string;
  status: 'pending' | 'partially-allocated' | 'fully-allocated' | 'over-allocated';
  glEntryId: string;
  allocations: PaymentAllocation[];
  createdAt: Date;
  createdBy: string;
}

interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  allocationDate: Date;
  allocatedBy: string;
}
```

---

### **4. PaymentAllocationService** (`/src/lib/accounting/payment-allocation-service.ts`)

**Purpose**: Handle complex payment allocation scenarios

**Key Scenarios Handled:**

#### **Scenario A: One Payment → Multiple Invoices (Split Allocation)**
```typescript
async allocatePaymentToMultipleInvoices(
  paymentId: string,
  allocations: Array<{
    invoiceId: string;
    amount: number;
  }>
): Promise<AllocationResult> {
  // Validate total matches payment amount
  // Update each invoice status
  // Create allocation records
  // Update customer balance
  // Mark payment as fully-allocated
}

// Example:
// Payment: R10,000
// Allocations:
//   - Invoice #1: R4,500 → Status: "Paid"
//   - Invoice #2: R3,200 → Status: "Paid"
//   - Invoice #3: R2,300 → Status: "Paid"
```

#### **Scenario B: Partial Payment**
```typescript
async allocatePartialPayment(
  paymentId: string,
  invoiceId: string,
  amount: number
): Promise<AllocationResult> {
  // Apply partial amount to invoice
  // Update invoice status to "Partially Paid"
  // Update amountDue field
  // Track payment history
  // Leave payment partially-allocated for future use
}

// Example:
// Payment: R5,000
// Invoice Due: R8,000
// After: Invoice shows R3,000 still due
//        Payment has R0 remaining
```

#### **Scenario C: Over-Payment / Customer Credit**
```typescript
async handleOverPayment(
  paymentId: string,
  invoiceId: string,
  overageAmount: number
): Promise<AllocationResult> {
  // Apply full invoice amount
  // Mark invoice as "Paid"
  // Create customer credit for overage
  // Track credit in customer record
  // Available for future invoice application
}

// Example:
// Payment: R6,000
// Invoice: R5,000
// After: Invoice paid in full
//        Customer credit: R1,000 (available for next invoice)
```

#### **Scenario D: Payment on Account (No Invoice)**
```typescript
async createCustomerDeposit(
  paymentId: string,
  customerId: string,
  amount: number
): Promise<CustomerCredit> {
  // Record as customer credit/deposit
  // No invoice allocation
  // Available for future invoices
  // Shows in customer account as prepayment
}

// Example:
// Payment: R10,000
// No outstanding invoices
// After: Customer has R10,000 credit balance
//        Applied to future invoices as they're created
```

#### **Scenario E: Apply Existing Credit to New Invoice**
```typescript
async applyCustomerCredit(
  customerId: string,
  invoiceId: string,
  amount: number
): Promise<AllocationResult> {
  // Find available customer credits
  // Apply to invoice (oldest first)
  // Update invoice amountDue
  // Track credit usage
}

// Example:
// Customer has R3,000 credit
// New invoice: R5,000
// User can apply credit → Invoice shows R2,000 due
```

---

## 🎨 Enhanced UI Components

### **Scenario 3: Customer Payment Detected (NEW)**

```tsx
{debtorMatch && debtorMatch.confidence >= 60 && transaction.credit > 0 && (
  <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 space-y-4">

    {/* Header */}
    <div className="flex items-start gap-3">
      <Users className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-900">
          Customer Payment Detected
        </h4>
        <p className="text-sm text-gray-700 mt-1">
          This appears to be a payment from <strong>{debtorMatch.debtor.name}</strong>
        </p>
        <Badge className="mt-2 bg-green-100 text-green-800 border-green-300">
          {debtorMatch.confidence}% Match Confidence
        </Badge>
      </div>
    </div>

    {/* Customer Summary */}
    <div className="grid grid-cols-3 gap-3 text-sm bg-white rounded-lg p-4 border border-green-200">
      <div>
        <span className="text-gray-600">Customer:</span>
        <span className="ml-2 font-semibold">{debtorMatch.debtor.name}</span>
      </div>
      <div>
        <span className="text-gray-600">Outstanding:</span>
        <span className="ml-2 font-semibold text-red-600">
          R{debtorMatch.outstandingBalance?.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-gray-600">Unpaid Invoices:</span>
        <span className="ml-2 font-semibold">
          {debtorMatch.outstandingInvoices?.length || 0}
        </span>
      </div>
    </div>

    {/* Exact Invoice Match Suggestion */}
    {debtorMatch.suggestedInvoice?.exactAmountMatch && (
      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            Perfect Invoice Match Found!
          </span>
        </div>
        <div className="flex items-center justify-between bg-white rounded-md p-3 border border-blue-300">
          <div>
            <span className="font-semibold text-lg">
              {debtorMatch.suggestedInvoice.invoice.invoiceNumber}
            </span>
            <span className="text-xs text-gray-600 ml-2">
              {debtorMatch.suggestedInvoice.invoice.date}
            </span>
            <div className="text-xs text-gray-600 mt-1">
              {debtorMatch.suggestedInvoice.matchReasons.join(' • ')}
            </div>
          </div>
          <span className="font-bold text-lg text-green-600">
            R{debtorMatch.suggestedInvoice.invoice.amountDue?.toFixed(2)}
          </span>
        </div>
        <Button
          onClick={() => onMatchToInvoice(debtorMatch.suggestedInvoice.invoice.id)}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply to {debtorMatch.suggestedInvoice.invoice.invoiceNumber}
        </Button>
      </div>
    )}

    {/* Outstanding Invoices List */}
    {debtorMatch.outstandingInvoices && debtorMatch.outstandingInvoices.length > 0 && (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-gray-900">
            Outstanding Invoices:
          </h5>
          <Button
            variant="outline"
            size="sm"
            onClick={onShowSplitAllocation}
            className="text-xs"
          >
            <Split className="h-3 w-3 mr-1" />
            Split Across Multiple
          </Button>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {debtorMatch.outstandingInvoices.map(invoice => (
            <button
              key={invoice.id}
              onClick={() => onSelectInvoice(invoice.id)}
              className="w-full text-left rounded-md border border-gray-300 bg-white p-3 hover:bg-green-50 hover:border-green-400 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-semibold text-sm">{invoice.invoiceNumber}</span>
                  <span className="text-xs text-gray-600 ml-2">
                    {invoice.date}
                  </span>
                  {invoice.amountDue === transaction.credit && (
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                      Exact Match
                    </Badge>
                  )}
                  <div className="text-xs text-gray-600 mt-1">
                    Due: {invoice.dueDate} ({getDaysOverdue(invoice.dueDate)} days)
                  </div>
                </div>
                <span className="font-semibold text-red-600">
                  R{invoice.amountDue?.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Payment Amount Analysis */}
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-900">Payment Amount:</span>
        <span className="font-bold text-lg text-green-600">
          R{transaction.credit?.toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-600">Total Outstanding:</span>
        <span className="font-semibold text-red-600">
          R{debtorMatch.outstandingBalance?.toFixed(2)}
        </span>
      </div>
      {transaction.credit > debtorMatch.outstandingBalance && (
        <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 rounded p-2 border border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <span className="text-xs">
            Over-payment of R{(transaction.credit - debtorMatch.outstandingBalance).toFixed(2)} will be recorded as customer credit
          </span>
        </div>
      )}
    </div>

    {/* Action Buttons */}
    <div className="flex gap-2 pt-2 border-t border-green-200">
      <Button
        onClick={onAllocateToCustomerPending}
        className="flex-1 bg-green-600 hover:bg-green-700"
      >
        <User className="h-4 w-4 mr-2" />
        Link to Customer (Allocate Later)
      </Button>
      <Button
        variant="outline"
        onClick={onGenericEntry}
        className="border-gray-400 text-gray-700"
      >
        Generic Entry
      </Button>
    </div>

    <p className="text-xs text-gray-600 text-center">
      💡 Payment will update customer balance. Match to specific invoice(s) now or later from Customers page.
    </p>
  </div>
)}
```

### **Scenario 4: Supplier Payment Detected (NEW)**

```tsx
{creditorMatch && creditorMatch.confidence >= 60 && transaction.debit > 0 && (
  <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-6 space-y-4">

    {/* Header */}
    <div className="flex items-start gap-3">
      <Building className="h-6 w-6 text-purple-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-lg font-semibold text-gray-900">
          Supplier Payment Detected
        </h4>
        <p className="text-sm text-gray-700 mt-1">
          This appears to be a payment to <strong>{creditorMatch.creditor.name}</strong>
        </p>
        <Badge className="mt-2 bg-purple-100 text-purple-800 border-purple-300">
          {creditorMatch.confidence}% Match Confidence
        </Badge>
      </div>
    </div>

    {/* Supplier Summary */}
    <div className="grid grid-cols-3 gap-3 text-sm bg-white rounded-lg p-4 border border-purple-200">
      <div>
        <span className="text-gray-600">Supplier:</span>
        <span className="ml-2 font-semibold">{creditorMatch.creditor.name}</span>
      </div>
      <div>
        <span className="text-gray-600">Amount Owed:</span>
        <span className="ml-2 font-semibold text-red-600">
          R{creditorMatch.outstandingBalance?.toFixed(2)}
        </span>
      </div>
      <div>
        <span className="text-gray-600">Unpaid Bills:</span>
        <span className="ml-2 font-semibold">
          {creditorMatch.outstandingBills?.length || 0}
        </span>
      </div>
    </div>

    {/* Exact Bill Match */}
    {creditorMatch.suggestedBill?.exactAmountMatch && (
      <div className="rounded-lg border-2 border-blue-400 bg-blue-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-900">
            Perfect Bill Match Found!
          </span>
        </div>
        <div className="flex items-center justify-between bg-white rounded-md p-3 border border-blue-300">
          <div>
            <span className="font-semibold text-lg">
              {creditorMatch.suggestedBill.bill.billNumber || 'Bill #' + creditorMatch.suggestedBill.bill.id}
            </span>
            <span className="text-xs text-gray-600 ml-2">
              {creditorMatch.suggestedBill.bill.date}
            </span>
          </div>
          <span className="font-bold text-lg text-red-600">
            R{creditorMatch.suggestedBill.bill.amountDue?.toFixed(2)}
          </span>
        </div>
        <Button
          onClick={() => onMatchToBill(creditorMatch.suggestedBill.bill.id)}
          className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
        >
          <Check className="h-4 w-4 mr-2" />
          Apply to Bill
        </Button>
      </div>
    )}

    {/* Outstanding Bills List */}
    {creditorMatch.outstandingBills && creditorMatch.outstandingBills.length > 0 && (
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-900">
          Outstanding Bills:
        </h5>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {creditorMatch.outstandingBills.map(bill => (
            <button
              key={bill.id}
              onClick={() => onSelectBill(bill.id)}
              className="w-full text-left rounded-md border border-gray-300 bg-white p-3 hover:bg-purple-50 hover:border-purple-400 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-semibold text-sm">
                    {bill.billNumber || 'Bill #' + bill.id}
                  </span>
                  <span className="text-xs text-gray-600 ml-2">
                    {bill.date}
                  </span>
                  {bill.amountDue === transaction.debit && (
                    <Badge className="ml-2 text-xs bg-blue-100 text-blue-800">
                      Exact Match
                    </Badge>
                  )}
                </div>
                <span className="font-semibold text-red-600">
                  R{bill.amountDue?.toFixed(2)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Action Buttons */}
    <div className="flex gap-2 pt-2 border-t border-purple-200">
      <Button
        onClick={onAllocateToSupplierPending}
        className="flex-1 bg-purple-600 hover:bg-purple-700"
      >
        <Building className="h-4 w-4 mr-2" />
        Link to Supplier (Allocate Later)
      </Button>
      <Button
        variant="outline"
        onClick={onGenericEntry}
        className="border-gray-400 text-gray-700"
      >
        Generic Entry
      </Button>
    </div>

    <p className="text-xs text-gray-600 text-center">
      💡 Payment will update supplier balance. Match to specific bill(s) now or later from Suppliers page.
    </p>
  </div>
)}
```

---

## 💾 Firestore Data Structure

### **New Collections:**

#### **`pendingPayments` Subcollection**
```
companies/{companyId}/pendingPayments/{paymentId}
{
  id: string;
  entityId: string;
  entityType: 'debtor' | 'creditor';
  entityName: string; // Denormalized for display
  amount: number;
  allocatedAmount: number;
  unallocatedAmount: number;
  transactionDate: Date;
  bankTransactionId: string;
  description: string;
  status: 'pending' | 'partially-allocated' | 'fully-allocated' | 'over-allocated';
  glEntryId: string; // Link to journal entry
  allocations: [{
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    allocationDate: Date;
    allocatedBy: string;
  }];
  metadata: {
    matchConfidence: number;
    matchedField: string;
    autoDetected: boolean;
  };
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
}
```

#### **`customerCredits` Subcollection**
```
companies/{companyId}/customerCredits/{creditId}
{
  id: string;
  customerId: string;
  customerName: string; // Denormalized
  amount: number;
  usedAmount: number;
  remainingAmount: number;
  source: 'over-payment' | 'deposit' | 'refund' | 'adjustment';
  sourcePaymentId?: string;
  status: 'active' | 'fully-used' | 'expired';
  applications: [{
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
    applicationDate: Date;
    appliedBy: string;
  }];
  createdAt: Date;
  expiryDate?: Date;
}
```

#### **Enhanced `debtors` Document**
```
companies/{companyId}/debtors/{debtorId}
{
  // ... existing fields ...

  // NEW FIELDS:
  pendingPayments: [{
    paymentId: string;
    amount: number;
    date: Date;
  }];
  availableCredits: number; // Sum of unused customer credits
  lastPaymentDate: Date;
  lastPaymentAmount: number;
}
```

---

## 🎯 Implementation Phases

### **Phase 1: Entity Matching Foundation (6-8 hours)**

**Deliverables:**
- ✅ DebtorMatchingService with fuzzy matching algorithm
- ✅ CreditorMatchingService mirroring debtor logic
- ✅ Unit tests for matching confidence scoring
- ✅ Firestore queries optimized with indexes

**Technical Tasks:**
1. Create `/src/lib/ai/debtor-matching-service.ts`
2. Create `/src/lib/ai/creditor-matching-service.ts`
3. Implement Levenshtein distance algorithm
4. Add compound matching (name + amount + date)
5. Write comprehensive tests

**Success Criteria:**
- 95%+ accuracy on exact matches
- 80%+ accuracy on fuzzy matches
- <500ms response time
- Handles 1000+ customers/suppliers efficiently

---

### **Phase 2: Pending Payment System (5-6 hours)**

**Deliverables:**
- ✅ PendingPaymentService with CRUD operations
- ✅ Firestore collection `pendingPayments`
- ✅ Basic allocation tracking
- ✅ Customer/Supplier balance updates

**Technical Tasks:**
1. Create `/src/lib/accounting/pending-payment-service.ts`
2. Define PendingPayment TypeScript interfaces
3. Implement createPendingPayment()
4. Implement getPendingPayments()
5. Add Firestore security rules
6. Create indexes for queries

**Success Criteria:**
- Payments correctly linked to entities
- GL entries created properly
- Entity balances update in real-time
- Audit trail maintained

---

### **Phase 3: Invoice Matching & Suggestions (4-5 hours)**

**Deliverables:**
- ✅ Smart invoice matching algorithm
- ✅ Amount-based exact matching
- ✅ Date proximity scoring
- ✅ Multi-invoice suggestions

**Technical Tasks:**
1. Add `suggestInvoiceMatch()` to DebtorMatchingService
2. Add `suggestBillMatch()` to CreditorMatchingService
3. Implement scoring algorithm:
   - Exact amount: +50 points
   - Date within 7 days: +30 points
   - Date within 30 days: +15 points
   - Oldest invoice: +10 points
4. Handle multiple possible matches

**Success Criteria:**
- Exact amount matches suggested automatically
- Multiple match scenarios handled gracefully
- Clear confidence scoring displayed
- Performance <200ms for matching

---

### **Phase 4: Enhanced AI Artifact UI (6-7 hours)**

**Deliverables:**
- ✅ Customer Payment Detection UI (Scenario 3)
- ✅ Supplier Payment Detection UI (Scenario 4)
- ✅ Invoice/Bill selection interface
- ✅ Split allocation modal
- ✅ Over-payment handling UI

**Technical Tasks:**
1. Update AIMappingArtifact component
2. Add customer/supplier detection sections
3. Create invoice selection list
4. Build split allocation modal
5. Add over-payment warning
6. Implement all handlers
7. Add keyboard shortcuts

**Success Criteria:**
- Beautiful, intuitive UI
- All scenarios handled elegantly
- One-click allocation
- Clear visual hierarchy
- Responsive design

---

### **Phase 5: Payment Allocation System (8-10 hours)**

**Deliverables:**
- ✅ PaymentAllocationService
- ✅ Multi-invoice split allocation
- ✅ Partial payment handling
- ✅ Over-payment / credit system
- ✅ Customer credit management
- ✅ Payment allocation UI in Customers/Suppliers pages

**Technical Tasks:**

#### **5A: Service Layer**
1. Create `/src/lib/accounting/payment-allocation-service.ts`
2. Implement `allocatePaymentToMultipleInvoices()`
3. Implement `allocatePartialPayment()`
4. Implement `handleOverPayment()`
5. Implement `createCustomerDeposit()`
6. Implement `applyCustomerCredit()`

#### **5B: UI Components**
1. Create `PaymentAllocationModal` component
2. Build invoice selection with checkboxes
3. Add amount input per invoice
4. Show running total vs payment amount
5. Validate total equals payment
6. Create `CustomerCreditsManager` component
7. Show available credits on customer page
8. Add credit application UI

#### **5C: Integration**
1. Add allocation UI to Customers page
2. Add allocation UI to Suppliers page
3. Add "Allocate Payment" button to pending payments
4. Wire up all handlers
5. Update customer/supplier balances real-time

**Success Criteria:**
- All allocation scenarios work correctly
- GL entries created properly
- Invoice statuses update correctly
- Customer balances accurate
- Audit trail complete
- UI intuitive and fast

---

## 🔗 Integration Points

### **With Existing Systems:**

#### **1. Current AI Mapping System**
```typescript
// Enhanced analyzeTransaction method
const result = await accountingAssistant.analyzeTransaction(
  transaction,
  availableAccounts
);

// NEW: Returns entity matches too
const {
  suggestion,        // Existing: GL mapping suggestion
  customerMatch,     // NEW: Debtor match if credit transaction
  supplierMatch,     // NEW: Creditor match if debit transaction
  createAccount      // Existing: Account creation suggestion
} = result;
```

#### **2. Invoices Module**
- Invoice status updates on payment allocation
- Invoice payment history tracking
- Outstanding balance calculations
- Aging report integration

#### **3. Customers/Suppliers Pages**
- Display pending payments section
- Show available customer credits
- Add payment allocation interface
- Link to bank transactions

#### **4. Bank Statement Service**
- Continue creating bank transactions as normal
- Entity matching happens in mapping phase
- No changes to existing upload flow

---

## 📊 User Workflows

### **Workflow 1: Perfect Match (Traditional + Enhanced)**

**Customer sends payment exactly matching invoice:**

1. **Upload Statement** → Transaction appears in Needs AI
2. **AI Analysis Detects:**
   - Customer: Tsebo (95% confidence)
   - Exact invoice match: INV-2024-089 (R4,634.50)
   - Suggests direct allocation
3. **User Clicks:** "Apply to INV-2024-089"
4. **System Actions:**
   - Creates GL entry (DR Bank, CR AR)
   - Updates invoice → "Paid"
   - Updates customer balance
   - Links payment to invoice
   - Saves mapping rule for future

**Result:** Complete integration, traditional + AI = best of both worlds! ✨

---

### **Workflow 2: Pending Allocation (New Capability)**

**Customer sends payment, unclear which invoice:**

1. **Upload Statement** → Transaction in Needs AI
2. **AI Detects Customer:** Acme Corp (88% confidence)
3. **User Sees:**
   - Customer has 3 outstanding invoices
   - Payment R10,000
   - Total outstanding R15,234
   - No exact match
4. **User Clicks:** "Link to Customer (Allocate Later)"
5. **System Actions:**
   - Creates GL entry (DR Bank, CR AR)
   - Links payment to customer
   - Creates pending payment record
   - Updates customer balance
6. **Later in Customers Page:**
   - User sees "Pending Payments: R10,000"
   - Clicks "Allocate"
   - Splits across invoices: R4K, R3K, R3K
   - System updates all 3 invoices

**Result:** Flexible allocation, maintains proper books! 🎯

---

### **Workflow 3: Split Allocation (Advanced)**

**Customer sends lump sum for multiple invoices:**

1. **AI Detects:** Customer payment R10,000
2. **Shows Outstanding:**
   - Invoice #1: R4,500
   - Invoice #2: R3,200
   - Invoice #3: R2,300
3. **User Clicks:** "Split Across Multiple"
4. **Modal Opens:**
   ```
   Select Invoices to Apply Payment:
   ☑️ Invoice #1: R4,500  [Apply: R4,500]
   ☑️ Invoice #2: R3,200  [Apply: R3,200]
   ☑️ Invoice #3: R2,300  [Apply: R2,300]

   Total: R10,000 / R10,000 ✓

   [Apply Split Allocation]
   ```
5. **System Actions:**
   - Creates GL entry for R10,000
   - Allocates to 3 invoices
   - Marks all as "Paid"
   - Updates customer balance
   - Creates allocation records

**Result:** Complex allocation handled elegantly! 💪

---

### **Workflow 4: Over-Payment (Edge Case)**

**Customer sends more than invoice amount:**

1. **AI Detects:** Payment R6,000, Invoice R5,000
2. **Shows Warning:** "Over-payment: R1,000 will become customer credit"
3. **User Confirms**
4. **System Actions:**
   - Applies R5,000 to invoice → "Paid"
   - Creates R1,000 customer credit
   - Shows credit in customer account
5. **Next Invoice for Customer:**
   - System suggests: "Apply R1,000 credit?"
   - User applies credit
   - Invoice shows net due after credit

**Result:** Over-payments handled gracefully! ✅

---

## 🧪 Testing Strategy

### **Unit Tests:**
- Fuzzy matching algorithm accuracy
- Confidence scoring edge cases
- Payment allocation math
- Credit calculation logic

### **Integration Tests:**
- Entity matching with real data
- Invoice allocation workflows
- GL entry creation
- Balance updates

### **E2E Tests:**
- Upload statement → Detect customer → Allocate → Verify books
- Split allocation across multiple invoices
- Over-payment credit creation and application
- Supplier payment matching

### **Performance Tests:**
- 1000+ customers: <500ms matching
- 100+ outstanding invoices: <200ms suggestions
- Concurrent allocations: No race conditions

---

## 📈 Success Metrics

### **Accuracy Targets:**
- Exact customer match: 95%+
- Fuzzy customer match: 80%+
- Invoice suggestion accuracy: 90%+
- False positive rate: <5%

### **Performance Targets:**
- Entity matching: <500ms
- Invoice suggestions: <200ms
- Allocation operations: <1s
- UI responsiveness: <100ms interactions

### **Business Impact:**
- Reconciliation time: -60%
- Manual entry errors: -80%
- Customer satisfaction: +40% (faster statement delivery)
- Accountant productivity: +3hrs/week saved

---

## 🚀 Deployment Strategy

### **Phase 1-3: Backend Foundation (2-3 weeks)**
- Deploy matching services
- Deploy pending payment system
- Deploy invoice suggestions
- Limited beta testing

### **Phase 4: UI Enhancement (1 week)**
- Deploy enhanced artifact UI
- Internal testing
- Gather user feedback

### **Phase 5: Full Allocation System (2 weeks)**
- Deploy complete allocation features
- Comprehensive testing
- User documentation
- Training materials

### **Total Timeline: 5-6 weeks**

---

## 📚 Documentation Requirements

### **User Guides:**
1. "How to Use AI Customer Detection"
2. "Allocating Payments to Multiple Invoices"
3. "Managing Customer Credits"
4. "Supplier Payment Matching"

### **Technical Docs:**
1. Entity Matching Algorithm Specification
2. Payment Allocation Service API
3. Firestore Schema Changes
4. Security Rules Updates

### **Videos:**
1. 2-min demo: AI Customer Detection
2. 3-min tutorial: Split Payment Allocation
3. 1-min tip: Using Customer Credits

---

## 💡 Future Enhancements (Phase 7+)

### **Machine Learning Layer:**
- Train on historical allocations
- Predict most likely invoice matches
- Learn customer payment patterns
- Improve confidence scoring over time

### **Bulk Operations:**
- Bulk payment allocation
- Batch customer credit application
- Multi-transaction reconciliation

### **Advanced Matching:**
- Bank reference number parsing
- Email payment notification integration
- SMS payment confirmation matching
- Cross-reference with PO numbers

### **Reporting:**
- Unallocated payments report
- Customer credit aging report
- Payment allocation audit trail
- Entity matching accuracy metrics

---

## 🎯 Summary

This enhancement transforms the bank import system from a **GL-only tool** into a **fully integrated AR/AP management system** while maintaining complete flexibility for users to choose their preferred workflow.

**Key Benefits:**
- ✅ Preserves traditional invoice-first workflow
- ✅ Adds intelligent payment-first capability
- ✅ Handles complex allocation scenarios
- ✅ Maintains proper subsidiary ledgers
- ✅ Full audit trail and compliance
- ✅ Significant time savings (60%+ reduction)
- ✅ Reduced errors (80% fewer manual entry mistakes)

**Ready for Implementation:** All phases documented, estimated, and prioritized.
