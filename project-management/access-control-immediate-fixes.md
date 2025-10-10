# Immediate Access Control Fixes Required

## Critical Issues Found

### 1. URGENT: Companies Page Contains Financial Operations (WRONG!)

**Location**: `/app/companies/page.tsx` lines 279-288

**Problem**: The admin company management page incorrectly has buttons for:
- "Financial dashboard" (line 279-283)
- "Bank statements" (line 284-288)

**Why This Is Wrong**:
- `/companies` is for **company management** (CRUD operations on companies)
- Financial operations belong in `/workspace/[companyId]/*`
- This violates separation of concerns
- Confuses users about where to find features
- Breaks the logical navigation flow

**Fix Required**:
```typescript
// REMOVE these lines (279-288):
<Link href={`/companies/${company.id}/financial-dashboard`}>
  <Button variant="outline" size="sm">
    Financial dashboard
  </Button>
</Link>
<Link href={`/dashboard/bank-statements/${company.id}`}>
  <Button variant="outline" size="sm">
    Bank statements
  </Button>
</Link>

// REPLACE with single button:
<Link href={`/workspace/${company.id}`}>
  <Button variant="primary" size="sm">
    <ArrowRight className="h-4 w-4 mr-2" />
    Open Workspace
  </Button>
</Link>
```

**Impact**: 🔴 HIGH - Users are being directed to wrong places

---

### 2. Missing Company Type: manageAccounts

**Location**: `/src/types/auth.ts` line 18

**Problem**:
```typescript
// Current (INCOMPLETE):
export type CompanyType = 'client' | 'peakflow';

// Should be:
export type CompanyType = 'peakflow' | 'manageAccounts' | 'client';
```

**Why This Is Wrong**:
- Documentation mentions "manageAccounts" companies throughout
- Project roadmap references managed accounts features
- No way to distinguish accounting firms from regular clients
- Cannot implement multi-client access without this type

**Impact**: 🔴 HIGH - Blocks Phase 6 (Managed Accounts Features)

---

### 3. Role Naming Confusion: 'client' Is Overloaded

**Location**: `/src/types/auth.ts` lines 1, 18

**Problem**:
- User role: `'client'`
- Company type: `'client'`
- Same word, completely different meanings

**Example of Confusion**:
```typescript
// Which 'client' are we talking about?
if (user.roles.includes('client')) { ... }
if (company.type === 'client') { ... }
```

**Fix Required**:
```typescript
// Change user role from 'client' to 'user'
export type UserRole = 'super_admin' | 'admin' | 'financial_admin' | 'user' | 'developer';
```

**Impact**: 🟡 MEDIUM - Causes developer confusion, but doesn't break functionality

---

### 4. No Multi-Company Access Mechanism

**Location**: `/src/types/auth.ts` User interface

**Problem**:
```typescript
export interface User {
  companyId?: string;  // Only ONE company
  // No way to access multiple companies!
}
```

**Why This Is Wrong**:
- Accounting firm staff need to access multiple client companies
- No field to track which additional companies user can access
- No relationship model between manageAccounts companies and their clients

**Fix Required**:
```typescript
export interface User {
  primaryCompanyId: string;           // Required: user's home company
  accessibleCompanyIds?: string[];    // Optional: additional companies
}

export interface Company {
  managedCompanyIds?: string[];  // For manageAccounts: clients they manage
  managedBy?: string;            // For clients: who manages them
}
```

**Impact**: 🔴 HIGH - Cannot implement multi-tenant accounting firm features

---

### 5. Workspace Access Control Not Implemented

**Location**: `/app/workspace/[companyId]/*` pages

**Problem**:
- Workspace pages exist but don't verify user has access to that companyId
- No check if user.companyId === params.companyId
- Anyone authenticated could potentially access any company's workspace

**Current Code** (e.g., `/app/workspace/[companyId]/page.tsx`):
```typescript
export default function WorkspaceOverview() {
  const params = useParams();
  const companyId = params.companyId as string;
  // ⚠️ NO ACCESS CHECK!
  return <UnifiedDashboard />;
}
```

