#!/usr/bin/env node

/**
 * Script to delete all journal entries and general ledger entries for a specific company
 *
 * Usage:
 *   node scripts/delete-company-ledger-data.js [--company-name "Olicron"] [--dry-run]
 *
 * Options:
 *   --company-name: Name of the company to clean (default: "Olicron")
 *   --company-id: Company ID (if you already know it)
 *   --dry-run: Preview what will be deleted without actually deleting
 *   --confirm: Skip confirmation prompt (USE WITH CAUTION)
 */

const admin = require('firebase-admin');
const path = require('path');
const readline = require('readline');

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

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    companyName: undefined,
    companyId: undefined,
    dryRun: false,
    confirm: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--company-name' && args[i + 1]) {
      options.companyName = args[i + 1];
      i++;
    } else if (args[i] === '--company-id' && args[i + 1]) {
      options.companyId = args[i + 1];
      i++;
    } else if (args[i] === '--dry-run') {
      options.dryRun = true;
    } else if (args[i] === '--confirm') {
      options.confirm = true;
    }
  }

  return options;
}

// Find company by name
async function findCompanyByName(companyName) {
  console.log(`\n🔍 Searching for company: "${companyName}"...`);

  const companiesSnapshot = await db.collection('companies')
    .where('name', '==', companyName)
    .limit(1)
    .get();

  if (companiesSnapshot.empty) {
    console.log(`❌ Company "${companyName}" not found`);
    return null;
  }

  const companyDoc = companiesSnapshot.docs[0];
  const company = {
    id: companyDoc.id,
    name: companyDoc.data().name,
  };

  console.log(`✅ Found company: ${company.name} (ID: ${company.id})`);
  return company;
}

// Get company by ID
async function getCompanyById(companyId) {
  console.log(`\n🔍 Fetching company with ID: ${companyId}...`);

  const companyDoc = await db.collection('companies').doc(companyId).get();

  if (!companyDoc.exists) {
    console.log(`❌ Company with ID "${companyId}" not found`);
    return null;
  }

  const company = {
    id: companyDoc.id,
    name: companyDoc.data()?.name || 'Unknown',
  };

  console.log(`✅ Found company: ${company.name} (ID: ${company.id})`);
  return company;
}

// Count documents that will be deleted
async function countDocuments(companyId) {
  console.log('\n📊 Analyzing data to be deleted...\n');

  const stats = {
    journalEntriesCount: 0,
    generalLedgerCount: 0,
    journalEntriesDeleted: 0,
    generalLedgerDeleted: 0,
    errors: [],
  };

  // Count journal entries (using tenantId, not companyId)
  const journalEntriesSnapshot = await db.collection('journal_entries')
    .where('tenantId', '==', companyId)
    .get();
  stats.journalEntriesCount = journalEntriesSnapshot.size;
  console.log(`   📝 Journal Entries: ${stats.journalEntriesCount}`);

  // Count general ledger entries (using tenantId, not companyId)
  const generalLedgerSnapshot = await db.collection('general_ledger')
    .where('tenantId', '==', companyId)
    .get();
  stats.generalLedgerCount = generalLedgerSnapshot.size;
  console.log(`   📒 General Ledger Entries: ${stats.generalLedgerCount}`);

  console.log(`\n   📊 Total documents: ${stats.journalEntriesCount + stats.generalLedgerCount}`);

  return stats;
}

