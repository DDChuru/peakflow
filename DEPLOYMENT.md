# PeakFlow Deployment Guide

## Quick Deployment to Vercel

### Step 1: Prepare Your Repository

1. Ensure all changes are committed:
```bash
git add .
git commit -m "Add Gemini PDF extraction functionality"
git push origin main
```

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts and set environment variables when asked.

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=peakflow-3a2ed.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=peakflow-3a2ed
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=peakflow-3a2ed.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=244374297943
NEXT_PUBLIC_FIREBASE_APP_ID=1:244374297943:web:bdb6cdfc855059a88f7212
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-0SHKPBDPJR
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSyBTQPGX78kfkV71LSOZeUy1vwZihUvrOuo
```

5. Click "Deploy"

### Step 3: Firebase Configuration

1. **Firestore Security Rules**:
Update `firestore.rules` and deploy:
```bash
firebase deploy --only firestore:rules
```

2. **Enable Authentication**:
- Go to Firebase Console > Authentication
- Enable Email/Password provider

3. **Create Firestore Collections**:
The app will automatically create these collections:
- `pdf_extractions` - Stores extracted PDF data
- `usage_tracking` - Monitors API usage
- `config` - Stores API keys (optional)

### Step 4: Post-Deployment

1. **Test the deployment**:
- Visit your Vercel URL
- Sign up/login
- Test PDF extraction with a sample document

2. **Monitor usage**:
- Check Firebase Console for usage stats
- Monitor Gemini API usage in Google Cloud Console

## Environment Variables Setup

### Local Development (.env.local)
Already configured with your API keys.

### Production (Vercel)
Add these in Vercel Dashboard > Settings > Environment Variables:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | AIzaSyCMuPp8kXVgBkHKxxEt2XIX6mwr_tRR_jc |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | peakflow-3a2ed.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | peakflow-3a2ed |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | peakflow-3a2ed.firebasestorage.app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 244374297943 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:244374297943:web:bdb6cdfc855059a88f7212 |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | G-0SHKPBDPJR |
| `NEXT_PUBLIC_GEMINI_API_KEY` | AIzaSyBTQPGX78kfkV71LSOZeUy1vwZihUvrOuo |

## Deployment Commands

### Quick Deploy
```bash
# Deploy to Vercel
vercel --prod

# Deploy Firebase rules
firebase deploy --only firestore:rules
```

### Build Locally
```bash
# Test production build
npm run build
npm run start
```

## Troubleshooting

### Common Issues

1. **Build Errors**:
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

2. **Environment Variables Not Loading**:
- Ensure all variables start with `NEXT_PUBLIC_`
- Redeploy after adding new variables
- Check Vercel dashboard for variable status

3. **Firebase Connection Issues**:
- Verify Firebase project settings
- Check security rules
- Ensure authentication is enabled

4. **Gemini API Errors**:
- Verify API key is valid
- Check quota limits
- Ensure proper error handling

## Monitoring

### Application Logs
- Vercel Dashboard > Functions > Logs
- Firebase Console > Functions > Logs

### Performance
- Vercel Analytics (if enabled)
- Firebase Performance Monitoring

### Usage Tracking
- Firebase Console > Firestore > usage_tracking collection
- Google Cloud Console > APIs > Gemini API metrics

## Security Checklist

- [ ] Environment variables configured in Vercel
- [ ] Firebase security rules deployed
- [ ] Authentication required for PDF extraction
- [ ] API keys not exposed in code
- [ ] CORS properly configured
- [ ] Rate limiting implemented (optional)

## Support

For deployment issues:
- Vercel: [vercel.com/support](https://vercel.com/support)
- Firebase: [firebase.google.com/support](https://firebase.google.com/support)
- Gemini API: [ai.google.dev](https://ai.google.dev)