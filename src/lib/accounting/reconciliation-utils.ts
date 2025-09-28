import type { BankTransaction } from '@/types/bank-statement';
import type { LedgerEntry } from '@/types/accounting/general-ledger';
import type { AutoMatchCandidate } from '@/types/accounting/reconciliation';

/**
 * Configuration for the auto-matching algorithm
 */
export interface MatchingConfig {
  /** Maximum days difference between bank and ledger transaction dates */
  maxDateDifferenceInDays: number;
  /** Maximum amount difference allowed for fuzzy matching (percentage) */
  maxAmountDifferencePercent: number;
  /** Maximum absolute amount difference for small transactions */
  maxAmountDifferenceAbsolute: number;
  /** Minimum confidence score to suggest a match (0-1) */
  minConfidenceThreshold: number;
  /** Weight for exact amount match (0-1) */
  amountWeight: number;
  /** Weight for date proximity (0-1) */
  dateWeight: number;
  /** Weight for reference matching (0-1) */
  referenceWeight: number;
  /** Weight for description similarity (0-1) */
  descriptionWeight: number;
}

const DEFAULT_CONFIG: MatchingConfig = {
  maxDateDifferenceInDays: 14, // Increased to 2 weeks for delayed clearances
  maxAmountDifferencePercent: 0.05, // 5% tolerance for exchange rates/fees
  maxAmountDifferenceAbsolute: 5.00, // $5 tolerance for small differences
  minConfidenceThreshold: 0.4, // Lower threshold to catch more potential matches
  amountWeight: 0.4,
  dateWeight: 0.3,
  referenceWeight: 0.2,
  descriptionWeight: 0.1,
};

/**
 * Calculate the effective amount from a bank transaction
 */
export function getBankTransactionAmount(transaction: BankTransaction): number {
  // Handle explicit debit field (money out)
  if (transaction.debit !== undefined && transaction.debit > 0) {
    return -Math.abs(transaction.debit); // Outflow (negative)
  }

  // Handle explicit credit field (money in)
  if (transaction.credit !== undefined && transaction.credit > 0) {
    return Math.abs(transaction.credit); // Inflow (positive)
  }

  // Fallback: try to infer from transaction type and balance
  if (transaction.type) {
    const type = transaction.type.toLowerCase();
    const amount = Math.abs(transaction.balance || 0);

    if (type === 'withdrawal' || type === 'fee' || type === 'debit' || type === 'payment') {
      return -amount; // Outflow
    }
    if (type === 'deposit' || type === 'credit' || type === 'interest') {
      return amount; // Inflow
    }
  }

  // Last resort: if we have a balance field, use it directly
  if (transaction.balance !== undefined) {
    return transaction.balance;
  }

  console.warn('Cannot determine bank transaction amount:', transaction);
  return 0;
}

/**
 * Calculate the effective amount from a ledger entry
 */
export function getLedgerEntryAmount(entry: LedgerEntry): number {
  // From the bank's perspective:
  // Credit to bank account = money in (positive)
  // Debit to bank account = money out (negative)
  return entry.credit - entry.debit;
}

/**
 * Calculate date difference in days between two dates
 */
export function getDateDifferenceInDays(date1: string | Date, date2: string | Date): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffMs = Math.abs(d1.getTime() - d2.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Normalize text for comparison
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .trim();
}

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * Calculate text similarity score (0-1)
 */
export function textSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);

  if (norm1 === norm2) return 1;

  const maxLength = Math.max(norm1.length, norm2.length);
  if (maxLength === 0) return 0;

  const distance = levenshteinDistance(norm1, norm2);
  return 1 - distance / maxLength;
}

/**
 * Check if references match (exact or partial)
 */
export function referenceMatch(ref1?: string, ref2?: string): number {
  if (!ref1 || !ref2) return 0;

  const norm1 = normalizeText(ref1);
  const norm2 = normalizeText(ref2);

  // Exact match
  if (norm1 === norm2) return 1;

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) return 0.8;

  // Partial similarity
  return textSimilarity(ref1, ref2) * 0.5;
}

/**
 * Calculate confidence score for a potential match
 */
