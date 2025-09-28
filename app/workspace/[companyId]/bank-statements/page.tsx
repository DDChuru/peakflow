'use client';

import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import BankStatementsPageClient from '@/app/dashboard/bank-statements/[companyId]/BankStatementsPageClient';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function WorkspaceBankStatements() {
  const params = useParams();
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

  return (
    <ProtectedRoute>
      <WorkspaceLayout companyId={companyId} companyName={company?.name}>
        <BankStatementsPageClient />
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}