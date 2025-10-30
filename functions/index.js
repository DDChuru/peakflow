const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { setGlobalOptions } = require('firebase-functions/v2');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors')({ origin: true });
const logger = require('firebase-functions/logger');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Firestore
const db = admin.firestore();

// Extraction templates for different document types
const EXTRACTION_TEMPLATES = {
  audit: {
    name: 'Audit Report',
    prompt: `Extract ALL information from EVERY PAGE of this audit report document.

EXTRACTION REQUIREMENTS:

1. Section Headers and Descriptions:
   - CRITICAL: Look for section headers that include scores (e.g., "DISPATCH AWNING/LOADING AREA    12.8/15    85.6%")
   - Extract the section name, score, and percentage from these headers
   - IMPORTANT: Capture the descriptive paragraph that appears immediately after each section header
   - These descriptions explain what the section evaluates (usually in italics or different formatting)

2. Audit Metadata:
   - Audit title and type
   - Audit date and location
   - Auditor information
   - Overall scores and ratings

3. Tables:
   - Extract ALL tables with question numbers, descriptions, scores, status, and comments
   - Preserve complete column headers and all rows
   - Group tables with their corresponding section headers

Output the data in a structured JSON format with sections, tables, and metadata.

CRITICAL INSTRUCTIONS:
- PATTERN TO LOOK FOR: Section header with score → Description paragraph → Table with details
- Each section typically has: NAME + SCORE (X/Y) + PERCENTAGE%
- Process ALL PAGES of the document
- Group related information together`
  },

  invoice: {
    name: 'Invoice',
    prompt: `Extract ALL information from this invoice document.

EXTRACTION REQUIREMENTS:

1. Invoice Header:
   - Invoice number, date, due date
   - Vendor/supplier information
   - Customer/buyer information
   - Payment terms

2. Line Items:
   - Product/service descriptions
   - Quantities, unit prices, amounts
   - Tax rates and amounts
   - Discounts if applicable

3. Totals:
   - Subtotal, tax total, grand total
   - Payment instructions
   - Bank details if present

Output as structured JSON with clear separation of header, line items, and totals.`
  },

  bankStatement: {
    name: 'Bank Statement',
    prompt: `Extract ALL information from this COMPLETE multi-page bank statement. Output VALID JSON only.

⚠️ CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. This PDF may contain 50-68+ PAGES with 200-350+ transactions
2. You MUST scan through EVERY SINGLE PAGE from page 1 to the LAST page
3. Do NOT stop after the first 10-20 transactions or first few pages
4. Continue reading until you reach the CLOSING BALANCE on the FINAL page
5. Bank statements typically have:
   - Opening balance on first page
   - Transactions continuing across many pages
   - Closing balance on LAST page
6. If approaching token limit, gracefully end with the last COMPLETE transaction
7. DO NOT output incomplete transactions - end the array at the previous complete one
8. DO NOT invent or guess transaction dates - only extract what is clearly visible

CRITICAL JSON FORMATTING:
- ALL numeric values MUST be numbers, NOT strings (use 39492.58, NOT "39,492.58")
- Remove ALL commas from numbers (use 1000.50, NOT "1,000.50")
- ALL dates MUST be ISO format strings: "YYYY-MM-DD" (e.g., "2024-12-03")
- Use null for missing values (NOT undefined, NOT empty strings for optional fields)
- Ensure ALL JSON is well-formed with proper closing braces/brackets

CRITICAL DATE FORMAT REQUIREMENTS:
- ALL dates MUST use ISO format: "YYYY-MM-DD" (e.g., "2024-12-19")
- ALWAYS use 4-digit years (NEVER use 2-digit years)
- If the PDF shows "03 Dec 24", interpret as "2024-12-03" (20XX century assumed)
- If the PDF shows "15 Feb 25", interpret as "2025-02-15"
- If the PDF shows "16 May 25", interpret as "2025-05-16"
- Statement period dates MUST also be ISO format

CRITICAL NUMBER FORMAT REQUIREMENTS:
- ALL numbers MUST be numeric values without commas
- Examples:
  * CORRECT: 39492.58 (number)
  * WRONG: "39,492.58" (string with comma)
  * CORRECT: 750.00 (number)
  * WRONG: "750.00" (string)

CRITICAL: STANDARD BANK AMOUNT EXTRACTION (Two-Column Format):
Standard Bank statements have TWO separate amount columns:
- "Payments" column (RED with negative sign, e.g., "-236.90") = DEBIT (money OUT)
- "Deposits" column (GREEN, e.g., "750.00") = CREDIT (money IN)

For Standard Bank transactions:
1. If amount is in "Payments" column → set "debit" field as NUMBER (absolute value)
2. If amount is in "Deposits" column → set "credit" field as NUMBER
3. NEVER put the same amount in both debit AND credit fields
4. Examples:
   - Payments: -236.90, Deposits: blank → {"debit": 236.90, "credit": null}
   - Payments: blank, Deposits: 750.00 → {"debit": null, "credit": 750.00}

ABSA BANK SPECIFIC:
- Statements list separate columns: "Charge", "Debit Amount", "Credit Amount".
- MONEY OUT (charges or debits):
  * If a value appears under "Charge" or "Debit Amount", set "debit" to that positive number and set "credit" to null.
- MONEY IN (credits):
  * If a value appears under "Credit Amount", set "credit" to that positive number and set "debit" to null.
- Do NOT duplicate the same amount in both debit and credit.
- Dates are typically written as "DD/MM/YYYY" or "DD/MM/YY" (e.g., "10/04/2025"). ALWAYS convert to ISO "YYYY-MM-DD".
- Ensure accountInfo.bankName is set to "ABSA Bank" for ABSA statements.

EXTRACTION REQUIREMENTS:

1. Account Information (accountInfo object):
   - accountNumber: string
   - accountName: string
   - accountType: string
   - statementPeriod: {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}
   - bankName: string (detect "Standard Bank", "FNB", etc.)
   - branch: string

2. Summary (summary object) - ALL VALUES MUST BE NUMBERS:
   - openingBalance: number (NO commas, NO quotes)
   - closingBalance: number
   - totalDeposits: number
   - totalWithdrawals: number
   - interestEarned: number or null
   - feesCharged: number or null

3. Transactions (transactions array) - ALL AMOUNTS MUST BE NUMBERS:
   Each transaction object:
   - date: "YYYY-MM-DD" (ISO format string)
   - description: string
   - debit: number or null (NO quotes, NO commas)
   - credit: number or null (NO quotes, NO commas)
   - balance: number (NO quotes, NO commas)
   - reference: string or null

Output complete, valid JSON. Ensure all braces and brackets are closed.`
  },

  contract: {
    name: 'Contract',
    prompt: `Extract ALL information from this contract document.

EXTRACTION REQUIREMENTS:

1. Contract Parties:
   - All party names, addresses, and roles
   - Legal entity types
   - Representative information

2. Contract Terms:
   - Effective date, expiration date
   - Key obligations and deliverables
   - Payment terms and schedules
   - Termination clauses

3. Legal Provisions:
   - Governing law
   - Dispute resolution
   - Confidentiality terms
   - Liability and indemnification

Output as structured JSON with all contract details organized by section.`
  },

  generic: {
    name: 'Generic Document',
    prompt: `Extract ALL information from EVERY PAGE of this PDF document comprehensively.

EXTRACTION REQUIREMENTS:

1. Document Metadata:
   - Title, type, dates, version numbers
   - Author/organization information
   - Any reference numbers or IDs

2. Content Structure:
   - Headers and sections
   - Paragraphs and text blocks
   - Lists and bullet points

3. Tables:
   - ALL tables with headers and data
   - Preserve structure and relationships

4. Key-Value Pairs:
   - Any field with label and value
   - Form fields and data

Output as comprehensive structured JSON capturing all information.`
  }
};


