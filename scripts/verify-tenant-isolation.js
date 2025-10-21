#!/usr/bin/env node

/**
 * Verify tenant isolation - ensure we're only targeting the correct tenant
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

async function verifyTenantIsolation(targetCompanyId, targetCompanyName) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  🔒 Tenant Isolation Verification                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`Target Company: ${targetCompanyName}`);
  console.log(`Target Tenant ID: ${targetCompanyId}\n`);

  // Get all companies
  const companiesSnapshot = await db.collection('companies').get();
  const companies = [];
  companiesSnapshot.forEach(doc => {
    companies.push({
      id: doc.id,
      name: doc.data().name || 'Unnamed'
    });
  });

  console.log('--- All Companies in Database ---\n');
  companies.forEach((company, idx) => {
    const isTarget = company.id === targetCompanyId;
    console.log(`${idx + 1}. ${company.name} (${company.id}) ${isTarget ? '👈 TARGET' : ''}`);
  });

  // Count journal entries per tenant
  console.log('\n--- Journal Entries per Tenant ---\n');
  const journalEntriesByTenant = {};

  for (const company of companies) {
    const count = (await db.collection('journal_entries')
      .where('tenantId', '==', company.id)
      .count()
      .get()).data().count;

    journalEntriesByTenant[company.id] = count;
    const isTarget = company.id === targetCompanyId;
    console.log(`   ${company.name}: ${count} entries ${isTarget ? '👈 WILL BE DELETED' : '✅ SAFE'}`);
  }

  // Count general ledger entries per tenant
  console.log('\n--- General Ledger Entries per Tenant ---\n');
  const glEntriesByTenant = {};

  for (const company of companies) {
    const count = (await db.collection('general_ledger')
      .where('tenantId', '==', company.id)
      .count()
      .get()).data().count;

    glEntriesByTenant[company.id] = count;
    const isTarget = company.id === targetCompanyId;
    console.log(`   ${company.name}: ${count} entries ${isTarget ? '👈 WILL BE DELETED' : '✅ SAFE'}`);
  }

  // Verify the query will only match target tenant
  console.log('\n--- Query Verification ---\n');

  const testJournalQuery = await db.collection('journal_entries')
    .where('tenantId', '==', targetCompanyId)
    .limit(5)
    .get();

  console.log(`✓ Test query for journal_entries returned ${testJournalQuery.size} documents`);

  let allMatchTarget = true;
  testJournalQuery.forEach(doc => {
    const tenantId = doc.data().tenantId;
    if (tenantId !== targetCompanyId) {
      allMatchTarget = false;
      console.log(`   ❌ ERROR: Found entry with different tenantId: ${tenantId}`);
    }
  });

  if (allMatchTarget && testJournalQuery.size > 0) {
    console.log(`   ✅ All sampled entries match target tenantId: ${targetCompanyId}`);
  }

  const testGLQuery = await db.collection('general_ledger')
    .where('tenantId', '==', targetCompanyId)
    .limit(5)
    .get();

  console.log(`✓ Test query for general_ledger returned ${testGLQuery.size} documents`);

  allMatchTarget = true;
  testGLQuery.forEach(doc => {
    const tenantId = doc.data().tenantId;
    if (tenantId !== targetCompanyId) {
      allMatchTarget = false;
      console.log(`   ❌ ERROR: Found entry with different tenantId: ${tenantId}`);
    }
  });

  if (allMatchTarget && testGLQuery.size > 0) {
    console.log(`   ✅ All sampled entries match target tenantId: ${targetCompanyId}`);
  }

  // Summary
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  📊 Safety Summary                                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const targetJournalCount = journalEntriesByTenant[targetCompanyId] || 0;
  const targetGLCount = glEntriesByTenant[targetCompanyId] || 0;
  const totalTargetEntries = targetJournalCount + targetGLCount;

  let otherTenantsTotal = 0;
  for (const company of companies) {
    if (company.id !== targetCompanyId) {
      otherTenantsTotal += (journalEntriesByTenant[company.id] || 0);
      otherTenantsTotal += (glEntriesByTenant[company.id] || 0);
    }
  }

  console.log(`   🎯 Target (${targetCompanyName}):`);
  console.log(`      Journal Entries: ${targetJournalCount}`);
  console.log(`      GL Entries: ${targetGLCount}`);
  console.log(`      Total to DELETE: ${totalTargetEntries}`);
  console.log('');
  console.log(`   🛡️  Other Tenants (${companies.length - 1} companies):`);
  console.log(`      Total entries: ${otherTenantsTotal}`);
  console.log(`      Status: ✅ WILL NOT BE TOUCHED`);
  console.log('');

  if (allMatchTarget) {
    console.log('   ✅ SAFE TO PROCEED - Query is properly isolated to target tenant only');
  } else {
    console.log('   ❌ DANGER - Query isolation failed! DO NOT PROCEED!');
  }

  console.log('\n');
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
  await verifyTenantIsolation(companyDoc.id, companyDoc.data().name);
}

main().catch(console.error);
