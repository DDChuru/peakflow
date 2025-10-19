# Phase 2: Accounts Payable - Simple Permissions Approach

**Date:** 2025-10-16
**Status:** Implementation Ready
**Approach:** Simple workflow first, DOA approval matrix as premium tier later

---

## Simple Permission Philosophy

Keep permissions straightforward for initial implementation:
- **Any company user** can CREATE records (requisitions, POs, bills)
- **admin & financial_admin** can APPROVE and POST
- **Everyone in company** can READ
- **Tenant-specific DOA workflows** = Premium tier feature (Phase 8+)

---

## Phase 2 Features - Simple Workflow

### 1. Purchase Orders (POs)

**Simple Workflow:**
```
1. User creates PO → Status: "draft"
2. User submits PO → Status: "pending_approval"
3. Admin/Financial Admin approves → Status: "approved"
4. Goods received → Status: "received"
5. Invoice matched → Status: "closed"
```

**Firestore Rules:**
```javascript
match /purchaseOrders/{poId} {
  // Read: Anyone in company
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: Anyone in company
  allow create: if belongsToCompany(companyId);

  // Update: Creator (draft), admin/financial_admin (any status)
  allow update: if belongsToCompany(companyId) &&
                   (resource.data.createdBy == request.auth.uid ||
                    hasRole('admin') ||
                    hasRole('financial_admin')) ||
                   canManageCompanies();

  // Delete: Admin only, draft only
  allow delete: if (belongsToCompany(companyId) &&
                    hasRole('admin') &&
                    resource.data.status == 'draft') ||
                   canManageCompanies();
}
```

**TypeScript Interface:**
```typescript
interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string; // Auto-generated: PO-2025-0001
  vendorId: string;
  vendorName: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'received' | 'closed' | 'cancelled';
  totalAmount: number;
  currency: string;
  lineItems: PurchaseOrderLine[];

  // Simple approval (no DOA)
  approvedBy?: string;
  approvedAt?: Date;

  // Audit trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PurchaseOrderLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountCode?: string;
}
```

---

### 2. Vendor Bills/Invoices

**Simple Workflow:**
```
1. User captures bill → Status: "draft"
2. Optional: Match to PO (3-way match)
3. User submits bill → Status: "pending_approval"
4. Admin/Financial Admin approves → Status: "approved"
5. Bill posted to GL → Status: "posted"
6. Payment made → Status: "paid"
```

**Firestore Rules:**
```javascript
match /vendorBills/{billId} {
  // Read: Anyone in company
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: Anyone in company
  allow create: if belongsToCompany(companyId);

  // Update: Draft/pending can be updated by creator or admin/financial_admin
  //         Posted bills are immutable (except by super admin for corrections)
  allow update: if (belongsToCompany(companyId) &&
                    ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                     hasRole('admin') ||
                     hasRole('financial_admin'))) ||
                   canManageCompanies();

  // Delete: Admin only, draft only
  allow delete: if (belongsToCompany(companyId) &&
                    hasRole('admin') &&
                    resource.data.status == 'draft') ||
                   canManageCompanies();
}
```

**TypeScript Interface:**
```typescript
interface VendorBill {
  id: string;
  companyId: string;
  billNumber: string; // Auto-generated: BILL-2025-0001
  vendorBillNumber: string; // Vendor's invoice number
  vendorId: string;
  vendorName: string;

  // Optional PO matching
  poId?: string;
  poNumber?: string;
  matched: boolean; // 3-way match completed

  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'paid' | 'cancelled';

  billDate: Date;
  dueDate: Date;
  totalAmount: number;
  taxAmount: number;
  currency: string;

  lineItems: VendorBillLine[];

  // GL posting
  glPosted: boolean;
  glPostingDate?: Date;
  journalEntryId?: string;

  // Simple approval
  approvedBy?: string;
  approvedAt?: Date;

  // Audit trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface VendorBillLine {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  glAccountCode: string;
  glAccountName?: string;
  taxAmount?: number;
  poLineId?: string; // For 3-way matching
}
```

---

### 3. Payments

**Simple Workflow:**
```
1. User creates payment → Status: "draft"
2. Link payment to bills
3. User submits payment → Status: "pending_approval"
4. Admin approves → Status: "approved"
5. Admin processes payment → Status: "processed"
6. Payment posted to GL → Status: "posted"
```

**Firestore Rules:**
```javascript
match /payments/{paymentId} {
  // Read: Anyone in company
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: Anyone in company
  allow create: if belongsToCompany(companyId);

  // Update: Draft/pending by creator or admin/financial_admin
  //         Processed payments are immutable (except void by admin)
  allow update: if (belongsToCompany(companyId) &&
                    ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                     hasRole('admin'))) ||
                   canManageCompanies();

  // Delete: Admin only, draft only
  allow delete: if (belongsToCompany(companyId) &&
                    hasRole('admin') &&
                    resource.data.status == 'draft') ||
                   canManageCompanies();
}
```

