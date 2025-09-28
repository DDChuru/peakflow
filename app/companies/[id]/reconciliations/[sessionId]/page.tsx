'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { cn, formatCurrency } from '@/lib/utils';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import { getBankStatement } from '@/lib/firebase/bank-statement-service';
import ManualMatchingInterface from '@/components/reconciliation/ManualMatchingInterface';
import type {
  ReconciliationAdjustment,
  ReconciliationMatch,
  ReconciliationSession,
} from '@/types/accounting/reconciliation';
import type { LedgerEntry } from '@/types/accounting/general-ledger';
import type { BankStatement, BankTransaction } from '@/types/bank-statement';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  TrendingUp,
  DollarSign,
  Activity,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  Banknote,
  BookOpen,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface RouteParams {
  id: string;
  sessionId: string;
}

export default function ReconciliationWorkspacePage() {
  const params = useParams<RouteParams>();
  const companyId = params.id;
  const sessionId = params.sessionId;
  const router = useRouter();

  const [session, setSession] = useState<ReconciliationSession | null>(null);
  const [matches, setMatches] = useState<ReconciliationMatch[]>([]);
  const [adjustments, setAdjustments] = useState<ReconciliationAdjustment[]>([]);
  const [bankStatement, setBankStatement] = useState<BankStatement | null>(null);
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningAutoMatch, setRunningAutoMatch] = useState(false);

  // Handle match operations
  const handleMatchCreated = useCallback((newMatch: ReconciliationMatch) => {
    setMatches(prev => [...prev, newMatch]);
  }, []);

  const handleMatchUpdated = useCallback((matchId: string, status: ReconciliationMatch['status']) => {
    setMatches(prev => prev.map(match =>
      match.id === matchId ? { ...match, status } : match
    ));
  }, []);

  const handleMatchDeleted = useCallback((matchId: string) => {
    setMatches(prev => prev.filter(match => match.id !== matchId));
  }, []);

  const handleRunAutoMatch = async () => {
    if (!companyId || !sessionId || runningAutoMatch) return;

    try {
      setRunningAutoMatch(true);
      toast.loading('Running auto-match algorithm...', { id: 'auto-match' });

      // Call the auto-match service
      const result = await reconciliationService.performAutoMatch(companyId, sessionId);

      // Update the matches list
      const updatedMatches = await reconciliationService.listMatches(companyId, sessionId);
      setMatches(updatedMatches);

      // Update the session with the new match ratio
      const updatedSession = await reconciliationService.getSession(companyId, sessionId);
      if (updatedSession) {
        setSession(updatedSession);
      }

      toast.success(
        `Auto-match complete! Found ${result.matches.length} matches (${Math.round(result.matchRatio * 100)}% match rate)`,
        { id: 'auto-match' }
      );
    } catch (error) {
      console.error('Failed to run auto-match', error);
      toast.error('Failed to run auto-match algorithm', { id: 'auto-match' });
    } finally {
      setRunningAutoMatch(false);
    }
  };

  const loadWorkspace = async (showSpinner = true) => {
    if (!companyId || !sessionId) return;

    try {
      if (showSpinner) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [sessionData, matchData, adjustmentData] = await Promise.all([
        reconciliationService.getSession(companyId, sessionId),
        reconciliationService.listMatches(companyId, sessionId),
        reconciliationService.listAdjustments(companyId, sessionId),
      ]);

      if (!sessionData) {
        toast.error('Reconciliation session not found');
        router.push(`/companies/${companyId}/financial-dashboard`);
        return;
      }

      setSession(sessionData);
      setMatches(matchData);
      setAdjustments(adjustmentData);

      if (sessionData.metadata?.statementId) {
        const statementData = await getBankStatement(sessionData.metadata.statementId as string);
        if (statementData) {
          setBankStatement(statementData);
          setBankTransactions(statementData.transactions || []);
        } else {
          setBankStatement(null);
          setBankTransactions([]);
        }
      } else {
        setBankStatement(null);
        setBankTransactions([]);
      }

      const ledgerData = await reconciliationService.listLedgerEntries(companyId, sessionData.bankAccountId, {
        periodStart: sessionData.periodStart,
        periodEnd: sessionData.periodEnd,
      });
      setLedgerEntries(ledgerData);
    } catch (error) {
      console.error('Failed to load reconciliation workspace', error);
      toast.error('Unable to load reconciliation session');
    } finally {
      if (showSpinner) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    loadWorkspace(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, sessionId]);

  const summary = useMemo(() => {
    const matchedBankIds = new Set(matches.map((match) => match.bankTransactionId));
    const matchedLedgerIds = new Set(matches.map((match) => match.ledgerTransactionId));

    const unmatchedBankCount = bankTransactions.filter((transaction) =>
      !matchedBankIds.has(getBankTransactionKey(transaction))
    ).length;

    const unmatchedLedgerCount = ledgerEntries.filter((entry) =>
      !matchedLedgerIds.has(entry.id)
    ).length;

    return {
      totalMatches: matches.length,
      confirmedMatches: matches.filter((match) => match.status === 'confirmed').length,
      suggestedMatches: matches.filter((match) => match.status === 'suggested').length,
      rejectedMatches: matches.filter((match) => match.status === 'rejected').length,
      totalAdjustments: adjustments.length,
      unmatchedBankCount,
      unmatchedLedgerCount,
    };
  }, [matches, adjustments, bankTransactions, ledgerEntries]);

  const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    draft: 'secondary',
    in_progress: 'warning',
    completed: 'success',
    archived: 'secondary',
  };

  const statusLabel: Record<string, string> = {
    draft: 'Draft',
    in_progress: 'In progress',
    completed: 'Completed',
    archived: 'Archived',
  };

  const renderContent = () => {
    if (loading || !session) {
      return (
        <FadeIn>
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <SkeletonCard />
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonList items={3} />
            </div>
          </div>
        </FadeIn>
      );
    }

    return (
      <FadeIn className="space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="group relative overflow-hidden border border-white/60 bg-gradient-to-br from-white via-white to-indigo-50/30 shadow-xl shadow-indigo-100/20 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-200/30">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardContent className="relative space-y-6 p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 p-2">
                      <Banknote className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Reconciliation session</p>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-900">{session.bankAccountName || 'Bank account'}</h2>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="h-4 w-4" />
                    <span>{session.periodStart} → {session.periodEnd}</span>
                  </div>
                </div>
                <Badge variant={statusVariant[session.status] ?? 'secondary'} className="capitalize px-3 py-1 text-sm font-medium shadow-sm">
                  {statusLabel[session.status] ?? session.status}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SummaryTile
                  icon={<DollarSign className="h-5 w-5" />}
                  label="Opening balance"
                  value={formatCurrency(session.openingBalance)}
                />
                <SummaryTile
                  icon={<TrendingUp className="h-5 w-5" />}
                  label="Closing balance"
                  value={formatCurrency(session.closingBalance)}
                />
                <SummaryTile
                  icon={<Target className="h-5 w-5" />}
                  label="Auto-match ratio"
                  value={`${Math.round(session.autoMatchRatio)}%`}
                />
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-inner">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Statement Source</p>
                    <p className="text-sm text-slate-600">
                      Generated from statement <span className="font-semibold text-indigo-700">{bankStatement?.fileName ?? session.metadata?.statementId ?? '—'}</span>. Use the panels below to confirm matches, add adjustments, and finalize the reconciliation.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border border-white/60 bg-gradient-to-br from-white via-white to-emerald-50/30 shadow-xl shadow-emerald-100/20 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-200/30">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-green-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <CardContent className="relative p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 p-2">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Match Progress</h3>
              </div>
              <ProgressOverview summary={summary} />
              <div className="flex items-center justify-between pt-4 border-t border-emerald-100">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  <span>{summary.totalMatches} total matches</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={runningAutoMatch || refreshing || bankTransactions.length === 0}
                    onClick={handleRunAutoMatch}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
                  >
                    <Sparkles className={cn('mr-2 h-4 w-4', runningAutoMatch && 'animate-pulse')} />
                    {runningAutoMatch ? 'Matching...' : 'Run Auto-Match'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={refreshing}
                    onClick={() => loadWorkspace(false)}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  >
                    <RefreshCw className={cn('mr-2 h-4 w-4', refreshing && 'animate-spin')} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manual Matching Interface */}
        <ManualMatchingInterface
          companyId={companyId}
          sessionId={sessionId}
          bankTransactions={bankTransactions}
          ledgerEntries={ledgerEntries}
          existingMatches={matches}
          onMatchCreated={handleMatchCreated}
          onMatchUpdated={handleMatchUpdated}
          onMatchDeleted={handleMatchDeleted}
          onRefresh={() => loadWorkspace(false)}
          loading={refreshing}
        />

        {/* Adjustments Section */}
        <Card className="group relative overflow-hidden border border-amber-200/60 bg-gradient-to-br from-white via-amber-50/30 to-orange-100/40 shadow-xl shadow-amber-100/30 backdrop-blur-sm transition-all duration-300 hover:shadow-2xl hover:shadow-amber-200/40">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="absolute -right-8 -top-8 h-16 w-16 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 opacity-60" />
          <CardContent className="relative p-8 space-y-6">
            <SectionHeader
              title="Adjustments"
              description="Record fees, interest, or timing differences discovered during reconciliation."
              icon={<AlertTriangle className="h-5 w-5" />}
              theme="adjustments"
            />

            {adjustments.length === 0 ? (
              <EmptyState
                icon={<AlertTriangle className="h-12 w-12 text-amber-300" />}
                title="No adjustments"
                description="Add adjustments from the workspace actions when discrepancies require a journal entry."
                theme="adjustments"
              />
            ) : (
              <AdjustmentList adjustments={adjustments} />
            )}
          </CardContent>
        </Card>
      </FadeIn>
    );
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50">
        {/* Background pattern overlay */}
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(99_102_241_/_0.05)_1px,transparent_0)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative">
          <PageHeader
            title="Bank reconciliation"
            subtitle="Review statement transactions, confirm matches, and post adjustments."
            backHref={`/companies/${companyId}/financial-dashboard`}
            breadcrumbs={[
              { label: 'Companies', href: '/companies' },
              { label: session?.bankAccountName || 'Bank account' },
              { label: 'Reconciliation' },
            ]}
            actions={
              <Button variant="outline" size="sm" onClick={() => router.push('/bank-statements')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to statements
              </Button>
            }
          />

          <main className="max-w-7xl mx-auto px-4 pb-16 sm:px-6 lg:px-8 space-y-8">
            {renderContent()}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}

