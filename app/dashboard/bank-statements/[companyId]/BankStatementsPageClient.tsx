'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BankStatementsView from '@/components/bank-statement/BankStatementsView';

interface Props {
  companyId: string;
}

export default function BankStatementsPageClient({ companyId }: Props) {
  return (
    <ProtectedRoute>
      <BankStatementsView companyIdOverride={companyId} />
    </ProtectedRoute>
  );
}
