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
   * Enhanced with multi-bill detection and partial payment scenarios
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
      const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;

      const daysFromBill = billDate
        ? Math.abs(
            Math.floor(
              (transactionDate.getTime() - billDate.getTime()) /
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
        // Partial payment scenario (at least 25% of bill)
        const percentage = Math.round((amount / amountDue) * 100);
        matchScore += 20;
        matchReasons.push(`⚡ Possible partial payment: ${percentage}% of R${amountDue.toFixed(2)}`);
      }

      // 2. Date proximity scoring (weighted: 25 points max)
      if (daysFromBill <= 3) {
        matchScore += 25;
        matchReasons.push(`📅 Very recent bill (${daysFromBill} days)`);
      } else if (daysFromBill <= 7) {
        matchScore += 20;
        matchReasons.push(`📅 Recent bill (${daysFromBill} days)`);
      } else if (daysFromBill <= 30) {
        matchScore += 12;
        matchReasons.push(`📅 Within 30 days (${daysFromBill} days)`);
      } else if (daysFromBill <= 60) {
        matchScore += 5;
        matchReasons.push(`📅 Within 60 days (${daysFromBill} days)`);
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

      // 4. Bill status scoring (weighted: 15 points max)
      if (bill.status === 'overdue') {
        matchScore += 15;
        matchReasons.push('🔴 Overdue bill (high priority)');
      } else if (bill.status === 'sent') {
        matchScore += 10;
        matchReasons.push('🟡 Sent bill (awaiting payment)');
      } else if (bill.status === 'partially-paid') {
        matchScore += 12;
        matchReasons.push('🟠 Partially paid (expecting remainder)');
      }

      // 5. Age priority (weighted: 5 points max)
      const billIndex = bills.indexOf(bill);
      if (billIndex === 0) {
        matchScore += 5;
        matchReasons.push('⏳ Oldest outstanding bill');
      } else if (billIndex < 3) {
        matchScore += 3;
        matchReasons.push('⏳ One of the oldest bills');
      }

      // Confidence calculation (0-100)
      const confidence = Math.min(100, matchScore);

      if (matchScore > highestScore) {
        bestSuggestion = {
          bill,
          matchScore,
          matchReasons,
          exactAmountMatch,
          dateProximityDays: daysFromBill,
          confidence,
        };
        highestScore = matchScore;
      }
    }

    return bestSuggestion;
  }

  /**
   * Detect multi-bill payment scenarios
   * Returns combinations of bills that together match the payment amount
   *
   * @param bills - Array of outstanding bills
   * @param amount - Payment amount
   * @returns Array of multi-bill suggestions
   */
  async detectMultiBillPayment(
    bills: Bill[],
    amount: number
  ): Promise<{
    bills: Bill[];
    totalAmount: number;
    confidence: number;
    matchReasons: string[];
  }[]> {
    if (bills.length < 2) {
      return [];
    }

    const tolerance = amount * this.config.amountTolerancePercent;
    const suggestions: {
      bills: Bill[];
      totalAmount: number;
      confidence: number;
      matchReasons: string[];
    }[] = [];

    // Try combinations of 2-5 bills
    const maxCombinations = Math.min(bills.length, 5);

    for (let size = 2; size <= maxCombinations; size++) {
      const combinations = this.getCombinations(bills, size);

      for (const combo of combinations) {
        const totalAmount = combo.reduce((sum, bill) => sum + (bill.amountDue ?? 0), 0);
        const amountDiff = Math.abs(amount - totalAmount);

        if (amountDiff <= tolerance) {
          const matchReasons: string[] = [];
          let confidence = 0;

          // Exact match bonus
          if (amountDiff <= amount * 0.01) {
            confidence = 95;
            matchReasons.push(`✓ Exact match for ${combo.length} bills`);
          } else if (amountDiff <= tolerance) {
            confidence = 85;
            matchReasons.push(`≈ Close match for ${combo.length} bills (±${((amountDiff / amount) * 100).toFixed(1)}%)`);
          }

          // Add bill details
          matchReasons.push(
            `Bills: ${combo.map(b => b.billNumber).join(', ')}`
          );
          matchReasons.push(
            `Total: R${totalAmount.toFixed(2)}`
          );

          suggestions.push({
            bills: combo,
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
   * Suggests bills where payment could be a partial payment
   *
   * @param bills - Array of outstanding bills
   * @param amount - Payment amount
   * @returns Array of partial payment suggestions
   */
  async detectPartialPayment(
    bills: Bill[],
    amount: number
  ): Promise<{
    bill: Bill;
    percentage: number;
    remainingAmount: number;
    confidence: number;
    matchReasons: string[];
  }[]> {
    const suggestions: {
      bill: Bill;
      percentage: number;
      remainingAmount: number;
      confidence: number;
      matchReasons: string[];
    }[] = [];

    for (const bill of bills) {
      const amountDue = bill.amountDue ?? 0;

      // Only consider if payment is less than amount due
      if (amount < amountDue) {
        const percentage = (amount / amountDue) * 100;
        const remainingAmount = amountDue - amount;

        // Only suggest if payment is at least 10% of bill
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
            `Bill: ${bill.billNumber} - R${amountDue.toFixed(2)}`
          );
          matchReasons.push(
            `Payment covers ${percentage.toFixed(1)}% (R${amount.toFixed(2)})`
          );
          matchReasons.push(
            `Remaining: R${remainingAmount.toFixed(2)}`
          );

          suggestions.push({
            bill,
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
   * Generate combinations of bills
   *
   * @param array - Array of bills
   * @param size - Combination size
   * @returns Array of bill combinations
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
