'use client';

import { useEffect, useMemo, useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ChartOfAccountsService } from '@/lib/accounting/chart-of-accounts-service';
import { AVAILABLE_CHART_TEMPLATES } from '@/types/accounting/templates';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { bankAccountService } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {
  AccountRecord,
  AccountType,
  ChartOfAccounts,
} from '@/types/accounting/chart-of-accounts';
import { BankAccount, BankAccountType } from '@/types/accounting/bank-account';
import { Company } from '@/types/auth';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  BookOpenCheck,
  Layers,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const chartService = new ChartOfAccountsService();
const companiesService = new CompaniesService();

interface AccountFormState {
  name: string;
  code: string;
  type: AccountType;
  parentId?: string | null;
  description?: string;
}

interface BankAccountFormState {
  nickname: string;
  bankName: string;
  accountNumber: string;
  accountType: BankAccountType;
  currency: string;
  branch: string;
  country: string;
  isPrimary: boolean;
  openingBalance: string;
  balanceAsOf: string;
}

const defaultFormState: AccountFormState = {
  name: '',
  code: '',
  type: 'asset',
  parentId: null,
  description: '',
};

const createDefaultBankAccountForm = (currency?: string): BankAccountFormState => ({
  nickname: '',
  bankName: '',
  accountNumber: '',
  accountType: 'checking',
  currency: currency ?? '',
  branch: '',
  country: '',
  isPrimary: false,
  openingBalance: '',
  balanceAsOf: new Date().toISOString().slice(0, 10),
});

