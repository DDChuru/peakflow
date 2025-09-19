# Bank Statement Troubleshooting Guide

## Common Issues and Solutions

### 1. "Missing or insufficient permissions" Error

This error occurs when Firestore security rules don't allow access to the bank statement collections.

**✅ FIXED**: Updated Firestore rules deployed successfully.

#### What was added to firestore.rules:
- `bank_statements` collection rules
- `usage_tracking` collection rules
- `pdf_extractions` collection rules
- `config` collection rules (blocks client access to API keys)

#### Permission Structure:
- **Regular Users**: Can access bank statements for their assigned company
- **Admins/Developers**: Can access all bank statements
- **Owners**: Can access statements they uploaded

### 2. User Not Assigned to Company

If a user isn't assigned to a company, they won't be able to access bank statements.

**Check user assignment:**
```javascript
// Check if user has companyId in their profile
const user = auth.currentUser;
const userDoc = await getDoc(doc(db, 'users', user.uid));
console.log('User company:', userDoc.data()?.companyId);
```

**Solution**: Assign user to a company via admin panel.

### 3. Firebase Functions Not Deployed

If the extraction fails, check if Firebase Functions are deployed.

**Verify functions:**
```bash
firebase functions:list
```

**Should show:**
- `extractPDFContent`
- `getExtractionTypes`
- `getExtractionHistory`
- `testExtraction`

**Test function:**
```bash
curl https://us-central1-peakflow-3a2ed.cloudfunctions.net/testExtraction
```

### 4. Missing Firestore Indexes

Some queries might fail if composite indexes aren't created.

**Auto-create indexes:**
- Visit the bank statements page
- Firebase will show index creation links in console
- Click the links to auto-create required indexes

**Manual index creation:**
```bash
firebase deploy --only firestore:indexes
```

### 5. API Key Issues

**Check Gemini API key configuration:**

1. **Environment variable** (preferred):
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_key_here
   ```

2. **Firebase Functions config**:
   ```bash
   firebase functions:config:get
   ```

3. **Firestore config** (fallback):
   - Document: `config/apis`
   - Field: `geminiApiKey`

### 6. Network/CORS Issues

**Check browser console** for:
- CORS errors
- Network timeouts
- Failed API calls

**Solution**: Firebase Functions automatically handle CORS.

## Testing Steps

### 1. Basic Authentication Test
```javascript
import { auth } from '@/lib/firebase/config';
console.log('Current user:', auth.currentUser);
```

### 2. Company Access Test
```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const companyDoc = await getDoc(doc(db, 'companies', 'COMPANY_ID'));
console.log('Company access:', companyDoc.exists());
```

### 3. Bank Statement Collection Test
```javascript
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase/config';

const statementsQuery = query(
  collection(db, 'bank_statements'),
  where('companyId', '==', 'COMPANY_ID')
);
const snapshot = await getDocs(statementsQuery);
console.log('Statements count:', snapshot.size);
```

### 4. Function Test
```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';

const testFunction = httpsCallable(functions, 'getExtractionTypes');
const result = await testFunction();
console.log('Function result:', result.data);
```

## Debug Console Commands

Open browser DevTools Console and run:

```javascript
// Check authentication
console.log('Auth user:', window.firebase?.auth?.currentUser);

// Check Firebase config
console.log('Firebase config:', window.firebase?.app?.options);

// Test Firestore connection
firebase.firestore().collection('companies').limit(1).get()
  .then(snap => console.log('Firestore connected:', snap.size))
  .catch(err => console.error('Firestore error:', err));
```

## Support

If issues persist:

1. Check browser DevTools Console for errors
2. Check Firebase Console for function logs
3. Verify user roles and company assignment
4. Ensure all Firebase services are properly configured

## Quick Fixes Applied

✅ **Firestore Rules**: Updated and deployed
✅ **Firebase Functions**: Deployed and tested
✅ **Integration Points**: Added to all pages
⚠️ **Indexes**: May need manual creation via Firebase Console

The permission error should now be resolved!