#!/usr/bin/env node

/**
 * Seed Industry Templates to Firestore
 *
 * Run this script to populate the database with industry templates:
 * npm run seed:industry-templates
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
let app;
let db;

try {
  // Check for service account key in environment
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;

  if (serviceAccountPath) {
    // Use service account for production
    const serviceAccount = require(path.resolve(serviceAccountPath));
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    });
  } else {
    // Use emulator for local development
    process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';
    app = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'peakflow-platform'
    });
    console.log('Using Firestore Emulator at:', process.env.FIRESTORE_EMULATOR_HOST);
  }

  db = getFirestore(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  process.exit(1);
}

// Import templates (we'll need to adjust imports for script context)
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

interface SeedOptions {
  overwrite?: boolean;
  templateIds?: string[];
  dryRun?: boolean;
}

async function seedIndustryTemplates(options: SeedOptions = {}) {
  const { overwrite = false, templateIds, dryRun = false } = options;

  console.log('🌱 Starting Industry Template Seeding...');
  console.log('Options:', { overwrite, templateIds, dryRun });

  const templatesToSeed = templateIds
    ? Object.entries(ALL_TEMPLATES).filter(([id]) => templateIds.includes(id))
    : Object.entries(ALL_TEMPLATES);

  console.log(`Found ${templatesToSeed.length} templates to seed`);

  const results = {
    seeded: [] as string[],
    skipped: [] as string[],
    errors: [] as string[]
  };

  for (const [templateId, template] of templatesToSeed) {
    try {
      const docRef = db.collection('industryTemplates').doc(templateId);
      const existing = await docRef.get();

      if (existing.exists && !overwrite) {
        console.log(`⏭️  Skipping ${templateId} (already exists)`);
        results.skipped.push(templateId);
        continue;
      }

      if (dryRun) {
        console.log(`🔍 [DRY RUN] Would seed template: ${templateId}`);
        console.log(`   - Name: ${template.name}`);
        console.log(`   - Accounts: ${countAccounts(template.chartOfAccounts)}`);
        console.log(`   - Patterns: ${template.transactionPatterns.length}`);
        console.log(`   - Vendors: ${template.commonVendors.length}`);
        results.seeded.push(templateId);
        continue;
      }

      const templateData = {
        id: templateId,
        name: template.name,
        description: template.description,
        category: template.category,
        version: '1.0.0',
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        usageCount: 0,

        // Store complex objects as JSON strings for better performance
        chartOfAccounts: JSON.stringify(template.chartOfAccounts),
        transactionPatterns: JSON.stringify(template.transactionPatterns),
        commonVendors: JSON.stringify(template.commonVendors),
        kpis: JSON.stringify(template.kpis),

        // Store arrays directly
        reportingRequirements: template.reportingRequirements,
        regulatoryCompliance: template.regulatoryCompliance || [],
        typicalRevenueSources: template.typicalRevenueSources,
        typicalExpenseCategories: template.typicalExpenseCategories,

        // Metadata
        metadata: {
          accountCount: countAccounts(template.chartOfAccounts),
          patternCount: template.transactionPatterns.length,
          vendorCount: template.commonVendors.length,
          kpiCount: template.kpis.length
        }
      };

      await docRef.set(templateData);

      console.log(`✅ Seeded template: ${templateId}`);
      console.log(`   - ${templateData.metadata.accountCount} accounts`);
      console.log(`   - ${templateData.metadata.patternCount} patterns`);
      console.log(`   - ${templateData.metadata.vendorCount} vendors`);

      results.seeded.push(templateId);

      // Also create indexes for better querying
      await createTemplateIndexes(templateId, template);

    } catch (error) {
      console.error(`❌ Error seeding ${templateId}:`, error);
      results.errors.push(`${templateId}: ${error}`);
    }
  }

  // Create summary document
  if (!dryRun && results.seeded.length > 0) {
    await db.collection('industryTemplates').doc('_metadata').set({
      lastSeeded: new Date(),
      totalTemplates: results.seeded.length,
      templates: results.seeded,
      version: '1.0.0'
    });
  }

  console.log('\n📊 Seeding Complete!');
  console.log(`✅ Seeded: ${results.seeded.length}`);
  console.log(`⏭️  Skipped: ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => console.log(`  - ${err}`));
  }

  return results;
}

/**
 * Create searchable indexes for templates
 */
