#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!fromEnv) {
    return null;
  }
  const absolute = path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
  return absolute;
}

async function initialiseAdmin() {
  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS environment variable.');
  }

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at ${serviceAccountPath}`);
  }

  const credential = admin.credential.cert(require(serviceAccountPath));

  admin.initializeApp({
    credential,
  });

  return admin.firestore();
}

function buildSeedProfiles(company) {
  const name = company?.name || 'Company';
  const baseCurrency = (company?.currency || company?.defaultCurrency || 'USD').toUpperCase();
  return [
    {
      idSuffix: 'operating',
      name: `${name} Operating Account`,
      nickname: 'Operating',
      bankName: 'First National Bank',
      accountNumber: '1000012345',
      accountType: 'checking',
      currency: baseCurrency,
      branch: 'Head Office',
      country: 'ZA',
      isPrimary: true,
      openingBalance: 253450.75,
      desiredCodes: ['1000', '1100', '1010'],
    },
    {
      idSuffix: 'savings',
      name: `${name} Reserve Savings`,
      nickname: 'Reserve Savings',
      bankName: 'Peak Savings Bank',
      accountNumber: '2000056789',
      accountType: 'savings',
      currency: baseCurrency,
      branch: 'Sandton',
      country: 'ZA',
      isPrimary: false,
      openingBalance: 90340.12,
      desiredCodes: ['1200', '1300', '1005'],
    },
    {
      idSuffix: 'card',
      name: `${name} Corporate Card`,
      nickname: 'Corporate Card',
      bankName: 'Velocity Credit',
      accountNumber: '4444555566667777',
      accountType: 'credit-card',
      currency: baseCurrency,
      branch: 'Cape Town',
      country: 'ZA',
      isPrimary: false,
      openingBalance: -12450.32,
      desiredCodes: ['1400', '1410', '1999'],
    },
  ];
}

function pickAccountDoc(accountDocs, desiredCodes) {
  const byCode = new Map();
  for (const doc of accountDocs) {
    const data = doc.data();
    if (data?.code) {
      byCode.set(String(data.code), doc);
    }
  }

  for (const code of desiredCodes) {
    if (byCode.has(code)) {
      return byCode.get(code);
    }
  }

  return accountDocs[0];
}

async function seedForCompany(db, company) {
  const companyId = company.id;
  const companyName = company.name || companyId;
  console.log(`\nSeeding bank accounts for ${companyName} (${companyId})`);

  const assetAccountsSnapshot = await db
    .collection('accounting_accounts')
    .where('tenantId', '==', companyId)
    .where('type', '==', 'asset')
    .limit(25)
    .get();

  if (assetAccountsSnapshot.empty) {
    console.warn(`  ⚠️  No asset accounts found for ${companyId}; skipping.`);
    return;
  }

  const accountDocs = assetAccountsSnapshot.docs;
  const bankAccountsRef = db.collection(`companies/${companyId}/bankAccounts`);
  const seeds = buildSeedProfiles(company);
  const now = admin.firestore.Timestamp.now();
  let createdCount = 0;

  for (const seed of seeds) {
    const accountDoc = pickAccountDoc(accountDocs, seed.desiredCodes);
    if (!accountDoc) {
      console.warn(`  ⚠️  Unable to resolve GL account for seed ${seed.idSuffix}; skipping.`);
      continue;
    }

    const glAccountId = accountDoc.id;
    const bankDocId = `bankAccount-${seed.idSuffix}`;
    const bankDocRef = bankAccountsRef.doc(bankDocId);
    const existing = await bankDocRef.get();
    if (existing.exists) {
      console.log(`  ⏭️  Bank account ${bankDocId} already exists; leaving unchanged.`);
      continue;
    }

    const capitalisedNickname = seed.nickname;
    const bankAccountData = {
      companyId,
      name: seed.name,
      accountNumber: seed.accountNumber,
      accountNumberMasked: maskAccountNumber(seed.accountNumber),
      accountType: seed.accountType,
      bankName: seed.bankName,
      branch: seed.branch,
      country: seed.country,
      currency: seed.currency,
      glAccountId,
      isPrimary: seed.isPrimary,
      status: 'active',
      signatories: [],
      balance: {
        ledger: Number(seed.openingBalance.toFixed(2)),
        currency: seed.currency,
        asOf: now,
      },
      approvalThreshold: null,
      limits: null,
      integration: null,
      lastReconciledAt: now,
      lastStatementAt: now,
      metadata: {
        nickname: capitalisedNickname,
        seededAt: now,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: 'seed-script',
      updatedBy: 'seed-script',
    };

    await bankDocRef.set(bankAccountData, { merge: true });

    const accountData = accountDoc.data() || {};
    const metadata = accountData.metadata || {};
    metadata.banking = {
      enabled: true,
      bankAccountId: bankDocId,
      preferredCurrency: seed.currency,
    };

    await accountDoc.ref.set({ metadata }, { merge: true });
    createdCount += 1;
    console.log(`  ✅  Created ${bankDocId} linked to GL ${glAccountId}`);
  }

  if (createdCount === 0) {
    console.log('  ℹ️  No new bank accounts created (all seeds already present).');
  }
}

function maskAccountNumber(accountNumber) {
  if (!accountNumber) return '••••';
  const digits = String(accountNumber).replace(/\D/g, '');
  if (digits.length <= 4) {
    return `•••• ${digits}`;
  }
  return `•••• ${digits.slice(-4)}`;
}

async function fetchCompanies(db, requestedIds) {
  if (requestedIds?.length) {
    const snapshots = await Promise.all(
      requestedIds.map((id) => db.collection('companies').doc(id).get())
    );
    return snapshots
      .filter((snap) => snap.exists)
      .map((snap) => ({ id: snap.id, ...snap.data() }));
  }

  const snapshot = await db.collection('companies').limit(10).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function main() {
  try {
    const db = await initialiseAdmin();
    const requestedIds = (process.env.SEED_COMPANY_IDS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const companies = await fetchCompanies(db, requestedIds);

    if (!companies.length) {
      console.log('No companies found. Nothing to seed.');
      return;
    }

    for (const company of companies) {
      await seedForCompany(db, company);
    }

    console.log('\nSeeding complete.');
  } catch (error) {
    console.error('\nFailed to seed bank accounts:');
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

main();
