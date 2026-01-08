#!/bin/bash

# Deploy to Firebase Hosting script
# Requires: firebase login (run once before first deploy)

echo "🔥 Deploying PeakFlow to Firebase Hosting..."

# Use Node 20 (required by Firebase CLI)
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 --silent || nvm use --delete-prefix v20 --silent

# Check Node version
NODE_VERSION=$(node -v)
echo "📦 Using Node.js $NODE_VERSION"

# Build and deploy
echo "🏗️  Building Next.js app..."
npm run build

if [ $? -eq 0 ]; then
    echo "🚀 Deploying to Firebase..."
    firebase deploy --only hosting

    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🌐 Your app is live at: https://peakflow-3a2ed.web.app"
    else
        echo "❌ Firebase deploy failed"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi
