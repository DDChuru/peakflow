const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require(path.join(process.cwd(), 'scripts/service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkLedgerDates() {
  const companyId = 'Na1KU0ogKFLJ5cUzrMrU';
  const bankAccountId = 'bankAccount-savings';

  console.log('=== CHECKING LEDGER ENTRY DATES ===\n');

  const snapshot = await db.collection(`companies/${companyId}/ledgerEntries`)
    .where('bankAccountId', '==', bankAccountId)
    .get();

  console.log(`Found ${snapshot.size} entries with bankAccountId: ${bankAccountId}\n`);

  snapshot.docs.forEach(doc => {
    const data = doc.data();
    console.log(`Entry: ${doc.id}`);
    console.log(`  transactionDate raw: ${JSON.stringify(data.transactionDate)}`);

    if (data.transactionDate && data.transactionDate.toDate) {
      const date = data.transactionDate.toDate();
      console.log(`  transactionDate as Date: ${date}`);
      console.log(`  Year: ${date.getFullYear()}`);
      console.log(`  Month: ${date.getMonth() + 1}`);
      console.log(`  Day: ${date.getDate()}`);
    }
    console.log('');
  });

  console.log('\n=== TESTING DATE RANGE QUERIES ===\n');

  // Test with 2025 dates
  const start2025 = new Date('2025-09-01');
  const end2025 = new Date('2025-09-20');

  console.log(`Testing range: ${start2025} to ${end2025}`);

  const query2025 = await db.collection(`companies/${companyId}/ledgerEntries`)
    .where('bankAccountId', '==', bankAccountId)
    .where('transactionDate', '>=', start2025)
    .where('transactionDate', '<=', end2025)
    .orderBy('transactionDate', 'desc')
    .get();

  console.log(`Found ${query2025.size} entries in Sept 2025 range\n`);

  // Test with 2024 dates (in case they're in 2024)
  const start2024 = new Date('2024-09-01');
  const end2024 = new Date('2024-09-20');

  console.log(`Testing range: ${start2024} to ${end2024}`);

  const query2024 = await db.collection(`companies/${companyId}/ledgerEntries`)
    .where('bankAccountId', '==', bankAccountId)
    .where('transactionDate', '>=', start2024)
    .where('transactionDate', '<=', end2024)
    .orderBy('transactionDate', 'desc')
    .get();

  console.log(`Found ${query2024.size} entries in Sept 2024 range`);
}

checkLedgerDates().catch(console.error);