**TypeScript Interface:**
```typescript
interface Payment {
  id: string;
  companyId: string;
  paymentNumber: string; // Auto-generated: PAY-2025-0001
  vendorId: string;
  vendorName: string;

  billIds: string[]; // Bills being paid
  billAllocations: {
    billId: string;
    billNumber: string;
    amountAllocated: number;
  }[];

  paymentMethod: 'check' | 'eft' | 'wire' | 'cash';
  status: 'draft' | 'pending_approval' | 'approved' | 'processed' | 'posted' | 'void';

  amount: number;
  currency: string;
  paymentDate: Date;

  // Payment details
  checkNumber?: string;
  referenceNumber?: string;
  bankAccountId: string;
  bankAccountName?: string;

  // GL posting
  glPosted: boolean;
  glPostingDate?: Date;
  journalEntryId?: string;

  // Void handling
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;

  // Simple approval
  approvedBy?: string;
  approvedAt?: Date;
  processedBy?: string;
  processedAt?: Date;

  // Audit trail
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Simple Firestore Rules Summary

Add these rules to `firestore.rules` inside the `match /companies/{companyId}` block:

```javascript
// Inside: match /companies/{companyId} {

  // Purchase Orders collection
  match /purchaseOrders/{poId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create: if belongsToCompany(companyId);
    allow update: if belongsToCompany(companyId) &&
                     (resource.data.createdBy == request.auth.uid ||
                      hasRole('admin') ||
                      hasRole('financial_admin')) ||
                     canManageCompanies();
    allow delete: if (belongsToCompany(companyId) &&
                      hasRole('admin') &&
                      resource.data.status == 'draft') ||
                     canManageCompanies();
  }

  // Vendor Bills collection
  match /vendorBills/{billId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create: if belongsToCompany(companyId);
    allow update: if (belongsToCompany(companyId) &&
                      ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                       hasRole('admin') ||
                       hasRole('financial_admin'))) ||
                     canManageCompanies();
    allow delete: if (belongsToCompany(companyId) &&
                      hasRole('admin') &&
                      resource.data.status == 'draft') ||
                     canManageCompanies();
  }

  // Payments collection
  match /payments/{paymentId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create: if belongsToCompany(companyId);
    allow update: if (belongsToCompany(companyId) &&
                      ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                       hasRole('admin'))) ||
                     canManageCompanies();
    allow delete: if (belongsToCompany(companyId) &&
                      hasRole('admin') &&
                      resource.data.status == 'draft') ||
                     canManageCompanies();
  }

// } // End of companies/{companyId} match
```

---

## Implementation Checklist

### Step 1: Create Type Definitions
- [ ] Create `/src/types/accounting/purchase-order.ts`
- [ ] Create `/src/types/accounting/vendor-bill.ts`
- [ ] Create `/src/types/accounting/payment.ts`

### Step 2: Update Firestore Rules
- [ ] Add PO rules to `firestore.rules`
- [ ] Add vendor bill rules to `firestore.rules`
- [ ] Add payment rules to `firestore.rules`
- [ ] Deploy rules: `firebase deploy --only firestore:rules`

### Step 3: Create Service Layer
- [ ] Create `/src/lib/accounting/purchase-order-service.ts`
- [ ] Create `/src/lib/accounting/vendor-bill-service.ts`
- [ ] Create `/src/lib/accounting/payment-service.ts`

### Step 4: Build UI Pages
- [ ] Create `/app/workspace/[companyId]/purchase-orders/page.tsx`
- [ ] Create `/app/workspace/[companyId]/vendor-bills/page.tsx`
- [ ] Create `/app/workspace/[companyId]/payments/page.tsx`

### Step 5: GL Integration
- [ ] Add bill posting to GL via PostingService
- [ ] Add payment posting to GL via PostingService
- [ ] Update AP control account (2100 - Accounts Payable)

---

## Premium Tier: DOA Approval Workflows (Phase 8+)

Document the premium tier features in roadmap:

### DOA (Delegation of Authority) Features
- **Multi-level approval routing** based on dollar amounts
- **Tenant-configurable approval matrix** (per company)
- **Role-based approval limits** (Department Head: $25k, CFO: $500k, etc.)
- **Parallel vs. Sequential approvals** (e.g., Finance + Operations both approve)
- **Escalation workflows** (auto-escalate after 3 days)
- **Approval substitutes** (delegate authority when out of office)
- **Approval analytics** (average approval time, bottlenecks)

### Additional Premium AP Features
- **Budget checking** - Check against department budgets before approval
- **Vendor performance tracking** - Rating, on-time delivery, quality scores
- **Contract management** - Link POs to contracts, track commitments
- **Accrual automation** - Auto-create accruals for goods received not invoiced (GRNI)
- **Payment batching** - Combine multiple payments for efficiency
- **Early payment discounts** - Auto-calculate 2/10 net 30 discounts
- **Vendor portal** - Vendors can view POs, upload invoices
- **OCR invoice scanning** - AI extracts data from vendor invoices

---

## Role Definitions (Simple)

### admin
- Create, approve, post, process all AP transactions
- Delete draft records
- Void processed payments
- Manage vendor master data

### financial_admin
- Create, approve, post AP transactions
- Cannot delete records
- Cannot void processed payments
- Can manage vendor master data

### developer / super_admin
- Full access to all companies
- Can modify/delete any records (testing/support)

### client (future)
- Read-only access to AP records
- Can view reports

---

## Next Steps

1. ✅ Review and approve simple permissions approach
2. Create type definitions for PO, Bills, Payments
3. Update Firestore rules
4. Build service layer
5. Create UI pages with simple approval workflows
6. Add to roadmap: Premium DOA workflow features

