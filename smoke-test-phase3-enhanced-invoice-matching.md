# Smoke Test Guide: Phase 3 - Enhanced Invoice/Bill Matching

**Feature**: Enhanced Invoice & Bill Matching with Multi-Invoice and Partial Payment Detection
**Phase**: AI Agent Phase 3
**Estimated Testing Time**: 20-25 minutes
**Prerequisites**: Phase 1 & 2 Complete (Entity Matching & Pending Payments)

---

## 🎯 What Was Implemented

### **Enhanced Matching Algorithms**
1. **Improved Scoring System** - Weighted factors (amount: 40%, date: 25%, due date: 15%, status: 15%, age: 5%)
2. **Multi-Invoice Detection** - Detect when payment matches combination of 2-5 invoices
3. **Partial Payment Detection** - Identify partial payments (10%+ of invoice) with percentage recognition
4. **Visual Match Reasons** - Emoji-rich, detailed explanations for each match

### **Key Features**
- ✓ Enhanced amount matching (exact, ±2%, ±5%, ±10%, partial)
- ✓ Due date proximity scoring (before/after due date awareness)
- ✓ Invoice status prioritization (overdue > partially-paid > sent)
- ✓ Multi-invoice combination detection (2-5 invoices)
- ✓ Partial payment percentage recognition (50%, 25%, 75%, 33%, 66%)
- ✓ Detailed match reasoning with visual indicators

---

## 📋 Test Scenarios

### **Test Suite 1: Enhanced Single Invoice Matching**

#### **Test 1.1: Exact Amount Match**
**Setup:**
```typescript
const invoice = {
  id: 'INV-001',
  invoiceNumber: 'INV-2025-001',
  customerId: 'CUST-001',
  date: '2025-10-01',
  dueDate: '2025-10-31',
  amountDue: 5000.00,
  status: 'sent'
};

const payment = {
  amount: 5000.00,
  date: new Date('2025-10-15')
};
```

**Expected Result:**
- ✓ Confidence: 85-95%
- ✓ Match reasons include:
  - `✓ Exact amount match: R5000.00`
  - `📅 Recent invoice (14 days)`
  - `🟡 Sent invoice (awaiting payment)`
- ✓ exactAmountMatch: true

---

#### **Test 1.2: Close Amount Match (±2%)**
**Setup:**
```typescript
const invoice = {
  amountDue: 5000.00
};

const payment = {
  amount: 4950.00 // 1% difference
};
```

**Expected Result:**
- ✓ Confidence: 80-90%
- ✓ Match reasons include: `≈ Very close amount: R5000.00 (±2%)`
- ✓ exactAmountMatch: false but high confidence

---

#### **Test 1.3: Due Date Awareness**
**Setup:**
```typescript
const invoice = {
  amountDue: 5000.00,
  dueDate: '2025-10-15'
};

const payment = {
  amount: 5000.00,
  date: new Date('2025-10-17') // 2 days after due date
};
```

**Expected Result:**
- ✓ Match reasons include: `⏰ Paid 2 days after due date`
- ✓ Extra 15 points for due date proximity
- ✓ Confidence boost from due date scoring

---

#### **Test 1.4: Overdue Invoice Priority**
**Setup:**
```typescript
const invoice1 = {
  amountDue: 5000.00,
  status: 'overdue'
};

const invoice2 = {
  amountDue: 5000.00,
  status: 'sent'
};

const payment = {
  amount: 5000.00
};
```

**Expected Result:**
- ✓ `invoice1` (overdue) scores higher than `invoice2` (sent)
- ✓ Match reasons include: `🔴 Overdue invoice (high priority)`
- ✓ 15-point bonus for overdue status

---

### **Test Suite 2: Multi-Invoice Payment Detection**

#### **Test 2.1: Two Invoice Combination**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 3000.00 },
  { invoiceNumber: 'INV-002', amountDue: 2000.00 },
  { invoiceNumber: 'INV-003', amountDue: 1500.00 }
];

const payment = {
  amount: 5000.00 // Matches INV-001 + INV-002
};

// Call detectMultiInvoicePayment()
const suggestions = await debtorMatchingService.detectMultiInvoicePayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ At least 1 suggestion returned
- ✓ First suggestion:
  - `invoices`: [INV-001, INV-002]
  - `totalAmount`: 5000.00
  - `confidence`: 95%
  - `matchReasons`: ['✓ Exact match for 2 invoices', 'Invoices: INV-001, INV-002', 'Total: R5000.00']

---

#### **Test 2.2: Three Invoice Combination**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 1000.00 },
  { invoiceNumber: 'INV-002', amountDue: 1500.00 },
  { invoiceNumber: 'INV-003', amountDue: 2500.00 }
];

const payment = {
  amount: 5000.00 // Matches all 3
};

const suggestions = await debtorMatchingService.detectMultiInvoicePayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ Suggestion with 3 invoices
- ✓ Confidence: 95%
- ✓ Match reasons: `✓ Exact match for 3 invoices`

---

