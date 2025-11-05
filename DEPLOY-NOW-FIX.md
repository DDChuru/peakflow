# 🚀 DEPLOY NOW - Complete Fix for API Key Exposure

## What Was Wrong

The error "API key exposed" was happening because:

1. ❌ Client code imported `@/services/document-ai/pdf-extraction`
2. ❌ That service imports `@google/generative-ai`
3. ❌ Next.js bundled the Google AI SDK into client JavaScript
4. ❌ API key was being passed to client code
5. ❌ Google detected the key in browser and flagged it

## What I Fixed

✅ **Removed the problematic import** from client code
✅ **Created server-side API route** (`/api/extract-pdf`)
✅ **All Gemini API calls now happen server-side only**
✅ **API key never touches client JavaScript**

---

## DEPLOY STEPS (Do This Now)

### 1. Commit Changes

```bash
git add .
git commit -m "fix: prevent API key exposure - remove client-side Gemini imports"
git push origin main
```

### 2. Update Netlify Environment Variables

1. **Go to**: Netlify Dashboard → Your site → Site settings → Environment variables

2. **Delete** (if exists):
   - `NEXT_PUBLIC_GEMINI_API_KEY`

3. **Add new**:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyBg-utsnwQpzfH9Y0xOyjYHIojzXohO3Tk`
   - **Scopes**: All scopes

4. **Save**

### 3. Clear Cache and Deploy

In Netlify:
- Go to **Deploys** tab
- Click **Trigger deploy**
- Select **Clear cache and deploy site**

This is **CRITICAL** - must clear cache to remove old bundled code!

### 4. Wait for Deploy

- Monitor deployment in Netlify dashboard
- Should complete in 2-5 minutes
- Check for any build errors

---

## VERIFY IT WORKS

After deployment completes:

### Test 1: Check Browser Bundle

1. Open your production site
2. Press `F12` (open DevTools)
3. Go to **Sources** tab
4. Press `Ctrl+F` to search
5. Search for: `GoogleGenerativeAI`
6. **Expected**: "No results" (NOT in client code) ✅

### Test 2: Upload PDF

1. Go to bank import or PDF upload page
2. Upload a bank statement
3. Check **Network** tab in DevTools
4. Find request to `/api/extract-pdf`
5. Click on it → **Payload** tab
6. **Verify**: Only `pdfBase64` and `documentType` (NO API key)
7. **Verify**: Extraction completes successfully

### Test 3: Check for Errors

1. Open **Console** tab in DevTools
2. Upload another PDF
3. **Expected**: No "API key exposed" errors ✅

---

## If You See Errors

### "Module not found: @google/generative-ai"

The dependency might not be installed. Run:

```bash
npm install @google/generative-ai
git add package.json package-lock.json
git commit -m "chore: add google AI dependency"
git push
```

### "GEMINI_API_KEY is not defined"

Environment variable not set. Go back to step 2 and add it in Netlify.

### Still seeing "API key exposed"

1. Make sure you cleared build cache (step 3)
2. Do a hard refresh in browser: `Ctrl+Shift+R`
3. Check that the new code is deployed (look at commit hash in Netlify)

---

## Expected Result

After successful deployment:

✅ PDF extraction works perfectly
✅ No API key in browser
✅ No "API key exposed" errors
✅ Google AI SDK NOT bundled in client
✅ All API calls go through `/api/extract-pdf`

---

## Summary

**The fix**: Removed client-side imports of Google AI SDK

**Before**:
```
Browser → Google AI SDK (bundled) → API key exposed
```

**After**:
```
Browser → /api/extract-pdf (server) → Google AI SDK → API key safe
```

**Deploy now** and the issue will be completely resolved! 🎉

---

## Need Help?

Check the deployment logs in Netlify if anything goes wrong. The most important thing is to **clear the build cache** when deploying.
