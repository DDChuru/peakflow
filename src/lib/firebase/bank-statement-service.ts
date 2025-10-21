import { httpsCallable } from 'firebase/functions';
import { functions, auth, db } from '@/lib/firebase/config';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  deleteDoc,
  Timestamp
} from 'firebase/firestore';
import {
  BankStatement,
  ProcessedBankStatement,
  BankTransaction,
  BankStatementSummary,
  BankAccountInfo
} from '@/types/bank-statement';
import { detectBank } from '../banking/bank-parsers';
import { fixStatementTransactions, applyStatementFixes } from '../banking/fix-statement-amounts';

type RawTransaction = {
  date?: string;
  description?: string;
  reference?: string;
  debit?: string | number | null;
  credit?: string | number | null;
  balance?: string | number | null;
};

function parseSafeNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function parseCount(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

/**
 * Parse FNB date format: "21 Nov" (no year) using statement period
 * FNB shows dates as "DD MMM" and the year is only in the statement period
 */
function parseFNBDate(dateStr: string, statementPeriod: { from?: string; to?: string }): string {
  if (!dateStr || !dateStr.trim()) return '';

  const trimmed = dateStr.trim();

  // Extract year from statement period
  let periodYear: number | null = null;

  if (statementPeriod.from) {
    const fromDate = new Date(statementPeriod.from);
    if (!isNaN(fromDate.getTime())) {
      periodYear = fromDate.getFullYear();
    }
  }

  if (!periodYear && statementPeriod.to) {
    const toDate = new Date(statementPeriod.to);
    if (!isNaN(toDate.getTime())) {
      periodYear = toDate.getFullYear();
    }
  }

  // Fallback to current year if we couldn't extract from period
  if (!periodYear) {
    periodYear = new Date().getFullYear();
    console.warn('[FNB Date Parser] Could not extract year from statement period, using current year');
  }

  // Try parsing with the year from statement period
  // FNB format: "21 Nov" → "21 Nov 2024"
  const dateWithYear = `${trimmed} ${periodYear}`;
  const parsed = new Date(dateWithYear);

  if (!isNaN(parsed.getTime())) {
    // CRITICAL: Use local date components, NOT toISOString() which converts to UTC
    // UTC conversion causes timezone shift (e.g., Dec 20 midnight in SA becomes Dec 19 22:00 UTC)
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;

    console.log(`[FNB Date Parser] "${trimmed}" + period year ${periodYear} → ${result}`);
    return result;
  }

  console.warn(`[FNB Date Parser] Could not parse "${trimmed}" with year ${periodYear}`);
  return trimmed;
}

/**
 * Normalize and validate transaction date
 * Fixes common date parsing issues:
 * - 2-digit years: 01 → 2024 (not 2001)
 * - Invalid year ranges
 */
function normalizeTransactionDate(
  dateStr: string | undefined,
  bankName?: string,
  statementPeriod?: { from?: string; to?: string }
): string {
  if (!dateStr || !dateStr.trim()) return '';

  // FNB-specific date parsing
  if (bankName === 'FNB' && statementPeriod) {
    return parseFNBDate(dateStr, statementPeriod);
  }

  try {
    const trimmed = dateStr.trim();
    const parsed = new Date(trimmed);

    // Check if valid date
    if (isNaN(parsed.getTime())) {
      console.warn(`[Date Validation] Invalid date: "${trimmed}"`);
      return trimmed; // Return original if unparseable
    }

    const year = parsed.getFullYear();
    const currentYear = new Date().getFullYear();

    // Fix 2-digit year parsing issue
    // If year < 2000, it's likely a parsing error (e.g., "01" → 2001 instead of 2024)
    if (year < 2000) {
      // Assume current century
      const correctedYear = 2000 + (year % 100);
      parsed.setFullYear(correctedYear);

      console.warn(`[Date Validation] Corrected year from ${year} to ${correctedYear} for date "${trimmed}"`);
      return parsed.toISOString().split('T')[0];
    }

    // Warn if date is far in the future
    if (year > currentYear + 1) {
      console.warn(`[Date Validation] Date year seems far in future: ${year} (current: ${currentYear})`);
    }

    // Return normalized ISO format
    return parsed.toISOString().split('T')[0];

  } catch (error) {
    console.error(`[Date Validation] Error parsing date "${dateStr}":`, error);
    return dateStr;
  }
}

function formatDateValue(value: unknown): string {
  if (!value) return '';

  if (typeof value === 'string') {
    return value.trim();
  }

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString().split('T')[0];
  }

  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof value.toDate === 'function') {
    try {
      const dateValue = value.toDate();
      if (dateValue instanceof Date && !Number.isNaN(dateValue.getTime())) {
        return dateValue.toISOString().split('T')[0];
      }
    } catch {
      return '';
    }
  }

  return '';
}

