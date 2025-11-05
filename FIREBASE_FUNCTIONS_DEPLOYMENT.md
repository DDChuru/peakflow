# Firebase Functions Deployment Guide for PDF Extraction

## Overview

This guide explains how to deploy the Gemini-powered PDF extraction Cloud Functions to Firebase.

## Prerequisites

- Firebase CLI installed and configured
- Firebase project created (peakflow-3a2ed)
- Node.js 18+ installed
- Gemini API key

## Project Structure

```
peakflow/
├── functions/
│   ├── index.js           # Cloud Functions code
│   ├── package.json       # Dependencies
│   ├── .env              # Environment variables (local)
│   └── .gitignore        # Git ignore file
├── firebase.json         # Firebase configuration
└── firestore.rules      # Security rules
```

## Available Functions

1. **extractPDFContent** - Main PDF extraction function
   - Accepts: `pdfBase64`, `documentType`, `saveToFirestore`
   - Returns: Extracted data in JSON format

2. **getExtractionTypes** - Get available document types
   - Returns: List of supported document types

3. **getExtractionHistory** - Get user's extraction history
   - Accepts: `limit` (optional)
   - Returns: List of previous extractions

4. **testExtraction** - HTTP endpoint for testing

## Deployment Steps

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Set Environment Variables

The Gemini API key is already configured in `.env`:
```
GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```

### 3. Deploy Functions

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:extractPDFContent
```

### 4. Verify Deployment

After deployment, you'll see URLs for your functions:
```
Function URL (extractPDFContent): https://us-central1-peakflow-3a2ed.cloudfunctions.net/extractPDFContent
Function URL (testExtraction): https://us-central1-peakflow-3a2ed.cloudfunctions.net/testExtraction
```

Test the deployment:
```bash
curl https://us-central1-peakflow-3a2ed.cloudfunctions.net/testExtraction
```

## Using the Functions

### From Frontend (Next.js)

```javascript
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const extractPDF = httpsCallable(functions, 'extractPDFContent');

// Call the function
const result = await extractPDF({
  pdfBase64: base64Data,
  documentType: 'invoice',
  saveToFirestore: true
});
```

### Document Types Supported

- `audit` - Audit reports with scores and tables
- `invoice` - Invoices with line items and totals
- `bankStatement` - Bank statements with transactions
- `contract` - Legal contracts with terms
- `generic` - Any PDF document

## Security

- Functions require authentication (Firebase Auth)
- Each extraction is tracked per user
- API key is stored securely in environment variables
- Firestore rules restrict access to user's own data

## Monitoring

### View Logs
```bash
firebase functions:log
```

### View specific function logs
```bash
firebase functions:log --only extractPDFContent
```

### Firebase Console
Monitor functions at: https://console.firebase.google.com/project/peakflow-3a2ed/functions

## Costs

- **Firebase Functions**:
  - First 2M invocations free
  - $0.40 per million invocations after
  - Memory: 1GB allocated per function

- **Gemini API**:
  - Free tier: 60 requests per minute
  - Paid tier: Based on usage

- **Firestore**:
  - Free tier: 50K reads, 20K writes per day
  - Storage: 1GB free

## Troubleshooting

### Function timeout
- Current timeout: 120 seconds
- Increase in `index.js` if needed:
```javascript
.runWith({
  memory: '1GB',
  timeoutSeconds: 240,  // Increase to 4 minutes
})
```

### API Key Issues
1. Check environment variable:
```bash
firebase functions:config:get
```

2. Update if needed:
```bash
firebase functions:config:set gemini.api_key="YOUR_KEY"
firebase deploy --only functions
```

### Memory Issues
Increase memory allocation:
```javascript
.runWith({
  memory: '2GB',  // Increase to 2GB
  timeoutSeconds: 120,
})
```

## Local Testing

Run functions locally:
```bash
cd functions
npm run serve
```

This starts the Firebase emulator at http://localhost:5001

## Best Practices

1. **Error Handling**: All functions include comprehensive error handling
2. **Logging**: Use `functions.logger` for debugging
3. **Authentication**: Always verify `context.auth`
4. **Rate Limiting**: Consider implementing rate limits for production
5. **Monitoring**: Set up alerts for function errors

## Support

- Firebase Support: https://firebase.google.com/support
- Gemini API Docs: https://ai.google.dev/docs
- Function Logs: `firebase functions:log`