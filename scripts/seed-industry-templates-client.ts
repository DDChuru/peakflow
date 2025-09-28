#!/usr/bin/env node

/**
 * Seed Industry Templates to Firestore using Client SDK
 * This version uses the client-side Firebase SDK to seed templates
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import all templates
import { INDUSTRY_TEMPLATES } from '../src/lib/accounting/industry-knowledge-base.js';
import { EXTENDED_INDUSTRY_TEMPLATES } from '../src/lib/accounting/industry-templates-extended.js';
import { BEAUTY_INDUSTRY_TEMPLATES } from '../src/lib/accounting/industry-templates-beauty.js';
import { PHARMACEUTICAL_TEMPLATES } from '../src/lib/accounting/industry-templates-pharmaceutical.js';

// Combine all templates
const ALL_TEMPLATES = {
  ...INDUSTRY_TEMPLATES,
  ...EXTENDED_INDUSTRY_TEMPLATES,
  ...BEAUTY_INDUSTRY_TEMPLATES,
  ...PHARMACEUTICAL_TEMPLATES
};

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'seed';
const flags = {
  overwrite: args.includes('--overwrite'),
  dryRun: args.includes('--dry-run'),
  confirm: args.includes('--confirm')
};

async function listTemplates() {
  console.log('📋 Fetching templates from Firestore...\n');

  try {
    const templatesRef = collection(db, 'industryTemplates');
    const snapshot = await getDocs(query(templatesRef));

    if (snapshot.empty) {
      console.log('No templates found in database.');
      return;
    }

    console.log(`Found ${snapshot.size} templates:\n`);

    snapshot.forEach((doc) => {
      const data = doc.data();
      const metadata = data.metadata || {};
      console.log(`  ${doc.id}:`);
      console.log(`    Name: ${data.name}`);
      console.log(`    Category: ${data.category}`);
      console.log(`    Accounts: ${metadata.accountCount || 0}`);
      console.log(`    Patterns: ${metadata.patternCount || 0}`);
      console.log(`    Vendors: ${metadata.vendorCount || 0}`);
      console.log(`    Created: ${data.createdAt?.toDate?.() || 'Unknown'}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing templates:', error.message);
    process.exit(1);
  }
}

async function clearTemplates() {
  if (!flags.confirm) {
    console.error('⚠️  Warning: This will delete all templates from the database!');
    console.error('   Use --confirm flag to proceed.');
    process.exit(1);
  }

  console.log('🗑️  Clearing all templates...\n');

  try {
    const templatesRef = collection(db, 'industryTemplates');
    const snapshot = await getDocs(query(templatesRef));

    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    if (count === 0) {
      console.log('No templates to delete.');
      return;
    }

    await batch.commit();
    console.log(`✅ Deleted ${count} templates.`);

    // Also clear indexes
    const indexesRef = collection(db, 'industryTemplateIndexes');
    const indexSnapshot = await getDocs(query(indexesRef));

    const indexBatch = writeBatch(db);
    let indexCount = 0;

    indexSnapshot.forEach((doc) => {
      indexBatch.delete(doc.ref);
      indexCount++;
    });

    if (indexCount > 0) {
      await indexBatch.commit();
      console.log(`✅ Deleted ${indexCount} index entries.`);
    }

  } catch (error) {
    console.error('❌ Error clearing templates:', error.message);
    process.exit(1);
  }
}

async function seedTemplates() {
  console.log('🌱 Starting Industry Template Seeding...');
  console.log(`Options: { overwrite: ${flags.overwrite}, dryRun: ${flags.dryRun} }`);
  console.log(`Found ${Object.keys(ALL_TEMPLATES).length} templates to seed\n`);

  if (flags.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  let seededCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const [templateId, template] of Object.entries(ALL_TEMPLATES)) {
    try {
      console.log(`Processing template: ${templateId}...`);

      const docRef = doc(db, 'industryTemplates', templateId);

      // Check if exists
      if (!flags.overwrite && !flags.dryRun) {
        const existingDoc = await getDocs(query(collection(db, 'industryTemplates')));
        const exists = existingDoc.docs.some(d => d.id === templateId);

        if (exists) {
          console.log(`  ⏭️  Skipped (already exists)`);
          skippedCount++;
          continue;
        }
      }

      // Prepare template data
      const templateData = {
        id: templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        version: '1.0.0',
        isActive: true,
        isDefault: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: 'system',
        usageCount: 0,

        // Store as JSON strings for performance
        chartOfAccounts: JSON.stringify(template.chartOfAccounts),
        transactionPatterns: JSON.stringify(template.transactionPatterns),
        commonVendors: JSON.stringify(template.commonVendors),
        kpis: JSON.stringify(template.kpis),

        // Direct arrays
        reportingRequirements: template.reportingRequirements || [],
        regulatoryCompliance: template.regulatoryCompliance || [],
        typicalRevenueSources: template.typicalRevenueSources || [],
        typicalExpenseCategories: template.typicalExpenseCategories || [],

        // Metadata
        metadata: {
          accountCount: template.chartOfAccounts?.length || 0,
          patternCount: template.transactionPatterns?.length || 0,
          vendorCount: template.commonVendors?.length || 0,
          kpiCount: template.kpis?.length || 0
        }
      };

      if (!flags.dryRun) {
        await setDoc(docRef, templateData);
        console.log(`  ✅ Seeded successfully`);

        // Also create index entries for accounts
        const indexBatch = writeBatch(db);
        let indexCount = 0;

        for (const account of template.chartOfAccounts || []) {
          const indexRef = doc(collection(db, 'industryTemplateIndexes'));
          indexBatch.set(indexRef, {
            templateId,
            code: account.code,
            name: account.name,
            type: account.type,
            parentCode: account.parentCode || null,
            keywords: account.mappingKeywords || [],
            createdAt: serverTimestamp()
          });
          indexCount++;

          // Process children recursively
          if (account.children) {
            for (const child of account.children) {
              const childIndexRef = doc(collection(db, 'industryTemplateIndexes'));
              indexBatch.set(childIndexRef, {
                templateId,
                code: child.code,
                name: child.name,
                type: child.type,
                parentCode: account.code,
                keywords: child.mappingKeywords || [],
                createdAt: serverTimestamp()
              });
              indexCount++;
            }
          }
        }

        if (indexCount > 0) {
          await indexBatch.commit();
          console.log(`  📇 Created ${indexCount} index entries`);
        }

        seededCount++;
      } else {
        console.log(`  🔍 Would seed (dry run)`);
        seededCount++;
      }

    } catch (error) {
      console.error(`  ❌ Error seeding ${templateId}:`, error.message);
      errorCount++;
    }

    console.log('');
  }

  // Summary
  console.log('═══════════════════════════════════════');
  console.log('📊 Seeding Summary:');
  console.log(`  ✅ Seeded: ${seededCount} templates`);
  console.log(`  ⏭️  Skipped: ${skippedCount} templates`);
  console.log(`  ❌ Errors: ${errorCount} templates`);
  console.log('═══════════════════════════════════════');

  if (!flags.dryRun) {
    console.log('\n✨ Industry templates have been seeded to Firestore!');
    console.log('   You can now apply these templates to companies.');
  } else {
    console.log('\n🔍 Dry run complete. Use without --dry-run to apply changes.');
  }
}

// Main execution
async function main() {
  try {
    console.log('🔧 Firebase Project:', firebaseConfig.projectId);
    console.log('');

    switch (command) {
      case 'list':
        await listTemplates();
        break;
      case 'clear':
        await clearTemplates();
        break;
      case 'seed':
      default:
        await seedTemplates();
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);