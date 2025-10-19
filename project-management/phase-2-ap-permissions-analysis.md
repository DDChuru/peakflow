# Phase 2: Accounts Payable - Permissions Analysis & Implementation Guide

**Date:** 2025-10-16
**Status:** Planning Phase
**Priority:** CRITICAL - Permissions must be implemented alongside features

---

## Executive Summary

This document provides a comprehensive analysis of permissions required for Phase 2 (Accounts Payable) features based on the existing permission system. We'll ensure all AP features have proper role-based access control from day one.

---

## Current Permission System Overview

### Existing User Roles
```typescript
type UserRole = 'super_admin' | 'admin' | 'financial_admin' | 'developer' | 'client';
```

### Role Hierarchy & Capabilities

| Role | Current Capabilities | AP Permissions Needed |
|------|---------------------|----------------------|
| **super_admin** | Full system access, all companies | Full AP access across all companies |
| **admin** | Company management, user management | Full AP access for their company |
| **financial_admin** | Currently undefined in rules | Should have AP transaction access, limited approval |
| **developer** | Company management (same as admin) | Full AP access (dev/testing) |
| **client** | Currently undefined in rules | Read-only AP access |

### Current Helper Functions (firestore.rules)
- `isAuthenticated()` - Check if user is logged in
- `hasRole(role)` - Check if user has specific role
- `isAdmin()` - Admin check
- `isDeveloper()` - Developer check
- `isSuperAdmin()` - Super admin check
- `canManageCompanies()` - Admin, developer, or super admin
- `belongsToCompany(companyId)` - User belongs to company or has access
- `isCompanyAdmin(companyId)` - User is admin of specific company

---

## Phase 2 AP Features & Required Permissions

### 1. Purchase Orders (POs)

#### Feature Requirements (from current-prompt.md)
- Multi-level approval routing based on approval limits
- PO creation, amendment, closeout
- PO-to-receipt matching
- Blanket PO functionality

#### Permission Requirements

**Collections:**
- `companies/{companyId}/purchaseOrders/{poId}`
- `companies/{companyId}/purchaseOrders/{poId}/approvals/{approvalId}` (subcollection)

**Operations & Roles:**

| Operation | super_admin | admin | financial_admin | developer | client |
|-----------|-------------|-------|-----------------|-----------|--------|
| **Create PO** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Read PO** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ✅ Own company |
| **Update PO (Draft)** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Update PO (Submitted)** | ✅ All | ✅ If approver | ✅ If approver | ✅ All | ❌ |
| **Delete PO (Draft only)** | ✅ All | ✅ Own company | ❌ | ✅ All | ❌ |
| **Approve PO** | ✅ All | ✅ Own company | ✅ Based on limit | ✅ All | ❌ |
| **Close PO** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |

**Additional Fields Needed:**
```typescript
interface PurchaseOrder {
  id: string;
  companyId: string;
  poNumber: string;
  vendorId: string; // Reference to creditor
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'closed' | 'cancelled';
  totalAmount: number;
  currency: string;
  approvalLimit: number; // Determines approval routing
  createdBy: string;
  createdAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  // ... other fields
}

interface PurchaseOrderApproval {
  id: string;
  poId: string;
  approverId: string;
  approverName: string;
  approverRole: string;
  approvalLimit: number;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approvedAt?: Date;
}
```

**Firestore Rules (Proposed):**
```javascript
// Purchase Orders collection
match /purchaseOrders/{poId} {
  // Read: Anyone in company can read
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: financial_admin, admin, super_admin, developer
  allow create: if (belongsToCompany(companyId) &&
                    (hasRole('financial_admin') || hasRole('admin'))) ||
                    canManageCompanies();

  // Update: Owner can update draft, approvers can update submitted
  allow update: if (belongsToCompany(companyId) &&
                    ((resource.data.status == 'draft' && resource.data.createdBy == request.auth.uid) ||
                     (resource.data.status == 'pending_approval' && canApprovePO(companyId, resource.data.approvalLimit)) ||
                     hasRole('admin'))) ||
                    canManageCompanies();

  // Delete: Only draft POs, only by admin or creator
  allow delete: if (belongsToCompany(companyId) &&
                    resource.data.status == 'draft' &&
                    (hasRole('admin') || resource.data.createdBy == request.auth.uid)) ||
                    canManageCompanies();

  // Approvals subcollection
  match /approvals/{approvalId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create: if belongsToCompany(companyId) || canManageCompanies();
    allow update: if belongsToCompany(companyId) || canManageCompanies();
    allow delete: if canManageCompanies();
  }
}
```