function normalizeStatementPeriod(raw: unknown): BankStatementSummary['statementPeriod'] {
  if (!raw) {
    return { from: '', to: '' };
  }

  if (typeof raw === 'string') {
    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized) {
      return { from: '', to: '' };
    }

    const rangeSplit = normalized.split(/\s+(?:to|through|until|till)\s+/i);
    if (rangeSplit.length === 2) {
      return {
        from: formatDateValue(rangeSplit[0]),
        to: formatDateValue(rangeSplit[1])
      };
    }

    const dashSplit = normalized.split(/\s*[-–—]\s*/);
    if (dashSplit.length === 2) {
      return {
        from: formatDateValue(dashSplit[0]),
        to: formatDateValue(dashSplit[1])
      };
    }

    return { from: normalized, to: '' };
  }

  if (typeof raw === 'object') {
    const maybeObject = raw as Record<string, unknown>;
    const periodValue = maybeObject.statementPeriod ?? maybeObject.value ?? null;

    if (typeof periodValue === 'string') {
      return normalizeStatementPeriod(periodValue);
    }

    const from = formatDateValue(
      maybeObject.from ??
      maybeObject.start ??
      maybeObject.startDate ??
      maybeObject.periodStart ??
      (typeof periodValue === 'object' ? (periodValue as Record<string, unknown>).from : undefined)
    );
    const to = formatDateValue(
      maybeObject.to ??
      maybeObject.end ??
      maybeObject.endDate ??
      maybeObject.periodEnd ??
      (typeof periodValue === 'object' ? (periodValue as Record<string, unknown>).to : undefined)
    );

    if (from || to) {
      return { from, to };
    }

    return { from, to };
  }

  return { from: '', to: '' };
}

function sanitizeAccountInfo(input: Partial<BankAccountInfo> | null | undefined): BankAccountInfo {
  const accountNumber = input?.accountNumber ?? '';
  const accountName = input?.accountName ?? '';
  const bankName = input?.bankName ?? '';

  const info: BankAccountInfo = {
    accountNumber,
    accountName,
    bankName,
  };

  if (input?.accountType) {
    info.accountType = input.accountType;
  }
  if (input?.branch) {
    info.branch = input.branch;
  }
  if (input?.currency) {
    info.currency = input.currency;
  }

  return info;
}

function removeUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    const cleanedArray = (value as unknown[])
      .map(item => removeUndefinedDeep(item))
      .filter(item => item !== undefined);
    return cleanedArray as unknown as T;
  }

  if (value instanceof Date || value instanceof Timestamp) {
    return value;
  }

  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (entry === undefined) continue;
      const cleaned = removeUndefinedDeep(entry);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    }
    return result as unknown as T;
  }

  return value;
}

