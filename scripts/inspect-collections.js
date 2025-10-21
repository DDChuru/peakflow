#!/usr/bin/env node

/**
 * Inspect the structure of collections
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

async function inspectCollections(companyId, companyName) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  🔍 Inspecting Collections for: ${companyName.padEnd(28)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Company ID:', companyId);
  console.log('\n--- Checking ROOT level collections ---\n');

  // Check root-level journal_entries with companyId
  console.log('1. journal_entries (root, filtered by companyId):');
  const rootJournalSnapshot = await db.collection('journal_entries')
    .where('companyId', '==', companyId)
    .limit(3)
    .get();
  console.log(`   Count (first 3): ${rootJournalSnapshot.size}`);
  if (!rootJournalSnapshot.empty) {
    const sample = rootJournalSnapshot.docs[0].data();
    console.log(`   Sample fields:`, Object.keys(sample).slice(0, 10).join(', '));
    console.log(`   CompanyId in doc:`, sample.companyId);
  }

  // Check root-level general_ledger with companyId
  console.log('\n2. general_ledger (root, filtered by companyId):');
  const rootGLSnapshot = await db.collection('general_ledger')
    .where('companyId', '==', companyId)
    .limit(3)
    .get();
  console.log(`   Count (first 3): ${rootGLSnapshot.size}`);
  if (!rootGLSnapshot.empty) {
    const sample = rootGLSnapshot.docs[0].data();
    console.log(`   Sample fields:`, Object.keys(sample).slice(0, 10).join(', '));
    console.log(`   CompanyId in doc:`, sample.companyId);
  }

  console.log('\n--- Checking COMPANY-SCOPED collections ---\n');

  // Check company-scoped journal_entries
  console.log('3. companies/{companyId}/journal_entries:');
  const scopedJournalSnapshot = await db.collection('companies')
    .doc(companyId)
    .collection('journal_entries')
    .limit(3)
    .get();
  console.log(`   Count (first 3): ${scopedJournalSnapshot.size}`);
  if (!scopedJournalSnapshot.empty) {
    const sample = scopedJournalSnapshot.docs[0].data();
    console.log(`   Sample fields:`, Object.keys(sample).slice(0, 10).join(', '));
  }

  // Check company-scoped general_ledger
  console.log('\n4. companies/{companyId}/general_ledger:');
  const scopedGLSnapshot = await db.collection('companies')
    .doc(companyId)
    .collection('general_ledger')
    .limit(3)
    .get();
  console.log(`   Count (first 3): ${scopedGLSnapshot.size}`);
  if (!scopedGLSnapshot.empty) {
    const sample = scopedGLSnapshot.docs[0].data();
    console.log(`   Sample fields:`, Object.keys(sample).slice(0, 10).join(', '));
  }

  console.log('\n--- Total Counts ---\n');

  // Get total counts
  const totalRootJournal = (await db.collection('journal_entries')
    .where('companyId', '==', companyId)
    .count()
    .get()).data().count;
  console.log(`Root journal_entries: ${totalRootJournal}`);

  const totalRootGL = (await db.collection('general_ledger')
    .where('companyId', '==', companyId)
    .count()
    .get()).data().count;
  console.log(`Root general_ledger: ${totalRootGL}`);

  const totalScopedJournal = (await db.collection('companies')
    .doc(companyId)
    .collection('journal_entries')
    .count()
    .get()).data().count;
  console.log(`Company-scoped journal_entries: ${totalScopedJournal}`);

  const totalScopedGL = (await db.collection('companies')
    .doc(companyId)
    .collection('general_ledger')
    .count()
    .get()).data().count;
  console.log(`Company-scoped general_ledger: ${totalScopedGL}`);

  console.log('\n');
}

async function main() {
  const companyName = process.argv[2] || 'Orlicron';

  // Find company
  const companiesSnapshot = await db.collection('companies')
    .where('name', '==', companyName)
    .limit(1)
    .get();

  if (companiesSnapshot.empty) {
    console.log(`❌ Company "${companyName}" not found`);
    process.exit(1);
  }

  const companyDoc = companiesSnapshot.docs[0];
  await inspectCollections(companyDoc.id, companyDoc.data().name);
}

main().catch(console.error);