---

### 2. Vendor Bills/Invoices

#### Feature Requirements
- Invoice capture and processing
- 3-way matching (PO-Receipt-Invoice)
- Invoice approval workflow
- Duplicate invoice detection
- Accrual processes

#### Permission Requirements

**Collections:**
- `companies/{companyId}/vendorBills/{billId}`
- `companies/{companyId}/vendorBills/{billId}/matches/{matchId}` (for 3-way matching)
- `companies/{companyId}/vendorBills/{billId}/approvals/{approvalId}`

**Operations & Roles:**

| Operation | super_admin | admin | financial_admin | developer | client |
|-----------|-------------|-------|-----------------|-----------|--------|
| **Create Bill** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Read Bill** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ✅ Own company (read-only) |
| **Update Bill (Draft)** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Update Bill (Posted)** | ✅ All | ❌ Immutable | ❌ Immutable | ✅ All (testing) | ❌ |
| **Delete Bill (Draft only)** | ✅ All | ✅ Own company | ❌ | ✅ All | ❌ |
| **Post Bill to GL** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Approve Payment** | ✅ All | ✅ Own company | ✅ Based on limit | ✅ All | ❌ |

**Additional Fields Needed:**
```typescript
interface VendorBill {
  id: string;
  companyId: string;
  billNumber: string;
  vendorBillNumber: string; // Vendor's invoice number
  vendorId: string; // Reference to creditor
  poId?: string; // Optional: linked PO
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'paid' | 'cancelled';
  totalAmount: number;
  taxAmount: number;
  currency: string;
  dueDate: Date;
  billDate: Date;
  lineItems: VendorBillLine[];
  matched: boolean; // 3-way match status
  matchedPOId?: string;
  matchedReceiptId?: string;
  glPosted: boolean;
  glPostingDate?: Date;
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

**Firestore Rules (Proposed):**
```javascript
// Vendor Bills collection
match /vendorBills/{billId} {
  // Read: Anyone in company can read
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: financial_admin, admin, super_admin, developer
  allow create: if (belongsToCompany(companyId) &&
                    (hasRole('financial_admin') || hasRole('admin'))) ||
                    canManageCompanies();

  // Update: Only draft bills can be updated, or admin can update
  allow update: if (belongsToCompany(companyId) &&
                    ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                     hasRole('admin'))) ||
                    canManageCompanies();

  // Delete: Only draft bills, only by admin
  allow delete: if (belongsToCompany(companyId) &&
                    resource.data.status == 'draft' &&
                    hasRole('admin')) ||
                    canManageCompanies();

  // Matches subcollection (3-way matching)
  match /matches/{matchId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create, update: if belongsToCompany(companyId) || canManageCompanies();
    allow delete: if canManageCompanies();
  }

  // Approvals subcollection
  match /approvals/{approvalId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create, update: if belongsToCompany(companyId) || canManageCompanies();
    allow delete: if canManageCompanies();
  }
}
```

---

### 3. Payment Processing

#### Feature Requirements
- Payment run selection
- Payment method management
- Check/EFT generation
- Payment approval workflow
- Payment void/reissue

#### Permission Requirements

**Collections:**
- `companies/{companyId}/payments/{paymentId}`
- `companies/{companyId}/paymentRuns/{runId}`
- `companies/{companyId}/payments/{paymentId}/approvals/{approvalId}`

**Operations & Roles:**

| Operation | super_admin | admin | financial_admin | developer | client |
|-----------|-------------|-------|-----------------|-----------|--------|
| **Create Payment** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Read Payment** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ✅ Own company (read-only) |
| **Update Payment (Draft)** | ✅ All | ✅ Own company | ✅ Own company | ✅ All | ❌ |
| **Update Payment (Processed)** | ✅ All | ❌ Immutable | ❌ Immutable | ✅ All (testing) | ❌ |
| **Delete Payment (Draft only)** | ✅ All | ✅ Own company | ❌ | ✅ All | ❌ |
| **Approve Payment** | ✅ All | ✅ Own company | ✅ Based on limit | ✅ All | ❌ |
| **Process Payment Run** | ✅ All | ✅ Own company | ❌ Admin only | ✅ All | ❌ |
| **Void Payment** | ✅ All | ✅ Own company | ❌ Admin only | ✅ All | ❌ |

**Additional Fields Needed:**
```typescript
interface Payment {
  id: string;
  companyId: string;
  paymentNumber: string;
  vendorId: string;
  billIds: string[]; // Bills being paid
  paymentMethod: 'check' | 'eft' | 'wire' | 'cash';
  status: 'draft' | 'pending_approval' | 'approved' | 'processed' | 'void' | 'cancelled';
  amount: number;
  currency: string;
  paymentDate: Date;
  checkNumber?: string;
  bankAccountId: string; // Which bank account to pay from
  glPosted: boolean;
  glPostingDate?: Date;
  voidedAt?: Date;
  voidedBy?: string;
  voidReason?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaymentRun {
  id: string;
  companyId: string;
  runNumber: string;
  runDate: Date;
  status: 'draft' | 'processing' | 'completed' | 'failed';
  paymentIds: string[];
  totalAmount: number;
  currency: string;
  bankAccountId: string;
  processedBy: string;
  processedAt?: Date;
  createdBy: string;
  createdAt: Date;
}
```

**Firestore Rules (Proposed):**
```javascript
// Payments collection
match /payments/{paymentId} {
  // Read: Anyone in company can read
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create: financial_admin, admin, super_admin, developer
  allow create: if (belongsToCompany(companyId) &&
                    (hasRole('financial_admin') || hasRole('admin'))) ||
                    canManageCompanies();

  // Update: Only draft/pending payments, admin can process
  allow update: if (belongsToCompany(companyId) &&
                    ((resource.data.status == 'draft' || resource.data.status == 'pending_approval') ||
                     (hasRole('admin') && resource.data.status != 'void'))) ||
                    canManageCompanies();

  // Delete: Only draft payments, only by admin
  allow delete: if (belongsToCompany(companyId) &&
                    resource.data.status == 'draft' &&
                    hasRole('admin')) ||
                    canManageCompanies();

  // Approvals subcollection
  match /approvals/{approvalId} {
    allow read: if belongsToCompany(companyId) || canManageCompanies();
    allow create, update: if belongsToCompany(companyId) || canManageCompanies();
    allow delete: if canManageCompanies();
  }
}

// Payment Runs collection
match /paymentRuns/{runId} {
  // Read: Anyone in company can read
  allow read: if belongsToCompany(companyId) || canManageCompanies();

  // Create/Update/Delete: Only admin
  allow create, update: if (belongsToCompany(companyId) && hasRole('admin')) ||
                           canManageCompanies();
  allow delete: if (belongsToCompany(companyId) &&
                    hasRole('admin') &&
                    resource.data.status == 'draft') ||
                    canManageCompanies();
}
```

---

## NEW: Approval Limits System

### Required Implementation

To support multi-level approval routing, we need to add approval limits to user profiles:

**Update to User Interface:**
```typescript
// /src/types/auth.ts
export interface User {
  uid: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  imageUrl?: string;
  companyId?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  accessibleCompanyIds?: string[];

