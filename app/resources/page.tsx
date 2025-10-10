import { BookOpen } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import ResourceCards from './ResourceCards';

const resources: Array<{
  title: string;
  description: string;
  href: string;
  icon: string;
  badge: string;
}> = [
  {
    title: 'Industry COA Library',
    description: 'Explore curated chart of accounts and bank mappings across all supported industries.',
    href: '/resources/industry-coa',
    icon: 'Layers',
    badge: 'Featured',
  },
];

export const metadata = {
  title: 'Resources | PeakFlow',
};

export default function ResourcesPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'financial_admin', 'admin']}>
      <div className="min-h-screen bg-gray-50 pb-16">
        <PageHeader
          title="Resources"
          subtitle="Reference guides, templates, and playbooks to accelerate client delivery."
          breadcrumbs={[{ label: 'Resources' }]}
        />

        <main className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6 lg:px-8 space-y-10">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Knowledge base
            </h2>
            <ResourceCards resources={resources} />
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
