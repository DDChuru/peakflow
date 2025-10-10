'use client';

import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import BankStatementsPageClient from '@/app/dashboard/bank-statements/[companyId]/BankStatementsPageClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';

export default function WorkspaceBankStatements() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const companiesService = new CompaniesService();
      const companyData = await companiesService.getCompanyById(companyId);
      setCompany(companyData);
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  if (accessLoading || loading) {
    return (
      <ProtectedRoute>
        <WorkspaceLayout companyId={companyId} companyName="Loading...">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading workspace...</p>
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  if (!canAccess) {
    return (
      <ProtectedRoute>
        <WorkspaceLayout companyId={companyId} companyName={company?.name}>
          <div className="p-6 max-w-7xl mx-auto space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {accessError || 'You do not have access to this workspace.'}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <WorkspaceLayout companyId={companyId} companyName={company?.name}>
        <BankStatementsPageClient />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}