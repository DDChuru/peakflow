'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CashPosition } from '@/types/accounting/cash-flow';
import { formatCurrency, formatNumber } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Wallet,
  CreditCard,
  Clock
} from 'lucide-react';

interface CashPositionCardProps {
  cashPosition: CashPosition;
  previousPosition?: CashPosition;
  isLoading?: boolean;
  showBreakdown?: boolean;
}

export function CashPositionCard({
  cashPosition,
  previousPosition,
  isLoading = false,
  showBreakdown = false
}: CashPositionCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Cash Position
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const calculateChange = (current: number, previous?: number) => {
    if (!previous) return null;
    const change = ((current - previous) / previous) * 100;
    return change;
  };

  const cashChange = calculateChange(
    cashPosition.totalCashBalance,
    previousPosition?.totalCashBalance
  );

  const availableChange = calculateChange(
    cashPosition.totalAvailableBalance,
    previousPosition?.totalAvailableBalance
  );

  const formatChange = (change: number | null) => {
    if (change === null) return null;
    const isPositive = change >= 0;
    return {
      value: Math.abs(change),
      isPositive,
      icon: isPositive ? TrendingUp : TrendingDown,
      color: isPositive ? 'text-green-600' : 'text-red-600'
    };
  };

  const cashChangeFormatted = formatChange(cashChange);
  const availableChangeFormatted = formatChange(availableChange);

  const isLowCash = cashPosition.totalAvailableBalance < 10000; // Configurable threshold
  const isPendingHigh = (cashPosition.totalPendingBalance / cashPosition.totalCashBalance) > 0.1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Current Cash Position
          {isLowCash && (
            <Badge variant="destructive" className="ml-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Low Cash
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          As of {new Date(cashPosition.asOf).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total Cash Balance */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Cash</p>
              <p className="text-2xl font-bold">
                {formatCurrency(cashPosition.totalCashBalance, cashPosition.baseCurrency)}
              </p>
            </div>
            {cashChangeFormatted && (
              <div className={`flex items-center gap-1 ${cashChangeFormatted.color}`}>
                <cashChangeFormatted.icon className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {cashChangeFormatted.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Available vs Pending */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-muted-foreground">Available</p>
            </div>
            <p className="text-lg font-semibold text-green-600">
              {formatCurrency(cashPosition.totalAvailableBalance, cashPosition.baseCurrency)}
            </p>
            {availableChangeFormatted && (
              <div className={`flex items-center gap-1 ${availableChangeFormatted.color} mt-1`}>
                <availableChangeFormatted.icon className="h-3 w-3" />
                <span className="text-xs">
                  {availableChangeFormatted.value.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
            </div>
            <p className="text-lg font-semibold text-amber-600">
              {formatCurrency(cashPosition.totalPendingBalance, cashPosition.baseCurrency)}
            </p>
            {isPendingHigh && (
              <Badge variant="outline" className="mt-1 text-xs">
                High Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Account Breakdown */}
        {showBreakdown && cashPosition.accountBreakdown.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Account Breakdown ({cashPosition.accountBreakdown.length} accounts)
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {cashPosition.accountBreakdown.map((account) => (
                  <div key={account.bankAccountId} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{account.bankAccountName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {account.accountType} • {account.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(account.ledgerBalance, account.currency)}
                      </p>
                      {account.availableBalance !== undefined && (
                        <p className="text-xs text-muted-foreground">
                          Available: {formatCurrency(account.availableBalance, account.currency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Currency Breakdown for Multi-Currency */}
        {cashPosition.currencyBreakdown.length > 1 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">
                Currency Breakdown
              </p>
              <div className="space-y-2">
                {cashPosition.currencyBreakdown.map((currency) => (
                  <div key={currency.currency} className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">{currency.currency}</span>
                      <span className="text-muted-foreground ml-2">
                        ({currency.accountCount} accounts)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(currency.totalBalance, currency.currency)}
                      </p>
                      {currency.currency !== cashPosition.baseCurrency && (
                        <p className="text-xs text-muted-foreground">
                          ≈ {formatCurrency(currency.balanceInBaseCurrency, cashPosition.baseCurrency)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Quick Actions */}
        <div className="pt-2">
          <div className="flex gap-2 text-xs">
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              View Accounts
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Bank Transfer
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-muted">
              Reconcile
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function for formatting currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}