import { Creditor } from '@/types/financial';
import {
  CreditorMatch,
  Bill,
  BillSuggestion,
  MatchingConfig,
  DEFAULT_MATCHING_CONFIG,
} from '@/types/ai/entity-matching';
import {
  fuzzyMatch,
  extractKeyTerms,
  multiFieldSimilarity,
} from '@/lib/utils/string-matching';
import { CreditorService } from '@/lib/firebase/creditor-service';

/**
 * CreditorMatchingService - Intelligent Supplier Recognition
 * Phase 1: Entity Matching Foundation
 *
 * Matches bank transaction descriptions to supplier (creditor) records
 * using multiple matching strategies with confidence scoring
 */
export class CreditorMatchingService {
  private creditorService: CreditorService;
  private config: MatchingConfig;

  constructor(config: Partial<MatchingConfig> = {}) {
    this.creditorService = new CreditorService();
    this.config = { ...DEFAULT_MATCHING_CONFIG, ...config };
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  /**
   * Find matching supplier with confidence scoring
   *
   * @param companyId - Company ID for multi-tenant isolation
   * @param description - Bank transaction description
   * @param amount - Transaction amount (optional, for matching)
   * @param transactionDate - Transaction date (optional, for bill matching)
   * @returns CreditorMatch object or null if no match found
   */
  async findMatchingCreditor(
    companyId: string,
    description: string,
    amount?: number,
    transactionDate?: Date
  ): Promise<CreditorMatch | null> {
    console.log(`[CreditorMatchingService] Searching for creditor matching: "${description}"`);

    // Get all active creditors for the company
    const creditors = await this.creditorService.getCreditors(companyId, {
      status: 'active',
    });

    if (creditors.length === 0) {
      console.log('[CreditorMatchingService] No active creditors found');
      return null;
    }

    console.log(`[CreditorMatchingService] Searching through ${creditors.length} creditors`);

    // Extract key terms from description
    const searchTerms = extractKeyTerms(description);
    const searchString = searchTerms.join(' ');

    console.log(`[CreditorMatchingService] Key terms: ${searchTerms.join(', ')}`);

    // Find best match using multiple strategies
    let bestMatch: CreditorMatch | null = null;
    let highestConfidence = this.config.fuzzyMatchMinConfidence - 1;

    for (const creditor of creditors) {
      const matchResult = this.matchCreditor(creditor, searchString, description);

      if (matchResult && matchResult.confidence > highestConfidence) {
        // Get outstanding bills (placeholder - will be implemented when bills module exists)
        const outstandingBills = await this.getOutstandingBills(
          companyId,
          creditor.id
        );

        // Calculate outstanding balance
        const outstandingBalance = creditor.currentBalance || 0;

        // Try to suggest specific bill if amount provided
        let suggestedBill: BillSuggestion | undefined;
        if (amount && transactionDate && outstandingBills.length > 0) {
          suggestedBill = await this.suggestBillMatch(
            outstandingBills,
            amount,
            transactionDate
          );
        }

        bestMatch = {
          creditor,
          confidence: matchResult.confidence,
          matchedField: matchResult.matchedField as any,
          matchMethod: matchResult.matchMethod,
          outstandingBalance,
          outstandingBills,
          suggestedBill,
          matchDetails: matchResult.matchDetails,
        };

        highestConfidence = matchResult.confidence;

        console.log(
          `[CreditorMatchingService] Match found: ${creditor.name} (${matchResult.confidence}% confidence via ${matchResult.matchMethod})`
        );
      }
    }

    if (bestMatch) {
      console.log(
        `[CreditorMatchingService] Best match: ${bestMatch.creditor.name} ` +
        `(${bestMatch.confidence}% confidence, ${bestMatch.outstandingBills.length} bills, ` +
        `R${bestMatch.outstandingBalance.toFixed(2)} outstanding)`
      );

      // Add amount match bonus if applicable
      if (amount && bestMatch.suggestedBill?.exactAmountMatch) {
        bestMatch.confidence = Math.min(100, bestMatch.confidence + this.config.amountMatchBonus);
        console.log(
          `[CreditorMatchingService] Amount match bonus applied: ${bestMatch.confidence}%`
        );
      }

      // Add creditor type context
      if (bestMatch.creditor.creditorType) {
        console.log(
          `[CreditorMatchingService] Creditor type: ${bestMatch.creditor.creditorType}`
        );
      }
    } else {
      console.log('[CreditorMatchingService] No match found above confidence threshold');
    }

    return bestMatch;
  }

  /**
   * Get outstanding bills for a supplier
   * NOTE: Placeholder implementation - bills module to be implemented
   *
   * @param companyId - Company ID
   * @param creditorId - Creditor ID
   * @returns Array of outstanding bills
   */
  async getOutstandingBills(
    companyId: string,
    creditorId: string
  ): Promise<Bill[]> {
    try {
      // TODO: Implement bills module and service
      // For now, return empty array
      console.log('[CreditorMatchingService] Bills module not yet implemented');
      return [];
    } catch (error) {
      console.error('[CreditorMatchingService] Error getting outstanding bills:', error);
      return [];
    }
  }

  /**
   * Suggest best bill match based on amount and date proximity
   * NOTE: Placeholder implementation - bills module to be implemented
   *
   * @param bills - Array of outstanding bills
   * @param amount - Payment amount
   * @param transactionDate - Payment date
   * @returns BillSuggestion or null
   */
  async suggestBillMatch(
    bills: Bill[],
    amount: number,
    transactionDate: Date
  ): Promise<BillSuggestion | null> {
    if (bills.length === 0) {
      return null;
    }

    const tolerance = amount * this.config.amountTolerancePercent;
    let bestSuggestion: BillSuggestion | null = null;
    let highestScore = 0;

    for (const bill of bills) {
      const amountDue = bill.amountDue ?? 0;
      const amountDiff = Math.abs(amount - amountDue);

      // Check if amount matches (within tolerance)
      const exactAmountMatch = amountDiff <= tolerance;

      // Calculate date proximity in days
      const billDate = bill.date ? new Date(bill.date) : null;
      const daysProximity = billDate
        ? Math.abs(
            Math.floor(
              (transactionDate.getTime() - billDate.getTime()) /
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
        matchReasons.push(`Recent bill (${daysProximity} days ago)`);
      } else if (daysProximity <= 30) {
        matchScore += 15;
        matchReasons.push(`Within 30 days (${daysProximity} days ago)`);
      }

      // Overdue bonus (more likely to be paid)
      if (bill.status === 'overdue') {
        matchScore += 10;
        matchReasons.push('Overdue bill');
      }

      // Oldest bill bonus
      if (bill === bills[0]) {
        matchScore += 10;
        matchReasons.push('Oldest outstanding bill');
      }

      // Confidence calculation (0-100)
      const confidence = Math.min(100, matchScore);

      if (matchScore > highestScore) {
        bestSuggestion = {
          bill,
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
   * Match a single creditor against search terms
   *
   * @param creditor - Creditor to match
   * @param searchString - Cleaned search string
   * @param originalDescription - Original transaction description
   * @returns Match result with confidence
   */
  private matchCreditor(
    creditor: Creditor,
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
    if (creditor.name) {
      const nameMatch = fuzzyMatch(searchString, creditor.name, {
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
    if (creditor.email) {
      const emailMatch = fuzzyMatch(searchString, creditor.email, {
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
    if (creditor.name) {
      const descMatch = fuzzyMatch(originalDescription, creditor.name, {
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

    // Special handling for known creditor types
    if (creditor.creditorType) {
      const boostAmount = this.getCreditorTypeBoost(
        creditor.creditorType,
        originalDescription
      );

      if (boostAmount > 0 && results.length > 0) {
        results.forEach(result => {
          result.confidence = Math.min(100, result.confidence + boostAmount);
        });
        console.log(
          `[CreditorMatchingService] ${creditor.creditorType} boost applied: +${boostAmount}%`
        );
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
   * Get confidence boost based on creditor type keywords in description
   *
   * @param creditorType - Type of creditor
   * @param description - Transaction description
   * @returns Confidence boost (0-10)
   */
  private getCreditorTypeBoost(
    creditorType: string,
    description: string
  ): number {
    const lowerDesc = description.toLowerCase();

    switch (creditorType) {
      case 'tax-authority':
        if (lowerDesc.includes('sars') || lowerDesc.includes('tax')) {
          return 10;
        }
        break;

      case 'utility':
        if (
          lowerDesc.includes('eskom') ||
          lowerDesc.includes('municipal') ||
          lowerDesc.includes('water') ||
          lowerDesc.includes('electricity')
        ) {
          return 8;
        }
        break;

      case 'statutory':
        if (lowerDesc.includes('uif') || lowerDesc.includes('pension')) {
          return 8;
        }
        break;

      default:
        return 0;
    }

    return 0;
  }

  /**
   * Calculate match score using multiple factors
   *
   * @param description - Transaction description
   * @param creditor - Creditor to match
   * @returns Match score (0-100)
   */
  private calculateMatchScore(description: string, creditor: Creditor): number {
    const fields: Record<string, string> = {
      name: creditor.name || '',
      email: creditor.email || '',
    };

    const weights: Record<string, number> = {
      name: 0.8,
      email: 0.2,
    };

    return multiFieldSimilarity(description, fields, weights);
  }
}
