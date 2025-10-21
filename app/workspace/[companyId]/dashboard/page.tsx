'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company } from '@/types/auth';
import { INDUSTRY_TEMPLATES } from '@/lib/accounting/industry-knowledge-base';
import {
  ArrowRight,
  FileUp,
  FileCheck,
  Receipt,
  BarChart3,
  TrendingUp,
  DollarSign,
  AlertCircle,
  Building2,
  Factory,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function WorkspaceDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();

  const companyId = params.companyId as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  // Check workspace access
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const companiesService = new CompaniesService();

  useEffect(() => {
    if (companyId) {
      loadCompany();
    }
  }, [companyId]);

  const loadCompany = async () => {
    try {
      setLoading(true);
      const companyData = await companiesService.getCompanyById(companyId);
      setCompany(companyData);
    } catch (error) {
      console.error('Failed to load company:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  // Quick action items
  const quickActions = [
    {
      title: 'Opening Balances',
      description: 'Set up initial account balances',
      icon: Sparkles,
      href: `/workspace/${companyId}/setup/opening-balances`,
      badge: 'SETUP',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      adminOnly: true
    },
    {
      title: 'Bank Import',
      description: 'Import bank transactions to general ledger',
      icon: FileUp,
      href: `/workspace/${companyId}/bank-import`,
      badge: 'NEW',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Reconciliation',
      description: 'Match and reconcile bank transactions',
      icon: FileCheck,
      href: `/workspace/${companyId}/reconciliation`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Invoices',
      description: 'Create and manage invoices',
      icon: Receipt,
      href: `/workspace/${companyId}/invoices`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Reports',
      description: 'View financial reports and insights',
      icon: BarChart3,
      href: `/workspace/${companyId}/reports`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Financial KPIs (mock data for now)
  const kpis = [
    {
      label: 'Cash Balance',
      value: '$45,230',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      label: 'Revenue (MTD)',
      value: '$28,450',
      change: '+8.3%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-blue-600'
    },
    {
      label: 'Outstanding AR',
      value: '$12,890',
      change: '-5.2%',
      trend: 'down',
      icon: Receipt,
      color: 'text-purple-600'
    },
    {
      label: 'Pending Reconciliations',
      value: '23',
      change: '+3',
      trend: 'neutral',
      icon: FileCheck,
      color: 'text-orange-600'
    }
  ];

  // Check access control
  if (accessLoading || loading) {
    return (
      <ProtectedRoute requireCompany>
        <WorkspaceLayout companyId={companyId} companyName="Loading...">
          <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading workspace...</p>
              </div>
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  // Access denied
  if (!canAccess) {
    return (
      <ProtectedRoute requireCompany>
        <WorkspaceLayout companyId={companyId} companyName="Access Denied">
          <div className="container mx-auto p-6 max-w-7xl">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {accessError || 'You do not have access to this workspace.'}
              </AlertDescription>
            </Alert>
            <div className="mt-4">
              <Button onClick={() => router.push('/dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  if (!company) {
    return (
      <ProtectedRoute requireCompany>
        <WorkspaceLayout companyId={companyId} companyName="Error">
          <div className="container mx-auto p-6 max-w-7xl">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Company not found. Please contact support if this problem persists.
              </AlertDescription>
            </Alert>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  const industryTemplate = company.industry && INDUSTRY_TEMPLATES[company.industry];

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId} companyName={company.name}>
        <div className="container mx-auto p-6 max-w-7xl space-y-6">
          {/* Company Header */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt={company.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-2xl">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500">
                      {company.type === 'peakflow' ? 'PeakFlow' : 'Client'} Company
                    </p>
                    {company.isActive ? (
                      <Badge variant="default" className="bg-green-100 text-green-700">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {industryTemplate && (
                    <div className="flex items-center gap-2 mt-2">
                      <Factory className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium text-indigo-600">
                        {industryTemplate.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {industryTemplate.chartOfAccounts?.length || 0} accounts
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              {hasRole('admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/companies')}
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Companies
                </Button>
              )}
            </div>
          </div>

          {/* Financial KPIs */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {kpis.map((kpi, index) => {
                const Icon = kpi.icon;
                return (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">{kpi.label}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                          <p className={`text-xs mt-1 ${
                            kpi.trend === 'up' ? 'text-green-600' :
                            kpi.trend === 'down' ? 'text-red-600' :
                            'text-gray-600'
                          }`}>
                            {kpi.change}
                          </p>
                        </div>
                        <div className={`h-12 w-12 rounded-full ${kpi.bgColor || 'bg-gray-100'} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${kpi.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickActions
                .filter(action => !action.adminOnly || hasRole('admin') || hasRole('financial_admin'))
                .map((action, index) => {
                const Icon = action.icon;
                return (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(action.href)}
                  >
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`h-12 w-12 rounded-full ${action.bgColor} flex items-center justify-center`}>
                          <Icon className={`h-6 w-6 ${action.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 flex items-center justify-center gap-2">
                            {action.title}
                            {action.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Open
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Recent Activity (Placeholder) */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">Recent transactions and activities will appear here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Start by importing bank transactions or creating invoices
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
