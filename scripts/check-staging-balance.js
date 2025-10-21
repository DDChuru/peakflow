#!/usr/bin/env node

/**
 * Check Staging Balance
 *
 * Usage: node scripts/check-staging-balance.js <companyId> [sessionId]
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

async function checkStagingBalance(companyId, sessionId = null) {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 STAGING BALANCE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // Get sessions
    let sessionsQuery = db.collection('companies').doc(companyId)
      .collection('bankImportSessions');

    if (sessionId) {
      // Check specific session
      const sessionDoc = await sessionsQuery.doc(sessionId).get();
      if (!sessionDoc.exists) {
        console.log(`❌ Session ${sessionId} not found`);
        return;
      }
      await analyzeSession(companyId, sessionId, sessionDoc.data());
    } else {
      // Check all staged sessions
      const snapshot = await sessionsQuery
        .where('status', 'in', ['staged', 'posted'])
        .get();

      if (snapshot.empty) {
        console.log('No staging sessions found');
        return;
      }

      console.log(`Found ${snapshot.size} session(s)\n`);

      for (const doc of snapshot.docs) {
        await analyzeSession(companyId, doc.id, doc.data());
        console.log('\n');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function analyzeSession(companyId, sessionId, sessionData) {
  console.log('───────────────────────────────────────────────────────────');
  console.log(`📋 Session: ${sessionId.substring(0, 20)}...`);
  console.log(`   Status: ${sessionData.status}`);
  console.log('───────────────────────────────────────────────────────────\n');

  if (!sessionData.staging) {
    console.log('⚠️  No staging data in session document');
    return;
  }

  // What the session document claims
  console.log('📊 SESSION DOCUMENT CLAIMS:');
  console.log(`   Journal Entries: ${sessionData.staging.journalEntryCount}`);
  console.log(`   GL Entries: ${sessionData.staging.glEntryCount}`);
  console.log(`   Total Debits:  R${sessionData.staging.totalDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   Total Credits: R${sessionData.staging.totalCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`   Is Balanced: ${sessionData.staging.isBalanced ? '✅ Yes' : '❌ No'}\n`);

  // Check actual journal entries
  const journalSnapshot = await db.collection('staging_journal_entries')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  console.log('📝 ACTUAL JOURNAL ENTRIES IN FIRESTORE:');
  console.log(`   Count: ${journalSnapshot.size}\n`);

  let journalDebits = 0;
  let journalCredits = 0;

  journalSnapshot.forEach(doc => {
    const journal = doc.data();
    const entryDebits = journal.lines.reduce((sum, line) => sum + line.debit, 0);
    const entryCredits = journal.lines.reduce((sum, line) => sum + line.credit, 0);

    console.log(`   📄 ${doc.id}`);
    console.log(`      Ref: ${journal.reference}`);
    console.log(`      Desc: ${journal.description}`);
    console.log(`      Lines: ${journal.lines.length}`);
    console.log(`      Debits:  R${entryDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    console.log(`      Credits: R${entryCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

    journal.lines.forEach((line, idx) => {
      console.log(`         Line ${idx + 1}: ${line.accountCode} ${line.accountName}`);
      console.log(`            DR: R${line.debit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} | CR: R${line.credit.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
    });

    journalDebits += entryDebits;
    journalCredits += entryCredits;
    console.log('');
  });

  console.log('   📊 JOURNAL TOTALS:');
  console.log(`      Total Debits:  R${journalDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Total Credits: R${journalCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Difference: R${Math.abs(journalDebits - journalCredits).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Balanced: ${Math.abs(journalDebits - journalCredits) < 0.01 ? '✅ Yes' : '❌ No'}\n`);

  // Check actual GL entries
  const glSnapshot = await db.collection('staging_general_ledger')
    .where('bankImportSessionId', '==', sessionId)
    .get();

  console.log('📊 ACTUAL GL ENTRIES IN FIRESTORE:');
  console.log(`   Count: ${glSnapshot.size}\n`);

  let glDebits = 0;
  let glCredits = 0;
  const accountMap = new Map();

  glSnapshot.forEach(doc => {
    const gl = doc.data();
    glDebits += gl.debit;
    glCredits += gl.credit;

    const key = `${gl.accountCode}|${gl.accountName}`;
    if (!accountMap.has(key)) {
      accountMap.set(key, { debits: 0, credits: 0, count: 0 });
    }
    const acc = accountMap.get(key);
    acc.debits += gl.debit;
    acc.credits += gl.credit;
    acc.count += 1;
  });

  console.log('   📈 ACCOUNT SUMMARY:');
  for (const [key, data] of accountMap.entries()) {
    const [code, name] = key.split('|');
    console.log(`      ${code} - ${name}`);
    console.log(`         Debits:  R${data.debits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${data.count} entries)`);
    console.log(`         Credits: R${data.credits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })} (${data.count} entries)`);
  }

  console.log(`\n   📊 GL TOTALS:`);
  console.log(`      Total Debits:  R${glDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Total Credits: R${glCredits.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Difference: R${Math.abs(glDebits - glCredits).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
  console.log(`      Balanced: ${Math.abs(glDebits - glCredits) < 0.01 ? '✅ Yes' : '❌ No'}\n`);

  // COMPARISON
  console.log('🔍 VERIFICATION ANALYSIS:');
  console.log(`   Expected (Session Doc): R${sessionData.staging.totalDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);
  console.log(`   Actual (GL Entries):    R${glDebits.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);

  const difference = Math.abs(sessionData.staging.totalDebits - glDebits);
  console.log(`   Difference:             R${difference.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`);

  if (difference > 0.01) {
    console.log(`   ⚠️  MISMATCH DETECTED!\n`);

    const ratio = glDebits / sessionData.staging.totalDebits;
    console.log(`   📊 Multiplier (Actual/Expected): ${ratio.toFixed(4)}x`);

    if (Math.abs(ratio - 2) < 0.01) {
      console.log(`   ❌ DATA IS DOUBLED (2x)`);
    } else if (Math.abs(ratio - 4) < 0.01) {
      console.log(`   ❌ DATA IS QUADRUPLED (4x)`);
    } else if (Math.abs(ratio - 0.5) < 0.01) {
      console.log(`   ⚠️  GL has HALF the expected amount`);
    } else {
      console.log(`   ⚠️  Unexpected ratio: ${ratio.toFixed(4)}x`);
    }

    // Suggest likely cause
    console.log(`\n   💡 LIKELY CAUSE:`);
    if (ratio > 1) {
      console.log(`      - GL entries may be duplicated`);
      console.log(`      - Check if postToStaging was called multiple times`);
      console.log(`      - Verify journal lines aren't being counted twice`);
    } else {
      console.log(`      - Session summary may include extra amounts`);
      console.log(`      - Check calculation logic in postToStaging`);
    }
  } else {
    console.log(`   ✅ TOTALS MATCH! Balance is correct.`);
  }
}

// Parse arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/check-staging-balance.js <companyId> [sessionId]');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/check-staging-balance.js abc123');
  console.log('  node scripts/check-staging-balance.js abc123 import_1234567890_xyz');
  process.exit(1);
}

const [companyId, sessionId] = args;

checkStagingBalance(companyId, sessionId)
  .then(() => {
    console.log('\n✅ Verification complete!\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
