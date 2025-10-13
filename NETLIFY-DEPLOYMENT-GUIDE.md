# Netlify Deployment Guide - PeakFlow

## 🚀 Quick Deployment Steps

This guide will help you deploy PeakFlow to Netlify so your team can test the latest features including:
- ✅ AI-powered workspace chat
- ✅ Batch transaction mapping
- ✅ Professional landing page with logo
- ✅ Enhanced entity recognition

---

## Prerequisites

Before deploying, ensure you have:
- [ ] Netlify account (free tier works)
- [ ] Access to Firebase project credentials
- [ ] Anthropic API key (for AI features)
- [ ] Gemini API key (for document processing)

---

## Step 1: Push Latest Changes to GitHub

```bash
cd ~/Documents/projects/vercel/peakflow

# Verify all changes are committed
git status

# Push to GitHub
git push origin main
```

**Expected output:**
```
Branch main is up to date with 'origin/main'
```

---

## Step 2: Connect Repository to Netlify

### Option A: Netlify Dashboard (Recommended)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and authorize access
4. Select **"peakflow"** repository
5. Configure build settings:

```yaml
Branch to deploy: main
Build command: npm run build
Publish directory: .next
```

6. Click **"Show advanced"** and add environment variables (see Step 3)
7. Click **"Deploy site"**

### Option B: Netlify CLI

```bash
# Install Netlify CLI (if not installed)
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init

# Follow prompts:
# - Create & configure a new site
# - Team: Select your team
# - Site name: peakflow-app (or your choice)
# - Build command: npm run build
# - Publish directory: .next
```

---

## Step 3: Configure Environment Variables

### Required Environment Variables

Add these in **Netlify Dashboard** → **Site settings** → **Environment variables**:

#### 🔑 **Public Variables** (Safe to expose)

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peakflow-3a2ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=peakflow-3a2ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peakflow-3a2ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=244374297943
NEXT_PUBLIC_FIREBASE_APP_ID=1:244374297943:web:bdb6cdfc855059a88f7212
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0SHKPBDPJR
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBTQPGX78kfkV71LSOZeUy1vwZihUvrOuo
```

#### 🔐 **Secret Variables** (DO NOT expose publicly)

```bash
ANTHROPIC_API_KEY=sk-ant-api03-[YOUR_KEY_HERE]
ANTHROPIC_MODEL=claude-sonnet-4-5-20250929
```

**⚠️ IMPORTANT:** Replace `[YOUR_KEY_HERE]` with actual Anthropic API key

---

## Step 4: Configure Build Settings

### Update netlify.toml (if needed)

The current `netlify.toml` needs one update - remove Turbopack flag which isn't supported by Netlify:

```toml
[build]
  command = "npm run build"  # ✅ Correct - uses standard Next.js build
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  # Public Firebase config
  NEXT_PUBLIC_FIREBASE_API_KEY = "AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = "peakflow-3a2ed.firebaseapp.com"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID = "peakflow-3a2ed"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = "peakflow-3a2ed.firebasestorage.app"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = "244374297943"
  NEXT_PUBLIC_FIREBASE_APP_ID = "1:244374297943:web:bdb6cdfc855059a88f7212"
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = "G-0SHKPBDPJR"
  NEXT_PUBLIC_USE_FIREBASE_EMULATOR = "false"
  NEXT_PUBLIC_GEMINI_API_KEY = "AIzaSyBTQPGX78kfkV71LSOZeUy1vwZihUvrOuo"

  # Note: Add ANTHROPIC_API_KEY in Netlify Dashboard (secret variable)
```

---

## Step 5: Deploy

### Automatic Deployment
Once connected, Netlify will automatically deploy on every push to `main`:

```bash
git push origin main
# Netlify automatically builds and deploys
```

### Manual Deployment (CLI)
```bash
# Build locally first
npm run build

# Deploy to Netlify
netlify deploy --prod
```

---

## Step 6: Verify Deployment

After deployment completes (usually 2-5 minutes), test these features:

### ✅ Critical Features to Test

1. **Landing Page**
   - Visit: `https://your-site.netlify.app/`
   - ✅ Logo displays correctly
   - ✅ Navigation works
   - ✅ All sections load (hero, features, testimonials, pricing)
   - ✅ "Get Started" buttons link to signup

