# Set Firebase Functions Environment Variable via Console

## The Real Issue

The deployed Firebase Function has `GEMINI_API_KEY` set as an **environment variable on Google's servers**.

This is NOT the same as:
- Your local `.env.local` file ❌
- The Firestore `config/apis` document ❌
- Your shell environment ❌

It's stored on Firebase's infrastructure and was set when the function was last deployed.

---

## Solution: Update via Firebase Console

### Step 1: Go to Firebase Functions Console

**URL**: https://console.firebase.google.com/project/peakflow-3a2ed/functions/list

### Step 2: Find the `extractPDFContent` Function

Click on the `extractPDFContent` function in the list.

### Step 3: Click "Edit" at the Top

This will open the function editor.

### Step 4: Go to "Runtime, build, connections and security settings"

Expand this section.

### Step 5: Add Environment Variable

Look for "Runtime environment variables" section.

Click "Add variable" or edit existing `GEMINI_API_KEY` if it exists.

**Set:**
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0`

### Step 6: Click "Next" → "Deploy"

This will redeploy the function with the new environment variable.

Takes about 3-5 minutes.

---

## Alternative: Use Secret Manager (More Secure)

If the above doesn't show environment variables option:

### Step 1: Go to Secret Manager

**URL**: https://console.cloud.google.com/security/secret-manager?project=peakflow-3a2ed

### Step 2: Create New Secret

- Click "Create Secret"
- **Name**: `GEMINI_API_KEY`
- **Secret value**: `AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0`
- Click "Create Secret"

### Step 3: Grant Access to Function

After creating:
- Click on the secret
- Go to "Permissions" tab
- Add the service account that runs your functions:
  - Usually: `peakflow-3a2ed@appspot.gserviceaccount.com`
  - Role: "Secret Manager Secret Accessor"

### Step 4: Update Function Code

The function code already checks `process.env.GEMINI_API_KEY`, so it should work automatically.

---

## Check Current Environment Variables (Advanced)

If you want to see what environment variables are currently set on the deployed function, you can check the Firebase Functions logs:

**URL**: https://console.firebase.google.com/project/peakflow-3a2ed/functions/logs

Look for log entries from `extractPDFContent` and see if it logs:
- "Gemini API key loaded from environment variable" ← Has env var
- "GEMINI_API_KEY env var missing; falling back to Firestore" ← No env var (using Firestore)

---

## Why This Is The Issue

The function code does this (line 908-925):

```javascript
async function getGeminiApiKey() {
  const runtimeKey = process.env.GEMINI_API_KEY;  // ← Checks deployed env var FIRST

  if (runtimeKey) {
    return runtimeKey;  // ← Returns this if it exists (OLD KEY!)
  }

  // Only falls back to Firestore if env var doesn't exist
  const configDoc = await db.collection('config').doc('apis').get();
  return configDoc.data().geminiApiKey;  // ← Never reaches here
}
```

**The problem:** `process.env.GEMINI_API_KEY` EXISTS in the deployed function (with old key), so it never falls back to Firestore!

---

## Summary

You're absolutely right - the function is NOT falling back to Firestore because there IS an environment variable set on the deployed function.

**Fix:** Update the environment variable via Firebase Console, OR delete it so it falls back to Firestore.

**Simplest:** Just set the correct env var in Firebase Console and redeploy.
