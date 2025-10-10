'use client';

import { useEffect, useState, useMemo } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { bankAccountService } from '@/lib/firebase';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { ChartOfAccountsService } from '@/lib/accounting/chart-of-accounts-service';
import { useAuth } from '@/contexts/AuthContext';
import {
  BankAccount,
  BankAccountType,
  BankAccountStatus,
  BankSignatory,
  BankTransfer,
  TransferType
} from '@/types/accounting/bank-account';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { Company } from '@/types/auth';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Filter,
  Building2,
  CreditCard,
  RefreshCw,
  Users,
  ArrowUpDown,
  Eye,
  Edit3,
  Archive,
  Trash2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building,
  Phone,
  Mail,
  Shield,
  UserPlus,
  Send,
  FileText,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const companiesService = new CompaniesService();
const chartService = new ChartOfAccountsService();

interface BankAccountFormState {
  name: string;
  accountNumber: string;
  accountType: BankAccountType;
  bankName: string;
  branch: string;
  branchCode: string;
  country: string;
  currency: string;
  glAccountId: string;
  isPrimary: boolean;
  balance: {
    ledger: string;
    available: string;
    asOf: string;
  };
  approvalThreshold: string;
}

interface SignatoryFormState {
  name: string;
  email: string;
  phone: string;
  role: 'preparer' | 'approver' | 'administrator' | 'viewer';
  approvalLimit: string;
  requiresTwoFactor: boolean;
}

interface TransferFormState {
  type: TransferType;
  fromAccountId: string;
  toAccountId: string;
  toAccountName: string;
  toAccountNumber: string;
  toBankName: string;
  amount: string;
  currency: string;
  description: string;
  reference: string;
  scheduledDate: string;
  routingNumber: string;
  swiftCode: string;
}

const defaultBankAccountForm = (currency = ''): BankAccountFormState => ({
  name: '',
  accountNumber: '',
  accountType: 'checking',
  bankName: '',
  branch: '',
  branchCode: '',
  country: '',
  currency: currency,
  glAccountId: '',
  isPrimary: false,
  balance: {
    ledger: '0',
    available: '',
    asOf: new Date().toISOString().slice(0, 10),
  },
  approvalThreshold: '',
});

const defaultSignatoryForm: SignatoryFormState = {
  name: '',
  email: '',
  phone: '',
  role: 'viewer',
  approvalLimit: '',
  requiresTwoFactor: false,
};

const defaultTransferForm: TransferFormState = {
  type: 'internal',
  fromAccountId: '',
  toAccountId: '',
  toAccountName: '',
  toAccountNumber: '',
  toBankName: '',
  amount: '',
  currency: '',
  description: '',
  reference: '',
  scheduledDate: '',
  routingNumber: '',
  swiftCode: '',
};

const BANK_ACCOUNT_TYPES: { value: BankAccountType; label: string; icon: React.ReactNode }[] = [
  { value: 'checking', label: 'Checking', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'savings', label: 'Savings', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'cash', label: 'Cash', icon: <DollarSign className="h-4 w-4" /> },
  { value: 'credit-card', label: 'Credit Card', icon: <CreditCard className="h-4 w-4" /> },
  { value: 'loan', label: 'Loan', icon: <Building className="h-4 w-4" /> },
  { value: 'investment', label: 'Investment', icon: <TrendingUp className="h-4 w-4" /> },
  { value: 'other', label: 'Other', icon: <Building2 className="h-4 w-4" /> },
];

const SIGNATORY_ROLES = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'preparer', label: 'Preparer' },
  { value: 'approver', label: 'Approver' },
  { value: 'administrator', label: 'Administrator' },
] as const;

const TRANSFER_TYPES = [
  { value: 'internal', label: 'Internal Transfer' },
  { value: 'external', label: 'External Transfer' },
  { value: 'wire', label: 'Wire Transfer' },
  { value: 'ach', label: 'ACH Transfer' },
  { value: 'check', label: 'Check' },
] as const;

