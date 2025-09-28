#!/usr/bin/env node

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'scripts/service-account.json';
const resolvedPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.join(process.cwd(), serviceAccountPath);

const serviceAccount = require(resolvedPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const [companyId] = process.argv.slice(2);

if (!companyId) {
  console.error('Usage: node scripts/list-ledger-entries.js <companyId>');
  process.exit(1);
}

(async () => {
  try {
    const snapshot = await db
      .collection(`companies/${companyId}/ledgerEntries`)
      .orderBy('transactionDate', 'asc')
      .get();

    if (snapshot.empty) {
      console.log('No ledger entries found.');
      return;
    }

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const txDate = data.transactionDate?.toDate?.() ?? data.transactionDate;
      const postingDate = data.postingDate?.toDate?.() ?? data.postingDate;
      console.log({
        id: doc.id,
        accountId: data.accountId,
        accountCode: data.accountCode,
        debit: data.debit,
        credit: data.credit,
        transactionDate: txDate,
        postingDate,
        fiscalPeriodId: data.fiscalPeriodId,
        metadata: data.metadata,
      });
    });
  } catch (error) {
    console.error('Failed to list ledger entries:', error);
    process.exit(1);
  }
})();
