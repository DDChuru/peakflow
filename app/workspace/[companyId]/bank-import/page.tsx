'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
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
import { BankStatementUpload } from '@/components/bank-statement/BankStatementUpload';
import { useAuth } from '@/components/auth/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { bankAccountService } from '@/lib/firebase';
import { BankAccount } from '@/types/accounting/bank-account';

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
  const { toast } = useToast();
  const { user } = useAuth();

  const companyId = params.companyId as string;

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'upload' | 'history' | 'rules'>('import');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [importHistory, setImportHistory] = useState<ImportSession[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Load bank accounts
  useEffect(() => {
    if (companyId) {
      loadBankAccounts();
      loadImportHistory();
    }
  }, [companyId]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await bankAccountService.list(companyId);
      setBankAccounts(accounts);
      if (accounts.length > 0 && !selectedBankAccount) {
        setSelectedBankAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load bank accounts:', error);
    }
  };

  const loadImportHistory = async () => {
    // This would load from the bankImportSessions collection
    // For now, using mock data
    setImportHistory([
      {
        id: '1',
        date: '2025-01-15',
        status: 'completed',
        totalTransactions: 45,
        postedTransactions: 45,
        totalAmount: 12500.00
      },
      {
        id: '2',
        date: '2025-01-10',
        status: 'completed',
        totalTransactions: 32,
        postedTransactions: 30,
        totalAmount: 8750.50
      }
    ]);
  };

  const handleImportComplete = () => {
    toast({
      title: 'Import Complete',
      description: 'Bank transactions have been successfully posted to the general ledger'
    });
    loadImportHistory();
    setActiveTab('history');
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
            onUploadComplete={() => {
              toast({
                title: 'Upload Complete',
                description: 'Bank statement has been processed successfully'
              });
              setActiveTab('import');
            }}
          />
        </CardContent>
      </Card>
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
    </div>
  );

  const renderRulesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">GL Mapping Rules</h3>
          <p className="text-sm text-muted-foreground">Configure automatic GL account mapping rules</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No mapping rules configured yet</p>
            <p className="text-sm mt-2">Create rules to automatically map bank transactions to GL accounts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

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
                  <p className="text-2xl font-bold">127</p>
                </div>
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Transactions imported</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Mapped</p>
                  <p className="text-2xl font-bold">85%</p>
                </div>
                <Sparkles className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Success rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">$45.2K</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Mapping rules</p>
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