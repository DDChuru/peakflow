import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Server-side API key (NOT exposed to client)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Verify API key is configured
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { pdfBase64, documentType = 'generic' } = body;

    if (!pdfBase64) {
      return NextResponse.json(
        { error: 'PDF data is required' },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp', // Using same model as before
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 65536, // Higher than old service (32768)
        responseMimeType: 'application/json',
      }
    });

    // Get extraction template based on document type
    const template = getExtractionTemplate(documentType);

    // Generate content with the PDF
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: template },
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
    const extractedData = parseGeminiJson(responseText);

    return NextResponse.json({
      success: true,
      documentType,
      data: extractedData,
      extractedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

// Helper function to parse Gemini JSON response
function parseGeminiJson(responseText: string): any {
  const cleaned = responseText.replace(/```json\s*|```/gi, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');

  let startIndex = 0;
  if (firstBrace === -1 && firstBracket === -1) {
    startIndex = 0;
  } else if (firstBrace === -1) {
    startIndex = firstBracket;
  } else if (firstBracket === -1) {
    startIndex = firstBrace;
  } else {
    startIndex = Math.min(firstBrace, firstBracket);
  }

  const candidate = cleaned.slice(Math.max(startIndex, 0));

  try {
    return JSON.parse(candidate);
  } catch (error) {
    // Try to find valid JSON bounds
    const lastBrace = candidate.lastIndexOf('}');
    const lastBracket = candidate.lastIndexOf(']');
    const endIndex = Math.max(lastBrace, lastBracket);

    if (endIndex !== -1) {
      const bounded = candidate.slice(0, endIndex + 1);
      return JSON.parse(bounded);
    }

    throw new Error('Failed to parse Gemini response as JSON');
  }
}

// Get extraction template based on document type
function getExtractionTemplate(documentType: string): string {
  const templates: Record<string, string> = {
    bankStatement: `Extract ALL information from this COMPLETE multi-page bank statement. Output VALID JSON only.

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

Output complete, valid JSON. Ensure all braces and brackets are closed.`,

    invoice: `Extract ALL information from this invoice document.

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

3. Totals:
   - Subtotal, tax total, grand total
   - Payment instructions

Output as structured JSON.`,

    generic: `Extract ALL information from EVERY PAGE of this PDF document comprehensively.

EXTRACTION REQUIREMENTS:

1. Document Metadata:
   - Title, type, dates, version numbers
   - Author/organization information

2. Content Structure:
   - Headers and sections
   - Paragraphs and text blocks
   - Lists and bullet points

3. Tables:
   - ALL tables with headers and data
   - Preserve structure and relationships

Output as comprehensive structured JSON.`
  };

  return templates[documentType] || templates.generic;
}