2. **Authentication**
   - Visit: `https://your-site.netlify.app/signup`
   - ✅ Sign up form works
   - ✅ Firebase authentication connects
   - ✅ Redirects after signup

3. **Workspace AI Chat** (NEW!)
   - Login to dashboard
   - Navigate to **AI Assistant** (should have "NEW" badge)
   - ✅ Chat interface loads
   - ✅ Can send messages
   - ✅ AI responds with markdown formatting
   - ✅ Can search suppliers/customers

4. **Bank Import**
   - Navigate to Bank Import
   - Upload a bank statement
   - ✅ Auto-matching works
   - ✅ AI suggestions appear
   - ✅ Batch-mapping works (similar transactions)

5. **Dashboard Features**
   - ✅ Company selection works
   - ✅ Navigation sidebar appears
   - ✅ All workspace pages load

---

## Common Issues & Solutions

### Issue 1: Build Fails with Turbopack Error
**Error:** `--turbopack flag not recognized`

**Solution:** Netlify uses standard Next.js build. The `netlify.toml` already specifies `npm run build` which will use the package.json script with Turbopack locally but Netlify will use standard build.

If build still fails, temporarily remove `--turbopack` from package.json:
```json
"build": "next build",  // Remove --turbopack for Netlify
```

### Issue 2: AI Chat Not Working
**Error:** `AI Assistant not configured` or 401 errors

**Solution:**
1. Verify `ANTHROPIC_API_KEY` is set in Netlify environment variables
2. Redeploy the site after adding the key
3. Check browser console for specific error messages

### Issue 3: Firebase Connection Fails
**Error:** Firebase initialization errors

**Solution:**
1. Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set correctly
2. Check Firebase console that web app is configured
3. Verify Firebase rules allow authenticated reads

### Issue 4: Images Not Loading
**Error:** Logo or images return 404

**Solution:**
1. Verify `public/peakflow-logo.png` exists in repository
2. Check that public folder is included in git
3. Clear Netlify cache and redeploy

### Issue 5: Environment Variables Not Working
**Error:** `undefined` values in production

**Solution:**
1. Variables starting with `NEXT_PUBLIC_` are embedded at build time
2. After adding env vars, trigger a **new deploy** (not just republish)
3. Use "Deploy" → "Trigger deploy" → "Clear cache and deploy site"

---

## Performance Optimization

### Enable Next.js Image Optimization

Add to `netlify.toml`:
```toml
[[plugins]]
  package = "@netlify/plugin-nextjs"

[plugins.inputs]
  enable_image_optimization = true
```

### Configure Caching

```toml
[[headers]]
  for = "/_next/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/public/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000"
```

---

## Monitoring & Debugging

### Netlify Deploy Logs
1. Go to **Deploys** tab in Netlify dashboard
2. Click on the latest deploy
3. View **Deploy log** for build output and errors

### Function Logs (for AI API)
1. Go to **Functions** tab
2. Click on function name (if using Netlify Functions)
3. View logs for API route errors

### Browser Console
```javascript
// Check environment variables (only NEXT_PUBLIC_* will be visible)
console.log(process.env)
```

---

## Team Testing Checklist

Share this checklist with your team:

### 🧪 Testing Instructions for Team

**Deployment URL:** `https://your-site.netlify.app`

#### 1. Landing Page Test
- [ ] Visit homepage
- [ ] Verify logo appears in navigation
- [ ] Check all sections load properly
- [ ] Test "Get Started" button

#### 2. Authentication Test
- [ ] Click "Sign Up"
- [ ] Create test account
- [ ] Verify email/password validation
- [ ] Confirm redirect to dashboard

#### 3. AI Workspace Chat Test (NEW FEATURE!)
- [ ] Login to dashboard
- [ ] Click "AI Assistant" in sidebar (has NEW badge)
- [ ] Send test message: "Show me all current suppliers"
- [ ] Verify AI responds with actual supplier list
- [ ] Test: "What GL account should I use for utilities?"
- [ ] Confirm markdown formatting works (bold, lists, etc.)

#### 4. Bank Import - Batch Mapping Test (NEW FEATURE!)
- [ ] Navigate to Bank Import
- [ ] Upload test bank statement
- [ ] Map one transaction manually
- [ ] **Verify toast shows: "Mapping applied to X similar transactions!"**
- [ ] Confirm similar transactions auto-mapped