// Helper function to extract from PDF using Gemini
function parseGeminiJson(responseText) {
  if (typeof responseText !== 'string' || responseText.trim() === '') {
    logger.error('[Gemini Parser] Empty response received');
    throw new Error('Gemini returned an empty response');
  }

  logger.info('[Gemini Parser] Raw response length:', responseText.length);
  logger.info('[Gemini Parser] Raw response preview (first 500 chars):', responseText.substring(0, 500));
  logger.info('[Gemini Parser] Raw response end (last 300 chars):', responseText.substring(Math.max(0, responseText.length - 300)));

  const cleaned = responseText.replace(/```json\s*|```/gi, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIndex = 0;

  if (firstBrace === -1 && firstBracket === -1) {
    logger.error('[Gemini Parser] No JSON detected - no opening brace or bracket found');
    logger.error('[Gemini Parser] Full cleaned response:', cleaned.substring(0, 2000));
    startIndex = 0;
  } else if (firstBrace === -1) {
    startIndex = firstBracket;
  } else if (firstBracket === -1) {
    startIndex = firstBrace;
  } else {
    startIndex = Math.min(firstBrace, firstBracket);
  }

  const candidate = cleaned.slice(Math.max(startIndex, 0));
  logger.info('[Gemini Parser] Candidate JSON length:', candidate.length);
  logger.info('[Gemini Parser] Candidate JSON preview (first 400 chars):', candidate.substring(0, 400));

  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch (error) {
      logger.warn('[Gemini Parser] Parse attempt failed:', error.message);
      return null;
    }
  };

  let parsed = tryParse(candidate);
  if (parsed) {
    logger.info('[Gemini Parser] ✓ Successfully parsed on first attempt');
    return parsed;
  }

  logger.info('[Gemini Parser] First parse failed, trying to find valid JSON bounds...');

  const lastBrace = candidate.lastIndexOf('}');
  const lastBracket = candidate.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);

  if (endIndex !== -1) {
    const bounded = candidate.slice(0, endIndex + 1);
    logger.info('[Gemini Parser] Trying bounded JSON (length:', bounded.length, ')');
    parsed = tryParse(bounded);
    if (parsed) {
      logger.info('[Gemini Parser] ✓ Successfully parsed bounded JSON');
      return parsed;
    }
  }

  logger.info('[Gemini Parser] Attempting to balance braces...');
  let balanced = candidate;
  const braceDelta = (balanced.match(/{/g) || []).length - (balanced.match(/}/g) || []).length;
  const bracketDelta = (balanced.match(/\[/g) || []).length - (balanced.match(/\]/g) || []).length;

  logger.info('[Gemini Parser] Brace delta:', braceDelta, 'Bracket delta:', bracketDelta);

  if (braceDelta > 0) {
    balanced += '}'.repeat(braceDelta);
  }

  if (bracketDelta > 0) {
    balanced += ']'.repeat(bracketDelta);
  }

  parsed = tryParse(balanced);
  if (parsed) {
    logger.info('[Gemini Parser] ✓ Successfully parsed after balancing');
    return parsed;
  }

  // AGGRESSIVE FIX: Try to find last complete "reference" field and close from there
  logger.info('[Gemini Parser] Attempting aggressive repair - finding last complete transaction...');

  // Look for the last complete "reference": null (or "reference": "...")
  // This pattern indicates a complete transaction
  const lastCompleteRef1 = balanced.lastIndexOf('"reference": null');
  const lastCompleteRef2 = balanced.lastIndexOf('"reference": "');
  const lastCompleteRefPos = Math.max(lastCompleteRef1, lastCompleteRef2);

  if (lastCompleteRefPos > 1000) {
    // Find the closing brace of this transaction (should be right after the reference field)
    const closingBracePos = balanced.indexOf('}', lastCompleteRefPos);

    if (closingBracePos > lastCompleteRefPos) {
      // Truncate right after this closing brace and close the array and object
      const repaired = balanced.substring(0, closingBracePos + 1) + '\n  ]\n}';

      logger.info('[Gemini Parser] Attempting repair - truncating at position:', closingBracePos);
      logger.info('[Gemini Parser] Repaired JSON ends with:', repaired.substring(Math.max(0, repaired.length - 200)));

      parsed = tryParse(repaired);
      if (parsed) {
        logger.info('[Gemini Parser] ✓ Successfully parsed after aggressive repair');
        logger.warn('[Gemini Parser] Note: Some transactions were truncated due to incomplete response');
        return parsed;
      } else {
        logger.warn('[Gemini Parser] Repair attempt failed, trying alternate approach...');
      }
    }
  }

  // FALLBACK: Try simpler approach - just find last complete reference and add proper closing
  const simplePattern = /"reference":\s*null\s*}/g;
  let lastMatch;
  let match;
  while ((match = simplePattern.exec(balanced)) !== null) {
    lastMatch = match;
  }

  if (lastMatch) {
    const endPos = lastMatch.index + lastMatch[0].length;
    const fallbackRepaired = balanced.substring(0, endPos) + '\n  ]\n}';
    logger.info('[Gemini Parser] Trying fallback repair at position:', endPos);

    parsed = tryParse(fallbackRepaired);
    if (parsed) {
      logger.info('[Gemini Parser] ✓ Successfully parsed with fallback repair');
      logger.warn('[Gemini Parser] Note: Some transactions were truncated');
      return parsed;
    }
  }

  logger.error('[Gemini Parser] ✗ All parsing attempts failed');
  logger.error('[Gemini Parser] Final candidate (first 1000 chars):', candidate.substring(0, 1000));
  logger.error('[Gemini Parser] Final candidate (last 500 chars):', candidate.substring(Math.max(0, candidate.length - 500)));
  throw new Error('Failed to parse Gemini response as JSON');
}

