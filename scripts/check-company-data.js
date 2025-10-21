#!/usr/bin/env node

/**
 * Check all data for a specific company
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

async function checkCompanyData(companyId, companyName) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log(`║  📊 Data Check: ${companyName.padEnd(42)} ║`);
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Check journal entries
  const journalCount = (await db.collection('journal_entries')
    .where('companyId', '==', companyId)
    .get()).size;
  console.log(`   📝 Journal Entries: ${journalCount}`);

  // Check general ledger
  const glCount = (await db.collection('general_ledger')
    .where('companyId', '==', companyId)
    .get()).size;
  console.log(`   📒 General Ledger Entries: ${glCount}`);

  // Check bank statements
  const bankStatementsCount = (await db.collection('bank_statements')
    .where('companyId', '==', companyId)
    .get()).size;
  console.log(`   🏦 Bank Statements: ${bankStatementsCount}`);

  // Check bank import sessions
  const sessionsCount = (await db.collection('companies')
    .doc(companyId)
    .collection('bankImportSessions')
    .get()).size;
  console.log(`   📥 Bank Import Sessions: ${sessionsCount}`);

  // Check GL mapping rules
  const rulesCount = (await db.collection('companies')
    .doc(companyId)
    .collection('glMappingRules')
    .get()).size;
  console.log(`   🗂️  GL Mapping Rules: ${rulesCount}`);

  // Check invoices
  const invoicesCount = (await db.collection('companies')
    .doc(companyId)
    .collection('invoices')
    .get()).size;
  console.log(`   📄 Invoices: ${invoicesCount}`);

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
  await checkCompanyData(companyDoc.id, companyDoc.data().name);
}

main().catch(console.error);
