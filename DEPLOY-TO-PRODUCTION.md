# 🚀 Deploy to Production - Final Steps

## ✅ What's Fixed

- Bank statement service now uses server-side API route (`/api/extract-pdf`)
- New API key will be used from environment variable
- No more client-side exposure
- Code is committed: `cd2d604`

---

## 🎯 Deploy Steps (5 minutes)

### Step 1: Update Netlify Environment Variable

1. Go to: **Netlify Dashboard → Site settings → Environment variables**

2. Find: `GEMINI_API_KEY`

3. **Update value** with your NEW API key: `AIzaSyCZspkBlOGAM6o...`

4. Click **"Save"**

---

### Step 2: Nuclear Deploy (CRITICAL!)

1. Go to: **Netlify → Deploys**

2. Click: **"Trigger deploy"**

3. Select: **"Deploy project without cache"** ← This is critical!

4. **Wait** for deployment to complete (~5-10 minutes)

---

### Step 3: Verify Deployment

After deploy completes:

**Check A: Commit hash**
- Should show: `cd2d604`

**Check B: Upload a PDF**
- Should work without "leaked key" error

**Check C: Browser console**
- No 403 errors
- Upload completes successfully

---

## ⚠️ Important Notes

### The Cache Clear is Critical

Without "Deploy without cache", Netlify will serve the old JavaScript bundle with the old code.

### Verify Your New API Key Works

Before deploying, make sure:
- ✅ New key is created at https://aistudio.google.com/app/apikey
- ✅ It's NOT the old blocked key
- ✅ You tested it locally (which you did - it worked!)

---

## 🆘 If Problems Occur

### Issue: Still getting "leaked key" error

**Solution**:
- Hard refresh browser: `Ctrl+Shift+R`
- Try incognito/private window
- Verify deployment commit is `cd2d604`

### Issue: 500 error on /api/extract-pdf

**Solution**:
- Check environment variable is set in Netlify
- Verify no typos in the key
- Check Netlify function logs for errors

---

## ✅ Success Checklist

- [ ] Updated `GEMINI_API_KEY` in Netlify
- [ ] Deployed without cache
- [ ] Verified commit `cd2d604` is deployed
- [ ] Tested PDF upload in production
- [ ] No "leaked key" errors
- [ ] Ready for client onboarding!

---

## 🎉 After This Works

Your system will be:
- ✅ Secure (API key on server only)
- ✅ Working (new key not blocked)
- ✅ Clean (no debug mess)
- ✅ Ready for clients

---

**Go deploy now!** Your client is waiting. 🚀
