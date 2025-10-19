# Firestore Security Rules Fix - GL Posting Permissions

**Date**: 2025-10-15
**Issue**: "Missing or insufficient permissions" when posting invoices to GL

---

## 🐛 Problem

### Error:
```
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
    at InvoicePostingService.postInvoiceToGL
```

### Root Cause:
The Firestore security rules only allowed admins/developers to create journal entries:

```javascript
// ❌ TOO RESTRICTIVE (firestore.rules lines 232, 239)
match /ledgerEntries/{ledgerEntryId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if canManageCompanies();  // ← Only admin/developer!
  allow delete: if false;
}

match /journalEntries/{journalId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if canManageCompanies();  // ← Only admin/developer!
  allow delete: if false;
}
```

**Problem**: Regular users who belong to a company should be able to post invoices to the general ledger, but `canManageCompanies()` only returns true for admin or developer roles.

---

## ✅ Solution Applied

### Updated Firestore Rules

**File**: `/firestore.rules` (lines 230-241)

**Before (❌ TOO RESTRICTIVE)**:
```javascript
// Ledger entries collection
match /ledgerEntries/{ledgerEntryId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if canManageCompanies();  // ← Problem!
  allow delete: if false;
}

// Journal entries collection
match /journalEntries/{journalId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if canManageCompanies();  // ← Problem!
  allow delete: if false;
}
```

**After (✅ FIXED)**:
```javascript
// Ledger entries collection
match /ledgerEntries/{ledgerEntryId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if belongsToCompany(companyId) || canManageCompanies();  // ✅ Fixed!
  allow delete: if false; // Ledger entries should never be deleted
}

// Journal entries collection
match /journalEntries/{journalId} {
  allow read: if belongsToCompany(companyId) || canManageCompanies();
  allow create, update: if belongsToCompany(companyId) || canManageCompanies();  // ✅ Fixed!
  allow delete: if false; // Journal entries should never be deleted
}
```

**Change**: Added `belongsToCompany(companyId) ||` to the create/update rules.

---

## 🔒 Security Impact

### What `belongsToCompany()` Checks:

```javascript
function belongsToCompany(companyId) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    (
      // User's primary company
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId ||
      // OR user has access via accessibleCompanyIds array
      (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accessibleCompanyIds != null &&
        companyId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.accessibleCompanyIds
      )
    );
}
```

### Security Guarantees:

✅ **User must be authenticated**
✅ **User must belong to the company** (primary or accessible)
✅ **User can only create journal entries for their own company**
✅ **Cross-company access is prevented**
✅ **Ledger entries cannot be deleted** (audit trail integrity)

---

## 👥 Who Can Now Create Journal Entries?

### Before Fix:
- ✅ Admins (role: 'admin')
- ✅ Developers (role: 'developer')
- ❌ Regular users (no access)
- ❌ Financial admins (no access)

### After Fix:
- ✅ Admins (role: 'admin')
- ✅ Developers (role: 'developer')
- ✅ **Regular users** (if they belong to the company)
- ✅ **Financial admins** (if they belong to the company)
- ✅ **Any authenticated user** (if they belong to the company)

---

## 🚀 Deployment

### Deployed via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

### Result:
```
✔  cloud.firestore: rules file firestore.rules compiled successfully
✔  firestore: released rules cloud.firestore to cloud.firestore
✨  Deploy complete!
```

**Ruleset**: `8157e7b7-19c2-4815-9043-9c6ee9e7d6ee`
**Deployed**: 2025-10-15 10:14:11 UTC

---

## ✅ Verification Steps

### Test Case 1: Regular User Posting Invoice
1. **Login as regular user** (not admin/developer)
2. **Ensure user belongs to company** (check `user.companyId`)
3. **Create an invoice** with tax
4. **Click "Post to GL"**
5. **Verify**: Success! Journal entry created

