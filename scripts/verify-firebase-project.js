#!/usr/bin/env node

/**
 * Verify Firebase project and show sample data
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

async function verifyProject() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 Firebase Project Verification                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('Project ID:', serviceAccount.project_id);
  console.log('Client Email:', serviceAccount.client_email);
  console.log('\n--- Checking for ANY journal entries ---\n');

  // Get any journal entries (root level)
  const rootJournalAll = await db.collection('journal_entries')
    .limit(5)
    .get();
  console.log(`Total journal_entries at root (first 5): ${rootJournalAll.size}`);

  if (!rootJournalAll.empty) {
    rootJournalAll.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`\n  ${idx + 1}. ID: ${doc.id}`);
      console.log(`     CompanyId: ${data.companyId || 'N/A'}`);
      console.log(`     Date: ${data.date || 'N/A'}`);
      console.log(`     Reference: ${data.reference || 'N/A'}`);
      console.log(`     Description: ${data.description || 'N/A'}`);
    });
  } else {
    console.log('   ❌ No journal entries found at root level');
  }

  // Check general ledger
  console.log('\n--- Checking for ANY general ledger entries ---\n');
  const rootGLAll = await db.collection('general_ledger')
    .limit(5)
    .get();
  console.log(`Total general_ledger at root (first 5): ${rootGLAll.size}`);

  if (!rootGLAll.empty) {
    rootGLAll.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`\n  ${idx + 1}. ID: ${doc.id}`);
      console.log(`     CompanyId: ${data.companyId || 'N/A'}`);
      console.log(`     Account: ${data.accountCode || 'N/A'} - ${data.accountName || 'N/A'}`);
      console.log(`     Amount: ${data.amount || 0}`);
    });
  } else {
    console.log('   ❌ No general ledger entries found at root level');
  }

  // List all root collections
  console.log('\n--- Available root collections ---\n');
  const collections = await db.listCollections();
  collections.forEach(col => {
    console.log(`  - ${col.id}`);
  });

  console.log('\n');
}

verifyProject().catch(console.error);
