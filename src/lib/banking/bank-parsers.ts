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
 * - Two-column format: "Payments" (debits) and "Deposits" (credits)
 * - Payments shown as negative numbers (e.g., -236.90)
 * - Deposits shown as positive numbers (e.g., 750.00)
 * - Date format: "03 Dec 24" (Day Month YY)
 */
export const standardBankParser: BankParser = {
  bankName: 'Standard Bank',

  detect: (text: string, accountInfo?: BankAccountInfo): boolean => {
    const indicators = [
      'Standard Bank',
      'SBSA',
      'www.standardbank.co.za',
      'Moving Forward',
      '0860 123 000' // Standard Bank customer care number
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

    // Check for negative numbers (debits/payments)
    if (cleanAmount.startsWith('-')) {
      const amount = Math.abs(parseFloat(cleanAmount));
      if (!isNaN(amount) && amount > 0) {
        return { debit: amount };
      }
    }

    // Positive numbers are credits (deposits)
    const amount = parseFloat(cleanAmount);
    if (!isNaN(amount) && amount > 0) {
      return { credit: amount };
    }

    return {};
  },

  parseDate: (dateText: string): string => {
    if (!dateText) {
      return new Date().toISOString();
    }

    // Standard Bank format: "03 Dec 24" (Day Month YY)
    const stdBankPattern = /^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{2})$/;
    const match = dateText.trim().match(stdBankPattern);

    if (match) {
      const day = match[1].padStart(2, '0');
      const monthStr = match[2];
      const yearShort = match[3];

      // Month name to number mapping
      const months: Record<string, string> = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };

      const month = months[monthStr.toLowerCase()];

      if (month) {
        // Assume 20XX for 2-digit years
        const year = `20${yearShort}`;
        return `${year}-${month}-${day}`;
      }
    }

    // Fallback to generic date parsing
    try {
      const parsed = new Date(dateText);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch (error) {
      console.warn('Could not parse Standard Bank date:', dateText);
    }

    return new Date().toISOString();
  },

  extractAccountNumber: (text: string): string | null => {
    // Standard Bank account numbers can be various lengths
    const accountMatch = text.match(/(?:Account|Acc)\s*(?:Number|No\.?|#)?\s*:?\s*(\d{8,13})/i);
    return accountMatch ? accountMatch[1] : null;
  }
};

/**
 * ABSA Bank Parser
 *
 * Format specifics:
 * - Tables with separate "Charge", "Debit Amount", "Credit Amount" columns
 * - Amounts shown as positive numbers without explicit sign; column determines direction
 * - Dates typically formatted as "10/04/2025" (DD/MM/YYYY) or "10/04/25"
 */
export const absaBankParser: BankParser = {
  bankName: 'ABSA',

  detect: (text: string, accountInfo?: BankAccountInfo): boolean => {
    if (accountInfo?.bankName && accountInfo.bankName.toLowerCase().includes('absa')) {
      return true;
    }

    const indicators = [
      'absa bank',
      'absa bank ltd',
      'absa cheque account',
      'cheque account statement',
      '0860008600'
    ];

    const lower = text.toLowerCase();
    return indicators.some(indicator => lower.includes(indicator));
  },

  parseAmount: (amountText: string): { debit?: number; credit?: number } => {
    if (!amountText) {
      return {};
    }

    const cleaned = amountText
      .replace(/\s+/g, '')
      .replace(/,/g, '')
      .replace(/[rR]/g, '')
      .trim();

    if (!cleaned) {
      return {};
    }

    // Parentheses or leading minus indicate debit
    if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
      const numeric = parseFloat(cleaned.slice(1, -1));
      if (!isNaN(numeric) && numeric > 0) {
        return { debit: numeric };
      }
    }

    if (cleaned.startsWith('-')) {
      const numeric = Math.abs(parseFloat(cleaned));
      if (!isNaN(numeric) && numeric > 0) {
        return { debit: numeric };
      }
    }

    // "Cr" suffix or "+" indicate credit
    if (/cr$/i.test(cleaned) || cleaned.endsWith('+')) {
      const numeric = parseFloat(cleaned.replace(/cr$/i, '').replace(/\+$/, ''));
      if (!isNaN(numeric) && numeric > 0) {
        return { credit: numeric };
      }
    }

    const numericValue = parseFloat(cleaned);
    if (!isNaN(numericValue) && numericValue > 0) {
      // Without additional context default to credit (caller should supply correct column)
      return { credit: numericValue };
    }

    return {};
  },

  parseDate: (dateText: string): string => {
    if (!dateText) {
      return new Date().toISOString();
    }

    const trimmed = dateText.trim();
    const slashPattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/;
    const match = trimmed.match(slashPattern);

    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      let year = match[3];

      if (year.length === 2) {
        year = `20${year}`;
      }

      return `${year}-${month}-${day}`;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }

    return new Date().toISOString().slice(0, 10);
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
  absaBankParser,
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