// Helper function to ensure user is authenticated and ready
async function ensureAuthenticated() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get fresh token to ensure authentication is valid
  const token = await user.getIdToken(true);
  if (!token || token.length < 100) {
    throw new Error('Invalid authentication token');
  }

  return { user, token };
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Process bank statement using Firebase Function
export async function processBankStatement(
  pdfFile: File,
  companyId: string,
  companyName: string
): Promise<BankStatement> {
  try {
    // Ensure user is properly authenticated
    console.log('Ensuring user is authenticated...');
    const { user, token } = await ensureAuthenticated();

    console.log('Processing bank statement for user:', user.uid);
    console.log('User email verified:', user.emailVerified);
    console.log('Authentication token length:', token.length);

    // Convert PDF to base64
    const pdfBase64 = await fileToBase64(pdfFile);

    // Call Firebase Function with authentication
    const extractPDF = httpsCallable(functions, 'extractPDFContent');

    console.log('Calling Firebase Function with data:', {
      documentType: 'bankStatement',
      saveToFirestore: true,
      pdfSize: pdfBase64.length,
      userUid: user.uid
    });

    const functionResult = await extractPDF({
      pdfBase64,
      documentType: 'bankStatement',
      saveToFirestore: true
    });

    console.log('Function result:', functionResult);

    // Firebase Functions return data in a .data property
    const result = functionResult.data as ProcessedBankStatement;

    if (!result.success) {
      throw new Error(result.error || 'Failed to process bank statement');
    }

    const rawAccountInfo = (result.data as { accountInfo?: Partial<BankAccountInfo>; accountInformation?: Partial<BankAccountInfo> }).accountInfo
      ?? (result.data as { accountInformation?: Partial<BankAccountInfo> }).accountInformation
      ?? {};

    // Parse summary data with safe number conversion
    const summary = result.data.summary || {};
    const parsedSummary: BankStatementSummary = {
      openingBalance: parseSafeNumber(summary.openingBalance),
      closingBalance: parseSafeNumber(summary.closingBalance),
      totalDeposits: parseSafeNumber(summary.totalDeposits),
      totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
      totalFees: parseSafeNumber(summary.totalFees),
      interestEarned: parseSafeNumber(summary.interestEarned),
      transactionCount: parseCount(summary.transactionCount),
      statementPeriod: normalizeStatementPeriod(summary.statementPeriod)
    };
    const accountStatementPeriod = (rawAccountInfo as { statementPeriod?: unknown }).statementPeriod;
    if ((!parsedSummary.statementPeriod.from && !parsedSummary.statementPeriod.to) && accountStatementPeriod) {
      parsedSummary.statementPeriod = normalizeStatementPeriod(accountStatementPeriod);
    }

    // CRITICAL: Detect bank BEFORE processing transactions
    // This allows bank-specific date parsing (e.g., FNB's "DD MMM" format)
    console.log('[Bank Parser] Detecting bank...');
    const sanitizedAccountInfo = sanitizeAccountInfo(rawAccountInfo);
    const detectedBankName = detectBank('', sanitizedAccountInfo);
    console.log('[Bank Parser] Detected bank:', detectedBankName);
    console.log('[Bank Parser] Statement period:', parsedSummary.statementPeriod);

    let bankStatement: BankStatement = {
      companyId,
      companyName,
      uploadedAt: new Date(),
      processedAt: new Date(),
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      status: 'completed',
      accountInfo: sanitizedAccountInfo,
      summary: parsedSummary,
      transactions: processTransactions(
        result.data.transactions || [],
        detectedBankName,
        parsedSummary.statementPeriod
      ),
      extractedData: removeUndefinedDeep(result.data),
      userId: user.uid
    };

    // AUTO-FIX: Apply bank-specific parser to correct debit/credit amounts
    try {
      const bankName = detectedBankName;

      if (bankName !== 'Unknown') {
        console.log('[Bank Parser] Applying bank-specific corrections...');
        const fixResult = fixStatementTransactions(bankStatement);

        if (fixResult.transactionsFixed > 0) {
          console.log(`[Bank Parser] Fixed ${fixResult.transactionsFixed} transactions`);
          bankStatement = applyStatementFixes(bankStatement, fixResult);
          // Add metadata to show auto-fix was applied
          bankStatement.accountInfo = {
            ...bankStatement.accountInfo,
            bankName: fixResult.bankDetected
          };
        } else {
          console.log('[Bank Parser] No corrections needed - transactions already correct');
        }
      }
    } catch (parserError) {
      console.warn('[Bank Parser] Auto-fix failed, using original amounts:', parserError);
      // Continue with original data if parser fails
    }

    // Save to Firestore
    const firestorePayload = removeUndefinedDeep({
      ...bankStatement,
      uploadedAt: Timestamp.fromDate(bankStatement.uploadedAt),
      processedAt: bankStatement.processedAt ? Timestamp.fromDate(bankStatement.processedAt) : undefined
    });

    const docRef = await addDoc(collection(db, 'bank_statements'), firestorePayload);

    bankStatement.id = docRef.id;

    // Track usage
    await addDoc(collection(db, 'usage_tracking'), {
      userId: user.uid,
      companyId,
      function: 'processBankStatement',
      fileName: pdfFile.name,
      timestamp: Timestamp.now(),
      success: true
    });

    return bankStatement;

  } catch (error) {
    console.error('Bank statement processing error:', error);

    // Save failed attempt
    const failedStatement: BankStatement = {
      companyId,
      companyName,
      uploadedAt: new Date(),
      fileName: pdfFile.name,
      fileSize: pdfFile.size,
      status: 'failed',
      accountInfo: {
        accountNumber: '',
        accountName: '',
        bankName: ''
      },
      summary: {
        openingBalance: 0,
        closingBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalFees: 0,
        interestEarned: 0,
        transactionCount: 0,
        statementPeriod: { from: '', to: '' }
      },
      transactions: [],
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: auth.currentUser?.uid || ''
    };

    await addDoc(collection(db, 'bank_statements'), removeUndefinedDeep({
      ...failedStatement,
      uploadedAt: Timestamp.fromDate(failedStatement.uploadedAt)
    }));

    throw error;
  }
}

