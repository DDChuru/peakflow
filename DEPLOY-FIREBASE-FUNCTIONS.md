# Deploy Firebase Functions with New API Key

## The Problem

The deployed Firebase Function has an old/blocked API key. We need to:
1. Set the new API key as an environment variable
2. Deploy the functions

## Solution

### Step 1: Install/Update Firebase Functions Dependencies

```bash
cd functions
npm install
cd ..
```

### Step 2: Set Environment Variable Using Firebase Secrets

Since you have Node 18 and Firebase CLI needs Node 20+, we'll use the Firestore fallback (which we already set up).

The function will use the Firestore `config/apis` document we created, which has the new key.

### Step 3: Deploy Functions

```bash
# Make sure you're logged in to Firebase
firebase login

# Deploy functions
firebase deploy --only functions
```

This will take about 2-3 minutes.

### Step 4: Verify Deployment

After deployment completes, test by uploading a bank statement.

---

## What Gets Deployed

The `functions/index.js` file with the `getGeminiApiKey()` function that:
1. First checks `process.env.GEMINI_API_KEY` (not set)
2. Falls back to Firestore `config/apis` document ✅ (has new key)

---

## If You Get Node Version Error

If Firebase CLI complains about Node version:

**Option 1: Use nvm to switch to Node 20**
```bash
# Install nvm if you don't have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install and use Node 20
nvm install 20
nvm use 20

# Now deploy
firebase deploy --only functions
```

**Option 2: Update Node globally**
```bash
# Using your package manager
sudo apt update
sudo apt install nodejs  # This should get you Node 20+
```

---

## Quick Deploy Command

```bash
# One-liner (run from project root)
cd functions && npm install && cd .. && firebase deploy --only functions
```

---

## After Deployment

1. **Test upload** - upload a Standard Bank statement
2. **Check logs** if there are issues:
   ```bash
   firebase functions:log --only extractPDFContent
   ```
3. Should see: "Using Gemini API key from Firestore fallback"
4. **Should work** with no "leaked key" error! ✅

---

## Why This Will Work

We already created the Firestore `config/apis` document with the new key.

The deployed function will:
1. Try to read `process.env.GEMINI_API_KEY` → Not found
2. Fall back to Firestore `config/apis` → ✅ Has new key!
3. Use the new key → ✅ Works!

No need to mess with environment variables, secrets, or Node version issues!
