# Smoke Test Guide: Admin/Workspace Separation

## Overview
This guide helps verify the critical architectural fixes that separate admin operations from workspace operations in the PeakFlow application.

## What Was Implemented

### 1. Fixed `/companies` Page (Admin Operations)
- **Removed**: Financial dashboard and bank statements buttons
- **Added**: "Open Workspace" button that navigates to workspace dashboard
- **Purpose**: Clear separation between admin company management and financial operations

### 2. Created Workspace Dashboard (`/workspace/[companyId]/dashboard`)
- **New Page**: Central hub for all financial operations
- **Features**:
  - Company header with logo and industry template info
  - Financial KPIs (cash balance, revenue, AR, reconciliations)
  - Quick action cards for Bank Import, Reconciliation, Invoices, Reports
  - Recent activity placeholder
  - Access control integration

### 3. Added Access Control Hook (`useWorkspaceAccess`)
- **New Hook**: `/src/hooks/useWorkspaceAccess.ts`
- **Logic**:
  - Admins/developers: Full access to all workspaces
  - Users: Access to their own company workspace
  - Placeholder for Phase 6 multi-tenant access
- **Applied To**:
  - Workspace Dashboard page
  - Bank Import page

### 4. Updated TypeScript Types
- **CompanyType**: Added 'manageAccounts' option
- **User Interface**: Added TODO comments for Phase 6 multi-company access fields

## Pre-Test Setup

### Required Environment
- Dev server running (`npm run dev`)
- Firebase authentication configured
- At least 2 test companies in the database:
  1. One company you're logged in as
  2. One company you don't have access to

### Test User Accounts Needed
1. **Admin User**: Has 'admin' or 'developer' role
2. **Regular User**: Has 'client' role with companyId set

## Test Procedures

### Test 1: Companies Page Admin Operations ✅

**Purpose**: Verify financial operations removed from companies page

**Steps**:
1. Log in as admin user
2. Navigate to `/companies`
3. Look at any company card

**Expected Results**:
- ✅ "View details" button present
- ✅ "Edit" button present
- ✅ "Open Workspace" button present (indigo/primary color)
- ❌ "Financial dashboard" button NOT present
- ❌ "Bank statements" button NOT present
- ✅ "Activate/Deactivate" button present (if admin)
- ✅ "Delete" button present (if admin)

**Common Issues**:
- If old buttons still appear, clear browser cache and refresh
- Check console for any JavaScript errors

---

### Test 2: Navigate to Workspace Dashboard ✅

**Purpose**: Verify navigation from companies page to workspace

**Steps**:
1. On `/companies` page, click "Open Workspace" for any company
2. Observe the URL and page content

**Expected Results**:
- ✅ URL changes to `/workspace/[companyId]/dashboard`
- ✅ Page loads without 404 error
- ✅ WorkspaceLayout sidebar is visible
- ✅ Company name appears in the header
- ✅ Company logo or initial badge displays
- ✅ Industry template badge shown (if company has industry set)
- ✅ 4 KPI cards display (Cash Balance, Revenue, Outstanding AR, Pending Reconciliations)
- ✅ 4 Quick Action cards display (Bank Import, Reconciliation, Invoices, Reports)

**Common Issues**:
- 404 error: Ensure file exists at correct path
- Layout not appearing: Check WorkspaceLayout component import
- Missing company data: Check Firebase connection

---

### Test 3: Workspace Access Control - Admin ✅

**Purpose**: Verify admins can access all workspaces

**Steps**:
1. Log in as admin/developer user
2. Navigate to `/workspace/[companyId]/dashboard` for ANY company
3. Try accessing a company that's NOT your own

**Expected Results**:
- ✅ Page loads successfully for any company
- ✅ No "Access Denied" message
- ✅ Company details display correctly
- ✅ "Manage Companies" button visible in top-right (admin only)

**Common Issues**:
- Access denied incorrectly: Check hasRole('admin') function
- Hook not detecting admin role: Verify AuthContext

---

### Test 4: Workspace Access Control - Regular User ✅

**Purpose**: Verify users can only access their own workspace

**Steps**:
1. Log in as regular user (not admin)
2. Navigate to `/workspace/[yourCompanyId]/dashboard` (your own company)
3. Try navigating to `/workspace/[otherCompanyId]/dashboard` (different company)

**Expected Results for Own Company**:
- ✅ Page loads successfully
- ✅ Dashboard displays with company details
- ✅ Quick actions are accessible

**Expected Results for Other Company**:
- ✅ Access control triggers
- ✅ Alert message: "You do not have access to this workspace"
- ✅ "Return to Dashboard" button appears
- ❌ Company details NOT visible
- ❌ Quick actions NOT accessible

**Common Issues**:
- Can access other companies: Check useWorkspaceAccess hook logic
- user.companyId not set: Check Firebase user document

---

### Test 5: Bank Import Page Access Control ✅

**Purpose**: Verify access control applied to bank import page

**Steps**:
1. Navigate to `/workspace/[companyId]/bank-import`
2. Test both as admin and as regular user
3. Test with own company and other company

**Expected Results**:
- ✅ Admin can access any company's bank import
- ✅ Regular user can access own company's bank import
- ✅ Regular user sees "Access Denied" for other companies
- ✅ Loading spinner shows during access check

**Common Issues**:
- No access control: Verify useWorkspaceAccess import
- Page doesn't redirect: Check access check logic placement

---

