# Test Firebase Function Directly

## Summary

- ✅ Firestore `config/apis` has the NEW key
- ✅ Firebase Function is deployed
- ❓ Why is it still using the old key?

## Possible Causes

1. **Firebase Functions are cached** - Takes 5-10 minutes for environment changes to propagate
2. **The function was deployed with the old key baked in** - Need to redeploy
3. **There's another place the key is stored** - Need to investigate

## Quick Test

**Just try uploading a bank statement now!**

The Firebase Function reads from Firestore, and Firestore has the new key, so it SHOULD work.

## If It Still Fails

Then we know the deployed function either:
1. Has the old key hard-coded somehow
2. Is using a different environment variable source
3. Needs to be redeployed

In that case, we need to either:
- **Option A**: Deploy Firebase Functions (requires Node 20+)
- **Option B**: Use the Next.js API route instead (which works with your local `.env.local`)

**Try the upload first** - it might just work!
