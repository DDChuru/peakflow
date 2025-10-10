# Multi-Tenant Access Control Architecture Design

## Executive Summary

This document defines the proper access control architecture for PeakFlow's multi-tenant financial application. The current implementation incorrectly mixes administrative company management operations with financial workspace operations. This design establishes clear separation between these two concerns while supporting three primary tenant types: system administrators, managed account providers (accounting firms), and regular client companies.

## Current State Analysis

### Existing Implementation

**User Model** (`/src/types/auth.ts`):
```typescript
UserRole = 'admin' | 'developer' | 'client'
User {
  roles: UserRole[]
  companyId?: string  // User's "home" company
}

CompanyType = 'client' | 'peakflow'
```

**Problems Identified:**

1. **Role Confusion**: The term "client" is overloaded - used for both user role and company type
2. **Missing manageAccounts Type**: The description mentions "manageAccounts" companies but this type doesn't exist in the codebase
3. **Access Control Gaps**: No mechanism for manageAccounts companies to access client workspaces
4. **UI Mixing**: `/companies` page incorrectly includes "Financial dashboard" and "Bank statements" buttons (lines 279-288)
5. **No Company-User Relationships**: No data model for representing which companies a user can access beyond their home `companyId`
6. **Workspace Context Missing**: Workspace routes exist but lack proper access control and company context verification

### Current Strengths

1. **Good Service Layer**: Well-structured service classes with proper multi-tenant isolation
2. **Firestore Rules**: Comprehensive security rules with `belongsToCompany()` helper
3. **ProtectedRoute Component**: Clean role-based protection mechanism
4. **Workspace Structure**: Good foundation with `/workspace/[companyId]/*` pattern already established

## Proposed Architecture

### 1. Enhanced Data Models

#### User Type System (Enhanced)

```typescript
// Rename 'client' to 'user' to avoid confusion
export type UserRole =
  | 'super_admin'      // System administrators (PeakFlow staff)
  | 'admin'            // Company administrators
  | 'financial_admin'  // Financial operations manager
  | 'user'             // Regular user
  | 'developer';       // Development/testing

export interface User {
  uid: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  primaryCompanyId: string;      // User's primary/home company (required)
  accessibleCompanyIds?: string[]; // Additional companies user can access (for manageAccounts staff)
  imageUrl?: string;
  phoneNumber?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}
```

**Key Changes:**
- Rename `companyId` to `primaryCompanyId` (required - every user belongs to a company)
- Add `accessibleCompanyIds` array for multi-company access
- Replace 'client' role with 'user' to eliminate confusion
- Add 'super_admin' for system-wide operations
- Add 'financial_admin' for financial-only operations

#### Company Type System (Enhanced)

```typescript
export type CompanyType =
  | 'peakflow'        // PeakFlow system company
  | 'manageAccounts'  // Accounting firm managing multiple clients
  | 'client';         // Regular client company

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry?: string;

  // For manageAccounts companies: companies they manage
  managedCompanyIds?: string[];  // Array of client company IDs they manage

  // For client companies: who manages them
  managedBy?: string;  // CompanyId of manageAccounts company (if managed)

  domain?: string;
  logoUrl?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string;
}
```

**Key Changes:**
- Add `manageAccounts` company type
- Add `managedCompanyIds` for accounting firms to track their clients
- Add `managedBy` for client companies to reference their accounting firm
- Keep all existing fields for backward compatibility

#### Company Access Relationship (New)

```typescript
// Stored in Firestore collection: /companyAccess/{accessId}
export interface CompanyAccess {
  id: string;
  userId: string;              // The user being granted access
  companyId: string;           // The company they can access
  grantedBy: string;           // UserID who granted this access
  grantedByCompanyId: string;  // CompanyID of the granting company (manageAccounts)

  // Access level within this company
  role: 'viewer' | 'editor' | 'admin';

  // Optional: limit access to specific features
  permissions?: {
    canViewFinancials: boolean;
    canEditTransactions: boolean;
    canReconcile: boolean;
    canManageInvoices: boolean;
    canViewReports: boolean;
  };

  createdAt: Date;
  expiresAt?: Date;  // Optional expiration
  isActive: boolean;
}
```

