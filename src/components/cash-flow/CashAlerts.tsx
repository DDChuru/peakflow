'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { CashFlowAlert, CashFlowAlertType } from '@/types/accounting/cash-flow';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  TrendingDown,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  ChevronDown,
  CheckCircle,
  X
} from 'lucide-react';

interface CashAlertsProps {
  alerts: CashFlowAlert[];
  onDismissAlert?: (alertId: string) => void;
  onTakeAction?: (alertId: string, action: string) => void;
  showDismissed?: boolean;
}

export function CashAlerts({
  alerts,
  onDismissAlert,
  onTakeAction,
  showDismissed = false
}: CashAlertsProps) {
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const toggleExpanded = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
    onDismissAlert?.(alertId);
  };

  const getAlertIcon = (type: CashFlowAlertType, severity: string) => {
    const iconClass = "h-4 w-4";

    switch (severity) {
      case 'critical':
        return <AlertTriangle className={`${iconClass} text-red-600`} />;
      case 'high':
        return <AlertCircle className={`${iconClass} text-orange-600`} />;
      case 'medium':
        return <AlertCircle className={`${iconClass} text-yellow-600`} />;
      case 'low':
        return <Info className={`${iconClass} text-blue-600`} />;
      default:
        return <Info className={`${iconClass} text-gray-600`} />;
    }
  };

  const getAlertTypeIcon = (type: CashFlowAlertType) => {
    const iconClass = "h-4 w-4";

    switch (type) {
      case 'negative_balance':
      case 'threshold_breach':
        return <TrendingDown className={iconClass} />;
      case 'large_outflow':
      case 'payment_concentration':
        return <DollarSign className={iconClass} />;
      case 'cash_runway_short':
        return <Calendar className={iconClass} />;
      default:
        return <AlertCircle className={iconClass} />;
    }
  };

  const getBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD', // Should be dynamic
      notation: Math.abs(amount) > 1000000 ? 'compact' : 'standard',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertTypeDescription = (type: CashFlowAlertType): string => {
    switch (type) {
      case 'negative_balance':
        return 'Cash balance will go negative';
      case 'threshold_breach':
        return 'Cash below minimum threshold';
      case 'cash_runway_short':
        return 'Cash runway running low';
      case 'large_outflow':
        return 'Large outflow detected';
      case 'payment_concentration':
        return 'High payment concentration';
      case 'currency_risk':
        return 'Currency exchange risk';
      case 'data_quality':
        return 'Data quality concern';
      case 'forecast_variance':
        return 'High forecast variance';
      default:
        return 'Cash flow alert';
    }
  };

  // Filter alerts based on dismissed status
  const visibleAlerts = alerts.filter(alert =>
    showDismissed || !dismissedAlerts.has(alert.id)
  );

  // Group alerts by severity
  const alertsBySeverity = visibleAlerts.reduce((groups, alert) => {
    if (!groups[alert.severity]) {
      groups[alert.severity] = [];
    }
    groups[alert.severity].push(alert);
    return groups;
  }, {} as Record<string, CashFlowAlert[]>);

  // Order severity levels
  const severityOrder = ['critical', 'high', 'medium', 'low'];
  const orderedSeverities = severityOrder.filter(severity => alertsBySeverity[severity]);

  if (visibleAlerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Cash Flow Alerts
            <Badge variant="outline" className="text-green-600">
              All Clear
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-lg font-medium">No Active Alerts</p>
            <p className="text-sm">Your cash flow forecast looks healthy</p>
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
            <AlertTriangle className="h-5 w-5" />
            Cash Flow Alerts
            <Badge variant="destructive">
              {visibleAlerts.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpandedAlerts(new Set())}
            >
              Collapse All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {/* Toggle show dismissed */}}
            >
              {showDismissed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {severityOrder.map(severity => {
            const count = alertsBySeverity[severity]?.length || 0;
            if (count === 0) return null;

            return (
              <div key={severity} className="text-center">
                <p className="text-sm font-medium capitalize">{severity}</p>
                <p className={`text-lg font-bold ${
                  severity === 'critical' ? 'text-red-600' :
                  severity === 'high' ? 'text-orange-600' :
                  severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                }`}>
                  {count}
                </p>
              </div>
            );
          })}
        </div>

        {/* Alert List */}
        <div className="space-y-3">
          {orderedSeverities.map(severity => (
            <div key={severity}>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 capitalize">
                {severity} Priority ({alertsBySeverity[severity].length})
              </h4>
              <div className="space-y-2">
                {alertsBySeverity[severity].map(alert => (
                  <Collapsible
                    key={alert.id}
                    open={expandedAlerts.has(alert.id)}
                    onOpenChange={() => toggleExpanded(alert.id)}
                  >
                    <div className={`border rounded-lg ${
                      alert.severity === 'critical' ? 'border-red-200 bg-red-50' :
                      alert.severity === 'high' ? 'border-orange-200 bg-orange-50' :
                      alert.severity === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <CollapsibleTrigger className="w-full p-4 text-left">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              {getAlertIcon(alert.type, alert.severity)}
                              {getAlertTypeIcon(alert.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">
                                  {getAlertTypeDescription(alert.type)}
                                </p>
                                <Badge variant={getBadgeVariant(alert.severity)} className="text-xs">
                                  {alert.severity}
                                </Badge>
                                {alert.actionRequired && (
                                  <Badge variant="outline" className="text-xs">
                                    Action Required
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {alert.message}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                <span>
                                  {alert.triggerDate.toLocaleDateString()}
                                </span>
                                {alert.estimatedImpact > 0 && (
                                  <span>
                                    Impact: {formatCurrency(alert.estimatedImpact)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <ChevronDown className={`h-4 w-4 transition-transform ${
                              expandedAlerts.has(alert.id) ? 'rotate-180' : ''
                            }`} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissAlert(alert.id);
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {/* Suggested Actions */}
                          {alert.suggestedActions && alert.suggestedActions.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Suggested Actions:</p>
                              <ul className="space-y-1">
                                {alert.suggestedActions.map((action, index) => (
                                  <li key={index} className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                      • {action}
                                    </span>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => onTakeAction?.(alert.id, action)}
                                    >
                                      Take Action
                                    </Button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Additional Details */}
                          {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Details:</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                {Object.entries(alert.metadata).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace('_', ' ')}:</span>
                                    <span>{String(value)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                            <Button variant="outline" size="sm">
                              Set Reminder
                            </Button>
                            <Button variant="outline" size="sm">
                              Share Alert
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {visibleAlerts.length > 1 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Bulk Actions for {visibleAlerts.length} alerts
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Mark All as Reviewed
                </Button>
                <Button variant="outline" size="sm">
                  Export Alerts
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    visibleAlerts.forEach(alert => handleDismissAlert(alert.id));
                  }}
                >
                  Dismiss All
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}