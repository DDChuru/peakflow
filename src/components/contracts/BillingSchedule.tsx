'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ServiceAgreement, BillingFrequency } from '@/types/accounting/sla';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadixSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Calendar,
  Clock,
  Receipt,
  Play,
  Pause,
  SkipForward,
  Settings,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  DollarSign,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Zap
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface BillingScheduleProps {
  contract: ServiceAgreement;
  onGenerateInvoice: () => void;
  onUpdateBillingDate: (date: string) => void;
  onSkipBilling?: () => void;
  onAdjustSchedule?: (adjustments: ScheduleAdjustment) => void;
}

interface ScheduleAdjustment {
  newBillingDate?: string;
  newFrequency?: BillingFrequency;
  advanceDays?: number;
  dayOfMonth?: number;
}

interface BillingEvent {
  date: Date;
  amount: number;
  status: 'upcoming' | 'due' | 'overdue' | 'completed' | 'skipped';
  invoiceId?: string;
  invoiceNumber?: string;
  type: 'recurring' | 'manual' | 'prorated';
  description?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  billingEvent?: BillingEvent;
  dayNumber: number;
}

export function BillingSchedule({
  contract,
  onGenerateInvoice,
  onUpdateBillingDate,
  onSkipBilling,
  onAdjustSchedule
}: BillingScheduleProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [adjustments, setAdjustments] = useState<ScheduleAdjustment>({});

  // Generate billing schedule based on contract settings
  const billingSchedule = useMemo(() => {
    const events: BillingEvent[] = [];
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    let currentBillingDate = contract.nextBillingDate ? new Date(contract.nextBillingDate) : new Date(startDate);

    // Generate future billing dates
    while (currentBillingDate <= endDate) {
      const today = new Date();
      let status: BillingEvent['status'] = 'upcoming';

      if (currentBillingDate < today) {
        status = 'overdue';
      } else if (currentBillingDate.toDateString() === today.toDateString()) {
        status = 'due';
      }

      events.push({
        date: new Date(currentBillingDate),
        amount: contract.contractValue,
        status,
        type: 'recurring',
        description: `${contract.billingFrequency} billing for ${contract.contractName}`
      });

      // Calculate next billing date
      switch (contract.billingFrequency) {
        case 'monthly':
          if (contract.dayOfMonth && contract.dayOfMonth >= 1 && contract.dayOfMonth <= 31) {
            currentBillingDate.setMonth(currentBillingDate.getMonth() + 1);
            currentBillingDate.setDate(Math.min(contract.dayOfMonth, getDaysInMonth(currentBillingDate)));
          } else {
            currentBillingDate.setMonth(currentBillingDate.getMonth() + 1);
          }
          break;
        case 'quarterly':
          currentBillingDate.setMonth(currentBillingDate.getMonth() + 3);
          break;
        case 'annual':
          currentBillingDate.setFullYear(currentBillingDate.getFullYear() + 1);
          break;
        case 'custom':
          // For custom, default to monthly
          currentBillingDate.setMonth(currentBillingDate.getMonth() + 1);
          break;
      }

      // Prevent infinite loop
      if (events.length > 50) break;
    }

    return events.slice(0, 12); // Return next 12 billing events
  }, [contract]);

  // Generate calendar days for current month view
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday

    const days: CalendarDay[] = [];
    const today = new Date();

    for (let i = 0; i < 42; i++) { // 6 weeks × 7 days
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const billingEvent = billingSchedule.find(event =>
        event.date.toDateString() === date.toDateString()
      );

      days.push({
        date: new Date(date),
        isCurrentMonth: date.getMonth() === month,
        isToday: date.toDateString() === today.toDateString(),
        billingEvent,
        dayNumber: date.getDate()
      });
    }

    return days;
  }, [currentDate, billingSchedule]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const today = new Date();
    const next30Days = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    const next90Days = new Date(today.getTime() + (90 * 24 * 60 * 60 * 1000));

    const upcomingEvents = billingSchedule.filter(event => event.date >= today);
    const next30DaysEvents = billingSchedule.filter(event =>
      event.date >= today && event.date <= next30Days
    );
    const next90DaysEvents = billingSchedule.filter(event =>
      event.date >= today && event.date <= next90Days
    );

    return {
      nextBilling: upcomingEvents[0],
      next30DaysRevenue: next30DaysEvents.reduce((sum, event) => sum + event.amount, 0),
      next90DaysRevenue: next90DaysEvents.reduce((sum, event) => sum + event.amount, 0),
      upcomingCount: upcomingEvents.length,
      overdueCount: billingSchedule.filter(event => event.status === 'overdue').length
    };
  }, [billingSchedule]);

  const getDaysInMonth = (date: Date): number => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getBillingEventBadge = (status: BillingEvent['status']) => {
    switch (status) {
      case 'due':
        return <Badge variant="warning" className="text-xs">Due Today</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      case 'upcoming':
        return <Badge variant="secondary" className="text-xs">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="success" className="text-xs">Paid</Badge>;
      case 'skipped':
        return <Badge variant="outline" className="text-xs">Skipped</Badge>;
      default:
        return null;
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleAdjustmentSubmit = () => {
    if (onAdjustSchedule) {
      onAdjustSchedule(adjustments);
    }
    setShowAdjustments(false);
    setAdjustments({});
  };

  return (
    <div className="space-y-6">
      {/* Header & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Next Billing</p>
                <p className="text-lg font-bold text-blue-900">
                  {metrics.nextBilling ? formatCurrency(metrics.nextBilling.amount) : 'N/A'}
                </p>
                <p className="text-xs text-blue-600">
                  {metrics.nextBilling ? metrics.nextBilling.date.toLocaleDateString() : 'No upcoming billing'}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Next 30 Days</p>
                <p className="text-lg font-bold text-green-900">
                  {formatCurrency(metrics.next30DaysRevenue)}
                </p>
                <p className="text-xs text-green-600">
                  Expected revenue
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600">Next 90 Days</p>
                <p className="text-lg font-bold text-purple-900">
                  {formatCurrency(metrics.next90DaysRevenue)}
                </p>
                <p className="text-xs text-purple-600">
                  Revenue projection
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
              <CardDescription>
                Manage billing schedule and generate invoices
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}
              >
                {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdjustments(!showAdjustments)}
              >
                <Settings className="h-4 w-4" />
                Adjust Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {metrics.nextBilling && metrics.nextBilling.status === 'due' && (
              <Button onClick={onGenerateInvoice} className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Generate Invoice Now
              </Button>
            )}

            {metrics.nextBilling && metrics.nextBilling.status === 'upcoming' && (
              <Button variant="outline" onClick={onGenerateInvoice} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Generate Early Invoice
              </Button>
            )}

            {onSkipBilling && (
              <Button variant="outline" onClick={onSkipBilling} className="flex items-center gap-2">
                <SkipForward className="h-4 w-4" />
                Skip Next Billing
              </Button>
            )}

            <Button variant="outline" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Manual Invoice
            </Button>
          </div>

          {/* Schedule Adjustments Panel */}
          <AnimatePresence>
            {showAdjustments && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg"
              >
                <h4 className="font-medium text-gray-900 mb-4">Adjust Billing Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Next Billing Date</Label>
                    <Input
                      type="date"
                      value={adjustments.newBillingDate || contract.nextBillingDate || ''}
                      onChange={(e) => setAdjustments(prev => ({ ...prev, newBillingDate: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Billing Frequency</Label>
                    <Select
                      value={adjustments.newFrequency || contract.billingFrequency}
                      onValueChange={(value: BillingFrequency) =>
                        setAdjustments(prev => ({ ...prev, newFrequency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(adjustments.newFrequency === 'monthly' || contract.billingFrequency === 'monthly') && (
                    <div className="space-y-2">
                      <Label>Day of Month</Label>
                      <Input
                        type="number"
                        min="1"
                        max="31"
                        value={adjustments.dayOfMonth || contract.dayOfMonth || ''}
                        onChange={(e) => setAdjustments(prev => ({
                          ...prev,
                          dayOfMonth: parseInt(e.target.value)
                        }))}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Advance Days</Label>
                    <Input
                      type="number"
                      min="0"
                      max="90"
                      value={adjustments.advanceDays || contract.advanceDays || 0}
                      onChange={(e) => setAdjustments(prev => ({
                        ...prev,
                        advanceDays: parseInt(e.target.value)
                      }))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAdjustments(false);
                      setAdjustments({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAdjustmentSubmit}>
                    Apply Changes
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Calendar/List View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing Schedule
          </CardTitle>
          <CardDescription>
            {viewMode === 'calendar' ? 'Calendar view of upcoming billing dates' : 'List view of upcoming billing events'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'calendar' ? (
            <div className="space-y-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Week headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-2 min-h-[80px] border border-gray-100 rounded-md relative',
                      day.isCurrentMonth ? 'bg-white' : 'bg-gray-50',
                      day.isToday && 'bg-blue-50 border-blue-200'
                    )}
                  >
                    <div className={cn(
                      'text-sm',
                      day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400',
                      day.isToday && 'font-bold text-blue-900'
                    )}>
                      {day.dayNumber}
                    </div>

                    {day.billingEvent && (
                      <div className="mt-1">
                        <div className={cn(
                          'text-xs px-2 py-1 rounded text-center',
                          day.billingEvent.status === 'due' && 'bg-orange-100 text-orange-800',
                          day.billingEvent.status === 'overdue' && 'bg-red-100 text-red-800',
                          day.billingEvent.status === 'upcoming' && 'bg-blue-100 text-blue-800',
                          day.billingEvent.status === 'completed' && 'bg-green-100 text-green-800'
                        )}>
                          {formatCurrency(day.billingEvent.amount)}
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                          Billing
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <div className="space-y-3">
              {billingSchedule.map((event, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'p-4 border rounded-lg',
                    event.status === 'due' && 'border-orange-200 bg-orange-50',
                    event.status === 'overdue' && 'border-red-200 bg-red-50',
                    event.status === 'upcoming' && 'border-gray-200 bg-gray-50',
                    event.status === 'completed' && 'border-green-200 bg-green-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex items-center justify-center w-10 h-10 rounded-full',
                        event.status === 'due' && 'bg-orange-100',
                        event.status === 'overdue' && 'bg-red-100',
                        event.status === 'upcoming' && 'bg-blue-100',
                        event.status === 'completed' && 'bg-green-100'
                      )}>
                        {event.status === 'due' && <Clock className="h-5 w-5 text-orange-600" />}
                        {event.status === 'overdue' && <AlertCircle className="h-5 w-5 text-red-600" />}
                        {event.status === 'upcoming' && <Calendar className="h-5 w-5 text-blue-600" />}
                        {event.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {event.date.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                        <p className="text-sm text-gray-600">{event.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {getBillingEventBadge(event.status)}
                          <span className="text-xs text-gray-500 capitalize">
                            {event.type} billing
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(event.amount)}
                      </p>
                      {event.status === 'due' && (
                        <Button size="sm" onClick={onGenerateInvoice} className="mt-2">
                          Generate Invoice
                        </Button>
                      )}
                      {event.status === 'upcoming' && (
                        <Button variant="outline" size="sm" onClick={onGenerateInvoice} className="mt-2">
                          Generate Early
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {billingSchedule.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No billing events scheduled</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