This allows fine-grained control over which users from manageAccounts companies can access which client companies and what they can do.

### 2. Access Control Matrix

#### Admin View (`/companies`) - Company Management Only

| User Type | Company Type | Can Access? | Can Do |
|-----------|--------------|-------------|---------|
| super_admin | ANY | ✅ Yes | View all, Create, Edit, Delete, Activate/Deactivate |
| developer | ANY | ✅ Yes | View all, Create, Edit, Delete, Activate/Deactivate |
| admin (primaryCompany=manageAccounts) | manageAccounts + clients | ✅ Yes | View own + managed clients, Create clients, Edit managed, Link/Unlink clients |
| admin (primaryCompany=client) | OWN | ✅ Yes | View own company only, Edit own |
| financial_admin | ANY | ❌ No | Should redirect to workspace |
| user | ANY | ❌ No | Should redirect to workspace |

**Actions Available in Admin View:**
- View Company Details
- Edit Company Information
- Create New Company (admin/developer/manageAccounts)
- Delete Company (super_admin/developer only)
- Activate/Deactivate Company
- **Open Workspace** (navigates to `/workspace/[companyId]`)
- Link/Unlink Client Companies (for manageAccounts type)

**Actions NOT in Admin View:**
- ❌ Financial Dashboard
- ❌ Bank Statements
- ❌ Any Financial Operations

#### Workspace View (`/workspace/[companyId]/*`) - Financial Operations

| User Type | Access Logic | Can Access? |
|-----------|--------------|-------------|
| super_admin | ANY company | ✅ Yes - full access |
| developer | ANY company | ✅ Yes - full access |
| admin | primaryCompanyId == companyId OR companyId in managedCompanyIds | ✅ Yes - full workspace access |
| financial_admin | primaryCompanyId == companyId OR has CompanyAccess with canViewFinancials | ✅ Yes - limited by permissions |
| user | primaryCompanyId == companyId OR has CompanyAccess | ✅ Yes - limited by permissions |

**Workspace Operations Available:**
- Overview Dashboard (financial KPIs)
- Banking & Cash (Statements, Reconciliation, Cash Flow, Bank Import)
- Invoicing (Invoices, Quotes, Contracts)
- Customers & Suppliers
- Accounting (Chart of Accounts, Journal Entries)
- Reports

**Access Verification Flow:**
```typescript
function canAccessWorkspace(user: User, companyId: string): boolean {
  // Super admins and developers can access everything
  if (user.roles.includes('super_admin') || user.roles.includes('developer')) {
    return true;
  }

  // User's primary company
  if (user.primaryCompanyId === companyId) {
    return true;
  }

  // Check if user has explicit access via accessibleCompanyIds
  if (user.accessibleCompanyIds?.includes(companyId)) {
    return true;
  }

  // Check if user's company manages this company
  const userCompany = await getCompany(user.primaryCompanyId);
  if (userCompany.type === 'manageAccounts' &&
      userCompany.managedCompanyIds?.includes(companyId)) {
    return true;
  }

  // Check if there's an active CompanyAccess grant
  const access = await getCompanyAccess(user.uid, companyId);
  return access?.isActive === true;
}
```

### 3. Navigation & UI Flow

#### Primary Navigation Structure

```
┌─────────────────────────────────────────────────┐
│  User Login                                     │
└─────────────┬───────────────────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Role Detection     │
    └─────────┬───────────┘
              │
      ┌───────┴──────────────────────┐
      │                              │
      ▼                              ▼
┌─────────────┐              ┌──────────────┐
│ Admin Roles │              │ Regular Users│
│ (super_admin│              │ (user,       │
│  developer, │              │  financial_  │
│  admin)     │              │  admin)      │
└──────┬──────┘              └──────┬───────┘
       │                            │
       ▼                            │
┌──────────────────┐                │
│  /companies      │                │
│  (Admin View)    │                │
│                  │                │
│  • View all cos  │                │
│  • Manage cos    │                │
│  • Create cos    │                │
│  • Click "Open   │                │
│    Workspace"    │                │
└────────┬─────────┘                │
         │                          │
         └──────────┬───────────────┘
                    ▼
        ┌───────────────────────────┐
        │ /workspace/[companyId]    │
        │ (Financial Operations)    │
        │                           │
        │ • Dashboard               │
        │ • Banking & Cash          │
        │ • Invoicing               │
        │ • Customers & Suppliers   │
        │ • Accounting              │
        │ • Reports                 │
        └───────────────────────────┘
```

