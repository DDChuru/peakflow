#!/usr/bin/env node

/**
 * Update Gemini API key in Firebase Firestore config/apis document
 * This is used as a fallback by Firebase Functions
 */

const admin = require('firebase-admin');
const readline = require('readline');

// Initialize Firebase Admin
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'peakflow-3a2ed'
});

const db = admin.firestore();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔑 Firebase Gemini API Key Updater');
console.log('=====================================\n');

rl.question('Enter your NEW Gemini API key: ', async (newApiKey) => {
  if (!newApiKey || !newApiKey.startsWith('AIza')) {
    console.error('❌ Invalid API key format. Should start with "AIza"');
    process.exit(1);
  }

  try {
    console.log('\n📝 Updating Firestore config/apis document...');

    await db.collection('config').doc('apis').set({
      geminiApiKey: newApiKey,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: 'update-firebase-gemini-key.js'
    }, { merge: true });

    console.log('✅ API key updated successfully in Firestore!');
    console.log('\n📋 Next steps:');
    console.log('1. The Firebase Functions will now use this new key');
    console.log('2. Test by uploading a bank statement');
    console.log('3. Optional: Set as environment variable for better security');
    console.log('   firebase functions:secrets:set GEMINI_API_KEY');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating API key:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
});
