#!/bin/bash

echo "Deploying to Vercel with environment variables..."

# Deploy with all env vars inline
npx vercel --yes \
  --env NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc \
  --env NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peakflow-3a2ed.firebaseapp.com \
  --env NEXT_PUBLIC_FIREBASE_PROJECT_ID=peakflow-3a2ed \
  --env NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peakflow-3a2ed.firebasestorage.app \
  --env NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=244374297943 \
  --env NEXT_PUBLIC_FIREBASE_APP_ID=1:244374297943:web:bdb6cdfc855059a88f7212 \
  --env NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0SHKPBDPJR \
  --env NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false \
  --env NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE \
  --name peakflow-dd \
  --prod