import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { auth, db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';

// Type definitions (imported from service but types don't include runtime code)
export type DocumentType = 'audit' | 'invoice' | 'bankStatement' | 'contract' | 'generic';

export interface ExtractionResult {
  success: boolean;
  documentType: DocumentType;
  data?: Record<string, unknown>;
  error?: string;
  extractedAt: string;
  documentId?: string;
}

// Convert file to base64
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = (error) => reject(error);
  });
}

// Main PDF extraction function - uses server-side API to protect API key
export async function extractPDFContent(
  pdfFile: File,
  documentType: DocumentType = 'generic',
  saveToFirestore: boolean = false
): Promise<ExtractionResult> {
  try {
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    console.log('PDF extraction requested', {
      userId: user.uid,
      documentType,
      saveToFirestore,
      fileName: pdfFile.name,
      fileSize: pdfFile.size
    });

    // Convert PDF to base64
    const pdfBase64 = await fileToBase64(pdfFile);

    // Call server-side API endpoint (protects API key from client exposure)
    const response = await fetch('/api/extract-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64,
        documentType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'PDF extraction failed');
    }

    const extractionResult: ExtractionResult = await response.json();

    // Optionally save to Firestore
    if (saveToFirestore && extractionResult.success) {
      const docRef = await addDoc(collection(db, 'pdf_extractions'), {
        userId: user.uid,
        documentType,
        fileName: pdfFile.name,
        fileSize: pdfFile.size,
        extractedData: extractionResult.data,
        extractedAt: extractionResult.extractedAt,
        createdAt: new Date()
      });

      extractionResult.documentId = docRef.id;

      console.log('Extraction saved to Firestore', {
        documentId: docRef.id,
        userId: user.uid
      });
    }

    // Track usage
    await addDoc(collection(db, 'usage_tracking'), {
      userId: user.uid,
      function: 'extractPDFContent',
      documentType,
      fileName: pdfFile.name,
      timestamp: new Date(),
      success: extractionResult.success
    });

    return extractionResult;

  } catch (error) {
    console.error('PDF extraction handler error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new Error(`PDF extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get user's extraction history
export async function getExtractionHistory(limitCount: number = 10) {
  try {
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    const extractionsQuery = query(
      collection(db, 'pdf_extractions'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const extractionsSnapshot = await getDocs(extractionsQuery);

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
    console.error('Get extraction history error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new Error(`Failed to get extraction history: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get a specific extraction by ID
export async function getExtraction(extractionId: string) {
  try {
    // Check authentication
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Authentication required');
    }

    const extractionDoc = await getDoc(doc(db, 'pdf_extractions', extractionId));

    if (!extractionDoc.exists()) {
      throw new Error('Extraction not found');
    }

    const data = extractionDoc.data();

    // Verify ownership
    if (data.userId !== user.uid) {
      throw new Error('Unauthorized access');
    }

    return {
      success: true,
      extraction: {
        id: extractionDoc.id,
        ...data
      }
    };

  } catch (error) {
    console.error('Get extraction error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw new Error(`Failed to get extraction: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Get available document types
export function getDocumentTypes() {
  return [
    { key: 'audit', name: 'Audit Report', description: 'Extract audit report data with scores and tables' },
    { key: 'invoice', name: 'Invoice', description: 'Extract invoice line items and totals' },
    { key: 'bankStatement', name: 'Bank Statement', description: 'Extract bank statement transactions' },
    { key: 'contract', name: 'Contract', description: 'Extract contract terms and parties' },
    { key: 'generic', name: 'Generic Document', description: 'Extract all information from document' }
  ];
}