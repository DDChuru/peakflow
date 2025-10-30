'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  ListFilter,
  ArrowUpDown,
} from 'lucide-react';

import { BankTransaction } from '@/types/bank-statement';
import type { SupportedCurrency } from '@/types/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/motion';
import { cn } from '@/lib/utils';

interface TransactionTableProps {
  transactions: BankTransaction[];
  currency: SupportedCurrency;
  showFilters?: boolean;
}

type SortField = 'date' | 'amount' | 'balance';

type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];

export default function TransactionTable({ transactions, currency, showFilters = true }: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const categories = useMemo(() => {
    const cats = new Set(transactions.map((t) => t.category || 'Other'));
    return Array.from(cats).sort();
  }, [transactions]);

  const types = useMemo(() => {
    const typs = new Set(transactions.map((t) => t.type || 'other'));
    return Array.from(typs).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = transactions.filter((transaction) => {
      const matchesSearch = normalizedSearch
        ? transaction.description.toLowerCase().includes(normalizedSearch) ||
          transaction.reference?.toLowerCase().includes(normalizedSearch)
        : true;

      const matchesType = typeFilter === 'all' ? true : transaction.type === typeFilter;
      const matchesCategory =
        categoryFilter === 'all' ? true : (transaction.category || 'Other') === categoryFilter;

      return matchesSearch && matchesType && matchesCategory;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'date':
          compareValue = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'amount': {
          const aAmount = (a.credit || 0) - (a.debit || 0);
          const bAmount = (b.credit || 0) - (b.debit || 0);
          compareValue = aAmount - bAmount;
          break;
        }
        case 'balance':
          compareValue = (a.balance || 0) - (b.balance || 0);
          break;
        default:
          compareValue = 0;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [transactions, searchTerm, typeFilter, categoryFilter, sortBy, sortOrder]);

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'date' ? 'desc' : 'asc');
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  const matchRatio = transactions.length > 0 ? (filteredTransactions.length / transactions.length) * 100 : 0;

  return (
    <section className="space-y-6">
      {showFilters && (
        <FadeIn>
          <Card className="border-gray-100 bg-white/80">
            <CardHeader className="pb-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">Filter transactions</CardTitle>
                  <CardDescription>
                    Refine the transaction list by description, category, or transaction type.
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={resetFilters} disabled={!searchTerm && typeFilter === 'all' && categoryFilter === 'all'}>
                  Clear filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-500">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by description or reference"
                      className="rounded-2xl border-gray-200 bg-white pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-500">Type</label>
                  <div className="relative">
                    <ListFilter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">All types</option>
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {formatLabel(type)}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">▾</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase text-gray-500">Category</label>
                  <div className="relative">
                    <ListFilter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-gray-700 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    >
                      <option value="all">All categories</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">▾</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      <FadeIn>
        <Card className="border-gray-100 bg-white/90">
          <CardHeader className="pb-0">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Transaction history</CardTitle>
                <CardDescription>
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                  {transactions.length > 0 && ` (${matchRatio.toFixed(0)}% match).`}
                </CardDescription>
              </div>
              {transactions.length > 0 && filteredTransactions.length !== transactions.length && (
                <Badge variant="secondary" size="sm">
                  Filters active
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/80">
                    <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <SortableHeader label="Date" active={sortBy === 'date'} order={sortOrder} onClick={() => toggleSort('date')} />
                      <th className="px-6 py-3">Description</th>
                      <th className="px-6 py-3">Reference</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Category</th>
                      <SortableHeader
                        label="Amount"
                        className="text-right"
                        active={sortBy === 'amount'}
                        order={sortOrder}
                        onClick={() => toggleSort('amount')}
                      />
                      <SortableHeader
                        label="Balance"
                        className="text-right"
                        active={sortBy === 'balance'}
                        order={sortOrder}
                        onClick={() => toggleSort('balance')}
                      />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredTransactions.map((transaction, index) => {
                      const isCredit = (transaction.credit || 0) > 0;
                      const isDebit = (transaction.debit || 0) > 0;
                      const amount = isCredit ? transaction.credit : transaction.debit;
                      return (
                        <tr
                          key={`${transaction.date}-${transaction.description}-${index}`}
                          className="transition-colors hover:bg-indigo-50/30"
                        >
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="max-w-xs px-6 py-4 text-sm font-medium text-gray-900">
                            <div className="truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {transaction.reference ?? '—'}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant={typeVariant(transaction.type)} size="sm" className="capitalize">
                              {transaction.type ? formatLabel(transaction.type) : 'Other'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <Badge variant={categoryVariant(transaction.category)} size="sm" className="capitalize">
                              {transaction.category || 'Other'}
                            </Badge>
                          </td>
                          <td
                            className={cn(
                              'whitespace-nowrap px-6 py-4 text-right text-sm font-semibold',
                              isCredit && 'text-emerald-600',
                              isDebit && 'text-rose-600'
                            )}
                          >
                            {amount ? formatCurrency(amount, currency) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-gray-700">
                            {formatCurrency(transaction.balance, currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredTransactions.length === 0 && (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-10 text-center text-sm text-gray-600">
                No transactions match your filters. Adjust the filters above to widen your search.
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </section>
  );
}

function SortableHeader({
  label,
  className,
  active,
  order,
  onClick,
}: {
  label: string;
  className?: string;
  active: boolean;
  order: 'asc' | 'desc';
  onClick: () => void;
}) {
  return (
    <th className={cn('px-6 py-3', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider transition-colors',
          active ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'
        )}
      >
        {label}
        <ArrowUpDown className={cn('h-3.5 w-3.5 transition-transform', active && order === 'asc' && 'rotate-180')} />
      </button>
    </th>
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

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatLabel(value: string) {
  if (!value) return 'Other';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function typeVariant(type?: BankTransaction['type']): BadgeVariant {
  switch (type) {
    case 'deposit':
      return 'success';
    case 'withdrawal':
      return 'destructive';
    case 'interest':
      return 'secondary';
    case 'fee':
      return 'warning';
    default:
      return 'default';
  }
}

function categoryVariant(category?: string | null): BadgeVariant {
  if (!category) return 'secondary';
  const normalized = category.toLowerCase();
  if (normalized.includes('fee')) return 'destructive';
  if (normalized.includes('payroll')) return 'warning';
  if (normalized.includes('sale') || normalized.includes('income')) return 'success';
  return 'outline';
}