#### 5. General Functionality
- [ ] Create a company
- [ ] Access workspace
- [ ] Navigate between pages (customers, suppliers, invoices)
- [ ] Test responsive design (mobile, tablet)

#### 6. Report Issues
If you find bugs, report with:
- What you were doing
- Expected behavior
- Actual behavior
- Browser and device
- Screenshots if applicable

---

## Quick Deploy Commands Reference

```bash
# Check status
netlify status

# View logs
netlify logs

# Trigger manual deploy
netlify deploy --prod

# Open site
netlify open:site

# Open admin dashboard
netlify open:admin

# Set environment variable
netlify env:set ANTHROPIC_API_KEY "your-key-here"

# List environment variables
netlify env:list
```

---

## Rollback Strategy

If deployment has issues:

```bash
# Via Dashboard
# 1. Go to Deploys tab
# 2. Find last working deploy
# 3. Click "..." → "Publish deploy"

# Via CLI
netlify rollback
```

---

## Security Checklist

Before sharing with team:

- [x] ✅ Public Firebase config is safe to expose (read-only public keys)
- [x] ✅ ANTHROPIC_API_KEY is stored as secret environment variable
- [x] ❌ Service account JSON is NOT in repository (.gitignore)
- [x] ✅ Firestore security rules are deployed
- [x] ✅ Authentication is required for protected routes
- [ ] ⚠️ **TODO:** Set up custom domain with SSL
- [ ] ⚠️ **TODO:** Configure CORS for Firebase Storage
- [ ] ⚠️ **TODO:** Add rate limiting for AI API routes

---

## Cost Considerations

### Netlify Free Tier Limits:
- ✅ 100GB bandwidth/month (sufficient for testing)
- ✅ 300 build minutes/month
- ✅ Unlimited sites
- ⚠️ Edge Functions: 125k requests/month

### API Costs (When Testing):
- **Anthropic Claude Sonnet 4.5:**
  - ~$0.003 per message (input)
  - ~$0.015 per response (output)
  - Budget: ~$10-20/month for testing

- **Firebase:**
  - Free tier: 50k reads/day
  - Free tier: 20k writes/day
  - Sufficient for testing

- **Gemini API:**
  - Free tier: 60 requests/minute
  - Sufficient for testing

---

## Support & Resources

- **Netlify Docs:** https://docs.netlify.com/
- **Next.js on Netlify:** https://docs.netlify.com/frameworks/next-js/
- **Firebase Setup:** https://firebase.google.com/docs/web/setup
- **Project Repo:** https://github.com/DDChuru/peakflow

---

## Post-Deployment Steps

1. **Share Deployment URL** with team
2. **Create test accounts** for each team member
3. **Set up admin users** in Firebase (manual role assignment)
4. **Monitor usage** in Netlify analytics
5. **Review error logs** daily during testing phase
6. **Collect feedback** from team
7. **Iterate** based on feedback

---

## Success Criteria

✅ Deployment is successful when:
- Landing page loads with logo
- Authentication works
- AI chat responds to queries
- Bank import with batch-mapping works
- All workspace features accessible
- No console errors
- Performance is acceptable (< 3s load time)

---

## Next Steps After Testing

1. **Gather Feedback** from team
2. **Fix Critical Bugs** identified during testing
3. **Optimize Performance** based on real usage
4. **Set Up Custom Domain** (if desired)
5. **Enable Analytics** tracking
6. **Plan Production Release**

---

## Quick Start for Your Team

Send this to your team:

```
🎉 PeakFlow is now live for testing!

📱 Test Site: https://[your-site].netlify.app

🔑 Test Account:
- Create your own account at /signup
- Or use shared test account (provide credentials)

✨ NEW Features to Test:
1. AI Workspace Chat - Click "AI Assistant" (NEW badge)
2. Batch Transaction Mapping - Upload bank statement
3. Professional Landing Page - Check out the new logo!

🐛 Found a bug? Report in #peakflow-testing channel

📖 Full testing guide: See NETLIFY-DEPLOYMENT-GUIDE.md
```

---

## Deployment Complete! 🚀

Your PeakFlow application is now live and ready for team testing.

**Need help?** Check the Common Issues section or contact the development team.

**Happy Testing!** 🎉
