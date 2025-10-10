/**
 * Utility to fix bank statement transactions that were imported with incorrect debit/credit detection
 * Specifically handles FNB format where "Cr" suffix = credit, plain number = debit
 */

import { BankTransaction, BankStatement } from '@/types/bank-statement';
import { detectBank, getBankParser } from './bank-parsers';

export interface AmountFixResult {
  transactionId: string;
  originalDebit?: number;
  originalCredit?: number;
  correctedDebit?: number;
  correctedCredit?: number;
  changed: boolean;
}

export interface StatementFixResult {
  statementId: string;
  bankDetected: string;
  totalTransactions: number;
  transactionsFixed: number;
  fixDetails: AmountFixResult[];
}

/**
 * Fix a single transaction's debit/credit amounts based on bank-specific parsing rules
 *
 * This assumes the transaction description contains clues about the amount format,
 * or we need to infer from the balance changes
 */
export function fixTransactionAmount(
  transaction: BankTransaction,
  bankName: string,
  previousBalance?: number
): AmountFixResult {
  const result: AmountFixResult = {
    transactionId: transaction.id || '',
    originalDebit: transaction.debit,
    originalCredit: transaction.credit,
    changed: false
  };

  // If we have a previous balance, we can calculate what it should be
  if (previousBalance !== undefined && transaction.balance !== undefined) {
    const balanceChange = transaction.balance - previousBalance;

    if (balanceChange > 0) {
      // Balance increased = money IN = credit
      result.correctedCredit = balanceChange;
      result.correctedDebit = undefined;
      result.changed =
        transaction.credit !== balanceChange ||
        transaction.debit !== undefined;
    } else if (balanceChange < 0) {
      // Balance decreased = money OUT = debit
      result.correctedDebit = Math.abs(balanceChange);
      result.correctedCredit = undefined;
      result.changed =
        transaction.debit !== Math.abs(balanceChange) ||
        transaction.credit !== undefined;
    }
  } else {
    // Fallback: Use bank-specific parser if we have amount text
    // (This would require storing original amount text, which we may not have)
    result.correctedDebit = transaction.debit;
    result.correctedCredit = transaction.credit;
  }

  return result;
}

/**
 * Fix all transactions in a statement based on balance progression
 *
 * Uses the balance field to determine if money went in or out
 */
export function fixStatementTransactions(
  statement: BankStatement
): StatementFixResult {
  const bankName = detectBank('', statement.accountInfo);

  const fixDetails: AmountFixResult[] = [];
  const correctedTransactions: BankTransaction[] = [];

  let previousBalance = statement.summary.openingBalance;

  for (const transaction of statement.transactions) {
    const fix = fixTransactionAmount(transaction, bankName, previousBalance);
    fixDetails.push(fix);

    // Create corrected transaction
    const correctedTransaction: BankTransaction = {
      ...transaction,
      debit: fix.correctedDebit,
      credit: fix.correctedCredit
    };

    correctedTransactions.push(correctedTransaction);
    previousBalance = transaction.balance;
  }

  const transactionsFixed = fixDetails.filter(f => f.changed).length;

  return {
    statementId: statement.id || '',
    bankDetected: bankName,
    totalTransactions: statement.transactions.length,
    transactionsFixed,
    fixDetails
  };
}

/**
 * Apply fixes to a statement (returns new statement with corrected transactions)
 */
export function applyStatementFixes(
  statement: BankStatement,
  fixes: StatementFixResult
): BankStatement {
  const correctedTransactions = statement.transactions.map((tx, idx) => {
    const fix = fixes.fixDetails[idx];
    if (!fix || !fix.changed) {
      return tx;
    }

    return {
      ...tx,
      debit: fix.correctedDebit,
      credit: fix.correctedCredit
    };
  });

  return {
    ...statement,
    transactions: correctedTransactions,
    accountInfo: {
      ...statement.accountInfo,
      bankName: fixes.bankDetected
    }
  };
}

/**
 * Validate that transactions balance correctly
 *
 * Checks that balance progression matches the debit/credit amounts
 */
export function validateStatementBalance(statement: BankStatement): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  let calculatedBalance = statement.summary.openingBalance;

  for (let i = 0; i < statement.transactions.length; i++) {
    const tx = statement.transactions[i];

    // Calculate expected balance
    if (tx.credit) {
      calculatedBalance += tx.credit;
    }
    if (tx.debit) {
      calculatedBalance -= tx.debit;
    }

    // Check if it matches actual balance (allow for small rounding errors)
    const balanceDiff = Math.abs(calculatedBalance - tx.balance);
    if (balanceDiff > 0.02) {
      errors.push(
        `Transaction ${i + 1} (${tx.date} - ${tx.description}): ` +
          `Balance mismatch. Expected: R${calculatedBalance.toFixed(2)}, ` +
          `Actual: R${tx.balance.toFixed(2)}, Diff: R${balanceDiff.toFixed(2)}`
      );
    }
  }

  // Check closing balance
  const closingBalanceDiff = Math.abs(
    calculatedBalance - statement.summary.closingBalance
  );
  if (closingBalanceDiff > 0.02) {
    errors.push(
      `Closing balance mismatch. Calculated: R${calculatedBalance.toFixed(2)}, ` +
        `Expected: R${statement.summary.closingBalance.toFixed(2)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Diagnose a statement and recommend fixes
 */
export function diagnoseStatement(statement: BankStatement): {
  bankDetected: string;
  balanceValid: boolean;
  balanceErrors: string[];
  suggestedFixes?: StatementFixResult;
  recommendation: string;
} {
  const bankName = detectBank('', statement.accountInfo);
  const validation = validateStatementBalance(statement);

  if (validation.valid) {
    return {
      bankDetected: bankName,
      balanceValid: true,
      balanceErrors: [],
      recommendation: 'Statement is correctly imported. No fixes needed.'
    };
  }

  // Statement has balance issues, suggest fixes
  const fixes = fixStatementTransactions(statement);

  return {
    bankDetected: bankName,
    balanceValid: false,
    balanceErrors: validation.errors,
    suggestedFixes: fixes,
    recommendation:
      `Found ${fixes.transactionsFixed} transactions with incorrect debit/credit classification. ` +
      `Apply suggested fixes to correct the amounts based on balance progression.`
  };
}