// Process and categorize transactions
function processTransactions(
  rawTransactions: RawTransaction[],
  bankName?: string,
  statementPeriod?: { from?: string; to?: string }
): BankTransaction[] {
  return rawTransactions.map((rawTransaction) => {
    const transaction: BankTransaction = {
      date: normalizeTransactionDate(rawTransaction.date, bankName, statementPeriod),
      description: rawTransaction.description ?? '',
      debit: parseSafeNumber(rawTransaction.debit),
      credit: parseSafeNumber(rawTransaction.credit),
      balance: parseSafeNumber(rawTransaction.balance)
    };

    const reference = rawTransaction.reference;
    if (typeof reference === 'string' && reference.trim().length > 0) {
      transaction.reference = reference.trim();
    }

    transaction.type = categorizeTransaction(transaction);
    transaction.category = getTransactionCategory(transaction.description);

    return transaction;
  });
}

// Categorize transaction type
function categorizeTransaction(transaction: BankTransaction): BankTransaction['type'] {
  const description = transaction.description.toLowerCase();

  if (description.includes('fee') || description.includes('charge')) {
    return 'fee';
  }
  if (description.includes('interest')) {
    return 'interest';
  }
  if (description.includes('transfer')) {
    return 'transfer';
  }
  if (transaction.credit && transaction.credit > 0) {
    return 'deposit';
  }
  if (transaction.debit && transaction.debit > 0) {
    return 'withdrawal';
  }
  return 'other';
}

// Get transaction category
function getTransactionCategory(description: string): string {
  const desc = description.toLowerCase();

  // Expense categories
  if (desc.includes('salary') || desc.includes('payroll')) return 'Payroll';
  if (desc.includes('rent')) return 'Rent';
  if (desc.includes('utility') || desc.includes('electricity') || desc.includes('water')) return 'Utilities';
  if (desc.includes('insurance')) return 'Insurance';
  if (desc.includes('tax')) return 'Tax';
  if (desc.includes('supplier') || desc.includes('vendor')) return 'Suppliers';
  if (desc.includes('equipment')) return 'Equipment';
  if (desc.includes('marketing') || desc.includes('advertising')) return 'Marketing';

  // Income categories
  if (desc.includes('sales') || desc.includes('revenue')) return 'Sales';
  if (desc.includes('invoice')) return 'Customer Payment';
  if (desc.includes('refund')) return 'Refund';

  // Banking categories
  if (desc.includes('fee') || desc.includes('charge')) return 'Bank Fees';
  if (desc.includes('interest')) return 'Interest';
  if (desc.includes('transfer')) return 'Transfer';

  return 'Other';
}