function toDate(value) {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function resolveStatementEndDate(extractedData) {
  const candidatePaths = [
    ['accountInfo', 'statementPeriod', 'to'],
    ['accountInfo', 'statementPeriod', 'end'],
    ['accountInfo', 'statementEndDate'],
    ['summary', 'statementPeriod', 'to'],
    ['summary', 'statementPeriod', 'end'],
    ['summary', 'statementEndDate'],
    ['summary', 'endingDate'],
  ];

  for (const path of candidatePaths) {
    let current = extractedData;
    for (const segment of path) {
      current = current?.[segment];
      if (current === undefined) break;
    }

    const parsed = toDate(current);
    if (parsed) {
      return { date: parsed, raw: current, source: path.join('.') };
    }
  }

  return null;
}

function buildTransactionKey(tx) {
  if (!tx) {
    return '';
  }

  const parts = [
    tx.date ? String(tx.date).trim().toLowerCase() : '',
    tx.description ? String(tx.description).trim().toLowerCase() : '',
    tx.debit != null ? Number(tx.debit) : 'null',
    tx.credit != null ? Number(tx.credit) : 'null',
    tx.balance != null ? Number(tx.balance) : 'null',
    tx.reference ? String(tx.reference).trim().toLowerCase() : ''
  ];

  return parts.join('|');
}

function sortTransactionsByDate(transactions) {
  return [...transactions].sort((a, b) => {
    const dateA = toDate(a?.date);
    const dateB = toDate(b?.date);

    if (dateA && dateB) {
      return dateA - dateB;
    }

    if (dateA && !dateB) return -1;
    if (!dateA && dateB) return 1;

    const strA = (a?.date || '').toString();
    const strB = (b?.date || '').toString();
    return strA.localeCompare(strB);
  });
}

function mergeAndDedupeTransactions(originalTransactions, newTransactions) {
  const dedupeMap = new Map();
  for (const tx of [...originalTransactions, ...newTransactions]) {
    const key = buildTransactionKey(tx);
    if (key && !dedupeMap.has(key)) {
      dedupeMap.set(key, tx);
    } else if (!key) {
      dedupeMap.set(`__fallback__${dedupeMap.size}`, tx);
    }
  }

  return sortTransactionsByDate(Array.from(dedupeMap.values()));
}

function filterTransactionsAfterDate(transactions, anchorDateString) {
  if (!anchorDateString) {
    return transactions;
  }

  const anchorDate = toDate(anchorDateString);
  if (!anchorDate) {
    return transactions.filter((tx) => {
      if (!tx?.date) return true;
      return String(tx.date).trim() !== String(anchorDateString).trim();
    });
  }

  return transactions.filter((tx) => {
    const txDate = toDate(tx?.date);
    if (!txDate) return true;
    return txDate > anchorDate;
  });
}

function evaluateTruncation(transactions, statementEndDate) {
  const defaultResult = {
    needsContinuation: false,
    reason: null,
    daysDifference: null,
    lastTransaction: null,
  };

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return defaultResult;
  }

  const sorted = sortTransactionsByDate(transactions);
  const lastTransaction = sorted[sorted.length - 1];
  const lastTxDate = toDate(lastTransaction?.date);

  let needsContinuation = false;
  let reason = null;
  let daysDifference = null;

  if (lastTransaction && lastTransaction.balance == null && lastTransaction.balance !== 0) {
    needsContinuation = true;
    reason = 'incomplete-transaction';
  }

  if (statementEndDate && lastTxDate) {
    const diffMs = statementEndDate.getTime() - lastTxDate.getTime();
    daysDifference = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (daysDifference > 7) {
      needsContinuation = true;
      reason = 'date-gap';
    }
  }

  return {
    needsContinuation,
    reason,
    daysDifference,
    lastTransaction,
  };
}

