#!/bin/bash

# Deploy Firebase Functions using nvm to temporarily use Node 20

set -e

echo "🔧 Firebase Functions Deployment with Node 20"
echo "=============================================="
echo ""

# Check if nvm is installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "📦 Installing nvm..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

    # Load nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "✅ nvm is already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

echo ""
echo "📥 Installing Node 20..."
nvm install 20

echo ""
echo "🔄 Switching to Node 20..."
nvm use 20

echo ""
echo "📋 Current Node version:"
node --version

echo ""
echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

echo ""
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To verify, check logs:"
echo "   firebase functions:log --only extractPDFContent"
echo ""
echo "🎯 Now test by uploading a bank statement!"