#### WorkspaceLayout Enhancement

The `WorkspaceLayout` component needs company context:

```typescript
interface WorkspaceLayoutProps {
  children: React.ReactNode;
  companyId: string;  // Always required in workspace
}

// In workspace pages:
export default function WorkspacePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { canAccess, company, loading } = useWorkspaceAccess(companyId);

  if (loading) return <LoadingState />;
  if (!canAccess) return <UnauthorizedWorkspace />;

  return (
    <WorkspaceLayout companyId={companyId}>
      {/* Page content */}
    </WorkspaceLayout>
  );
}
```

#### Company Selector for ManageAccounts Users

For users from manageAccounts companies who manage multiple clients:

```typescript
// In WorkspaceLayout sidebar, show company selector
{user.primaryCompany.type === 'manageAccounts' && (
  <CompanySelector
    currentCompanyId={companyId}
    availableCompanies={accessibleCompanies}
    onSelect={(id) => router.push(`/workspace/${id}`)}
  />
)}
```

### 4. Implementation Plan

#### Phase 1: Data Model Updates (2-3 hours)

1. **Update Type Definitions** (`/src/types/auth.ts`)
   - Add new UserRole types
   - Rename companyId → primaryCompanyId
   - Add accessibleCompanyIds to User
   - Add CompanyType.manageAccounts
   - Add managedCompanyIds and managedBy to Company
   - Create CompanyAccess interface

2. **Create Migration Script**
   - Migrate existing users from 'client' role to 'user'
   - Add primaryCompanyId field (copy from companyId)
   - Set all existing companies to appropriate type

3. **Update Firestore Rules** (`/firestore.rules`)
   ```javascript
   // Add helper for manageAccounts access
   function canAccessCompanyWorkspace(companyId) {
     return isAuthenticated() && (
       canManageCompanies() || // super_admin, developer
       belongsToCompany(companyId) || // primary company
       get(/databases/$(database)/documents/users/$(request.auth.uid))
         .data.accessibleCompanyIds.hasAny([companyId]) || // explicit access
       exists(/databases/$(database)/documents/companyAccess/$(request.auth.uid + '_' + companyId)) // access grant
     );
   }
   ```

#### Phase 2: Service Layer Updates (3-4 hours)

1. **Create CompanyAccessService** (`/src/lib/firebase/company-access-service.ts`)
   - CRUD operations for CompanyAccess
   - Grant/revoke access methods
   - Check access method
   - List accessible companies for user

2. **Update CompaniesService** (`/src/lib/firebase/companies-service.ts`)
   - Add methods to manage manageAccounts relationships
   - `linkClientCompany(manageAccountsId, clientId)`
   - `unlinkClientCompany(manageAccountsId, clientId)`
   - `getManagedCompanies(manageAccountsId)`
   - `getManagingCompany(clientId)`

3. **Update AuthContext** (`/src/contexts/AuthContext.tsx`)
   - Update fetchUserData to handle new fields
   - Add methods: `canAccessWorkspace(companyId)`, `getAccessibleCompanies()`
   - Update role checking helpers for new roles

#### Phase 3: Workspace Access Control (4-5 hours)

1. **Create WorkspaceAccessContext** (`/src/contexts/WorkspaceAccessContext.tsx`)
   ```typescript
   interface WorkspaceAccessContextType {
     companyId: string;
     company: Company;
     canAccess: boolean;
     permissions: CompanyAccess['permissions'];
     loading: boolean;
   }
   ```

2. **Create useWorkspaceAccess Hook**
   ```typescript
   export function useWorkspaceAccess(companyId: string) {
     // Check if user can access this workspace
     // Load company data
     // Load permissions if applicable
     // Return access status and company context
   }
   ```

3. **Update All Workspace Pages**
   - Add workspace access check to each page
   - Pass companyId to all service calls
   - Use workspace context for company data

