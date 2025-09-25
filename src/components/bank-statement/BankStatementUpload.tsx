'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';

import { processBankStatement } from '@/lib/firebase/bank-statement-service';
import { BankStatement } from '@/types/bank-statement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BankStatementUploadProps {
  companyId: string;
  companyName: string;
  onUploadSuccess: (statement: BankStatement) => void;
}

const FEATURES = [
  {
    icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
    label: 'AI powered extraction',
  },
  {
    icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
    label: 'Secure processing',
  },
  {
    icon: <FileText className="h-4 w-4 text-amber-500" />,
    label: 'PDF statements only',
  },
];

export default function BankStatementUpload({
  companyId,
  companyName,
  onUploadSuccess,
}: BankStatementUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
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
    <Card className="border-gray-100 bg-white/90 shadow-lg">
      <CardHeader className="pb-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge variant="secondary" className="mb-2">
              {companyName || 'Unassigned company'}
            </Badge>
            <CardTitle className="text-xl">Upload a bank statement</CardTitle>
            <CardDescription>
              Drop a PDF straight from your downloads folder. We will detect balances, fees, and transactions automatically.
            </CardDescription>
          </div>
          <div className="hidden sm:flex flex-col items-end text-sm text-gray-500">
            <span className="font-medium text-gray-700">Company ID</span>
            <code className="rounded-lg bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
              {companyId}
            </code>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed px-8 py-12 text-center transition-all',
            dragActive ? 'border-indigo-400 bg-indigo-50/60 ring-4 ring-indigo-100' : 'border-gray-200 bg-white'
          )}
        >
          <input
            type="file"
            id="bank-statement-upload"
            className="hidden"
            accept="application/pdf"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <UploadCloud className="h-8 w-8" />
          </div>

          <div className="mt-4 space-y-2">
            <label htmlFor="bank-statement-upload" className="text-lg font-semibold text-gray-900 cursor-pointer">
              Click to browse or drag a file
            </label>
            <p className="text-sm text-gray-500">PDF files, up to 10MB</p>
          </div>

          <p className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            {FEATURES.map((feature) => (
              <span key={feature.label} className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-gray-600">
                {feature.icon}
                {feature.label}
              </span>
            ))}
          </p>
        </div>

        {file && (
          <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFile(null)}
              disabled={isUploading}
            >
              Remove
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-500">
            Statements are processed in the background. You will receive a success toast and the new transactions will appear instantly.
          </p>
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="inline-flex items-center"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Process statement
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

