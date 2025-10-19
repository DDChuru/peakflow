'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Lock,
  LockOpen,
  Plus,
  Settings as SettingsIcon,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { fiscalPeriodService } from '@/lib/accounting';
import { companiesService } from '@/lib/firebase';
import type { FiscalPeriod, FiscalPeriodStatus } from '@/types/accounting/fiscal-period';
import type { Company } from '@/types/auth';

interface CompanyFinancialSettings {
  fiscalYearStartMonth: number;
  defaultARAccountId?: string;
  defaultTaxPayableAccountId?: string;
  defaultRevenueAccountId?: string;
  defaultExpenseAccountId?: string;
  defaultCashAccountId?: string;
}

function SettingsPageContent() {
  const params = useParams();
  const { user } = useAuth();
  const companyId = params?.companyId as string;

  const [activeTab, setActiveTab] = useState('fiscal-periods');
  const [periods, setPeriods] = useState<FiscalPeriod[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<FiscalPeriod | null>(null);
  const [action, setAction] = useState<'close' | 'reopen' | 'lock' | null>(null);

  // Generate periods form
  const [generateYear, setGenerateYear] = useState(new Date().getFullYear());
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(1);

  // Financial settings
  const [financialSettings, setFinancialSettings] = useState<CompanyFinancialSettings>({
    fiscalYearStartMonth: 1,
  });

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [periodsData, companyData] = await Promise.all([
        fiscalPeriodService.getPeriods(companyId),
        companiesService.getCompanyById(companyId)
      ]);

      setPeriods(periodsData);
      setCompany(companyData);

      // Load financial settings from company (if available)
      if (companyData) {
        const settings = (companyData as any).financialSettings || {};
        setFinancialSettings({
          fiscalYearStartMonth: settings.fiscalYearStartMonth || 1,
          defaultARAccountId: settings.defaultARAccountId,
          defaultTaxPayableAccountId: settings.defaultTaxPayableAccountId,
          defaultRevenueAccountId: settings.defaultRevenueAccountId,
          defaultExpenseAccountId: settings.defaultExpenseAccountId,
          defaultCashAccountId: settings.defaultCashAccountId,
        });
        setFiscalYearStartMonth(settings.fiscalYearStartMonth || 1);
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error(error.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePeriods = async () => {
    if (!user) return;

    try {
      const loading = toast.loading('Generating fiscal periods...');

      await fiscalPeriodService.createPeriodsForYear(
        companyId,
        generateYear,
        fiscalYearStartMonth
      );

      toast.dismiss(loading);
      toast.success(`Generated fiscal periods for ${generateYear}`);
      setIsGenerateDialogOpen(false);
      await loadData();
    } catch (error: any) {
      console.error('Error generating periods:', error);
      toast.error(error.message || 'Failed to generate periods');
    }
  };

  const handlePeriodAction = async () => {
    if (!user || !selectedPeriod || !action) return;

    try {
      const loading = toast.loading(`${action === 'close' ? 'Closing' : action === 'reopen' ? 'Reopening' : 'Locking'} period...`);

      if (action === 'close') {
        await fiscalPeriodService.closePeriod(selectedPeriod.id, user.uid);
        toast.dismiss(loading);
        toast.success('Period closed successfully');
      } else if (action === 'reopen') {
        await fiscalPeriodService.reopenPeriod(selectedPeriod.id, user.uid);
        toast.dismiss(loading);
        toast.success('Period reopened successfully');
      } else if (action === 'lock') {
        await fiscalPeriodService.lockPeriod(selectedPeriod.id, user.uid);
        toast.dismiss(loading);
        toast.success('Period locked successfully');
      }

      setIsActionDialogOpen(false);
      setSelectedPeriod(null);
      setAction(null);
      await loadData();
    } catch (error: any) {
      console.error('Error performing action:', error);
      toast.error(error.message || 'Failed to perform action');
    }
  };

  const handleSaveFinancialSettings = async () => {
    if (!user) return;

    try {
      const loading = toast.loading('Saving financial settings...');

      // Update company with financial settings
      await companiesService.updateCompany(companyId, {
        financialSettings
      } as any, user.uid);

      toast.dismiss(loading);
      toast.success('Financial settings saved successfully');
      await loadData();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    }
  };

  const openActionDialog = (period: FiscalPeriod, actionType: 'close' | 'reopen' | 'lock') => {
    setSelectedPeriod(period);
    setAction(actionType);
    setIsActionDialogOpen(true);
  };

  const getStatusBadge = (status: FiscalPeriodStatus) => {
    const variants: Record<FiscalPeriodStatus, { variant: any; label: string; icon: any }> = {
      open: { variant: 'default', label: 'Open', icon: LockOpen },
      closed: { variant: 'secondary', label: 'Closed', icon: Lock },
      locked: { variant: 'destructive', label: 'Locked', icon: Lock },
      pending: { variant: 'outline', label: 'Pending', icon: AlertCircle },
    };

    const config = variants[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounting Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage fiscal periods, financial configuration, and accounting preferences
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fiscal-periods">
            <Calendar className="h-4 w-4 mr-2" />
            Fiscal Periods
          </TabsTrigger>
          <TabsTrigger value="financial-config">
            <TrendingUp className="h-4 w-4 mr-2" />
            Financial Configuration
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <SettingsIcon className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Fiscal Periods Tab */}
        <TabsContent value="fiscal-periods" className="space-y-4">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">Fiscal Periods</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage accounting periods for financial reporting and GL posting control
                </p>
              </div>
              <Button onClick={() => setIsGenerateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Periods
              </Button>
            </div>

            {periods.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Fiscal Periods</h3>
                <p className="text-muted-foreground mb-4">
                  Generate fiscal periods to enable GL posting and period controls
                </p>
                <Button onClick={() => setIsGenerateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate Periods
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-medium">Period</th>
                      <th className="text-left p-3 font-medium">Start Date</th>
                      <th className="text-left p-3 font-medium">End Date</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-right p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr key={period.id} className="border-t">
                        <td className="p-3 font-medium">{period.name}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(period.startDate)}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(period.endDate)}</td>
                        <td className="p-3">{getStatusBadge(period.status)}</td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            {period.status === 'open' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openActionDialog(period, 'close')}
                              >
                                Close Period
                              </Button>
                            )}
                            {period.status === 'closed' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(period, 'reopen')}
                                >
                                  Reopen
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openActionDialog(period, 'lock')}
                                >
                                  Lock
                                </Button>
                              </>
                            )}
                            {period.status === 'locked' && (
                              <Badge variant="destructive">Locked</Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Financial Configuration Tab */}
        <TabsContent value="financial-config" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Financial Configuration</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure fiscal year settings and default GL accounts
              </p>
            </div>

            <div className="space-y-6">
              {/* Fiscal Year Settings */}
              <div>
                <h3 className="text-lg font-medium mb-4">Fiscal Year</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="fiscalYearStart">Fiscal Year Start Month</Label>
                    <RadixSelect
                      value={financialSettings.fiscalYearStartMonth.toString()}
                      onValueChange={(value) =>
                        setFinancialSettings({ ...financialSettings, fiscalYearStartMonth: parseInt(value) })
                      }
                    >
                      <SelectTrigger id="fiscalYearStart">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={month.value.toString()}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </RadixSelect>
                    <p className="text-sm text-muted-foreground mt-1">
                      Select the month your fiscal year begins (e.g., January for calendar year, July for mid-year)
                    </p>
                  </div>
                </div>
              </div>

              {/* Default GL Accounts */}
              <div>
                <h3 className="text-lg font-medium mb-4">Default GL Accounts</h3>
                <div className="grid gap-4">
                  <div>
                    <Label htmlFor="arAccount">Accounts Receivable Account ID</Label>
                    <Input
                      id="arAccount"
                      placeholder="e.g., 1200"
                      value={financialSettings.defaultARAccountId || ''}
                      onChange={(e) =>
                        setFinancialSettings({ ...financialSettings, defaultARAccountId: e.target.value })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Default account for customer invoices and receivables
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="taxAccount">Tax Payable Account ID</Label>
                    <Input
                      id="taxAccount"
                      placeholder="e.g., 2200"
                      value={financialSettings.defaultTaxPayableAccountId || ''}
                      onChange={(e) =>
                        setFinancialSettings({ ...financialSettings, defaultTaxPayableAccountId: e.target.value })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Default account for sales tax/VAT payable
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="revenueAccount">Default Revenue Account ID</Label>
                    <Input
                      id="revenueAccount"
                      placeholder="e.g., 4000"
                      value={financialSettings.defaultRevenueAccountId || ''}
                      onChange={(e) =>
                        setFinancialSettings({ ...financialSettings, defaultRevenueAccountId: e.target.value })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Default account for sales revenue
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="cashAccount">Default Cash Account ID</Label>
                    <Input
                      id="cashAccount"
                      placeholder="e.g., 1000"
                      value={financialSettings.defaultCashAccountId || ''}
                      onChange={(e) =>
                        setFinancialSettings({ ...financialSettings, defaultCashAccountId: e.target.value })
                      }
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Default account for cash receipts and payments
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveFinancialSettings}>
                  Save Configuration
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Accounting Preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Configure accounting preferences and behaviors
              </p>
            </div>

            <div className="text-center py-12 text-muted-foreground">
              <SettingsIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Additional preferences coming soon...</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generate Periods Dialog */}
      <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Fiscal Periods</DialogTitle>
            <DialogDescription>
              Automatically create 12 monthly fiscal periods for the specified year
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="generateYear">Fiscal Year</Label>
              <Input
                id="generateYear"
                type="number"
                value={generateYear}
                onChange={(e) => setGenerateYear(parseInt(e.target.value))}
                min={2000}
                max={2100}
              />
            </div>

            <div>
              <Label htmlFor="startMonth">Fiscal Year Start Month</Label>
              <RadixSelect
                value={fiscalYearStartMonth.toString()}
                onValueChange={(value) => setFiscalYearStartMonth(parseInt(value))}
              >
                <SelectTrigger id="startMonth">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RadixSelect>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGeneratePeriods}>Generate Periods</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === 'close' && 'Close Fiscal Period'}
              {action === 'reopen' && 'Reopen Fiscal Period'}
              {action === 'lock' && 'Lock Fiscal Period'}
            </DialogTitle>
            <DialogDescription>
              {action === 'close' &&
                'Closing this period will prevent new transactions from being posted to it. You can reopen it later if needed.'}
              {action === 'reopen' &&
                'Reopening this period will allow new transactions to be posted to it again.'}
              {action === 'lock' &&
                'Locking this period will make it completely immutable. This should only be done after audits or year-end closing.'}
            </DialogDescription>
          </DialogHeader>

          {selectedPeriod && (
            <div className="py-4">
              <div className="rounded-lg bg-muted p-4">
                <div className="font-medium">{selectedPeriod.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={action === 'lock' ? 'destructive' : 'default'}
              onClick={handlePeriodAction}
            >
              {action === 'close' && 'Close Period'}
              {action === 'reopen' && 'Reopen Period'}
              {action === 'lock' && 'Lock Period'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireCompany>
      <SettingsPageContent />
    </ProtectedRoute>
  );
}
