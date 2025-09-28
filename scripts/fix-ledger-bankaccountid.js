const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require(path.join(process.cwd(), 'scripts/service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixLedgerBankAccountIds() {
  const companyId = 'Na1KU0ogKFLJ5cUzrMrU';

  console.log('=== FIXING LEDGER ENTRIES BANK ACCOUNT IDS ===\n');

  // Get all ledger entries
  const ledgerSnap = await db.collection(`companies/${companyId}/ledgerEntries`).get();

  if (ledgerSnap.empty) {
    console.log('❌ No ledger entries found');
    return;
  }

  console.log(`Found ${ledgerSnap.size} ledger entries to fix\n`);

  const batch = db.batch();
  let updateCount = 0;

  for (const doc of ledgerSnap.docs) {
    const data = doc.data();

    // If accountId exists but bankAccountId doesn't, copy accountId to bankAccountId
    if (data.accountId && !data.bankAccountId) {
      batch.update(doc.ref, {
        bankAccountId: data.accountId
      });
      updateCount++;

      console.log(`Updating ${doc.id}:`);
      console.log(`  accountId: ${data.accountId}`);
      console.log(`  Setting bankAccountId: ${data.accountId}`);
    }
  }

  if (updateCount > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully updated ${updateCount} ledger entries with bankAccountId`);
  } else {
    console.log('\n✅ All ledger entries already have bankAccountId');
  }
}

fixLedgerBankAccountIds().catch(console.error);