**Fix Required**:
```typescript
export default function WorkspaceOverview() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { canAccess, loading } = useWorkspaceAccess(companyId);

  if (loading) return <LoadingState />;
  if (!canAccess) return <UnauthorizedWorkspace />;

  return <UnifiedDashboard />;
}
```

**Impact**: 🔴 CRITICAL - Security vulnerability

---

### 6. Inconsistent Company ID Field Name

**Location**: Multiple files

**Problem**:
- Some code uses `companyId`
- Some code uses `company` object
- AuthContext uses `user.companyId` and `company` state separately
- Unclear what's the source of truth

**Example**:
```typescript
// AuthContext.tsx line 50
const [company, setCompany] = useState<Company | null>(null);

// User interface line 9
companyId?: string;

// Which one is authoritative?
```

**Fix Required**:
- Standardize on `primaryCompanyId` in User model
- Keep `company` in AuthContext for currently selected company
- Make relationship explicit

**Impact**: 🟡 MEDIUM - Code maintainability issue

---

## Immediate Action Items

### Priority 1: Security Fix (DO IMMEDIATELY)

1. **Add Workspace Access Control**
   - Create `useWorkspaceAccess(companyId)` hook
   - Add access check to all workspace pages
   - Block unauthorized access

   **Files to Update**:
   - `/app/workspace/[companyId]/page.tsx`
   - `/app/workspace/[companyId]/bank-import/page.tsx`
   - All other workspace pages (13 files total)

   **Estimated Time**: 2-3 hours

---

### Priority 2: Fix Companies Page UI (DO THIS WEEK)

2. **Remove Financial Operations from Companies Page**
   - Delete "Financial dashboard" button
   - Delete "Bank statements" button
   - Add "Open Workspace" button instead

   **Files to Update**:
   - `/app/companies/page.tsx` (lines 279-288)

   **Estimated Time**: 15 minutes

3. **Add Clear Action Separation**
   - Group admin actions (Edit, Delete, Activate)
   - Separate workspace access (Open Workspace button)
   - Add visual distinction

   **Estimated Time**: 30 minutes

---

### Priority 3: Data Model Foundation (BEFORE PHASE 6)

4. **Add manageAccounts Company Type**
   - Update CompanyType enum
   - Add managedCompanyIds to Company
   - Add managedBy to Company
   - Update Firestore rules

   **Files to Update**:
   - `/src/types/auth.ts`
   - `/firestore.rules`
   - `/src/lib/firebase/companies-service.ts`

   **Estimated Time**: 2 hours

5. **Enhance User Model for Multi-Company**
   - Rename companyId → primaryCompanyId
   - Add accessibleCompanyIds array
   - Create migration script
   - Update AuthContext

   **Files to Update**:
   - `/src/types/auth.ts`
   - `/src/contexts/AuthContext.tsx`
   - Create migration script

   **Estimated Time**: 3-4 hours

6. **Create CompanyAccess Collection**
   - Define interface
   - Create service layer
   - Add Firestore rules
   - Create admin UI for granting access

   **Files to Create**:
   - `/src/types/company-access.ts`
   - `/src/lib/firebase/company-access-service.ts`

   **Estimated Time**: 4-5 hours

---

## Testing Checklist

After implementing fixes, verify:

### Security Tests
- [ ] User cannot access `/workspace/[otherId]` for companies they don't belong to
- [ ] Direct URL navigation to unauthorized workspace shows error
- [ ] API calls fail for unauthorized company data
- [ ] Firestore rules reject unauthorized queries

### UI Tests
- [ ] Companies page shows ONLY management operations
- [ ] "Open Workspace" button navigates to correct workspace
- [ ] Workspace shows all financial operations
- [ ] No financial buttons on companies page

