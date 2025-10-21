/**
 * Verify Staging Totals
 *
 * This script inspects staging collections and calculates actual totals
 * to verify balance accuracy.
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

async function verifyStagingTotals() {
  try {
    console.log('🔍 Verifying Staging Totals...\n');

    // Get all staging sessions
    const sessionsSnapshot = await db.collectionGroup('bankImportSessions')
      .where('status', 'in', ['staged', 'posted'])
      .get();

    console.log(`Found ${sessionsSnapshot.size} staging sessions\n`);

    for (const sessionDoc of sessionsSnapshot.docs) {
      const sessionData = sessionDoc.data();
      const sessionId = sessionDoc.id;

      console.log('═══════════════════════════════════════════════════════════');
      console.log(`📋 Session: ${sessionId}`);
      console.log(`   Company: ${sessionDoc.ref.parent.parent.id}`);
      console.log(`   Status: ${sessionData.status}`);
      console.log('═══════════════════════════════════════════════════════════\n');

      if (!sessionData.staging) {
        console.log('⚠️  No staging data found in session\n');
        continue;
      }

      // What the session claims
      console.log('📊 SESSION CLAIMS:');
      console.log(`   Journal Entries: ${sessionData.staging.journalEntryCount}`);
      console.log(`   GL Entries: ${sessionData.staging.glEntryCount}`);
      console.log(`   Total Debits:  R${sessionData.staging.totalDebits.toFixed(2)}`);
      console.log(`   Total Credits: R${sessionData.staging.totalCredits.toFixed(2)}`);
      console.log(`   Is Balanced: ${sessionData.staging.isBalanced ? '✅' : '❌'}\n`);

      // Check actual staging journal entries
      const journalSnapshot = await db.collection('staging_journal_entries')
        .where('bankImportSessionId', '==', sessionId)
        .get();

      console.log('📝 ACTUAL JOURNAL ENTRIES:');
      console.log(`   Count: ${journalSnapshot.size}`);

      let journalDebits = 0;
      let journalCredits = 0;

      journalSnapshot.forEach(doc => {
        const journal = doc.data();
        console.log(`\n   Entry: ${doc.id}`);
        console.log(`   Reference: ${journal.reference}`);
        console.log(`   Description: ${journal.description}`);
        console.log(`   Lines: ${journal.lines.length}`);

        journal.lines.forEach((line, idx) => {
          console.log(`      Line ${idx + 1}: ${line.accountCode} - ${line.accountName}`);
          console.log(`         Debit:  R${line.debit.toFixed(2)}`);
          console.log(`         Credit: R${line.credit.toFixed(2)}`);
          journalDebits += line.debit;
          journalCredits += line.credit;
        });
      });

      console.log(`\n   📊 JOURNAL TOTALS:`);
      console.log(`      Total Debits:  R${journalDebits.toFixed(2)}`);
      console.log(`      Total Credits: R${journalCredits.toFixed(2)}`);
      console.log(`      Difference: R${Math.abs(journalDebits - journalCredits).toFixed(2)}`);
      console.log(`      Balanced: ${Math.abs(journalDebits - journalCredits) < 0.01 ? '✅' : '❌'}\n`);

      // Check actual staging GL entries
      const glSnapshot = await db.collection('staging_general_ledger')
        .where('bankImportSessionId', '==', sessionId)
        .get();

      console.log('📊 ACTUAL GL ENTRIES:');
      console.log(`   Count: ${glSnapshot.size}\n`);

      let glDebits = 0;
      let glCredits = 0;
      const accountSummary = new Map();

      glSnapshot.forEach(doc => {
        const gl = doc.data();
        glDebits += gl.debit;
        glCredits += gl.credit;

        const accountKey = gl.accountCode;
        if (!accountSummary.has(accountKey)) {
          accountSummary.set(accountKey, {
            accountCode: gl.accountCode,
            accountName: gl.accountName,
            debits: 0,
            credits: 0,
            count: 0
          });
        }

        const summary = accountSummary.get(accountKey);
        summary.debits += gl.debit;
        summary.credits += gl.credit;
        summary.count += 1;
      });

      console.log('   📊 GL TOTALS:');
      console.log(`      Total Debits:  R${glDebits.toFixed(2)}`);
      console.log(`      Total Credits: R${glCredits.toFixed(2)}`);
      console.log(`      Difference: R${Math.abs(glDebits - glCredits).toFixed(2)}`);
      console.log(`      Balanced: ${Math.abs(glDebits - glCredits) < 0.01 ? '✅' : '❌'}\n`);

      console.log('   📈 ACCOUNT BREAKDOWN:');
      for (const [accountCode, summary] of accountSummary.entries()) {
        console.log(`      ${accountCode} - ${summary.accountName}`);
        console.log(`         Debits:  R${summary.debits.toFixed(2)} (${summary.count} entries)`);
        console.log(`         Credits: R${summary.credits.toFixed(2)} (${summary.count} entries)`);
        console.log(`         Net: R${(summary.debits - summary.credits).toFixed(2)}`);
      }

      console.log('\n   🔍 COMPARISON:');
      console.log(`      Session Debits:  R${sessionData.staging.totalDebits.toFixed(2)}`);
      console.log(`      Actual GL Debits:  R${glDebits.toFixed(2)}`);
      console.log(`      Difference: R${Math.abs(sessionData.staging.totalDebits - glDebits).toFixed(2)}`);

      if (Math.abs(sessionData.staging.totalDebits - glDebits) > 0.01) {
        console.log(`      ⚠️  MISMATCH DETECTED!`);

        // Check for duplication
        const ratio = glDebits / sessionData.staging.totalDebits;
        console.log(`      📊 Ratio (Actual/Expected): ${ratio.toFixed(2)}x`);

        if (Math.abs(ratio - 2) < 0.01) {
          console.log(`      ❌ DATA APPEARS TO BE DOUBLED!`);
        } else if (Math.abs(ratio - 4) < 0.01) {
          console.log(`      ❌ DATA APPEARS TO BE QUADRUPLED!`);
        }
      } else {
        console.log(`      ✅ Totals match!`);
      }

      console.log('\n');
    }

    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the verification
verifyStagingTotals()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
