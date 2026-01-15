#!/usr/bin/env node

/**
 * Check ALL places where API keys might be stored
 */

const admin = require('firebase-admin');
const serviceAccount = require('../service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'peakflow-3a2ed'
});

const db = admin.firestore();

async function checkAllKeys() {
  console.log('🔍 Checking ALL API key locations...\n');

  // Check 1: Firestore config/apis
  console.log('1️⃣  Checking Firestore: config/apis document');
  try {
    const configDoc = await db.collection('config').doc('apis').get();
    if (configDoc.exists) {
      const data = configDoc.data();
      const key = data.geminiApiKey || 'NOT SET';
      console.log('   ✅ Document exists');
      console.log('   📋 geminiApiKey:', key.substring(0, 30) + '...');
      console.log('   🔍 Full key:', key);

      // Check if it's the blocked key
      if (key.includes('AIzaSyC') && !key.includes('AIzaSyCZspkBlOGAM6o')) {
        console.log('   ⚠️  WARNING: This looks like an OLD key!');
      } else if (key.includes('AIzaSyCZspkBlOGAM6o')) {
        console.log('   ✅ This is the NEW key!');
      }
    } else {
      console.log('   ❌ Document does NOT exist');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n2️⃣  Checking for other config documents');
  try {
    const configCollection = await db.collection('config').listDocuments();
    console.log('   📁 Documents in config collection:');
    for (const docRef of configCollection) {
      const doc = await docRef.get();
      if (doc.exists) {
        console.log(`      - ${docRef.id}:`, Object.keys(doc.data()));
      }
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
  }

  console.log('\n3️⃣  Checking environment variables (process.env)');
  console.log('   GEMINI_API_KEY:', process.env.GEMINI_API_KEY || 'NOT SET');
  console.log('   NEXT_PUBLIC_GEMINI_API_KEY:', process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'NOT SET');

  console.log('\n4️⃣  Checking .env.local file');
  const fs = require('fs');
  const path = require('path');
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const geminiLines = envContent.split('\n').filter(line => line.includes('GEMINI'));
    console.log('   📄 .env.local GEMINI keys:');
    geminiLines.forEach(line => {
      console.log('      ', line);
    });
  } else {
    console.log('   ⚠️  .env.local not found');
  }

  console.log('\n✅ Check complete!\n');
  process.exit(0);
}

checkAllKeys();