### Test 6: Quick Actions Navigation ✅

**Purpose**: Verify quick action cards navigate correctly

**Steps**:
1. On workspace dashboard, click each quick action card:
   - Bank Import
   - Reconciliation
   - Invoices
   - Reports

**Expected Results**:
- ✅ Bank Import: Navigates to `/workspace/[companyId]/bank-import` (implemented)
- ⏳ Reconciliation: Navigates to `/workspace/[companyId]/reconciliation` (placeholder)
- ⏳ Invoices: Navigates to `/workspace/[companyId]/invoices` (placeholder)
- ⏳ Reports: Navigates to `/workspace/[companyId]/reports` (placeholder)

**Note**: Reconciliation, Invoices, and Reports pages don't exist yet - 404 is expected for now

**Common Issues**:
- Wrong URL: Check href in quickActions array
- Card not clickable: Verify onClick handler

---

### Test 7: Company Info Display ✅

**Purpose**: Verify company information displays correctly

**Steps**:
1. Navigate to workspace dashboard for a company with:
   - Logo set
   - Industry template assigned
   - Active status
2. Navigate to a company without logo

**Expected Results for Company With Logo**:
- ✅ Company logo displays (not initial badge)
- ✅ Company name in large text
- ✅ Company type shown (PeakFlow/Client)
- ✅ "Active" badge displays (green)
- ✅ Industry icon (Factory) and name shown
- ✅ Account count badge next to industry

**Expected Results for Company Without Logo**:
- ✅ Initial badge displays (first letter of company name)
- ✅ Gradient background (indigo to purple)

**Common Issues**:
- Logo not loading: Check company.logoUrl in Firebase
- Industry not showing: Check company.industry field matches INDUSTRY_TEMPLATES keys

---

### Test 8: TypeScript Compilation ✅

**Purpose**: Verify no TypeScript errors in new code

**Steps**:
1. Run: `npx tsc --noEmit`
2. Check for errors in:
   - `/app/companies/page.tsx`
   - `/app/workspace/[companyId]/dashboard/page.tsx`
   - `/src/hooks/useWorkspaceAccess.ts`
   - `/src/types/auth.ts`

**Expected Results**:
- ✅ No TypeScript errors in the above files
- ✅ CompanyType includes 'manageAccounts'
- ✅ User interface has TODO comments

**Common Issues**:
- Import errors: Check all import paths are correct
- Type errors: Verify all required types are imported

---

### Test 9: Sidebar Navigation ✅

**Purpose**: Verify WorkspaceLayout sidebar works correctly

**Steps**:
1. On workspace dashboard, observe sidebar
2. Click on different navigation items
3. Check for "Bank Import" with "NEW" badge

**Expected Results**:
- ✅ Sidebar shows company name in "Workspace" section
- ✅ "Banking & Cash" section has sub-items
- ✅ "Bank Import" has "NEW" badge
- ✅ Current page is highlighted (indigo background)
- ✅ Clicking navigation items changes active state

**Common Issues**:
- Sidebar not showing: Check WorkspaceLayout wrapper
- Navigation not working: Check Link href values

---

### Test 10: Responsive Design ✅

**Purpose**: Verify UI works on different screen sizes

**Steps**:
1. Open workspace dashboard
2. Resize browser to mobile width (< 768px)
3. Check KPI cards and quick actions
4. Test sidebar on mobile

**Expected Results**:
- ✅ KPI cards stack vertically on mobile
- ✅ Quick action cards stack vertically on mobile
- ✅ Sidebar becomes hamburger menu on mobile
- ✅ Mobile menu opens/closes correctly
- ✅ All buttons remain accessible

**Common Issues**:
- Cards not stacking: Check grid responsive classes
- Sidebar overlap: Check z-index values

---

## Quick Verification Checklist

Run these 3 quick tests (< 2 minutes) to verify core functionality:

- [ ] Navigate to `/companies` → Click "Open Workspace" → Workspace dashboard loads
- [ ] As admin, access any company's workspace → Success
- [ ] As regular user, try accessing other company's workspace → Access Denied

## Known Limitations (Phase 6 Features)

These are intentionally NOT implemented yet:

- ❌ Multi-company access via `accessibleCompanyIds`
- ❌ Role-based permissions within workspace (viewer, editor, admin)
- ❌ Team-based access control
- ❌ Invitation system for workspace access
- ❌ Granular feature permissions
- ❌ Access audit logging

## Rollback Procedure

If critical issues are found:

1. **Companies Page**: Revert `/app/companies/page.tsx` to previous commit
2. **Workspace Dashboard**: Delete `/app/workspace/[companyId]/dashboard` directory
3. **Access Hook**: Delete `/src/hooks/useWorkspaceAccess.ts`
4. **Types**: Revert `/src/types/auth.ts` CompanyType change
5. **Bank Import**: Remove access control code from bank-import page

## Success Criteria

✅ All tests pass without errors
✅ No TypeScript compilation errors
✅ No console errors during navigation
✅ Access control works as expected
✅ UI is responsive and functional

## Next Steps After Verification

1. Update modernization-roadmap.md with completed items
2. Begin Phase 6 planning for full multi-tenant access
3. Implement remaining workspace pages (Reconciliation, Invoices, Reports)
4. Add access audit logging
5. Create user invitation system

---

**Test Date**: _____________
**Tested By**: _____________
**Status**: [ ] Pass [ ] Fail [ ] Partial
**Notes**: _____________________________________________