#### **Test 2.3: Multiple Combination Options**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 2500.00 },
  { invoiceNumber: 'INV-002', amountDue: 2500.00 },
  { invoiceNumber: 'INV-003', amountDue: 5000.00 }
];

const payment = {
  amount: 5000.00 // Matches INV-003 OR (INV-001 + INV-002)
};
```

**Expected Result:**
- ✓ Multiple suggestions returned (top 3)
- ✓ Each suggestion has different invoice combinations
- ✓ Sorted by confidence (highest first)
- ✓ Both options have high confidence

---

### **Test Suite 3: Partial Payment Detection**

#### **Test 3.1: Half Payment (50%)**
**Setup:**
```typescript
const invoices = [
  {
    invoiceNumber: 'INV-001',
    amountDue: 10000.00
  }
];

const payment = {
  amount: 5000.00 // 50% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ First suggestion:
  - `invoice`: INV-001
  - `percentage`: 50.0
  - `remainingAmount`: 5000.00
  - `confidence`: 90%
  - `matchReasons`: [
      '💰 Likely half payment (50%)',
      'Invoice: INV-001 - R10000.00',
      'Payment covers 50.0% (R5000.00)',
      'Remaining: R5000.00'
    ]

---

#### **Test 3.2: Quarter Payment (25%)**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 8000.00 }
];

const payment = {
  amount: 2000.00 // 25% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ Confidence: 85%
- ✓ Match reasons: `💰 Likely quarter payment (25%)`
- ✓ Percentage: ~25%

---

#### **Test 3.3: One-Third Payment (33%)**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 9000.00 }
];

const payment = {
  amount: 3000.00 // 33.33% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ Confidence: 80%
- ✓ Match reasons: `💰 Likely one-third payment (33%)`

---

#### **Test 3.4: Irregular Percentage (60%)**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 10000.00 }
];

const payment = {
  amount: 6000.00 // 60% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ Confidence: 65%
- ✓ Match reasons: `💰 Substantial partial payment (50-80%)`

---

#### **Test 3.5: Small Partial Payment (15%)**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 10000.00 }
];

