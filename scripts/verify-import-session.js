#!/usr/bin/env node

/**
 * Verify bank import session after import
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

async function verifyImportSession(companyId, companyName) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📥 Bank Import Session Verification                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Company: ${companyName} (${companyId})\n`);

  // Get all import sessions for this company
  const sessionsSnapshot = await db.collection('companies')
    .doc(companyId)
    .collection('bankImportSessions')
    .orderBy('createdAt', 'desc')
    .get();

  if (sessionsSnapshot.empty) {
    console.log('❌ No bank import sessions found\n');
    return;
  }

  console.log(`Found ${sessionsSnapshot.size} import session(s)\n`);

  // Show the most recent session
  console.log('--- Most Recent Import Session ---\n');
  const latestSession = sessionsSnapshot.docs[0];
  const sessionData = latestSession.data();

  console.log(`Session ID: ${latestSession.id}`);
  console.log(`Status: ${sessionData.status || 'N/A'}`);
  console.log(`Created: ${sessionData.createdAt ? new Date(sessionData.createdAt._seconds * 1000).toLocaleString() : 'N/A'}`);
  console.log(`Updated: ${sessionData.updatedAt ? new Date(sessionData.updatedAt._seconds * 1000).toLocaleString() : 'N/A'}`);
  console.log(`Bank Statement ID: ${sessionData.bankStatementId || 'N/A'}`);
  console.log(`Transaction Count: ${sessionData.transactionCount || 0}`);
  console.log(`Mapped Count: ${sessionData.mappedCount || 0}`);
  console.log(`Posted Count: ${sessionData.postedCount || 0}`);

  // Verification checks
  console.log('\n--- Verification Results ---\n');

  const checks = [];

  // Check 1: Session exists
  checks.push({
    name: 'Import session exists',
    passed: true,
    message: '✅ Session found'
  });

  // Check 2: Session status
  const validStatuses = ['completed', 'posted', 'approved'];
  const statusCheck = validStatuses.includes(sessionData.status);
  checks.push({
    name: 'Session status is valid',
    passed: statusCheck,
    message: statusCheck ? `✅ Status: ${sessionData.status}` : `❌ Status: ${sessionData.status} (expected: completed/posted/approved)`
  });

  // Check 3: Has transactions
  const hasTransactions = (sessionData.transactionCount || 0) > 0;
  checks.push({
    name: 'Has transactions',
    passed: hasTransactions,
    message: hasTransactions ? `✅ ${sessionData.transactionCount} transaction(s)` : '❌ No transactions'
  });

  // Check 4: Transactions mapped
  const allMapped = (sessionData.mappedCount || 0) === (sessionData.transactionCount || 0);
  checks.push({
    name: 'All transactions mapped',
    passed: allMapped,
    message: allMapped ? `✅ ${sessionData.mappedCount}/${sessionData.transactionCount} mapped` : `⚠️  ${sessionData.mappedCount}/${sessionData.transactionCount} mapped`
  });

  // Check 5: Transactions posted
  const allPosted = (sessionData.postedCount || 0) === (sessionData.transactionCount || 0);
  checks.push({
    name: 'All transactions posted',
    passed: allPosted,
    message: allPosted ? `✅ ${sessionData.postedCount}/${sessionData.transactionCount} posted` : `⚠️  ${sessionData.postedCount}/${sessionData.transactionCount} posted`
  });

  // Check 6: No errors
  const hasErrors = sessionData.errors && sessionData.errors.length > 0;
  checks.push({
    name: 'No errors',
    passed: !hasErrors,
    message: hasErrors ? `❌ ${sessionData.errors.length} error(s)` : '✅ No errors'
  });

  // Display checks
  checks.forEach(check => {
    console.log(`   ${check.message}`);
  });

  // Show errors if any
  if (hasErrors) {
    console.log('\n--- Errors ---\n');
    sessionData.errors.forEach((error, idx) => {
      console.log(`   ${idx + 1}. ${error}`);
    });
  }

  // Summary
  const passedCount = checks.filter(c => c.passed).length;
  const totalCount = checks.length;

  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Session Verification Summary                           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`   Checks Passed: ${passedCount}/${totalCount}`);
  console.log(`   Transaction Count: ${sessionData.transactionCount || 0}`);
  console.log(`   Expected Journal Entries: ${sessionData.transactionCount || 0}`);
  console.log(`   Expected GL Entries: ${(sessionData.transactionCount || 0) * 2}`);

  if (passedCount === totalCount) {
    console.log('\n   ✅ All checks passed! Ready to verify journal and GL entries.\n');
  } else {
    console.log('\n   ⚠️  Some checks failed. Review issues above.\n');
  }

  return {
    sessionId: latestSession.id,
    transactionCount: sessionData.transactionCount || 0,
    status: sessionData.status,
    allPassed: passedCount === totalCount
  };
}

async function main() {
  const companyName = process.argv[2] || 'Orlicron';

  // Find company
  const companiesSnapshot = await db.collection('companies')
    .where('name', '==', companyName)
    .limit(1)
    .get();

  if (companiesSnapshot.empty) {
    console.log(`❌ Company "${companyName}" not found`);
    process.exit(1);
  }

  const companyDoc = companiesSnapshot.docs[0];
  await verifyImportSession(companyDoc.id, companyDoc.data().name);
}

main().catch(console.error);
