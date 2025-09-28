const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require(path.join(process.cwd(), 'scripts/service-account.json'));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function debugReconciliation() {
  const companyId = 'Na1KU0ogKFLJ5cUzrMrU';

  console.log('=== DEBUGGING RECONCILIATION DATA ===\n');

  // 1. Check reconciliation sessions
  console.log('1. RECONCILIATION SESSIONS:');
  console.log('-'.repeat(50));

  const sessionsSnap = await db.collection(`companies/${companyId}/reconciliations`)
    .orderBy('createdAt', 'desc')
    .limit(3)
    .get();

  if (sessionsSnap.empty) {
    console.log('❌ No reconciliation sessions found\n');
  } else {
    for (const doc of sessionsSnap.docs) {
      const data = doc.data();
      console.log(`Session ID: ${doc.id}`);
      console.log(`  Bank Account ID: ${data.bankAccountId}`);
      console.log(`  Bank Account Name: ${data.bankAccountName}`);
      console.log(`  Period: ${data.periodStart} to ${data.periodEnd}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Created: ${data.createdAt?.toDate?.()}`);
      console.log('');
    }
  }

  // 2. Check ledger entries and their bankAccountId
  console.log('2. LEDGER ENTRIES:');
  console.log('-'.repeat(50));

  const ledgerSnap = await db.collection(`companies/${companyId}/ledgerEntries`)
    .limit(10)
    .get();

  if (ledgerSnap.empty) {
    console.log('❌ No ledger entries found\n');
  } else {
    // Count by bankAccountId
    const bankAccountCounts = {};
    const sampleEntries = [];

    ledgerSnap.docs.forEach(doc => {
      const data = doc.data();
      const bankAccId = data.bankAccountId || 'NO_BANK_ACCOUNT';
      bankAccountCounts[bankAccId] = (bankAccountCounts[bankAccId] || 0) + 1;

      if (sampleEntries.length < 3) {
        sampleEntries.push({
          id: doc.id,
          bankAccountId: data.bankAccountId,
          accountId: data.accountId,
          transactionDate: data.transactionDate,
          debit: data.debit,
          credit: data.credit,
          metadata: data.metadata
        });
      }
    });

    console.log('Bank Account Distribution:');
    Object.entries(bankAccountCounts).forEach(([bankAccId, count]) => {
      console.log(`  ${bankAccId}: ${count} entries`);
    });
    console.log('');

    console.log('Sample Entries:');
    sampleEntries.forEach(entry => {
      console.log(`  Entry ID: ${entry.id}`);
      console.log(`    bankAccountId: ${entry.bankAccountId}`);
      console.log(`    accountId: ${entry.accountId}`);
      console.log(`    transactionDate: ${entry.transactionDate}`);
      console.log(`    debit/credit: ${entry.debit}/${entry.credit}`);
      console.log(`    metadata.glAccountId: ${entry.metadata?.glAccountId}`);
      console.log('');
    });
  }

  // 3. Test the actual query that reconciliation service uses
  console.log('3. TESTING RECONCILIATION QUERY:');
  console.log('-'.repeat(50));

  // Get the most recent session's bankAccountId
  if (!sessionsSnap.empty) {
    const latestSession = sessionsSnap.docs[0].data();
    const bankAccountId = latestSession.bankAccountId;
    const periodStart = new Date(latestSession.periodStart);
    const periodEnd = new Date(latestSession.periodEnd);

    console.log(`Testing query with:`);
    console.log(`  bankAccountId: ${bankAccountId}`);
    console.log(`  periodStart: ${periodStart}`);
    console.log(`  periodEnd: ${periodEnd}`);
    console.log('');

    // Test the exact query from reconciliation service
    const testQuery = db.collection(`companies/${companyId}/ledgerEntries`)
      .where('bankAccountId', '==', bankAccountId)
      .where('transactionDate', '>=', periodStart)
      .where('transactionDate', '<=', periodEnd)
      .orderBy('transactionDate', 'desc')
      .limit(200);

    const testSnap = await testQuery.get();

    console.log(`Query Results: ${testSnap.size} entries found`);

    if (testSnap.size > 0) {
      console.log('✅ Query successful! First 3 entries:');
      testSnap.docs.slice(0, 3).forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.transactionDate?.toDate?.() || data.transactionDate}`);
      });
    } else {
      console.log('❌ No entries match the query criteria');

      // Debug: Check without date filter
      const withoutDateQuery = await db.collection(`companies/${companyId}/ledgerEntries`)
        .where('bankAccountId', '==', bankAccountId)
        .limit(5)
        .get();

      console.log(`\n  Without date filter: ${withoutDateQuery.size} entries found`);

      // Debug: Check all unique bankAccountIds
      const allEntriesSnap = await db.collection(`companies/${companyId}/ledgerEntries`)
        .limit(100)
        .get();

      const uniqueBankAccounts = new Set();
      allEntriesSnap.docs.forEach(doc => {
        const bankAccId = doc.data().bankAccountId;
        if (bankAccId) uniqueBankAccounts.add(bankAccId);
      });

      console.log(`\n  All unique bankAccountIds in ledger entries:`);
      Array.from(uniqueBankAccounts).forEach(id => {
        console.log(`    - ${id}`);
      });
    }
  }

  console.log('\n=== END DEBUG ===');
}

debugReconciliation().catch(console.error);