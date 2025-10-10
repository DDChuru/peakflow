# Access Control Visual Guide

## User Type & Access Matrix

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         USER TYPES & CAPABILITIES                          │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ SUPER_ADMIN  │  │  DEVELOPER   │  │    ADMIN     │  │FINANCIAL_ADMIN│ │
│  │              │  │              │  │              │  │              │ │
│  │ • PeakFlow   │  │ • PeakFlow   │  │ • Any Company│  │ • Any Company│ │
│  │   Staff      │  │   Dev Team   │  │   Leader     │  │   Finance    │ │
│  │ • Full Admin │  │ • Full Admin │  │ • Manage Own │  │   Manager    │ │
│  │   Access     │  │   Access     │  │   Company    │  │ • Financial  │ │
│  │ • All        │  │ • All        │  │ • Or Manage  │  │   Operations │ │
│  │   Companies  │  │   Companies  │  │   Clients if │  │   Only       │ │
│  │              │  │              │  │   ManageAccts│  │              │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│         │                 │                 │                 │          │
│         └─────────────────┴─────────────────┴─────────────────┘          │
│                                    │                                      │
│  ┌─────────────────────────────────┴──────────────────────────────────┐  │
│  │                       ACCESS CAPABILITIES                           │  │
│  │  ✅ /companies (Admin View)                                         │  │
│  │  ✅ /workspace/[companyId] (Any Workspace)                          │  │
│  │  ✅ Create/Edit/Delete Companies                                    │  │
│  │  ✅ View All Financial Data                                         │  │
│  │  ✅ Manage Users & Permissions                                      │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────┐                                                         │
│  │     USER     │                                                         │
│  │              │                                                         │
│  │ • Any Company│                                                         │
│  │ • Basic User │                                                         │
│  │ • Limited    │                                                         │
│  │   Access     │                                                         │
│  └──────┬───────┘                                                         │
│         │                                                                 │
│  ┌──────┴──────────────────────────────────────────────────────────────┐ │
│  │                       ACCESS CAPABILITIES                            │ │
│  │  ❌ /companies (No Access)                                           │ │
│  │  ✅ /workspace/[primaryCompanyId] (Own Company Only)                 │ │
│  │  ✅ View Own Financial Data                                          │ │
│  │  ✅ Create Transactions (if permitted)                               │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Company Type Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           COMPANY TYPES                                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────┐                                                │
│  │   PEAKFLOW          │                                                │
│  │   (System Company)  │                                                │
│  ├─────────────────────┤                                                │
│  │ • System admins     │                                                │
│  │ • Development team  │                                                │
│  │ • Full system access│                                                │
│  └─────────────────────┘                                                │
│           │                                                              │
│           │ Creates & Manages                                           │
│           ▼                                                              │
│  ┌─────────────────────┐       ┌──────────────────────┐                │
│  │  MANAGEACCOUNTS     │       │      CLIENT          │                │
│  │  (Accounting Firm)  │──────▶│  (Regular Company)   │                │
│  ├─────────────────────┤ Manages├──────────────────────┤                │
│  │ • Accounting firm   │       │ • Regular business   │                │
│  │ • Manages clients   │       │ • Single tenant      │                │
│  │ • Multi-tenant      │       │ • Own data only      │                │
│  │   access            │       │                      │                │
│  ├─────────────────────┤       ├──────────────────────┤                │
│  │ Data:               │       │ Data:                │                │
│  │ • managedCompanyIds │       │ • managedBy:         │                │
│  │   ["client1",       │       │   "accounting-firm-1"│                │
│  │    "client2",       │◀──────┤                      │                │
│  │    "client3"]       │ Links │                      │                │
│  └─────────────────────┘       └──────────────────────┘                │
│           │                              │                              │
│           │                              │                              │
│           └──────────┬───────────────────┘                              │
│                      │                                                  │
│                      ▼                                                  │
│         ┌────────────────────────────┐                                 │
│         │  WORKSPACE ACCESS          │                                 │
│         │  /workspace/[companyId]    │                                 │
│         ├────────────────────────────┤                                 │
│         │ • Financial operations     │                                 │
│         │ • Banking & reconciliation │                                 │
│         │ • Invoicing & billing      │                                 │
│         │ • Reports & analytics      │                                 │
│         └────────────────────────────┘                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