4. **Create Workspace Layout Wrapper**
   ```typescript
   // /app/workspace/[companyId]/layout.tsx
   export default function WorkspaceLayoutWrapper({ children, params }) {
     return (
       <WorkspaceAccessProvider companyId={params.companyId}>
         <WorkspaceLayout companyId={params.companyId}>
           {children}
         </WorkspaceLayout>
       </WorkspaceAccessProvider>
     );
   }
   ```

#### Phase 4: Admin View Cleanup (2 hours)

1. **Update Companies Page** (`/app/companies/page.tsx`)
   - **REMOVE** "Financial dashboard" button (line 279-283)
   - **REMOVE** "Bank statements" button (line 284-288)
   - **ADD** "Open Workspace" button that navigates to `/workspace/[companyId]`
   - **ADD** Company selector showing managed clients for manageAccounts
   - **ADD** "Link Client" action for manageAccounts companies

2. **Update Access Control**
   ```typescript
   // Only admin roles can access /companies
   <ProtectedRoute requiredRoles={['super_admin', 'developer', 'admin']}>

   // Filter companies based on user type
   const visibleCompanies = useMemo(() => {
     if (hasRole('super_admin') || hasRole('developer')) {
       return companies; // See all
     }

     if (hasRole('admin')) {
       const userCompany = companies.find(c => c.id === user.primaryCompanyId);
       if (userCompany?.type === 'manageAccounts') {
         // Show own company + managed clients
         return companies.filter(c =>
           c.id === user.primaryCompanyId ||
           userCompany.managedCompanyIds?.includes(c.id)
         );
       }
       // Regular admin sees only their company
       return companies.filter(c => c.id === user.primaryCompanyId);
     }

     return [];
   }, [companies, user, hasRole]);
   ```

#### Phase 5: UI Components (3-4 hours)

1. **Create CompanySelector Component**
   - Dropdown for manageAccounts users
   - Shows primary company + managed clients
   - Allows quick workspace switching

2. **Create ManageClientsModal**
   - For manageAccounts companies
   - Search and link client companies
   - View and unlink existing clients
   - Grant/revoke user access to clients

3. **Create WorkspaceAccessDenied Component**
   - Friendly error page when user lacks access
   - Contact admin to request access
   - Shows why access was denied

4. **Update WorkspaceLayout**
   - Add company context display
   - Show company selector for manageAccounts
   - Add "Back to Admin" link for admin users

#### Phase 6: Testing & Documentation (2-3 hours)

1. **Create Test Scenarios**
   - Super admin accessing any workspace
   - ManageAccounts admin accessing client workspaces
   - Regular user trying to access unauthorized workspace
   - Client admin accessing only own workspace
   - User with explicit CompanyAccess grant

2. **Update Documentation**
   - Create access control flowcharts
   - Document permission levels
   - Add troubleshooting guide

3. **Create Smoke Test Guide**
   - Test all user types
   - Test all access scenarios
   - Verify security rules

### 5. Security Considerations

#### Firestore Security Rules Updates

```javascript
// Helper to check workspace access
function canAccessWorkspace(companyId) {
  return isAuthenticated() && (
    // System admins
    hasRole('super_admin') ||
    hasRole('developer') ||

    // User's primary company
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.primaryCompanyId == companyId ||

    // User has explicit access
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accessibleCompanyIds.hasAny([companyId]) ||

    // User's company manages this company
    (function() {
      let user = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      let userCompany = get(/databases/$(database)/documents/companies/$(user.primaryCompanyId)).data;
      return userCompany.type == 'manageAccounts' &&
             userCompany.managedCompanyIds.hasAny([companyId]);
    })() ||

    // Active CompanyAccess grant exists
    exists(/databases/$(database)/documents/companyAccess/$(request.auth.uid + '_' + companyId)) &&
    get(/databases/$(database)/documents/companyAccess/$(request.auth.uid + '_' + companyId)).data.isActive == true
  );
}

// Update all company-scoped collections
match /companies/{companyId} {
  match /bankAccounts/{bankAccountId} {
    allow read: if canAccessWorkspace(companyId);
    allow write: if canAccessWorkspace(companyId) && hasRole('admin');
  }

  match /bankStatements/{statementId} {
    allow read: if canAccessWorkspace(companyId);
    allow write: if canAccessWorkspace(companyId);
  }

  // ... repeat for all collections
}

// CompanyAccess collection
match /companyAccess/{accessId} {
  // Users can read their own access grants
  allow read: if isAuthenticated() &&
    resource.data.userId == request.auth.uid;

  // Only admins of manageAccounts companies can grant access
  allow create: if isAuthenticated() &&
    hasRole('admin') &&
    get(/databases/$(database)/documents/companies/$(request.resource.data.grantedByCompanyId)).data.type == 'manageAccounts';

  // Only grantor can revoke
  allow update, delete: if isAuthenticated() &&
    resource.data.grantedBy == request.auth.uid;
}
```