// Get bank statements for a company
export async function getCompanyBankStatements(
  companyId: string,
  limitCount: number = 10
): Promise<BankStatement[]> {
  try {
    const statementsQuery = query(
      collection(db, 'bank_statements'),
      where('companyId', '==', companyId),
      orderBy('uploadedAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(statementsQuery);

    return snapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data();
      const { accountInfo: storedAccountInfo, accountInformation, ...rest } = data;

      const accountInfoRaw = (storedAccountInfo ?? accountInformation) as Partial<BankAccountInfo> | null | undefined;
      const accountInfo = sanitizeAccountInfo(accountInfoRaw);

      const summary = data.summary || {};
      const statementPeriod = summary.statementPeriod || { from: '', to: '' };

      // Detect bank for date parsing
      const bankName = detectBank('', accountInfo);

      const transactionsRaw: RawTransaction[] = Array.isArray(data.transactions) ? data.transactions : [];
      const transactions = transactionsRaw.map((rawTx, index) => {
        const parsedTx: BankTransaction = {
          id: rawTx.id ?? `${docSnapshot.id}-tx-${index}`,
          date: normalizeTransactionDate(rawTx.date, bankName, statementPeriod),
          description: rawTx.description ?? '',
          debit: parseSafeNumber(rawTx.debit),
          credit: parseSafeNumber(rawTx.credit),
          balance: parseSafeNumber(rawTx.balance)
        };

        if (typeof rawTx.reference === 'string' && rawTx.reference.trim().length > 0) {
          parsedTx.reference = rawTx.reference.trim();
        }

        parsedTx.type = rawTx.type ?? categorizeTransaction(parsedTx);
        parsedTx.category = rawTx.category ?? getTransactionCategory(parsedTx.description);

        return parsedTx;
      });

      const safeStatement: BankStatement = {
        id: docSnapshot.id,
        ...rest,
        accountInfo,
        uploadedAt: data.uploadedAt?.toDate() || new Date(),
        processedAt: data.processedAt?.toDate(),
        transactions,
        summary: {
          openingBalance: parseSafeNumber(summary.openingBalance),
          closingBalance: parseSafeNumber(summary.closingBalance),
          totalDeposits: parseSafeNumber(summary.totalDeposits),
          totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
          totalFees: parseSafeNumber(summary.totalFees),
          interestEarned: parseSafeNumber(summary.interestEarned),
          transactionCount: parseCount(summary.transactionCount),
          statementPeriod: normalizeStatementPeriod(summary.statementPeriod)
        }
      };

      return safeStatement;
    });

  } catch (error) {
    console.error('Error fetching bank statements:', error);
    return [];
  }
}

