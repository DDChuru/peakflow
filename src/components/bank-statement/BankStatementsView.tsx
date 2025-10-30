'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { doc, getDoc } from 'firebase/firestore';
import {
  UploadCloud,
  Clock3,
  Table,
  RefreshCw,
  Building2,
  Calendar,
  ShieldCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  PiggyBank,
} from 'lucide-react';

import { useAuth } from '@/contexts/AuthContext';
import { BankStatement } from '@/types/bank-statement';
import type { SupportedCurrency } from '@/types/auth';
import {
  getCompanyBankStatements,
  calculateSummaryStats,
} from '@/lib/firebase/bank-statement-service';
import { db } from '@/lib/firebase/config';
import BankStatementUpload from '@/components/bank-statement/BankStatementUpload';
import SummaryCards from '@/components/bank-statement/SummaryCards';
import TransactionTable from '@/components/bank-statement/TransactionTable';
import { PageHeader, TabNavigation } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bankAccountService } from '@/lib/firebase';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import { BankAccount } from '@/types/accounting/bank-account';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { SkeletonCard, SkeletonList, SkeletonTable } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface BankStatementsViewProps {
  companyIdOverride?: string;
}

type ActiveTab = 'upload' | 'history' | 'transactions';

type LoadOptions = {
  silent?: boolean;
};

const STATUS_VARIANTS: Record<BankStatement['status'], 'default' | 'secondary' | 'warning' | 'destructive'> = {
  completed: 'default',
  processing: 'warning',
  pending: 'secondary',
  failed: 'destructive',
};

