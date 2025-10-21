/**
 * Test Script: Staging Ledger Workflow
 *
 * This script tests the complete staging workflow:
 * 1. Create mock bank transaction mappings
 * 2. Post to staging
 * 3. Verify staging entries created
 * 4. Verify balance
 * 5. Post to production
 * 6. Verify production entries created
 *
 * Run with: npx ts-node scripts/test-staging-workflow.ts
 */

import { BankToLedgerService } from '../src/lib/accounting/bank-to-ledger-service';
import { DirectPostingRequest } from '../src/types/accounting';
import { db } from '../src/lib/firebase/config';
import { collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// Test configuration
const TEST_COMPANY_ID = 'test-staging-company';
const TEST_SESSION_ID = `test-session-${Date.now()}`;
const TEST_USER_ID = 'test-user';

/**
 * Create mock transaction mappings for testing
 */
function createMockTransactionMappings(): any[] {
  return [
    {
      // Test transaction 1: Bank deposit (cash sale)
      transactionId: 'txn-1',
      date: new Date('2025-01-15'),
      description: 'Cash Sale - Widget XYZ',
      amount: 1000,
      type: 'credit' as const,
      debitAccount: '1100', // Bank Account
      debitAccountName: 'Current Bank Account',
      creditAccount: '4100', // Sales Revenue
      creditAccountName: 'Sales Revenue',
      narration: 'Cash sale of Widget XYZ',
    },
    {
      // Test transaction 2: Bank withdrawal (office supplies)
      transactionId: 'txn-2',
      date: new Date('2025-01-16'),
      description: 'Office Supplies - Staples',
      amount: 150,
      type: 'debit' as const,
      debitAccount: '6200', // Operating Expenses
      debitAccountName: 'Office Supplies',
      creditAccount: '1100', // Bank Account
      creditAccountName: 'Current Bank Account',
      narration: 'Purchase of office supplies from Staples',
    },
    {
      // Test transaction 3: Bank deposit (customer payment)
      transactionId: 'txn-3',
      date: new Date('2025-01-17'),
      description: 'Customer Payment - ABC Corp',
      amount: 2500,
      type: 'credit' as const,
      debitAccount: '1100', // Bank Account
      debitAccountName: 'Current Bank Account',
      creditAccount: '1200', // Accounts Receivable
      creditAccountName: 'Accounts Receivable',
      narration: 'Payment received from ABC Corp',
    },
  ];
}

/**
 * Clean up test data from Firestore
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  const collections = [
    'staging_journal_entries',
    'staging_general_ledger',
    'journal_entries',
    'general_ledger',
    'bankImportSessions',
  ];

  for (const collectionName of collections) {
    const q = query(
      collection(db, collectionName),
      where('tenantId', '==', TEST_COMPANY_ID)
    );

    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    console.log(`   Deleted ${snapshot.size} documents from ${collectionName}`);
  }

  console.log('✅ Cleanup complete\n');
}

/**
 * Verify staging entries were created correctly
 */
async function verifyStagingEntries(sessionId: string) {
  console.log('🔍 Verifying staging entries...');

  // Check staging journal entries
  const journalQuery = query(
    collection(db, 'staging_journal_entries'),
    where('bankImportSessionId', '==', sessionId)
  );
  const journalSnapshot = await getDocs(journalQuery);
  console.log(`   Found ${journalSnapshot.size} staging journal entries`);

  // Check staging GL entries
  const glQuery = query(
    collection(db, 'staging_general_ledger'),
    where('bankImportSessionId', '==', sessionId)
  );
  const glSnapshot = await getDocs(glQuery);
  console.log(`   Found ${glSnapshot.size} staging GL entries`);

  // Verify balance
  let totalDebits = 0;
  let totalCredits = 0;

  glSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalDebits += data.debit || 0;
    totalCredits += data.credit || 0;
  });

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  console.log(`   Total Debits: $${totalDebits.toFixed(2)}`);
  console.log(`   Total Credits: $${totalCredits.toFixed(2)}`);
  console.log(`   Balanced: ${isBalanced ? '✅' : '❌'}`);

  if (!isBalanced) {
    throw new Error('Staging entries are not balanced!');
  }

  return {
    journalCount: journalSnapshot.size,
    glCount: glSnapshot.size,
    totalDebits,
    totalCredits,
  };
}

/**
 * Verify production entries were created correctly
 */
