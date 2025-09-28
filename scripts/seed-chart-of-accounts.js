#!/usr/bin/env node

const path = require('path');
const admin = require('firebase-admin');

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'scripts/service-account.json';
const serviceAccount = require(path.isAbsolute(serviceAccountPath) ? serviceAccountPath : path.join(process.cwd(), serviceAccountPath));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function ensureChart(companyId, name = 'Default Chart', currency = 'USD') {
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

  const now = admin.firestore.Timestamp.now();
  const docRef = await db.collection('accounting_charts').add({
    tenantId: companyId,
    name,
    currency,
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`Created chart ${docRef.id} for ${companyId}`);
  return docRef.id;
}

async function main() {
  const [companyId, chartName, currency] = process.argv.slice(2);

  if (!companyId) {
    console.error('Usage: node scripts/seed-chart-of-accounts.js <companyId> [chartName] [currency]');
    process.exit(1);
  }

  try {
    const chartId = await ensureChart(companyId, chartName || 'Default Chart', currency || 'USD');
    console.log('Done. Chart ID:', chartId);
  } catch (error) {
    console.error('Failed to seed chart:', error);
    process.exit(1);
  }
}

main();
