# Enable Ledger Deletion for Testing

## Problem

Your Firestore security rules prevent deletion of journal entries and ledger entries (which is correct for production - accounting entries should be immutable).

But for **testing purposes**, you need to temporarily allow deletion to reset your posted invoices.

## Solution: Temporarily Update Firestore Rules

### Step 1: Update firestore.rules

Open `firestore.rules` and find these two sections:

#### Section 1: journal_entries (around line 318)

**Find this:**
```javascript
// Posted journal entries (global collection with tenant scoping)
match /journal_entries/{entryId} {
  allow read: if isAuthenticated() &&
    resource.data.tenantId != null &&
    belongsToCompany(resource.data.tenantId);
  allow create, update: if isAuthenticated() &&
    request.resource.data.tenantId != null &&
    belongsToCompany(request.resource.data.tenantId);
  allow delete: if false;  // ⬅️ THIS LINE
}
```

**Change to:**
```javascript
// Posted journal entries (global collection with tenant scoping)
match /journal_entries/{entryId} {
  allow read: if isAuthenticated() &&
    resource.data.tenantId != null &&
    belongsToCompany(resource.data.tenantId);
  allow create, update: if isAuthenticated() &&
    request.resource.data.tenantId != null &&
    belongsToCompany(request.resource.data.tenantId);
  allow delete: if canManageCompanies();  // ⬅️ CHANGED: Allow admins to delete for testing
}
```

#### Section 2: general_ledger (around line 329)

**Find this:**
```javascript
// General ledger entries (global collection with tenant scoping)
match /general_ledger/{entryId} {
  allow read: if isAuthenticated() &&
    resource.data.tenantId != null &&
    belongsToCompany(resource.data.tenantId);
  allow create: if isAuthenticated() &&
    request.resource.data.tenantId != null &&
    belongsToCompany(request.resource.data.tenantId);
  allow update, delete: if false;  // ⬅️ THIS LINE
}
```

**Change to:**
```javascript
// General ledger entries (global collection with tenant scoping)
match /general_ledger/{entryId} {
  allow read: if isAuthenticated() &&
    resource.data.tenantId != null &&
    belongsToCompany(resource.data.tenantId);
  allow create: if isAuthenticated() &&
    request.resource.data.tenantId != null &&
    belongsToCompany(request.resource.data.tenantId);
  allow update: if false;
  allow delete: if canManageCompanies();  // ⬅️ CHANGED: Allow admins to delete for testing
}
```

### Step 2: Deploy the Updated Rules

```bash
firebase deploy --only firestore:rules
```

Or if using the Firebase Console:
1. Go to Firebase Console → Firestore Database → Rules
2. Copy and paste the updated rules
3. Click "Publish"

### Step 3: Use the Reset Page

Now you can use the reset page:
```
http://localhost:3000/workspace/YOUR_COMPANY_ID/admin/reset-ledger
```

The deletion should work now!

### Step 4: IMPORTANT - Revert Rules After Testing

Once you're done testing and have re-posted your invoices with the new structure, **revert the rules back**:

```javascript
// journal_entries
allow delete: if false;  // ⬅️ REVERT: Immutable for audit trail

// general_ledger
allow update, delete: if false;  // ⬅️ REVERT: Immutable for audit trail
```

Then deploy again:
```bash
firebase deploy --only firestore:rules
```

## Why This Matters

**In production accounting systems:**
- Journal entries and ledger entries should **NEVER** be deleted
- They form the immutable audit trail
- Corrections are made through **reversing entries**, not deletion
- This is a fundamental accounting principle (GAAP/IFRS requirement)

**For testing:**
- You need to clean up test data
- Temporary deletion is acceptable in development
- Always revert to immutable rules before production

## Alternative: Use Firebase Console

If you don't want to modify rules, you can delete the entries manually:

1. Go to Firebase Console
2. Navigate to Firestore Database
3. Delete the `journal_entries` collection
4. Delete the `general_ledger` collection
5. Update your invoices manually to remove `journalEntryId` and `postedDate`

But using the rules approach is cleaner and more automated.
