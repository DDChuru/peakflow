#!/usr/bin/env node

/**
 * Roll back duplicate bank-import postings from Firestore.
 *
 * Usage:
 *   node scripts/rollback-bank-import.js --tenant YOUR_COMPANY_ID [--since 2025-02-18] [--delete-all] [--confirm]
 *
 * Requirements:
 *   - Set FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS to a service-account JSON
 *   - firebase-admin dependency (already included in package.json)
 *
 * By default the script runs in dry-run mode and only reports what would be deleted.
 * Pass --confirm to actually delete the journal + ledger documents.
 */

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function fail(message) {
  console.error(`\n✖ ${message}`);
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    tenantId: undefined,
    since: undefined,
    confirm: false,
    deleteAll: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--tenant':
      case '--tenantId':
        parsed.tenantId = args[++i];
        break;
      case '--since':
        parsed.since = args[++i];
        break;
      case '--confirm':
        parsed.confirm = true;
        break;
      case '--delete-all':
      case '--deleteAll':
        parsed.deleteAll = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
      default:
        fail(`Unknown argument: ${arg}`);
    }
  }

  if (!parsed.tenantId) {
    fail('Missing required --tenant argument.');
  }

  if (parsed.since) {
    const date = new Date(parsed.since);
    if (Number.isNaN(date.getTime())) {
      fail(`Invalid --since date: ${parsed.since}`);
    }
    parsed.sinceDate = date;
  }

  return parsed;
}

function printHelp() {
  console.log(`
Roll back duplicate bank-import postings.

Usage:
  node scripts/rollback-bank-import.js --tenant COMPANY_ID [--since YYYY-MM-DD] [--delete-all] [--confirm]

Options:
  --tenant, --tenantId   Company / tenant identifier (required)
  --since                Only consider entries created on/after this date (optional)
  --delete-all           Delete every matching bank_import journal entry (instead of duplicates only)
  --confirm              Execute deletions (omit for dry-run)
  --help                 Show this help message
`);
}

function resolveServiceAccountPath() {
  const candidate =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    'scripts/service-account.json';

  const resolved = path.isAbsolute(candidate)
    ? candidate
    : path.join(process.cwd(), candidate);

  if (!fs.existsSync(resolved)) {
    fail(
      `Service account file not found at ${resolved}. ` +
        'Set FIREBASE_SERVICE_ACCOUNT_PATH or place scripts/service-account.json.'
    );
  }

  return resolved;
}

async function main() {
  const options = parseArgs();
  const serviceAccountPath = resolveServiceAccountPath();
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  console.log('───────────────────────────────────────────────');
  console.log(' Bank Import Rollback (dry-run:', !options.confirm, ')');
  console.log(' Tenant:', options.tenantId);
  if (options.sinceDate) {
    console.log(' Since :', options.sinceDate.toISOString());
  }
  console.log(' Mode  :', options.deleteAll ? 'delete-all' : 'remove-duplicates');
  console.log('───────────────────────────────────────────────');

  let query = db
    .collection('journal_entries')
    .where('tenantId', '==', options.tenantId)
    .where('source', '==', 'bank_import');

  if (options.sinceDate) {
    query = query.where(
      'createdAt',
      '>=',
      admin.firestore.Timestamp.fromDate(options.sinceDate)
    );
  }

  const snapshot = await query.get();
  if (snapshot.empty) {
    console.log('No matching journal entries found. Nothing to do.');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} bank_import journal entries.`);

  const entriesByTransaction = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data();
    const metadata = data.metadata || {};
    const bankTransactionId = metadata.bankTransactionId || 'unknown';
    const createdAtTs = data.createdAt;
    const createdAt =
      createdAtTs && typeof createdAtTs.toDate === 'function'
        ? createdAtTs.toDate()
        : null;

    const list = entriesByTransaction.get(bankTransactionId) || [];
    list.push({
      doc,
      data,
      createdAt,
      bankTransactionId,
    });
    entriesByTransaction.set(bankTransactionId, list);
  });

  const deletions = [];
  const reasons = [];

  entriesByTransaction.forEach((list, bankTransactionId) => {
    if (bankTransactionId === 'unknown') {
      return;
    }

    if (options.deleteAll) {
      list.forEach((entry) => {
        deletions.push(entry);
        reasons.push(
          `delete-all :: ${entry.doc.id} (bankTransactionId=${bankTransactionId})`
        );
      });
      return;
    }

    if (list.length <= 1) {
      return;
    }

    list.sort((a, b) => {
      const timeA = a.createdAt ? a.createdAt.getTime() : Number.MAX_SAFE_INTEGER;
      const timeB = b.createdAt ? b.createdAt.getTime() : Number.MAX_SAFE_INTEGER;
      return timeA - timeB;
    });

    // Keep the earliest, delete the rest.
    const [keep, ...duplicates] = list;
    duplicates.forEach((entry) => {
      deletions.push(entry);
      reasons.push(
        `duplicate :: ${entry.doc.id} (bankTransactionId=${bankTransactionId}, keep=${keep.doc.id})`
      );
    });
  });

  if (deletions.length === 0) {
    console.log(
      options.deleteAll
        ? 'No journal entries matched the criteria.'
        : 'No duplicate bank_import journal entries found.'
    );
    process.exit(0);
  }

  console.log(
    `Prepared ${deletions.length} journal entries for deletion${
      options.confirm ? '' : ' (dry-run)'
    }.`
  );

  deletions.forEach((entry, index) => {
    console.log(
      ` ${index + 1}. ${entry.doc.id} :: bankTransactionId=${entry.bankTransactionId} :: createdAt=${entry.createdAt?.toISOString() || 'n/a'}`
    );
  });

  if (!options.confirm) {
    console.log('\nDry run complete. Re-run with --confirm to apply deletions.');
    process.exit(0);
  }

  console.log('\nDeleting journal and ledger entries...');

  for (const entry of deletions) {
    const journalId = entry.doc.id;

    // Delete ledger entries tied to this journal entry.
    const ledgerSnapshot = await db
      .collection('general_ledger')
      .where('journalEntryId', '==', journalId)
      .get();

    for (const ledgerDoc of ledgerSnapshot.docs) {
      await ledgerDoc.ref.delete();
      console.log(`  - Deleted ledger entry ${ledgerDoc.id} (journal=${journalId})`);
    }

    await entry.doc.ref.delete();
    console.log(`  ✔ Deleted journal entry ${journalId}`);
  }

  console.log('\nRollback complete.');
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
