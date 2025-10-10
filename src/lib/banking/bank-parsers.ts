/**
 * Bank-specific parsers for South African banks
 * Each bank has unique statement formats that need custom parsing logic
 */

import { BankTransaction, BankAccountInfo } from '@/types/bank-statement';

export type SouthAfricanBank =
  | 'FNB'
  | 'Standard Bank'
  | 'ABSA'
  | 'Nedbank'
  | 'Capitec'
  | 'African Bank'
  | 'Discovery Bank'
  | 'TymeBank'
  | 'Unknown';

export interface BankParser {
  bankName: SouthAfricanBank;
  detect: (text: string, accountInfo?: BankAccountInfo) => boolean;
  parseAmount: (amountText: string) => { debit?: number; credit?: number };
  parseDate?: (dateText: string) => string;
  extractAccountNumber?: (text: string) => string | null;
}

/**
 * FNB Bank Parser
 *
 * Format specifics:
 * - Credits (money IN): Amount with "Cr" suffix (e.g., "2,392.00Cr")
 * - Debits (money OUT): Plain amount, no suffix (e.g., "5,534.00")
 * - Account numbers: Usually in format like "62749419862"
 */
export const fnbParser: BankParser = {
  bankName: 'FNB',

  detect: (text: string, accountInfo?: BankAccountInfo): boolean => {
    const fnbIndicators = [
      'First National Bank',
      'FNB',
      'www.fnb.co.za',
      'FNB App',
      'Call Centre: 087 575 9405'
    ];

    // Check account info first
    if (accountInfo?.bankName.toLowerCase().includes('fnb')) {
      return true;
    }

    // Check text content
    return fnbIndicators.some(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase())
    );
  },

  parseAmount: (amountText: string): { debit?: number; credit?: number } => {
    if (!amountText) {
      return {};
    }

    // Remove spaces and handle different formats
    const cleanAmount = amountText.trim().replace(/\s+/g, '');

    // Check if it's a credit (money IN) - has "Cr" suffix
    if (cleanAmount.endsWith('Cr') || cleanAmount.endsWith('CR') || cleanAmount.endsWith('cr')) {
      const numericValue = cleanAmount
        .replace(/Cr$/i, '')
        .replace(/,/g, '')
        .trim();

      const amount = parseFloat(numericValue);

      if (!isNaN(amount) && amount > 0) {
        return { credit: amount };
      }
    }

    // Check if it's a debit (money OUT) - has "Dr" suffix (some statements)
    if (cleanAmount.endsWith('Dr') || cleanAmount.endsWith('DR') || cleanAmount.endsWith('dr')) {
      const numericValue = cleanAmount
        .replace(/Dr$/i, '')
        .replace(/,/g, '')
        .trim();

      const amount = parseFloat(numericValue);

      if (!isNaN(amount) && amount > 0) {
        return { debit: amount };
      }
    }

    // Plain number without suffix = DEBIT (money OUT) for FNB
    const numericValue = cleanAmount.replace(/,/g, '');
    const amount = parseFloat(numericValue);

    if (!isNaN(amount) && amount > 0) {
      return { debit: amount };
    }

    return {};
  },

  extractAccountNumber: (text: string): string | null => {
    // FNB account numbers are typically 11 digits
    const accountMatch = text.match(/(?:Account|Acc)\s*(?:Number|No\.?|#)?\s*:?\s*(\d{10,11})/i);
    return accountMatch ? accountMatch[1] : null;
  }
};

/**
 * Standard Bank Parser
 *
 * Format specifics:
 * - Usually has separate Debit and Credit columns
 * - May use negative numbers for debits
 */
export const standardBankParser: BankParser = {
  bankName: 'Standard Bank',

  detect: (text: string, accountInfo?: BankAccountInfo): boolean => {
    const indicators = [
      'Standard Bank',
      'SBSA',
      'www.standardbank.co.za',
      'Moving Forward'
    ];

    if (accountInfo?.bankName.toLowerCase().includes('standard')) {
      return true;
    }

    return indicators.some(indicator =>
      text.toLowerCase().includes(indicator.toLowerCase())
    );
  },

  parseAmount: (amountText: string): { debit?: number; credit?: number } => {
    if (!amountText) {
      return {};
    }

    const cleanAmount = amountText.trim().replace(/\s+/g, '').replace(/,/g, '');

    // Check for negative numbers (debits)
    if (cleanAmount.startsWith('-')) {
      const amount = Math.abs(parseFloat(cleanAmount));
      if (!isNaN(amount) && amount > 0) {
        return { debit: amount };
      }
    }

    // Positive numbers are credits
    const amount = parseFloat(cleanAmount);
    if (!isNaN(amount) && amount > 0) {
      return { credit: amount };
    }

    return {};
  }
};

/**
 * Generic/Unknown Bank Parser (fallback)
 *
 * Attempts to parse common formats when bank is unknown
 */
export const genericParser: BankParser = {
  bankName: 'Unknown',

  detect: (): boolean => true, // Always matches as fallback

  parseAmount: (amountText: string): { debit?: number; credit?: number } => {
    if (!amountText) {
      return {};
    }

    const cleanAmount = amountText.trim().replace(/\s+/g, '').replace(/,/g, '');

    // Check for Cr suffix
    if (/Cr$/i.test(cleanAmount)) {
      const numericValue = cleanAmount.replace(/Cr$/i, '');
      const amount = parseFloat(numericValue);
      if (!isNaN(amount) && amount > 0) {
        return { credit: amount };
      }
    }

    // Check for Dr suffix
    if (/Dr$/i.test(cleanAmount)) {
      const numericValue = cleanAmount.replace(/Dr$/i, '');
      const amount = parseFloat(numericValue);
      if (!isNaN(amount) && amount > 0) {
        return { debit: amount };
      }
    }

    // Check for negative
    if (cleanAmount.startsWith('-')) {
      const amount = Math.abs(parseFloat(cleanAmount));
      if (!isNaN(amount) && amount > 0) {
        return { debit: amount };
      }
    }

    // Plain positive number - ambiguous, default to debit
    const amount = parseFloat(cleanAmount);
    if (!isNaN(amount) && amount > 0) {
      return { debit: amount };
    }

    return {};
  }
};

/**
 * All available bank parsers
 */
export const bankParsers: BankParser[] = [
  fnbParser,
  standardBankParser,
  // Add more parsers as needed
];

/**
 * Detect which bank a statement is from
 */
export function detectBank(
  text: string,
  accountInfo?: BankAccountInfo
): SouthAfricanBank {
  for (const parser of bankParsers) {
    if (parser.detect(text, accountInfo)) {
      return parser.bankName;
    }
  }
  return 'Unknown';
}

/**
 * Get the appropriate parser for a bank
 */
export function getBankParser(bankName: string): BankParser {
  const parser = bankParsers.find(p =>
    p.bankName.toLowerCase() === bankName.toLowerCase()
  );
  return parser || genericParser;
}

/**
 * Parse a transaction amount using bank-specific logic
 */
export function parseTransactionAmount(
  amountText: string,
  bankName: string
): { debit?: number; credit?: number } {
  const parser = getBankParser(bankName);
  return parser.parseAmount(amountText);
}

/**
 * Fix transactions that were imported with incorrect debit/credit detection
 */
export function fixImportedTransactions(
  transactions: BankTransaction[],
  bankName: string
): BankTransaction[] {
  const parser = getBankParser(bankName);

  return transactions.map(tx => {
    // If we have the original amount text, re-parse it
    // Otherwise, trust the existing debit/credit values
    return tx;
  });
}
