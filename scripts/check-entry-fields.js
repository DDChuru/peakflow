#!/usr/bin/env node

/**
 * Check actual fields in journal and ledger entries
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '../service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function checkFields() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 Checking Entry Fields                                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check journal entry fields
  console.log('--- Sample Journal Entry ---\n');
  const journalSnapshot = await db.collection('journal_entries').limit(1).get();
  if (!journalSnapshot.empty) {
    const doc = journalSnapshot.docs[0];
    const data = doc.data();
    console.log('All fields:', Object.keys(data));
    console.log('\nFull document:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Check GL entry fields
  console.log('\n--- Sample General Ledger Entry ---\n');
  const glSnapshot = await db.collection('general_ledger').limit(1).get();
  if (!glSnapshot.empty) {
    const doc = glSnapshot.docs[0];
    const data = doc.data();
    console.log('All fields:', Object.keys(data));
    console.log('\nFull document:');
    console.log(JSON.stringify(data, null, 2));
  }

  // Count total entries
  console.log('\n--- Total Counts ---\n');
  const totalJournal = (await db.collection('journal_entries').count().get()).data().count;
  const totalGL = (await db.collection('general_ledger').count().get()).data().count;
  console.log(`Total journal_entries: ${totalJournal}`);
  console.log(`Total general_ledger: ${totalGL}`);

  console.log('\n');
}

checkFields().catch(console.error);
