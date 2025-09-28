'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CashFlowMetrics } from '@/types/accounting/cash-flow';
import {
  Clock,
  TrendingDown,
  AlertTriangle,
  Target,
  Activity,
  BarChart3,
  Calendar,
  DollarSign
} from 'lucide-react';

interface LiquidityMetricsProps {
  metrics: CashFlowMetrics;
  baseCurrency: string;
  isLoading?: boolean;
}

export function LiquidityMetrics({
  metrics,
  baseCurrency,
  isLoading = false
}: LiquidityMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-32"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: baseCurrency,
      notation: Math.abs(amount) > 1000000 ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDays = (days: number): string => {
    if (days === Infinity || days < 0) return 'N/A';
    if (days > 365) return `${Math.round(days / 365)} years`;
    if (days > 30) return `${Math.round(days / 30)} months`;
    return `${Math.round(days)} days`;
  };

  const getCashRunwayStatus = (days: number): { color: string; label: string; progress: number } => {
    if (days < 0 || days === Infinity) return { color: 'bg-gray-500', label: 'Unknown', progress: 0 };
    if (days < 30) return { color: 'bg-red-500', label: 'Critical', progress: 25 };
    if (days < 60) return { color: 'bg-orange-500', label: 'Warning', progress: 50 };
    if (days < 90) return { color: 'bg-yellow-500', label: 'Caution', progress: 75 };
    return { color: 'bg-green-500', label: 'Healthy', progress: 100 };
  };

  const getBurnRateStatus = (burnRate: number, inflow: number) => {
    const netBurn = burnRate - inflow;
    if (netBurn <= 0) return { color: 'text-green-600', label: 'Positive', trend: 'up' };
    if (netBurn < inflow * 0.1) return { color: 'text-green-600', label: 'Low', trend: 'stable' };
    if (netBurn < inflow * 0.3) return { color: 'text-yellow-600', label: 'Moderate', trend: 'down' };
    return { color: 'text-red-600', label: 'High', trend: 'down' };
  };

  const getVarianceRiskLevel = (variance: number, balance: number) => {
    const riskRatio = balance > 0 ? variance / balance : 1;
    if (riskRatio < 0.1) return { color: 'text-green-600', label: 'Low Risk' };
    if (riskRatio < 0.2) return { color: 'text-yellow-600', label: 'Medium Risk' };
    return { color: 'text-red-600', label: 'High Risk' };
  };

  const runwayStatus = getCashRunwayStatus(metrics.projectedCashRunway);
  const burnRateStatus = getBurnRateStatus(metrics.averageDailyBurnRate, metrics.averageDailyInflow);
  const varianceRisk = getVarianceRiskLevel(metrics.cashVarianceRisk, metrics.currentCashBalance);

  return (
    <div className="space-y-6">
      {/* Primary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash Runway */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Cash Runway</span>
              </div>
              <Badge variant={runwayStatus.color === 'bg-red-500' ? 'destructive' : 'secondary'}>
                {runwayStatus.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {formatDays(metrics.projectedCashRunway)}
              </p>
              <Progress value={runwayStatus.progress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                Until cash depleted at current burn rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Daily Burn Rate */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Daily Burn Rate</span>
              </div>
              <Badge variant="outline" className={burnRateStatus.color}>
                {burnRateStatus.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.averageDailyBurnRate)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Net: {formatCurrency(metrics.averageDailyBurnRate - metrics.averageDailyInflow)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Minimum Balance */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Minimum Balance</span>
              </div>
              {metrics.minimumCashBalance < 0 && (
                <Badge variant="destructive">Negative</Badge>
              )}
            </div>
            <div className="space-y-2">
              <p className={`text-2xl font-bold ${metrics.minimumCashBalance < 0 ? 'text-red-600' : ''}`}>
                {formatCurrency(metrics.minimumCashBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                On {metrics.minimumCashDate.toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variance Risk */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Variance Risk</span>
              </div>
              <Badge variant="outline" className={varianceRisk.color}>
                {varianceRisk.label}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold">
                {formatCurrency(metrics.cashVarianceRisk)}
              </p>
              <p className="text-xs text-muted-foreground">
                Standard deviation of cash flows
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cash Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Cash</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(metrics.currentCashBalance)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Working Capital</p>
                <p className="text-lg font-semibold">
                  {formatCurrency(metrics.workingCapital)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Inflow Average</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(metrics.averageDailyInflow)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Daily Outflow Average</span>
                <span className="font-medium text-red-600">
                  {formatCurrency(metrics.averageDailyBurnRate)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-sm font-medium">Net Daily Flow</span>
                <span className={`font-semibold ${
                  metrics.averageDailyInflow - metrics.averageDailyBurnRate >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {formatCurrency(metrics.averageDailyInflow - metrics.averageDailyBurnRate)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Indicators */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Threshold Breach Alert */}
            {metrics.breachesCashThreshold && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800">Threshold Breach</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  Cash balance will fall below minimum threshold
                  {metrics.thresholdBreachDate && (
                    <> on {metrics.thresholdBreachDate.toLocaleDateString()}</>
                  )}
                </p>
              </div>
            )}

            {/* Negative Cash Days */}
            {metrics.daysWithNegativeCash > 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Negative Cash Period</span>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  {metrics.daysWithNegativeCash} days with negative cash balance projected
                </p>
              </div>
            )}

            {/* Performance Metrics */}
            {metrics.forecastAccuracy && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Forecast Accuracy</p>
                  <p className="text-lg font-semibold">
                    {(metrics.forecastAccuracy * 100).toFixed(1)}%
                  </p>
                </div>
                {metrics.daysToBreakeven && (
                  <div>
                    <p className="text-sm text-muted-foreground">Days to Breakeven</p>
                    <p className="text-lg font-semibold">
                      {formatDays(metrics.daysToBreakeven)}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Growth Rate */}
            {metrics.projectedGrowthRate && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Projected Growth Rate</span>
                <span className={`font-medium ${
                  metrics.projectedGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {(metrics.projectedGrowthRate * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      {metrics.categoryBreakdown && metrics.categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cash Flow by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.categoryBreakdown
                .sort((a, b) => Math.abs(b.netFlow) - Math.abs(a.netFlow))
                .slice(0, 8) // Show top 8 categories
                .map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium capitalize">
                          {category.category.replace('_', ' ')}
                        </span>
                        <span className={`text-sm font-semibold ${
                          category.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(category.netFlow)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>In: {formatCurrency(category.totalInflows)}</span>
                        <span>Out: {formatCurrency(category.totalOutflows)}</span>
                        <span>Items: {category.itemCount}</span>
                        <span>Confidence: {(category.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}