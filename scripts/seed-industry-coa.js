#!/usr/bin/env node

/**
 * Seed industry-specific Chart of Accounts
 * Usage: node scripts/seed-industry-coa.js <companyId> <industry> [currency]
 *
 * Available industries:
 * - restaurant, saas, professional-services, cleaning-services, etc.
 */

const path = require('path');
const fs = require('fs');
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

// Load comprehensive industry COA
const coaPath = path.join(process.cwd(), 'comprehensive_industry_coa (1).json');
const coaData = JSON.parse(fs.readFileSync(coaPath, 'utf-8'));

/**
 * Map account type from JSON to TypeScript enum
 */
function mapAccountType(accountType) {
  const mapping = {
    'Asset': 'asset',
    'Liability': 'liability',
    'Equity': 'equity',
    'Revenue': 'revenue',
    'Cost of Goods Sold': 'expense', // COGS treated as expense
    'Operating Expense': 'expense',
    'Other Expense': 'expense',
    'Special Accounts': 'expense' // Special accounts treated as expense
  };

  return mapping[accountType] || 'expense';
}

/**
 * Determine normal balance based on account type
 */
function getNormalBalance(type) {
  return ['asset', 'expense'].includes(type) ? 'debit' : 'credit';
}

/**
 * Extract parent account from account number (e.g., 1010 -> 1000)
 */
function getParentAccountNumber(accountNumber) {
  const num = parseInt(accountNumber);
  // Round down to nearest hundred for parent
  const parent = Math.floor(num / 100) * 100;
  return parent === num ? null : parent.toString().padStart(4, '0');
}

/**
 * Calculate hierarchy depth (1000 = depth 0, 1010 = depth 1)
 */
function getHierarchyDepth(accountNumber) {
  const num = parseInt(accountNumber);
  if (num % 100 === 0 && num % 1000 === 0) return 0; // e.g., 1000
  if (num % 10 === 0) return 1; // e.g., 1010, 1020
  return 2; // e.g., 1015
}

/**
 * Build hierarchy path (e.g., "1000/1010")
 */
function buildHierarchyPath(accountNumber, allAccounts) {
  const path = [accountNumber];
  let current = accountNumber;

  while (true) {
    const parent = getParentAccountNumber(current);
    if (!parent || parent === current) break;

    // Check if parent exists in account list
    const parentExists = allAccounts.some(acc => acc.accountNumber === parent);
    if (parentExists) {
      path.unshift(parent);
      current = parent;
    } else {
      break;
    }
  }

  return path.join('/');
}

/**
 * Ensure chart exists or create new one
 */
async function ensureChart(companyId, industry, currency = 'USD') {
  const existing = await db
    .collection('accounting_charts')
    .where('tenantId', '==', companyId)
    .limit(1)
    .get();

  if (!existing.empty) {
    const doc = existing.docs[0];
    console.log(`Chart already exists (${doc.id}) for ${companyId}`);
    return doc.id;
  }

  const industryData = coaData.industries[industry];
  const chartName = `${industryData?.name || 'Default'} Chart of Accounts`;

  const now = admin.firestore.Timestamp.now();
  const docRef = await db.collection('accounting_charts').add({
    tenantId: companyId,
    name: chartName,
    currency,
    isDefault: true,
    industry: industry,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created chart ${docRef.id} for ${companyId} (${chartName})`);
  return docRef.id;
}

/**
 * Seed accounts for industry
 */
async function seedAccounts(companyId, chartId, industry) {
  const industryData = coaData.industries[industry];

  if (!industryData) {
    throw new Error(`Industry "${industry}" not found. Available: ${Object.keys(coaData.industries).join(', ')}`);
  }

  const accounts = industryData.accounts;
  console.log(`Seeding ${accounts.length} accounts for ${industryData.name}...`);

  // Check existing accounts
  const existingQuery = await db
    .collection('accounting_accounts')
    .where('tenantId', '==', companyId)
    .where('chartId', '==', chartId)
    .get();

  const existingCodes = new Set(existingQuery.docs.map(doc => doc.data().code));
  console.log(`Found ${existingCodes.size} existing accounts`);

  const now = admin.firestore.Timestamp.now();
  const batch = db.batch();
  let added = 0;
  let skipped = 0;

  // First pass: create all accounts (to build hierarchy)
  const accountMap = new Map();
  accounts.forEach(account => {
    accountMap.set(account.accountNumber, account);
  });

  for (const account of accounts) {
    if (existingCodes.has(account.accountNumber)) {
      skipped++;
      continue;
    }

    const type = mapAccountType(account.accountType);
    const parentNumber = getParentAccountNumber(account.accountNumber);
    const depth = getHierarchyDepth(account.accountNumber);
    const hierarchyPath = buildHierarchyPath(account.accountNumber, accounts);

    const accountRecord = {
      tenantId: companyId,
      chartId: chartId,
      code: account.accountNumber,
      name: account.accountName,
      type: type,
      description: account.description || '',
      hierarchy: {
        parentId: parentNumber,
        path: hierarchyPath,
        depth: depth
      },
      metadata: {
        normalBalance: getNormalBalance(type),
        isPostingAllowed: depth > 0, // Only leaf accounts can post
        isTaxRelevant: account.category?.includes('Tax') || false,
        tags: [account.category].filter(Boolean)
      },
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    const docRef = db.collection('accounting_accounts').doc();
    batch.set(docRef, accountRecord);
    added++;

    // Commit in batches of 500 (Firestore limit)
    if (added % 500 === 0) {
      await batch.commit();
      console.log(`Committed ${added} accounts...`);
    }
  }

  // Commit remaining
  if (added % 500 !== 0) {
    await batch.commit();
  }

  console.log(`✅ Seeding complete:`);
  console.log(`   Added: ${added} accounts`);
  console.log(`   Skipped: ${skipped} accounts (already exist)`);
  console.log(`   Total: ${accounts.length} accounts`);

  return { added, skipped };
}

async function main() {
  const [companyId, industry, currency] = process.argv.slice(2);

  if (!companyId || !industry) {
    console.error('Usage: node scripts/seed-industry-coa.js <companyId> <industry> [currency]');
    console.error('\nAvailable industries:');
    Object.keys(coaData.industries).forEach(key => {
      console.error(`  - ${key}: ${coaData.industries[key].name}`);
    });
    process.exit(1);
  }

  try {
    const chartId = await ensureChart(companyId, industry, currency || 'USD');
    await seedAccounts(companyId, chartId, industry);
    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Failed to seed chart:', error.message);
    process.exit(1);
  }
}

main();
