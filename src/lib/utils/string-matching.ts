/**
 * String Matching Utilities for Entity Recognition
 * Includes Levenshtein distance, similarity ratio, and other fuzzy matching algorithms
 */

// ============================================================================
// Levenshtein Distance Algorithm
// ============================================================================

/**
 * Calculate the Levenshtein distance between two strings
 * Returns the minimum number of single-character edits (insertions, deletions, substitutions)
 * required to change one string into the other
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Levenshtein distance (0 = identical strings)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create a 2D array for dynamic programming
  const dp: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first column and row
  for (let i = 0; i <= len1; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    dp[0][j] = j;
  }

  // Fill the dp table
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        // Characters match, no operation needed
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        // Take minimum of three operations: insert, delete, substitute
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // deletion
          dp[i][j - 1] + 1,     // insertion
          dp[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }

  return dp[len1][len2];
}

// ============================================================================
// Similarity Ratio (0-1)
// ============================================================================

/**
 * Calculate similarity ratio between two strings using Levenshtein distance
 * Returns a value between 0 (completely different) and 1 (identical)
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity ratio (0-1)
 */
export function similarityRatio(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length);

  if (maxLength === 0) {
    return 1.0; // Both strings are empty
  }

  const distance = levenshteinDistance(str1, str2);
  return 1.0 - distance / maxLength;
}

// ============================================================================
// Normalized String for Matching
// ============================================================================

/**
 * Normalize a string for matching by removing special characters,
 * extra spaces, and converting to lowercase
 *
 * @param str - String to normalize
 * @returns Normalized string
 */
export function normalizeForMatching(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Replace special chars with spaces
    .replace(/\s+/g, ' ')      // Normalize multiple spaces to single space
    .trim();
}

// ============================================================================
// Contains Match (Substring)
// ============================================================================

/**
 * Check if one string contains another (case-insensitive)
 *
 * @param haystack - String to search in
 * @param needle - String to search for
 * @returns True if haystack contains needle
 */
export function containsMatch(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeForMatching(haystack);
  const normalizedNeedle = normalizeForMatching(needle);
  return normalizedHaystack.includes(normalizedNeedle);
}

// ============================================================================
// Partial Match (Word-based)
// ============================================================================

/**
 * Check if any words from needle appear in haystack
 *
 * @param haystack - String to search in
 * @param needle - String with words to search for
 * @param minWordLength - Minimum word length to consider (default: 3)
 * @returns Percentage of words found (0-100)
 */
export function partialWordMatch(
  haystack: string,
  needle: string,
  minWordLength: number = 3
): number {
  const haystackWords = normalizeForMatching(haystack).split(' ');
  const needleWords = normalizeForMatching(needle)
    .split(' ')
    .filter(word => word.length >= minWordLength);

  if (needleWords.length === 0) {
    return 0;
  }

  const matchedWords = needleWords.filter(needleWord =>
    haystackWords.some(haystackWord => haystackWord.includes(needleWord))
  );

  return (matchedWords.length / needleWords.length) * 100;
}

// ============================================================================
// Abbreviation Match
// ============================================================================

/**
 * Check if a string could be an abbreviation of another
 * E.g., "ABC" matches "ABC Company", "AVI" matches "AVI Products"
 *
 * @param abbrev - Potential abbreviation
 * @param fullName - Full name to match against
 * @returns True if abbreviation matches
 */
export function isAbbreviationMatch(abbrev: string, fullName: string): boolean {
  const normalizedAbbrev = normalizeForMatching(abbrev).replace(/\s/g, '');
  const words = normalizeForMatching(fullName).split(' ');

  // Check if abbreviation matches first letters of words
  if (normalizedAbbrev.length <= words.length) {
    const firstLetters = words
      .slice(0, normalizedAbbrev.length)
      .map(word => word[0])
      .join('');

    if (firstLetters === normalizedAbbrev) {
      return true;
    }
  }

  // Check if abbreviation is a substring (e.g., "AVI" in "AVI Products")
  if (words.some(word => word === normalizedAbbrev)) {
    return true;
  }

  return false;
}

// ============================================================================
// Fuzzy Match with Confidence
// ============================================================================

/**
 * Perform fuzzy matching with confidence scoring
 *
 * @param searchTerm - Term to search for
 * @param targetString - String to match against
 * @param options - Matching options
 * @returns Match result with confidence score
 */
