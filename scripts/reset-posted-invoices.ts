/**
 * Reset Posted Invoices - Development Script
 *
 * This script will:
 * 1. Delete all journal entries
 * 2. Delete all general ledger entries
 * 3. Reset all invoices to unpaid/unposted status
 * 4. Reset debtor balances to zero
 *
 * WARNING: This is a destructive operation. Only use in development!
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

interface ResetStats {
  journalEntriesDeleted: number;
  ledgerEntriesDeleted: number;
  invoicesReset: number;
  debtorsReset: number;
  companiesProcessed: string[];
}

async function resetPostedInvoices(companyId?: string): Promise<ResetStats> {
  const stats: ResetStats = {
    journalEntriesDeleted: 0,
    ledgerEntriesDeleted: 0,
    invoicesReset: 0,
    debtorsReset: 0,
    companiesProcessed: []
  };

  console.log('🔄 Starting reset of posted invoices...\n');

  // Step 1: Delete all journal entries
  console.log('📝 Step 1: Deleting journal entries...');
  const journalQuery = db.collection('journal_entries');
  const journalSnapshot = await journalQuery.get();

  const journalBatch = db.batch();
  journalSnapshot.docs.forEach(doc => {
    journalBatch.delete(doc.ref);
    stats.journalEntriesDeleted++;
  });

  if (stats.journalEntriesDeleted > 0) {
    await journalBatch.commit();
    console.log(`   ✅ Deleted ${stats.journalEntriesDeleted} journal entries`);
  } else {
    console.log('   ℹ️  No journal entries found');
  }

  // Step 2: Delete all ledger entries
  console.log('\n📊 Step 2: Deleting general ledger entries...');
  const ledgerQuery = db.collection('general_ledger');
  const ledgerSnapshot = await ledgerQuery.get();

  const ledgerBatch = db.batch();
  ledgerSnapshot.docs.forEach(doc => {
    ledgerBatch.delete(doc.ref);
    stats.ledgerEntriesDeleted++;
  });

  if (stats.ledgerEntriesDeleted > 0) {
    await ledgerBatch.commit();
    console.log(`   ✅ Deleted ${stats.ledgerEntriesDeleted} ledger entries`);
  } else {
    console.log('   ℹ️  No ledger entries found');
  }

  // Step 3: Reset invoices
  console.log('\n🧾 Step 3: Resetting invoices...');

  // Get all companies or specific company
  const companiesQuery = companyId
    ? db.collection('companies').where('__name__', '==', companyId)
    : db.collection('companies');

  const companiesSnapshot = await companiesQuery.get();

  for (const companyDoc of companiesSnapshot.docs) {
    const currentCompanyId = companyDoc.id;
    console.log(`   Processing company: ${currentCompanyId}`);
    stats.companiesProcessed.push(currentCompanyId);

    // Get all invoices for this company
    const invoicesRef = db.collection(`companies/${currentCompanyId}/invoices`);
    const invoicesSnapshot = await invoicesRef.get();

    const invoiceBatch = db.batch();
    let companyInvoicesReset = 0;

    invoicesSnapshot.docs.forEach(invoiceDoc => {
      const invoice = invoiceDoc.data();

      // Check if invoice was posted
      if (invoice.journalEntryId || invoice.postedDate || invoice.fiscalPeriodId) {
        invoiceBatch.update(invoiceDoc.ref, {
          journalEntryId: null,
          postedDate: null,
          fiscalPeriodId: null,
          updatedAt: new Date()
        });
        companyInvoicesReset++;
        stats.invoicesReset++;
      }
    });

    if (companyInvoicesReset > 0) {
      await invoiceBatch.commit();
      console.log(`   ✅ Reset ${companyInvoicesReset} invoices for company ${currentCompanyId}`);
    } else {
      console.log(`   ℹ️  No posted invoices found for company ${currentCompanyId}`);
    }
  }

  // Step 4: Reset debtor balances
  console.log('\n👥 Step 4: Resetting debtor balances...');
  const debtorsQuery = db.collection('debtors');
  const debtorsSnapshot = await debtorsQuery.get();

  const debtorsBatch = db.batch();
  debtorsSnapshot.docs.forEach(debtorDoc => {
    debtorsBatch.update(debtorDoc.ref, {
      currentBalance: 0,
      overdueAmount: 0,
      updatedAt: new Date()
    });
    stats.debtorsReset++;
  });

  if (stats.debtorsReset > 0) {
    await debtorsBatch.commit();
    console.log(`   ✅ Reset balances for ${stats.debtorsReset} debtors`);
  } else {
    console.log('   ℹ️  No debtors found');
  }

  return stats;
}

// Main execution
async function main() {
  try {
    console.log('⚠️  WARNING: This script will DELETE all journal entries and reset all posted invoices!');
    console.log('⚠️  This is a DESTRUCTIVE operation and should only be used in development.\n');

    // Get company ID from command line argument if provided
    const companyId = process.argv[2];

    if (companyId) {
      console.log(`🎯 Targeting specific company: ${companyId}\n`);
    } else {
      console.log('🌐 Processing ALL companies\n');
    }

    const stats = await resetPostedInvoices(companyId);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Reset Complete!');
    console.log('='.repeat(60));
    console.log(`📝 Journal entries deleted:    ${stats.journalEntriesDeleted}`);
    console.log(`📊 Ledger entries deleted:     ${stats.ledgerEntriesDeleted}`);
    console.log(`🧾 Invoices reset:             ${stats.invoicesReset}`);
    console.log(`👥 Debtors reset:              ${stats.debtorsReset}`);
    console.log(`🏢 Companies processed:        ${stats.companiesProcessed.length}`);
    if (stats.companiesProcessed.length > 0) {
      stats.companiesProcessed.forEach(id => console.log(`   - ${id}`));
    }
    console.log('='.repeat(60));
    console.log('\n✨ You can now re-post your invoices with the new complete ledger structure!');
    console.log('   The invoices will now include:');
    console.log('   • Full account names (not just codes)');
    console.log('   • Line-level descriptions');
    console.log('   • Customer and invoice dimensions for subsidiary ledger');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error during reset:', error);
    process.exit(1);
  }
}

main();
