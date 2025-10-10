'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { IndustryTemplateService, CompanyAccountRecord } from '@/lib/accounting/industry-template-service';
import { AlertCircle, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ChartOfAccountsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { canAccess, loading: accessLoading, user } = useWorkspaceAccess(companyId);

  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<CompanyAccountRecord[]>([]);
  const [industryService, setIndustryService] = useState<IndustryTemplateService | null>(null);
  const [groupedAccounts, setGroupedAccounts] = useState<Record<string, CompanyAccountRecord[]>>({});

  useEffect(() => {
    if (companyId) {
      setIndustryService(new IndustryTemplateService(companyId));
    }
  }, [companyId]);

  useEffect(() => {
    if (industryService) {
      loadAccounts();
    }
  }, [industryService]);

  const loadAccounts = async () => {
    if (!industryService) return;

    try {
      setLoading(true);
      const fetchedAccounts = await industryService.listAccounts();
      console.log(`[COA Page] Loaded ${fetchedAccounts.length} accounts for company ${companyId}`);
      setAccounts(fetchedAccounts);

      // Group by type
      const grouped: Record<string, CompanyAccountRecord[]> = {
        asset: [],
        liability: [],
        equity: [],
        revenue: [],
        expense: []
      };

      fetchedAccounts.forEach(account => {
        if (grouped[account.type]) {
          grouped[account.type].push(account);
        }
      });

      setGroupedAccounts(grouped);
    } catch (error) {
      console.error('[COA Page] Failed to load chart of accounts:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  if (accessLoading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="flex items-center justify-center min-h-screen">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canAccess) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You do not have access to this workspace.
            </AlertDescription>
          </Alert>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout companyId={companyId}>
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-muted-foreground mt-1">
              View and manage your general ledger accounts
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadAccounts}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            {user?.roles?.includes('admin') && (
              <Link href={`/companies/${companyId}/edit`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Apply Industry Template
                </Button>
              </Link>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">Loading chart of accounts...</p>
          </div>
        ) : accounts.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="mt-2">
              <p className="font-semibold mb-2">No Chart of Accounts Found</p>
              <p className="mb-4">
                This company doesn't have a chart of accounts set up yet.
                You need to apply an industry template to create GL accounts.
              </p>
              {user?.roles?.includes('admin') ? (
                <Link href={`/companies/${companyId}/edit`}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Set Up Chart of Accounts
                  </Button>
                </Link>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Please contact an administrator to set up the chart of accounts.
                </p>
              )}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-5">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Accounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{accounts.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Assets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedAccounts.asset?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Liabilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedAccounts.liability?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedAccounts.revenue?.length || 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedAccounts.expense?.length || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Account Groups */}
            {Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
              typeAccounts.length > 0 && (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="capitalize">{type} Accounts ({typeAccounts.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {typeAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-mono font-semibold text-sm">
                                {account.code}
                              </span>
                              <span className="font-medium">{account.name}</span>
                              {account.isSystemAccount && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                  System
                                </span>
                              )}
                            </div>
                            {account.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {account.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="capitalize">{account.normalBalance}</span>
                            {account.isActive ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            ))}
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
