'use client';

import React, { useState, useCallback } from 'react';
import { extractPDFContent, getDocumentTypes, type DocumentType, type ExtractionResult } from '@/lib/firebase/functions/pdf-extraction-handler';

export default function PDFExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('generic');
  const [saveToFirestore, setSaveToFirestore] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documentTypes = getDocumentTypes();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsExtracting(true);
    setError(null);
    setResult(null);

    try {
      const extractionResult = await extractPDFContent(file, documentType, saveToFirestore);
      setResult(extractionResult);

      if (!extractionResult.success) {
        setError(extractionResult.error || 'Extraction failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDownloadJSON = useCallback(() => {
    if (result?.data) {
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const link = document.createElement('a');
      link.setAttribute('href', dataUri);
      link.setAttribute('download', `extraction_${documentType}_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [result, documentType]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white shadow-lg rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">PDF Data Extraction</h2>
          <p className="mt-1 text-sm text-gray-600">
            Extract structured data from PDF documents using AI
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select PDF File
            </label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-8 h-8 mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PDF files only</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Document Type Selection */}
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              {documentTypes.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {documentTypes.find(t => t.key === documentType)?.description}
            </p>
          </div>

          {/* Save to Firestore Option */}
          <div className="flex items-center">
            <input
              id="saveToFirestore"
              type="checkbox"
              checked={saveToFirestore}
              onChange={(e) => setSaveToFirestore(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="saveToFirestore" className="ml-2 block text-sm text-gray-900">
              Save extraction to database
            </label>
          </div>

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={!file || isExtracting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Extracting...
              </>
            ) : (
              'Extract Data'
            )}
          </button>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Result */}
          {result?.success && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex justify-between items-start">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Extraction successful!
                    </p>
                    {result.documentId && (
                      <p className="mt-1 text-xs text-green-600">
                        Saved with ID: {result.documentId}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleDownloadJSON}
                  className="ml-4 px-3 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-md hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Download JSON
                </button>
              </div>
            </div>
          )}

          {/* Extracted Data Preview */}
          {result?.data && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Extracted Data Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}