export function calculateMatchConfidence(
  bankTransaction: BankTransaction,
  ledgerEntry: LedgerEntry,
  config: MatchingConfig = DEFAULT_CONFIG
): number {
  const bankAmount = getBankTransactionAmount(bankTransaction);
  const ledgerAmount = getLedgerEntryAmount(ledgerEntry);

  // Calculate amount similarity
  const amountDiff = Math.abs(bankAmount - ledgerAmount);
  const avgAmount = Math.abs((bankAmount + ledgerAmount) / 2);

  // Debug log for first few comparisons
  if (Math.random() < 0.05) { // Log 5% of comparisons to avoid spam
    console.log(`[CONFIDENCE] Comparing amounts: bank=${bankAmount}, ledger=${ledgerAmount}, diff=${amountDiff}, avg=${avgAmount}`);
  }

  let amountScore = 0;
  if (amountDiff === 0) {
    amountScore = 1; // Exact match
  } else if (
    amountDiff <= config.maxAmountDifferenceAbsolute ||
    (avgAmount > 0 && amountDiff / avgAmount <= config.maxAmountDifferencePercent)
  ) {
    // Within tolerance
    const percentDiff = avgAmount > 0 ? amountDiff / avgAmount : 1;
    amountScore = 1 - percentDiff / config.maxAmountDifferencePercent;
  } else {
    if (Math.random() < 0.05) { // Log rejections
      console.log(`[CONFIDENCE] Amount rejected: diff=${amountDiff} > max=${config.maxAmountDifferenceAbsolute}, percent=${avgAmount > 0 ? (amountDiff/avgAmount*100).toFixed(1) : 'N/A'}% > ${config.maxAmountDifferencePercent*100}%`);
    }
    return 0; // Amount difference too large, no match
  }

  // Calculate date proximity
  const dateDiff = getDateDifferenceInDays(
    bankTransaction.date,
    ledgerEntry.transactionDate
  );

  if (dateDiff > config.maxDateDifferenceInDays) {
    return 0; // Date difference too large, no match
  }

  const dateScore = 1 - dateDiff / config.maxDateDifferenceInDays;

  // Calculate reference match score
  const refScore = referenceMatch(bankTransaction.reference, ledgerEntry.metadata?.reference as string);

  // Calculate description similarity
  const descScore = textSimilarity(
    bankTransaction.description || '',
    ledgerEntry.metadata?.description as string || ''
  );

  // Calculate weighted confidence
  const confidence =
    amountScore * config.amountWeight +
    dateScore * config.dateWeight +
    refScore * config.referenceWeight +
    descScore * config.descriptionWeight;

  return Math.min(1, Math.max(0, confidence));
}

/**
 * Match rule types for audit trail
 */
export type MatchRule =
  | 'exact_match'
  | 'amount_date_match'
  | 'reference_match'
  | 'fuzzy_match'
  | 'manual';

/**
 * Determine which rule was applied for a match
 */
export function determineMatchRule(
  bankTransaction: BankTransaction,
  ledgerEntry: LedgerEntry,
  confidence: number
): MatchRule {
  const bankAmount = getBankTransactionAmount(bankTransaction);
  const ledgerAmount = getLedgerEntryAmount(ledgerEntry);
  const dateDiff = getDateDifferenceInDays(bankTransaction.date, ledgerEntry.transactionDate);

  // Exact match: same amount and date
  if (bankAmount === ledgerAmount && dateDiff === 0) {
    return 'exact_match';
  }

  // Reference match with correct amount
  const refScore = referenceMatch(bankTransaction.reference, ledgerEntry.metadata?.reference as string);
  if (refScore >= 0.8 && Math.abs(bankAmount - ledgerAmount) < 0.01) {
    return 'reference_match';
  }

  // Amount and date within tolerance
  if (Math.abs(bankAmount - ledgerAmount) < 0.50 && dateDiff <= 3) {
    return 'amount_date_match';
  }

  // Otherwise it's fuzzy
  return 'fuzzy_match';
}

/**
 * Find potential matches for a bank transaction
 */
