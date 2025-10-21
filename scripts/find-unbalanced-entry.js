#!/usr/bin/env node

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '../service-account.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

const db = admin.firestore();

async function findUnbalancedEntry(companyId) {
  const journalSnapshot = await db.collection('journal_entries')
    .where('tenantId', '==', companyId)
    .get();

  console.log('\n🔍 Searching for unbalanced journal entry...\n');

  journalSnapshot.docs.forEach((doc) => {
    const entry = doc.data();

    if (entry.lines && entry.lines.length > 0) {
      let totalDebits = 0;
      let totalCredits = 0;

      entry.lines.forEach(line => {
        totalDebits += line.debit || 0;
        totalCredits += line.credit || 0;
      });

      const diff = Math.abs(totalDebits - totalCredits);

      if (diff > 0.01) {
        console.log('❌ UNBALANCED ENTRY FOUND:\n');
        console.log(`ID: ${doc.id}`);
        console.log(`Reference: ${entry.reference}`);
        console.log(`Description: ${entry.description}`);
        console.log(`Status: ${entry.status}`);
        console.log(`\nLines (${entry.lines.length}):`);

        entry.lines.forEach((line, idx) => {
          console.log(`\n  Line ${idx + 1}:`);
          console.log(`    Account: ${line.accountCode} - ${line.accountName}`);
          console.log(`    Debit: ${line.debit || 0}`);
          console.log(`    Credit: ${line.credit || 0}`);
          console.log(`    Description: ${line.description || 'N/A'}`);
        });

        console.log(`\n  Total Debits: ${totalDebits}`);
        console.log(`  Total Credits: ${totalCredits}`);
        console.log(`  Difference: ${diff}`);
        console.log('\n');
      }
    }
  });
}

async function main() {
  const companyId = 'Na1KU0ogKFLJ5cUzrMrU'; // Orlicron
  await findUnbalancedEntry(companyId);
}

main().catch(console.error);