#### Frontend Security Checks

1. **Always verify on backend**: Frontend checks are UX, not security
2. **Token refresh**: Ensure auth tokens include latest role/access changes
3. **Audit logging**: Log all workspace access attempts
4. **Rate limiting**: Prevent brute-force access attempts

### 6. Backward Compatibility

#### Migration Strategy

1. **Phase 1: Additive Changes Only**
   - Add new fields without removing old ones
   - Maintain `companyId` alongside `primaryCompanyId`
   - Default `accessibleCompanyIds` to empty array

2. **Phase 2: Deprecation Period**
   - Show warnings for 'client' role usage
   - Update frontend to use new fields
   - Keep reading old fields as fallback

3. **Phase 3: Data Migration**
   - Run migration script in production
   - Verify all users have new fields
   - Monitor for issues

4. **Phase 4: Cleanup**
   - Remove old field references
   - Update documentation
   - Archive migration scripts

#### Migration Script Example

```typescript
// scripts/migrate-access-control.ts
async function migrateUsers() {
  const usersRef = collection(db, 'users');
  const snapshot = await getDocs(usersRef);

  const batch = writeBatch(db);
  let count = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Migrate role
    const newRoles = data.roles.map((role: string) =>
      role === 'client' ? 'user' : role
    );

    // Add new fields
    const updates = {
      roles: newRoles,
      primaryCompanyId: data.companyId || null,
      accessibleCompanyIds: data.accessibleCompanyIds || [],
      updatedAt: serverTimestamp()
    };

    batch.update(doc.ref, updates);
    count++;

    // Firestore batch limit
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Migrated ${count} users`);
    }
  }

  await batch.commit();
  console.log(`Migration complete: ${count} users`);
}
```

## Summary

### Key Architectural Decisions

1. **Clear Separation**: Admin view (`/companies`) for company management, Workspace view (`/workspace/[companyId]`) for financial operations
2. **Three-Tier Access**: System admins (full access), ManageAccounts companies (multi-client access), Regular companies (own data only)
3. **Explicit Relationships**: Company-to-company relationships tracked via `managedCompanyIds` and `managedBy` fields
4. **Granular Permissions**: CompanyAccess model enables fine-grained permission control
5. **Security First**: Firestore rules enforce all access control at the database level

### Benefits

1. **Scalability**: Supports accounting firms managing hundreds of clients
2. **Security**: Multiple layers of access control with audit trail
3. **Flexibility**: Fine-grained permissions for different user types
4. **User Experience**: Clear navigation paths for different user types
5. **Maintainability**: Clean separation of concerns

### Total Implementation Effort

- **Phase 1**: Data Models (2-3 hours)
- **Phase 2**: Services (3-4 hours)
- **Phase 3**: Workspace Access (4-5 hours)
- **Phase 4**: Admin View Cleanup (2 hours)
- **Phase 5**: UI Components (3-4 hours)
- **Phase 6**: Testing & Docs (2-3 hours)

**Total: 16-21 hours** (2-3 days for single developer)

### Risk Mitigation

1. **Backward Compatibility**: Phased rollout with migration period
2. **Data Integrity**: Comprehensive validation and error handling
3. **User Impact**: Minimal disruption with clear communication
4. **Rollback Plan**: Maintain old fields during transition period

## Next Steps

1. **Review & Approval**: Stakeholder review of architecture
2. **Priority Decision**: Confirm this is priority for Phase 6
3. **Sprint Planning**: Allocate 2-3 day sprint for implementation
4. **Testing Plan**: Define acceptance criteria and test cases
5. **Deployment Strategy**: Plan staged rollout with feature flags
