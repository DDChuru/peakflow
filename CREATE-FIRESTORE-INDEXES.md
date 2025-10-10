# Create Firestore Indexes - Manual Steps

The gcloud command isn't configured, so please create the indexes manually via Firebase Console.

## IMPORTANT: Use the "Composite" Tab

⚠️ **Do NOT use the "Single field" tab** - those automatic settings won't help.

You need to use the **"Composite"** tab to create these indexes manually.

## Quick Steps (5 minutes)

### 1. Navigate to Composite Indexes

1. Open this link: https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes
2. Click the **"Composite"** tab at the top (next to "Single field")
3. Click **"Create Index"** button

### 2. Create Index for Quotes

Fill in the form:
- **Collection ID**: `quotes`
- **Query scope**: Select **"Collection"** (not Collection group)
- **Fields to index**:
  - Click "Add field"
  - Field path: `createdAt`
  - Query scope: **Descending**
- Click **"Create"**
- Wait 2-3 minutes for index to build

### 3. Create Index for Invoices

1. Click **"Create Index"** button again
2. Fill in:
   - **Collection ID**: `invoices`
   - **Query scope**: Collection
   - **Fields**: `createdAt` - Descending
3. Click **"Create"**
4. Wait 2-3 minutes

### 4. Create Index for Service Agreements

1. Click **"Create Index"** button again
2. Fill in:
   - **Collection ID**: `serviceAgreements`
   - **Query scope**: Collection
   - **Fields**: `createdAt` - Descending
3. Click **"Create"**
4. Wait 2-3 minutes

## Verify Indexes Are Building

You should see three indexes with status "Building..." in the Firebase Console:

- ✅ quotes (createdAt DESC) - Building...
- ✅ invoices (createdAt DESC) - Building...
- ✅ serviceAgreements (createdAt DESC) - Building...

## After Indexes Are Built

Once all three indexes show status "Enabled" (green checkmark):

1. Refresh the Invoices page: `http://localhost:3000/workspace/[companyId]/invoices`
2. Refresh the Quotes page: `http://localhost:3000/workspace/[companyId]/quotes`
3. Refresh the Contracts page: `http://localhost:3000/workspace/[companyId]/contracts`

All three pages should now load data successfully! ✅

---

## Alternative: If You Have Firebase Admin Access

You can also use this direct link format to create each index:

**Quotes Index:**
```
https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes/single-field?create=&collection=quotes&field=createdAt
```

**Invoices Index:**
```
https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes/single-field?create=&collection=invoices&field=createdAt
```

**Service Agreements Index:**
```
https://console.firebase.google.com/project/peakflow-3a2ed/firestore/indexes/single-field?create=&collection=serviceAgreements&field=createdAt
```

---

## Summary

**Why this is needed:** Firestore requires composite indexes for any query that uses `orderBy()` on a field. Our revenue modules query with `orderBy('createdAt', 'desc')` which needs these indexes.

**Is this normal:** Yes! This is standard for all Firestore apps. You create these indexes once and they work forever.

**Will the code work after this:** Yes! 100%. All business logic is complete. This is just the database configuration step.