export default function BankAccountsAdminPage() {
  const { user, company, hasRole } = useAuth();

  // State management
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [glAccounts, setGlAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BankAccountStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | BankAccountType>('all');

  // Dialog states
  const [showNewAccountDialog, setShowNewAccountDialog] = useState(false);
  const [showEditAccountDialog, setShowEditAccountDialog] = useState(false);
  const [showSignatoryDialog, setShowSignatoryDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

  // Form states
  const [accountForm, setAccountForm] = useState<BankAccountFormState>(() => defaultBankAccountForm());
  const [signatoryForm, setSignatoryForm] = useState<SignatoryFormState>(defaultSignatoryForm);
  const [transferForm, setTransferForm] = useState<TransferFormState>(defaultTransferForm);
  const [submitting, setSubmitting] = useState(false);
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Load data
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

    const loadData = async () => {
      try {
        setLoading(true);
        const [accounts, glAccountsData] = await Promise.all([
          bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true }),
          loadGLAccounts(selectedTenantId),
        ]);
        setBankAccounts(accounts);
        setGlAccounts(glAccountsData);
      } catch (error) {
        console.error('Failed to load data', error);
        toast.error('Could not load bank accounts');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedTenantId]);

  const loadGLAccounts = async (companyId: string): Promise<AccountRecord[]> => {
    try {
      // Load from company-scoped chart of accounts subcollection
      const { collection, query: firestoreQuery, where, orderBy: firestoreOrderBy, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');

      const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
      const accountsQuery = firestoreQuery(
        accountsRef,
        where('type', '==', 'asset'),
        where('isActive', '==', true),
        firestoreOrderBy('code')
      );

      const snapshot = await getDocs(accountsQuery);
      const accounts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AccountRecord[];

      console.log(`[Bank Accounts] Loaded ${accounts.length} GL accounts for company ${companyId}`);
      return accounts;
    } catch (error) {
      console.error('Failed to load GL accounts', error);
      toast.error('Could not load GL accounts. Please ensure Chart of Accounts is set up for this company.');
      return [];
    }
  };

  // Computed values
  const filteredAccounts = useMemo(() => {
    const normalized = searchTerm.toLowerCase();
    return bankAccounts.filter((account) => {
      const matchesSearch =
        !normalized ||
        account.name.toLowerCase().includes(normalized) ||
        account.bankName.toLowerCase().includes(normalized) ||
        account.accountNumber.includes(normalized) ||
        account.accountNumberMasked?.toLowerCase().includes(normalized);

      const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
      const matchesType = typeFilter === 'all' || account.accountType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [bankAccounts, searchTerm, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance.ledger, 0);
    const totalAvailable = bankAccounts.reduce((sum, acc) => sum + (acc.balance.available || acc.balance.ledger), 0);
    const activeCount = bankAccounts.filter(acc => acc.status === 'active').length;

    return {
      totalBalance,
      totalAvailable,
      activeCount,
      totalCount: bankAccounts.length,
    };
  }, [bankAccounts]);

  const currentCompany = companies.find((item) => item.id === selectedTenantId);

  // Event handlers
  const handleCreateAccount = async () => {
    if (!selectedTenantId || !user?.uid) return;

    setValidationAttempted(true);

    // Validation
    const errors: string[] = [];
    if (!accountForm.name.trim()) errors.push('Account name');
    if (!accountForm.accountNumber.trim()) errors.push('Account number');
    if (!accountForm.bankName.trim()) errors.push('Bank name');
    if (!accountForm.glAccountId) errors.push('GL account');

    if (errors.length > 0) {
      toast.error(`Please fill in required fields: ${errors.join(', ')}`, {
        duration: 5000,
        icon: '⚠️',
      });
      return;
    }

    try {
      setSubmitting(true);

      const balanceAsOf = accountForm.balance.asOf ? new Date(accountForm.balance.asOf) : new Date();

      // Build account data, only including fields with actual values
      const accountData: any = {
        name: accountForm.name.trim(),
        accountNumber: accountForm.accountNumber.trim(),
        accountType: accountForm.accountType,
        bankName: accountForm.bankName.trim(),
        currency: accountForm.currency.trim(),
        glAccountId: accountForm.glAccountId,
        isPrimary: accountForm.isPrimary,
        status: 'active',
        signatories: [],
        balance: {
          ledger: Number(accountForm.balance.ledger) || 0,
          currency: accountForm.currency.trim(),
          asOf: balanceAsOf,
        },
      };

      // Only add optional fields if they have values
      if (accountForm.branch.trim()) accountData.branch = accountForm.branch.trim();
      if (accountForm.branchCode.trim()) accountData.branchCode = accountForm.branchCode.trim();
      if (accountForm.country.trim()) accountData.country = accountForm.country.trim();
      if (accountForm.balance.available) {
        accountData.balance.available = Number(accountForm.balance.available);
      }
      if (accountForm.approvalThreshold) {
        accountData.approvalThreshold = Number(accountForm.approvalThreshold);
      }

      await bankAccountService.createBankAccount(
        selectedTenantId,
        accountData,
        user.uid
      );

      const refreshedAccounts = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
      setBankAccounts(refreshedAccounts);

      toast.success('Bank account created successfully');
      setShowNewAccountDialog(false);
      setAccountForm(defaultBankAccountForm());
      setValidationAttempted(false);
    } catch (error) {
      console.error('Failed to create bank account', error);
      toast.error('Could not create bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAccount = (account: BankAccount) => {
    // Populate form with account data
    setAccountForm({
      name: account.name,
      accountNumber: account.accountNumber,
      accountType: account.accountType,
      bankName: account.bankName,
      branch: account.branch || '',
      branchCode: account.branchCode || '',
      country: account.country || '',
      currency: account.currency,
      glAccountId: account.glAccountId,
      isPrimary: account.isPrimary,
      balance: {
        ledger: account.balance.ledger.toString(),
        available: account.balance.available?.toString() || '',
        asOf: account.balance.asOf
          ? new Date(account.balance.asOf).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      },
      approvalThreshold: account.approvalThreshold?.toString() || '',
    });
    setSelectedAccount(account);
    setShowEditAccountDialog(true);
  };

  const handleUpdateAccount = async () => {
    if (!selectedTenantId || !user?.uid || !selectedAccount) return;

    setValidationAttempted(true);

    // Validation
    const errors: string[] = [];
    if (!accountForm.name.trim()) errors.push('Account name');
    if (!accountForm.accountNumber.trim()) errors.push('Account number');
    if (!accountForm.bankName.trim()) errors.push('Bank name');
    if (!accountForm.glAccountId) errors.push('GL account');

    if (errors.length > 0) {
      toast.error(`Please fill in required fields: ${errors.join(', ')}`, {
        duration: 5000,
        icon: '⚠️',
      });
      return;
    }

    try {
      setSubmitting(true);

      const balanceAsOf = accountForm.balance.asOf ? new Date(accountForm.balance.asOf) : new Date();

      // Build update data
      const updateData: any = {
        name: accountForm.name.trim(),
        accountNumber: accountForm.accountNumber.trim(),
        accountType: accountForm.accountType,
        bankName: accountForm.bankName.trim(),
        currency: accountForm.currency.trim(),
        glAccountId: accountForm.glAccountId,
        isPrimary: accountForm.isPrimary,
        balance: {
          ledger: Number(accountForm.balance.ledger) || 0,
          currency: accountForm.currency.trim(),
          asOf: balanceAsOf,
        },
        updatedBy: user.uid,
      };

      // Only add optional fields if they have values
      if (accountForm.branch.trim()) {
        updateData.branch = accountForm.branch.trim();
      }
      if (accountForm.branchCode.trim()) {
        updateData.branchCode = accountForm.branchCode.trim();
      }
      if (accountForm.country.trim()) {
        updateData.country = accountForm.country.trim();
      }
      if (accountForm.balance.available) {
        updateData.balance.available = Number(accountForm.balance.available);
      }
      if (accountForm.approvalThreshold) {
        updateData.approvalThreshold = Number(accountForm.approvalThreshold);
      }

      await bankAccountService.updateBankAccount(
        selectedTenantId,
        selectedAccount.id,
        updateData
      );

      const refreshedAccounts = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
      setBankAccounts(refreshedAccounts);

      toast.success('Bank account updated successfully');
      setShowEditAccountDialog(false);
      setAccountForm(defaultBankAccountForm());
      setSelectedAccount(null);
      setValidationAttempted(false);
    } catch (error) {
      console.error('Failed to update bank account', error);
      toast.error('Could not update bank account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSignatory = async () => {
    if (!selectedAccount || !user?.uid) return;

    // Validation
    if (!signatoryForm.name.trim() || !signatoryForm.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    try {
      setSubmitting(true);

      const newSignatory: BankSignatory = {
        id: `sig_${Date.now()}`,
        name: signatoryForm.name.trim(),
        email: signatoryForm.email.trim(),
        phone: signatoryForm.phone.trim() || undefined,
        role: signatoryForm.role,
        approvalLimit: signatoryForm.approvalLimit ? Number(signatoryForm.approvalLimit) : undefined,
        requiresTwoFactor: signatoryForm.requiresTwoFactor,
      };

      const updatedSignatories = [...selectedAccount.signatories, newSignatory];

      await bankAccountService.updateBankAccount(
        selectedTenantId!,
        selectedAccount.id,
        {
          signatories: updatedSignatories,
          updatedBy: user.uid,
        }
      );

      const refreshedAccounts = await bankAccountService.listBankAccounts(selectedTenantId!, { includeInactive: true });
      setBankAccounts(refreshedAccounts);
      setSelectedAccount(refreshedAccounts.find(acc => acc.id === selectedAccount.id) || null);

      toast.success('Signatory added successfully');
      setSignatoryForm(defaultSignatoryForm);
    } catch (error) {
      console.error('Failed to add signatory', error);
      toast.error('Could not add signatory');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveSignatory = async (signatoryId: string) => {
    if (!selectedAccount || !user?.uid) return;

    try {
      const updatedSignatories = selectedAccount.signatories.filter(sig => sig.id !== signatoryId);

      await bankAccountService.updateBankAccount(
        selectedTenantId!,
        selectedAccount.id,
        {
          signatories: updatedSignatories,
          updatedBy: user.uid,
        }
      );

      const refreshedAccounts = await bankAccountService.listBankAccounts(selectedTenantId!, { includeInactive: true });
      setBankAccounts(refreshedAccounts);
      setSelectedAccount(refreshedAccounts.find(acc => acc.id === selectedAccount.id) || null);

      toast.success('Signatory removed successfully');
    } catch (error) {
      console.error('Failed to remove signatory', error);
      toast.error('Could not remove signatory');
    }
  };

  const handleStatusChange = async (accountId: string, newStatus: BankAccountStatus) => {
    if (!user?.uid || !selectedTenantId) return;

    try {
      await bankAccountService.updateBankAccount(
        selectedTenantId,
        accountId,
        {
          status: newStatus,
          updatedBy: user.uid,
        }
      );

      const refreshedAccounts = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
      setBankAccounts(refreshedAccounts);

      toast.success(`Account ${newStatus === 'active' ? 'activated' : newStatus === 'inactive' ? 'archived' : 'closed'} successfully`);
    } catch (error) {
      console.error('Failed to update account status', error);
      toast.error('Could not update account status');
    }
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']} requireCompany={false}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-slate-100">
        <PageHeader
          title="Bank accounts"
          subtitle={currentCompany ? `Managing ${currentCompany.name}` : 'Select a company to manage accounts'}
          backHref="/dashboard"
          breadcrumbs={[
            { label: 'Admin', href: '/dashboard' },
            { label: 'Banking' },
            { label: 'Bank accounts' },
          ]}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!selectedTenantId) return;
                  setLoading(true);
                  try {
                    const refreshed = await bankAccountService.listBankAccounts(selectedTenantId, { includeInactive: true });
                    setBankAccounts(refreshed);
                    toast.success('Bank accounts refreshed');
                  } catch (error) {
                    console.error('Failed to reload accounts', error);
                    toast.error('Could not refresh accounts');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
                Refresh
              </Button>
              <Button
                size="sm"
                onClick={() => setShowNewAccountDialog(true)}
                disabled={!selectedTenantId}
              >
                <Plus className="h-4 w-4" />
                New account
              </Button>
            </div>
          }
        />

        <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <StatCard
              icon={<Building2 className="h-5 w-5" />}
              title="Total accounts"
              value={stats.totalCount}
              hint={`${stats.activeCount} active`}
            />
            <StatCard
              icon={<DollarSign className="h-5 w-5" />}
              title="Total balance"
              value={`$${stats.totalBalance.toLocaleString()}`}
              hint="Ledger balance"
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5" />}
              title="Available funds"
              value={`$${stats.totalAvailable.toLocaleString()}`}
              hint="Available balance"
            />
            <StatCard
              icon={<Filter className="h-5 w-5" />}
              title="Filtered"
              value={filteredAccounts.length}
              hint="Matching filters"
            />
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid gap-4 lg:grid-cols-5">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Company</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={selectedTenantId ?? ''}
                    onChange={(event) => setSelectedTenantId(event.target.value || null)}
                  >
                    {companies.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Search</label>
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search accounts..."
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | BankAccountStatus)}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type</label>
                  <select
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    value={typeFilter}
                    onChange={(event) => setTypeFilter(event.target.value as 'all' | BankAccountType)}
                  >
                    <option value="all">All types</option>
                    {BANK_ACCOUNT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts Table */}
          <BankAccountsTable
            accounts={filteredAccounts}
            loading={loading}
            onStatusChange={handleStatusChange}
            onEditAccount={handleEditAccount}
            onManageSignatories={(account) => {
              setSelectedAccount(account);
              setShowSignatoryDialog(true);
            }}
            onInitiateTransfer={(account) => {
              setSelectedAccount(account);
              setTransferForm({
                ...defaultTransferForm,
                fromAccountId: account.id,
                currency: account.currency,
              });
              setShowTransferDialog(true);
            }}
          />
        </main>
      </div>

      {/* New Account Dialog */}
      <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create new bank account</DialogTitle>
          </DialogHeader>
          <BankAccountForm
            form={accountForm}
            onChange={setAccountForm}
            glAccounts={glAccounts}
            onSubmit={handleCreateAccount}
            submitting={submitting}
            validationAttempted={validationAttempted}
            mode="create"
            onCancel={() => {
              setShowNewAccountDialog(false);
              setAccountForm(defaultBankAccountForm());
              setValidationAttempted(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Account Dialog */}
      <Dialog open={showEditAccountDialog} onOpenChange={setShowEditAccountDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit bank account</DialogTitle>
          </DialogHeader>
          <BankAccountForm
            form={accountForm}
            onChange={setAccountForm}
            glAccounts={glAccounts}
            onSubmit={handleUpdateAccount}
            submitting={submitting}
            validationAttempted={validationAttempted}
            mode="edit"
            onCancel={() => {
              setShowEditAccountDialog(false);
              setAccountForm(defaultBankAccountForm());
              setSelectedAccount(null);
              setValidationAttempted(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Signatory Management Dialog */}
      <Dialog open={showSignatoryDialog} onOpenChange={setShowSignatoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Manage signatories - {selectedAccount?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <SignatoryManager
              account={selectedAccount}
              signatoryForm={signatoryForm}
              onSignatoryFormChange={setSignatoryForm}
              onAddSignatory={handleAddSignatory}
              onRemoveSignatory={handleRemoveSignatory}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Initiate transfer - {selectedAccount?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <TransferWorkflow
              account={selectedAccount}
              bankAccounts={bankAccounts}
              transferForm={transferForm}
              onTransferFormChange={setTransferForm}
              onCancel={() => setShowTransferDialog(false)}
              submitting={submitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}

// Individual Components

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

interface BankAccountsTableProps {
  accounts: BankAccount[];
  loading: boolean;
  onStatusChange: (accountId: string, newStatus: BankAccountStatus) => void;
  onManageSignatories: (account: BankAccount) => void;
  onInitiateTransfer: (account: BankAccount) => void;
  onEditAccount: (account: BankAccount) => void;
}

function BankAccountsTable({
  accounts,
  loading,
  onStatusChange,
  onManageSignatories,
  onInitiateTransfer,
  onEditAccount,
}: BankAccountsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading bank accounts…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (accounts.length === 0) {
    return (
      <Card className="border-dashed border-gray-200 bg-white">
        <CardContent className="flex h-64 flex-col items-center justify-center text-center text-sm text-gray-500">
          <Building2 className="mb-3 h-10 w-10 text-gray-300" />
          <p>No bank accounts match your filters.</p>
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
                <th className="px-4 py-3">Account</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Currency</th>
                <th className="px-4 py-3">Signatories</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {accounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                        {BANK_ACCOUNT_TYPES.find(t => t.value === account.accountType)?.icon || <Building2 className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {account.name}
                          {account.isPrimary && (
                            <Badge variant="success" size="sm">Primary</Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {account.accountNumberMasked || account.accountNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" size="sm">
                      {BANK_ACCOUNT_TYPES.find(t => t.value === account.accountType)?.label || account.accountType}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{account.bankName}</div>
                    {account.branch && (
                      <div className="text-xs text-gray-500">{account.branch}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-gray-900">
                      {account.balance.ledger.toLocaleString('en-US', {
                        style: 'currency',
                        currency: account.currency || 'USD',
                      })}
                    </div>
                    {account.balance.available !== undefined && account.balance.available !== account.balance.ledger && (
                      <div className="text-xs text-gray-500">
                        Available: {account.balance.available.toLocaleString('en-US', {
                          style: 'currency',
                          currency: account.currency || 'USD',
                        })}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">
                      {account.currency}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {account.signatories.length}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        account.status === 'active'
                          ? 'success'
                          : account.status === 'inactive'
                          ? 'warning'
                          : 'secondary'
                      }
                      size="sm"
                    >
                      {account.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditAccount(account)}
                        className="h-8 w-8 p-0"
                        title="Edit account"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onManageSignatories(account)}
                        className="h-8 w-8 p-0"
                        title="Manage signatories"
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      {account.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onInitiateTransfer(account)}
                          className="h-8 w-8 p-0"
                          title="Initiate transfer"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      <select
                        className="ml-2 rounded border border-gray-200 bg-white px-2 py-1 text-xs"
                        value={account.status}
                        onChange={(e) => onStatusChange(account.id, e.target.value as BankAccountStatus)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

interface BankAccountFormProps {
  form: BankAccountFormState;
  onChange: (form: BankAccountFormState) => void;
  glAccounts: AccountRecord[];
  onSubmit: () => void;
  onCancel: () => void;
  submitting: boolean;
  validationAttempted?: boolean;
  mode: 'create' | 'edit';
}

function BankAccountForm({
  form,
  onChange,
  glAccounts,
  onSubmit,
  onCancel,
  submitting,
  validationAttempted = false,
  mode,
}: BankAccountFormProps) {
  const hasError = (fieldValue: string) => validationAttempted && !fieldValue.trim();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Input
            label="Account name *"
            placeholder="e.g. Primary Checking Account"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className={hasError(form.name) ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {hasError(form.name) && (
            <p className="text-xs text-red-600 mt-1">Account name is required</p>
          )}
        </div>
        <div>
          <Input
            label="Account number *"
            placeholder="e.g. 1234567890"
            value={form.accountNumber}
            onChange={(e) => onChange({ ...form, accountNumber: e.target.value })}
            className={hasError(form.accountNumber) ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {hasError(form.accountNumber) && (
            <p className="text-xs text-red-600 mt-1">Account number is required</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Account type</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={form.accountType}
            onChange={(e) => onChange({ ...form, accountType: e.target.value as BankAccountType })}
          >
            {BANK_ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">GL Account *</label>
          <select
            className={cn(
              "w-full rounded-lg border bg-white px-3 py-2 text-sm",
              glAccounts.length === 0 ? "border-amber-300 bg-amber-50" :
              validationAttempted && !form.glAccountId ? "border-red-500 focus:ring-red-500" :
              "border-gray-200"
            )}
            value={form.glAccountId}
            onChange={(e) => onChange({ ...form, glAccountId: e.target.value })}
          >
            <option value="">
              {glAccounts.length === 0
                ? "⚠️ No GL accounts available - Set up Chart of Accounts first"
                : "Select GL account (required)"}
            </option>
            {glAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.code} - {account.name}
              </option>
            ))}
          </select>
          {glAccounts.length === 0 && (
            <p className="text-xs text-amber-600 mt-1">
              Go to Companies → Edit Company → Reset COA to create GL accounts
            </p>
          )}
          {validationAttempted && !form.glAccountId && glAccounts.length > 0 && (
            <p className="text-xs text-red-600 mt-1">GL account is required</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Input
            label="Bank name *"
            placeholder="e.g. First National Bank"
            value={form.bankName}
            onChange={(e) => onChange({ ...form, bankName: e.target.value })}
            className={hasError(form.bankName) ? 'border-red-500 focus:ring-red-500' : ''}
          />
          {hasError(form.bankName) && (
            <p className="text-xs text-red-600 mt-1">Bank name is required</p>
          )}
        </div>
        <Input
          label="Branch (optional)"
          placeholder="e.g. Downtown Branch"
          value={form.branch}
          onChange={(e) => onChange({ ...form, branch: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Branch Code (optional)"
          placeholder="e.g. 250655"
          value={form.branchCode}
          onChange={(e) => onChange({ ...form, branchCode: e.target.value })}
        />
        <Input
          label="Country (optional)"
          placeholder="e.g. United States"
          value={form.country}
          onChange={(e) => onChange({ ...form, country: e.target.value })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Currency"
          placeholder="e.g. USD"
          value={form.currency}
          onChange={(e) => onChange({ ...form, currency: e.target.value.toUpperCase() })}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Opening balance"
          type="number"
          placeholder="0.00"
          value={form.balance.ledger}
          onChange={(e) => onChange({
            ...form,
            balance: { ...form.balance, ledger: e.target.value }
          })}
        />
        <Input
          label="Available balance (optional)"
          type="number"
          placeholder="Same as ledger"
          value={form.balance.available}
          onChange={(e) => onChange({
            ...form,
            balance: { ...form.balance, available: e.target.value }
          })}
        />
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Balance as of</label>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={form.balance.asOf}
            onChange={(e) => onChange({
              ...form,
              balance: { ...form.balance, asOf: e.target.value }
            })}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Approval threshold (optional)"
          type="number"
          placeholder="e.g. 10000"
          value={form.approvalThreshold}
          onChange={(e) => onChange({ ...form, approvalThreshold: e.target.value })}
        />
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isPrimary}
            onChange={(e) => onChange({ ...form, isPrimary: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          Set as primary account
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} loading={submitting} disabled={submitting}>
          {mode === 'create' ? 'Create account' : 'Update account'}
        </Button>
      </div>
    </div>
  );
}

interface SignatoryManagerProps {
  account: BankAccount;
  signatoryForm: SignatoryFormState;
  onSignatoryFormChange: (form: SignatoryFormState) => void;
  onAddSignatory: () => void;
  onRemoveSignatory: (signatoryId: string) => void;
  submitting: boolean;
}

function SignatoryManager({
  account,
  signatoryForm,
  onSignatoryFormChange,
  onAddSignatory,
  onRemoveSignatory,
  submitting,
}: SignatoryManagerProps) {
  return (
    <div className="space-y-6">
      {/* Current Signatories */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Current signatories</h3>
        {account.signatories.length === 0 ? (
          <Card className="border-dashed border-gray-200">
            <CardContent className="flex h-32 flex-col items-center justify-center text-center text-sm text-gray-500">
              <Users className="mb-2 h-8 w-8 text-gray-300" />
              <p>No signatories added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {account.signatories.map((signatory) => (
              <Card key={signatory.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{signatory.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        {signatory.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {signatory.email}
                          </span>
                        )}
                        {signatory.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {signatory.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" size="sm">
                      {SIGNATORY_ROLES.find(r => r.value === signatory.role)?.label || signatory.role}
                    </Badge>
                    {signatory.approvalLimit && (
                      <Badge variant="secondary" size="sm">
                        Limit: ${signatory.approvalLimit.toLocaleString()}
                      </Badge>
                    )}
                    {signatory.requiresTwoFactor && (
                      <Badge variant="success" size="sm">
                        <Shield className="h-3 w-3 mr-1" />
                        2FA
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSignatory(signatory.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add New Signatory */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Add new signatory</h3>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full name"
                placeholder="e.g. John Smith"
                value={signatoryForm.name}
                onChange={(e) => onSignatoryFormChange({ ...signatoryForm, name: e.target.value })}
              />
              <Input
                label="Email address"
                type="email"
                placeholder="e.g. john@company.com"
                value={signatoryForm.email}
                onChange={(e) => onSignatoryFormChange({ ...signatoryForm, email: e.target.value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Phone number (optional)"
                placeholder="e.g. +1 (555) 123-4567"
                value={signatoryForm.phone}
                onChange={(e) => onSignatoryFormChange({ ...signatoryForm, phone: e.target.value })}
              />
              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
                <select
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  value={signatoryForm.role}
                  onChange={(e) => onSignatoryFormChange({
                    ...signatoryForm,
                    role: e.target.value as SignatoryFormState['role']
                  })}
                >
                  {SIGNATORY_ROLES.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Approval limit (optional)"
                type="number"
                placeholder="e.g. 50000"
                value={signatoryForm.approvalLimit}
                onChange={(e) => onSignatoryFormChange({ ...signatoryForm, approvalLimit: e.target.value })}
                disabled={signatoryForm.role === 'viewer' || signatoryForm.role === 'preparer'}
              />
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={signatoryForm.requiresTwoFactor}
                  onChange={(e) => onSignatoryFormChange({ ...signatoryForm, requiresTwoFactor: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                Require two-factor authentication
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
              <Button
                onClick={onAddSignatory}
                loading={submitting}
                disabled={submitting || !signatoryForm.name.trim() || !signatoryForm.email.trim()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add signatory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface TransferWorkflowProps {
  account: BankAccount;
  bankAccounts: BankAccount[];
  transferForm: TransferFormState;
  onTransferFormChange: (form: TransferFormState) => void;
  onCancel: () => void;
  submitting: boolean;
}

function TransferWorkflow({
  account,
  bankAccounts,
  transferForm,
  onTransferFormChange,
  onCancel,
  submitting,
}: TransferWorkflowProps) {
  const availableDestinations = bankAccounts.filter(acc =>
    acc.id !== account.id && acc.status === 'active'
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-blue-800">
          <Send className="h-5 w-5" />
          <span className="font-medium">Transfer from: {account.name}</span>
        </div>
        <div className="text-sm text-blue-600 mt-1">
          Available: {account.balance.available?.toLocaleString('en-US', {
            style: 'currency',
            currency: account.currency || 'USD',
          }) || 'N/A'}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Transfer type</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={transferForm.type}
            onChange={(e) => onTransferFormChange({ ...transferForm, type: e.target.value as TransferType })}
          >
            {TRANSFER_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          label="Amount"
          type="number"
          placeholder="0.00"
          value={transferForm.amount}
          onChange={(e) => onTransferFormChange({ ...transferForm, amount: e.target.value })}
        />
      </div>

      {transferForm.type === 'internal' ? (
        <div className="space-y-1">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Destination account</label>
          <select
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            value={transferForm.toAccountId}
            onChange={(e) => {
              const selectedAccount = availableDestinations.find(acc => acc.id === e.target.value);
              onTransferFormChange({
                ...transferForm,
                toAccountId: e.target.value,
                toAccountName: selectedAccount?.name || '',
                toAccountNumber: selectedAccount?.accountNumber || '',
                currency: selectedAccount?.currency || transferForm.currency,
              });
            }}
          >
            <option value="">Select destination account</option>
            {availableDestinations.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} - {acc.accountNumberMasked} ({acc.currency})
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Destination account name"
              placeholder="e.g. John Smith"
              value={transferForm.toAccountName}
              onChange={(e) => onTransferFormChange({ ...transferForm, toAccountName: e.target.value })}
            />
            <Input
              label="Destination account number"
              placeholder="e.g. 9876543210"
              value={transferForm.toAccountNumber}
              onChange={(e) => onTransferFormChange({ ...transferForm, toAccountNumber: e.target.value })}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Destination bank name"
              placeholder="e.g. Second National Bank"
              value={transferForm.toBankName}
              onChange={(e) => onTransferFormChange({ ...transferForm, toBankName: e.target.value })}
            />
            {transferForm.type === 'ach' && (
              <Input
                label="Routing number"
                placeholder="e.g. 123456789"
                value={transferForm.routingNumber}
                onChange={(e) => onTransferFormChange({ ...transferForm, routingNumber: e.target.value })}
              />
            )}
            {transferForm.type === 'wire' && (
              <Input
                label="SWIFT code"
                placeholder="e.g. ABCDEF12"
                value={transferForm.swiftCode}
                onChange={(e) => onTransferFormChange({ ...transferForm, swiftCode: e.target.value })}
              />
            )}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Description"
          placeholder="e.g. Monthly payment"
          value={transferForm.description}
          onChange={(e) => onTransferFormChange({ ...transferForm, description: e.target.value })}
        />
        <Input
          label="Reference (optional)"
          placeholder="e.g. INV-2024-001"
          value={transferForm.reference}
          onChange={(e) => onTransferFormChange({ ...transferForm, reference: e.target.value })}
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Scheduled date (optional)</label>
        <input
          type="date"
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm md:w-auto"
          value={transferForm.scheduledDate}
          onChange={(e) => onTransferFormChange({ ...transferForm, scheduledDate: e.target.value })}
        />
      </div>

      {account.approvalThreshold && Number(transferForm.amount) >= account.approvalThreshold && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Approval required</span>
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            This transfer exceeds the approval threshold of ${account.approvalThreshold.toLocaleString()} and will require authorization.
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          loading={submitting}
          disabled={submitting || !transferForm.amount || !transferForm.description || !transferForm.toAccountName}
        >
          <Send className="h-4 w-4 mr-2" />
          Initiate transfer
        </Button>
      </div>
    </div>
  );
}