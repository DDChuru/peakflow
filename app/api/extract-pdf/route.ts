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
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 65536,
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

CRITICAL JSON FORMATTING:
- ALL numeric values MUST be numbers, NOT strings (use 39492.58, NOT "39,492.58")
- Remove ALL commas from numbers (use 1000.50, NOT "1,000.50")
- ALL dates MUST be ISO format strings: "YYYY-MM-DD" (e.g., "2024-12-03")
- Use null for missing values

EXTRACTION REQUIREMENTS:

1. Account Information (accountInfo object):
   - accountNumber: string
   - accountName: string
   - accountType: string
   - statementPeriod: {"from": "YYYY-MM-DD", "to": "YYYY-MM-DD"}
   - bankName: string
   - branch: string

2. Summary (summary object) - ALL VALUES MUST BE NUMBERS:
   - openingBalance: number
   - closingBalance: number
   - totalDeposits: number
   - totalWithdrawals: number

3. Transactions (transactions array) - ALL AMOUNTS MUST BE NUMBERS:
   Each transaction object:
   - date: "YYYY-MM-DD" (ISO format string)
   - description: string
   - debit: number or null
   - credit: number or null
   - balance: number
   - reference: string or null

Output complete, valid JSON.`,

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