  // NEW: Approval limits per company
  approvalLimits?: {
    [companyId: string]: {
      purchaseOrderLimit: number;  // Maximum PO amount user can approve
      paymentLimit: number;         // Maximum payment amount user can approve
      billLimit: number;            // Maximum bill amount user can approve
    }
  };
}
```

**New Helper Function for Firestore Rules:**
```javascript
// Add to firestore.rules
function canApprovePO(companyId, poAmount) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    (
      hasRole('admin') || // Admins can approve any amount
      canManageCompanies() || // Super admins/developers can approve any amount
      (
        belongsToCompany(companyId) &&
        hasRole('financial_admin') &&
        get(/databases/$(database)/documents/users/$(request.auth.uid))
          .data.approvalLimits[companyId].purchaseOrderLimit >= poAmount
      )
    );
}

function canApprovePayment(companyId, paymentAmount) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    (
      hasRole('admin') ||
      canManageCompanies() ||
      (
        belongsToCompany(companyId) &&
        hasRole('financial_admin') &&
        get(/databases/$(database)/documents/users/$(request.auth.uid))
          .data.approvalLimits[companyId].paymentLimit >= paymentAmount
      )
    );
}
```

---

## Implementation Checklist

### Step 1: Update User Type & Service
- [ ] Add `approvalLimits` field to User interface in `/src/types/auth.ts`
- [ ] Update UserService to handle approval limits
- [ ] Create UI for admin to set user approval limits
- [ ] Add approval limits to user profile page

### Step 2: Create New AP Types
- [ ] Create `/src/types/accounting/purchase-order.ts`
- [ ] Create `/src/types/accounting/vendor-bill.ts`
- [ ] Create `/src/types/accounting/payment.ts`
- [ ] Add approval workflow types

### Step 3: Update Firestore Rules
- [ ] Add new helper functions (`canApprovePO`, `canApprovePayment`)
- [ ] Add rules for `purchaseOrders` collection
- [ ] Add rules for `vendorBills` collection
- [ ] Add rules for `payments` collection
- [ ] Add rules for `paymentRuns` collection
- [ ] Test rules with Firebase Emulator

### Step 4: Create Service Layer
- [ ] Create `/src/lib/accounting/purchase-order-service.ts`
- [ ] Create `/src/lib/accounting/vendor-bill-service.ts`
- [ ] Create `/src/lib/accounting/payment-service.ts`
- [ ] Create `/src/lib/accounting/approval-workflow-service.ts`

### Step 5: Build UI Components
- [ ] Create PO management UI
- [ ] Create vendor bill management UI
- [ ] Create payment processing UI
- [ ] Create approval workflow UI
- [ ] Add permission checks to all UI elements

### Step 6: Testing
- [ ] Test each role's permissions
- [ ] Test approval limit enforcement
- [ ] Test multi-level approval routing
- [ ] Test immutability of posted records
- [ ] Document test results

---

## Security Considerations

### 1. Immutability of Financial Records
- **Posted bills MUST be immutable** (except by admin for corrections)
- **Processed payments MUST be immutable** (except void operation)
- **Approved POs should only allow amendment workflow**, not direct edits

### 2. Approval Audit Trail
- All approvals must be logged with timestamp and user
- Approval history must be immutable
- Rejection reasons must be captured

### 3. Segregation of Duties
- **Creator cannot approve** their own POs/bills (except admin)
- **Payment processors should not be able to create vendors** (separation)
- **Approval limits must be enforced** at both UI and backend

### 4. Role Transitions
When implementing `financial_admin` role:
- Must have clear definition of what they CAN'T do (vs admin)
- Cannot modify approval limits
- Cannot delete users
- Cannot modify company settings (except currency/VAT)

---

## Recommended Role Definitions

### Enhanced Role Capabilities

**super_admin:**
- Full access to all companies
- Can manage all users
- Bypass all approval limits
- Access to system configuration

**admin:**
- Full access to their company
- Can manage users in their company
- Can set approval limits for users
- Bypass approval limits for their company
- Can void payments
- Can process payment runs

**financial_admin:**
- Create/edit POs, bills, payments
- Approve within their limit
- Post to GL
- Cannot delete posted records
- Cannot manage users
- Cannot set approval limits

**developer:**
- Same as super_admin (for testing)
- Can delete/modify any records (non-production only)

**client:**
- Read-only access to all AP records
- Can view reports
- Cannot create/edit/approve anything

---

## Next Steps

1. **Review this document** with stakeholders
2. **Confirm role definitions** and approval workflow
3. **Implement approval limits** in user management
4. **Update Firestore rules** with new helper functions
5. **Create AP type definitions** and service layer
6. **Build UI with permission checks** from day one
7. **Test thoroughly** with different role combinations

---

## Questions for Clarification

1. **Approval Limits:** Should there be a default approval limit for financial_admin role, or should it always be set per user?
2. **Payment Approval:** Should payments require separate approval from bills, or is bill approval sufficient?
3. **Vendor Management:** Should `client` role be able to see vendor bank details, or should that be restricted?
4. **Bill Posting:** Can `financial_admin` post bills to GL, or should that require `admin` approval?
5. **PO Amendments:** Should PO amendments require re-approval, or can they be auto-approved if within original limit?

