# PeakFlow Deployment Guide

## Prerequisites

1. **Firebase Project**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Enable Authentication (Email/Password)
   - Get your Firebase configuration

2. **Google Gemini API Key**
   - Get API key from https://makersuite.google.com/app/apikey

3. **Vercel Account**
   - Sign up at https://vercel.com

## Step 1: Firebase Setup

### 1.1 Create Firebase Project
- Go to Firebase Console
- Click "Add Project"
- Name it (e.g., "peakflow-production")
- Enable Google Analytics (optional)

### 1.2 Configure Firestore
```bash
# Install Firebase CLI globally if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in your project
firebase init

# Select:
# - Firestore
# - Functions
# - Use existing project
```

### 1.3 Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

### 1.4 Deploy Cloud Functions
```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## Step 2: Environment Variables

### 2.1 Get Firebase Config
- Firebase Console → Project Settings → General → Your apps → Web app
- Copy the configuration

### 2.2 Create Production Environment File
Create `.env.production` in root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_actual_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

## Step 3: Vercel Deployment

### Option A: Via Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Configure project settings
# - Deploy
```

### Option B: Via GitHub Integration
1. Push your code to GitHub
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Add environment variables in Vercel dashboard:
   - Settings → Environment Variables
   - Add all variables from `.env.production`
5. Deploy

## Step 4: Configure Firebase Functions URL

After deploying Functions, update your frontend code with the Functions URL:
1. Find your Functions URL in Firebase Console → Functions
2. Update any API calls to use the production Functions URL

## Step 5: Post-Deployment

### 5.1 Create Admin User
1. Go to Firebase Console → Authentication
2. Add a new user with email/password
3. Go to Firestore → Create `users` collection
4. Add document with user's UID and set `role: "admin"`

### 5.2 Test Features
- Sign up/Login
- Company creation
- PDF extraction
- Admin panel access

## Sharing Your Deployment

Once deployed, you'll get:
- **Vercel URL**: `https://your-app.vercel.app`
- **Custom Domain** (optional): Configure in Vercel dashboard

Share the Vercel URL with others to access your application.

## Troubleshooting

### Functions Not Working
- Check Functions logs: `firebase functions:log`
- Ensure CORS is configured correctly
- Verify API keys are set

### Authentication Issues
- Check Firebase Authentication is enabled
- Verify Firebase config in environment variables
- Check browser console for errors

### Firestore Permissions
- Review firestore.rules file
- Check user roles in Firestore

## Commands Summary

```bash
# Firebase deployment
firebase deploy --only firestore:rules,firestore:indexes
firebase deploy --only functions

# Vercel deployment
vercel --prod

# Check logs
firebase functions:log
vercel logs
```