// Helper function to extract bank statement by monthly chunks
async function extractBankStatementByMonths(pdfBase64, apiKey, partialData) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 65536, // Increased to 65K (max for this model) for 3-month statements
        responseMimeType: 'application/json',
      }
    });

    // Get statement period from partial data
    const statementPeriod = partialData.accountInfo?.statementPeriod || partialData.summary?.statementPeriod;
    if (!statementPeriod || !statementPeriod.from || !statementPeriod.to) {
      throw new Error('Cannot determine statement period for chunking');
    }

    logger.info('Starting month-by-month extraction', {
      period: statementPeriod,
      partialTransactions: partialData.transactions?.length || 0
    });

    // Split period into monthly chunks
    const fromDate = new Date(statementPeriod.from);
    const toDate = new Date(statementPeriod.to);
    const monthChunks = [];

    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const chunkStart = new Date(currentDate);
      const chunkEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // Last day of month
      if (chunkEnd > toDate) chunkEnd.setTime(toDate.getTime());

      monthChunks.push({
        from: chunkStart.toISOString().split('T')[0],
        to: chunkEnd.toISOString().split('T')[0],
        month: chunkStart.toLocaleString('default', { month: 'long', year: 'numeric' })
      });

      // Move to next month
      currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    }

    logger.info(`Split into ${monthChunks.length} monthly chunks:`, monthChunks.map(c => c.month));

    // Extract each month using FULL extraction template
    const allTransactions = [];
    for (const chunk of monthChunks) {
      logger.info(`Extracting transactions for ${chunk.month} (${chunk.from} to ${chunk.to})...`);

      // Use the FULL bank statement extraction template with date range filter
      const monthPrompt = `${EXTRACTION_TEMPLATES.bankStatement.prompt}

🎯 CRITICAL DATE FILTER - READ CAREFULLY:
This statement covers the period from ${statementPeriod.from} to ${statementPeriod.to}.

For THIS extraction pass, ONLY extract transactions with dates between ${chunk.from} and ${chunk.to} (inclusive).
- If a transaction date is BEFORE ${chunk.from}, SKIP IT (will be extracted in another pass)
- If a transaction date is AFTER ${chunk.to}, SKIP IT (will be extracted in another pass)
- ONLY include transactions where the date falls within ${chunk.month}
- DO NOT invent or guess dates - only extract what is clearly visible on the PDF
- If you cannot read a date clearly, SKIP that transaction

Return JSON with just the transactions array:
{"transactions": [...]}`;

      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: monthPrompt },
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: pdfBase64
              }
            }
          ]
        }]
      });

      const responseText = result.response.text();
      const monthData = parseGeminiJson(responseText);

      if (monthData.transactions && Array.isArray(monthData.transactions)) {
        logger.info(`✓ Extracted ${monthData.transactions.length} transactions for ${chunk.month}`);
        allTransactions.push(...monthData.transactions);
      } else {
        logger.warn(`⚠️  No transactions found for ${chunk.month}`);
      }
    }

    // Deduplicate transactions (by date + description + amount)
    const uniqueTransactions = [];
    const seen = new Set();

    for (const tx of allTransactions) {
      const key = `${tx.date}-${tx.description}-${tx.debit || 0}-${tx.credit || 0}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueTransactions.push(tx);
      }
    }

    logger.info(`Deduplication: ${allTransactions.length} → ${uniqueTransactions.length} unique transactions`);

    // Sort by date
    uniqueTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Merge with partial data (keep account info and summary)
    return {
      ...partialData,
      transactions: uniqueTransactions,
      _extractionMethod: 'monthly-chunks'
    };

  } catch (error) {
    logger.error('Month-by-month extraction failed:', error.message);
    throw error;
  }
}

async function extractFromPDF(pdfBase64, documentType = 'generic', apiKey) {
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', // Upgraded: 65K output tokens (vs 8K)
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 65536, // Leverage max limit (65K) for large 3-month statements
        responseMimeType: 'application/json',
      }
    });

    // Get the appropriate template
    const template = EXTRACTION_TEMPLATES[documentType] || EXTRACTION_TEMPLATES.generic;

    logger.info('Starting PDF extraction', {
      documentType,
      templateName: template.name
    });

    // Generate content with the PDF
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: template.prompt },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64
            }
          }
        ]
      }]
    });

    if (!result || !result.response) {
      throw new Error('No response from Gemini API');
    }

    const responseText = result.response.text();

    let extractedData;
    try {
      extractedData = parseGeminiJson(responseText);
    } catch (parseError) {
      logger.warn('Failed to parse Gemini response as JSON', {
        responsePreview: responseText?.slice(0, 500),
        responseLength: responseText?.length || 0,
        error: parseError.message,
      });
      throw parseError;
    }

    // VALIDATION: Check for potential truncation and perform continuation extraction if needed
    if (documentType === 'bankStatement' && extractedData.transactions) {
      const initialTxCount = extractedData.transactions.length;
      logger.info(`Extracted ${initialTxCount} transactions`);

      const statementPeriod = extractedData.accountInfo?.statementPeriod || extractedData.summary?.statementPeriod;
      const statementEndMeta = resolveStatementEndDate(extractedData);

      if (statementEndMeta) {
        logger.info('Detected statement end date from extracted data', {
          source: statementEndMeta.source,
          raw: statementEndMeta.raw
        });
      } else {
        logger.warn('Unable to determine statement end date from extracted data - relying on balance completeness heuristics');
      }

      const statementEndDate = statementEndMeta?.date || (statementPeriod?.to ? toDate(statementPeriod.to) : null);

      const MAX_CONTINUATIONS = 4;
      let continuationAttempts = 0;

      let evaluation = evaluateTruncation(extractedData.transactions, statementEndDate);

      while (evaluation.needsContinuation && continuationAttempts < MAX_CONTINUATIONS) {
        continuationAttempts += 1;
        const anchorDate = evaluation.lastTransaction?.date;

        if (!anchorDate) {
          logger.warn('Continuation requested but last transaction has no date - aborting continuation', {
            attempt: continuationAttempts,
            reason: evaluation.reason
          });
          break;
        }

        logger.warn('⚠️  Statement appears truncated, triggering continuation extraction', {
          attempt: continuationAttempts,
          reason: evaluation.reason,
          daysMissing: evaluation.daysDifference,
          lastTransactionDate: anchorDate,
          currentTransactionCount: extractedData.transactions.length,
          statementPeriod,
          statementEndSource: statementEndMeta?.source || 'unavailable',
          statementEnd: statementEndMeta?.raw || null
        });

        try {
          logger.info(`Extracting remaining transactions after ${anchorDate} (attempt ${continuationAttempts})...`);

          const continuationPrompt = `${EXTRACTION_TEMPLATES.bankStatement.prompt}

🎯 CONTINUATION EXTRACTION:
This is a continuation of a previous extraction that stopped at date: ${anchorDate}

CRITICAL:
- ONLY extract transactions with dates AFTER ${anchorDate}
- Skip all transactions on or before ${anchorDate} (already extracted)
- Continue from where the previous extraction left off
- Extract until the CLOSING BALANCE at the end of the statement

Return JSON with transactions array only:
{"transactions": [...]}`;

          const continuationResult = await model.generateContent({
            contents: [{
              role: 'user',
              parts: [
                { text: continuationPrompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: pdfBase64
                  }
                }
              ]
            }]
          });

          const continuationText = continuationResult.response.text();
          const continuationData = parseGeminiJson(continuationText);
          const continuationTransactions = filterTransactionsAfterDate(
            continuationData.transactions || [],
            anchorDate
          );

          if (!continuationTransactions.length) {
            logger.warn('Continuation attempt returned no new transactions', {
              attempt: continuationAttempts,
              anchorDate
            });
            break;
          }

          const mergedTransactions = mergeAndDedupeTransactions(
            extractedData.transactions,
            continuationTransactions
          );

          logger.info('✅ Continuation extraction successful', {
            attempt: continuationAttempts,
            previousCount: extractedData.transactions.length,
            continuationCount: continuationTransactions.length,
            totalCount: mergedTransactions.length
          });

          extractedData.transactions = mergedTransactions;
          evaluation = evaluateTruncation(extractedData.transactions, statementEndDate);
        } catch (continuationError) {
          logger.error('Continuation extraction failed, using partial data', {
            attempt: continuationAttempts,
            error: continuationError.message
          });
          extractedData._warning = 'Statement truncated - continuation extraction failed';
          break;
        }
      }

      if (evaluation?.needsContinuation) {
        logger.warn('Continuation limit reached or unresolved truncation detected', {
          attempts: continuationAttempts,
          reason: evaluation.reason,
          daysMissing: evaluation.daysDifference
        });
      }

      extractedData.transactions = sortTransactionsByDate(extractedData.transactions);
      const finalTxCount = extractedData.transactions.length;
      const firstTransaction = finalTxCount > 0 ? extractedData.transactions[0] : null;
      const lastTransaction = finalTxCount > 0 ? extractedData.transactions[finalTxCount - 1] : null;

      if (!extractedData.summary || typeof extractedData.summary !== 'object') {
        extractedData.summary = {};
      }

      extractedData.summary.transactionCount = finalTxCount;
      if (firstTransaction?.date && !extractedData.summary.firstTransactionDate) {
        extractedData.summary.firstTransactionDate = firstTransaction.date;
      }
      if (lastTransaction?.date) {
        extractedData.summary.lastTransactionDate = lastTransaction.date;
      }

      extractedData.transactionCount = finalTxCount;
      if (firstTransaction?.date) {
        extractedData.firstTransactionDate = firstTransaction.date;
      }
      if (lastTransaction?.date) {
        extractedData.lastTransactionDate = lastTransaction.date;
      }

      extractedData._continuationAttempts = continuationAttempts;
      extractedData._continuationResolved = !evaluation?.needsContinuation;

      if (finalTxCount < 10) {
        logger.warn('⚠️  Very few transactions extracted - statement may be incomplete', {
          transactionCount: finalTxCount,
          expected: '100-250 for 3-month statements'
        });
        extractedData._warning = 'Low transaction count - extraction may be incomplete';
      }
    }

    // Log transaction date range for debugging
    if (extractedData.transactions && extractedData.transactions.length > 0) {
      const firstTx = extractedData.transactions[0];
      const lastTx = extractedData.transactions[extractedData.transactions.length - 1];

      logger.info('Transaction date range:', {
        count: extractedData.transactions.length,
        firstDate: firstTx?.date,
        lastDate: lastTx?.date,
        firstTxSample: firstTx ? `${firstTx.date}: ${firstTx.description}` : null,
        lastTxSample: lastTx ? `${lastTx.date}: ${lastTx.description}` : null,
        continuationAttempts: extractedData._continuationAttempts,
        continuationResolved: extractedData._continuationResolved
      });
    }

    logger.info('PDF extraction completed successfully', {
      documentType,
      dataKeys: Object.keys(extractedData),
      transactionCount: extractedData.transactions?.length || 0
    });

    return {
      success: true,
      documentType,
      data: extractedData,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    logger.error('PDF extraction failed', {
      error: error.message,
      documentType,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message,
      documentType
    };
  }
}

// Get API key from environment or Firestore
async function getGeminiApiKey() {
  // First try environment variable (set via Firebase Functions config)
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }

  // Fall back to Firestore config
  const configDoc = await db.collection('config').doc('apis').get();

  if (configDoc.exists && configDoc.data().geminiApiKey) {
    return configDoc.data().geminiApiKey;
  }

  throw new Error('Gemini API key not configured');
}

// Main PDF extraction Cloud Function
exports.extractPDFContent = onCall({
  memory: '1GiB',
  timeoutSeconds: 540, // 9 minutes for month-by-month chunking (4 months × ~90s each)
  region: 'us-central1'
}, async (request) => {
  try {
    const data = request.data;
    const context = { auth: request.auth };

    // Enhanced authentication logging
    logger.info('Function call received', {
      hasAuth: !!request.auth,
      authUid: request.auth?.uid,
      authToken: request.auth?.token ? 'present' : 'missing'
    });

    // Check authentication
    if (!request.auth) {
      logger.error('Authentication failed - no auth context');
      throw new HttpsError('unauthenticated', 'Authentication required');
    }

    const { pdfBase64, documentType = 'generic', saveToFirestore = false } = data;

    if (!pdfBase64) {
      throw new Error('PDF data is required');
    }

    // Log the extraction request
    logger.info('PDF extraction requested', {
      userId: request.auth.uid,
      documentType,
      saveToFirestore,
      pdfSize: pdfBase64?.length || 0
    });

    // Get API key
    const apiKey = await getGeminiApiKey();

    // Extract content from PDF
    const extractionResult = await extractFromPDF(pdfBase64, documentType, apiKey);

    // Optionally save to Firestore
    if (saveToFirestore && extractionResult.success) {
      const docRef = await db.collection('pdf_extractions').add({
        userId: request.auth.uid,
        documentType,
        extractedData: extractionResult.data,
        extractedAt: extractionResult.extractedAt,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      extractionResult.documentId = docRef.id;

      logger.info('Extraction saved to Firestore', {
        documentId: docRef.id,
        userId: request.auth.uid
      });
    }

    // Track usage
    await db.collection('usage_tracking').add({
      userId: request.auth.uid,
      function: 'extractPDFContent',
      documentType,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      success: extractionResult.success
    });

    return extractionResult;

  } catch (error) {
    logger.error('PDF extraction handler error', {
      error: error.message,
      userId: request.auth?.uid,
      stack: error.stack
    });

    throw new Error(`PDF extraction failed: ${error.message}`);
  }
});

// Get available document types
exports.getExtractionTypes = onCall({
  memory: '256MiB',
  timeoutSeconds: 10,
  region: 'us-central1'
}, async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const documentTypes = Object.entries(EXTRACTION_TEMPLATES).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.prompt.split('\n')[0]
    }));

    return {
      success: true,
      documentTypes
    };

  } catch (error) {
    logger.error('Get extraction types error', {
      error: error.message,
      userId: request.auth?.uid
    });

    throw new Error(`Failed to get extraction types: ${error.message}`);
  }
});

// Get user's extraction history
exports.getExtractionHistory = onCall({
  memory: '256MiB',
  timeoutSeconds: 30,
  region: 'us-central1'
}, async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    const { limit = 10 } = request.data || {};

    const extractionsSnapshot = await db
      .collection('pdf_extractions')
      .where('userId', '==', request.auth.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const extractions = extractionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Don't send the full extracted data in the list
      extractedData: undefined,
      hasData: !!doc.data().extractedData
    }));

    return {
      success: true,
      extractions,
      count: extractions.length
    };

  } catch (error) {
    logger.error('Get extraction history error', {
      error: error.message,
      userId: request.auth?.uid
    });

    throw new Error(`Failed to get extraction history: ${error.message}`);
  }
});

// HTTP endpoint for testing (remove in production)
exports.testExtraction = onRequest({
  region: 'us-central1'
}, (req, res) => {
  cors(req, res, async () => {
    res.json({
      message: 'PDF extraction functions are deployed and running',
      availableFunctions: [
        'extractPDFContent',
        'getExtractionTypes',
        'getExtractionHistory'
      ]
    });
  });
});

// Create a new user (Admin only)
exports.createUser = onCall({
  memory: '256MiB',
  timeoutSeconds: 30,
  region: 'us-central1'
}, async (request) => {
  try {
    // Check authentication
    if (!request.auth) {
      throw new Error('Authentication required');
    }

    // Verify that the calling user is an admin
    const callerDoc = await db.collection('users').doc(request.auth.uid).get();

    if (!callerDoc.exists) {
      throw new HttpsError('permission-denied', 'Caller user not found');
    }

    const callerData = callerDoc.data();
    const callerRoles = Array.isArray(callerData.roles) ? callerData.roles : [];
    const isAdmin = callerRoles.includes('admin') || callerRoles.includes('super_admin');

    if (!isAdmin) {
      throw new HttpsError('permission-denied', 'Only administrators can create users');
    }

    // Extract user data from request
    const { email, password, fullName, phoneNumber, roles, companyId } = request.data;

    // Validate required fields
    if (!email || !password || !fullName) {
      throw new HttpsError('invalid-argument', 'Email, password, and full name are required');
    }

    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      throw new HttpsError('invalid-argument', 'At least one role is required');
    }

    // Validate roles
    const validRoles = ['super_admin', 'admin', 'financial_admin', 'developer', 'client'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      throw new HttpsError('invalid-argument', `Invalid roles: ${invalidRoles.join(', ')}`);
    }

    logger.info('Creating new user', {
      email,
      roles,
      companyId: companyId || 'none',
      createdBy: request.auth.uid
    });

    // Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
      phoneNumber: phoneNumber || undefined,
      emailVerified: false
    });

    // Create the user document in Firestore
    const userData = {
      uid: userRecord.uid,
      email: userRecord.email,
      fullName,
      roles,
      emailVerified: false,
      isActive: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid
    };

    // Add optional fields
    if (phoneNumber) userData.phoneNumber = phoneNumber;
    if (companyId) userData.companyId = companyId;

    await db.collection('users').doc(userRecord.uid).set(userData);

    logger.info('User created successfully', {
      uid: userRecord.uid,
      email: userRecord.email,
      createdBy: request.auth.uid
    });

    return {
      success: true,
      uid: userRecord.uid,
      message: 'User created successfully'
    };

  } catch (error) {
    logger.error('Create user error', {
      error: error.message,
      callerUid: request.auth?.uid,
      stack: error.stack
    });

    // Provide more specific error messages
    if (error.code === 'auth/email-already-exists') {
      throw new HttpsError('already-exists', 'A user with this email already exists');
    } else if (error.code === 'auth/invalid-email') {
      throw new HttpsError('invalid-argument', 'Invalid email address');
    } else if (error.code === 'auth/weak-password') {
      throw new HttpsError('invalid-argument', 'Password is too weak. It should be at least 6 characters');
    }

    throw new HttpsError('internal', `Failed to create user: ${error.message}`);
  }
});
