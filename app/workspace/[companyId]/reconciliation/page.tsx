'use client';

import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';

export default function WorkspaceReconciliation() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
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

  // Navigate to the existing reconciliation page
  const handleNavigateToReconciliation = () => {
    router.push(`/companies/${companyId}/reconciliations`);
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
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation</h1>
            <p className="text-sm text-gray-500 mt-1">Match bank transactions with your records</p>
          </div>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Reconciliation Sessions</h2>
            <p className="text-gray-600 mb-4">
              Start a new reconciliation session or continue with an existing one.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleNavigateToReconciliation}>
                Open Reconciliation Workspace
              </Button>
              <Link href={`/workspace/${companyId}/bank-statements`}>
                <Button variant="outline">
                  View Bank Statements
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}