### Multi-Tenant Tests (after full implementation)
- [ ] ManageAccounts company can access client workspaces
- [ ] ManageAccounts staff sees company selector
- [ ] Client company sees only own workspace
- [ ] Regular user redirected to workspace (no /companies access)

---

## Migration Strategy

### Phase 1: Immediate Fixes (This Week)
1. ✅ Add workspace access control (security)
2. ✅ Fix companies page UI (UX)
3. ✅ Document issues (this file)

### Phase 2: Foundation (Before Phase 6)
4. ✅ Add manageAccounts type
5. ✅ Enhance User model
6. ✅ Create CompanyAccess system

### Phase 3: Full Implementation (Phase 6)
7. ✅ Build multi-company selector UI
8. ✅ Create manage clients interface
9. ✅ Implement fine-grained permissions
10. ✅ Complete testing & documentation

---

## Code Snippets for Quick Fixes

### Fix 1: Companies Page (Immediate)

**File**: `/app/companies/page.tsx`

**Remove lines 279-288, replace with**:
```typescript
<div className="flex flex-wrap gap-2">
  <Link href={`/companies/${company.id}`}>
    <Button variant="outline" size="sm">
      View details
    </Button>
  </Link>
  <Link href={`/companies/${company.id}/edit`}>
    <Button variant="outline" size="sm">
      <Edit className="h-4 w-4 mr-2" />
      Edit Company
    </Button>
  </Link>
  <Link href={`/workspace/${company.id}`}>
    <Button variant="default" size="sm">
      <ArrowRight className="h-4 w-4 mr-2" />
      Open Workspace
    </Button>
  </Link>
</div>
```

### Fix 2: Workspace Access Hook (Immediate)

**File**: `/src/hooks/useWorkspaceAccess.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { CompaniesService } from '@/lib/firebase/companies-service';

export function useWorkspaceAccess(companyId: string) {
  const { user, hasRole } = useAuth();
  const [canAccess, setCanAccess] = useState(false);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user) {
        setCanAccess(false);
        setLoading(false);
        return;
      }

      // Super admins and developers can access everything
      if (hasRole('super_admin') || hasRole('developer')) {
        const companiesService = new CompaniesService();
        const companyData = await companiesService.getCompanyById(companyId);
        setCompany(companyData);
        setCanAccess(true);
        setLoading(false);
        return;
      }

      // Check if user's company matches
      if (user.companyId === companyId) {
        const companiesService = new CompaniesService();
        const companyData = await companiesService.getCompanyById(companyId);
        setCompany(companyData);
        setCanAccess(true);
        setLoading(false);
        return;
      }

      // TODO: Add checks for:
      // - accessibleCompanyIds
      // - managedCompanyIds
      // - CompanyAccess grants

      setCanAccess(false);
      setLoading(false);
    }

    checkAccess();
  }, [companyId, user, hasRole]);

  return { canAccess, company, loading };
}
```

### Fix 3: Workspace Page Protection (Immediate)

**Apply to all workspace pages**:

```typescript
'use client';

import { useParams } from 'next/navigation';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';

export default function WorkspacePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { canAccess, company, loading } = useWorkspaceAccess(companyId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-300 border-b-transparent" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout companyId={companyId} companyName={company?.name}>
      {/* Page content here */}
    </WorkspaceLayout>
  );
}
```

---

## Summary

**Critical Issues**: 3 (Security vulnerability, missing type, wrong UI)
**High Priority Issues**: 2 (Multi-company access, role confusion)
**Medium Priority Issues**: 1 (Field naming)

**Immediate Action Required**:
1. Add workspace access control (2-3 hours) - SECURITY
2. Fix companies page UI (45 minutes) - UX
3. Plan full architecture implementation (use design docs)

**Total Time for Immediate Fixes**: ~4 hours
**Total Time for Full Implementation**: 16-21 hours (as per architecture doc)

---

## References

- Full Architecture Design: `/project-management/access-control-architecture-design.md`
- Visual Guide: `/project-management/access-control-visual-guide.md`
- Current Issues: This document
