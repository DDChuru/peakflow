'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SupportedCurrency } from '@/types/auth';
import { bankAccountService } from '@/lib/firebase';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CashFlowMetrics {
  currentCash: number;
  monthlyInflows: number;
  monthlyOutflows: number;
  inflowChange: number;
  outflowChange: number;
}

export default function CashFlowPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [companyCurrency, setCompanyCurrency] = useState<SupportedCurrency>('USD');
  const [metrics, setMetrics] = useState<CashFlowMetrics>({
    currentCash: 0,
    monthlyInflows: 0,
    monthlyOutflows: 0,
    inflowChange: 0,
    outflowChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId && user) {
      loadCashFlowData();
    }
  }, [companyId, user]);

  const loadCashFlowData = async () => {
    try {
      setLoading(true);

      // Load company currency
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        setCompanyCurrency(companySnap.data().defaultCurrency || 'USD');
      }

      // Load current cash from bank accounts
      let currentCash = 0;
      try {
        const bankBalances = await bankAccountService.getAccountBalanceSummary(companyId);
        currentCash = bankBalances.totalBalance || 0;
      } catch (error) {
        console.error('Error loading bank balances:', error);
      }

      // For now, inflows/outflows are placeholders
      // TODO: Implement by querying journal entries for cash accounts in last 30 days
      const monthlyInflows = 0;
      const monthlyOutflows = 0;
      const inflowChange = 0;
      const outflowChange = 0;

      setMetrics({
        currentCash,
        monthlyInflows,
        monthlyOutflows,
        inflowChange,
        outflowChange
      });
    } catch (error) {
      console.error('Error loading cash flow data:', error);
      toast.error('Failed to load cash flow data');
    } finally {
      setLoading(false);
    }
  };

  if (accessLoading || loading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Checking workspace access...</p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canAccess) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accessError || 'You do not have access to this workspace.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cash Flow</h1>
              <p className="text-gray-600">Monitor and forecast cash flow movements</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button>
                <TrendingUp className="h-4 w-4 mr-2" />
                Create Forecast
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Cash</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.currentCash, companyCurrency)}</div>
                <p className="text-xs text-muted-foreground">
                  Total bank account balances
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Inflows (30d)</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.monthlyInflows, companyCurrency)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.inflowChange !== 0
                    ? `${metrics.inflowChange > 0 ? '+' : ''}${metrics.inflowChange.toFixed(1)}% from last period`
                    : 'Data not yet available'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outflows (30d)</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.monthlyOutflows, companyCurrency)}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.outflowChange !== 0
                    ? `${metrics.outflowChange > 0 ? '+' : ''}${metrics.outflowChange.toFixed(1)}% from last period`
                    : 'Data not yet available'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Chart */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Cash Flow Forecast</CardTitle>
                <CardDescription>
                  Projected cash movements for the next 12 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cash flow chart will be displayed here</p>
                    <p className="text-sm text-gray-400">Connect your bank accounts to see real-time data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Cash Movements</CardTitle>
                <CardDescription>Latest inflows and outflows</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Recent transactions will be displayed here</p>
                    <p className="text-sm text-gray-400">Coming soon: Real-time cash movement tracking</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash Flow Forecast */}
            <Card>
              <CardHeader>
                <CardTitle>30-Day Forecast</CardTitle>
                <CardDescription>Projected cash position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Cash flow forecast will be displayed here</p>
                    <p className="text-sm text-gray-400">Coming soon: AI-powered cash flow predictions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
