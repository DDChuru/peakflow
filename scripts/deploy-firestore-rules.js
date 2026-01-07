#!/usr/bin/env node
/**
 * Deploy Firestore Rules using Service Account
 * This script bypasses Firebase CLI authentication by using the service account directly
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize with service account
const serviceAccountPath = path.join(__dirname, '..', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ Service account file not found:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
}

async function deployRules() {
  const projectId = serviceAccount.project_id;
  const rulesPath = path.join(__dirname, '..', 'firestore.rules');

  console.log('🔐 Deploying Firestore Rules...');
  console.log(`   Project: ${projectId}`);
  console.log(`   Rules file: ${rulesPath}`);
  console.log('');

  // Read the rules file
  if (!fs.existsSync(rulesPath)) {
    console.error('❌ Rules file not found:', rulesPath);
    process.exit(1);
  }

  const rulesContent = fs.readFileSync(rulesPath, 'utf8');
  console.log(`✅ Read ${rulesContent.length} characters from firestore.rules`);

  // Get access token from service account
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: ['https://www.googleapis.com/auth/firebase', 'https://www.googleapis.com/auth/cloud-platform']
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;

  console.log('✅ Authenticated with service account');

  // Create ruleset via REST API
  const createRulesetUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`;

  const rulesetPayload = {
    source: {
      files: [{
        name: 'firestore.rules',
        content: rulesContent
      }]
    }
  };

  console.log('📤 Creating new ruleset...');

  const createResponse = await fetch(createRulesetUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(rulesetPayload)
  });

  if (!createResponse.ok) {
    const errorText = await createResponse.text();
    console.error('❌ Failed to create ruleset:', createResponse.status, errorText);
    process.exit(1);
  }

  const rulesetResult = await createResponse.json();
  console.log('✅ Ruleset created:', rulesetResult.name);

  // Release the ruleset to Firestore
  const releaseName = `projects/${projectId}/releases/cloud.firestore`;
  const releaseUrl = `https://firebaserules.googleapis.com/v1/${releaseName}`;

  // Payload must be wrapped in 'release' object for PATCH
  const releasePayload = {
    release: {
      name: releaseName,
      rulesetName: rulesetResult.name
    }
  };

  console.log('📤 Deploying ruleset to Firestore...');

  let releaseResponse = await fetch(releaseUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(releasePayload)
  });

  // If PATCH fails (release doesn't exist), try POST to create it
  if (!releaseResponse.ok && releaseResponse.status === 404) {
    console.log('📤 Release not found, creating new release...');
    const createReleaseUrl = `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases`;
    // For POST, use unwrapped payload
    const createPayload = {
      name: releaseName,
      rulesetName: rulesetResult.name
    };
    releaseResponse = await fetch(createReleaseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });
  }

  if (!releaseResponse.ok) {
    const errorText = await releaseResponse.text();
    console.error('❌ Failed to deploy ruleset:', releaseResponse.status, errorText);
    process.exit(1);
  }

  const releaseResult = await releaseResponse.json();
  console.log('');
  console.log('🎉 Firestore rules deployed successfully!');
  console.log('   Release:', releaseResult.name);
  console.log('   Ruleset:', releaseResult.rulesetName);
  console.log('');
  console.log('Changes deployed:');
  console.log('  - Debtors collection: admins/developers can now create/update in any workspace');
  console.log('  - Creditors collection: admins/developers can now create/update in any workspace');
}

deployRules().catch(err => {
  console.error('❌ Deployment failed:', err.message);
  process.exit(1);
});