export function findPotentialMatches(
  bankTransaction: BankTransaction,
  ledgerEntries: LedgerEntry[],
  config: MatchingConfig = DEFAULT_CONFIG
): AutoMatchCandidate[] {
  const candidates: AutoMatchCandidate[] = [];
  const bankAmount = getBankTransactionAmount(bankTransaction);

  for (const ledgerEntry of ledgerEntries) {
    // Skip if already matched (check metadata)
    if (ledgerEntry.metadata?.matchedBankTransactionId) {
      continue;
    }

    const confidence = calculateMatchConfidence(bankTransaction, ledgerEntry, config);

    if (confidence >= config.minConfidenceThreshold) {
      const ledgerAmount = getLedgerEntryAmount(ledgerEntry);
      const dateDiff = getDateDifferenceInDays(bankTransaction.date, ledgerEntry.transactionDate);
      const rule = determineMatchRule(bankTransaction, ledgerEntry, confidence);

      candidates.push({
        bankTransactionId: bankTransaction.id || '',
        ledgerTransactionId: ledgerEntry.id,
        amountDifference: Math.abs(bankAmount - ledgerAmount),
        dateDifferenceInDays: dateDiff,
        confidence,
        ruleApplied: rule,
        bankTransaction,
        ledgerEntry,
      });
    }
  }

  // Sort by confidence (highest first)
  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Auto-match algorithm for batch processing
 */
export interface AutoMatchResult {
  matches: AutoMatchCandidate[];
  unmatchedBankTransactions: BankTransaction[];
  unmatchedLedgerEntries: LedgerEntry[];
  matchRatio: number;
}

export function performAutoMatching(
  bankTransactions: BankTransaction[],
  ledgerEntries: LedgerEntry[],
  config: MatchingConfig = DEFAULT_CONFIG
): AutoMatchResult {
  const matches: AutoMatchCandidate[] = [];
  const matchedBankIds = new Set<string>();
  const matchedLedgerIds = new Set<string>();

  console.log('[AUTO-MATCH] Starting auto-match with config:', config);
  console.log(`[AUTO-MATCH] Processing ${bankTransactions.length} bank tx, ${ledgerEntries.length} ledger entries`);

  // Debug: Log sample data if available
  if (bankTransactions.length > 0) {
    const sampleBank = bankTransactions[0];
    console.log(`[AUTO-MATCH] Sample bank tx:`, {
      id: sampleBank.id,
      date: sampleBank.date,
      description: sampleBank.description?.substring(0, 50),
      debit: sampleBank.debit,
      credit: sampleBank.credit,
      balance: sampleBank.balance,
      type: sampleBank.type
    });
  } else {
    console.log('[AUTO-MATCH] *** NO BANK TRANSACTIONS FOUND ***');
  }

  if (ledgerEntries.length > 0) {
    const sampleLedger = ledgerEntries[0];
    console.log(`[AUTO-MATCH] Sample ledger entry:`, {
      id: sampleLedger.id,
      accountId: sampleLedger.accountId,
      debit: sampleLedger.debit,
      credit: sampleLedger.credit,
      transactionDate: sampleLedger.transactionDate,
      currency: sampleLedger.currency
    });
  } else {
    console.log('[AUTO-MATCH] *** NO LEDGER ENTRIES FOUND ***');
  }

  // Create a copy of ledger entries to track matches
  const availableLedgerEntries = [...ledgerEntries];

  // First pass: Find best matches for each bank transaction
  for (const bankTransaction of bankTransactions) {
    if (!bankTransaction.id) {
      console.log('[MATCHING] Skipping bank tx without ID');
      continue;
    }

    const bankAmount = getBankTransactionAmount(bankTransaction);
    console.log(`[MATCHING] Processing bank tx: ${bankTransaction.description}, amount: ${bankAmount}, date: ${bankTransaction.date}`);

    const candidates = findPotentialMatches(
      bankTransaction,
      availableLedgerEntries.filter(le => !matchedLedgerIds.has(le.id)),
      config
    );

    console.log(`[MATCHING] Found ${candidates.length} candidates for bank tx ${bankTransaction.id}`);
    if (candidates.length > 0) {
      const bestMatch = candidates[0];
      console.log(`[MATCHING] Best match confidence: ${bestMatch.confidence.toFixed(2)}, rule: ${bestMatch.ruleApplied}`);
      matches.push(bestMatch);
      matchedBankIds.add(bankTransaction.id);
      matchedLedgerIds.add(bestMatch.ledgerTransactionId);
    }
  }

  // Identify unmatched transactions
  const unmatchedBankTransactions = bankTransactions.filter(
    bt => bt.id && !matchedBankIds.has(bt.id)
  );

  const unmatchedLedgerEntries = ledgerEntries.filter(
    le => !matchedLedgerIds.has(le.id)
  );

  // Calculate match ratio
  const matchRatio = bankTransactions.length > 0
    ? matches.length / bankTransactions.length
    : 0;

  return {
    matches,
    unmatchedBankTransactions,
    unmatchedLedgerEntries,
    matchRatio,
  };
}

/**
 * Validate reconciliation balance
 */
export interface BalanceValidation {
  isValid: boolean;
  expectedBalance: number;
  actualBalance: number;
  difference: number;
  message?: string;
}

export function validateReconciliationBalance(
  openingBalance: number,
  closingBalance: number,
  bankTransactions: BankTransaction[]
): BalanceValidation {
  let calculatedBalance = openingBalance;

  for (const transaction of bankTransactions) {
    const amount = getBankTransactionAmount(transaction);
    calculatedBalance += amount;
  }

  const difference = Math.abs(calculatedBalance - closingBalance);
  const isValid = difference < 0.01; // Allow for rounding errors

  return {
    isValid,
    expectedBalance: closingBalance,
    actualBalance: calculatedBalance,
    difference,
    message: isValid
      ? 'Balance reconciles correctly'
      : `Balance difference of ${difference.toFixed(2)} detected`,
  };
}