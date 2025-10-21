#!/usr/bin/env node

/**
 * Complete workflow verification: Import Session → Journal → GL → Reports
 * Run this after completing a bank import
 */

const admin = require('firebase-admin');
const path = require('path');

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

// Utility: Format currency
function formatCurrency(amount, currency = 'ZAR') {
  return `${currency} ${Number(amount || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Utility: Format date
function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp._seconds ? new Date(timestamp._seconds * 1000) : new Date(timestamp);
  return date.toLocaleString();
}

// Phase 2: Verify Import Session
async function verifyImportSession(companyId) {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 2: Import Session Verification                      │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const sessionsSnapshot = await db.collection('companies')
    .doc(companyId)
    .collection('bankImportSessions')
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (sessionsSnapshot.empty) {
    console.log('   ❌ No import sessions found\n');
    return null;
  }

  const sessionDoc = sessionsSnapshot.docs[0];
  const session = sessionDoc.data();

  console.log(`   Session ID: ${sessionDoc.id}`);
  console.log(`   Status: ${session.status || 'N/A'}`);
  console.log(`   Transactions: ${session.transactionCount || 0}`);
  console.log(`   Posted: ${session.postedCount || 0}/${session.transactionCount || 0}`);
  console.log(`   Created: ${formatDate(session.createdAt)}`);

  const allPosted = (session.postedCount || 0) === (session.transactionCount || 0);
  console.log(`\n   ${allPosted ? '✅' : '❌'} Import session ${allPosted ? 'complete' : 'incomplete'}`);

  return {
    sessionId: sessionDoc.id,
    transactionCount: session.transactionCount || 0,
    allPosted
  };
}

// Phase 3: Verify Journal Entries
async function verifyJournalEntries(companyId, expectedCount) {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 3: Journal Entries Verification                     │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  // Count journal entries
  const journalSnapshot = await db.collection('journal_entries')
    .where('tenantId', '==', companyId)
    .get();

  const count = journalSnapshot.size;
  console.log(`   📝 Journal Entries Found: ${count}`);
  console.log(`   📊 Expected: ${expectedCount || '?'}`);

  const countMatch = expectedCount ? count === expectedCount : true;
  console.log(`   ${countMatch ? '✅' : '❌'} Count ${countMatch ? 'matches' : 'mismatch'}`);

  if (count === 0) {
    console.log('\n   ❌ No journal entries found!\n');
    return { count: 0, balanced: false, samples: [] };
  }

  // Check balance and structure
  let unbalancedCount = 0;
  let missingFieldsCount = 0;
  const samples = [];

  journalSnapshot.docs.forEach((doc, idx) => {
    const entry = doc.data();

    // Sample first 3
    if (idx < 3) {
      samples.push({
        id: doc.id,
        reference: entry.reference,
        description: entry.description,
        status: entry.status,
        lines: entry.lines?.length || 0
      });
    }

    // Check balance
    if (entry.lines && entry.lines.length === 2) {
      const debitLine = entry.lines.find(l => l.debit > 0);
      const creditLine = entry.lines.find(l => l.credit > 0);

      if (!debitLine || !creditLine || debitLine.debit !== creditLine.credit) {
        unbalancedCount++;
      }
    } else {
      unbalancedCount++;
    }

    // Check required fields
    if (!entry.tenantId || !entry.status || !entry.reference || !entry.lines) {
      missingFieldsCount++;
    }
  });

  console.log(`\n   Balance Check:`);
  console.log(`   ${unbalancedCount === 0 ? '✅' : '❌'} ${count - unbalancedCount}/${count} entries balanced`);
  if (unbalancedCount > 0) {
    console.log(`   ⚠️  ${unbalancedCount} unbalanced entries found!`);
  }

  console.log(`\n   Structure Check:`);
  console.log(`   ${missingFieldsCount === 0 ? '✅' : '❌'} ${count - missingFieldsCount}/${count} entries have required fields`);
  if (missingFieldsCount > 0) {
    console.log(`   ⚠️  ${missingFieldsCount} entries missing required fields!`);
  }

  // Show samples
  console.log(`\n   Sample Entries (first 3):`);
  samples.forEach((sample, idx) => {
    console.log(`   ${idx + 1}. ${sample.reference}: ${sample.description}`);
    console.log(`      Status: ${sample.status}, Lines: ${sample.lines}`);
  });

  const allBalanced = unbalancedCount === 0;
  const allComplete = missingFieldsCount === 0;

  console.log(`\n   ${allBalanced && allComplete ? '✅' : '❌'} Journal entries ${allBalanced && allComplete ? 'valid' : 'have issues'}`);

  return {
    count,
    balanced: allBalanced,
    complete: allComplete,
    samples,
    unbalancedCount,
    missingFieldsCount
  };
}

// Phase 4: Verify General Ledger
async function verifyGeneralLedger(companyId, expectedJournalCount) {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 4: General Ledger Verification                      │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  // Count GL entries
  const glSnapshot = await db.collection('general_ledger')
    .where('tenantId', '==', companyId)
    .get();

  const count = glSnapshot.size;
  const expectedCount = expectedJournalCount * 2; // 2 GL entries per journal entry
  console.log(`   📒 GL Entries Found: ${count}`);
  console.log(`   📊 Expected: ${expectedCount} (${expectedJournalCount} journal × 2)`);

  const countMatch = count === expectedCount;
  console.log(`   ${countMatch ? '✅' : '❌'} Count ${countMatch ? 'matches' : 'mismatch'}`);

  if (count === 0) {
    console.log('\n   ❌ No GL entries found!\n');
    return { count: 0, balanced: false, accountDistribution: {} };
  }

  // Analyze GL entries
  let totalDebits = 0;
  let totalCredits = 0;
  const accountDistribution = {};
  let missingLinksCount = 0;

  glSnapshot.docs.forEach(doc => {
    const entry = doc.data();

    // Sum debits and credits
    totalDebits += entry.debit || 0;
    totalCredits += entry.credit || 0;

    // Track account distribution
    const accountKey = `${entry.accountCode} - ${entry.accountName}`;
    if (!accountDistribution[accountKey]) {
      accountDistribution[accountKey] = { debits: 0, credits: 0, count: 0 };
    }
    accountDistribution[accountKey].debits += entry.debit || 0;
    accountDistribution[accountKey].credits += entry.credit || 0;
    accountDistribution[accountKey].count++;

    // Check links
    if (!entry.journalEntryId || !entry.journalLineId) {
      missingLinksCount++;
    }
  });

  // Balance check
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01; // Allow for floating point
  console.log(`\n   System Balance:`);
  console.log(`   Total Debits:  ${formatCurrency(totalDebits)}`);
  console.log(`   Total Credits: ${formatCurrency(totalCredits)}`);
  console.log(`   Difference: ${formatCurrency(Math.abs(totalDebits - totalCredits))}`);
  console.log(`   ${isBalanced ? '✅' : '❌'} System is ${isBalanced ? 'balanced' : 'UNBALANCED'}`);

  // Referential integrity
  console.log(`\n   Referential Integrity:`);
  console.log(`   ${missingLinksCount === 0 ? '✅' : '❌'} ${count - missingLinksCount}/${count} entries linked to journal`);
  if (missingLinksCount > 0) {
    console.log(`   ⚠️  ${missingLinksCount} entries missing journal links!`);
  }

  // Account distribution
  console.log(`\n   Account Distribution (Top 5):`);
  const sortedAccounts = Object.entries(accountDistribution)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  sortedAccounts.forEach(([account, stats], idx) => {
    console.log(`   ${idx + 1}. ${account}`);
    console.log(`      Entries: ${stats.count}, Debits: ${formatCurrency(stats.debits)}, Credits: ${formatCurrency(stats.credits)}`);
  });

  console.log(`\n   ${isBalanced && missingLinksCount === 0 ? '✅' : '❌'} GL entries ${isBalanced && missingLinksCount === 0 ? 'valid' : 'have issues'}`);

  return {
    count,
    balanced: isBalanced,
    totalDebits,
    totalCredits,
    accountDistribution,
    missingLinksCount
  };
}

// Phase 5: Compute Trial Balance
async function computeTrialBalance(companyId) {
  console.log('\n┌────────────────────────────────────────────────────────────┐');
  console.log('│ PHASE 5: Trial Balance Computation                        │');
  console.log('└────────────────────────────────────────────────────────────┘\n');

  const glSnapshot = await db.collection('general_ledger')
    .where('tenantId', '==', companyId)
    .get();

  if (glSnapshot.empty) {
    console.log('   ❌ No GL entries to compute trial balance\n');
    return null;
  }

  // Compute balances per account
  const accounts = {};

  glSnapshot.docs.forEach(doc => {
    const entry = doc.data();
    const accountKey = entry.accountCode || 'UNKNOWN';
    const accountName = entry.accountName || 'Unknown Account';

    if (!accounts[accountKey]) {
      accounts[accountKey] = {
        code: accountKey,
        name: accountName,
        debits: 0,
        credits: 0,
        balance: 0
      };
    }

    accounts[accountKey].debits += entry.debit || 0;
    accounts[accountKey].credits += entry.credit || 0;
  });

  // Calculate balances
  let totalDebits = 0;
  let totalCredits = 0;

  Object.values(accounts).forEach(account => {
    account.balance = account.debits - account.credits;
    totalDebits += account.debits;
    totalCredits += account.credits;
  });

  // Sort by account code
  const sortedAccounts = Object.values(accounts).sort((a, b) => a.code.localeCompare(b.code));

  console.log('   Trial Balance:');
  console.log('   ' + '-'.repeat(80));
  console.log('   Account                              Debits          Credits        Balance');
  console.log('   ' + '-'.repeat(80));

  sortedAccounts.forEach(account => {
    const codeAndName = `${account.code} - ${account.name}`.substring(0, 35).padEnd(35);
    const debits = formatCurrency(account.debits).padStart(15);
    const credits = formatCurrency(account.credits).padStart(15);
    const balance = formatCurrency(Math.abs(account.balance)).padStart(15);
    console.log(`   ${codeAndName} ${debits} ${credits} ${balance}`);
  });

  console.log('   ' + '-'.repeat(80));
  const totalDebitsStr = formatCurrency(totalDebits).padStart(15);
  const totalCreditsStr = formatCurrency(totalCredits).padStart(15);
  console.log(`   ${'TOTALS'.padEnd(35)} ${totalDebitsStr} ${totalCreditsStr}`);
  console.log('   ' + '-'.repeat(80));

  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;
  console.log(`\n   ${isBalanced ? '✅' : '❌'} Trial Balance ${isBalanced ? 'balances' : 'DOES NOT BALANCE'}`);

  return {
    accounts: sortedAccounts,
    totalDebits,
    totalCredits,
    balanced: isBalanced
  };
}

// Main verification
async function main() {
  const companyName = process.argv[2] || 'Orlicron';

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔍 Complete Workflow Verification                         ║');
  console.log('║  Bank Import → Journal → GL → Reports                      ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  // Find company
  const companiesSnapshot = await db.collection('companies')
    .where('name', '==', companyName)
    .limit(1)
    .get();

  if (companiesSnapshot.empty) {
    console.log(`\n❌ Company "${companyName}" not found\n`);
    process.exit(1);
  }

  const companyDoc = companiesSnapshot.docs[0];
  const companyId = companyDoc.id;

  console.log(`\n   Company: ${companyName}`);
  console.log(`   ID: ${companyId}\n`);

  // Run all phases
  const sessionResult = await verifyImportSession(companyId);
  const journalResult = await verifyJournalEntries(companyId, sessionResult?.transactionCount);
  const glResult = await verifyGeneralLedger(companyId, journalResult?.count);
  const trialBalanceResult = await computeTrialBalance(companyId);

  // Final Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Verification Summary                                   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('   Phase 2 - Import Session:');
  console.log(`   ${sessionResult?.allPosted ? '✅' : '❌'} ${sessionResult?.allPosted ? 'Complete' : 'Incomplete'} - ${sessionResult?.transactionCount || 0} transactions`);

  console.log('\n   Phase 3 - Journal Entries:');
  console.log(`   ${journalResult?.balanced && journalResult?.complete ? '✅' : '❌'} ${journalResult?.count || 0} entries found`);
  if (journalResult?.unbalancedCount > 0) {
    console.log(`   ⚠️  ${journalResult.unbalancedCount} unbalanced entries`);
  }

  console.log('\n   Phase 4 - General Ledger:');
  console.log(`   ${glResult?.balanced ? '✅' : '❌'} ${glResult?.count || 0} entries found`);
  console.log(`   ${glResult?.balanced ? '✅' : '❌'} System ${glResult?.balanced ? 'balanced' : 'unbalanced'}`);

  console.log('\n   Phase 5 - Trial Balance:');
  console.log(`   ${trialBalanceResult?.balanced ? '✅' : '❌'} Trial balance ${trialBalanceResult?.balanced ? 'balances' : 'does not balance'}`);

  // Overall status
  const allPassed = sessionResult?.allPosted &&
    journalResult?.balanced &&
    journalResult?.complete &&
    glResult?.balanced &&
    trialBalanceResult?.balanced;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  if (allPassed) {
    console.log('║  ✅ ALL CHECKS PASSED                                      ║');
    console.log('║  Workflow is functioning correctly!                        ║');
  } else {
    console.log('║  ❌ SOME CHECKS FAILED                                     ║');
    console.log('║  Review issues above before checking UI reports           ║');
  }
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('   Next Steps:');
  if (allPassed) {
    console.log('   1. Open the application UI');
    console.log('   2. Navigate to Reports');
    console.log('   3. Verify Trial Balance, Balance Sheet, Income Statement');
    console.log('   4. Check GL by Account and Journal Entries reports');
    console.log('   5. Take screenshots if any issues found\n');
  } else {
    console.log('   1. Review errors above');
    console.log('   2. May need to delete and re-import');
    console.log('   3. Check for data integrity issues\n');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
