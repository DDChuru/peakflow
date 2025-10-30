#!/usr/bin/env node

/**
 * Verify that all 20 industry templates are loaded correctly
 */

import { GENERATED_INDUSTRY_TEMPLATES } from '../src/lib/accounting/industry-templates-generated.js';

console.log('✅ Verifying Industry Templates...\n');

const expectedIndustries = [
  'restaurant',
  'saas',
  'professional-services',
  'cleaning-services',
  'financial-services',
  'consulting',
  'pest-control',
  'retail',
  'beauty-services',
  'barbershop',
  'nail-salon',
  'pharmacy',
  'medical-practice',
  'education',
  'general-dealers',
  'automation',
  'printing',
  'event-management',
  'law-firms',
  'universal'
];

const loadedIndustries = Object.keys(GENERATED_INDUSTRY_TEMPLATES);

console.log(`Expected: ${expectedIndustries.length} industries`);
console.log(`Loaded:   ${loadedIndustries.length} industries\n`);

if (loadedIndustries.length !== expectedIndustries.length) {
  console.error('❌ MISMATCH: Template count does not match!');
  process.exit(1);
}

// Check each industry
let errors = 0;
expectedIndustries.forEach(id => {
  const template = GENERATED_INDUSTRY_TEMPLATES[id];
  if (!template) {
    console.error(`❌ Missing industry: ${id}`);
    errors++;
    return;
  }

  const accountCount = template.chartOfAccounts?.length || 0;
  console.log(`✅ ${id.padEnd(25)} : ${template.name.padEnd(35)} (${accountCount} accounts)`);

  // Verify essential fields
  if (!template.name || !template.description || !template.category) {
    console.error(`   ⚠️  Missing required fields`);
    errors++;
  }

  if (accountCount === 0) {
    console.error(`   ⚠️  No accounts defined!`);
    errors++;
  }
});

console.log('');

if (errors > 0) {
  console.error(`❌ Verification failed with ${errors} errors`);
  process.exit(1);
}

console.log('✅ All 20 industry templates verified successfully!');
console.log('\nSummary by industry:');

// Group by category
const byCategory = {};
Object.entries(GENERATED_INDUSTRY_TEMPLATES).forEach(([id, template]) => {
  const cat = template.category || 'unknown';
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push({ id, name: template.name, accounts: template.chartOfAccounts?.length || 0 });
});

Object.entries(byCategory).forEach(([category, industries]) => {
  console.log(`\n${category.toUpperCase()}:`);
  industries.forEach(({ id, name, accounts }) => {
    console.log(`  - ${name.padEnd(30)} (${accounts} accounts)`);
  });
});
