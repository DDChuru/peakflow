#!/bin/bash

# Deploy Firestore Rules Script
# This script deploys the updated Firestore security rules to Firebase

echo "🔐 Deploying Firestore Rules..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check authentication
echo "Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not authenticated with Firebase."
    echo "Please run: firebase login"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

# Navigate to project directory
cd "$(dirname "$0")"

# Deploy Firestore rules
echo "📤 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore rules deployed successfully!"
    echo ""
    echo "The following rules were added/updated:"
    echo "  - bankImportSessions collection rules"
    echo ""
    echo "You can now:"
    echo "  1. Restart your dev server (npm run dev)"
    echo "  2. Test the bank-to-ledger posting flow"
    echo "  3. Transactions should post without permission errors!"
else
    echo ""
    echo "❌ Deployment failed. Please check the error above."
    exit 1
fi
