import { Debtor } from '@/types/financial';
import { Invoice } from '@/types/accounting/invoice';
import {
  DebtorMatch,
  InvoiceSuggestion,
  MatchingConfig,
  DEFAULT_MATCHING_CONFIG,
  MatchingContext,
} from '@/types/ai/entity-matching';
import {
  fuzzyMatch,
  extractKeyTerms,
  multiFieldSimilarity,
  normalizeForMatching,
} from '@/lib/utils/string-matching';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { InvoiceService } from '@/lib/accounting/invoice-service';

/**
 * DebtorMatchingService - Intelligent Customer Recognition
 * Phase 1: Entity Matching Foundation
 *
 * Matches bank transaction descriptions to customer (debtor) records
 * using multiple matching strategies with confidence scoring
 */
export class DebtorMatchingService {
  private debtorService: DebtorService;
  private invoiceService: InvoiceService;
  private config: MatchingConfig;

  constructor(config: Partial<MatchingConfig> = {}) {
    this.debtorService = new DebtorService();
    this.invoiceService = new InvoiceService();
    this.config = { ...DEFAULT_MATCHING_CONFIG, ...config };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Find matching customer with confidence scoring
   *
   * @param companyId - Company ID for multi-tenant isolation
   * @param description - Bank transaction description
   * @param amount - Transaction amount (optional, for matching)
   * @param transactionDate - Transaction date (optional, for invoice matching)
   * @returns DebtorMatch object or null if no match found
   */
  async findMatchingDebtor(
    companyId: string,
    description: string,
    amount?: number,
    transactionDate?: Date
  ): Promise<DebtorMatch | null> {
    console.log(`[DebtorMatchingService] Searching for debtor matching: "${description}"`);

    // Get all active debtors for the company
    const debtors = await this.debtorService.getDebtors(companyId, {
      status: 'active',
    });

    if (debtors.length === 0) {
      console.log('[DebtorMatchingService] No active debtors found');
      return null;
    }

    console.log(`[DebtorMatchingService] Searching through ${debtors.length} debtors`);

    // Extract key terms from description
    const searchTerms = extractKeyTerms(description);
    const searchString = searchTerms.join(' ');

    console.log(`[DebtorMatchingService] Key terms: ${searchTerms.join(', ')}`);

    // Find best match using multiple strategies
    let bestMatch: DebtorMatch | null = null;
    let highestConfidence = this.config.fuzzyMatchMinConfidence - 1;

    for (const debtor of debtors) {
      const matchResult = this.matchDebtor(debtor, searchString, description);

      if (matchResult && matchResult.confidence > highestConfidence) {
        // Get outstanding invoices
        const outstandingInvoices = await this.getOutstandingInvoices(
          companyId,
          debtor.id
        );

        // Calculate outstanding balance
        const outstandingBalance = outstandingInvoices.reduce(
          (sum, inv) => sum + (inv.amountDue || 0),
          0
        );

        // Try to suggest specific invoice if amount provided
        let suggestedInvoice: InvoiceSuggestion | undefined;
        if (amount && transactionDate && outstandingInvoices.length > 0) {
          suggestedInvoice = await this.suggestInvoiceMatch(
            outstandingInvoices,
            amount,
            transactionDate
          );
        }

        bestMatch = {
          debtor,
          confidence: matchResult.confidence,
          matchedField: matchResult.matchedField as any,
          matchMethod: matchResult.matchMethod,
          outstandingBalance,
          outstandingInvoices,
          suggestedInvoice,
          matchDetails: matchResult.matchDetails,
        };

        highestConfidence = matchResult.confidence;

        console.log(
          `[DebtorMatchingService] Match found: ${debtor.name} (${matchResult.confidence}% confidence via ${matchResult.matchMethod})`
        );
      }
    }

    if (bestMatch) {
      console.log(
        `[DebtorMatchingService] Best match: ${bestMatch.debtor.name} ` +
        `(${bestMatch.confidence}% confidence, ${bestMatch.outstandingInvoices.length} invoices, ` +
        `R${bestMatch.outstandingBalance.toFixed(2)} outstanding)`
      );

      // Add amount match bonus if applicable
      if (amount && bestMatch.suggestedInvoice?.exactAmountMatch) {
        bestMatch.confidence = Math.min(100, bestMatch.confidence + this.config.amountMatchBonus);
        console.log(
          `[DebtorMatchingService] Amount match bonus applied: ${bestMatch.confidence}%`
        );
      }
    } else {
      console.log('[DebtorMatchingService] No match found above confidence threshold');
    }

    return bestMatch;
  }

  /**
   * Get outstanding invoices for a customer
   *
   * @param companyId - Company ID
   * @param debtorId - Debtor ID
   * @returns Array of outstanding invoices
   */
  async getOutstandingInvoices(
    companyId: string,
    debtorId: string
  ): Promise<Invoice[]> {
    try {
      // Get all invoices for this debtor
      const allInvoices = await this.invoiceService.getInvoicesByCustomer(
        companyId,
        debtorId
      );

      // Filter to only outstanding invoices (sent, partially paid, overdue)
      const outstandingInvoices = allInvoices.filter(
        invoice =>
          invoice.status &&
          ['sent', 'partially-paid', 'overdue'].includes(invoice.status) &&
          (invoice.amountDue ?? 0) > 0
      );

      // Sort by due date (oldest first)
      outstandingInvoices.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        return dateA - dateB;
      });

      return outstandingInvoices;
    } catch (error) {
      console.error('[DebtorMatchingService] Error getting outstanding invoices:', error);
      return [];
    }
  }

  /**
   * Suggest best invoice match based on amount and date proximity
   * Enhanced with multi-invoice detection and partial payment scenarios
   *
   * @param invoices - Array of outstanding invoices
   * @param amount - Payment amount
   * @param transactionDate - Payment date
   * @returns InvoiceSuggestion or null
   */
  async suggestInvoiceMatch(
    invoices: Invoice[],
    amount: number,
    transactionDate: Date
  ): Promise<InvoiceSuggestion | null> {
    if (invoices.length === 0) {
      return null;
    }

    const tolerance = amount * this.config.amountTolerancePercent;
    let bestSuggestion: InvoiceSuggestion | null = null;
    let highestScore = 0;

    for (const invoice of invoices) {
      const amountDue = invoice.amountDue ?? 0;
      const amountDiff = Math.abs(amount - amountDue);

      // Check if amount matches (within tolerance)
      const exactAmountMatch = amountDiff <= tolerance;

      // Calculate date proximity in days
      const invoiceDate = invoice.date ? new Date(invoice.date) : null;
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;

      const daysFromInvoice = invoiceDate
        ? Math.abs(
            Math.floor(
              (transactionDate.getTime() - invoiceDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 999;

      const daysFromDue = dueDate
        ? Math.floor(
            (transactionDate.getTime() - dueDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 999;

      // Calculate match score with weighted factors
      let matchScore = 0;
      const matchReasons: string[] = [];

      // 1. Amount scoring (weighted: 40 points max)
      if (exactAmountMatch) {
        matchScore += 40;
        matchReasons.push(`✓ Exact amount match: R${amountDue.toFixed(2)}`);
      } else if (amountDiff <= amount * 0.02) {
        // Within 2%
        matchScore += 35;
        matchReasons.push(`≈ Very close amount: R${amountDue.toFixed(2)} (±2%)`);
      } else if (amountDiff <= amount * 0.05) {
        // Within 5%
        matchScore += 25;
        matchReasons.push(`≈ Close amount: R${amountDue.toFixed(2)} (±5%)`);
      } else if (amountDiff <= amount * 0.10) {
        // Within 10%
        matchScore += 15;
        matchReasons.push(`~ Similar amount: R${amountDue.toFixed(2)} (±10%)`);
      } else if (amount < amountDue && (amount / amountDue) >= 0.25) {
        // Partial payment scenario (at least 25% of invoice)
        const percentage = Math.round((amount / amountDue) * 100);
        matchScore += 20;
        matchReasons.push(`⚡ Possible partial payment: ${percentage}% of R${amountDue.toFixed(2)}`);
      }

      // 2. Date proximity scoring (weighted: 25 points max)
      if (daysFromInvoice <= 3) {
        matchScore += 25;
        matchReasons.push(`📅 Very recent invoice (${daysFromInvoice} days)`);
      } else if (daysFromInvoice <= 7) {
        matchScore += 20;
        matchReasons.push(`📅 Recent invoice (${daysFromInvoice} days)`);
      } else if (daysFromInvoice <= 30) {
        matchScore += 12;
        matchReasons.push(`📅 Within 30 days (${daysFromInvoice} days)`);
      } else if (daysFromInvoice <= 60) {
        matchScore += 5;
        matchReasons.push(`📅 Within 60 days (${daysFromInvoice} days)`);
      }

      // 3. Due date proximity (weighted: 15 points max)
      if (dueDate) {
        if (daysFromDue >= -7 && daysFromDue <= 7) {
          // Paid within a week of due date (before or after)
          matchScore += 15;
          if (daysFromDue >= 0) {
            matchReasons.push(`⏰ Paid ${daysFromDue} days after due date`);
          } else {
            matchReasons.push(`⏰ Paid ${Math.abs(daysFromDue)} days before due date`);
          }
        } else if (daysFromDue > 7 && daysFromDue <= 30) {
          matchScore += 8;
          matchReasons.push(`⏰ Paid ${daysFromDue} days late`);
        }
      }

      // 4. Invoice status scoring (weighted: 15 points max)
      if (invoice.status === 'overdue') {
        matchScore += 15;
        matchReasons.push('🔴 Overdue invoice (high priority)');
      } else if (invoice.status === 'sent') {
        matchScore += 10;
        matchReasons.push('🟡 Sent invoice (awaiting payment)');
      } else if (invoice.status === 'partially-paid') {
        matchScore += 12;
        matchReasons.push('🟠 Partially paid (expecting remainder)');
      }

      // 5. Age priority (weighted: 5 points max)
      const invoiceIndex = invoices.indexOf(invoice);
      if (invoiceIndex === 0) {
        matchScore += 5;
        matchReasons.push('⏳ Oldest outstanding invoice');
      } else if (invoiceIndex < 3) {
        matchScore += 3;
        matchReasons.push('⏳ One of the oldest invoices');
      }

      // Confidence calculation (0-100)
      const confidence = Math.min(100, matchScore);

      if (matchScore > highestScore) {
        bestSuggestion = {
          invoice,
          matchScore,
          matchReasons,
          exactAmountMatch,
          dateProximityDays: daysFromInvoice,
          confidence,
        };
        highestScore = matchScore;
      }
    }

    return bestSuggestion;
  }

  /**
   * Detect multi-invoice payment scenarios
   * Returns combinations of invoices that together match the payment amount
   *
   * @param invoices - Array of outstanding invoices
   * @param amount - Payment amount
   * @returns Array of multi-invoice suggestions
   */
  async detectMultiInvoicePayment(
    invoices: Invoice[],
    amount: number
  ): Promise<{
    invoices: Invoice[];
    totalAmount: number;
    confidence: number;
    matchReasons: string[];
  }[]> {
    if (invoices.length < 2) {
      return [];
    }

    const tolerance = amount * this.config.amountTolerancePercent;
    const suggestions: {
      invoices: Invoice[];
      totalAmount: number;
      confidence: number;
      matchReasons: string[];
    }[] = [];

    // Try combinations of 2-5 invoices
    const maxCombinations = Math.min(invoices.length, 5);

    for (let size = 2; size <= maxCombinations; size++) {
      const combinations = this.getCombinations(invoices, size);

      for (const combo of combinations) {
        const totalAmount = combo.reduce((sum, inv) => sum + (inv.amountDue ?? 0), 0);
        const amountDiff = Math.abs(amount - totalAmount);

        if (amountDiff <= tolerance) {
          const matchReasons: string[] = [];
          let confidence = 0;

          // Exact match bonus
          if (amountDiff <= amount * 0.01) {
            confidence = 95;
            matchReasons.push(`✓ Exact match for ${combo.length} invoices`);
          } else if (amountDiff <= tolerance) {
            confidence = 85;
            matchReasons.push(`≈ Close match for ${combo.length} invoices (±${((amountDiff / amount) * 100).toFixed(1)}%)`);
          }

          // Add invoice details
          matchReasons.push(
            `Invoices: ${combo.map(inv => inv.invoiceNumber).join(', ')}`
          );
          matchReasons.push(
            `Total: R${totalAmount.toFixed(2)}`
          );

          suggestions.push({
            invoices: combo,
            totalAmount,
            confidence,
            matchReasons,
          });
        }
      }
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Return top 3 suggestions
    return suggestions.slice(0, 3);
  }

  /**
   * Detect partial payment scenarios
   * Suggests invoices where payment could be a partial payment
   *
   * @param invoices - Array of outstanding invoices
   * @param amount - Payment amount
   * @returns Array of partial payment suggestions
   */
  async detectPartialPayment(
    invoices: Invoice[],
    amount: number
  ): Promise<{
    invoice: Invoice;
    percentage: number;
    remainingAmount: number;
    confidence: number;
    matchReasons: string[];
  }[]> {
    const suggestions: {
      invoice: Invoice;
      percentage: number;
      remainingAmount: number;
      confidence: number;
      matchReasons: string[];
    }[] = [];

    for (const invoice of invoices) {
      const amountDue = invoice.amountDue ?? 0;

      // Only consider if payment is less than amount due
      if (amount < amountDue) {
        const percentage = (amount / amountDue) * 100;
        const remainingAmount = amountDue - amount;

        // Only suggest if payment is at least 10% of invoice
        if (percentage >= 10) {
          const matchReasons: string[] = [];
          let confidence = 0;

          // Round percentage scenarios (50%, 25%, 75%, 33%, 66%)
          if (Math.abs(percentage - 50) <= 2) {
            confidence = 90;
            matchReasons.push('💰 Likely half payment (50%)');
          } else if (Math.abs(percentage - 25) <= 2) {
            confidence = 85;
            matchReasons.push('💰 Likely quarter payment (25%)');
          } else if (Math.abs(percentage - 75) <= 2) {
            confidence = 85;
            matchReasons.push('💰 Likely three-quarters payment (75%)');
          } else if (Math.abs(percentage - 33.33) <= 2) {
            confidence = 80;
            matchReasons.push('💰 Likely one-third payment (33%)');
          } else if (Math.abs(percentage - 66.67) <= 2) {
            confidence = 80;
            matchReasons.push('💰 Likely two-thirds payment (67%)');
          } else if (percentage >= 80) {
            confidence = 70;
            matchReasons.push('💰 Large partial payment (>80%)');
          } else if (percentage >= 50) {
            confidence = 65;
            matchReasons.push('💰 Substantial partial payment (50-80%)');
          } else if (percentage >= 25) {
            confidence = 55;
            matchReasons.push('💰 Moderate partial payment (25-50%)');
          } else {
            confidence = 45;
            matchReasons.push('💰 Small partial payment (10-25%)');
          }

          matchReasons.push(
            `Invoice: ${invoice.invoiceNumber} - R${amountDue.toFixed(2)}`
          );
          matchReasons.push(
            `Payment covers ${percentage.toFixed(1)}% (R${amount.toFixed(2)})`
          );
          matchReasons.push(
            `Remaining: R${remainingAmount.toFixed(2)}`
          );

          suggestions.push({
            invoice,
            percentage,
            remainingAmount,
            confidence,
            matchReasons,
          });
        }
      }
    }

    // Sort by confidence (highest first)
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Return top 5 suggestions
    return suggestions.slice(0, 5);
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Generate combinations of invoices
   *
   * @param array - Array of invoices
   * @param size - Combination size
   * @returns Array of invoice combinations
   */
  private getCombinations<T>(array: T[], size: number): T[][] {
    if (size === 1) {
      return array.map(item => [item]);
    }

    const combinations: T[][] = [];

    for (let i = 0; i <= array.length - size; i++) {
      const head = array[i];
      const tailCombinations = this.getCombinations(array.slice(i + 1), size - 1);

      for (const tailCombination of tailCombinations) {
        combinations.push([head, ...tailCombination]);
      }
    }

    return combinations;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Match a single debtor against search terms
   *
   * @param debtor - Debtor to match
   * @param searchString - Cleaned search string
   * @param originalDescription - Original transaction description
   * @returns Match result with confidence
   */
  private matchDebtor(
    debtor: Debtor,
    searchString: string,
    originalDescription: string
  ): {
    confidence: number;
    matchedField: string;
    matchMethod: 'exact' | 'fuzzy' | 'partial' | 'alias';
    matchDetails: any;
  } | null {
    const results: Array<{
      confidence: number;
      matchedField: string;
      matchMethod: 'exact' | 'fuzzy' | 'partial' | 'alias';
      matchDetails: any;
    }> = [];

    // Try matching against name
    if (debtor.name) {
      const nameMatch = fuzzyMatch(searchString, debtor.name, {
        maxLevenshteinDistance: this.config.maxLevenshteinDistance,
        minSimilarityRatio: this.config.minSimilarityRatio,
      });

      if (nameMatch.isMatch) {
        results.push({
          confidence: nameMatch.confidence,
          matchedField: 'name',
          matchMethod: nameMatch.matchType as any,
          matchDetails: nameMatch.details,
        });
      }
    }

    // Try matching against email
    if (debtor.email) {
      const emailMatch = fuzzyMatch(searchString, debtor.email, {
        maxLevenshteinDistance: this.config.maxLevenshteinDistance,
        minSimilarityRatio: this.config.minSimilarityRatio,
      });

      if (emailMatch.isMatch) {
        results.push({
          confidence: emailMatch.confidence,
          matchedField: 'email',
          matchMethod: emailMatch.matchType as any,
          matchDetails: emailMatch.details,
        });
      }
    }

    // Try matching with original description (sometimes names appear differently)
    if (debtor.name) {
      const descMatch = fuzzyMatch(originalDescription, debtor.name, {
        maxLevenshteinDistance: this.config.maxLevenshteinDistance + 1,
        minSimilarityRatio: this.config.minSimilarityRatio - 0.1,
        checkPartialWords: true,
      });

      if (descMatch.isMatch) {
        results.push({
          confidence: Math.round(descMatch.confidence * 0.9), // Slightly lower confidence
          matchedField: 'name',
          matchMethod: descMatch.matchType as any,
          matchDetails: descMatch.details,
        });
      }
    }

    // Return best match
    if (results.length > 0) {
      return results.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
    }

    return null;
  }

  /**
   * Calculate match score using multiple factors
   *
   * @param description - Transaction description
   * @param debtor - Debtor to match
   * @returns Match score (0-100)
   */
  private calculateMatchScore(description: string, debtor: Debtor): number {
    const fields: Record<string, string> = {
      name: debtor.name || '',
      email: debtor.email || '',
    };

    const weights: Record<string, number> = {
      name: 0.8,
      email: 0.2,
    };

    return multiFieldSimilarity(description, fields, weights);
  }
}
