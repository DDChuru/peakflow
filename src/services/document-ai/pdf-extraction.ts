import { GoogleGenerativeAI } from '@google/generative-ai';

type ExtractionTemplate = {
  name: string;
  prompt: string;
};

// Extraction templates for different document types
export const EXTRACTION_TEMPLATES = {
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
    prompt: `Extract ALL information from this bank statement.

CRITICAL DATE FORMAT REQUIREMENTS:
- ALL dates MUST use ISO format: YYYY-MM-DD (e.g., 2024-12-19)
- ALWAYS use 4-digit years (NEVER use 2-digit years)
- If the PDF shows "19/12/24", interpret as 2024-12-19 (20XX century)
- If the PDF shows "19/12/01", interpret as 2024-12-01 or 2025-12-01 (NOT 2001-12-19)
- If the PDF shows "03 Dec 24", interpret as 2024-12-03 (Day Month YY format)
- Transaction dates should be recent (within last 5 years from current date)
- When in doubt, assume the current century (2000s)

CRITICAL: FNB AND BANKS WITH PARTIAL DATES (e.g., "13 Dec" without year):
1. FIRST extract the statement period to determine the year (e.g., "01 Nov 2024 to 30 Nov 2024")
2. Use the statement period's year to complete ALL transaction dates
3. If transaction shows "13 Dec", and statement period is "Nov 2024 to Dec 2024", output "2024-12-13"
4. If transaction shows "28 Nov", and statement period is "Nov 2024", output "2024-11-28"
5. NEVER default to year 2001, 1970, or any year before 2020 for recent statements
6. For cross-year statements (e.g., "Dec 2024 to Jan 2025"), use context:
   - Transactions in December → use 2024
   - Transactions in January → use 2025

CRITICAL: STANDARD BANK AMOUNT EXTRACTION (Two-Column Format):
Standard Bank statements have TWO separate amount columns:
- "Payments" column (often shown in RED with negative sign, e.g., "-236.90") = DEBIT (money OUT)
- "Deposits" column (often shown in GREEN, e.g., "750.00") = CREDIT (money IN)

For Standard Bank transactions:
1. If amount is in "Payments" column → set "debit" field (use absolute value, remove negative sign)
2. If amount is in "Deposits" column → set "credit" field (positive value)
3. NEVER put the same amount in both debit AND credit fields
4. Balance column is separate - extract as "balance" field
5. Examples:
   - Payments: -236.90, Deposits: blank → {"debit": 236.90, "credit": null}
   - Payments: blank, Deposits: 750.00 → {"debit": null, "credit": 750.00}
   - Payments: -1790.04, Deposits: blank → {"debit": 1790.04, "credit": null}

EXTRACTION REQUIREMENTS:

1. Account Information:
   - Account number, name, type
   - Statement period (ISO dates YYYY-MM-DD) - EXTRACT THIS FIRST!
   - Bank name and branch (detect "Standard Bank", "FNB", "ABSA", etc.)

2. Summary:
   - Opening balance, closing balance
   - Total deposits, total withdrawals
   - Interest earned, fees charged

3. Transactions:
   - Date (MUST be YYYY-MM-DD format with 4-digit year)
   - Use statement period year to complete dates shown as "DD MMM" or "DD Month YY"
   - Description (full transaction description)
   - For TWO-COLUMN format (Standard Bank): Extract from correct column
     * debit: Value from "Payments" column (absolute value, no negative sign)
     * credit: Value from "Deposits" column
   - For SINGLE-COLUMN format (FNB): Extract debit OR credit based on Cr/Dr suffix
     * credit: Amount with "Cr" suffix
     * debit: Amount with "Dr" suffix or no suffix
   - balance: Running balance after transaction
   - reference: Any reference numbers
   - Transaction types and check numbers if applicable

Output as structured JSON with account info, summary, and all transactions.
Each transaction must have: date, description, debit (or null), credit (or null), balance.`
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
} satisfies Record<string, ExtractionTemplate>;

export type DocumentType = keyof typeof EXTRACTION_TEMPLATES;

export interface ExtractionResult {
  success: boolean;
  documentType: DocumentType;
  data?: Record<string, unknown>;
  error?: string;
  extractedAt: string;
  documentId?: string;
}

export interface ExtractionOptions {
  saveToFirestore?: boolean;
  customPrompt?: string;
}


