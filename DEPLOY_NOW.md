# Deploy to Vercel - Step by Step

Since the CLI needs interactive input, here's the manual approach:

## Step 1: Create Vercel Account (if you don't have one)
Go to: https://vercel.com/signup
- Sign up with GitHub/GitLab/Bitbucket or Email

## Step 2: Deploy Your Project

### Option A: Use GitHub (Recommended)
1. **Push to GitHub first**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/peakflow.git
git push -u origin main
```

2. **Go to**: https://vercel.com/new

3. **Click "Import Git Repository"**

4. **Select your peakflow repository**

### Option B: Direct Upload (No Git needed)
1. **Go to**: https://vercel.com/new

2. **Click "Deploy without Git"** (at the bottom)

3. **Run this command locally**:
```bash
npx vercel
```

When prompted:
- Login? → Enter your email
- Setup and deploy? → Y
- Which scope? → Select your account
- Link to existing? → N
- Project name? → peakflow (or press Enter)
- Directory? → ./ (press Enter)
- Override? → N

## Step 3: Add Environment Variables

After deployment starts, you'll see "Configure Project":

1. Click **"Environment Variables"**

2. Add these variables from your `.env.local`:
```
NEXT_PUBLIC_FIREBASE_API_KEY → (your value)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN → (your value)
NEXT_PUBLIC_FIREBASE_PROJECT_ID → (your value)
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET → (your value)
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID → (your value)
NEXT_PUBLIC_FIREBASE_APP_ID → (your value)
NEXT_PUBLIC_GEMINI_API_KEY → (your value)
```

3. Click **"Deploy"**

## Step 4: Get Your Live URL

After 2-3 minutes, you'll get:
- **Production URL**: `https://peakflow-[random].vercel.app`
- **Dashboard**: `https://vercel.com/[your-username]/peakflow`

## That's your shareable link!

Share the production URL with anyone to access your app.