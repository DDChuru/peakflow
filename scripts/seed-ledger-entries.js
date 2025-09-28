#!/usr/bin/env node

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'scripts/service-account.json';
const serviceAccount = require(path.isAbsolute(serviceAccountPath) ? serviceAccountPath : path.join(process.cwd(), serviceAccountPath));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const [companyId, accountId, accountCode = '1000', currency = 'USD'] = process.argv.slice(2);

if (!companyId || !accountId) {
  console.error('Usage: node scripts/seed-ledger-entries.js <companyId> <accountId> [accountCode] [currency]');
  process.exit(1);
}

const entries = [
  {
    journalEntryId: `JE-${Date.now()}-01`,
    journalLineId: `JL-${Date.now()}-01`,
    description: 'Client payment',
    transactionDate: new Date('2025-09-01T09:30:00Z'),
    postingDate: new Date('2025-09-01T09:30:00Z'),
    debit: 7500,
    credit: 0,
    source: 'auto-receipt',
  },
  {
    journalEntryId: `JE-${Date.now()}-02`,
    journalLineId: `JL-${Date.now()}-02`,
    description: 'Payroll run',
    transactionDate: new Date('2025-09-03T15:00:00Z'),
    postingDate: new Date('2025-09-03T15:00:00Z'),
    debit: 0,
    credit: 4200,
    source: 'payroll',
  },
  {
    journalEntryId: `JE-${Date.now()}-03`,
    journalLineId: `JL-${Date.now()}-03`,
    description: 'Software subscription',
    transactionDate: new Date('2025-09-05T08:15:00Z'),
    postingDate: new Date('2025-09-05T08:15:00Z'),
    debit: 0,
    credit: 350,
    source: 'expense',
  },
];

(async () => {
  try {
    const collectionRef = db.collection(`companies/${companyId}/ledgerEntries`);
    const batch = db.batch();

    let runningBalance = 0;
    entries.forEach((entry, index) => {
      runningBalance += entry.debit - entry.credit;
      const docRef = collectionRef.doc();
      batch.set(docRef, {
        tenantId: companyId,
        journalEntryId: entry.journalEntryId,
        journalLineId: entry.journalLineId,
        accountId,
        accountCode,
        debit: entry.debit,
        credit: entry.credit,
        cumulativeBalance: runningBalance,
        currency,
        transactionDate: admin.firestore.Timestamp.fromDate(entry.transactionDate),
        postingDate: admin.firestore.Timestamp.fromDate(entry.postingDate),
        fiscalPeriodId: `${entry.transactionDate.getUTCFullYear()}-${String(entry.transactionDate.getUTCMonth() + 1).padStart(2, '0')}`,
        source: entry.source,
        metadata: {
          memo: entry.description,
          seeded: true,
        },
        createdAt: admin.firestore.Timestamp.now(),
      });
    });

    await batch.commit();
    console.log(`Seeded ${entries.length} ledger entries for company ${companyId} / account ${accountId}`);
  } catch (error) {
    console.error('Failed to seed ledger entries:', error);
    process.exit(1);
  }
})();
