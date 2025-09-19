'use client';

import React from 'react';
import { BankStatementSummary } from '@/types/bank-statement';

interface SummaryCardsProps {
  summary: BankStatementSummary;
  additionalStats?: {
    totalIncome: number;
    totalExpenses: number;
    netCashFlow: number;
    averageBalance: number;
  };
}

export default function SummaryCards({ summary, additionalStats }: SummaryCardsProps) {
  const formatCurrency = (amount: number | undefined | null) => {
    // Handle NaN, undefined, null, or invalid numbers
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0.00';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const cards = [
    {
      title: 'Opening Balance',
      value: formatCurrency(summary.openingBalance),
      icon: '💰',
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      title: 'Closing Balance',
      value: formatCurrency(summary.closingBalance),
      icon: '💵',
      color: 'bg-indigo-50 text-indigo-700',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Total Deposits',
      value: formatCurrency(summary.totalDeposits),
      icon: '📈',
      color: 'bg-green-50 text-green-700',
      borderColor: 'border-green-200',
      subtitle: `${summary.transactionCount} transactions`
    },
    {
      title: 'Total Withdrawals',
      value: formatCurrency(summary.totalWithdrawals),
      icon: '📉',
      color: 'bg-red-50 text-red-700',
      borderColor: 'border-red-200'
    },
    {
      title: 'Bank Fees',
      value: formatCurrency(summary.totalFees),
      icon: '🏦',
      color: 'bg-yellow-50 text-yellow-700',
      borderColor: 'border-yellow-200'
    },
    {
      title: 'Interest Earned',
      value: formatCurrency(summary.interestEarned),
      icon: '💹',
      color: 'bg-purple-50 text-purple-700',
      borderColor: 'border-purple-200'
    }
  ];

  // Add additional stats if provided
  const additionalCards = additionalStats ? [
    {
      title: 'Net Cash Flow',
      value: formatCurrency(additionalStats.netCashFlow),
      icon: '💸',
      color: additionalStats.netCashFlow >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
      borderColor: additionalStats.netCashFlow >= 0 ? 'border-green-200' : 'border-red-200',
      subtitle: additionalStats.netCashFlow >= 0 ? 'Positive' : 'Negative'
    },
    {
      title: 'Average Balance',
      value: formatCurrency(additionalStats.averageBalance),
      icon: '📊',
      color: 'bg-gray-50 text-gray-700',
      borderColor: 'border-gray-200'
    }
  ] : [];

  const allCards = [...cards, ...additionalCards];

  return (
    <div>
      {/* Statement Period */}
      {summary.statementPeriod && (
        <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500 mb-1">Statement Period</h3>
          <p className="text-lg font-semibold text-gray-900">
            {formatDate(summary.statementPeriod.from)} - {formatDate(summary.statementPeriod.to)}
          </p>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {allCards.map((card, index) => (
          <div
            key={index}
            className={`${card.color} p-4 rounded-lg border ${card.borderColor} hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium opacity-80">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-xs opacity-70 mt-1">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <span className="text-2xl opacity-50">{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Balance Change Indicator */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Balance Change</h3>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {formatCurrency((summary.closingBalance || 0) - (summary.openingBalance || 0))}
            </p>
          </div>
          <div className={`flex items-center ${
            (summary.closingBalance || 0) >= (summary.openingBalance || 0) ? 'text-green-600' : 'text-red-600'
          }`}>
            {(summary.closingBalance || 0) >= (summary.openingBalance || 0) ? (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
            <span className="ml-2 text-lg font-semibold">
              {summary.openingBalance && summary.openingBalance !== 0
                ? `${((Math.abs((summary.closingBalance || 0) - (summary.openingBalance || 0)) / Math.abs(summary.openingBalance)) * 100).toFixed(1)}%`
                : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}