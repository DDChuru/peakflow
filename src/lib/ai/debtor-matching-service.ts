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
      const daysProximity = invoiceDate
        ? Math.abs(
            Math.floor(
              (transactionDate.getTime() - invoiceDate.getTime()) /
                (1000 * 60 * 60 * 24)
            )
          )
        : 999;

      // Calculate match score
      let matchScore = 0;
      const matchReasons: string[] = [];

      // Amount scoring
      if (exactAmountMatch) {
        matchScore += 50;
        matchReasons.push(`Exact amount match: R${amountDue.toFixed(2)}`);
      } else if (amountDiff <= amount * 0.05) {
        // Within 5%
        matchScore += 25;
        matchReasons.push(`Close amount match: R${amountDue.toFixed(2)}`);
      }

      // Date proximity scoring
      if (daysProximity <= 7) {
        matchScore += 30;
        matchReasons.push(`Recent invoice (${daysProximity} days ago)`);
      } else if (daysProximity <= 30) {
        matchScore += 15;
        matchReasons.push(`Within 30 days (${daysProximity} days ago)`);
      }

      // Overdue bonus (more likely to be paid)
      if (invoice.status === 'overdue') {
        matchScore += 10;
        matchReasons.push('Overdue invoice');
      }

      // Oldest invoice bonus
      if (invoice === invoices[0]) {
        matchScore += 10;
        matchReasons.push('Oldest outstanding invoice');
      }

      // Confidence calculation (0-100)
      const confidence = Math.min(100, matchScore);

      if (matchScore > highestScore) {
        bestSuggestion = {
          invoice,
          matchScore,
          matchReasons,
          exactAmountMatch,
          dateProximityDays: daysProximity,
          confidence,
        };
        highestScore = matchScore;
      }
    }

    return bestSuggestion;
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
