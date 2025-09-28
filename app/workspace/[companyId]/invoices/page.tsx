'use client';

import { useParams } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import InvoicesPage from '@/app/companies/[id]/invoices/page';

export default function WorkspaceInvoices() {
  const params = useParams();
  const companyId = params.companyId as string;

  // Wrap the existing invoices page with workspace layout
  return <InvoicesPage />;
}