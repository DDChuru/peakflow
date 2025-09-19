# Quick Vercel Deployment (5 minutes)

Since Firebase is already set up, Vercel deployment is super simple:

## Option 1: GitHub + Vercel (Easiest - 3 minutes)

1. **Push to GitHub** (if not already):
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```

2. **Go to**: https://vercel.com/new

3. **Import Git Repository**
   - Click "Import" next to your GitHub repo
   - It auto-detects Next.js

4. **Add Environment Variables** (copy from your .env.local):
   Click "Environment Variables" and add:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   NEXT_PUBLIC_GEMINI_API_KEY
   ```

5. **Click "Deploy"**
   - Takes 2-3 minutes
   - You get instant URL: `https://your-project.vercel.app`

## Option 2: CLI Deploy (No GitHub needed - 5 minutes)

```bash
# Install and deploy in one go
npx vercel

# Answer prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? peakflow (or press enter)
# - Directory? ./ (press enter)
# - Override settings? N

# Add env vars when prompted or via dashboard later
```

## That's it!

Your app will be live at the URL Vercel provides. Share that link with anyone.

**Note**: First deployment might take 3-5 minutes. After that, every push to GitHub auto-deploys.