'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import {
  CheckCircle,
  AlertCircle,
  Eye,
  Save,
  RefreshCw,
  ArrowLeft,
  Info
} from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { AccountType } from '@/types/accounting/chart-of-accounts';
import { OpeningBalanceService, OpeningBalanceInput } from '@/lib/accounting/opening-balance-service';
import { ChartOfAccountsService } from '@/lib/accounting/chart-of-accounts-service';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  amount: string; // String for input
}

interface FiscalPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
}

export default function OpeningBalancesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.companyId as string;

  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('');
  const [retainedEarningsAccountId, setRetainedEarningsAccountId] = useState<string>('');
  const [companyCurrency, setCompanyCurrency] = useState<string>('ZAR');
  const [showPreview, setShowPreview] = useState(false);
  const [existingEntry, setExistingEntry] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (selectedPeriod) {
      checkExistingEntry();
    }
  }, [selectedPeriod]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load company currency
      const companyRef = doc(db, 'companies', companyId);
      const companySnap = await getDoc(companyRef);
      if (companySnap.exists()) {
        setCompanyCurrency(companySnap.data().defaultCurrency || 'ZAR');
      }

      // Load fiscal periods
      const periodsQuery = query(
        collection(db, 'fiscal_periods'),
        where('tenantId', '==', companyId),
        orderBy('startDate', 'desc')
      );

      const periodsSnapshot = await getDocs(periodsQuery);
      const periods = periodsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          startDate: data.startDate?.toDate() || new Date(),
          endDate: data.endDate?.toDate() || new Date()
        };
      });

      setFiscalPeriods(periods);

      // Auto-select first period
      if (periods.length > 0 && !selectedPeriod) {
        setSelectedPeriod(periods[0].id);
        setEffectiveDate(periods[0].startDate.toISOString().split('T')[0]);
      }

      // First, get the company's active chart of accounts
      console.log('📊 Loading charts for company:', companyId);
      const chartService = new ChartOfAccountsService();
      const charts = await chartService.getCharts(companyId);
      console.log('📊 Found charts:', charts.length, charts);

      if (charts.length === 0) {
        console.error('❌ No charts found for company:', companyId);
        toast.error('No chart of accounts found. Please set up a chart of accounts first in the admin section.');
        setLoading(false);
        return;
      }

      // Get the default chart or first chart
      const activeChart = charts.find(c => c.isDefault) || charts[0];
      const chartId = activeChart.id;
      console.log('📊 Using chart:', chartId, activeChart.name);

      // Load accounts using the service
      console.log('📊 Loading accounts for chart:', chartId);
      const accountRecords = await chartService.getAccounts(companyId, chartId);
      console.log('📊 Found accounts:', accountRecords.length);

      // Transform to the format needed by this component
      const accountsList = accountRecords
        .filter(acc => acc.isActive)
        .map(acc => ({
          accountId: acc.id,
          accountCode: acc.code,
          accountName: acc.name,
          accountType: acc.type as AccountType,
          amount: '0.00'
        }));

      console.log('📊 Active accounts:', accountsList.length);
      setAccounts(accountsList);

      // Find retained earnings account (3500 or equity type)
      const retainedEarnings = accountsList.find(
        acc => acc.accountType === 'equity' && (
          acc.accountCode === '3500' ||
          acc.accountName.toLowerCase().includes('retained earnings')
        )
      );

      if (retainedEarnings) {
        setRetainedEarningsAccountId(retainedEarnings.accountId);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingEntry = async () => {
    if (!selectedPeriod) return;

    try {
      const service = new OpeningBalanceService(companyId);
      const existing = await service.getExistingOpeningBalance(selectedPeriod);
      setExistingEntry(existing);

      if (existing) {
        toast.error('Opening balance already exists for this period');
      }
    } catch (error) {
      console.error('Failed to check existing entry:', error);
    }
  };

  const handleAmountChange = (accountId: string, value: string) => {
    setAccounts(prev =>
      prev.map(acc =>
        acc.accountId === accountId
          ? { ...acc, amount: value }
          : acc
      )
    );
  };

  const calculateTotals = () => {
    let totalDebits = 0;
    let totalCredits = 0;

    accounts.forEach(acc => {
      const amount = parseFloat(acc.amount) || 0;
      if (amount === 0) return;

      const isDebitNormal = acc.accountType === 'asset' || acc.accountType === 'expense';

      if (amount > 0) {
        if (isDebitNormal) {
          totalDebits += amount;
        } else {
          totalCredits += amount;
        }
      } else {
        if (isDebitNormal) {
          totalCredits += Math.abs(amount);
        } else {
          totalDebits += Math.abs(amount);
        }
      }
    });

    const difference = totalDebits - totalCredits;
    const balancingAmount = Math.abs(difference);

    // Add balancing entry
    if (difference !== 0) {
      if (difference > 0) {
        totalCredits += balancingAmount;
      } else {
        totalDebits += balancingAmount;
      }
    }

    return {
      totalDebits,
      totalCredits,
      difference,
      balancingAmount,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
    };
  };

  const getBalances = (): OpeningBalanceInput[] => {
    return accounts
      .filter(acc => parseFloat(acc.amount) !== 0)
      .map(acc => ({
        accountId: acc.accountId,
        accountCode: acc.accountCode,
        accountName: acc.accountName,
        accountType: acc.accountType,
        amount: parseFloat(acc.amount)
      }));
  };

  const handlePostBalances = async () => {
    if (!user || !selectedPeriod || !retainedEarningsAccountId) {
      toast.error('Missing required information');
      return;
    }

    if (existingEntry) {
      toast.error('Opening balance already exists for this period');
      return;
    }

    const balances = getBalances();

    if (balances.length === 0) {
      toast.error('Please enter at least one account balance');
      return;
    }

    try {
      setPosting(true);

      const service = new OpeningBalanceService(companyId);
      const result = await service.postOpeningBalances(
        selectedPeriod,
        new Date(effectiveDate),
        balances,
        retainedEarningsAccountId,
        user.uid,
        companyCurrency
      );

      if (result.success) {
        toast.success(
          `Opening balances posted successfully!\nDebits: ${formatCurrency(result.totalDebits)} | Credits: ${formatCurrency(result.totalCredits)}`,
          { duration: 6000 }
        );

        // Redirect to journal or dashboard
        setTimeout(() => {
          router.push(`/workspace/${companyId}/journal`);
        }, 2000);
      } else {
        toast.error(result.errors?.join(', ') || 'Failed to post opening balances');
      }

    } catch (error) {
      console.error('Failed to post opening balances:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post opening balances');
    } finally {
      setPosting(false);
      setShowPreview(false);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: companyCurrency,
      minimumFractionDigits: 2,
    }).format(value);
  };

  const totals = calculateTotals();
  const balances = getBalances();

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'financial_admin']} requireCompany>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'financial_admin']} requireCompany>
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/workspace/${companyId}/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Opening Balances Setup</CardTitle>
            <CardDescription>
              Enter account balances as of your go-live date. The system will automatically create
              a balanced journal entry with a retained earnings adjustment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2">Fiscal Period</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={posting}
                >
                  {fiscalPeriods.map(period => (
                    <option key={period.id} value={period.id}>
                      {period.name} ({period.startDate.toLocaleDateString()} - {period.endDate.toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Effective Date</label>
                <Input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  disabled={posting}
                />
              </div>
            </div>

            {existingEntry && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Opening balance already exists for this fiscal period (Entry ID: {existingEntry.id}).
                  Please delete the existing entry first if you want to re-enter opening balances.
                </AlertDescription>
              </Alert>
            )}

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>How to enter balances:</strong>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><strong>Assets & Expenses:</strong> Enter positive amounts for debits (normal balance)</li>
                  <li><strong>Liabilities, Equity & Revenue:</strong> Enter positive amounts for credits (normal balance)</li>
                  <li><strong>Contra entries:</strong> Use negative amounts if needed</li>
                  <li>The system will automatically balance using Retained Earnings</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* Accounts Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Code</TableHead>
                    <TableHead>Account Name</TableHead>
                    <TableHead className="w-32">Type</TableHead>
                    <TableHead className="w-48 text-right">Amount ({companyCurrency})</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => {
                    const typeAccounts = accounts.filter(acc => acc.accountType === type);
                    if (typeAccounts.length === 0) return null;

                    return (
                      <React.Fragment key={type}>
                        <TableRow className="bg-gray-50">
                          <TableCell colSpan={4} className="font-semibold uppercase text-sm">
                            {type}s
                          </TableCell>
                        </TableRow>
                        {typeAccounts.map(account => (
                          <TableRow key={account.accountId}>
                            <TableCell className="font-mono">{account.accountCode}</TableCell>
                            <TableCell>
                              {account.accountName}
                              {account.accountId === retainedEarningsAccountId && (
                                <Badge variant="secondary" className="ml-2">Auto-balanced</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{account.accountType}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Input
                                type="number"
                                step="0.01"
                                value={account.amount}
                                onChange={(e) => handleAmountChange(account.accountId, e.target.value)}
                                disabled={posting || account.accountId === retainedEarningsAccountId}
                                className="text-right font-mono"
                                placeholder="0.00"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Totals */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Debits:</span>
                <span className="font-mono text-green-600">{formatCurrency(totals.totalDebits)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span className="font-semibold">Total Credits:</span>
                <span className="font-mono text-red-600">{formatCurrency(totals.totalCredits)}</span>
              </div>
              {totals.balancingAmount > 0 && (
                <div className="flex justify-between items-center text-sm text-muted-foreground border-t pt-2">
                  <span>Retained Earnings (balancing):</span>
                  <span className="font-mono">{formatCurrency(totals.balancingAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold border-t pt-3">
                <span>Status:</span>
                <div className="flex items-center gap-2">
                  {totals.isBalanced ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-green-600">Balanced</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-red-600">Unbalanced</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreview(true)}
                disabled={posting || balances.length === 0 || existingEntry !== null}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Entry
              </Button>
              <Button
                onClick={handlePostBalances}
                disabled={posting || !totals.isBalanced || balances.length === 0 || existingEntry !== null}
              >
                {posting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Post Opening Balances
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preview Opening Balance Entry</DialogTitle>
              <DialogDescription>
                Review the journal entry before posting to the ledger
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Date:</span>
                  <span className="ml-2 font-semibold">{effectiveDate}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="ml-2 font-mono">OB-{selectedPeriod}</span>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {balances.map(balance => {
                    const isDebitNormal = balance.accountType === 'asset' || balance.accountType === 'expense';
                    const amount = balance.amount;
                    const debit = (amount >= 0 && isDebitNormal) || (amount < 0 && !isDebitNormal)
                      ? Math.abs(amount)
                      : 0;
                    const credit = (amount >= 0 && !isDebitNormal) || (amount < 0 && isDebitNormal)
                      ? Math.abs(amount)
                      : 0;

                    return (
                      <TableRow key={balance.accountId}>
                        <TableCell>
                          <div className="font-mono text-sm">{balance.accountCode}</div>
                          <div className="text-sm">{balance.accountName}</div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {debit > 0 ? formatCurrency(debit) : '—'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {credit > 0 ? formatCurrency(credit) : '—'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {totals.balancingAmount > 0 && (
                    <TableRow className="bg-blue-50">
                      <TableCell>
                        <div className="font-mono text-sm">
                          {accounts.find(a => a.accountId === retainedEarningsAccountId)?.accountCode}
                        </div>
                        <div className="text-sm">
                          {accounts.find(a => a.accountId === retainedEarningsAccountId)?.accountName}
                          <Badge variant="secondary" className="ml-2">Balancing Entry</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-green-600">
                        {totals.difference < 0 ? formatCurrency(totals.balancingAmount) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-600">
                        {totals.difference > 0 ? formatCurrency(totals.balancingAmount) : '—'}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-right text-green-600">{formatCurrency(totals.totalDebits)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(totals.totalCredits)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
