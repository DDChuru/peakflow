import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase/config';
import { auth, db } from '@/lib/firebase/config';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { extractFromPDF, getDocumentTypes, type DocumentType, type ExtractionResult } from '@/services/document-ai/pdf-extraction';

// Get API key from environment or Firestore
async function getGeminiApiKey(): Promise<string> {
  // First try environment variable
  if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  }

  // Fall back to Firestore config
  const configDoc = await getDoc(doc(db, 'config', 'apis'));

  if (configDoc.exists() && configDoc.data().geminiApiKey) {
    return configDoc.data().geminiApiKey;
  }

  throw new Error('Gemini API key not configured');
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

// Main PDF extraction function for client-side use
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

    // Get API key
    const apiKey = await getGeminiApiKey();

    // Extract content from PDF
    const extractionResult = await extractFromPDF(pdfBase64, documentType, apiKey);

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

// Export available document types
export { getDocumentTypes, type DocumentType, type ExtractionResult };