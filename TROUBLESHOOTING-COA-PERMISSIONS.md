# Chart of Accounts Permissions Troubleshooting

## Issue: GL Mapping Rules Permission Denied

When applying an industry template, you may encounter this error:
```
Failed to apply industry template: FirebaseError: Missing or insufficient permissions.
```

### What's Happening:

✅ **Chart of Accounts created successfully** (27 accounts)
❌ **GL Mapping Rules failed** (transaction patterns and vendor mappings)

The COA batch write succeeds, but individual writes to `glMappingRules` fail due to permission validation.

### Root Cause:

Firestore security rules require `admin` or `developer` role to create GL mapping rules. The issue occurs when:

1. User document in `/users/{uid}` doesn't exist
2. User document exists but `roles` field is missing or formatted incorrectly
3. Firestore security rules fail to read the roles during individual writes (even though batch writes work)

### Solution 1: Verify User Document (Recommended)

1. Open Firebase Console → Firestore Database
2. Navigate to `/users` collection
3. Find your user document (use your UID from console logs)
4. Verify the document structure:

```json
{
  "uid": "vZr6Ucz3A1SHXY7FktoxxnENdCv2",
  "email": "your@email.com",
  "displayName": "Your Name",
  "roles": ["admin"],  // ← Must be an array containing "admin" or "developer"
  "companyId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

5. If `roles` field is missing or wrong, update it to: `["admin"]`

### Solution 2: Use the System (Manual Mapping)

Even without automatic mapping rules, you can still use bank-to-ledger import:

1. **Chart of Accounts is created** (27 GL accounts) ✅
2. **Bank transactions can be imported** ✅
3. **Manual mapping** available in dropdown menus ✅
4. **You just won't get automatic suggestions** ⚠️

The system degrades gracefully - you'll need to manually select debit/credit accounts for each transaction type, but everything else works.

### Solution 3: Fix Security Rules (Advanced)

If you have custom authentication, you may need to adjust the security rules in `firestore.rules`:

```javascript
// Current rule
function hasRole(role) {
  return isAuthenticated() &&
    exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
    role in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.roles;
}

// If roles are stored differently, adjust accordingly
```

### How to Verify It's Fixed:

1. Check browser console after clicking "Reset & Re-apply Template"
2. Look for these success logs:
   ```
   [IndustryTemplate] Accounts created: 27
   [IndustryTemplate] Patterns created: 274
   [IndustryTemplate] Vendors created: 238
   ```

3. If you see:
   ```
   ✅ Accounts created: 27
   ❌ Patterns created: 0
   ❌ Vendors created: 0
   ```
   Then the permission issue still exists.

### Impact:

**With Mapping Rules (Full Auto-Mapping):**
- 75-88% auto-match rate
- Smart vendor recognition
- Confidence scoring for suggestions
- One-click approval for suggested mappings

**Without Mapping Rules (Manual Mapping Only):**
- 0% auto-match rate
- Manual dropdown selection required
- No suggestions
- More time-consuming but still functional

### Next Steps:

1. Try applying the template again - it should now succeed with the COA
2. Check the warning toast for details about what failed
3. Verify your Firestore user document has correct `roles` array
4. Once roles are fixed, click "Reset & Re-apply Template" to get the mapping rules

## Need Help?

Check the browser console for detailed error messages. The logs will show:
- Your user roles
- Exact permission errors
- Which step failed (accounts, patterns, or vendors)
