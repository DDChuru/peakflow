'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import {
  Mail,
  ShieldCheck,
  Building2,
  Users,
  Banknote,
  Sparkles,
  Key,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

type Tone = 'positive' | 'warning' | 'neutral';

const toneClasses: Record<Tone, string> = {
  positive: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  neutral: 'bg-indigo-100 text-indigo-700',
};

const roleBadge = (role: string) => {
  switch (role) {
    case 'admin':
      return 'bg-red-100 text-red-700';
    case 'developer':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
};

interface StatItem {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
  icon: LucideIcon;
}

export default function DashboardPage() {
  const { user, company, logout, isAdmin, hasRole } = useAuth();

  const stats: StatItem[] = [
    {
      label: 'Primary email',
      value: user?.email ?? '—',
      helper: user?.emailVerified ? 'Email verified' : 'Verify your email address',
      tone: user?.emailVerified ? 'positive' : 'warning',
      icon: Mail,
    },
    {
      label: 'Account status',
      value: user?.isActive ? 'Active' : 'Inactive',
      helper: user?.isActive ? 'You have full platform access' : 'Contact support to reactivate',
      tone: user?.isActive ? 'positive' : 'warning',
      icon: ShieldCheck,
    },
    {
      label: 'Assigned company',
      value: company?.name ?? 'Awaiting assignment',
      helper: company
        ? `${company.type === 'peakflow' ? 'PeakFlow' : 'Client'} tenant`
        : 'Ask an administrator to be added to a company',
      tone: company ? 'neutral' : 'warning',
      icon: Building2,
    },
  ];

  const quickActions = [
    {
      title: 'Bank statements',
      description: 'Upload, categorise, and reconcile transactions in seconds.',
      href: '/bank-statements',
      icon: Banknote,
      visible: Boolean(user?.companyId),
    },
    {
      title: 'Manage companies',
      description: 'Create, approve, and audit PeakFlow tenants.',
      href: '/companies',
      icon: Building2,
      visible: hasRole('admin') || hasRole('developer'),
    },
    {
      title: 'User management',
      description: 'Control roles, status, and company assignments.',
      href: '/admin/users',
      icon: Users,
      visible: isAdmin(),
    },
  ].filter((action) => action.visible);

  const showDeveloperCard = hasRole('developer');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <PageHeader
          title={user?.fullName ? `Welcome back, ${user.fullName.split(' ')[0]}` : 'Welcome back'}
          subtitle="Stay on top of your companies, statements, and permissions."
          breadcrumbs={[{ label: 'Dashboard' }]}
          actions={
            <div className="flex items-center gap-2">
              {user?.companyId && (
                <Link href="/bank-statements">
                  <Button variant="outline" size="sm">
                    Bank statements
                  </Button>
                </Link>
              )}
              {(hasRole('admin') || hasRole('developer')) && (
                <Link href="/companies">
                  <Button variant="outline" size="sm">
                    Manage companies
                  </Button>
                </Link>
              )}
              <Button variant="destructive" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          }
        />

        <main className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8 space-y-12">
          <section>
            <StaggerList className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <FadeIn key={stat.label} delay={index * 0.05}>
                    <Card hover className="bg-white">
                      <div className="p-6 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                              {stat.label}
                            </p>
                            <p className="mt-2 text-xl font-semibold text-gray-900">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.helper}</p>
                          </div>
                          <span
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${toneClasses[stat.tone]}`}
                          >
                            <Icon className="h-5 w-5" />
                          </span>
                        </div>
                      </div>
                    </Card>
                  </FadeIn>
                );
              })}
            </StaggerList>
          </section>

          {(quickActions.length > 0 || showDeveloperCard) && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Quick actions</h2>
              <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <FadeIn key={action.title} delay={0.1 + index * 0.05}>
                      <Link href={action.href} className="block focus:outline-none">
                        <Card hover className="bg-white transition-shadow">
                          <div className="p-6 space-y-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                              <Icon className="h-5 w-5" />
                            </span>
                            <div>
                              <h3 className="text-base font-semibold text-gray-900">{action.title}</h3>
                              <p className="text-sm text-gray-600">{action.description}</p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    </FadeIn>
                  );
                })}
                {showDeveloperCard && (
                  <FadeIn delay={0.1 + quickActions.length * 0.05}>
                    <Card className="bg-white border-dashed border-indigo-200">
                      <div className="p-6 space-y-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                          <Sparkles className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900">Developer resources</h3>
                          <p className="text-sm text-gray-600">
                            API docs and sandbox tooling are coming soon. Reach out to the PeakFlow team if you&apos;d like early access.
                          </p>
                        </div>
                      </div>
                    </Card>
                  </FadeIn>
                )}
              </StaggerList>
            </section>
          )}

          <section className="grid gap-6 lg:grid-cols-3">
            <FadeIn className="lg:col-span-2">
              <Card className="bg-white">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    <Key className="h-4 w-4" />
                    Access &amp; permissions
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">Roles</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(user?.roles || []).map((role) => (
                          <span
                            key={role}
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleBadge(role)}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Email verification</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {user?.emailVerified ? 'Verified' : 'Pending verification'}
                        </p>
                      </div>
                      <div className="rounded-lg border border-gray-100 p-3">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Account status</p>
                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </FadeIn>

            <FadeIn>
              <Card className="bg-white">
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
                    <Sparkles className="h-4 w-4" />
                    Company insight
                  </div>
                  {company ? (
                    <div className="space-y-3 text-sm text-gray-700">
                      {company.domain && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Domain</p>
                          <p className="font-medium text-gray-900">{company.domain}</p>
                        </div>
                      )}
                      {company.email && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{company.email}</p>
                        </div>
                      )}
                      {company.phone && (
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{company.phone}</p>
                        </div>
                      )}
                      <Link href={`/companies/${company.id}`}>
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          View company profile
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        You haven&apos;t been assigned to a company yet. Request access from your administrator.
                      </p>
                      <Link href="/no-company">
                        <Button variant="outline" size="sm" className="w-full">
                          Learn about tenant access
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>
          </section>
        </main>
      </div>
    </ProtectedRoute>
  );
}
