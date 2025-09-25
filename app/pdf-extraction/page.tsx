'use client';

import Link from 'next/link';
import { FileText, Upload } from 'lucide-react';
import PDFExtractor from '@/components/pdf-extractor';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';

export default function PDFExtractionPage() {
  return (
    <AuthLayout
      title="Document intelligence"
      subtitle="Upload bank statements or invoices and let PeakFlow parse them instantly."
      accentText="Leverage generative AI to unlock structured data from complex financial documents."
      accentLink={{ label: 'Return to dashboard →', href: '/dashboard' }}
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white/70">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-indigo-200" />
            <div>
              <p className="font-medium text-white/90">Supported formats</p>
              <p className="text-white/60">PDF bank statements and invoices up to 10MB per file.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white/5 p-6 backdrop-blur">
          <PDFExtractor />
        </div>

        <div className="flex items-center justify-between text-xs text-white/60">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Documents are processed securely within your tenant.</span>
          </div>
          <Link href="/dashboard">
            <Button variant="glass" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
