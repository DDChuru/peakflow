import { GoogleGenerativeAI } from '@google/generative-ai';

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

EXTRACTION REQUIREMENTS:

1. Account Information:
   - Account number, name, type
   - Statement period
   - Bank name and branch

2. Summary:
   - Opening balance, closing balance
   - Total deposits, total withdrawals
   - Interest earned, fees charged

3. Transactions:
   - Date, description, debit/credit amounts, balance
   - Transaction types and references
   - Check numbers if applicable

Output as structured JSON with account info, summary, and all transactions.`
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
} as const;

export type DocumentType = keyof typeof EXTRACTION_TEMPLATES;

export interface ExtractionResult {
  success: boolean;
  documentType: DocumentType;
  data?: any;
  error?: string;
  extractedAt: string;
  documentId?: string;
}

export interface ExtractionOptions {
  saveToFirestore?: boolean;
  customPrompt?: string;
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
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 8192,
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

    const responseText = result.response.text()
      .replace(/```json\n?|\n?```/g, '')
      .trim();

    // Parse the extracted data
    const extractedData = JSON.parse(responseText);

    console.log('PDF extraction completed successfully', {
      documentType,
      dataKeys: Object.keys(extractedData)
    });

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
  // @ts-ignore - Allow dynamic template addition
  EXTRACTION_TEMPLATES[key] = { name, prompt };
  return true;
}