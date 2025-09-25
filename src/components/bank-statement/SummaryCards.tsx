'use client';

import React from 'react';
import {
  Banknote,
  Receipt,
  PiggyBank,
  ArrowUpCircle,
  ArrowDownCircle,
  BadgePercent,
  BarChart3,
  CalendarDays,
} from 'lucide-react';

import { BankStatementSummary } from '@/types/bank-statement';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  summary?: BankStatementSummary | null;
  additionalStats?: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    averageBalance: number;
  };
}

const metricTone = {
  positive: 'from-emerald-50 to-emerald-100 text-emerald-700 border-emerald-200',
  negative: 'from-rose-50 to-rose-100 text-rose-700 border-rose-200',
  neutral: 'from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
  muted: 'from-gray-50 to-gray-100 text-gray-700 border-gray-200',
} as const;

type MetricTone = keyof typeof metricTone;

type Metric = {
  title: string;
  value: number | null | undefined;
  icon: React.ReactNode;
  tone: MetricTone;
  helper?: string;
};

export default function SummaryCards({ summary, additionalStats }: SummaryCardsProps) {
  if (!summary) {
    return (
      <FadeIn>
        <Card className="border-dashed border-gray-200 bg-white/80">
          <CardHeader>
            <CardTitle className="text-lg">Summary unavailable</CardTitle>
            <CardDescription>
              This statement does not include balance information. You can still review the transaction list below.
            </CardDescription>
          </CardHeader>
        </Card>
      </FadeIn>
    );
  }

  const balanceDelta = safeNumber(summary.closingBalance) - safeNumber(summary.openingBalance);
  const deltaPercent = safeNumber(summary.openingBalance) !== 0
    ? (balanceDelta / Math.abs(safeNumber(summary.openingBalance))) * 100
    : null;

  const metrics: Metric[] = [
    {
      title: 'Opening balance',
      value: summary.openingBalance,
      icon: <PiggyBank className="h-5 w-5" />,
      tone: 'neutral',
      helper: 'Balance at the beginning of the statement period',
    },
    {
      title: 'Closing balance',
      value: summary.closingBalance,
      icon: <Banknote className="h-5 w-5" />,
      tone: 'positive',
      helper: 'Balance after all movements',
    },
    {
      title: 'Total deposits',
      value: summary.totalDeposits,
      icon: <ArrowUpCircle className="h-5 w-5" />,
      tone: 'positive',
      helper: `${summary.transactionCount} transactions recorded`,
    },
    {
      title: 'Total withdrawals',
      value: summary.totalWithdrawals,
      icon: <ArrowDownCircle className="h-5 w-5" />,
      tone: 'negative',
    },
    {
      title: 'Bank fees',
      value: summary.totalFees,
      icon: <BadgePercent className="h-5 w-5" />,
      tone: 'negative',
    },
    {
      title: 'Interest earned',
      value: summary.interestEarned,
      icon: <Receipt className="h-5 w-5" />,
      tone: 'muted',
    },
  ];

  if (additionalStats) {
    metrics.push(
      {
        title: 'Net cash flow',
        value: additionalStats.netCashFlow,
        icon: <BarChart3 className="h-5 w-5" />,
        tone: additionalStats.netCashFlow >= 0 ? 'positive' : 'negative',
        helper: additionalStats.netCashFlow >= 0 ? 'More cash in than out' : 'Cash outflow exceeds deposits',
      },
      {
        title: 'Average balance',
        value: additionalStats.averageBalance,
        icon: <PiggyBank className="h-5 w-5" />,
        tone: 'muted',
      }
    );
  }

  return (
    <section className="space-y-6">
      <FadeIn>
        <Card className="border-gray-100 bg-white/80">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <Badge variant="secondary" className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="h-4 w-4" />
                Statement period
              </Badge>
              <span className="font-medium text-gray-900">
                {formatDate(summary.statementPeriod?.from)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="font-medium text-gray-900">
                {formatDate(summary.statementPeriod?.to)}
              </span>
            </div>
            <CardDescription className="pt-2">
              Track balances, fees, and earnings at a glance. All amounts are summarised from the processed statement.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <StaggerList className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric, index) => (
                <FadeIn key={metric.title} delay={index * 0.04}>
                  <MetricCard metric={metric} />
                </FadeIn>
              ))}
            </StaggerList>
          </CardContent>
        </Card>
      </FadeIn>

      <FadeIn>
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-wider text-white/70">Balance change</p>
                <p className="text-3xl font-semibold">
                  {formatCurrency(balanceDelta)}
                </p>
                <p className="text-white/80 text-sm">
                  {deltaPercent !== null
                    ? `${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)}% vs opening balance`
                    : 'Not enough data to calculate percentage change'}
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium">
                <span className="block text-xs uppercase tracking-wider text-white/70">Opening → Closing</span>
                <span>{formatCurrency(summary.openingBalance)} → {formatCurrency(summary.closingBalance)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5 shadow-sm transition-all hover:shadow-lg',
        metricTone[metric.tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{metric.title}</p>
          <p className="text-xl font-semibold">{formatCurrency(metric.value)}</p>
          {metric.helper && <p className="text-xs opacity-70">{metric.helper}</p>}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-gray-700">
          {metric.icon}
        </div>
      </div>
    </div>
  );
}

function safeNumber(amount?: number | null) {
  if (amount === undefined || amount === null || Number.isNaN(amount)) {
    return 0;
  }
  return amount;
}

function formatCurrency(amount?: number | null) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(safeNumber(amount));
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

