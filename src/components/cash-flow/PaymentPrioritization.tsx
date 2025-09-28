'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  PaymentPrioritization as PaymentPriorizationData,
  PrioritizedPayment
} from '@/types/accounting/cash-flow';
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Target,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  BarChart3
} from 'lucide-react';

interface PaymentPrioritizationProps {
  prioritization: PaymentPriorizationData;
  onSchedulePayment?: (paymentId: string, date: Date) => void;
  onDeferPayment?: (paymentId: string, newDate: Date) => void;
  onApprovePayment?: (paymentId: string) => void;
  isLoading?: boolean;
}

export function PaymentPrioritization({
  prioritization,
  onSchedulePayment,
  onDeferPayment,
  onApprovePayment,
  isLoading = false
}: PaymentPrioritizationProps) {
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set());

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Prioritization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Should be dynamic
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (score: number): string => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getPriorityLabel = (score: number): string => {
    if (score >= 80) return 'Critical';
    if (score >= 60) return 'High';
    if (score >= 40) return 'Medium';
    return 'Low';
  };

  const getRiskColor = (score: number): string => {
    if (score >= 70) return 'text-red-600';
    if (score >= 50) return 'text-orange-600';
    if (score >= 30) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getActionColor = (action: string): string => {
    switch (action) {
      case 'pay_immediately':
        return 'bg-red-500 text-white';
      case 'pay_on_due_date':
        return 'bg-blue-500 text-white';
      case 'defer':
        return 'bg-yellow-500 text-black';
      case 'negotiate':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getActionLabel = (action: string): string => {
    switch (action) {
      case 'pay_immediately':
        return 'Pay Now';
      case 'pay_on_due_date':
        return 'Pay on Due Date';
      case 'defer':
        return 'Defer';
      case 'negotiate':
        return 'Negotiate';
      default:
        return action;
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    const newSelected = new Set(selectedPayments);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedPayments(newSelected);
  };

  const getSelectedAmount = (payments: PrioritizedPayment[]): number => {
    return payments
      .filter(p => selectedPayments.has(p.entityId))
      .reduce((sum, p) => sum + p.amount, 0);
  };

  const PaymentCard = ({ payment }: { payment: PrioritizedPayment }) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <input
            type="checkbox"
            checked={selectedPayments.has(payment.entityId)}
            onChange={() => togglePaymentSelection(payment.entityId)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{payment.entityName}</h4>
              <Badge variant="outline" className="text-xs capitalize">
                {payment.entityType}
              </Badge>
              {payment.daysPastDue > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {payment.daysPastDue}d overdue
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Due: {payment.dueDate.toLocaleDateString()} •
              Amount: {formatCurrency(payment.amount)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getPriorityColor(payment.priorityScore)}>
            {getPriorityLabel(payment.priorityScore)} ({payment.priorityScore})
          </Badge>
          <Badge variant="outline" className={getActionColor(payment.recommendedAction)}>
            {getActionLabel(payment.recommendedAction)}
          </Badge>
        </div>
      </div>

      {/* Scoring Factors */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Vendor Criticality:</span>
          <div className="font-medium">{payment.scoringFactors.vendorCriticality}/5</div>
        </div>
        <div>
          <span className="text-muted-foreground">Payment History:</span>
          <div className="font-medium">{payment.scoringFactors.paymentHistory}/5</div>
        </div>
        <div>
          <span className="text-muted-foreground">Risk Score:</span>
          <div className={`font-medium ${getRiskColor(payment.riskScore)}`}>
            {payment.riskScore}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Relationship:</span>
          <div className="font-medium capitalize">{payment.relationshipImpact}</div>
        </div>
      </div>

      {/* Impact Analysis */}
      <div className="bg-gray-50 p-2 rounded text-xs">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <span className="text-muted-foreground">Cash Impact:</span>
            <div className="font-medium">{formatCurrency(payment.cashImpact)}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Operational:</span>
            <div className="font-medium capitalize">{payment.operationalImpact}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Recommended Date:</span>
            <div className="font-medium">{payment.recommendedDate.toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSchedulePayment?.(payment.entityId, payment.recommendedDate)}
        >
          Schedule
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDeferPayment?.(payment.entityId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
        >
          Defer 1 Week
        </Button>
        {payment.recommendedAction === 'pay_immediately' && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onApprovePayment?.(payment.entityId)}
          >
            Approve Now
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Prioritization
            <Badge variant="outline">
              {prioritization.totalPaymentsAnalyzed} payments analyzed
            </Badge>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generated on {prioritization.generatedAt.toLocaleString()}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Available Cash</p>
              <p className="text-lg font-semibold text-green-600">
                {formatCurrency(prioritization.availableCash)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Recommended Payments</p>
              <p className="text-lg font-semibold">
                {formatCurrency(prioritization.metrics.totalRecommendedAmount)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Cash Preserved</p>
              <p className="text-lg font-semibold text-blue-600">
                {formatCurrency(prioritization.metrics.cashPreserved)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">High Risk Payments</p>
              <p className="text-lg font-semibold text-red-600">
                {prioritization.metrics.highRiskPaymentCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Cash Flow Improvement */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Cash Flow Improvement</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(prioritization.metrics.cashFlowImprovement)}
                </span>
              </div>
              <Progress
                value={(prioritization.metrics.cashFlowImprovement / prioritization.availableCash) * 100}
                className="h-2"
              />
            </div>

            {/* Days Cash Extended */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Days Cash Extended</span>
                <span className="text-lg font-semibold text-blue-600">
                  {Math.round(prioritization.metrics.daysCashExtended)} days
                </span>
              </div>
              <Progress
                value={Math.min(100, (prioritization.metrics.daysCashExtended / 30) * 100)}
                className="h-2"
              />
            </div>

            {/* Average Priority Score */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg Priority Score</span>
                <span className="text-lg font-semibold">
                  {prioritization.metrics.averagePriorityScore.toFixed(0)}
                </span>
              </div>
              <Progress
                value={prioritization.metrics.averagePriorityScore}
                className="h-2"
              />
            </div>
          </div>

          {/* Risk Analysis */}
          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h4 className="font-medium text-orange-800 mb-2">Deferral Risk Analysis</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-orange-700">Total Late Fees:</span>
                <div className="font-medium">
                  {formatCurrency(prioritization.metrics.deferralRisk.totalLateFees)}
                </div>
              </div>
              <div>
                <span className="text-orange-700">Relationship Risk:</span>
                <div className="font-medium">
                  {prioritization.metrics.deferralRisk.relationshipRisk} vendors
                </div>
              </div>
              <div>
                <span className="text-orange-700">Credit Risk:</span>
                <div className="font-medium">
                  {(prioritization.metrics.deferralRisk.creditRisk * 100).toFixed(1)}% impact
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Lists */}
      <Tabs defaultValue="recommended" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recommended ({prioritization.recommendedPayments.length})
          </TabsTrigger>
          <TabsTrigger value="deferred" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Deferred ({prioritization.deferredPayments.length})
          </TabsTrigger>
          <TabsTrigger value="selected" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Selected ({selectedPayments.size})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Recommended Payments
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Total: {formatCurrency(prioritization.metrics.totalRecommendedAmount)}
                  </span>
                  <Button variant="outline" size="sm">
                    Schedule All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {prioritization.recommendedPayments
                .sort((a, b) => b.priorityScore - a.priorityScore)
                .map(payment => (
                  <PaymentCard key={payment.entityId} payment={payment} />
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deferred" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Deferred Payments
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Total: {formatCurrency(prioritization.metrics.totalDeferredAmount)}
                  </span>
                  <Button variant="outline" size="sm">
                    Review All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {prioritization.deferredPayments
                .sort((a, b) => b.riskScore - a.riskScore)
                .map(payment => (
                  <PaymentCard key={payment.entityId} payment={payment} />
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="selected" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Selected Payments ({selectedPayments.size})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Total: {formatCurrency(
                      getSelectedAmount([...prioritization.recommendedPayments, ...prioritization.deferredPayments])
                    )}
                  </span>
                  <Button variant="default" size="sm" disabled={selectedPayments.size === 0}>
                    Process Selected
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {selectedPayments.size === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4" />
                  <p>No payments selected</p>
                  <p className="text-sm">Select payments from the recommended or deferred tabs</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...prioritization.recommendedPayments, ...prioritization.deferredPayments]
                    .filter(payment => selectedPayments.has(payment.entityId))
                    .sort((a, b) => b.priorityScore - a.priorityScore)
                    .map(payment => (
                      <PaymentCard key={payment.entityId} payment={payment} />
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bulk Actions */}
      {selectedPayments.size > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectedPayments.size} payments selected
                </p>
                <p className="text-sm text-muted-foreground">
                  Total amount: {formatCurrency(
                    getSelectedAmount([...prioritization.recommendedPayments, ...prioritization.deferredPayments])
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Bulk Schedule
                </Button>
                <Button variant="outline" size="sm">
                  Bulk Defer
                </Button>
                <Button variant="default" size="sm">
                  Process Selected
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPayments(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}