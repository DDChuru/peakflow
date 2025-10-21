/**
 * Script to create fiscal periods for multiple years
 *
 * Usage:
 *   tsx scripts/create-fiscal-periods.ts <companyId> <startYear> <numberOfYears> [fiscalYearStartMonth]
 *
 * Example:
 *   tsx scripts/create-fiscal-periods.ts my-company-id 2024 2 1
 *   This creates periods for 2024 and 2025, starting in January
 */

import { fiscalPeriodService } from '../src/lib/accounting/fiscal-period-service';

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 3) {
    console.error('Usage: tsx scripts/create-fiscal-periods.ts <companyId> <startYear> <numberOfYears> [fiscalYearStartMonth]');
    console.error('');
    console.error('Examples:');
    console.error('  tsx scripts/create-fiscal-periods.ts my-company-id 2024 2 1    # 2024-2025, Jan start');
    console.error('  tsx scripts/create-fiscal-periods.ts my-company-id 2023 3 7    # 2023-2025, July start');
    process.exit(1);
  }

  const companyId = args[0];
  const startYear = parseInt(args[1], 10);
  const numberOfYears = parseInt(args[2], 10);
  const fiscalYearStartMonth = args[3] ? parseInt(args[3], 10) : 1;

  if (isNaN(startYear) || isNaN(numberOfYears)) {
    console.error('Error: startYear and numberOfYears must be valid numbers');
    process.exit(1);
  }

  if (numberOfYears < 1 || numberOfYears > 10) {
    console.error('Error: numberOfYears must be between 1 and 10');
    process.exit(1);
  }

  if (fiscalYearStartMonth < 1 || fiscalYearStartMonth > 12) {
    console.error('Error: fiscalYearStartMonth must be between 1 and 12');
    process.exit(1);
  }

  console.log('🗓️  Creating Fiscal Periods');
  console.log('========================');
  console.log(`Company ID: ${companyId}`);
  console.log(`Start Year: ${startYear}`);
  console.log(`Number of Years: ${numberOfYears}`);
  console.log(`Fiscal Year Start Month: ${fiscalYearStartMonth} (${getMonthName(fiscalYearStartMonth)})`);
  console.log('');

  try {
    const periods = await fiscalPeriodService.createPeriodsForMultipleYears(
      companyId,
      startYear,
      numberOfYears,
      fiscalYearStartMonth
    );

    console.log('');
    console.log('✅ Success!');
    console.log(`Created ${periods.length} fiscal periods`);
    console.log('');
    console.log('Period IDs:');
    periods.forEach(id => console.log(`  - ${id}`));
  } catch (error) {
    console.error('❌ Error creating fiscal periods:', error);
    process.exit(1);
  }
}

function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

main();
