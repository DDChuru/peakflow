import ProtectedRoute from '@/components/auth/ProtectedRoute';
import IndustryCOAShowcase from '@/components/accounting/IndustryCOAShowcase';
import { PageHeader } from '@/components/ui/navigation';

export const metadata = {
  title: 'Industry COA Library | PeakFlow',
};

export default function IndustryCOAPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'financial_admin', 'admin']}>
      <div className="min-h-screen bg-gray-50 pb-16">
        <PageHeader
          title="Industry Ledger Library"
          subtitle="Review standardized chart of accounts and payment rail coverage across every supported industry."
          breadcrumbs={[
            { label: 'Resources', href: '/resources' },
            { label: 'Industry COA Library' },
          ]}
        />

        <main className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <IndustryCOAShowcase />
        </main>
      </div>
    </ProtectedRoute>
  );
}