async function createTemplateIndexes(templateId: string, template: any) {
  // Create account code index for quick lookups
  const batch = db.batch();

  const flattenAccounts = (accounts: any[], parentCode?: string): any[] => {
    let flat: any[] = [];
    for (const account of accounts) {
      flat.push({
        templateId,
        code: account.code,
        name: account.name,
        type: account.type,
        parentCode: parentCode || null,
        keywords: account.mappingKeywords || []
      });

      if (account.children) {
        flat = flat.concat(flattenAccounts(account.children, account.code));
      }
    }
    return flat;
  };

  const flatAccounts = flattenAccounts(template.chartOfAccounts);

  // Store flattened accounts for easier querying
  for (const account of flatAccounts) {
    const indexRef = db
      .collection('industryTemplateIndexes')
      .doc(`${templateId}_${account.code}`);

    batch.set(indexRef, {
      ...account,
      createdAt: new Date()
    });
  }

  await batch.commit();
  console.log(`   📇 Created ${flatAccounts.length} account indexes`);
}

/**
 * Count total accounts including children
 */
function countAccounts(accounts: any[]): number {
  let count = 0;
  const countRecursive = (accts: any[]) => {
    for (const account of accts) {
      count++;
      if (account.children) {
        countRecursive(account.children);
      }
    }
  };
  countRecursive(accounts);
  return count;
}

/**
 * List available templates in the database
 */
async function listTemplates() {
  console.log('\n📋 Listing Industry Templates in Database...\n');

  const snapshot = await db.collection('industryTemplates').get();

  if (snapshot.empty) {
    console.log('No templates found in database.');
    return;
  }

  const templates = snapshot.docs
    .filter(doc => doc.id !== '_metadata')
    .map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        category: data.category,
        accounts: data.metadata?.accountCount || 0,
        patterns: data.metadata?.patternCount || 0,
        vendors: data.metadata?.vendorCount || 0,
        usageCount: data.usageCount || 0
      };
    });

  console.table(templates);

  const metadata = await db.collection('industryTemplates').doc('_metadata').get();
  if (metadata.exists) {
    const meta = metadata.data();
    console.log(`\nLast seeded: ${meta?.lastSeeded?.toDate?.() || 'Unknown'}`);
    console.log(`Version: ${meta?.version || 'Unknown'}`);
  }
}

/**
 * Clear all templates from database
 */
async function clearTemplates() {
  console.log('\n🗑️  Clearing all industry templates...\n');

  const snapshot = await db.collection('industryTemplates').get();
  const batch = db.batch();

  snapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Also clear indexes
  const indexSnapshot = await db.collection('industryTemplateIndexes').get();
  indexSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`Deleted ${snapshot.size} templates and ${indexSnapshot.size} indexes`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0] || 'seed';

async function main() {
  try {
    switch (command) {
      case 'seed':
        await seedIndustryTemplates({
          overwrite: args.includes('--overwrite'),
          dryRun: args.includes('--dry-run'),
          templateIds: args.includes('--template')
            ? args[args.indexOf('--template') + 1]?.split(',')
            : undefined
        });
        break;

      case 'list':
        await listTemplates();
        break;

      case 'clear':
        if (args.includes('--confirm')) {
          await clearTemplates();
        } else {
          console.log('⚠️  Use --confirm flag to clear all templates');
        }
        break;

      default:
        console.log(`
📚 Industry Template Seeder

Usage: npm run seed:industry-templates [command] [options]

Commands:
  seed          Seed templates to database (default)
  list          List templates in database
  clear         Clear all templates from database

Options:
  --overwrite   Overwrite existing templates
  --dry-run     Show what would be seeded without making changes
  --template    Seed specific template(s) (comma-separated IDs)
  --confirm     Required for destructive operations

Examples:
  npm run seed:industry-templates
  npm run seed:industry-templates seed --overwrite
  npm run seed:industry-templates seed --template restaurant,saas
  npm run seed:industry-templates list
  npm run seed:industry-templates clear --confirm
        `);
    }

    process.exit(0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();