// Get a specific bank statement
export async function getBankStatement(statementId: string): Promise<BankStatement | null> {
  try {
    const docRef = doc(db, 'bank_statements', statementId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

      const data = docSnap.data();
      const { accountInfo: storedAccountInfo, accountInformation, ...rest } = data;

      const accountInfoRaw = (storedAccountInfo ?? accountInformation) as Partial<BankAccountInfo> | null | undefined;
      const accountInfo = sanitizeAccountInfo(accountInfoRaw);

    const summary = data.summary || {};
    const statementPeriod = summary.statementPeriod || { from: '', to: '' };

    // Detect bank for date parsing
    const bankName = detectBank('', accountInfo);

    const transactionsRaw: RawTransaction[] = Array.isArray(data.transactions) ? data.transactions : [];
    const transactions = transactionsRaw.map((rawTx, index) => {
      const parsedTx: BankTransaction = {
        id: rawTx.id ?? `${docSnap.id}-tx-${index}`,
        date: normalizeTransactionDate(rawTx.date, bankName, statementPeriod),
        description: rawTx.description ?? '',
        debit: parseSafeNumber(rawTx.debit),
        credit: parseSafeNumber(rawTx.credit),
        balance: parseSafeNumber(rawTx.balance)
      };

      if (typeof rawTx.reference === 'string' && rawTx.reference.trim().length > 0) {
        parsedTx.reference = rawTx.reference.trim();
      }

      parsedTx.type = rawTx.type ?? categorizeTransaction(parsedTx);
      parsedTx.category = rawTx.category ?? getTransactionCategory(parsedTx.description);

      return parsedTx;
    });

    const safeStatement: BankStatement = {
      id: docSnap.id,
      ...rest,
      accountInfo,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      processedAt: data.processedAt?.toDate(),
      transactions,
      summary: {
        openingBalance: parseSafeNumber(summary.openingBalance),
        closingBalance: parseSafeNumber(summary.closingBalance),
        totalDeposits: parseSafeNumber(summary.totalDeposits),
        totalWithdrawals: parseSafeNumber(summary.totalWithdrawals),
        totalFees: parseSafeNumber(summary.totalFees),
        interestEarned: parseSafeNumber(summary.interestEarned),
        transactionCount: parseCount(summary.transactionCount),
        statementPeriod: normalizeStatementPeriod(summary.statementPeriod)
      }
    };

    return safeStatement;

  } catch (error) {
    console.error('Error fetching bank statement:', error);
    return null;
  }
}

// Calculate summary statistics from transactions
export function calculateSummaryStats(transactions: BankTransaction[]): {
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  averageBalance: number;
  transactionsByCategory: Record<string, number>;
  transactionsByType: Record<string, number>;
} {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalBalance = 0;
  let validBalanceCount = 0;
  const transactionsByCategory: Record<string, number> = {};
  const transactionsByType: Record<string, number> = {};

  transactions.forEach(tx => {
    // Calculate totals with safe number handling
    const credit = isNaN(tx.credit) ? 0 : tx.credit;
    const debit = isNaN(tx.debit) ? 0 : tx.debit;
    const balance = isNaN(tx.balance) ? 0 : tx.balance;

    if (credit > 0) totalIncome += credit;
    if (debit > 0) totalExpenses += debit;

    if (balance !== 0) {
      totalBalance += balance;
      validBalanceCount++;
    }

    // Group by category
    const category = tx.category || 'Other';
    transactionsByCategory[category] = (transactionsByCategory[category] || 0) + 1;

    // Group by type
    const type = tx.type || 'other';
    transactionsByType[type] = (transactionsByType[type] || 0) + 1;
  });

  // Calculate safe averages
  const averageBalance = validBalanceCount > 0 ? totalBalance / validBalanceCount : 0;
  const netCashFlow = totalIncome - totalExpenses;

  return {
    totalIncome: isNaN(totalIncome) ? 0 : totalIncome,
    totalExpenses: isNaN(totalExpenses) ? 0 : totalExpenses,
    netCashFlow: isNaN(netCashFlow) ? 0 : netCashFlow,
    averageBalance: isNaN(averageBalance) ? 0 : averageBalance,
    transactionsByCategory,
    transactionsByType
  };
}

// Class wrapper for bank statement service functions
/**
 * Delete a bank statement
 */
export async function deleteBankStatement(statementId: string): Promise<void> {
  await ensureAuthenticated();

  const statementRef = doc(db, 'bank_statements', statementId);
  await deleteDoc(statementRef);

  console.log(`[BankStatementService] Deleted statement: ${statementId}`);
}

export class BankStatementService {
  fileToBase64 = fileToBase64;
  processBankStatement = processBankStatement;
  getCompanyBankStatements = getCompanyBankStatements;
  getBankStatement = getBankStatement;
  calculateSummaryStats = calculateSummaryStats;
  deleteBankStatement = deleteBankStatement;
}
