# Firebase Functions Setup - Bank Statement Extraction

## Why Firebase Functions Instead of Next.js API Route?

**Firebase Functions** is the CORRECT choice for bank statement processing because:

1. ✅ **9-minute timeout** (vs 10-second Netlify timeout)
2. ✅ **Battle-tested extraction logic** with multi-page handling
3. ✅ **Secure API key** via environment variables (not exposed to client)
4. ✅ **1GB memory** allocation for large PDFs
5. ✅ **Automatic continuation** for truncated extractions

**Next.js API routes on Netlify** cause:
- ❌ 504 timeout errors on large statements (3-month statements with 200+ transactions)
- ❌ Memory constraints
- ❌ No continuation logic

---

## Current Status

✅ Code updated to use Firebase Functions (`bank-statement-service.ts` line 370)
⏳ **Need to set environment variable and deploy**

---

## Setup Steps

### Step 1: Set Firebase Functions Environment Variable

**Option A: Using Firebase Console (Recommended)**
1. Go to: https://console.firebase.google.com/project/peakflow-3a2ed/functions
2. Click on a function → "Variables and secrets" tab
3. Add secret:
   - **Key**: `GEMINI_API_KEY`
   - **Value**: `AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0` (your new key)

**Option B: Using Firebase CLI** (requires Node.js v20+)
```bash
# From project root
firebase functions:secrets:set GEMINI_API_KEY
# When prompted, paste: AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0
```

**Option C: Using .env file in functions/ directory**
```bash
# Create functions/.env.local
cd functions
echo "GEMINI_API_KEY=AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0" > .env.local
```

---

### Step 2: Deploy Firebase Functions

```bash
# From project root
./deploy-functions.sh
```

Or manually:
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

**Expected output:**
```
✔ functions[us-central1-extractPDFContent] Successful update operation
✔ functions[us-central1-getExtractionTypes] Successful update operation
✔ functions[us-central1-getExtractionHistory] Successful update operation
✔ functions[us-central1-testExtraction] Successful update operation
```

---

### Step 3: Verify Environment Variable

Check that the function can access the API key:
```bash
firebase functions:log --only extractPDFContent
```

Look for log line:
```
Gemini API key loaded from environment variable
```

---

## How It Works

### Client Flow:
```
User uploads PDF
    ↓
bank-statement-service.ts (line 370)
    ↓
httpsCallable(functions, 'extractPDFContent')
    ↓
Firebase Function (functions/index.js line 929)
    ↓
Uses process.env.GEMINI_API_KEY (line 909)
    ↓
Gemini AI extraction with 9-minute timeout
    ↓
Returns extracted data
    ↓
Client processes with bank-specific parsers
```

### Security:
- ✅ API key stored in Firebase Functions environment (encrypted at rest)
- ✅ Only accessible to Firebase Functions backend
- ✅ Never exposed to client-side code
- ✅ Not in git repository

---

## Troubleshooting

### Issue: "GEMINI_API_KEY env var missing"
**Solution**: Deploy the environment variable (Step 1 above)

### Issue: Functions not deploying
**Solution**: Check Node.js version (need v20+)
```bash
node --version  # Should be >= v20.0.0
```

### Issue: Still getting 504 errors
**Solution**:
1. Verify deployment: `firebase functions:list`
2. Check logs: `firebase functions:log`
3. Ensure client is calling Firebase Function (not `/api/extract-pdf`)

---

## Why We Changed It

**History:**
1. **Originally**: Used Firebase Functions ✅
2. **Nov 5**: Changed to Next.js API route to fix API key exposure ❌
3. **Issue**: Next.js API routes timeout on large statements (504 error)
4. **Solution**: Reverted to Firebase Functions with secure environment variable ✅

**The Misconception:**
- We thought Next.js API routes were more secure
- **Reality**: Firebase Functions ALSO use environment variables (equally secure!)
- **Plus**: Firebase Functions have proper timeout handling for large PDFs

---

## Production Checklist

Before onboarding clients:

- [ ] Set `GEMINI_API_KEY` in Firebase Functions environment
- [ ] Deploy functions: `./deploy-functions.sh`
- [ ] Verify logs show "API key loaded from environment variable"
- [ ] Test with a 3-month Standard Bank statement
- [ ] Confirm no 504 errors
- [ ] Verify all transactions extracted (200+ transactions)

---

## Monitoring

**View Function Logs:**
```bash
firebase functions:log --only extractPDFContent
```

**Firebase Console:**
https://console.firebase.google.com/project/peakflow-3a2ed/functions

**Monitor Metrics:**
- Execution time (should be < 540 seconds)
- Memory usage (should be < 1GB)
- Error rate (should be near 0%)

---

## Next Steps

1. **Set environment variable** (Step 1 above)
2. **Deploy functions** (`./deploy-functions.sh`)
3. **Test with Standard Bank statement**
4. **Client ready!** 🎉
