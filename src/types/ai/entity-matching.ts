import { Debtor, Creditor } from '@/types/financial';
import { Invoice } from '@/types/accounting/invoice';

/**
 * Entity Matching Types for AI Agent Debtor/Creditor Recognition
 * Phase 1: Entity Matching Foundation
 */

// ============================================================================
// Debtor (Customer) Matching
// ============================================================================

export interface DebtorMatch {
  debtor: Debtor;
  confidence: number; // 0-100
  matchedField: 'name' | 'tradingName' | 'abbreviation' | 'email';
  matchMethod: 'exact' | 'fuzzy' | 'partial' | 'alias';
  outstandingBalance: number;
  outstandingInvoices: Invoice[];
  suggestedInvoice?: InvoiceSuggestion;
  matchDetails?: {
    rawScore: number;
    normalizedScore: number;
    levenshteinDistance?: number;
    similarityRatio?: number;
  };
}

export interface InvoiceSuggestion {
  invoice: Invoice;
  matchScore: number; // 0-100
  matchReasons: string[];
  exactAmountMatch: boolean;
  dateProximityDays: number;
  confidence: number;
}

// ============================================================================
// Creditor (Supplier) Matching
// ============================================================================

export interface CreditorMatch {
  creditor: Creditor;
  confidence: number; // 0-100
  matchedField: 'name' | 'tradingName' | 'abbreviation';
  matchMethod: 'exact' | 'fuzzy' | 'partial' | 'alias';
  outstandingBalance: number;
  outstandingBills: Bill[];
  suggestedBill?: BillSuggestion;
  matchDetails?: {
    rawScore: number;
    normalizedScore: number;
    levenshteinDistance?: number;
    similarityRatio?: number;
  };
}

export interface BillSuggestion {
  bill: Bill;
  matchScore: number; // 0-100
  matchReasons: string[];
  exactAmountMatch: boolean;
  dateProximityDays: number;
  confidence: number;
}

// ============================================================================
// Bill Type (Temporary - until proper Bill type exists)
// ============================================================================

export interface Bill {
  id: string;
  billNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  dueDate?: string;
  amount: number;
  amountDue: number;
  amountPaid: number;
  status: 'draft' | 'sent' | 'partially-paid' | 'paid' | 'overdue' | 'cancelled';
  description?: string;
  reference?: string;
  lineItems?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Matching Configuration
// ============================================================================

export interface MatchingConfig {
  // Confidence thresholds
  exactMatchConfidence: number; // Default: 100
  tradingNameConfidence: number; // Default: 95
  fuzzyMatchMinConfidence: number; // Default: 70
  abbreviationConfidence: number; // Default: 85

  // Fuzzy matching parameters
  maxLevenshteinDistance: number; // Default: 3
  minSimilarityRatio: number; // Default: 0.7 (70%)

  // Amount matching
  amountMatchBonus: number; // Default: 5
  amountTolerancePercent: number; // Default: 0.01 (1%)

  // Date matching
  dateProximityMaxDays: number; // Default: 30
  dateProximityBonusPerDay: number; // Default: 1

  // Performance
  maxResultsToConsider: number; // Default: 100
  enableParallelSearch: boolean; // Default: true
}

export const DEFAULT_MATCHING_CONFIG: MatchingConfig = {
  exactMatchConfidence: 100,
  tradingNameConfidence: 95,
  fuzzyMatchMinConfidence: 70,
  abbreviationConfidence: 85,
  maxLevenshteinDistance: 3,
  minSimilarityRatio: 0.7,
  amountMatchBonus: 5,
  amountTolerancePercent: 0.01,
  dateProximityMaxDays: 30,
  dateProximityBonusPerDay: 1,
  maxResultsToConsider: 100,
  enableParallelSearch: true,
};

// ============================================================================
// Matching Context (for algorithm)
// ============================================================================

export interface MatchingContext {
  description: string; // Transaction description
  amount?: number; // Transaction amount
  transactionDate?: Date; // Transaction date
  searchTerm: string; // Cleaned search term
  entityType: 'debtor' | 'creditor';
  config: MatchingConfig;
}

// ============================================================================
// Matching Result (internal)
// ============================================================================

export interface MatchingResult<T> {
  entity: T;
  confidence: number;
  matchedField: string;
  matchMethod: 'exact' | 'fuzzy' | 'partial' | 'alias';
  matchDetails: {
    rawScore: number;
    normalizedScore: number;
    levenshteinDistance?: number;
    similarityRatio?: number;
  };
}
