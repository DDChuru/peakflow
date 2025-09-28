'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { DailyCashForecast, CashFlowAlert } from '@/types/accounting/cash-flow';
import { AlertTriangle, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface CashFlowChartProps {
  dailyForecasts: DailyCashForecast[];
  baseCurrency: string;
  showVariance?: boolean;
  showInflows?: boolean;
  showOutflows?: boolean;
  chartType?: 'line' | 'area' | 'bar';
  timeRange?: 'week' | 'month' | 'quarter' | 'all';
  minimumCashThreshold?: number;
}

export function CashFlowChart({
  dailyForecasts,
  baseCurrency,
  showVariance = true,
  showInflows = false,
  showOutflows = false,
  chartType = 'area',
  timeRange = 'all',
  minimumCashThreshold = 10000
}: CashFlowChartProps) {
  // Filter data based on time range
  const filteredData = useMemo(() => {
    const now = new Date();
    let daysToShow = dailyForecasts.length;

    switch (timeRange) {
      case 'week':
        daysToShow = 7;
        break;
      case 'month':
        daysToShow = 30;
        break;
      case 'quarter':
        daysToShow = 90;
        break;
      default:
        daysToShow = dailyForecasts.length;
    }

    return dailyForecasts.slice(0, daysToShow);
  }, [dailyForecasts, timeRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return filteredData.map((forecast, index) => ({
      date: forecast.date.toISOString().split('T')[0],
      displayDate: forecast.date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      week: `W${forecast.weekNumber}`,
      closingBalance: forecast.closingBalance,
      openingBalance: forecast.openingBalance,
      inflows: forecast.totalInflows,
      outflows: forecast.totalOutflows,
      netFlow: forecast.netFlow,
      confidence: forecast.confidenceLevel,
      varianceLow: showVariance ? forecast.varianceRange.low + forecast.openingBalance : null,
      varianceHigh: showVariance ? forecast.varianceRange.high + forecast.openingBalance : null,
      hasAlerts: forecast.alerts.length > 0,
      criticalAlerts: forecast.alerts.filter(a => a.severity === 'critical').length,
      dayIndex: index
    }));
  }, [filteredData, showVariance]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (chartData.length === 0) return null;

    const startBalance = chartData[0].openingBalance;
    const endBalance = chartData[chartData.length - 1].closingBalance;
    const totalInflows = chartData.reduce((sum, d) => sum + d.inflows, 0);
    const totalOutflows = chartData.reduce((sum, d) => sum + d.outflows, 0);
    const minBalance = Math.min(...chartData.map(d => d.closingBalance));
    const maxBalance = Math.max(...chartData.map(d => d.closingBalance));
    const daysWithAlerts = chartData.filter(d => d.hasAlerts).length;
    const avgConfidence = chartData.reduce((sum, d) => sum + d.confidence, 0) / chartData.length;

    return {
      startBalance,
      endBalance,
      totalInflows,
      totalOutflows,
      netFlow: totalInflows - totalOutflows,
      minBalance,
      maxBalance,
      daysWithAlerts,
      avgConfidence,
      trend: endBalance > startBalance ? 'positive' : endBalance < startBalance ? 'negative' : 'stable'
    };
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.displayDate}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">
              Closing Balance: {formatCurrency(data.closingBalance, baseCurrency)}
            </p>
            {showInflows && (
              <p className="text-green-600">
                Inflows: {formatCurrency(data.inflows, baseCurrency)}
              </p>
            )}
            {showOutflows && (
              <p className="text-red-600">
                Outflows: {formatCurrency(data.outflows, baseCurrency)}
              </p>
            )}
            <p className="text-gray-600">
              Net Flow: {formatCurrency(data.netFlow, baseCurrency)}
            </p>
            <p className="text-gray-500">
              Confidence: {(data.confidence * 100).toFixed(0)}%
            </p>
            {data.hasAlerts && (
              <p className="text-orange-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {data.criticalAlerts > 0 ? 'Critical Alert' : 'Alert'}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Format currency for display
  const formatCurrency = (amount: number, currency: string): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      notation: amount > 1000000 ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            No forecast data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Cash Flow Forecast
            {summaryMetrics && (
              <Badge variant={summaryMetrics.trend === 'positive' ? 'default' :
                            summaryMetrics.trend === 'negative' ? 'destructive' : 'secondary'}>
                {summaryMetrics.trend === 'positive' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : summaryMetrics.trend === 'negative' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : null}
                {summaryMetrics.trend}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Export
            </Button>
            <Button variant="outline" size="sm">
              Settings
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Net Flow</p>
              <p className={`font-semibold ${summaryMetrics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summaryMetrics.netFlow, baseCurrency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Minimum Balance</p>
              <p className={`font-semibold ${summaryMetrics.minBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(summaryMetrics.minBalance, baseCurrency)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className="font-semibold">
                {(summaryMetrics.avgConfidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Alert Days</p>
              <p className={`font-semibold ${summaryMetrics.daysWithAlerts > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {summaryMetrics.daysWithAlerts}
              </p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                />
                <Tooltip content={<CustomTooltip />} />

                {/* Minimum cash threshold line */}
                <ReferenceLine
                  y={minimumCashThreshold}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  label="Min Threshold"
                />

                {/* Variance range */}
                {showVariance && (
                  <Area
                    type="monotone"
                    dataKey="varianceHigh"
                    stackId="variance"
                    stroke="none"
                    fill="#3b82f6"
                    fillOpacity={0.1}
                  />
                )}

                {/* Main cash balance area */}
                <Area
                  type="monotone"
                  dataKey="closingBalance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="#3b82f6"
                  fillOpacity={0.2}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5, fill: '#3b82f6' }}
                />

                {/* Inflows and outflows if enabled */}
                {showInflows && (
                  <Area
                    type="monotone"
                    dataKey="inflows"
                    stroke="#10b981"
                    strokeWidth={1}
                    fill="#10b981"
                    fillOpacity={0.1}
                  />
                )}

                {showOutflows && (
                  <Area
                    type="monotone"
                    dataKey="outflows"
                    stroke="#ef4444"
                    strokeWidth={1}
                    fill="#ef4444"
                    fillOpacity={0.1}
                  />
                )}
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                <ReferenceLine
                  y={minimumCashThreshold}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                />

                <Line
                  type="monotone"
                  dataKey="closingBalance"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Cash Balance"
                />

                {showInflows && (
                  <Line
                    type="monotone"
                    dataKey="inflows"
                    stroke="#10b981"
                    strokeWidth={1}
                    name="Inflows"
                  />
                )}

                {showOutflows && (
                  <Line
                    type="monotone"
                    dataKey="outflows"
                    stroke="#ef4444"
                    strokeWidth={1}
                    name="Outflows"
                  />
                )}
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => formatCurrency(value, baseCurrency)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />

                <Bar dataKey="inflows" fill="#10b981" name="Inflows" />
                <Bar dataKey="outflows" fill="#ef4444" name="Outflows" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Alert indicators */}
        {chartData.some(d => d.hasAlerts) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Forecast Alerts</span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              {chartData.filter(d => d.hasAlerts).length} days have cash flow alerts.
              Review detailed forecast for recommendations.
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Cash Balance</span>
          </div>
          {showVariance && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Variance Range</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 border-2 border-red-500 border-dashed rounded"></div>
            <span>Min Threshold</span>
          </div>
          {showInflows && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>Inflows</span>
            </div>
          )}
          {showOutflows && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>Outflows</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}