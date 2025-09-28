'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Calculator,
  FileText,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn } from '@/components/ui/motion';
import { cn, formatCurrency } from '@/lib/utils';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import type { ReconciliationAdjustment } from '@/types/accounting/reconciliation';

interface AdjustmentSummaryProps {
  companyId: string;
  sessionId: string;
  currency: string;
  className?: string;
}

interface AdjustmentSummaryData {
  totalAdjustments: number;
  adjustmentsByType: Record<string, { count: number; amount: number }>;
  netAdjustmentAmount: number;
  projectedBalanceDifference: number;
  balanceIsValid: boolean;
  adjustments: ReconciliationAdjustment[];
}

export default function AdjustmentSummary({
  companyId,
  sessionId,
  currency,
  className,
}: AdjustmentSummaryProps) {
  const [data, setData] = useState<AdjustmentSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummaryData();
  }, [companyId, sessionId]);

  const loadSummaryData = async () => {
    try {
      setLoading(true);

      // Load adjustments
      const adjustments = await reconciliationService.listAdjustments(companyId, sessionId);

      // Calculate summary data
      const totalAdjustments = adjustments.length;
      const netAdjustmentAmount = adjustments.reduce((sum, adj) => sum + adj.amount, 0);

      // Group by type
      const adjustmentsByType = adjustments.reduce((acc, adj) => {
        if (!acc[adj.adjustmentType]) {
          acc[adj.adjustmentType] = { count: 0, amount: 0 };
        }
        acc[adj.adjustmentType].count++;
        acc[adj.adjustmentType].amount += adj.amount;
        return acc;
      }, {} as Record<string, { count: number; amount: number }>);

      // Validate balance
      const balanceValidation = await reconciliationService.validateAdjustmentBalance(
        companyId,
        sessionId,
        []
      );

      setData({
        totalAdjustments,
        adjustmentsByType,
        netAdjustmentAmount,
        projectedBalanceDifference: balanceValidation.projectedDifference,
        balanceIsValid: balanceValidation.isValid,
        adjustments,
      });
    } catch (error) {
      console.error('Failed to load adjustment summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'fee': return 'Bank Fees';
      case 'interest': return 'Interest';
      case 'timing': return 'Timing Differences';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'fee': return 'bg-red-100 text-red-800';
      case 'interest': return 'bg-green-100 text-green-800';
      case 'timing': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Calculator className="h-6 w-6 animate-pulse text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <FadeIn>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Adjustment Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Overall Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold">{data.totalAdjustments}</div>
              <div className="text-sm text-gray-600">Total Adjustments</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className={cn(
                'text-2xl font-bold',
                data.netAdjustmentAmount >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {data.netAdjustmentAmount >= 0 ? (
                  <TrendingUp className="h-5 w-5 inline mr-1" />
                ) : (
                  <TrendingDown className="h-5 w-5 inline mr-1" />
                )}
                {formatCurrency(Math.abs(data.netAdjustmentAmount), currency)}
              </div>
              <div className="text-sm text-gray-600">Net Amount</div>
            </div>
          </div>

          {/* Balance Status */}
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg border',
            data.balanceIsValid
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          )}>
            {data.balanceIsValid ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {data.balanceIsValid
                ? 'Reconciliation is balanced'
                : `Remaining difference: ${formatCurrency(Math.abs(data.projectedBalanceDifference), currency)}`
              }
            </span>
          </div>

          {/* Breakdown by Type */}
          {Object.keys(data.adjustmentsByType).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Breakdown by Type</h4>
              <div className="space-y-2">
                {Object.entries(data.adjustmentsByType).map(([type, summary]) => (
                  <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Badge className={getAdjustmentTypeColor(type)}>
                        {getAdjustmentTypeLabel(type)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {summary.count} item{summary.count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm font-medium">
                      {formatCurrency(summary.amount, currency)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Adjustments */}
          {data.adjustments.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Recent Adjustments</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {data.adjustments.slice(-3).reverse().map((adjustment) => (
                  <div key={adjustment.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="font-medium truncate">{adjustment.description}</div>
                      <div className="text-gray-500">
                        {adjustment.createdAt.toLocaleDateString()} • {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(adjustment.amount, currency)}
                      </div>
                      {adjustment.reversalJournalId && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                          Reversed
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {data.totalAdjustments === 0 && (
            <div className="text-center py-4 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No adjustments have been created yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}