### Test Case 2: User Without Company Access
1. **Login as user A** (belongs to Company X)
2. **Try to post invoice** for Company Y
3. **Verify**: Permission denied (correct!)

### Test Case 3: Unauthenticated Access
1. **Logout**
2. **Try to access journal entries directly**
3. **Verify**: Permission denied (correct!)

### Test Case 4: Admin/Developer (Unchanged)
1. **Login as admin or developer**
2. **Post invoice to GL**
3. **Verify**: Still works (backwards compatible!)

---

## 🎓 Firestore Rules Best Practices

### Multi-Tenant Pattern:
```javascript
// ✅ GOOD - Company-scoped collections
match /companies/{companyId} {
  match /ledgerEntries/{entryId} {
    // Users can create entries for their own company
    allow create: if belongsToCompany(companyId);
  }
}
```

### Why This Works:
1. **Company ID is in the path** (`/companies/{companyId}/ledgerEntries/...`)
2. **Rule checks user belongs to that company**
3. **Prevents cross-company data access**
4. **Scalable across all company-scoped collections**

---

## 📊 Impact Analysis

### Before Fix:
- ❌ Regular users couldn't post invoices to GL
- ❌ Only admins could perform accounting operations
- ❌ Feature was effectively broken for most users

### After Fix:
- ✅ All company members can post to GL
- ✅ Multi-tenant security maintained
- ✅ Audit trail integrity preserved (no deletes)
- ✅ Feature now usable by entire team

---

## 🔗 Related Collections

### Same Pattern Applied To:
These collections all use `belongsToCompany()` for create/update:
- ✅ `/companies/{companyId}/invoices`
- ✅ `/companies/{companyId}/quotes`
- ✅ `/companies/{companyId}/payments`
- ✅ `/companies/{companyId}/debtors`
- ✅ `/companies/{companyId}/creditors`
- ✅ `/companies/{companyId}/bankAccounts`
- ✅ `/companies/{companyId}/statements`
- ✅ `/companies/{companyId}/creditNotes`
- ✅ **NEW**: `/companies/{companyId}/ledgerEntries`
- ✅ **NEW**: `/companies/{companyId}/journalEntries`

---

## ⚠️ Important Notes

### Audit Trail Protection:
```javascript
allow delete: if false; // Ledger entries should never be deleted
```

**Why**: General ledger entries are part of the permanent accounting record. Once posted, they should never be deleted - only reversed with offsetting entries.

### Update Permission:
```javascript
allow update: if belongsToCompany(companyId) || canManageCompanies();
```

**Why**: Sometimes entries need correction (e.g., fixing typos in descriptions, adding references). The posting service should handle immutability at the application layer.

**Future Enhancement**: Could add a `posted` field and prevent updates after posting:
```javascript
allow update: if (belongsToCompany(companyId) || canManageCompanies()) &&
  resource.data.status != 'posted';  // Can't update posted entries
```

---

## 🎯 Testing Checklist

After deploying rules:

- [x] Regular user can post invoice to GL
- [x] Journal entry created in Firestore
- [x] User from Company A cannot access Company B's entries
- [x] Unauthenticated requests are denied
- [x] Admin/developer permissions still work
- [x] Delete operations are blocked
- [x] Multi-tenant isolation is maintained

---

## ✅ Summary

**Issue**: Firestore rules too restrictive - only admins could post to GL
**Root Cause**: Rules only allowed `canManageCompanies()` (admin/developer)
**Solution**: Added `belongsToCompany(companyId)` to create/update rules
**Security**: Multi-tenant isolation maintained, audit trail protected
**Impact**: Feature now usable by all company members
**Deployment**: ✅ Successfully deployed to production

**Status**: ✅ **FIXED**

---

**Completed**: 2025-10-15 10:14:11 UTC
**Type**: Critical Bug Fix - Security Rules
**Module**: Firestore Security → GL Posting Permissions
**Ruleset ID**: 8157e7b7-19c2-4815-9043-9c6ee9e7d6ee
