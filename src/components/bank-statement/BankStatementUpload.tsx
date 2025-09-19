'use client';

import React, { useState } from 'react';
import { processBankStatement } from '@/lib/firebase/bank-statement-service';
import { BankStatement } from '@/types/bank-statement';
import toast from 'react-hot-toast';

interface BankStatementUploadProps {
  companyId: string;
  companyName: string;
  onUploadSuccess: (statement: BankStatement) => void;
}

export default function BankStatementUpload({
  companyId,
  companyName,
  onUploadSuccess
}: BankStatementUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
    } else {
      toast.error('Please upload a PDF file');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      toast.error('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a bank statement PDF');
      return;
    }

    setIsUploading(true);
    const loadingToast = toast.loading('Processing bank statement...');

    try {
      const statement = await processBankStatement(file, companyId, companyName);

      toast.dismiss(loadingToast);
      toast.success('Bank statement processed successfully!');

      onUploadSuccess(statement);
      setFile(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error instanceof Error ? error.message : 'Failed to process bank statement');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Upload Bank Statement
      </h3>

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
          dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'
        } transition-colors`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept="application/pdf"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <label
          htmlFor="file-upload"
          className="cursor-pointer"
        >
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>

          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-indigo-600 hover:text-indigo-500">
              Click to upload
            </span>
            {' '}or drag and drop your bank statement PDF
          </p>
          <p className="text-xs text-gray-500 mt-1">
            PDF files only (max 10MB)
          </p>
        </label>

        {file && (
          <div className="mt-4 p-3 bg-white rounded-md border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  className="h-8 w-8 text-red-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFile(null)}
                className="text-gray-400 hover:text-gray-500"
                disabled={isUploading}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Button */}
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </>
          ) : (
            'Process Bank Statement'
          )}
        </button>
      </div>

      {/* Info Text */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Your bank statement will be processed using AI to extract transactions, balances, and account information.
              All data is securely stored and linked to your company.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}