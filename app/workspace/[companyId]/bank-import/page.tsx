'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  Settings,
  History,
  TrendingUp,
  ArrowLeft,
  RefreshCw,
  Download,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  CreditCard,
  Sparkles,
  Building2,
  ChevronDown,
  Landmark,
  ClipboardList,
  Zap
} from 'lucide-react';
import { BankToLedgerImport } from '@/components/banking/BankToLedgerImport';
import { StagingReview } from '@/components/banking/StagingReview';
import BankStatementUpload from '@/components/bank-statement/BankStatementUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { bankAccountService } from '@/lib/firebase';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { IndustryTemplateService } from '@/lib/accounting/industry-template-service';
import { BankAccount } from '@/types/accounting/bank-account';
import { Company } from '@/types/auth';
import { GLMappingRule } from '@/types/accounting/bank-import';

interface ImportSession {
  id: string;
  date: string;
  status: string;
  totalTransactions: number;
  postedTransactions: number;
  totalAmount: number;
}

export default function BankImportPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const companyId = params.companyId as string;

  // Check workspace access
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'import' | 'upload' | 'staging' | 'history' | 'rules'>('import');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [importHistory, setImportHistory] = useState<ImportSession[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [mappingRules, setMappingRules] = useState<GLMappingRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [stats, setStats] = useState({
    transactionsThisMonth: 0,
    autoMappedPercentage: 0,
    totalValueThisMonth: 0,
    activeMappingRules: 0
  });

  // Load company data and bank accounts
  useEffect(() => {
    if (companyId) {
      loadCompany();
      loadBankAccounts();
      loadImportHistory();
      loadMappingRules();
    }
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const companiesService = new CompaniesService();
      const companyData = await companiesService.getCompanyById(companyId);
      setCompany(companyData);
    } catch (error) {
      console.error('Failed to load company:', error);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const accounts = await bankAccountService.listBankAccounts(companyId);
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedBankAccount) {
        setSelectedBankAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    }
  };

  const loadMappingRules = async () => {
    try {
      setLoadingRules(true);
      const templateService = new IndustryTemplateService(companyId);
      const rules = await templateService.getAllMappingRules();
      console.log(`[Bank Import] Loaded ${rules.length} GL mapping rules`);
      setMappingRules(rules);

      // Update stats with active rule count
      const activeRules = rules.filter(r => r.isActive).length;
      setStats(prev => ({ ...prev, activeMappingRules: activeRules }));
    } catch (error) {
      console.error('Failed to load mapping rules:', error);
      toast.error('Failed to load mapping rules');
    } finally {
      setLoadingRules(false);
    }
  };

  const loadImportHistory = async () => {
    try {
      // TODO: Implement real query from bankImportSessions collection
      // const sessions = await bankImportSessionService.listSessions(companyId);
      // setImportHistory(sessions);

      // For now, set empty array - real implementation coming in Phase 6
      setImportHistory([]);
      await calculateStats();
    } catch (error) {
      console.error('Failed to load import history:', error);
      setImportHistory([]);
    }
  };

  const calculateStats = async () => {
    try {
      // TODO: Query real data from Firestore
      // For now, calculate from importHistory if available
      const thisMonth = importHistory.filter(session => {
        const sessionDate = new Date(session.date);
        const now = new Date();
        return sessionDate.getMonth() === now.getMonth() &&
               sessionDate.getFullYear() === now.getFullYear();
      });

      const totalTransactions = thisMonth.reduce((sum, s) => sum + s.totalTransactions, 0);
      const totalPosted = thisMonth.reduce((sum, s) => sum + s.postedTransactions, 0);
      const totalValue = thisMonth.reduce((sum, s) => sum + s.totalAmount, 0);
      const autoMappedPct = totalTransactions > 0
        ? Math.round((totalPosted / totalTransactions) * 100)
        : 0;

      setStats(prev => ({
        ...prev,
        transactionsThisMonth: totalTransactions,
        autoMappedPercentage: autoMappedPct,
        totalValueThisMonth: totalValue
        // activeMappingRules updated by loadMappingRules()
      }));
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }
  };

  const handleImportComplete = () => {
    toast.success('Import complete! Bank transactions have been staged for review.');
    loadImportHistory();
    setActiveTab('staging'); // Switch to staging tab to review
  };

  const handlePostComplete = () => {
    toast.success('Staged transactions have been posted to the general ledger!');
    loadImportHistory();
  };

  const renderImportTab = () => (
    <div className="space-y-6">
      {bankAccounts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bank Accounts Found</h3>
          <p className="text-gray-500 mb-4 max-w-md mx-auto">
            You need to add a bank account before you can import transactions. Set up your bank account in the banking section.
          </p>
          <Button
            onClick={() => router.push(`/workspace/${companyId}/bank-accounts`)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Bank Account</label>
              <div className="relative mt-1">
                <select
                  value={selectedBankAccount}
                  onChange={(e) => setSelectedBankAccount(e.target.value)}
                  className="w-full appearance-none bg-white px-4 py-2.5 pr-10 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent cursor-pointer hover:border-gray-300 transition-colors"
                >
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {account.accountNumberMasked}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <BankToLedgerImport
            companyId={companyId}
            bankAccountId={selectedBankAccount}
            onComplete={handleImportComplete}
          />
        </>
      )}
    </div>
  );

  const renderUploadTab = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Upload className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Upload Bank Statement</h3>
          <p className="text-sm text-gray-500">Upload a PDF bank statement to extract and import transactions</p>
        </div>
      </div>
      <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-6">
        <BankStatementUpload
          companyId={companyId}
          companyName={company?.name || 'Company'}
          onUploadSuccess={() => {
            toast.success('Bank statement has been processed successfully');
            setActiveTab('import');
          }}
        />
      </div>
    </div>
  );

  const renderStagingTab = () => (
    <div className="space-y-6">
      <StagingReview
        companyId={companyId}
        onPostComplete={handlePostComplete}
      />
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <History className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Import History</h3>
            <p className="text-sm text-gray-500">View past bank import sessions</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadImportHistory} className="border-gray-200 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {importHistory.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
            <History className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Import History Yet</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Import sessions will appear here after you upload and process bank statements. Start by uploading your first statement.
          </p>
          <Button
            onClick={() => setActiveTab('upload')}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Your First Statement
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {importHistory.map((session) => (
            <div key={session.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Import Session #{session.id}</p>
                      <p className="text-xs text-gray-400">{session.date}</p>
                    </div>
                    {session.status === 'completed' ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Partial
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {session.postedTransactions} / {session.totalTransactions} transactions
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    R{session.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRulesTab = () => {
    const activeRules = mappingRules.filter(r => r.isActive);
    const inactiveRules = mappingRules.filter(r => !r.isActive);
    const patternRules = activeRules.filter(r => !r.metadata?.vendor);
    const vendorRules = activeRules.filter(r => r.metadata?.vendor);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Zap className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">GL Mapping Rules</h3>
              <p className="text-sm text-gray-500">
                {mappingRules.length} total rules ({activeRules.length} active, {inactiveRules.length} inactive)
              </p>
            </div>
          </div>
          <Button onClick={loadMappingRules} variant="outline" size="sm" className="border-gray-200 hover:bg-gray-50">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loadingRules ? (
          <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Loading mapping rules...</p>
          </div>
        ) : mappingRules.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
              <Settings className="h-7 w-7 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Mapping Rules Yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Apply an industry template to automatically create mapping rules for your business
            </p>
            <Button
              onClick={() => router.push(`/companies/${companyId}/edit`)}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Settings className="h-4 w-4 mr-2" />
              Go to Company Settings
            </Button>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pattern Rules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{patternRules.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vendor Rules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{vendorRules.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-violet-50 flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-violet-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-100 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Rules</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeRules.length}</p>
                  </div>
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Pattern Rules Table */}
            {patternRules.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Search className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Transaction Pattern Rules ({patternRules.length})</h4>
                      <p className="text-xs text-gray-500">Auto-match transactions based on description patterns</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Pattern</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">GL Account</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Priority</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {patternRules.slice(0, 50).map((rule, index) => (
                        <tr key={rule.id} className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-3 px-4 font-mono text-xs text-gray-700 bg-gray-50/50 rounded">{rule.pattern}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                              {rule.patternType}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{rule.glAccountCode}</span>
                              <span className="text-xs text-gray-400">{rule.glAccountName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                              {rule.priority}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {rule.metadata?.category && (
                              <Badge className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {rule.metadata.category}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {patternRules.length > 50 && (
                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50/50 border-t border-gray-100">
                      Showing 50 of {patternRules.length} pattern rules
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Rules Table */}
            {vendorRules.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">Vendor Mapping Rules ({vendorRules.length})</h4>
                      <p className="text-xs text-gray-500">Auto-match transactions from recognized vendors</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50/50 border-b border-gray-100">
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Vendor</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Pattern</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">GL Account</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase tracking-wide">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {vendorRules.slice(0, 50).map((rule, index) => (
                        <tr key={rule.id} className={`hover:bg-gray-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                          <td className="py-3 px-4">
                            <span className="font-medium text-gray-900">{rule.metadata?.vendor}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-gray-700 bg-gray-50/50 rounded">{rule.pattern}</td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{rule.glAccountCode}</span>
                              <span className="text-xs text-gray-400">{rule.glAccountName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                              {rule.priority}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {vendorRules.length > 50 && (
                    <div className="text-center py-4 text-sm text-gray-500 bg-gray-50/50 border-t border-gray-100">
                      Showing 50 of {vendorRules.length} vendor rules
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Check access control
  if (accessLoading) {
    return (
      <ProtectedRoute requireCompany>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Checking workspace access...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Access denied
  if (!canAccess) {
    return (
      <ProtectedRoute requireCompany>
        <div className="container mx-auto p-6 max-w-7xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accessError || 'You do not have access to this workspace.'}
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <Button onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCompany>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="container mx-auto p-6 max-w-7xl">
          {/* Header Section */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/workspace/${companyId}`)}
              className="mb-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Workspace
            </Button>

            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Landmark className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Bank Statement Import</h1>
                  <p className="text-gray-500 mt-1">
                    Import and reconcile bank transactions with your general ledger
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" className="border-gray-200 hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 mb-8 md:grid-cols-4">
            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.transactionsThisMonth}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.transactionsThisMonth === 0 ? 'No transactions yet' : 'Transactions imported'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Auto-Mapped</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.autoMappedPercentage}%</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.autoMappedPercentage === 0 ? 'Start importing to track' : 'Success rate'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Value</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      R{stats.totalValueThisMonth > 0
                        ? (stats.totalValueThisMonth / 1000).toFixed(1) + 'K'
                        : '0'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.totalValueThisMonth === 0 ? 'No imports yet' : 'This month'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Active Rules</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeMappingRules}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {stats.activeMappingRules === 0 ? 'Create your first rule' : 'Mapping rules'}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Zap className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Card */}
          <Card className="bg-white border-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <div className="border-b border-gray-100 bg-gray-50/50">
                  <TabsList className="w-full justify-start rounded-none bg-transparent p-0 h-auto">
                    <TabsTrigger
                      value="import"
                      className="rounded-none border-b-2 border-transparent px-5 py-3.5 font-medium text-gray-500 transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-white hover:text-gray-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Import Transactions
                    </TabsTrigger>
                    <TabsTrigger
                      value="upload"
                      className="rounded-none border-b-2 border-transparent px-5 py-3.5 font-medium text-gray-500 transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-white hover:text-gray-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Statement
                    </TabsTrigger>
                    <TabsTrigger
                      value="staging"
                      className="rounded-none border-b-2 border-transparent px-5 py-3.5 font-medium text-gray-500 transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-white hover:text-gray-700"
                    >
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Staging Review
                    </TabsTrigger>
                    <TabsTrigger
                      value="history"
                      className="rounded-none border-b-2 border-transparent px-5 py-3.5 font-medium text-gray-500 transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-white hover:text-gray-700"
                    >
                      <History className="h-4 w-4 mr-2" />
                      History
                    </TabsTrigger>
                    <TabsTrigger
                      value="rules"
                      className="rounded-none border-b-2 border-transparent px-5 py-3.5 font-medium text-gray-500 transition-all data-[state=active]:border-emerald-500 data-[state=active]:text-emerald-700 data-[state=active]:bg-white hover:text-gray-700"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Mapping Rules
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                <TabsContent value="import" className="m-0">
                  {renderImportTab()}
                </TabsContent>

                <TabsContent value="upload" className="m-0">
                  {renderUploadTab()}
                </TabsContent>

                <TabsContent value="staging" className="m-0">
                  {renderStagingTab()}
                </TabsContent>

                <TabsContent value="history" className="m-0">
                  {renderHistoryTab()}
                </TabsContent>

                <TabsContent value="rules" className="m-0">
                  {renderRulesTab()}
                </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
