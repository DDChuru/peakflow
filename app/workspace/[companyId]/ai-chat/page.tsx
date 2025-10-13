'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AIAssistantChat } from '@/components/ai/AIAssistantChat';
import { companiesService } from '@/lib/firebase';
import { CompanyRecord } from '@/types/financial';

export default function AIAssistantPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const companyData = await companiesService.getCompanyById(companyId);
        setCompany(companyData);
      } catch (error) {
        console.error('Error loading company:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId} companyName={company?.name}>
        <div className="h-screen flex flex-col bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-2xl font-bold text-gray-900">
                🤖 AI Accounting Assistant
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Chat with your AI-powered accounting assistant. Ask about customers, suppliers,
                accounts, transactions, or get accounting guidance.
              </p>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full max-w-7xl mx-auto px-6 py-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                </div>
              ) : (
                <AIAssistantChat companyId={companyId} />
              )}
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