## Access Control Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      USER AUTHENTICATION FLOW                            │
└──────────────────────────────────────────────────────────────────────────┘

                            ┌─────────────┐
                            │   LOGIN     │
                            └──────┬──────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │  Load User Profile    │
                       │  • roles[]            │
                       │  • primaryCompanyId   │
                       │  • accessibleCompanys │
                       └──────────┬────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │    Role Detection         │
                    └─────────────┬─────────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
            ▼                     ▼                     ▼
  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │ ADMIN ROLES     │   │ FINANCIAL_ADMIN │   │ USER ROLE       │
  │ (super_admin,   │   │                 │   │                 │
  │  developer,     │   │                 │   │                 │
  │  admin)         │   │                 │   │                 │
  └────────┬────────┘   └────────┬────────┘   └────────┬────────┘
           │                     │                     │
           ▼                     │                     │
  ┌─────────────────┐            │                     │
  │  /companies     │            │                     │
  │  (Admin View)   │            │                     │
  │                 │            │                     │
  │ Actions:        │            │                     │
  │ • View Details  │            │                     │
  │ • Edit Company  │            │                     │
  │ • Create        │            │                     │
  │ • Activate/     │            │                     │
  │   Deactivate    │            │                     │
  │ • Delete (SA)   │            │                     │
  │ • Open Workspace│────────────┼─────────────────────┘
  └─────────────────┘            │
                                 ▼
                   ┌──────────────────────────┐
                   │  WORKSPACE ROUTING       │
                   │  /workspace/[companyId]  │
                   └────────────┬─────────────┘
                                │
                                ▼
                   ┌──────────────────────────┐
                   │  Access Check            │
                   │  canAccessWorkspace()?   │
                   └────────┬─────────────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
    ┌─────────────────┐         ┌─────────────────┐
    │   ✅ GRANTED    │         │   ❌ DENIED     │
    │                 │         │                 │
    │ Show Workspace  │         │ Redirect to     │
    │ • Dashboard     │         │ /unauthorized   │
    │ • Banking       │         │                 │
    │ • Invoicing     │         │ Show error:     │
    │ • Reports       │         │ "No access to   │
    │ • Accounting    │         │  this company"  │
    └─────────────────┘         └─────────────────┘
```

## Workspace Access Decision Tree

```
┌──────────────────────────────────────────────────────────────────────────┐
│              CAN USER ACCESS WORKSPACE FOR COMPANY X?                    │
└──────────────────────────────────────────────────────────────────────────┘

                  ┌────────────────────────┐
                  │  User requests access  │
                  │  to workspace of       │
                  │  Company X             │
                  └──────────┬─────────────┘
                             │
                             ▼
               ┌─────────────────────────────┐
               │ Is user super_admin or      │──YES──▶ ✅ GRANT ACCESS
               │ developer?                  │
               └──────────┬──────────────────┘
                          │ NO
                          ▼
               ┌─────────────────────────────┐
               │ Is user.primaryCompanyId    │──YES──▶ ✅ GRANT ACCESS
               │ === Company X?              │
               └──────────┬──────────────────┘
                          │ NO
                          ▼
               ┌─────────────────────────────┐
               │ Is Company X in             │──YES──▶ ✅ GRANT ACCESS
               │ user.accessibleCompanyIds?  │
               └──────────┬──────────────────┘
                          │ NO
                          ▼
               ┌─────────────────────────────┐
               │ Get user's primary company  │
               │ (call it Company Y)         │
               └──────────┬──────────────────┘
                          │
                          ▼
               ┌─────────────────────────────┐
               │ Is Company Y type =         │──YES──┐
               │ 'manageAccounts'?           │       │
               └──────────┬──────────────────┘       │
                          │ NO                       │
                          │                          │
                          │              ┌───────────▼────────────┐
                          │              │ Is Company X in        │──YES──▶ ✅ GRANT ACCESS
                          │              │ Company Y's            │
                          │              │ managedCompanyIds?     │
                          │              └───────────┬────────────┘
                          │                          │ NO
                          │                          │
                          │      ┌───────────────────┘
                          │      │
                          ▼      ▼
               ┌─────────────────────────────┐
               │ Check CompanyAccess         │
               │ collection for active grant │
               └──────────┬──────────────────┘
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
    ┌─────────────────┐    ┌─────────────────┐
    │ Active grant    │    │ No active grant │
    │ exists?         │    │                 │
    │                 │    │                 │
    │ ✅ GRANT ACCESS │    │ ❌ DENY ACCESS  │
    └─────────────────┘    └─────────────────┘
