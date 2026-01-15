# Update Firebase Functions Environment Variable via Google Cloud Console

## Option 1: Use Google Cloud Console (Easier)

Firebase Functions run on Google Cloud Functions. You can manage them through Google Cloud Console:

### Step 1: Go to Cloud Functions

**URL**: https://console.cloud.google.com/functions/list?project=peakflow-3a2ed

### Step 2: Find `extractPDFContent`

Look for the function named `extractPDFContent` in the list.

### Step 3: Click the Function Name

This will open the function details page.

### Step 4: Click "EDIT" at the Top

Now you should see an "EDIT" button at the top of the page.

### Step 5: Scroll to "Runtime, build, connections and security settings"

Click to expand this section.

### Step 6: Click "Runtime" Tab

You should see "Runtime environment variables" section.

### Step 7: Add/Update Environment Variable

- Click "Add Variable"
- **Name**: `GEMINI_API_KEY`
- **Value**: `AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0`

### Step 8: Click "Next" → "Deploy"

This will redeploy the function with the new environment variable.

---

## Option 2: Deploy via CLI with Node 20

If Google Cloud Console doesn't work, run this script:

```bash
./DEPLOY-WITH-NVM.sh
```

This will:
1. Install nvm (Node Version Manager) if needed
2. Install Node 20
3. Deploy Firebase Functions with the new key from `functions/.env`

---

## Why This Fixes It

The deployed function currently has:
```
process.env.GEMINI_API_KEY = "AIzaSyBg-utsnwQpzfH9Y0xOyjYHIojzXohO3Tk" (OLD BLOCKED KEY)
```

After updating:
```
process.env.GEMINI_API_KEY = "AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0" (NEW KEY)
```

Then the function will use the new key and work! ✅

---

## Which Option Should You Use?

**Try Option 1 (Google Cloud Console) first** - it's easier and doesn't require Node 20.

**If that doesn't work, use Option 2** (CLI deployment script).