async function verifyProductionEntries(sessionId: string) {
  console.log('\n🔍 Verifying production entries...');

  // Check production journal entries
  const journalQuery = query(
    collection(db, 'journal_entries'),
    where('tenantId', '==', TEST_COMPANY_ID)
  );
  const journalSnapshot = await getDocs(journalQuery);
  console.log(`   Found ${journalSnapshot.size} production journal entries`);

  // Check production GL entries
  const glQuery = query(
    collection(db, 'general_ledger'),
    where('tenantId', '==', TEST_COMPANY_ID)
  );
  const glSnapshot = await getDocs(glQuery);
  console.log(`   Found ${glSnapshot.size} production GL entries`);

  // Verify balance
  let totalDebits = 0;
  let totalCredits = 0;

  glSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    totalDebits += data.debit || 0;
    totalCredits += data.credit || 0;
  });

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  console.log(`   Total Debits: $${totalDebits.toFixed(2)}`);
  console.log(`   Total Credits: $${totalCredits.toFixed(2)}`);
  console.log(`   Balanced: ${isBalanced ? '✅' : '❌'}`);

  if (!isBalanced) {
    throw new Error('Production entries are not balanced!');
  }

  return {
    journalCount: journalSnapshot.size,
    glCount: glSnapshot.size,
    totalDebits,
    totalCredits,
  };
}

/**
 * Main test function
 */
async function runTest() {
  console.log('='.repeat(60));
  console.log('🧪 STAGING LEDGER WORKFLOW TEST');
  console.log('='.repeat(60));
  console.log(`Company ID: ${TEST_COMPANY_ID}`);
  console.log(`Session ID: ${TEST_SESSION_ID}`);
  console.log('='.repeat(60));

  try {
    // Step 1: Cleanup any existing test data
    await cleanupTestData();

    // Step 2: Initialize service
    console.log('📦 Initializing BankToLedgerService...');
    const service = new BankToLedgerService(TEST_COMPANY_ID);

    // Step 3: Create test data
    console.log('\n🏗️  Creating test transaction mappings...');
    const transactions = createMockTransactionMappings();
    console.log(`   Created ${transactions.length} test transactions`);

    // Step 4: Post to staging
    console.log('\n📝 Posting to staging...');
    const stagingRequest: DirectPostingRequest = {
      sessionId: TEST_SESSION_ID,
      transactions,
      createdBy: TEST_USER_ID,
    };

    const stagingResult = await service.postToStaging(stagingRequest);
    console.log('✅ Posted to staging successfully');
    console.log(`   Session ID: ${stagingResult.sessionId}`);
    console.log(`   Status: ${stagingResult.status}`);

    // Step 5: Verify staging entries
    const stagingStats = await verifyStagingEntries(TEST_SESSION_ID);
    console.log('✅ Staging entries verified');

    // Step 6: Post to production
    console.log('\n🚀 Posting to production...');
    const productionResult = await service.postToProduction(TEST_SESSION_ID);
    console.log('✅ Posted to production successfully');
    console.log(`   Session ID: ${productionResult.sessionId}`);
    console.log(`   Status: ${productionResult.status}`);

    // Step 7: Verify production entries
    const productionStats = await verifyProductionEntries(TEST_SESSION_ID);
    console.log('✅ Production entries verified');

    // Step 8: Verify counts match
    console.log('\n📊 Comparing staging vs production...');
    const countsMatch =
      stagingStats.journalCount === productionStats.journalCount &&
      stagingStats.glCount === productionStats.glCount;

    console.log(`   Staging Journals: ${stagingStats.journalCount}`);
    console.log(`   Production Journals: ${productionStats.journalCount}`);
    console.log(`   Staging GL: ${stagingStats.glCount}`);
    console.log(`   Production GL: ${productionStats.glCount}`);
    console.log(`   Counts Match: ${countsMatch ? '✅' : '❌'}`);

    if (!countsMatch) {
      throw new Error('Staging and production counts do not match!');
    }

    // Success!
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\n💡 Next Steps:');
    console.log('   1. Deploy Firestore indexes (see STAGING-DEPLOYMENT-INSTRUCTIONS.md)');
    console.log('   2. Test with actual bank import UI');
    console.log('   3. Implement staging review component');
    console.log('   4. Add export functionality\n');

    // Cleanup
    console.log('🧹 Running final cleanup...');
    await cleanupTestData();

  } catch (error) {
    console.error('\n❌ TEST FAILED');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
runTest().then(() => {
  console.log('🏁 Test complete');
  process.exit(0);
}).catch((error) => {
  console.error('🔥 Fatal error:', error);
  process.exit(1);
});