function parseGeminiJson(responseText: string): Record<string, unknown> {
  if (!responseText || responseText.trim() === '') {
    console.error('[Gemini Parser] Empty response received');
    throw new Error('Gemini returned an empty response');
  }

  console.log('[Gemini Parser] Raw response length:', responseText.length);
  console.log('[Gemini Parser] Raw response preview (first 500 chars):', responseText.substring(0, 500));
  console.log('[Gemini Parser] Raw response end (last 200 chars):', responseText.substring(Math.max(0, responseText.length - 200)));

  const cleaned = responseText.replace(/```json\s*|```/gi, '').trim();

  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIndex = 0;

  if (firstBrace === -1 && firstBracket === -1) {
    console.error('[Gemini Parser] No JSON detected - no opening brace or bracket found');
    console.log('[Gemini Parser] Full cleaned response:', cleaned);
    startIndex = 0;
  } else if (firstBrace === -1) {
    startIndex = firstBracket;
  } else if (firstBracket === -1) {
    startIndex = firstBrace;
  } else {
    startIndex = Math.min(firstBrace, firstBracket);
  }

  const candidate = cleaned.slice(Math.max(startIndex, 0));
  console.log('[Gemini Parser] Candidate JSON length:', candidate.length);
  console.log('[Gemini Parser] Candidate JSON preview (first 300 chars):', candidate.substring(0, 300));

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch (error) {
      console.error('[Gemini Parser] Parse attempt failed:', error instanceof Error ? error.message : 'Unknown error');
      return null;
    }
  };

  let parsed = tryParse(candidate);
  if (parsed) {
    console.log('[Gemini Parser] ✓ Successfully parsed on first attempt');
    return parsed;
  }

  console.log('[Gemini Parser] First parse failed, trying to find valid JSON bounds...');

  const lastBrace = candidate.lastIndexOf('}');
  const lastBracket = candidate.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);

  if (endIndex !== -1) {
    const bounded = candidate.slice(0, endIndex + 1);
    console.log('[Gemini Parser] Trying bounded JSON (length: %d)', bounded.length);
    parsed = tryParse(bounded);
    if (parsed) {
      console.log('[Gemini Parser] ✓ Successfully parsed bounded JSON');
      return parsed;
    }
  }

  console.log('[Gemini Parser] Attempting to balance braces...');
  let balanced = candidate;
  const braceDelta = (balanced.match(/{/g) || []).length - (balanced.match(/}/g) || []).length;
  const bracketDelta = (balanced.match(/\[/g) || []).length - (balanced.match(/\]/g) || []).length;

  console.log('[Gemini Parser] Brace delta:', braceDelta, 'Bracket delta:', bracketDelta);

  if (braceDelta > 0) {
    balanced += '}'.repeat(braceDelta);
  }

  if (bracketDelta > 0) {
    balanced += ']'.repeat(bracketDelta);
  }

  parsed = tryParse(balanced);
  if (parsed) {
    console.log('[Gemini Parser] ✓ Successfully parsed after balancing');
    return parsed;
  }

  console.error('[Gemini Parser] ✗ All parsing attempts failed');
  console.error('[Gemini Parser] Final candidate (first 1000 chars):', candidate.substring(0, 1000));
  throw new Error('Failed to parse Gemini response as JSON');
}

export async function extractFromPDF(
  pdfBase64: string,
  documentType: DocumentType = 'generic',
  apiKey: string
): Promise<ExtractionResult> {
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', // Upgraded: 65K output tokens
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 32768, // Leverage higher limit for large statements
        responseMimeType: 'application/json',
      }
    });

    // Get the appropriate template
    const template = EXTRACTION_TEMPLATES[documentType] || EXTRACTION_TEMPLATES.generic;

    console.log('Starting PDF extraction', {
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

    // Parse the extracted data
    const extractedData = parseGeminiJson(responseText);

    console.log('PDF extraction completed successfully', {
      documentType,
      dataKeys: Object.keys(extractedData)
    });

    // Debug: Log sample transaction dates for bank statements
    if (documentType === 'bankStatement' && extractedData.transactions) {
      const sampleDates = (extractedData.transactions as any[]).slice(0, 5).map((t: any) => t.date);
      console.log('[AI Extraction] Sample transaction dates from AI:', sampleDates);
      console.log('[AI Extraction] Statement period from AI:', extractedData.summary || extractedData.accountInfo);
    }

    return {
      success: true,
      documentType,
      data: extractedData,
      extractedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('PDF extraction failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentType
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      documentType,
      extractedAt: new Date().toISOString()
    };
  }
}

// Get available document types
export function getDocumentTypes() {
  return Object.entries(EXTRACTION_TEMPLATES).map(([key, value]) => ({
    key,
    name: value.name,
    description: value.prompt.split('\n')[0]
  }));
}

// Add a custom extraction template
export function addCustomTemplate(key: string, name: string, prompt: string) {
  EXTRACTION_TEMPLATES[key] = { name, prompt };
  return true;
}
