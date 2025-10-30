#!/usr/bin/env node

/**
 * View current Chart of Accounts for a company
 * Usage: node scripts/view-current-coa.js <companyId>
 */

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
                           process.env.GOOGLE_APPLICATION_CREDENTIALS ||
                           'service-account.json';
const serviceAccount = require(path.isAbsolute(serviceAccountPath) ?
                               serviceAccountPath :
                               path.join(process.cwd(), serviceAccountPath));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function main() {
  const [companyId] = process.argv.slice(2);

  if (!companyId) {
    console.error('Usage: node scripts/view-current-coa.js <companyId>');
    process.exit(1);
  }

  try {
    // Get chart
    const chartsQuery = await db
      .collection('accounting_charts')
      .where('tenantId', '==', companyId)
      .limit(1)
      .get();

    if (chartsQuery.empty) {
      console.log(`❌ No chart found for company ${companyId}`);
      console.log('\nCreate one with:');
      console.log(`npm run seed:charts ${companyId}`);
      return;
    }

    const chartDoc = chartsQuery.docs[0];
    const chartData = chartDoc.data();
    console.log(`\n📊 Chart: ${chartData.name} (${chartDoc.id})`);
    console.log(`   Currency: ${chartData.currency}`);
    console.log(`   Created: ${chartData.createdAt?.toDate().toISOString().split('T')[0]}`);

    // Get accounts
    const accountsQuery = await db
      .collection('accounting_accounts')
      .where('tenantId', '==', companyId)
      .where('chartId', '==', chartDoc.id)
      .get();

    if (accountsQuery.empty) {
      console.log('\n❌ No accounts found for this chart');
      console.log('\nSeed accounts with:');
      console.log(`npm run seed:charts:industry ${companyId} <industry>`);
      return;
    }

    const accounts = accountsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort by code
    accounts.sort((a, b) => (a.code || '').localeCompare(b.code || ''));

    console.log(`\n📋 Accounts: ${accounts.length} total\n`);

    // Group by type
    const byType = accounts.reduce((acc, account) => {
      const type = account.type || 'unknown';
      if (!acc[type]) acc[type] = [];
      acc[type].push(account);
      return acc;
    }, {});

    // Display summary
    console.log('Summary by Type:');
    Object.keys(byType).sort().forEach(type => {
      console.log(`  ${type.padEnd(12)} : ${byType[type].length} accounts`);
    });

    // Show first 10 accounts as sample
    console.log('\n📝 Sample Accounts (first 10):');
    console.log(''.padEnd(80, '-'));
    console.log('Code    | Name                                | Type       | Depth');
    console.log(''.padEnd(80, '-'));

    accounts.slice(0, 10).forEach(account => {
      const code = (account.code || '').padEnd(8);
      const name = (account.name || '').slice(0, 35).padEnd(35);
      const type = (account.type || '').padEnd(10);
      const depth = account.hierarchy?.depth ?? '?';
      console.log(`${code}| ${name} | ${type} | ${depth}`);
    });

    if (accounts.length > 10) {
      console.log(`... and ${accounts.length - 10} more accounts`);
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