const BANK_ACCOUNT_TYPES: { value: BankAccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit-card', label: 'Credit card' },
  { value: 'loan', label: 'Loan' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
];

export default function ChartOfAccountsAdminPage() {
  const { user, company, hasRole } = useAuth();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [charts, setCharts] = useState<ChartOfAccounts[]>([]);
  const [selectedChartId, setSelectedChartId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | AccountType>('all');
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [formState, setFormState] = useState<AccountFormState>(defaultFormState);
  const [submitting, setSubmitting] = useState(false);
  const [applyTemplateLoading, setApplyTemplateLoading] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(AVAILABLE_CHART_TEMPLATES[0]?.id ?? null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [linkingAccount, setLinkingAccount] = useState<AccountRecord | null>(null);
  const [showBankDrawer, setShowBankDrawer] = useState(false);
  const [bankAccountForm, setBankAccountForm] = useState<BankAccountFormState>(() => createDefaultBankAccountForm());
  const [bankAccountSubmitting, setBankAccountSubmitting] = useState(false);

  useEffect(() => {
    if (!hasRole('admin') && !hasRole('developer')) return;

    const loadCompanies = async () => {
      try {
        const all = await companiesService.getAllCompanies();
        setCompanies(all);
        const initialTenant = company?.id ?? all[0]?.id ?? null;
        setSelectedTenantId(initialTenant);
      } catch (error) {
        console.error('Failed to load companies', error);
        toast.error('Could not load companies');
      }
    };

    loadCompanies();
  }, [company?.id, hasRole]);

  useEffect(() => {
    if (!selectedTenantId) return;

    const loadCharts = async () => {
      try {
        setLoadingCharts(true);
        const list = await chartService.getCharts(selectedTenantId);
        setCharts(list);
        setSelectedChartId((current) => current ?? list[0]?.id ?? null);
      } catch (error) {
        console.error('Failed to load charts', error);
        toast.error('Could not load charts of accounts');
      } finally {
        setLoadingCharts(false);
      }
    };

    loadCharts();
  }, [selectedTenantId]);

  useEffect(() => {
    if (!selectedTenantId || !selectedChartId) return;

    const loadAccounts = async () => {
      try {
        setLoadingAccounts(true);
        const list = await chartService.getAccounts(selectedTenantId, selectedChartId);
        setAccounts(list);
      } catch (error) {
        console.error('Failed to load accounts', error);
        toast.error('Could not load accounts');
      } finally {
        setLoadingAccounts(false);
      }
    };

    loadAccounts();
  }, [selectedChartId, selectedTenantId]);

  useEffect(() => {
    if (!selectedTenantId) {
      setBankAccounts([]);
      return;
    }

    const loadBankAccounts = async () => {
      try {
        setLoadingBankAccounts(true);
        const list = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
        setBankAccounts(list);
      } catch (error) {
        console.error('Failed to load bank accounts', error);
        toast.error('Could not load bank accounts');
      } finally {
        setLoadingBankAccounts(false);
      }
    };

    loadBankAccounts();
  }, [selectedTenantId]);

  const filteredAccounts = useMemo(() => {
    const normalized = searchTerm.toLowerCase();
    return accounts.filter((account) => {
      const matchesSearch =
        !normalized ||
        account.name.toLowerCase().includes(normalized) ||
        account.code.toLowerCase().includes(normalized) ||
        account.description?.toLowerCase().includes(normalized);

      const matchesType = typeFilter === 'all' || account.type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [accounts, searchTerm, typeFilter]);

  const bankAccountByGlId = useMemo(() => {
    return bankAccounts.reduce<Record<string, BankAccount>>((acc, item) => {
      acc[item.glAccountId] = item;
      return acc;
    }, {});
  }, [bankAccounts]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const active = accounts.filter((acc) => acc.isActive).length;
    const perType = accounts.reduce<Record<AccountType, number>>(
      (acc, current) => ({ ...acc, [current.type]: (acc[current.type] ?? 0) + 1 }),
      { asset: 0, liability: 0, equity: 0, revenue: 0, expense: 0 }
    );

    return { total, active, perType };
  }, [accounts]);

  const currentCompany = companies.find((item) => item.id === selectedTenantId);
  const currentChart = charts.find((item) => item.id === selectedChartId);

  const handleOpenNewAccount = () => {
    setFormState(defaultFormState);
    setShowNewAccount(true);
  };

  const handleApplyTemplate = async () => {
    if (!selectedTenantId || !selectedChartId || !selectedTemplateId) return;
    const template = AVAILABLE_CHART_TEMPLATES.find((item) => item.id === selectedTemplateId);
    if (!template) return;

    if (!window.confirm(`Apply template "${template.name}"? Existing accounts will remain.`)) {
      return;
    }

    try {
      setApplyTemplateLoading(true);
      await chartService.applyTemplateById(selectedTenantId, selectedChartId, selectedTemplateId);
      const refreshed = await chartService.getAccounts(selectedTenantId, selectedChartId);
      setAccounts(refreshed);
      toast.success('Template applied');
    } catch (error) {
      console.error('Failed to apply template', error);
      toast.error('Could not apply template');
    } finally {
      setApplyTemplateLoading(false);
    }
  };
  const handleCreateAccount = async () => {
    if (!selectedTenantId || !selectedChartId) return;

    if (!formState.name.trim() || !formState.code.trim()) {
      toast.error('Account name and code are required');
      return;
    }

    try {
      setSubmitting(true);
      const hierarchyPath = formState.parentId
        ? `${formState.parentId}/${formState.code}`
        : formState.code;

      await chartService.createAccount(selectedTenantId, {
        chartId: selectedChartId,
        code: formState.code.trim(),
        name: formState.name.trim(),
        type: formState.type,
        description: formState.description,
        hierarchy: {
          parentId: formState.parentId ?? null,
          path: hierarchyPath,
          depth: hierarchyPath.split('/').length - 1,
        },
        metadata: {
          normalBalance: inferNormalBalance(formState.type),
          isPostingAllowed: true,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toast.success('Account created');
      setShowNewAccount(false);
      const updated = await chartService.getAccounts(selectedTenantId, selectedChartId);
      setAccounts(updated);
    } catch (error) {
      console.error('Failed to create account', error);
      toast.error('Could not create account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenBankAccountDrawer = (account: AccountRecord) => {
    const baseCurrency =
      currentChart?.currency ?? account.metadata?.banking?.preferredCurrency ?? '';

    setLinkingAccount(account);
    const defaults = createDefaultBankAccountForm(baseCurrency);
    defaults.nickname = account.name;
    defaults.currency = baseCurrency;
    defaults.isPrimary = !bankAccounts.some((item) => item.isPrimary);
    setBankAccountForm(defaults);
    setShowBankDrawer(true);
  };

  const handleSubmitBankAccount = async () => {
    if (!selectedTenantId || !linkingAccount) return;

    if (!user?.uid) {
      toast.error('Please sign in again to manage bank accounts.');
      return;
    }

    if (!bankAccountForm.bankName.trim() || !bankAccountForm.accountNumber.trim()) {
      toast.error('Bank name and account number are required');
      return;
    }

    const currency =
      (bankAccountForm.currency || currentChart?.currency || '').trim();

    if (!currency) {
      toast.error('Currency is required');
      return;
    }

    const openingBalance = bankAccountForm.openingBalance
      ? Number(bankAccountForm.openingBalance)
      : 0;

    if (Number.isNaN(openingBalance)) {
      toast.error('Opening balance must be a valid number');
      return;
    }

    const balanceAsOfDate = bankAccountForm.balanceAsOf
      ? new Date(bankAccountForm.balanceAsOf)
      : undefined;

    if (balanceAsOfDate && Number.isNaN(balanceAsOfDate.getTime())) {
      toast.error('Balance as of date is invalid');
      return;
    }

    try {
      setBankAccountSubmitting(true);

      const created = await bankAccountService.createBankAccount(
        selectedTenantId,
        {
          name: bankAccountForm.nickname.trim() || linkingAccount.name,
          accountNumber: bankAccountForm.accountNumber.trim(),
          accountType: bankAccountForm.accountType,
          bankName: bankAccountForm.bankName.trim(),
          branch: bankAccountForm.branch.trim() || undefined,
          country: bankAccountForm.country.trim() || undefined,
          currency,
          glAccountId: linkingAccount.id,
          isPrimary: bankAccountForm.isPrimary,
          status: 'active',
          signatories: [],
          balance: {
            ledger: openingBalance,
            currency,
            asOf: balanceAsOfDate,
          },
          integration: undefined,
          lastReconciledAt: balanceAsOfDate,
          lastStatementAt: balanceAsOfDate,
          metadata: {
            nickname: bankAccountForm.nickname.trim() || linkingAccount.name,
          },
        },
        user.uid
      );

      const updatedMetadata = {
        ...(linkingAccount.metadata ?? {}),
        banking: {
          enabled: true,
          bankAccountId: created.id,
          preferredCurrency: currency,
        },
      };

      await chartService.updateAccount(linkingAccount.id, { metadata: updatedMetadata });

      setAccounts((prev) =>
        prev.map((account) =>
          account.id === linkingAccount.id
            ? { ...account, metadata: updatedMetadata }
            : account
        )
      );

      const refreshedBankAccounts = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
      setBankAccounts(refreshedBankAccounts);

      toast.success('Bank account linked');
      setShowBankDrawer(false);
      setLinkingAccount(null);
      setBankAccountForm(createDefaultBankAccountForm(currency));
    } catch (error) {
      console.error('Failed to create bank account', error);
      toast.error('Could not create bank account');
    } finally {
      setBankAccountSubmitting(false);
    }
  };


  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']} requireCompany={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100">
        <PageHeader
          title="Chart of accounts"
          subtitle={currentCompany ? `Managing ${currentCompany.name}` : 'Select a company to manage accounts'}
          backHref="/dashboard"
          breadcrumbs={[
            { label: 'Admin', href: '/dashboard' },
            { label: 'Accounting' },
            { label: 'Chart of accounts' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <select
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600"
                value={selectedTemplateId ?? ''}
                onChange={(event) => setSelectedTemplateId(event.target.value || null)}
              >
                {AVAILABLE_CHART_TEMPLATES.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleApplyTemplate}
                disabled={applyTemplateLoading || !selectedTemplateId}
              >
                <BookOpenCheck className={cn('h-4 w-4', applyTemplateLoading && 'animate-spin')} />
                Apply template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!selectedTenantId || !selectedChartId) return;
                  setLoadingAccounts(true);
                  try {
                    const refreshed = await chartService.getAccounts(selectedTenantId, selectedChartId);
                    setAccounts(refreshed);
                    toast.success('Accounts refreshed');
                  } catch (error) {
                    console.error('Failed to reload accounts', error);
                    toast.error('Could not refresh accounts');
                  } finally {
                    setLoadingAccounts(false);
                  }
                }}
                disabled={loadingAccounts}
              >
                <RefreshCw className={cn('h-4 w-4', loadingAccounts && 'animate-spin')} />
                Refresh
              </Button>
              <Button size="sm" onClick={handleOpenNewAccount} disabled={!selectedChartId}>
                <Plus className="h-4 w-4" />
                New account
              </Button>
            </div>
          }
        />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard
              icon={<Layers className="h-5 w-5" />}
              title="Accounts"
              value={stats.total}
              hint={`${stats.active} active`}
            />
            <StatCard
              icon={<BookOpenCheck className="h-5 w-5" />}
              title="Chart"
              value={currentChart ? currentChart.name : 'No chart'}
              hint={currentChart ? currentChart.currency : ''}
            />
            <StatCard
              icon={<Filter className="h-5 w-5" />}
              title="Filtered"
              value={filteredAccounts.length}
              hint="Matching current filters"
            />
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-1 lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={selectedTenantId ?? ''}
                    onChange={(event) => {
                      setSelectedTenantId(event.target.value || null);
                      setSelectedChartId(null);
                    }}
                  >
                    {companies.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Chart</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={selectedChartId ?? ''}
                    onChange={(event) => setSelectedChartId(event.target.value || null)}
                    disabled={loadingCharts || charts.length === 0}
                  >
                    {charts.map((chart) => (
                      <option key={chart.id} value={chart.id}>
                        {chart.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1 lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search by code or name"
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-1 lg:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as 'all' | AccountType)}
                  >
                    <option value="all">All types</option>
                    <option value="asset">Assets</option>
                    <option value="liability">Liabilities</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expenses</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <AccountsTable
            accounts={filteredAccounts}
            loading={loadingAccounts}
            bankAccountMap={bankAccountByGlId}
            linkingDisabled={loadingBankAccounts}
            onLinkBankAccount={handleOpenBankAccountDrawer}
            onToggleActive={async (id, next) => {
              try {
                await chartService.toggleAccountStatus(id, next);
                setAccounts((prev) => prev.map((account) => (account.id === id ? { ...account, isActive: next } : account)));
              } catch (error) {
                console.error('Failed to update account status', error);
                toast.error('Could not update account status');
              }
            }}
          />
        </main>
      </div>

      {showNewAccount && (
        <NewAccountDrawer
          formState={formState}
          onChange={setFormState}
          onClose={() => setShowNewAccount(false)}
          onSubmit={handleCreateAccount}
          submitting={submitting}
          parentOptions={accounts}
        />
      )}

      {showBankDrawer && linkingAccount && (
        <BankAccountDrawer
          account={linkingAccount}
          formState={bankAccountForm}
          onChange={setBankAccountForm}
          onClose={() => {
            setShowBankDrawer(false);
            setLinkingAccount(null);
            setBankAccountForm(createDefaultBankAccountForm(currentChart?.currency));
          }}
          onSubmit={handleSubmitBankAccount}
          submitting={bankAccountSubmitting}
        />
      )}
    </ProtectedRoute>
  );
}

function inferNormalBalance(type: AccountType) {
  if (type === 'asset' || type === 'expense') return 'debit';
  return 'credit';
}

interface StatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, hint, icon }: StatCardProps) {
  return (
    <Card className="border border-gray-100 bg-white">
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          {hint && <p className="text-xs text-gray-500">{hint}</p>}
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

interface AccountsTableProps {
  accounts: AccountRecord[];
  loading: boolean;
  bankAccountMap: Record<string, BankAccount>;
  linkingDisabled?: boolean;
  onLinkBankAccount: (account: AccountRecord) => void;
  onToggleActive: (id: string, next: boolean) => Promise<void>;
}

function AccountsTable({ accounts, loading, bankAccountMap, linkingDisabled, onLinkBankAccount, onToggleActive }: AccountsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading accounts…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-dashed border-gray-200 bg-white">
        <CardContent className="flex h-64 flex-col items-center justify-center text-center text-sm text-gray-500">
          <Layers className="mb-3 h-10 w-10 text-gray-300" />
          <p>No accounts match your filters.</p>
          <p className="text-xs">Adjust your filters or add a new account.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100 bg-white">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Normal balance</th>
                <th className="px-4 py-3">Bank linkage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {accounts.map((account) => {
                const linkedBankAccount = bankAccountMap[account.id];
                const isBankingEnabled = account.metadata?.banking?.enabled;
                const hasBankLink = Boolean(linkedBankAccount);
                return (
                  <tr key={account.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">{account.code}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{account.name}</div>
                      {account.description && (
                        <div className="text-xs text-gray-500">{account.description}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700 capitalize">{account.type}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {account.metadata?.normalBalance === 'credit' ? 'Credit' : 'Debit'}
                    </td>
                    <td className="px-4 py-3">
                      {hasBankLink ? (
                        <Badge variant="success" size="sm">Linked</Badge>
                      ) : isBankingEnabled ? (
                        <Badge variant="warning" size="sm">Needs attention</Badge>
                      ) : (
                        <Badge variant="secondary" size="sm">Not linked</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={account.isActive ? 'success' : 'secondary'} size="sm">
                        {account.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {!hasBankLink && account.type === 'asset' && (
                          <button
                            type="button"
                            onClick={() => onLinkBankAccount(account)}
                            disabled={linkingDisabled}
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 disabled:hover:text-gray-400"
                          >
                            Link bank account
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleActive(account.id, !account.isActive)}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                        >
                          {account.isActive ? 'Archive' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface NewAccountDrawerProps {
  formState: AccountFormState;
  onChange: (state: AccountFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  parentOptions: AccountRecord[];
}

function NewAccountDrawer({ formState, onChange, onClose, onSubmit, submitting, parentOptions }: NewAccountDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-black/40 backdrop-blur-sm md:block" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">New account</p>
            <h2 className="text-lg font-semibold text-gray-900">Add a chart account</h2>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="grid gap-4">
            <Input
              label="Account name"
              placeholder="e.g. Cash and cash equivalents"
              value={formState.name}
              onChange={(event) => onChange({ ...formState, name: event.target.value })}
            />
            <Input
              label="Account code"
              placeholder="e.g. 1000"
              value={formState.code}
              onChange={(event) => onChange({ ...formState, code: event.target.value })}
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account type</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={formState.type}
                onChange={(event) => onChange({ ...formState, type: event.target.value as AccountType })}
              >
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Parent account (optional)</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={formState.parentId ?? ''}
                onChange={(event) => onChange({ ...formState, parentId: event.target.value || null })}
              >
                <option value="">No parent</option>
                {parentOptions.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} · {account.name}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Description"
              placeholder="Describe how this account is used"
              value={formState.description ?? ''}
              onChange={(event) => onChange({ ...formState, description: event.target.value })}
            />
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={submitting} disabled={submitting}>
            Create account
          </Button>
        </div>
      </div>
    </div>
  );
}


interface BankAccountDrawerProps {
  account: AccountRecord;
  formState: BankAccountFormState;
  onChange: (state: BankAccountFormState) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

function BankAccountDrawer({ account, formState, onChange, onClose, onSubmit, submitting }: BankAccountDrawerProps) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="hidden flex-1 bg-black/40 backdrop-blur-sm md:block" onClick={onClose} />
      <div className="w-full max-w-md bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Link bank account</p>
            <h2 className="text-lg font-semibold text-gray-900">{account.code} · {account.name}</h2>
          </div>
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">
            Close
          </button>
        </div>
        <div className="space-y-4 px-6 py-6">
          <div className="grid gap-4">
            <Input
              label="Display name"
              placeholder="e.g. Main operating account"
              value={formState.nickname}
              onChange={(event) => onChange({ ...formState, nickname: event.target.value })}
            />
            <Input
              label="Bank name"
              placeholder="e.g. First National Bank"
              value={formState.bankName}
              onChange={(event) => onChange({ ...formState, bankName: event.target.value })}
            />
            <Input
              label="Account number"
              placeholder="e.g. 1234567890"
              value={formState.accountNumber}
              onChange={(event) => onChange({ ...formState, accountNumber: event.target.value })}
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account type</label>
              <select
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                value={formState.accountType}
                onChange={(event) =>
                  onChange({ ...formState, accountType: event.target.value as BankAccountType })
                }
              >
                {BANK_ACCOUNT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Currency"
              placeholder="e.g. USD"
              value={formState.currency}
              onChange={(event) => onChange({ ...formState, currency: event.target.value.toUpperCase() })}
            />
            <Input
              label="Branch (optional)"
              value={formState.branch}
              onChange={(event) => onChange({ ...formState, branch: event.target.value })}
            />
            <Input
              label="Country (optional)"
              value={formState.country}
              onChange={(event) => onChange({ ...formState, country: event.target.value })}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Opening balance"
                type="number"
                placeholder="0.00"
                value={formState.openingBalance}
                onChange={(event) => onChange({ ...formState, openingBalance: event.target.value })}
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Balance as of</label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={formState.balanceAsOf}
                  onChange={(event) => onChange({ ...formState, balanceAsOf: event.target.value })}
                />
              </div>
            </div>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formState.isPrimary}
                onChange={(event) => onChange({ ...formState, isPrimary: event.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              Set as primary bank account
            </label>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={submitting} disabled={submitting}>
            Link account
          </Button>
        </div>
      </div>
    </div>
  );
}