interface SummaryTileProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function SummaryTile({ icon, label, value }: SummaryTileProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-br from-white via-white to-blue-50/30 p-4 shadow-lg shadow-blue-100/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-blue-200/40 hover:-translate-y-0.5">
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg">{icon}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-lg font-bold text-slate-900">{value}</p>
        </div>
      </div>
      <div className="absolute -right-4 -top-4 h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400/20 to-blue-500/20 opacity-40" />
    </div>
  );
}

interface ProgressOverviewProps {
  summary: {
    totalMatches: number;
    confirmedMatches: number;
    suggestedMatches: number;
    rejectedMatches: number;
    totalAdjustments: number;
    unmatchedBankCount: number;
    unmatchedLedgerCount: number;
  };
}

function ProgressOverview({ summary }: ProgressOverviewProps) {
  const progressItems = [
    {
      label: 'Confirmed',
      value: summary.confirmedMatches,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      icon: <CheckCircle2 className="h-4 w-4" />
    },
    {
      label: 'Suggested',
      value: summary.suggestedMatches,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: <Clock className="h-4 w-4" />
    },
    {
      label: 'Rejected',
      value: summary.rejectedMatches,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      label: 'Adjustments',
      value: summary.totalAdjustments,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      icon: <AlertTriangle className="h-4 w-4" />
    },
    {
      label: 'Unmatched bank',
      value: summary.unmatchedBankCount,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      icon: <Banknote className="h-4 w-4" />
    },
    {
      label: 'Unmatched ledger',
      value: summary.unmatchedLedgerCount,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      icon: <BookOpen className="h-4 w-4" />
    },
  ];

  return (
    <div className="space-y-3">
      {progressItems.map((item, index) => (
        <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-white to-slate-50/50 border border-slate-100 transition-all duration-200 hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className={cn('rounded-lg p-1.5', item.bgColor, item.color)}>
              {item.icon}
            </div>
            <span className="font-medium text-slate-700">{item.label}</span>
          </div>
          <span className={cn('text-lg font-bold', item.color)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  theme?: 'bank' | 'ledger' | 'matches' | 'adjustments';
}

function SectionHeader({ title, description, icon, theme = 'bank' }: SectionHeaderProps) {
  const themeStyles = {
    bank: 'bg-slate-100 text-slate-700 border-slate-200',
    ledger: 'bg-slate-100 text-slate-700 border-slate-200',
    matches: 'bg-slate-100 text-slate-700 border-slate-200',
    adjustments: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="flex items-start gap-4">
      <span className={cn('flex h-12 w-12 items-center justify-center rounded-xl border shadow-sm', themeStyles[theme])}>
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="text-xl font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      </div>
    </div>
  );
}


interface AdjustmentListProps {
  adjustments: ReconciliationAdjustment[];
}

function AdjustmentList({ adjustments }: AdjustmentListProps) {
  return (
    <StaggerList className="space-y-4">
      {adjustments.map((adjustment, index) => (
        <FadeIn key={adjustment.id} delay={index * 0.03}>
          <div className="group relative overflow-hidden rounded-2xl border border-amber-100/60 bg-gradient-to-br from-white to-amber-50/30 p-5 shadow-lg shadow-amber-100/30 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-amber-200/40 hover:-translate-y-0.5">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="relative">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 p-1.5">
                      <AlertTriangle className="h-4 w-4 text-white" />
                    </div>
                    <p className="text-base font-bold text-slate-900">{adjustment.description}</p>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {adjustment.adjustmentType} · Account {adjustment.ledgerAccountCode ?? adjustment.ledgerAccountId}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-900">{formatCurrency(adjustment.amount)}</span>
                </div>
              </div>
              <div className="flex items-center text-sm text-slate-500">
                <Clock className="h-4 w-4 mr-1.5 text-amber-500" />
                <span>Created {adjustment.createdAt.toLocaleDateString?.() ?? '—'}</span>
              </div>
            </div>
            <div className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/20 opacity-60" />
          </div>
        </FadeIn>
      ))}
    </StaggerList>
  );
}


function getBankTransactionKey(transaction: BankTransaction): string {
  if (transaction.id) return transaction.id;
  return `${transaction.date}-${transaction.description}-${transaction.balance}`;
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  theme?: 'bank' | 'ledger' | 'matches' | 'adjustments';
}

function EmptyState({ icon, title, description, theme = 'bank' }: EmptyStateProps) {
  const themeStyles = {
    bank: 'border-blue-200 bg-blue-50/50',
    ledger: 'border-emerald-200 bg-emerald-50/50',
    matches: 'border-violet-200 bg-violet-50/50',
    adjustments: 'border-amber-200 bg-amber-50/50',
  };

  return (
    <div className={cn(
      'flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed py-12 text-center transition-all duration-300 hover:shadow-md',
      themeStyles[theme]
    )}>
      <span className="opacity-60">{icon}</span>
      <div className="space-y-2">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <p className="text-sm text-slate-600 max-w-xs leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
