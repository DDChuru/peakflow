/**
 * Verify Reset - Check if journal entries and ledger entries were deleted
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!serviceAccountPath) {
    console.error('❌ FIREBASE_SERVICE_ACCOUNT_PATH not found in .env.local');
    process.exit(1);
  }

  const absolutePath = path.resolve(__dirname, '..', serviceAccountPath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`❌ Service account file not found at: ${absolutePath}`);
    process.exit(1);
  }

  const serviceAccount = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();

async function verifyReset() {
  console.log('🔍 Verifying reset status...\n');

  // Check journal entries
  const journalSnapshot = await db.collection('journal_entries').get();
  console.log(`📝 Journal Entries: ${journalSnapshot.size}`);
  if (journalSnapshot.size > 0) {
    console.log('   ⚠️  Found journal entries (should be 0):');
    journalSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`      - ${doc.id}: ${data.reference || 'N/A'}`);
    });
  } else {
    console.log('   ✅ No journal entries (correct)');
  }

  // Check ledger entries
  const ledgerSnapshot = await db.collection('general_ledger').get();
  console.log(`\n📊 Ledger Entries: ${ledgerSnapshot.size}`);
  if (ledgerSnapshot.size > 0) {
    console.log('   ⚠️  Found ledger entries (should be 0):');
    ledgerSnapshot.docs.slice(0, 5).forEach(doc => {
      const data = doc.data();
      console.log(`      - ${doc.id}: ${data.accountCode || 'N/A'}`);
    });
    if (ledgerSnapshot.size > 5) {
      console.log(`      ... and ${ledgerSnapshot.size - 5} more`);
    }
  } else {
    console.log('   ✅ No ledger entries (correct)');
  }

  // Check invoices (check first company)
  const companiesSnapshot = await db.collection('companies').limit(1).get();

  if (companiesSnapshot.empty) {
    console.log('\n🏢 No companies found');
  } else {
    const companyId = companiesSnapshot.docs[0].id;
    const invoicesSnapshot = await db.collection(`companies/${companyId}/invoices`).get();

    console.log(`\n🧾 Invoices (Company: ${companyId}): ${invoicesSnapshot.size}`);

    let postedCount = 0;
    invoicesSnapshot.docs.forEach(doc => {
      const invoice = doc.data();
      if (invoice.journalEntryId || invoice.postedDate) {
        postedCount++;
        console.log(`   ⚠️  Invoice ${invoice.invoiceNumber} still shows as posted:`);
        if (invoice.journalEntryId) console.log(`      - journalEntryId: ${invoice.journalEntryId}`);
        if (invoice.postedDate) console.log(`      - postedDate: ${invoice.postedDate}`);
      }
    });

    if (postedCount === 0) {
      console.log('   ✅ No invoices marked as posted (correct)');
    }
  }

  console.log('\n' + '='.repeat(60));
}

verifyReset()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
