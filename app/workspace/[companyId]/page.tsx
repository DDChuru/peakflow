'use client';

import { useParams, useRouter } from 'next/navigation';
import UnifiedDashboard from '@/app/dashboard/page';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';

export default function WorkspaceOverview() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  if (accessLoading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Checking workspace access...</p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canAccess) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accessError || 'You do not have access to this workspace.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </WorkspaceLayout>
    );
  }

  // The UnifiedDashboard component will handle everything
  // This is just a wrapper to maintain the workspace URL structure
  return <UnifiedDashboard />;
}
