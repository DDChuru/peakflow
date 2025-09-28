#!/usr/bin/env node

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'scripts/service-account.json';
const resolvedPath = path.isAbsolute(serviceAccountPath)
  ? serviceAccountPath
  : path.join(process.cwd(), serviceAccountPath);

try {
  require.resolve(resolvedPath);
} catch (error) {
  console.error(`Service account file not found at ${resolvedPath}`);
  process.exit(1);
}

const serviceAccount = require(resolvedPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const [companyId, startArg, endArg, bankAccountIdArg] = process.argv.slice(2);

if (!companyId) {
  console.error('Usage: node scripts/update-ledger-entry-dates.js <companyId> [startISO] [endISO] [bankAccountId]');
  console.error('Example: node scripts/update-ledger-entry-dates.js Na1KU0ogKFLJ5cUzrMrU 2025-09-01 2025-09-20 bankAccount-operating');
  process.exit(1);
}

const DEFAULT_START = '2025-09-01';
const DEFAULT_END = '2025-09-20';

const targetBankAccountId = bankAccountIdArg || null;

const startDate = new Date(`${startArg || DEFAULT_START}T00:00:00Z`);
const endDate = new Date(`${endArg || DEFAULT_END}T23:59:59Z`);

if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
  console.error('Invalid start or end date. Use YYYY-MM-DD format.');
  process.exit(1);
}

if (startDate > endDate) {
  console.error('Start date must be before end date.');
  process.exit(1);
}

const dayMs = 24 * 60 * 60 * 1000;
const totalDaysInclusive = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / dayMs));

(async () => {
  try {
    const collectionRef = db.collection(`companies/${companyId}/ledgerEntries`);
    const snapshot = await collectionRef.orderBy('transactionDate', 'asc').get();

    if (snapshot.empty) {
      console.log(`No ledger entries found for company ${companyId}.`);
      process.exit(0);
    }

    const docs = snapshot.docs;
    const updates = [];

    docs.forEach((docSnap, index) => {
      const dayOffset = totalDaysInclusive === 0
        ? 0
        : index % (totalDaysInclusive + 1);

      const baseDateMs = startDate.getTime() + dayOffset * dayMs;
      const date = new Date(baseDateMs);

      // Stagger posting times across the day so timestamps stay unique
      const hour = 9 + (index % 8);
      const minute = (index * 11) % 60;
      date.setUTCHours(hour, minute, 0, 0);

      const fiscalPeriodId = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

      const metadataUpdates = {
        'metadata.adjustedForReconciliation': true,
      };

      const data = {
        transactionDate: admin.firestore.Timestamp.fromDate(date),
        postingDate: admin.firestore.Timestamp.fromDate(date),
        fiscalPeriodId,
        updatedAt: admin.firestore.Timestamp.now(),
      };

      if (targetBankAccountId) {
        const docData = docSnap.data();
        const existingMetadata = docData.metadata || {};
        if (docData.accountId && docData.accountId !== targetBankAccountId) {
          metadataUpdates['metadata.glAccountId'] = docData.accountId;
        }
        data.accountId = targetBankAccountId;
      }

      updates.push({
        ref: docSnap.ref,
        data: {
          ...data,
          ...metadataUpdates,
        },
      });
    });

    const batch = db.batch();
    updates.forEach(({ ref, data }) => batch.update(ref, data));

    await batch.commit();

    console.log(`Updated ${updates.length} ledger entries for company ${companyId} between ${startDate.toISOString()} and ${endDate.toISOString()}.`);
  } catch (error) {
    console.error('Failed to update ledger entry dates:', error);
    process.exit(1);
  }
})();
