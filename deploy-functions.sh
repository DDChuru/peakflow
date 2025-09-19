#!/bin/bash

# Firebase Functions Deployment Script

echo "🚀 Deploying Firebase Functions for PDF Extraction..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}❌ Firebase CLI is not installed!${NC}"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "firebase.json" ]; then
    echo -e "${RED}❌ firebase.json not found!${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Install function dependencies
echo -e "${YELLOW}📦 Installing function dependencies...${NC}"
cd functions
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

cd ..

# Deploy functions
echo ""
echo -e "${YELLOW}🔥 Deploying to Firebase...${NC}"
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Functions deployed successfully!${NC}"
    echo ""
    echo "📋 Available Functions:"
    echo "  - extractPDFContent (callable)"
    echo "  - getExtractionTypes (callable)"
    echo "  - getExtractionHistory (callable)"
    echo "  - testExtraction (HTTP)"
    echo ""
    echo "🔍 View logs with: firebase functions:log"
    echo "📊 Monitor at: https://console.firebase.google.com/project/peakflow-3a2ed/functions"
else
    echo ""
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo "Check the error messages above and try again"
    exit 1
fi