// Show sample entries
async function showSampleEntries(companyId) {
  console.log('\n📄 Sample entries that will be deleted:\n');

  // Show sample journal entries (using tenantId)
  const journalSnapshot = await db.collection('journal_entries')
    .where('tenantId', '==', companyId)
    .limit(3)
    .get();

  if (!journalSnapshot.empty) {
    console.log('   Journal Entries (first 3):');
    journalSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ID: ${doc.id}`);
      console.log(`      Date: ${data.date}`);
      console.log(`      Description: ${data.description || 'N/A'}`);
      console.log(`      Status: ${data.status || 'N/A'}`);
    });
  }

  // Show sample GL entries (using tenantId)
  const glSnapshot = await db.collection('general_ledger')
    .where('tenantId', '==', companyId)
    .limit(3)
    .get();

  if (!glSnapshot.empty) {
    console.log('\n   General Ledger Entries (first 3):');
    glSnapshot.docs.forEach((doc, idx) => {
      const data = doc.data();
      console.log(`   ${idx + 1}. ID: ${doc.id}`);
      console.log(`      Account: ${data.accountCode || 'N/A'} - ${data.accountName || 'N/A'}`);
      console.log(`      Amount: ${data.amount || 0}`);
      console.log(`      Type: ${data.type || 'N/A'}`);
    });
  }
}

// Ask for confirmation
async function askConfirmation(company, stats) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This action cannot be undone!\n');
    console.log(`   Company: ${company.name} (${company.id})`);
    console.log(`   Journal Entries to delete: ${stats.journalEntriesCount}`);
    console.log(`   General Ledger Entries to delete: ${stats.generalLedgerCount}`);
    console.log(`   Total: ${stats.journalEntriesCount + stats.generalLedgerCount} documents\n`);

    rl.question('Type "DELETE" to confirm deletion, or anything else to cancel: ', (answer) => {
      rl.close();
      resolve(answer.trim() === 'DELETE');
    });
  });
}

// Delete documents in batches
async function deleteInBatches(collectionName, companyId, dryRun) {
  const BATCH_SIZE = 500; // Firestore batch limit
  let deletedCount = 0;

  while (true) {
    const snapshot = await db.collection(collectionName)
      .where('tenantId', '==', companyId)
      .limit(BATCH_SIZE)
      .get();

    if (snapshot.empty) {
      break;
    }

    if (dryRun) {
      console.log(`   [DRY RUN] Would delete ${snapshot.size} documents from ${collectionName}`);
      deletedCount += snapshot.size;
      break; // In dry run, just count once
    }

    // Delete in batch
    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    deletedCount += snapshot.size;

    console.log(`   ✓ Deleted ${deletedCount} documents from ${collectionName}...`);

    // If we got less than BATCH_SIZE, we're done
    if (snapshot.size < BATCH_SIZE) {
      break;
    }
  }

  return deletedCount;
}

// Perform deletion
async function performDeletion(companyId, stats, dryRun) {
  console.log(`\n🗑️  ${dryRun ? '[DRY RUN] Simulating deletion' : 'Starting deletion'}...\n`);

  try {
    // Delete general ledger entries first (dependent on journal entries)
    console.log('   📒 Deleting General Ledger entries...');
    stats.generalLedgerDeleted = await deleteInBatches('general_ledger', companyId, dryRun);
    console.log(`   ✅ ${dryRun ? 'Would delete' : 'Deleted'} ${stats.generalLedgerDeleted} general ledger entries`);

    // Delete journal entries
    console.log('\n   📝 Deleting Journal Entries...');
    stats.journalEntriesDeleted = await deleteInBatches('journal_entries', companyId, dryRun);
    console.log(`   ✅ ${dryRun ? 'Would delete' : 'Deleted'} ${stats.journalEntriesDeleted} journal entries`);

  } catch (error) {
    const errorMsg = error.message || String(error);
    stats.errors.push(errorMsg);
    console.error(`\n❌ Error during deletion: ${errorMsg}`);
  }

  return stats;
}

// Verify deletion
async function verifyDeletion(companyId) {
  console.log('\n🔍 Verifying deletion...\n');

  const journalCount = (await db.collection('journal_entries')
    .where('tenantId', '==', companyId)
    .limit(1)
    .get()).size;

  const glCount = (await db.collection('general_ledger')
    .where('tenantId', '==', companyId)
    .limit(1)
    .get()).size;

  console.log(`   📝 Remaining Journal Entries: ${journalCount}`);
  console.log(`   📒 Remaining General Ledger Entries: ${glCount}`);

  const isClean = journalCount === 0 && glCount === 0;

  if (isClean) {
    console.log('\n✅ Clean slate achieved! No journal or ledger entries remain for this company.');
  } else {
    console.log('\n⚠️  Warning: Some entries still remain. You may need to run the script again.');
  }

  return isClean;
}

// Main execution
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  🗑️  Company Ledger Data Deletion Script                 ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const options = parseArgs();

  // Find company
  let company = null;

  if (options.companyId) {
    company = await getCompanyById(options.companyId);
  } else if (options.companyName) {
    company = await findCompanyByName(options.companyName);
  } else {
    // Default to Olicron
    company = await findCompanyByName('Olicron');
  }

  if (!company) {
    console.log('\n❌ Cannot proceed without a valid company.');
    process.exit(1);
  }

  // Count what will be deleted
  const stats = await countDocuments(company.id);

  if (stats.journalEntriesCount === 0 && stats.generalLedgerCount === 0) {
    console.log('\n✅ Nothing to delete! Company already has a clean slate.');
    process.exit(0);
  }

  // Show samples
  await showSampleEntries(company.id);

  // Dry run check
  if (options.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No actual deletions will be performed\n');
    await performDeletion(company.id, stats, true);
    console.log('\n✅ Dry run complete. Run without --dry-run to actually delete.');
    process.exit(0);
  }

  // Get confirmation
  if (!options.confirm) {
    const confirmed = await askConfirmation(company, stats);
    if (!confirmed) {
      console.log('\n❌ Deletion cancelled by user.');
      process.exit(0);
    }
  }

  // Perform actual deletion
  const startTime = Date.now();
  const finalStats = await performDeletion(company.id, stats, false);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Verify
  const isClean = await verifyDeletion(company.id);

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Deletion Summary                                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
  console.log(`   Company: ${company.name} (${company.id})`);
  console.log(`   Journal Entries Deleted: ${finalStats.journalEntriesDeleted}/${finalStats.journalEntriesCount}`);
  console.log(`   General Ledger Deleted: ${finalStats.generalLedgerDeleted}/${finalStats.generalLedgerCount}`);
  console.log(`   Duration: ${duration}s`);
  console.log(`   Status: ${isClean ? '✅ Clean slate achieved' : '⚠️  Some entries remain'}`);

  if (finalStats.errors.length > 0) {
    console.log(`\n   ⚠️  Errors encountered:`);
    finalStats.errors.forEach((error, idx) => {
      console.log(`   ${idx + 1}. ${error}`);
    });
  }

  console.log('\n✨ Done!\n');
  process.exit(isClean ? 0 : 1);
}

// Run the script
main().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