```

## Company Relationships Example

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    EXAMPLE: ACCOUNTING FIRM SCENARIO                     │
└──────────────────────────────────────────────────────────────────────────┘

        ┌───────────────────────────────────────────────┐
        │  ACME Accounting Firm                         │
        │  Type: manageAccounts                         │
        │  ID: "acme-accounting"                        │
        ├───────────────────────────────────────────────┤
        │  managedCompanyIds: [                         │
        │    "coffee-shop-123",                         │
        │    "bakery-456",                              │
        │    "plumber-789"                              │
        │  ]                                            │
        └─────┬─────────────────┬──────────────┬────────┘
              │                 │              │
              │ Manages         │ Manages      │ Manages
              ▼                 ▼              ▼
    ┌─────────────────┐ ┌─────────────┐ ┌──────────────┐
    │ Joe's Coffee    │ │ Sweet Bakery│ │ Quick Plumber│
    │ Type: client    │ │ Type: client│ │ Type: client │
    │ ID: "coffee-    │ │ ID: "bakery-│ │ ID: "plumber-│
    │      shop-123"  │ │      456"   │ │      789"    │
    ├─────────────────┤ ├─────────────┤ ├──────────────┤
    │ managedBy:      │ │ managedBy:  │ │ managedBy:   │
    │ "acme-          │ │ "acme-      │ │ "acme-       │
    │  accounting"    │ │  accounting"│ │  accounting" │
    └─────────────────┘ └─────────────┘ └──────────────┘

    ┌───────────────────────────────────────────────────┐
    │  USERS                                            │
    ├───────────────────────────────────────────────────┤
    │                                                   │
    │  Sarah (Admin at ACME)                            │
    │  ├─ primaryCompanyId: "acme-accounting"          │
    │  ├─ roles: ["admin"]                              │
    │  └─ ✅ Can access ALL 4 workspaces:              │
    │     • /workspace/acme-accounting                  │
    │     • /workspace/coffee-shop-123                  │
    │     • /workspace/bakery-456                       │
    │     • /workspace/plumber-789                      │
    │                                                   │
    │  Tom (Staff at ACME)                              │
    │  ├─ primaryCompanyId: "acme-accounting"          │
    │  ├─ roles: ["financial_admin"]                    │
    │  ├─ accessibleCompanyIds: ["coffee-shop-123"]    │
    │  └─ ✅ Can access 2 workspaces:                  │
    │     • /workspace/acme-accounting (primary)        │
    │     • /workspace/coffee-shop-123 (explicit)       │
    │     ❌ Cannot access bakery-456 or plumber-789   │
    │                                                   │
    │  Joe (Owner of Joe's Coffee)                      │
    │  ├─ primaryCompanyId: "coffee-shop-123"          │
    │  ├─ roles: ["admin"]                              │
    │  └─ ✅ Can access 1 workspace:                   │
    │     • /workspace/coffee-shop-123                  │
    │     ❌ Cannot access ACME or other companies     │
    │                                                   │
    │  Maria (Employee at Joe's Coffee)                 │
    │  ├─ primaryCompanyId: "coffee-shop-123"          │
    │  ├─ roles: ["user"]                               │
    │  └─ ✅ Can access 1 workspace:                   │
    │     • /workspace/coffee-shop-123                  │
    │     ❌ No access to /companies admin view        │
    │                                                   │
    └───────────────────────────────────────────────────┘
```

