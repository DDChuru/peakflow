#!/usr/bin/env node

/**
 * Create config/apis document in Firestore with Gemini API key
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Try to find service account file
const possiblePaths = [
  path.join(__dirname, 'service-account.json'),
  path.join(__dirname, '..', 'service-account.json'),
  path.join(process.cwd(), 'service-account.json')
];

let serviceAccountPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccountPath = p;
    break;
  }
}

if (!serviceAccountPath) {
  console.error('❌ service-account.json not found!');
  console.error('\nPlease download it from:');
  console.error('https://console.firebase.google.com/project/peakflow-3a2ed/settings/serviceaccounts/adminsdk');
  console.error('\nSave it as: ./scripts/service-account.json or ./service-account.json');
  process.exit(1);
}

console.log('✅ Found service account:', serviceAccountPath);

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'peakflow-3a2ed'
});

const db = admin.firestore();

async function createConfigDocument() {
  console.log('\n🔑 Creating Firebase config/apis document...\n');

  const NEW_API_KEY = 'AIzaSyCZspkBlOGAM6oiSsMKGKJP-b73YPExzE0';

  try {
    // Check if document already exists
    const docRef = db.collection('config').doc('apis');
    const doc = await docRef.get();

    if (doc.exists) {
      console.log('⚠️  Document already exists!');
      console.log('Current data:', doc.data());
      console.log('\nUpdating with new API key...');
    } else {
      console.log('📝 Creating new document...');
    }

    // Create/update the document
    await docRef.set({
      geminiApiKey: NEW_API_KEY,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: 'create-firebase-config.js',
      description: 'API keys for external services (Gemini AI for PDF extraction)'
    }, { merge: true });

    console.log('\n✅ SUCCESS! config/apis document created/updated!\n');
    console.log('📋 Details:');
    console.log('   Collection: config');
    console.log('   Document: apis');
    console.log('   Field: geminiApiKey');
    console.log('   Value: AIzaSyCZspk... (new key set)');
    console.log('\n🎯 Next step: Upload a bank statement to test!');
    console.log('   The Firebase Function will now use this new API key.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

createConfigDocument();
