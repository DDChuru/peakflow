# Vercel Environment Variables Setup

## How to Add in Vercel Dashboard:

1. After importing your GitHub repo on Vercel
2. You'll see **"Configure Project"** screen
3. Click **"Environment Variables"** section
4. Add each variable below one by one:

## Copy These Values:

### Variable 1:
**Key:** `NEXT_PUBLIC_FIREBASE_API_KEY`
**Value:** `AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc`

### Variable 2:
**Key:** `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
**Value:** `peakflow-3a2ed.firebaseapp.com`

### Variable 3:
**Key:** `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
**Value:** `peakflow-3a2ed`

### Variable 4:
**Key:** `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
**Value:** `peakflow-3a2ed.firebasestorage.app`

### Variable 5:
**Key:** `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
**Value:** `244374297943`

### Variable 6:
**Key:** `NEXT_PUBLIC_FIREBASE_APP_ID`
**Value:** `1:244374297943:web:bdb6cdfc855059a88f7212`

### Variable 7:
**Key:** `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
**Value:** `G-0SHKPBDPJR`

### Variable 8:
**Key:** `NEXT_PUBLIC_USE_FIREBASE_EMULATOR`
**Value:** `false`

### Variable 9:
**Key:** `NEXT_PUBLIC_GEMINI_API_KEY`
**Value:** `YOUR_GEMINI_API_KEY_HERE`

## Quick Add Method:

In Vercel's Environment Variables section, you can also click "Add Multiple" and paste this:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peakflow-3a2ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=peakflow-3a2ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peakflow-3a2ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=244374297943
NEXT_PUBLIC_FIREBASE_APP_ID=1:244374297943:web:bdb6cdfc855059a88f7212
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0SHKPBDPJR
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

Then click "Add" and you're done!

## After Adding Variables:

Click **"Deploy"** and wait 2-3 minutes for your app to go live.