'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import {
  debtorService,
  creditorService,
  transactionService,
  adminService
} from '@/lib/firebase';
import {
  Company,
  Debtor,
  Creditor,
  DebtorSummary,
  CreditorSummary,
  TransactionSummary
} from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader, TabNavigation } from '@/components/ui/navigation';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  BarChart3,
  FileText,
  Building2,
  Calendar,
  ChevronRight,
  Banknote
} from 'lucide-react';
import { cn, formatCurrency, formatDate, formatRelativeTime } from '@/lib/utils';

export default function CompanyFinancialDashboard() {
  const params = useParams();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [debtorSummary, setDebtorSummary] = useState<DebtorSummary | null>(null);
  const [creditorSummary, setCreditorSummary] = useState<CreditorSummary | null>(null);
  const [transactionSummary, setTransactionSummary] = useState<TransactionSummary | null>(null);
  const [recentDebtors, setRecentDebtors] = useState<Debtor[]>([]);
  const [recentCreditors, setRecentCreditors] = useState<Creditor[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (companyId && user) {
      fetchDashboardData();
    }
  }, [companyId, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const companies = await adminService.getAllCompanies();
      const currentCompany = companies.find(c => c.id === companyId);

      if (!currentCompany) {
        toast.error('Company not found');
        return;
      }

      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('Access denied');
        return;
      }

      setCompany(currentCompany);

      const [
        debtorSum,
        creditorSum,
        transSum,
        debtors,
        creditors
      ] = await Promise.all([
        debtorService.getDebtorsSummary(companyId),
        creditorService.getCreditorsSummary(companyId),
        transactionService.getTransactionSummary(companyId),
        debtorService.getDebtors(companyId),
        creditorService.getCreditors(companyId)
      ]);

      setDebtorSummary(debtorSum);
      setCreditorSummary(creditorSum);
      setTransactionSummary(transSum);
      setRecentDebtors(debtors.slice(0, 5));
      setRecentCreditors(creditors.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const netPosition = (debtorSummary?.totalOutstanding || 0) - (creditorSummary?.totalPayable || 0);
  const isPositive = netPosition >= 0;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'receivables', label: 'Receivables', icon: <TrendingUp className="h-4 w-4" />, badge: debtorSummary?.totalDebtors },
    { id: 'payables', label: 'Payables', icon: <TrendingDown className="h-4 w-4" />, badge: creditorSummary?.totalCreditors },
    { id: 'transactions', label: 'Transactions', icon: <FileText className="h-4 w-4" />, badge: transactionSummary?.totalTransactions }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        <div className="animate-pulse">
          <div className="h-20 bg-white border-b border-gray-100" />
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        <PageHeader
          title="Financial Dashboard"
          subtitle={company?.name}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Financial Dashboard' }
          ]}
          actions={
            <div className="flex items-center space-x-2">
              <Link href={`/companies/${companyId}/debtors/new`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Debtor</span>
                </Button>
              </Link>
              <Link href={`/companies/${companyId}/creditors/new`}>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Creditor</span>
                </Button>
              </Link>
            </div>
          }
        />

        <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <OverviewStat
                    title="Total receivable"
                    value={formatCurrency(debtorSummary?.totalOutstanding || 0)}
                    hint={`${debtorSummary?.activeDebtors || 0} active debtors`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    gradient="from-emerald-500 to-green-600"
                    delay={0.1}
                  />
                  <OverviewStat
                    title="Total payable"
                    value={formatCurrency(creditorSummary?.totalPayable || 0)}
                    hint={`${creditorSummary?.activeCreditors || 0} active suppliers`}
                    icon={<TrendingDown className="h-5 w-5" />}
                    gradient="from-blue-500 to-indigo-600"
                    delay={0.2}
                  />
                  <OverviewStat
                    title="Total overdue"
                    value={formatCurrency((debtorSummary?.overdueAmount || 0) + (creditorSummary?.overduePayments || 0))}
                    hint="Needs attention"
                    icon={<AlertTriangle className="h-5 w-5" />}
                    gradient="from-amber-500 to-orange-600"
                    delay={0.3}
                  />
                  <OverviewStat
                    title="Net position"
                    value={formatCurrency(Math.abs(netPosition))}
                    hint={isPositive ? 'Positive cash position' : 'Negative cash position'}
                    icon={<Activity className="h-5 w-5" />}
                    gradient={isPositive ? 'from-purple-500 to-indigo-600' : 'from-rose-500 to-red-600'}
                    delay={0.4}
                  />
                </div>

                {/* Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold">Recent Debtors</CardTitle>
                        <Link href={`/companies/${companyId}/debtors`}>
                          <Button variant="ghost" size="sm">
                            View all
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent>
                        {recentDebtors.length === 0 ? (
                          <div className="py-12 text-center">
                            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No debtors yet</p>
                            <Link href={`/companies/${companyId}/debtors/new`}>
                              <Button variant="outline" size="sm" className="mt-3">
                                <Plus className="h-4 w-4" />
                                Add First Debtor
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {recentDebtors.map((debtor, index) => (
                              <motion.div
                                key={debtor.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-medium">
                                    {debtor.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{debtor.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {debtor.email || debtor.phone || 'No contact'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(debtor.currentBalance)}
                                  </p>
                                  <Badge variant={debtor.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                                    {debtor.status}
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Card className="h-full">
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold">Recent Creditors</CardTitle>
                        <Link href={`/companies/${companyId}/creditors`}>
                          <Button variant="ghost" size="sm">
                            View all
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </Link>
                      </CardHeader>
                      <CardContent>
                        {recentCreditors.length === 0 ? (
                          <div className="py-12 text-center">
                            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No creditors yet</p>
                            <Link href={`/companies/${companyId}/creditors/new`}>
                              <Button variant="outline" size="sm" className="mt-3">
                                <Plus className="h-4 w-4" />
                                Add First Creditor
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {recentCreditors.map((creditor, index) => (
                              <motion.div
                                key={creditor.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 + index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-medium">
                                    {creditor.name.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{creditor.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {creditor.category || 'Uncategorized'}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(creditor.currentBalance)}
                                  </p>
                                  <Badge variant={creditor.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                                    {creditor.status}
                                  </Badge>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Quick Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks and shortcuts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href={`/companies/${companyId}/debtors`}>
                          <Button variant="outline" className="w-full justify-start">
                            <Users className="h-4 w-4 mr-2" />
                            Manage Debtors
                          </Button>
                        </Link>
                        <Link href={`/companies/${companyId}/creditors`}>
                          <Button variant="outline" className="w-full justify-start">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Manage Creditors
                          </Button>
                        </Link>
                        <Link href={`/companies/${companyId}/transactions`}>
                          <Button variant="outline" className="w-full justify-start">
                            <FileText className="h-4 w-4 mr-2" />
                            View Transactions
                          </Button>
                        </Link>
                        <Link href="/bank-statements">
                          <Button variant="outline" className="w-full justify-start">
                            <Banknote className="h-4 w-4 mr-2" />
                            Bank Statements
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}

            {/* Other tab content */}
            {activeTab === 'receivables' && (
              <motion.div
                key="receivables"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingUp className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Receivables Management</h3>
                    <p className="text-gray-500 mb-6">Track and manage money owed to your company</p>
                    <Link href={`/companies/${companyId}/debtors`}>
                      <Button>
                        View All Debtors
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'payables' && (
              <motion.div
                key="payables"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardContent className="p-8 text-center">
                    <TrendingDown className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Payables Management</h3>
                    <p className="text-gray-500 mb-6">Track and manage money owed by your company</p>
                    <Link href={`/companies/${companyId}/creditors`}>
                      <Button>
                        View All Creditors
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === 'transactions' && (
              <motion.div
                key="transactions"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 rounded-xl bg-gray-50">
                        <p className="text-3xl font-bold text-gray-900">
                          {transactionSummary?.totalTransactions || 0}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Total Transactions</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-green-50">
                        <p className="text-3xl font-bold text-green-600">
                          {formatCurrency(transactionSummary?.completedAmount || 0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Completed</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-yellow-50">
                        <p className="text-3xl font-bold text-yellow-600">
                          {formatCurrency(transactionSummary?.pendingAmount || 0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Pending</p>
                      </div>
                      <div className="text-center p-4 rounded-xl bg-red-50">
                        <p className="text-3xl font-bold text-red-600">
                          {formatCurrency(transactionSummary?.overdueAmount || 0)}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Overdue</p>
                      </div>
                    </div>
                    <div className="mt-6 text-center">
                      <Link href={`/companies/${companyId}/transactions`}>
                        <Button>
                          View All Transactions
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface OverviewStatProps {
  title: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
  gradient: string;
  delay?: number;
}

function OverviewStat({ title, value, hint, icon, gradient, delay = 0 }: OverviewStatProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
    >
      <Card className={cn('relative overflow-hidden border-0 shadow-lg bg-gradient-to-br', gradient)}>
        <div className="absolute inset-0 bg-grid-white/10" />
        <CardContent className="relative p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-white/80">{title}</p>
              <p className="mt-1 text-3xl font-bold text-white">{displayValue}</p>
              {hint && <p className="mt-1 text-xs text-white/70">{hint}</p>}
            </div>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 text-white">
              {icon}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
