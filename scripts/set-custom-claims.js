#!/usr/bin/env node

const path = require('path');
const admin = require('firebase-admin');

function resolveServiceAccountPath() {
  const fromEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || 'scripts/service-account.json';
  return path.isAbsolute(fromEnv) ? fromEnv : path.join(process.cwd(), fromEnv);
}

function usage() {
  console.log('Usage: node scripts/set-custom-claims.js <uid> <role1> [role2] ...');
}

async function main() {
  const [uid, ...roles] = process.argv.slice(2);

  if (!uid || roles.length === 0) {
    usage();
    process.exit(1);
  }

  const serviceAccountPath = resolveServiceAccountPath();
  const serviceAccount = require(serviceAccountPath);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  const uniqueRoles = Array.from(new Set(roles));

  await admin.auth().setCustomUserClaims(uid, { roles: uniqueRoles });
  console.log(`Updated custom claims for ${uid}: ${uniqueRoles.join(', ')}`);
}

main().catch((error) => {
  console.error('Failed to set custom claims:', error);
  process.exit(1);
});