export default function BankStatementsView({ companyIdOverride }: BankStatementsViewProps) {
  const router = useRouter();
  const { user } = useAuth();

  const resolvedCompanyId = useMemo(() => {
    if (companyIdOverride) return companyIdOverride;
    return user?.companyId ?? null;
  }, [companyIdOverride, user?.companyId]);

  const [companyName, setCompanyName] = useState('');
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [companyCurrency, setCompanyCurrency] = useState<SupportedCurrency>('USD');
  const [selectedStatementId, setSelectedStatementId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('upload');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  const selectedStatement = useMemo(() => {
    if (!selectedStatementId) return null;
    return statements.find((statement) => statement.id === selectedStatementId) ?? null;
  }, [selectedStatementId, statements]);

  const showFinancialDashboardLink = Boolean(companyIdOverride || resolvedCompanyId);

  const backHref = showFinancialDashboardLink
    ? `/companies/${companyIdOverride ?? resolvedCompanyId}/financial-dashboard`
    : '/dashboard';

  const breadcrumbs = showFinancialDashboardLink
    ? [
        { label: 'Companies', href: '/companies' },
        {
          label: companyName || 'Company',
          href: `/companies/${companyIdOverride ?? resolvedCompanyId}`,
        },
        { label: 'Bank statements' },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Bank statements' },
      ];

  const loadCompanyAndStatements = useCallback(
    async (companyId: string, { silent = false }: LoadOptions = {}) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const companyDoc = await getDoc(doc(db, 'companies', companyId));
        if (!companyDoc.exists()) {
          toast.error('Company not found');
          router.push('/companies');
          return;
        }

        const data = companyDoc.data();
        const name = data?.name;
        if (typeof name === 'string') {
          setCompanyName(name);
        }

        const currencyCandidate = data?.defaultCurrency;
        if (isSupportedCurrency(currencyCandidate)) {
          setCompanyCurrency(currencyCandidate);
        } else {
          setCompanyCurrency('USD');
        }

        const bankStatements = await getCompanyBankStatements(companyId, 50);
        setStatements(bankStatements);

        if (bankStatements.length === 0) {
          setSelectedStatementId(null);
          setActiveTab('upload');
          return;
        }

        setSelectedStatementId((previous) => {
          if (!previous) {
            return bankStatements[0]?.id ?? null;
          }
          const match = bankStatements.find((statement) => statement.id === previous);
          return match?.id ?? bankStatements[0]?.id ?? null;
        });

        setActiveTab((current) => (current === 'upload' ? 'transactions' : current));
      } catch (error) {
        console.error('Error loading bank statements:', error);
        toast.error('Failed to load bank statements');
        router.push('/companies');
      } finally {
        if (silent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [router]
  );

  useEffect(() => {
    if (!resolvedCompanyId) {
      setBankAccounts([]);
      return;
    }

    const fetchBankAccounts = async () => {
      try {
        setLoadingBankAccounts(true);
        const accounts = await bankAccountService.listBankAccounts(resolvedCompanyId, { includeInactive: true });
        setBankAccounts(accounts);
      } catch (error) {
        console.error('Failed to load bank accounts', error);
        toast.error('Unable to load bank accounts for reconciliation');
      } finally {
        setLoadingBankAccounts(false);
      }
    };

    fetchBankAccounts();
  }, [resolvedCompanyId]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!resolvedCompanyId) {
      toast.error('Your user account is not associated with a company. Please contact support.');
      router.push('/no-company');
      return;
    }

    loadCompanyAndStatements(resolvedCompanyId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, resolvedCompanyId]);

  const handleUploadSuccess = async (statement: BankStatement) => {
    setStatements((prev) => [statement, ...prev]);
    setSelectedStatementId(statement.id ?? null);
    setActiveTab('transactions');

    if (resolvedCompanyId) {
      await loadCompanyAndStatements(resolvedCompanyId, { silent: true });
    }
  };

  const handleSelectStatement = (statement: BankStatement) => {
    setSelectedStatementId(statement.id ?? null);
    setActiveTab('transactions');
  };

  const findMatchingBankAccount = () => {
    if (!selectedStatement) return bankAccounts[0] ?? null;
    if (!bankAccounts.length) return null;

    const statementAccountNumber = selectedStatement.accountInfo?.accountNumber?.replace(/[^0-9]/g, '') ?? '';
    if (!statementAccountNumber) {
      return bankAccounts[0];
    }

    const exact = bankAccounts.find((account) => {
      const candidate = account.accountNumber.replace(/[^0-9]/g, '');
      return candidate && statementAccountNumber && candidate.slice(-4) === statementAccountNumber.slice(-4);
    });

    return exact ?? bankAccounts[0];
  };

  const handleStartReconciliation = async () => {
    if (!resolvedCompanyId || !selectedStatement || !user) return;

    const targetBankAccount = findMatchingBankAccount();
    if (!targetBankAccount) {
      toast.error('Link a bank account to this company before starting reconciliation.');
      return;
    }

    // Helper to format dates properly for storage
    const formatDateForStorage = (dateStr: string): string => {
      if (!dateStr) return '';

      // If it's already in a full date format, return as is
      if (dateStr.match(/^\d{4}-\d{2}-\d{2}/) || dateStr.includes(',')) {
        return dateStr;
      }

      // If it's "DD MMM" format, add the current year
      if (dateStr.match(/^\d{1,2}\s+\w{3}$/)) {
        const currentYear = new Date().getFullYear();
        // Parse the date with the year to ensure it's valid
        const parsed = new Date(`${dateStr} ${currentYear}`);
        if (!isNaN(parsed.getTime())) {
          // Return in ISO format for consistent storage
          return parsed.toISOString().split('T')[0];
        }
      }

      return dateStr;
    };

    const fallbackStart = selectedStatement.transactions[0]?.date;
    const fallbackEnd = selectedStatement.transactions[selectedStatement.transactions.length - 1]?.date;

    const periodFrom = selectedStatement.summary?.statementPeriod?.from || fallbackStart;
    const periodTo = selectedStatement.summary?.statementPeriod?.to || fallbackEnd;

    if (!periodFrom || !periodTo) {
      toast.error('Statement period is missing; please update the statement details before reconciling.');
      return;
    }

    // Format dates properly before storing
    const formattedPeriodStart = formatDateForStorage(periodFrom);
    const formattedPeriodEnd = formatDateForStorage(periodTo);

    try {
      setCreatingSession(true);
      const session = await reconciliationService.createSession(resolvedCompanyId, {
        bankAccountId: targetBankAccount.id,
        bankAccountName: targetBankAccount.name,
        currency: targetBankAccount.currency,
        periodStart: formattedPeriodStart,
        periodEnd: formattedPeriodEnd,
        openingBalance:
          selectedStatement.summary?.openingBalance ??
          selectedStatement.transactions[0]?.balance ??
          0,
        closingBalance:
          selectedStatement.summary?.closingBalance ??
          selectedStatement.transactions[selectedStatement.transactions.length - 1]?.balance ??
          0,
        notes: `Generated from ${selectedStatement.fileName}`,
        metadata: {
          statementId: selectedStatement.id,
          accountNumber: selectedStatement.accountInfo?.accountNumber,
        },
        createdBy: user.uid,
      });

      toast.success('Reconciliation session created');
      console.info('Reconciliation session ready:', session);
      router.push(`/companies/${resolvedCompanyId}/reconciliations/${session.id}`);
    } catch (error) {
      console.error('Failed to create reconciliation session', error);
      toast.error('Could not start reconciliation');
    } finally {
      setCreatingSession(false);
    }
  };

  const handleRefresh = () => {
    if (!resolvedCompanyId || refreshing) return;
    loadCompanyAndStatements(resolvedCompanyId, { silent: true });
  };

  const analysis = useMemo(() => {
    if (!selectedStatement) return null;
    const base = calculateSummaryStats(selectedStatement.transactions);
    const topCategories = Object.entries(base.transactionsByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    const topTypes = Object.entries(base.transactionsByType)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return {
      totals: {
        totalIncome: base.totalIncome,
        totalExpenses: base.totalExpenses,
        netCashFlow: base.netCashFlow,
        averageBalance: base.averageBalance,
      },
      topCategories,
      topTypes,
    };
  }, [selectedStatement]);

  useEffect(() => {
    if (activeTab === 'transactions' && !selectedStatement) {
      setActiveTab(statements.length > 0 ? 'history' : 'upload');
    }
  }, [activeTab, selectedStatement, statements.length]);

  const tabs = useMemo(() => {
    const base = [
      {
        id: 'upload',
        label: 'Upload',
        icon: <UploadCloud className="h-4 w-4" />,
      },
      {
        id: 'history',
        label: 'History',
        icon: <Clock3 className="h-4 w-4" />,
        badge: statements.length,
      },
    ];

    if (selectedStatement) {
      base.push({
        id: 'transactions',
        label: 'Transactions',
        icon: <Table className="h-4 w-4" />,
        badge: selectedStatement.transactions.length,
      });
    }

    return base;
  }, [statements.length, selectedStatement]);

  const isEmpty = !loading && statements.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <PageHeader
        title={`Bank statements${companyName ? ` · ${companyName}` : ''}`}
        subtitle="Upload, review, and analyse statements in one place."
        backHref={backHref}
        breadcrumbs={breadcrumbs}
        actions={
          <div className="flex items-center gap-2">
            {resolvedCompanyId && (
              <Link href={`/companies/${resolvedCompanyId}`}>
                <Button variant="outline" size="sm">
                  <Building2 className="mr-2 h-4 w-4" />
                  View company
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        }
      />

      <TabNavigation tabs={tabs} activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as ActiveTab)} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {loading ? (
          <FadeIn>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card>
                <CardContent className="py-6">
                  <SkeletonCard />
                  <div className="mt-6">
                    <SkeletonList items={3} />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-6 space-y-4">
                  <SkeletonCard />
                  <SkeletonTable />
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        ) : (
          <>
            {activeTab === 'upload' && resolvedCompanyId && (
              <FadeIn>
                <BankStatementUpload
                  companyId={resolvedCompanyId}
                  companyName={companyName}
                  onUploadSuccess={handleUploadSuccess}
                />
              </FadeIn>
            )}

            {activeTab === 'history' && (
              <FadeIn>
                {isEmpty ? (
                  <Card className="border-dashed border-indigo-200 bg-white/80 text-center">
                    <CardContent className="py-12 space-y-4">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 text-indigo-500">
                        <UploadCloud className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold text-gray-900">No statements yet</h3>
                        <p className="text-sm text-gray-600">
                          Drag and drop a PDF to get started. We will extract balances, fees, and transactions automatically.
                        </p>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab('upload')}>
                        Upload a statement
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <StaggerList className="grid gap-4 md:grid-cols-2">
                    {statements.map((statement, index) => {
                      const isActive = selectedStatementId === statement.id;
                      const statusVariant = STATUS_VARIANTS[statement.status];
                      return (
                        <FadeIn key={statement.id ?? `${statement.fileName}-${index}`} delay={index * 0.05}>
                          <button
                            type="button"
                            onClick={() => handleSelectStatement(statement)}
                            className="text-left w-full focus:outline-none"
                          >
                            <Card
                              hover
                              className={cn(
                                'transition-all',
                                isActive && 'border-indigo-300 shadow-lg shadow-indigo-100'
                              )}
                            >
                              <CardContent className="py-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{statement.fileName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Uploaded {statement.createdAt?.toDate?.().toLocaleString?.() ?? statement.uploadedAt.toLocaleString?.()}
                                    </p>
                                  </div>
                                  <Badge variant={statusVariant} className="capitalize">
                                    {statement.status}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>
                                      {statement.period?.start ?? statement.summary?.statementPeriod?.from ?? '—'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 justify-end">
                                    <ShieldCheck className="h-4 w-4 text-gray-400" />
                                    <span>{statement.transactions.length} transactions</span>
                                  </div>
                                </div>
                                {statement.accountInfo && (
                                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                                    <span className="font-medium text-gray-700">
                                      {statement.accountInfo.accountName || statement.accountInfo.bankName}
                                    </span>
                                    <span className="font-mono">
                                      {statement.accountInfo.accountNumber}
                                    </span>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </button>
                        </FadeIn>
                      );
                    })}
                  </StaggerList>
                )}
              </FadeIn>
            )}

            {activeTab === 'transactions' && selectedStatement && (
              <FadeIn className="space-y-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Kick off reconciliation once you have reviewed the statement details.</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleStartReconciliation}
                    disabled={creatingSession || loadingBankAccounts}
                  >
                    {creatingSession ? 'Starting...' : 'Start reconciliation'}
                  </Button>
                </div>
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <Card>
                    <CardContent className="py-6 space-y-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Active statement
                          </p>
                          <h2 className="text-xl font-semibold text-gray-900">{selectedStatement.fileName}</h2>
                          <p className="text-sm text-gray-500">
                            Processed {selectedStatement.processedAt?.toLocaleString?.() ?? selectedStatement.createdAt?.toDate?.().toLocaleString?.() ?? '—'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={STATUS_VARIANTS[selectedStatement.status]} className="capitalize">
                            {selectedStatement.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <InsightPill
                          icon={<ArrowUpCircle className="h-5 w-5 text-emerald-500" />}
                          label="Total deposits"
                          value={selectedStatement.summary?.totalDeposits}
                          currency={companyCurrency}
                        />
                        <InsightPill
                          icon={<ArrowDownCircle className="h-5 w-5 text-rose-500" />}
                          label="Total withdrawals"
                          value={selectedStatement.summary?.totalWithdrawals}
                          currency={companyCurrency}
                        />
                        <InsightPill
                          icon={<PiggyBank className="h-5 w-5 text-indigo-500" />}
                          label="Closing balance"
                          value={selectedStatement.summary?.closingBalance}
                          currency={companyCurrency}
                        />
                        <InsightPill
                          icon={<Building2 className="h-5 w-5 text-amber-500" />}
                          label="Opening balance"
                          value={selectedStatement.summary?.openingBalance}
                          currency={companyCurrency}
                        />
                      </div>

                      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-600">
                        <div className="flex flex-wrap items-center gap-3">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>
                            {selectedStatement.summary?.statementPeriod?.from
                              ? `${selectedStatement.summary.statementPeriod.from} → ${selectedStatement.summary.statementPeriod.to}`
                              : 'Statement period unavailable'}
                          </span>
                          <span className="h-1 w-1 rounded-full bg-gray-300" />
                          <span>Account · {selectedStatement.accountInfo?.accountName ?? '—'}</span>
                          {selectedStatement.accountInfo?.accountNumber && (
                            <span className="font-mono text-xs text-gray-500">
                              {selectedStatement.accountInfo.accountNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {analysis && (
                    <Card>
                      <CardContent className="py-6 space-y-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Cashflow snapshot
                          </p>
                          <p className="text-2xl font-semibold text-gray-900">
                            {formatCurrency(analysis.totals.netCashFlow, companyCurrency)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {analysis.totals.netCashFlow >= 0
                              ? 'Positive movement across the statement period'
                              : 'Net cash outflow across the statement period'}
                          </p>
                        </div>
                        <div className="space-y-3">
                          {analysis.topCategories.map(([category, count]) => (
                            <div key={category} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-2 text-sm">
                              <span className="text-gray-700">{category}</span>
                              <span className="text-xs font-semibold text-gray-500">{count} transactions</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <SummaryCards
                  summary={selectedStatement.summary}
                  additionalStats={analysis?.totals}
                  currency={companyCurrency}
                />

                <TransactionTable
                  transactions={selectedStatement.transactions}
                  currency={companyCurrency}
                />
              </FadeIn>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function formatCurrency(amount?: number | null, currency: SupportedCurrency = 'USD') {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(0);
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

interface InsightPillProps {
  icon: React.ReactNode;
  label: string;
  value?: number | null;
  currency: SupportedCurrency;
}

function InsightPill({ icon, label, value, currency }: InsightPillProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{formatCurrency(value, currency)}</p>
      </div>
    </div>
  );
}

function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === 'string' && ['USD', 'ZAR', 'EUR', 'ZWD', 'ZIG'].includes(value);
}