const payment = {
  amount: 1500.00 // 15% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ Confidence: 45%
- ✓ Match reasons: `💰 Small partial payment (10-25%)`

---

#### **Test 3.6: Too Small to Suggest (<10%)**
**Setup:**
```typescript
const invoices = [
  { invoiceNumber: 'INV-001', amountDue: 10000.00 }
];

const payment = {
  amount: 500.00 // 5% of invoice
};

const suggestions = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Result:**
- ✓ No suggestions returned (empty array)
- ✓ Partial payment too small (<10%)

---

### **Test Suite 4: Combined Scenario Testing**

#### **Test 4.1: Payment with Multiple Possibilities**
**Setup:**
```typescript
const invoices = [
  {
    invoiceNumber: 'INV-001',
    amountDue: 5000.00,
    status: 'overdue',
    date: '2025-09-01',
    dueDate: '2025-09-30'
  },
  {
    invoiceNumber: 'INV-002',
    amountDue: 2500.00,
    status: 'sent',
    date: '2025-10-01',
    dueDate: '2025-10-31'
  },
  {
    invoiceNumber: 'INV-003',
    amountDue: 10000.00,
    status: 'sent',
    date: '2025-10-05',
    dueDate: '2025-11-05'
  }
];

const payment = {
  amount: 5000.00,
  date: new Date('2025-10-15')
};

// Run all detection methods
const singleMatch = await debtorMatchingService.suggestInvoiceMatch(
  invoices,
  payment.amount,
  payment.date
);

const multiMatch = await debtorMatchingService.detectMultiInvoicePayment(
  invoices,
  payment.amount
);

const partialMatch = await debtorMatchingService.detectPartialPayment(
  invoices,
  payment.amount
);
```

**Expected Results:**
- ✓ **Single Match**: INV-001 (exact amount, overdue priority)
- ✓ **Multi Match**: [INV-001] OR [INV-002 + another] combinations
- ✓ **Partial Match**: INV-003 (50% payment suggestion)
- ✓ All three detection methods return valid suggestions
- ✓ User can choose which scenario fits best

---

### **Test Suite 5: Weighted Scoring Verification**

#### **Test 5.1: Amount Weight (40 points)**
**Test that amount matching contributes up to 40 points**

**Setup:**
```typescript
const invoice = {
  amountDue: 5000.00,
  date: '2025-01-01', // Very old
  dueDate: '2025-01-31', // Very old
  status: 'sent' // Not overdue
};

const payment = {
  amount: 5000.00, // Exact match
  date: new Date('2025-10-15') // Recent
};
```

**Expected:**
- ✓ Base score ≥ 40 from amount alone
- ✓ Even with old dates, exact amount match provides strong suggestion

---

#### **Test 5.2: Date Weight (25 points)**
**Test that recent invoices score high even with approximate amounts**

**Setup:**
```typescript
const invoice = {
  amountDue: 5000.00,
  date: '2025-10-14', // 1 day ago
  status: 'sent'
};

const payment = {
  amount: 4700.00, // 6% difference (moderate match)
  date: new Date('2025-10-15')
};
```

**Expected:**
- ✓ Date proximity contributes ~25 points
- ✓ Total confidence still reasonable despite amount difference

---

## 🧪 Integration Testing

### **Test 6: Full Entity Matching + Invoice Suggestion Flow**

**Scenario**: Customer payment comes in, system matches customer and suggests invoice

**Setup:**
```typescript
// 1. Create customer with outstanding invoices
const customer = {
  id: 'CUST-001',
  name: 'Acme Corporation'
};

const invoices = [
  {
    customerId: 'CUST-001',
    invoiceNumber: 'INV-001',
    amountDue: 5000.00,
    status: 'sent'
  }
];

// 2. Bank transaction arrives
const transaction = {
  description: 'Payment from ACME CORP',
  credit: 5000.00,
  date: new Date('2025-10-15')
};

// 3. Run entity matching
const debtorMatch = await debtorMatchingService.findMatchingDebtor(
  companyId,
  transaction.description,
  transaction.credit,
  transaction.date
);
```

**Expected Result:**
- ✓ Customer matched: Acme Corporation (confidence >80%)
- ✓ Outstanding invoices found: [INV-001]
- ✓ Suggested invoice: INV-001 with high confidence
- ✓ Match reasons include amount + date + status scoring
- ✓ `suggestedInvoice` field populated with full details

---

## ✅ Verification Checklist

### **Code Quality**
- [ ] No TypeScript compilation errors
- [ ] All new methods have JSDoc comments
- [ ] Method signatures match type definitions
- [ ] Weighted scoring adds up to 100 points max

### **Functionality**
- [ ] Single invoice matching works with improved scoring
- [ ] Multi-invoice detection finds 2-5 invoice combinations
- [ ] Partial payment detection recognizes common percentages (25%, 33%, 50%, 66%, 75%)
- [ ] Match reasons are detailed and user-friendly
- [ ] Emoji indicators enhance readability

### **Edge Cases**
- [ ] Empty invoice array returns null/empty array
- [ ] Single invoice array doesn't trigger multi-detection
- [ ] Payments <10% of invoice amount aren't suggested as partials
- [ ] Very old invoices still considered with reduced confidence
- [ ] Multiple invoices with same amount handled correctly

### **Performance**
- [ ] Combination algorithm limited to 5 invoices max
- [ ] Top 3 multi-invoice suggestions returned (not all)
- [ ] Top 5 partial payment suggestions returned (not all)
- [ ] Suggestions sorted by confidence (highest first)

---

## 🐛 Known Issues & Limitations

### **Combination Complexity**
- Combinations limited to 2-5 invoices to prevent exponential growth
- With 10 invoices, max combinations = C(10,5) = 252 (acceptable)
- Larger invoice lists (>20) may experience slight delay

### **Partial Payment Thresholds**
- Minimum 10% threshold may miss very small payments
- Confidence drops below 50% for irregular percentages (e.g., 37%)

### **Date Scoring**
- Very old invoices (>60 days) contribute minimal date score
- May need age-based adjustments for industries with long payment terms

---

## 📚 Testing Data Recommendations

### **Realistic Test Dataset**
Create test data that mirrors real-world scenarios:

```typescript
const realisticScenarios = [
  // Scenario 1: Exact match
  { payment: 5000, invoices: [{ amount: 5000 }] },

  // Scenario 2: Half payment
  { payment: 2500, invoices: [{ amount: 5000 }] },

  // Scenario 3: Multi-invoice (2 old invoices paid together)
  { payment: 7500, invoices: [
    { amount: 3500, date: '2025-08-01' },
    { amount: 4000, date: '2025-09-01' }
  ]},

  // Scenario 4: Payment slightly less than invoice (bank fees)
  { payment: 4950, invoices: [{ amount: 5000 }] },

  // Scenario 5: Overdue invoice gets priority
  { payment: 5000, invoices: [
    { amount: 5000, status: 'overdue', date: '2025-08-01' },
    { amount: 5000, status: 'sent', date: '2025-10-01' }
  ]}
];
```

---

## 🎯 Success Criteria

**Phase 3 is successful if:**
1. ✓ Single invoice matching uses all 5 weighted factors
2. ✓ Multi-invoice detection finds exact combinations (±tolerance)
3. ✓ Partial payment recognition works for common percentages
4. ✓ Match reasons are detailed, emoji-rich, and user-friendly
5. ✓ Confidence scores accurately reflect match quality
6. ✓ Performance is acceptable for typical invoice counts (≤50)
7. ✓ Integration with existing entity matching works seamlessly

---

## 📝 Next Steps (Phase 4 & 5)

After Phase 3 smoke testing passes:
1. **Phase 4**: Build UI to display multi-invoice and partial payment suggestions
2. **Phase 5**: Implement payment allocation interface with split/partial handling
3. **Phase 6**: Add credit note creation for over-payments

---

**Questions or Issues?** Document findings in GitHub Issues with label `phase-3-testing`
