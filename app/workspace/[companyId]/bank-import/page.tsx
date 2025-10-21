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
  Sparkles
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
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No bank accounts configured. Please add a bank account in the banking section first.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Select Bank Account:</label>
              <select
                value={selectedBankAccount}
                onChange={(e) => setSelectedBankAccount(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} - {account.accountNumberMasked}
                  </option>
                ))}
              </select>
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
      <Card>
        <CardHeader>
          <CardTitle>Upload Bank Statement</CardTitle>
          <CardDescription>
            Upload a PDF bank statement to extract and import transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BankStatementUpload
            companyId={companyId}
            companyName={company?.name || 'Company'}
            onUploadSuccess={() => {
              toast.success('Bank statement has been processed successfully');
              setActiveTab('import');
            }}
          />
        </CardContent>
      </Card>
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
        <div>
          <h3 className="text-lg font-semibold">Import History</h3>
          <p className="text-sm text-muted-foreground">View past bank import sessions</p>
        </div>
        <Button variant="outline" onClick={loadImportHistory}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {importHistory.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No import history yet</p>
              <p className="text-sm mt-2">
                Import sessions will appear here after you upload and process bank statements
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setActiveTab('upload')}
              >
                Upload Your First Statement
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {importHistory.map((session) => (
            <Card key={session.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="font-semibold">Import Session #{session.id}</p>
                      {session.status === 'completed' ? (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Partial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">Date: {session.date}</p>
                    <p className="text-sm text-muted-foreground">
                      Transactions: {session.postedTransactions} / {session.totalTransactions}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      ${session.totalAmount.toFixed(2)}
                    </p>
                    <Button variant="ghost" size="sm" className="mt-2">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
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
          <div>
            <h3 className="text-lg font-semibold">GL Mapping Rules</h3>
            <p className="text-sm text-muted-foreground">
              {mappingRules.length} total rules ({activeRules.length} active, {inactiveRules.length} inactive)
            </p>
          </div>
          <Button onClick={loadMappingRules} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loadingRules ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading mapping rules...</p>
              </div>
            </CardContent>
          </Card>
        ) : mappingRules.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No mapping rules configured yet</p>
                <p className="text-sm mt-2">Apply an industry template to automatically create mapping rules</p>
                <Button
                  className="mt-4"
                  onClick={() => router.push(`/companies/${companyId}/edit`)}
                >
                  Go to Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pattern Rules</p>
                      <p className="text-2xl font-bold">{patternRules.length}</p>
                    </div>
                    <Search className="h-8 w-8 text-blue-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Vendor Rules</p>
                      <p className="text-2xl font-bold">{vendorRules.length}</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Rules</p>
                      <p className="text-2xl font-bold">{activeRules.length}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pattern Rules Table */}
            {patternRules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Transaction Pattern Rules ({patternRules.length})
                  </CardTitle>
                  <CardDescription>
                    Auto-match transactions based on description patterns
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Pattern</th>
                          <th className="text-left py-2 px-4 font-medium">Type</th>
                          <th className="text-left py-2 px-4 font-medium">GL Account</th>
                          <th className="text-left py-2 px-4 font-medium">Priority</th>
                          <th className="text-left py-2 px-4 font-medium">Category</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patternRules.slice(0, 50).map(rule => (
                          <tr key={rule.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-mono text-xs">{rule.pattern}</td>
                            <td className="py-2 px-4">
                              <Badge variant="outline" className="text-xs">
                                {rule.patternType}
                              </Badge>
                            </td>
                            <td className="py-2 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium">{rule.glAccountCode}</span>
                                <span className="text-xs text-muted-foreground">{rule.glAccountName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">{rule.priority}</td>
                            <td className="py-2 px-4">
                              {rule.metadata?.category && (
                                <Badge className="text-xs">
                                  {rule.metadata.category}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {patternRules.length > 50 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Showing 50 of {patternRules.length} pattern rules
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vendor Rules Table */}
            {vendorRules.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Vendor Mapping Rules ({vendorRules.length})
                  </CardTitle>
                  <CardDescription>
                    Auto-match transactions from recognized vendors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4 font-medium">Vendor</th>
                          <th className="text-left py-2 px-4 font-medium">Pattern</th>
                          <th className="text-left py-2 px-4 font-medium">GL Account</th>
                          <th className="text-left py-2 px-4 font-medium">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorRules.slice(0, 50).map(rule => (
                          <tr key={rule.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 font-medium">{rule.metadata?.vendor}</td>
                            <td className="py-2 px-4 font-mono text-xs">{rule.pattern}</td>
                            <td className="py-2 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium">{rule.glAccountCode}</span>
                                <span className="text-xs text-muted-foreground">{rule.glAccountName}</span>
                              </div>
                            </td>
                            <td className="py-2 px-4">{rule.priority}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {vendorRules.length > 50 && (
                      <div className="text-center py-4 text-sm text-muted-foreground">
                        Showing 50 of {vendorRules.length} vendor rules
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
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
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push(`/workspace/${companyId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Bank Statement Import</h1>
              <p className="text-muted-foreground">
                Import bank transactions directly to general ledger
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 mb-6 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">{stats.transactionsThisMonth}</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.transactionsThisMonth === 0 ? 'No transactions yet' : 'Transactions imported'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Mapped</p>
                  <p className="text-2xl font-bold">{stats.autoMappedPercentage}%</p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.autoMappedPercentage === 0 ? 'Start importing to track' : 'Success rate'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    ${stats.totalValueThisMonth > 0
                      ? (stats.totalValueThisMonth / 1000).toFixed(1) + 'K'
                      : '0'}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.totalValueThisMonth === 0 ? 'No imports yet' : 'This month'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">{stats.activeMappingRules}</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {stats.activeMappingRules === 0 ? 'Create your first rule' : 'Mapping rules'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                <TabsTrigger
                  value="import"
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Import Transactions
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Statement
                </TabsTrigger>
                <TabsTrigger
                  value="staging"
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Staging Review
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  <History className="h-4 w-4 mr-2" />
                  History
                </TabsTrigger>
                <TabsTrigger
                  value="rules"
                  className="rounded-none border-b-2 border-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground transition-none data-[state=active]:border-primary data-[state=active]:text-foreground"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Mapping Rules
                </TabsTrigger>
              </TabsList>

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
    </ProtectedRoute>
  );
}
