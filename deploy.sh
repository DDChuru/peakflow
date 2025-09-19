#!/bin/bash

# Deployment script for PeakFlow

echo "🚀 Starting PeakFlow deployment..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "Please ensure environment variables are configured."
    exit 1
fi

# Build the project
echo "📦 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Deploy to Vercel
echo "🎯 Deploying to Vercel..."
echo ""
echo "Run the following command to deploy:"
echo ""
echo "npx vercel --prod"
echo ""
echo "During deployment, set these environment variables in Vercel:"
echo ""
echo "NEXT_PUBLIC_FIREBASE_API_KEY"
echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "NEXT_PUBLIC_FIREBASE_APP_ID"
echo "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
echo "NEXT_PUBLIC_GEMINI_API_KEY"
echo ""
echo "Or use the Vercel Dashboard to configure them."
echo ""
echo "📚 Full deployment guide: DEPLOYMENT.md"