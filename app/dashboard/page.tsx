'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, StaggerList, staggerItem } from '@/components/ui/motion';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  FileText,
  Users,
  Building2,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Activity,
  BarChart3,
  Zap,
  Target,
  Eye,
  ChevronRight
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

// Import services
import { AdminService } from '@/lib/firebase/admin-service';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { invoiceService } from '@/lib/firebase';
import { Company } from '@/types/auth';

// Import components
import { BankToLedgerImport } from '@/components/banking/BankToLedgerImport';

interface FinancialMetrics {
  cashPosition: number;
  monthlyRevenue: number;
  outstandingReceivables: number;
  unpaidBills: number;
  revenueGrowth: number;
  expenseGrowth: number;
}

interface ActionItem {
  id: string;
  type: 'overdue_invoice' | 'unreconciled' | 'expiring_quote' | 'pending_payment';
  title: string;
  description: string;
  amount?: number;
  dueDate?: Date;
  priority: 'high' | 'medium' | 'low';
  action: () => void;
}

export default function UnifiedDashboard() {
  const { user, hasRole } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    cashPosition: 0,
    monthlyRevenue: 0,
    outstandingReceivables: 0,
    unpaidBills: 0,
    revenueGrowth: 0,
    expenseGrowth: 0
  });
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  const adminService = new AdminService();
  const companiesService = new CompaniesService();
  const isAdmin = hasRole('admin') || hasRole('developer');
  const hasCompany = user?.companyId;

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load company data if user has one
      if (user?.companyId) {
        const companyData = await companiesService.getCompanyById(user.companyId);
        setCompany(companyData);

        // Load financial metrics
        await loadFinancialMetrics(user.companyId);

        // Load action items
        await loadActionItems(user.companyId);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadFinancialMetrics = async (companyId: string) => {
    try {
      // TODO: Load actual metrics from services
      // For now, using mock data
      setMetrics({
        cashPosition: 125000,
        monthlyRevenue: 85000,
        outstandingReceivables: 42000,
        unpaidBills: 18000,
        revenueGrowth: 12.5,
        expenseGrowth: 8.3
      });
    } catch (error) {
      console.error('Error loading financial metrics:', error);
    }
  };

  const loadActionItems = async (companyId: string) => {
    try {
      // TODO: Load actual action items from services
      // For now, using mock data
      const mockActions: ActionItem[] = [
        {
          id: '1',
          type: 'overdue_invoice',
          title: '5 Overdue Invoices',
          description: 'Total amount: $12,500',
          amount: 12500,
          priority: 'high',
          action: () => router.push(`/workspace/${companyId}/invoices?status=overdue`)
        },
        {
          id: '2',
          type: 'unreconciled',
          title: '23 Unreconciled Transactions',
          description: 'Bank statements need reconciliation',
          priority: 'medium',
          action: () => router.push(`/workspace/${companyId}/reconciliation`)
        },
        {
          id: '3',
          type: 'expiring_quote',
          title: '3 Quotes Expiring Soon',
          description: 'Expiring in next 7 days',
          amount: 35000,
          priority: 'medium',
          action: () => router.push(`/workspace/${companyId}/quotes?status=expiring`)
        }
      ];
      setActionItems(mockActions);
    } catch (error) {
      console.error('Error loading action items:', error);
    }
  };

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-blue-600 bg-blue-50';
    }
  };

  const getActionIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'overdue_invoice': return Receipt;
      case 'unreconciled': return FileText;
      case 'expiring_quote': return Clock;
      case 'pending_payment': return CreditCard;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <WorkspaceLayout companyId={company?.id} companyName={company?.name}>
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-8">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-8 w-48 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-4 w-64 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-24 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-9 w-28 bg-gray-200 rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Metrics Grid Skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <SkeletonCard />
              </div>
              <SkeletonCard />
            </div>

            {/* Bottom Grid Skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <WorkspaceLayout companyId={company?.id} companyName={company?.name}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6 md:space-y-8">
            {/* Enhanced Header with Glass Effect */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-slate-200/50" />
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between p-4 sm:p-6 lg:p-8">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent leading-tight">
                      {hasCompany ? 'Financial Command Center' : 'Dashboard'}
                    </h1>
                  </div>
                  <p className="text-sm sm:text-base text-slate-600 font-medium">
                    {hasCompany
                      ? `Welcome back, ${user?.fullName || user?.email?.split('@')[0] || 'User'}`
                      : 'Get started by selecting or creating a company'}
                  </p>
                  {hasCompany && (
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm text-slate-500 mt-3">
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        <span className="hidden sm:inline">Live data sync</span>
                        <span className="sm:hidden">Live sync</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span>Updated now</span>
                      </div>
                    </div>
                  )}
                </div>
                {hasCompany && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 mt-4 lg:mt-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/80 transition-all duration-300 hover:scale-105 hover:shadow-lg text-xs sm:text-sm"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">This Month</span>
                      <span className="sm:hidden">Month</span>
                    </Button>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">Quick Action</span>
                      <span className="sm:hidden">Action</span>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>

          {hasCompany ? (
            <>
              {/* Enhanced Financial Metrics Grid */}
              <StaggerList className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
                <motion.div variants={staggerItem()}>
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/80 via-green-50/60 to-teal-50/40 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-emerald-700">Cash Position</p>
                            <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          </div>
                          <p className="text-3xl font-bold text-slate-900 mb-1">
                            {formatCurrency(metrics.cashPosition)}
                          </p>
                          <p className="text-xs font-medium text-slate-600">Available funds</p>
                        </div>
                        <div className="h-14 w-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                          <DollarSign className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      {/* Mini Trend Line */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-600">+12.5%</span>
                        </div>
                        <div className="flex space-x-0.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className={`w-1 bg-emerald-500/30 rounded-full ${i === 7 ? 'h-3' : i >= 5 ? 'h-2' : 'h-1'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={staggerItem()}>
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-violet-50/40 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-violet-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-blue-700">Monthly Revenue</p>
                            <div className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-pulse" />
                          </div>
                          <p className="text-3xl font-bold text-slate-900 mb-1">
                            {formatCurrency(metrics.monthlyRevenue)}
                          </p>
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                            <span className="text-xs font-medium text-emerald-600">
                              {metrics.revenueGrowth}% from last month
                            </span>
                          </div>
                        </div>
                        <div className="h-14 w-14 bg-gradient-to-br from-blue-500 to-violet-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                          <TrendingUp className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      {/* Mini Chart Area */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3 text-blue-600" />
                          <span className="text-xs font-medium text-slate-600">Growing</span>
                        </div>
                        <div className="flex space-x-0.5">
                          {[2, 3, 1, 4, 3, 5, 6].map((height, i) => (
                            <div key={i} className={`w-1 bg-blue-500/40 rounded-full h-${height}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={staggerItem()}>
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-amber-50/80 via-orange-50/60 to-yellow-50/40 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-amber-700">Outstanding AR</p>
                            <div className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                          </div>
                          <p className="text-3xl font-bold text-slate-900 mb-1">
                            {formatCurrency(metrics.outstandingReceivables)}
                          </p>
                          <p className="text-xs font-medium text-slate-600">To be collected</p>
                        </div>
                        <div className="h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                          <Receipt className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      {/* Collection Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3 text-amber-600" />
                          <span className="text-xs font-medium text-slate-600">85% collectible</span>
                        </div>
                        <div className="flex space-x-0.5">
                          {[3, 2, 4, 3, 2, 3, 4].map((height, i) => (
                            <div key={i} className={`w-1 bg-amber-500/40 rounded-full h-${height}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div variants={staggerItem()}>
                  <Card className="group relative overflow-hidden bg-gradient-to-br from-rose-50/80 via-red-50/60 to-pink-50/40 border-0 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-pink-500/5" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-400/10 to-transparent rounded-full -translate-y-16 translate-x-16" />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-semibold text-rose-700">Unpaid Bills</p>
                            <div className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                          </div>
                          <p className="text-3xl font-bold text-slate-900 mb-1">
                            {formatCurrency(metrics.unpaidBills)}
                          </p>
                          <p className="text-xs font-medium text-slate-600">To be paid</p>
                        </div>
                        <div className="h-14 w-14 bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                          <CreditCard className="h-7 w-7 text-white" />
                        </div>
                      </div>
                      {/* Payment Priority */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3 text-rose-600" />
                          <span className="text-xs font-medium text-slate-600">3 due soon</span>
                        </div>
                        <div className="flex space-x-0.5">
                          {[2, 3, 2, 1, 3, 2, 1].map((height, i) => (
                            <div key={i} className={`w-1 bg-rose-500/40 rounded-full h-${height}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </StaggerList>

              {/* Enhanced Action Required Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid gap-6 lg:grid-cols-3"
              >
                <div className="lg:col-span-2">
                  <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500" />
                    <div className="p-6 md:p-8">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-2xl flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold text-slate-900">Action Required</h2>
                            <p className="text-sm text-slate-600">Items needing your attention</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
                            {actionItems.length} items
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {actionItems.map((item, index) => {
                          const Icon = getActionIcon(item.type);
                          return (
                            <motion.div
                              key={item.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.1 }}
                              className="group relative overflow-hidden bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 hover:bg-white/80 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                              onClick={item.action}
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                              <div className="relative flex items-center justify-between p-5">
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    'h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110',
                                    item.priority === 'high' ? 'bg-gradient-to-br from-red-500 to-rose-500' :
                                    item.priority === 'medium' ? 'bg-gradient-to-br from-amber-500 to-orange-500' :
                                    'bg-gradient-to-br from-blue-500 to-indigo-500'
                                  )}>
                                    <Icon className="h-6 w-6 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                      {item.title}
                                    </p>
                                    <p className="text-sm text-slate-600 mt-1">
                                      {item.description}
                                    </p>
                                    {item.amount && (
                                      <p className="text-xs font-medium text-slate-500 mt-1">
                                        Amount: {formatCurrency(item.amount)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'px-2 py-1 rounded-full text-xs font-medium',
                                    item.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    item.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  )}>
                                    {item.priority.toUpperCase()}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white/60"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    View
                                    <ChevronRight className="h-3 w-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Enhanced Quick Actions */}
                <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                        <Zap className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Quick Actions</h2>
                        <p className="text-sm text-slate-600">Common tasks</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Link href={`/workspace/${company?.id}/invoices/new`} className="block">
                        <Button className="w-full justify-start h-12 bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                          <div className="h-8 w-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                            <Receipt className="h-4 w-4 text-white" />
                          </div>
                          Create Invoice
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </Link>

                      <Link href={`/workspace/${company?.id}/quotes/new`} className="block">
                        <Button className="w-full justify-start h-12 bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                          <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                            <FileText className="h-4 w-4 text-white" />
                          </div>
                          Create Quote
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </Link>

                      <Link href={`/workspace/${company?.id}/reconciliation`} className="block">
                        <Button className="w-full justify-start h-12 bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                          <div className="h-8 w-8 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                          Reconcile Bank
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </Link>

                      <Link href={`/workspace/${company?.id}/payments/record`} className="block">
                        <Button className="w-full justify-start h-12 bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                          <div className="h-8 w-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-300">
                            <DollarSign className="h-4 w-4 text-white" />
                          </div>
                          Record Payment
                          <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Enhanced Bottom Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="grid gap-6 lg:grid-cols-2"
              >
                <BankToLedgerImport companyId={company?.id || ''} />

                {/* Enhanced Recent Transactions */}
                <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                        <Activity className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-slate-900">Recent Transactions</h2>
                        <p className="text-sm text-slate-600">Latest activity</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                              <ArrowDownRight className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                Wire Transfer - Office Supplies Ltd
                              </p>
                              <p className="text-xs text-slate-500">Today at 14:30</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-600">-{formatCurrency(2500)}</span>
                            <p className="text-xs text-slate-500">Expense</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                              <ArrowUpRight className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                Invoice Payment - Acme Corp
                              </p>
                              <p className="text-xs text-slate-500">Today at 10:15</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-emerald-600">+{formatCurrency(15000)}</span>
                            <p className="text-xs text-slate-500">Revenue</p>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                              <ArrowDownRight className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors">
                                Recurring Payment - Cloud Services
                              </p>
                              <p className="text-xs text-slate-500">Yesterday at 00:00</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-600">-{formatCurrency(299)}</span>
                            <p className="text-xs text-slate-500">Subscription</p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <Link href={`/workspace/${company?.id}/transactions`} className="block mt-6">
                      <Button className="w-full bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                        View All Transactions
                        <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            </>
          ) : (
            /* No Company Assigned */
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-md">
                <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Assigned</h2>
                <p className="text-gray-500 mb-6">
                  You need to be assigned to a company to access the financial workspace.
                </p>
                {isAdmin ? (
                  <div className="space-y-2">
                    <Link href="/companies">
                      <Button className="w-full">
                        <Building2 className="h-4 w-4 mr-2" />
                        Manage Companies
                      </Button>
                    </Link>
                    <Link href="/admin/users">
                      <Button variant="outline" className="w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Users
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Please contact your administrator to be assigned to a company.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Admin Section (if admin without company) */}
          {isAdmin && !hasCompany && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h2>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/companies">
                  <Card className="p-4 hover:border-indigo-300 cursor-pointer transition-colors">
                    <Building2 className="h-8 w-8 text-indigo-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Companies</h3>
                    <p className="text-sm text-gray-500">Manage all companies</p>
                  </Card>
                </Link>
                <Link href="/admin/users">
                  <Card className="p-4 hover:border-indigo-300 cursor-pointer transition-colors">
                    <Users className="h-8 w-8 text-indigo-600 mb-2" />
                    <h3 className="font-medium text-gray-900">Users</h3>
                    <p className="text-sm text-gray-500">Manage user accounts</p>
                  </Card>
                </Link>
                <Link href="/admin/chart-of-accounts">
                  <Card className="p-4 hover:border-indigo-300 cursor-pointer transition-colors">
                    <FileText className="h-8 w-8 text-indigo-600 mb-2" />
                    <h3 className="font-medium text-gray-900">COA Templates</h3>
                    <p className="text-sm text-gray-500">Chart of accounts</p>
                  </Card>
                </Link>
              </div>
            </Card>
          )}
          </div>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}