'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  ArrowRightLeft,
  ClipboardCheck,
  Send,
  BarChart3,
  Download,
  Printer,
} from 'lucide-react';
import { BankImportManual } from '@/components/manuals/BankImportManual';

export default function ManualsPage() {
  const params = useParams();
  const companyId = params.companyId as string;

  return (
    <ProtectedRoute>
      <WorkspaceLayout companyId={companyId}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">User Manuals</h1>
              <p className="text-gray-500 text-sm">Step-by-step guides for PeakFlow workflows</p>
            </div>
          </div>

          {/* Tabs for different manuals */}
          <Tabs defaultValue="bank-import" className="w-full">
            <TabsList className="bg-gray-100/80 p-1">
              <TabsTrigger value="bank-import" className="gap-2">
                <ArrowRightLeft className="w-4 h-4" />
                Bank Import to Ledger
              </TabsTrigger>
              <TabsTrigger value="coming-soon" className="gap-2" disabled>
                <FileText className="w-4 h-4" />
                More Coming Soon
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bank-import" className="mt-6">
              <BankImportManual />
            </TabsContent>

            <TabsContent value="coming-soon">
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  Additional manuals will be added here.
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
