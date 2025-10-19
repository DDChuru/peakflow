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
};


// Helper function to extract from PDF using Gemini
function parseGeminiJson(responseText) {
  if (typeof responseText !== 'string' || responseText.trim() === '') {
    throw new Error('Gemini returned an empty response');
  }

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

  const tryParse = (text) => {
    try {
      return JSON.parse(text);
    } catch (error) {
      return null;
    }
  };

  let parsed = tryParse(candidate);
  if (parsed) {
    return parsed;
  }

  const lastBrace = candidate.lastIndexOf('}');
  const lastBracket = candidate.lastIndexOf(']');
  const endIndex = Math.max(lastBrace, lastBracket);

  if (endIndex !== -1) {
    parsed = tryParse(candidate.slice(0, endIndex + 1));
    if (parsed) {
      return parsed;
    }
  }

  let balanced = candidate;
  const braceDelta = (balanced.match(/{/g) || []).length - (balanced.match(/}/g) || []).length;
  const bracketDelta = (balanced.match(/\[/g) || []).length - (balanced.match(/\]/g) || []).length;

  if (braceDelta > 0) {
    balanced += '}'.repeat(braceDelta);
  }

  if (bracketDelta > 0) {
    balanced += ']'.repeat(bracketDelta);
  }

  parsed = tryParse(balanced);
  if (parsed) {
    return parsed;
  }

  throw new Error('Failed to parse Gemini response as JSON');
}

async function extractFromPDF(pdfBase64, documentType = 'generic', apiKey) {
  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.8,
        maxOutputTokens: 8192,
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

    logger.info('PDF extraction completed successfully', {
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
  timeoutSeconds: 120,
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
