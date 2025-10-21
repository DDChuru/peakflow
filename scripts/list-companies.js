#!/usr/bin/env node

/**
 * List all companies in Firestore
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

async function listCompanies() {
  console.log('\n📋 Listing all companies...\n');

  const companiesSnapshot = await db.collection('companies').get();

  if (companiesSnapshot.empty) {
    console.log('❌ No companies found');
    return;
  }

  console.log(`Found ${companiesSnapshot.size} companies:\n`);

  companiesSnapshot.docs.forEach((doc, idx) => {
    const data = doc.data();
    console.log(`${idx + 1}. ${data.name || 'Unnamed'}`);
    console.log(`   ID: ${doc.id}`);
    console.log(`   Type: ${data.type || 'N/A'}`);
    console.log('');
  });
}

listCompanies().catch(console.error);
