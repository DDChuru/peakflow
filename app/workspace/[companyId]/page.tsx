'use client';

import { useParams, useRouter } from 'next/navigation';
import UnifiedDashboard from '@/app/dashboard/page';

export default function WorkspaceOverview() {
  const params = useParams();
  const companyId = params.companyId as string;

  // The UnifiedDashboard component will handle everything
  // This is just a wrapper to maintain the workspace URL structure
  return <UnifiedDashboard />;
}