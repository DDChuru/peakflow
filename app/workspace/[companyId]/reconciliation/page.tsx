'use client';

import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function WorkspaceReconciliation() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;
  const { user } = useAuth();
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