## UI Navigation Flow by User Type

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    NAVIGATION BY USER TYPE                               │
└──────────────────────────────────────────────────────────────────────────┘

╔══════════════════════════════════════════════════════════════════════════╗
║  SUPER_ADMIN / DEVELOPER                                                 ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Landing Page → Dashboard with Admin Tools                              ║
║                                                                          ║
║  Sidebar Navigation:                                                     ║
║  ┌────────────────────────────────────────────────┐                     ║
║  │ 🏠 Dashboard                                    │                     ║
║  │ 🏢 Companies (Admin View) ◀─── PRIMARY         │                     ║
║  │    ├─ View all companies                       │                     ║
║  │    ├─ Create new company                       │                     ║
║  │    ├─ Edit/Delete companies                    │                     ║
║  │    └─ "Open Workspace" button on each          │                     ║
║  │                                                 │                     ║
║  │ When clicking "Open Workspace" ─────┐          │                     ║
║  │                                      │          │                     ║
║  │ 👥 User Management                   │          │                     ║
║  │ ⚙️  Settings                         │          │                     ║
║  └──────────────────────────────────────┼──────────┘                     ║
║                                         │                                ║
║                                         ▼                                ║
║                    ┌────────────────────────────────┐                    ║
║                    │ /workspace/[companyId]         │                    ║
║                    │ (Financial Operations)         │                    ║
║                    │ ├─ Dashboard                   │                    ║
║                    │ ├─ Banking & Cash              │                    ║
║                    │ ├─ Invoicing                   │                    ║
║                    │ ├─ Customers & Suppliers       │                    ║
║                    │ ├─ Accounting                  │                    ║
║                    │ └─ Reports                     │                    ║
║                    │                                │                    ║
║                    │ [Back to Companies] button     │                    ║
║                    └────────────────────────────────┘                    ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║  ADMIN (ManageAccounts Company)                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Landing Page → Dashboard / Companies List                              ║
║                                                                          ║
║  Sidebar Navigation:                                                     ║
║  ┌────────────────────────────────────────────────┐                     ║
║  │ 🏠 Dashboard                                    │                     ║
║  │ 🏢 Companies ◀─── Shows own + managed clients  │                     ║
║  │    ├─ ACME Accounting (own)                    │                     ║
║  │    │   └─ "Open Workspace"                     │                     ║
║  │    ├─ Client 1 (managed)                       │                     ║
║  │    │   ├─ "Open Workspace"                     │                     ║
║  │    │   └─ "Manage Access" (grant to staff)     │                     ║
║  │    ├─ Client 2 (managed)                       │                     ║
║  │    └─ [+ Link New Client] button               │                     ║
║  │                                                 │                     ║
║  │ 📋 Company Selector (quick switcher)           │                     ║
║  │    └─ Dropdown: Own + Managed Companies        │                     ║
║  └─────────────────────────────────────────────────┘                     ║
║                                                                          ║
║  Clicking "Open Workspace" → /workspace/[companyId]                     ║
║  (Same financial operations view as super admin)                        ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║  ADMIN (Regular Client Company)                                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Landing Page → Dashboard / Company Management                          ║
║                                                                          ║
║  Sidebar Navigation:                                                     ║
║  ┌────────────────────────────────────────────────┐                     ║
║  │ 🏠 Dashboard                                    │                     ║
║  │ 🏢 Company Info ◀─── Shows ONLY own company    │                     ║
║  │    └─ Joe's Coffee Shop                        │                     ║
║  │        ├─ View Details                         │                     ║
║  │        ├─ Edit Company Info                    │                     ║
║  │        └─ "Open Workspace"                     │                     ║
║  │                                                 │                     ║
║  │ (OR auto-redirect to workspace)                │                     ║
║  └─────────────────────────────────────────────────┘                     ║
║                                                                          ║
║  Usually redirected directly to:                                        ║
║  /workspace/coffee-shop-123                                             ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║  FINANCIAL_ADMIN / USER                                                  ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  Landing Page → Auto-redirect to workspace                              ║
║                                                                          ║
║  ❌ NO ACCESS to /companies                                             ║
║  ✅ Direct access to /workspace/[primaryCompanyId]                      ║
║                                                                          ║
║  Sidebar Navigation:                                                     ║
║  ┌────────────────────────────────────────────────┐                     ║
║  │ 🏠 Dashboard (workspace dashboard)              │                     ║
║  │ 💰 Banking & Cash                               │                     ║
║  │ 📄 Invoicing                                    │                     ║
║  │ 👥 Customers & Suppliers                        │                     ║
║  │ 📊 Reports                                      │                     ║
║  │                                                 │                     ║
║  │ (No admin navigation items)                    │                     ║
║  └─────────────────────────────────────────────────┘                     ║
║                                                                          ║
║  Permissions determined by role:                                        ║
║  • financial_admin: Full financial operations                           ║
║  • user: View-only or limited edit based on CompanyAccess               ║
║                                                                          ║
╚══════════════════════════════════════════════════════════════════════════╝
```

## Quick Reference: What Goes Where

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    FEATURE LOCATION MATRIX                               │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  /companies (ADMIN VIEW)                /workspace/[id] (WORKSPACE)     │
│  ════════════════════════               ═══════════════════════════     │
│                                                                          │
│  ✅ View company list                    ✅ Financial dashboard          │
│  ✅ View company details                 ✅ Bank statements              │
│  ✅ Create company                       ✅ Bank reconciliation          │
│  ✅ Edit company info                    ✅ Bank import (statement→GL)   │
│  ✅ Delete company                       ✅ Cash flow                    │
│  ✅ Activate/deactivate                  ✅ Invoices                     │
│  ✅ Link/unlink clients (MA)             ✅ Quotes                       │
│  ✅ Manage user access (MA)              ✅ Contracts/SLAs               │
│  ✅ "Open Workspace" button              ✅ Customers                    │
│                                          ✅ Suppliers                    │
│  ❌ Financial dashboard                  ✅ Chart of accounts            │
│  ❌ Bank statements                      ✅ Journal entries              │
│  ❌ Any financial operations             ✅ Reports                      │
│  ❌ Invoicing                            ✅ All financial operations     │
│  ❌ Reconciliation                                                       │
│                                          ❌ Company management           │
│                                          ❌ Create companies             │
│                                          ❌ System admin tasks           │
│                                                                          │
│  WHO CAN ACCESS:                         WHO CAN ACCESS:                │
│  • super_admin                           • super_admin                  │
│  • developer                             • developer                    │
│  • admin                                 • admin (if authorized)        │
│                                          • financial_admin (if auth)    │
│  WHO CANNOT:                             • user (if authorized)         │
│  • financial_admin                                                      │
│  • user                                  WHO CANNOT:                    │
│                                          • Users without access          │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Summary

This visual guide illustrates the three-tier access control system:

1. **System Tier**: Super admins and developers with full access
2. **ManageAccounts Tier**: Accounting firms managing multiple client companies
3. **Client Tier**: Regular companies accessing only their own data

The key architectural principle is **clear separation**:
- `/companies` = Company management (admin operations)
- `/workspace/[companyId]` = Financial operations (daily work)

This ensures users are never confused about where to perform which operations, and maintains proper security boundaries between administrative and operational concerns.
