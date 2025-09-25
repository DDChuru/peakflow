'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import BankStatementsView from '@/components/bank-statement/BankStatementsView';

export default function BankStatementsPage() {
  return (
    <ProtectedRoute>
      <BankStatementsView />
    </ProtectedRoute>
  );
}