export interface FuzzyMatchOptions {
  maxLevenshteinDistance?: number;
  minSimilarityRatio?: number;
  checkAbbreviation?: boolean;
  checkPartialWords?: boolean;
}

export interface FuzzyMatchResult {
  isMatch: boolean;
  confidence: number; // 0-100
  matchType: 'exact' | 'fuzzy' | 'partial' | 'abbreviation' | 'none';
  details: {
    levenshteinDistance?: number;
    similarityRatio?: number;
    partialMatchScore?: number;
  };
}

export function fuzzyMatch(
  searchTerm: string,
  targetString: string,
  options: FuzzyMatchOptions = {}
): FuzzyMatchResult {
  const {
    maxLevenshteinDistance = 3,
    minSimilarityRatio = 0.7,
    checkAbbreviation = true,
    checkPartialWords = true,
  } = options;

  const normalizedSearch = normalizeForMatching(searchTerm);
  const normalizedTarget = normalizeForMatching(targetString);

  // Exact match
  if (normalizedSearch === normalizedTarget) {
    return {
      isMatch: true,
      confidence: 100,
      matchType: 'exact',
      details: {
        levenshteinDistance: 0,
        similarityRatio: 1.0,
      },
    };
  }

  // Levenshtein distance check
  const distance = levenshteinDistance(normalizedSearch, normalizedTarget);
  const ratio = similarityRatio(normalizedSearch, normalizedTarget);

  if (distance <= maxLevenshteinDistance && ratio >= minSimilarityRatio) {
    const confidence = Math.round(ratio * 100);
    return {
      isMatch: true,
      confidence,
      matchType: 'fuzzy',
      details: {
        levenshteinDistance: distance,
        similarityRatio: ratio,
      },
    };
  }

  // Abbreviation check
  if (checkAbbreviation && isAbbreviationMatch(normalizedSearch, normalizedTarget)) {
    return {
      isMatch: true,
      confidence: 85,
      matchType: 'abbreviation',
      details: {},
    };
  }

  // Partial word match
  if (checkPartialWords) {
    const partialScore = partialWordMatch(normalizedTarget, normalizedSearch);
    if (partialScore >= 50) {
      return {
        isMatch: true,
        confidence: Math.round(partialScore),
        matchType: 'partial',
        details: {
          partialMatchScore: partialScore,
        },
      };
    }
  }

  // No match
  return {
    isMatch: false,
    confidence: 0,
    matchType: 'none',
    details: {
      levenshteinDistance: distance,
      similarityRatio: ratio,
    },
  };
}

// ============================================================================
// Extract Key Terms from Description
// ============================================================================

/**
 * Extract significant terms from a transaction description
 * Removes common words, numbers, and noise
 *
 * @param description - Transaction description
 * @returns Array of key terms
 */
export function extractKeyTerms(description: string): string[] {
  const commonWords = new Set([
    'payment', 'transfer', 'deposit', 'debit', 'credit', 'from', 'to',
    'ref', 'reference', 'the', 'and', 'for', 'bank', 'account', 'magtape'
  ]);

  const normalized = normalizeForMatching(description);
  const words = normalized.split(' ');

  return words
    .filter(word => word.length >= 3)
    .filter(word => !commonWords.has(word))
    .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
}

// ============================================================================
// Similarity Score with Multiple Fields
// ============================================================================

/**
 * Calculate a weighted similarity score across multiple fields
 *
 * @param searchTerm - Term to search for
 * @param fields - Object with field names and values
 * @param weights - Weight for each field (optional)
 * @returns Weighted similarity score (0-100)
 */
export function multiFieldSimilarity(
  searchTerm: string,
  fields: Record<string, string>,
  weights: Record<string, number> = {}
): number {
  const fieldNames = Object.keys(fields);

  // Default equal weights if not provided
  const defaultWeight = 1.0 / fieldNames.length;
  const normalizedWeights = fieldNames.reduce((acc, fieldName) => {
    acc[fieldName] = weights[fieldName] ?? defaultWeight;
    return acc;
  }, {} as Record<string, number>);

  let totalScore = 0;
  let totalWeight = 0;

  for (const fieldName of fieldNames) {
    const fieldValue = fields[fieldName];
    if (!fieldValue) continue;

    const matchResult = fuzzyMatch(searchTerm, fieldValue);
    const weight = normalizedWeights[fieldName];

    totalScore += matchResult.confidence * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}
