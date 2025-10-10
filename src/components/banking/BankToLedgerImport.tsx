'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import toast from 'react-hot-toast';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronRight,
  Settings,
  Sparkles,
  Trash2
} from 'lucide-react';
import { BankTransaction } from '@/types/bank-statement';
import { ImportedTransaction, GLMapping, ImportStatistics } from '@/types/accounting/bank-import';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { BankToLedgerService } from '@/lib/accounting/bank-to-ledger-service';
import { IndustryTemplateService, CompanyAccountRecord } from '@/lib/accounting/industry-template-service';
import { bankStatementService } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface BankToLedgerImportProps {
  companyId: string;
  bankAccountId?: string;
  onComplete?: () => void;
}

type WorkflowStep = 'select' | 'mapping' | 'preview' | 'posting' | 'complete';

export function BankToLedgerImport({ companyId, bankAccountId, onComplete }: BankToLedgerImportProps) {
  const { user } = useAuth();

  // State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select');
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [glAccounts, setGlAccounts] = useState<CompanyAccountRecord[]>([]);
  const [mappings, setMappings] = useState<Map<string, GLMapping>>(new Map());
  const [statistics, setStatistics] = useState<ImportStatistics | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [currentMappingTransaction, setCurrentMappingTransaction] = useState<ImportedTransaction | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [saveAsRule, setSaveAsRule] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);

  // Services
  const [bankToLedgerService, setBankToLedgerService] = useState<BankToLedgerService | null>(null);
  const [coaService, setCoaService] = useState<IndustryTemplateService | null>(null);

  // Initialize services
  useEffect(() => {
    if (companyId) {
      setBankToLedgerService(new BankToLedgerService(companyId));
      setCoaService(new IndustryTemplateService(companyId));
    }
  }, [companyId]);

  // Load bank statements
  useEffect(() => {
    loadBankStatements();
  }, [companyId]);

  // Load GL accounts when service is ready
  useEffect(() => {
    if (coaService) {
      loadGLAccounts();
    }
  }, [coaService]);

  // Clear AI suggestion when switching transactions
  useEffect(() => {
    setAiSuggestion(null);
    setLoadingAI(false);
    setAiMessage('');
    setUserInput('');
    setConversationHistory([]);
  }, [currentMappingTransaction]);

  const loadBankStatements = async () => {
    try {
      setLoading(true);
      const stmts = await bankStatementService.getCompanyBankStatements(companyId, 10);
      setStatements(stmts);
    } catch (error) {
      console.error('Failed to load bank statements:', error);
      toast.error('Failed to load bank statements');
    } finally {
      setLoading(false);
    }
  };

  // Delete a bank statement
  const handleDeleteStatement = async (statementId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event

    if (!confirm('Are you sure you want to delete this statement? This cannot be undone.')) {
      return;
    }

    try {
      await bankStatementService.deleteBankStatement(statementId);
      toast.success('Statement deleted successfully');
      // Reload statements
      await loadBankStatements();
    } catch (error) {
      console.error('Failed to delete statement:', error);
      toast.error('Failed to delete statement');
    }
  };

  const loadGLAccounts = async () => {
    if (!coaService) return;
    try {
      setLoadingAccounts(true);
      const accounts = await coaService.listAccounts();
      console.log(`Loaded ${accounts.length} GL accounts`);
      setGlAccounts(accounts);
    } catch (error) {
      console.error('Failed to load GL accounts:', error);
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Load transactions from selected statement
  const loadTransactionsFromStatement = async (statementId: string) => {
    try {
      setLoading(true);
      const statement = await bankStatementService.getBankStatement(statementId);

      if (statement && statement.transactions) {
        const importedTransactions: ImportedTransaction[] = statement.transactions.map((tx, index) => ({
          ...tx,
          id: tx.id || `${statementId}_tx_${index}`,
          importSessionId: '',
          mappingStatus: 'unmapped' as const,
          selected: false
        }));

        setTransactions(importedTransactions);

        // Auto-suggest mappings
        if (bankToLedgerService) {
          await suggestMappings(importedTransactions);
        }

        calculateStatistics(importedTransactions);
        setCurrentStep('mapping');
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('Failed to load transactions from statement');
    } finally {
      setLoading(false);
    }
  };

  // Suggest GL mappings for transactions
  const suggestMappings = async (txs: ImportedTransaction[]) => {
    if (!bankToLedgerService) return;

    const newMappings = new Map<string, GLMapping>();

    for (const tx of txs) {
      try {
        const suggestions = await bankToLedgerService.suggestGLAccounts(tx);

        if (suggestions.confidence > 0.5) {
          newMappings.set(tx.id, {
            debitAccount: suggestions.debitAccount ? {
              id: suggestions.debitAccount.id,
              code: suggestions.debitAccount.code,
              name: suggestions.debitAccount.name
            } : undefined,
            creditAccount: suggestions.creditAccount ? {
              id: suggestions.creditAccount.id,
              code: suggestions.creditAccount.code,
              name: suggestions.creditAccount.name
            } : undefined,
            confidence: suggestions.confidence
          });

          // Update transaction status
          tx.mappingStatus = 'suggested';
          tx.glMapping = newMappings.get(tx.id);
        }
      } catch (error) {
        console.error(`Failed to suggest mapping for transaction ${tx.id}:`, error);
      }
    }

    setMappings(newMappings);
    calculateStatistics(txs);
  };

  // Calculate import statistics
  const calculateStatistics = (txs: ImportedTransaction[]) => {
    const stats: ImportStatistics = {
      totalTransactions: txs.length,
      mappedTransactions: txs.filter(tx => tx.mappingStatus === 'mapped').length,
      unmappedTransactions: txs.filter(tx => tx.mappingStatus === 'unmapped').length,
      suggestedMappings: txs.filter(tx => tx.mappingStatus === 'suggested').length,
      postedTransactions: txs.filter(tx => tx.mappingStatus === 'posted').length,
      totalDebits: txs.reduce((sum, tx) => sum + (tx.debit || 0), 0),
      totalCredits: txs.reduce((sum, tx) => sum + (tx.credit || 0), 0),
      netAmount: 0,
      categorySummary: {}
    };

    stats.netAmount = stats.totalCredits - stats.totalDebits;

    // Group by category
    txs.forEach(tx => {
      const category = tx.category || 'Other';
      if (!stats.categorySummary[category]) {
        stats.categorySummary[category] = {
          count: 0,
          totalAmount: 0,
          mapped: 0
        };
      }
      stats.categorySummary[category].count++;
      stats.categorySummary[category].totalAmount += (tx.credit || 0) - (tx.debit || 0);
      if (tx.mappingStatus === 'mapped' || tx.mappingStatus === 'suggested') {
        stats.categorySummary[category].mapped++;
      }
    });

    setStatistics(stats);
  };

  // Toggle transaction selection
  const toggleTransactionSelection = (txId: string) => {
    const newSelection = new Set(selectedTransactions);
    if (newSelection.has(txId)) {
      newSelection.delete(txId);
    } else {
      newSelection.add(txId);
    }
    setSelectedTransactions(newSelection);
  };

  // Select all/none
  const selectAllTransactions = (select: boolean) => {
    if (select) {
      setSelectedTransactions(new Set(filteredTransactions.map(tx => tx.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  // Open mapping dialog for a transaction
  const openMappingDialog = (transaction: ImportedTransaction) => {
    setCurrentMappingTransaction(transaction);
    setShowMappingDialog(true);
  };

  // Save mapping for a transaction (updates state only, doesn't close dialog)
  const saveMapping = (txId: string, mapping: GLMapping) => {
    const newMappings = new Map(mappings);
    newMappings.set(txId, mapping);
    setMappings(newMappings);

    // Update transaction status
    const updatedTransactions = transactions.map(tx => {
      if (tx.id === txId) {
        return {
          ...tx,
          mappingStatus: 'mapped' as const,
          glMapping: mapping
        };
      }
      return tx;
    });

    setTransactions(updatedTransactions);
    calculateStatistics(updatedTransactions);
  };

  // Get AI suggestion for transaction
  const getAISuggestion = async () => {
    if (!currentMappingTransaction) return;

    try {
      setLoadingAI(true);
      setAiSuggestion(null);

      const response = await fetch('/api/ai/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: currentMappingTransaction,
          availableAccounts: glAccounts
        })
      });

      const data = await response.json();

      // Store the AI's message
      if (data.message) {
        setAiMessage(data.message);
        setConversationHistory([{ role: 'assistant', content: data.message }]);
      }

      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast.success('AI suggestion ready!');
      } else if (data.needsMoreInfo) {
        toast('AI needs more information. You can respond in the chat below.', {
          icon: '💬'
        });
      } else {
        toast.error('Could not generate suggestion');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      toast.error('Failed to get AI suggestion');
    } finally {
      setLoadingAI(false);
    }
  };

  // Send follow-up message to AI
  const sendMessageToAI = async () => {
    if (!currentMappingTransaction || !userInput.trim()) return;

    try {
      setLoadingAI(true);

      // Add user message to history
      const newHistory = [...conversationHistory, { role: 'user' as const, content: userInput }];
      setConversationHistory(newHistory);
      setUserInput('');

      const response = await fetch('/api/ai/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: currentMappingTransaction,
          availableAccounts: glAccounts,
          userMessage: userInput
        })
      });

      const data = await response.json();

      // Add AI response to history
      if (data.message) {
        setAiMessage(data.message);
        setConversationHistory([...newHistory, { role: 'assistant', content: data.message }]);
      }

      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast.success('AI suggestion updated!');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to send message');
    } finally {
      setLoadingAI(false);
    }
  };

  // Apply AI suggestion to mapping
  const applyAISuggestion = () => {
    if (!aiSuggestion || !currentMappingTransaction) return;

    const debitAccount = glAccounts.find(a => a.code === aiSuggestion.debitAccount.code);
    const creditAccount = glAccounts.find(a => a.code === aiSuggestion.creditAccount.code);

    if (debitAccount && creditAccount) {
      saveMapping(currentMappingTransaction.id, {
        debitAccount: {
          id: debitAccount.id || '',
          code: debitAccount.code,
          name: debitAccount.name
        },
        creditAccount: {
          id: creditAccount.id || '',
          code: creditAccount.code,
          name: creditAccount.name
        },
        manuallyMapped: false,
        confidence: aiSuggestion.confidence / 100
      });

      // Auto-check save as rule if AI suggests it
      if (aiSuggestion.shouldSaveAsRule) {
        setSaveAsRule(true);
      }

      // Dismiss AI widget so user can see checkbox and Save button
      setAiSuggestion(null);
      toast.success('AI suggestion applied! Review and click Save Mapping.');
    }
  };

  // Handle saving mapping with optional rule creation
  const handleSaveMappingWithRule = async () => {
    if (!currentMappingTransaction || !coaService) return;

    const mapping = mappings.get(currentMappingTransaction.id);
    if (!mapping || !mapping.debitAccount || !mapping.creditAccount) {
      toast.error('Please select both debit and credit accounts');
      return;
    }

    try {
      // If saveAsRule is checked, create a new GL mapping rule
      if (saveAsRule && currentMappingTransaction.description) {
        // Extract key terms from the transaction description
        const description = currentMappingTransaction.description.trim();

        // Create a pattern from the description
        // Remove common words and numbers, keep significant terms
        const words = description.split(/\s+/)
          .filter(word => word.length > 3) // Keep words longer than 3 chars
          .filter(word => !/^\d+$/.test(word)) // Remove pure numbers
          .filter(word => !['FROM', 'FOR', 'THE', 'AND', 'WITH', 'PAYMENT'].includes(word.toUpperCase()))
          .slice(0, 3); // Take first 3 significant words

        if (words.length > 0) {
          const pattern = words.join('.*'); // Create regex pattern

          // Determine which account to use for the rule (debit or credit based on transaction type)
          const accountToMap = currentMappingTransaction.credit && currentMappingTransaction.credit > 0
            ? mapping.creditAccount
            : mapping.debitAccount;

          await coaService.saveMappingRule({
            pattern,
            patternType: 'regex',
            glAccountCode: accountToMap.code,
            glAccountId: accountToMap.id,
            priority: 50, // Medium priority for user-created rules
            isActive: true,
            metadata: {
              description: `Manual mapping from: ${description}`,
              category: 'user-created'
            }
          });

          toast.success('Mapping saved and rule created for future auto-matching!');
        } else {
          toast.error('Could not create rule pattern from transaction description');
        }
      } else {
        toast.success('Mapping saved successfully');
      }

      // Close dialog and reset
      setShowMappingDialog(false);
      setSaveAsRule(false);
    } catch (error) {
      console.error('Error saving mapping rule:', error);
      toast.error('Failed to save mapping rule. Mapping saved locally.');
      setShowMappingDialog(false);
      setSaveAsRule(false);
    }
  };

  // Apply bulk mapping to selected transactions
  const applyBulkMapping = async () => {
    if (selectedTransactions.size === 0) {
      toast.error('Please select transactions to map');
      return;
    }

    // For now, open dialog for first selected transaction
    // In a full implementation, you'd have a bulk mapping dialog
    const firstTxId = Array.from(selectedTransactions)[0];
    const firstTx = transactions.find(tx => tx.id === firstTxId);
    if (firstTx) {
      openMappingDialog(firstTx);
    }
  };

  // Post transactions to ledger
  const postToLedger = async () => {
    if (!bankToLedgerService || !user) return;

    const selectedTxs = transactions.filter(tx => selectedTransactions.has(tx.id));

    // Validate all selected transactions have mappings
    const unmappedTxs = selectedTxs.filter(tx => !mappings.has(tx.id));
    if (unmappedTxs.length > 0) {
      toast.error(`${unmappedTxs.length} selected transactions are not mapped to GL accounts`);
      return;
    }

    setLoading(true);

    try {
      // Create import session
      const session = await bankToLedgerService.createImportSession(
        bankAccountId || '',
        selectedTxs,
        user.uid,
        {
          totalTransactions: selectedTxs.length
        }
      );

      // Prepare mappings for posting
      const transactionMappings = selectedTxs.map(tx => {
        const mapping = mappings.get(tx.id)!;
        return {
          bankTransaction: tx,
          debitAccountId: mapping.debitAccount?.id || '',
          debitAccountCode: mapping.debitAccount?.code || '',
          creditAccountId: mapping.creditAccount?.id || '',
          creditAccountCode: mapping.creditAccount?.code || '',
          description: tx.description,
          reference: tx.reference
        };
      });

      // Post to ledger
      const result = await bankToLedgerService.postToLedger({
        sessionId: session.id,
        transactions: transactionMappings,
        fiscalPeriodId: 'current', // You'd get this from context
        postImmediately: true,
        createdBy: user.uid
      });

      if (result.success) {
        toast.success(`Posted ${result.processedCount} transactions to the general ledger`);

        setCurrentStep('complete');

        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error(`Posted ${result.processedCount} transactions, ${result.failedCount} failed`);
      }
    } catch (error) {
      console.error('Failed to post transactions:', error);
      toast.error('Failed to post transactions to ledger');
    } finally {
      setLoading(false);
    }
  };

  // Filtered transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = searchTerm === '' ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.reference?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || tx.mappingStatus === filterStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [transactions, searchTerm, filterCategory, filterStatus]);

  // Render different steps
  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return renderSelectStep();
      case 'mapping':
        return renderMappingStep();
      case 'preview':
        return renderPreviewStep();
      case 'complete':
        return renderCompleteStep();
      default:
        return null;
    }
  };

  const renderSelectStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Select Bank Statement</h3>
          <p className="text-sm text-muted-foreground">Choose a bank statement to import transactions from</p>
        </div>
        <Button variant="outline" onClick={loadBankStatements}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="ml-3 text-muted-foreground">Loading transactions...</p>
        </div>
      ) : statements.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No bank statements found. Please upload a bank statement first.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {statements.map((statement) => (
            <Card
              key={statement.id}
              className={`cursor-pointer hover:shadow-md transition-shadow ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => loadTransactionsFromStatement(statement.id)}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-semibold">{statement.accountInfo?.bankName}</p>
                    <p className="text-sm text-muted-foreground">
                      Account: {statement.accountInfo?.accountNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Period: {statement.summary?.statementPeriod?.from} - {statement.summary?.statementPeriod?.to}
                    </p>
                  </div>
                  <div className="text-right flex items-start gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {statement.summary?.transactionCount} transactions
                      </p>
                      <p className="font-semibold">
                        Balance: ${statement.summary?.closingBalance?.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteStatement(statement.id!, e)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
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

  const renderMappingStep = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Map Transactions to GL Accounts</h3>
          <p className="text-sm text-muted-foreground">
            Review and map bank transactions to general ledger accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCurrentStep('select')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep('preview')}
            disabled={selectedTransactions.size === 0}
          >
            Preview
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {statistics && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{statistics.totalTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Mapped</p>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{statistics.mappedTransactions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Suggested</p>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{statistics.suggestedMappings}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Selected</p>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{selectedTransactions.size}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.keys(statistics?.categorySummary || {}).map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="unmapped">Unmapped</SelectItem>
            <SelectItem value="suggested">Suggested</SelectItem>
            <SelectItem value="mapped">Mapped</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={applyBulkMapping} disabled={selectedTransactions.size === 0}>
          Bulk Map
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedTransactions.size === filteredTransactions.length && filteredTransactions.length > 0}
                  onCheckedChange={(checked) => selectAllTransactions(!!checked)}
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Debit</TableHead>
              <TableHead className="text-right">Credit</TableHead>
              <TableHead>GL Mapping</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedTransactions.has(tx.id)}
                    onCheckedChange={() => toggleTransactionSelection(tx.id)}
                  />
                </TableCell>
                <TableCell>{tx.date}</TableCell>
                <TableCell className="max-w-xs truncate">{tx.description}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tx.category}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {tx.debit ? `$${tx.debit.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {tx.credit ? `$${tx.credit.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  {mappings.has(tx.id) ? (
                    <div className="text-sm">
                      {mappings.get(tx.id)?.debitAccount && (
                        <p>Dr: {mappings.get(tx.id)?.debitAccount?.code}</p>
                      )}
                      {mappings.get(tx.id)?.creditAccount && (
                        <p>Cr: {mappings.get(tx.id)?.creditAccount?.code}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {tx.mappingStatus === 'suggested' && (
                    <Badge variant="secondary">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Suggested
                    </Badge>
                  )}
                  {tx.mappingStatus === 'mapped' && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Mapped
                    </Badge>
                  )}
                  {tx.mappingStatus === 'unmapped' && (
                    <Badge variant="outline">Unmapped</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openMappingDialog(tx)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  const renderPreviewStep = () => {
    const selectedTxs = transactions.filter(tx => selectedTransactions.has(tx.id));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">Preview Journal Entries</h3>
            <p className="text-sm text-muted-foreground">
              Review the journal entries that will be created
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCurrentStep('mapping')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button onClick={postToLedger} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post to Ledger
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are about to post {selectedTxs.length} transactions to the general ledger.
            This action cannot be undone.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          {selectedTxs.slice(0, 10).map((tx) => {
            const mapping = mappings.get(tx.id);
            const amount = tx.credit || tx.debit || 0;

            return (
              <Card key={tx.id}>
                <CardContent className="pt-6">
                  <div className="grid gap-4">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-semibold">{tx.description}</p>
                        <p className="text-sm text-muted-foreground">{tx.date}</p>
                      </div>
                      <p className="text-lg font-semibold">
                        ${amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {tx.credit ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Dr: Bank Account</span>
                            <span>${amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cr: {mapping?.creditAccount?.name || 'Unknown'}</span>
                            <span>${amount.toFixed(2)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Dr: {mapping?.debitAccount?.name || 'Unknown'}</span>
                            <span>${amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cr: Bank Account</span>
                            <span>${amount.toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {selectedTxs.length > 10 && (
          <p className="text-sm text-muted-foreground text-center">
            And {selectedTxs.length - 10} more transactions...
          </p>
        )}
      </div>
    );
  };

  const renderCompleteStep = () => (
    <div className="space-y-6">
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Import Complete!</h3>
        <p className="text-muted-foreground mb-6">
          Successfully posted {selectedTransactions.size} transactions to the general ledger
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={() => {
            setCurrentStep('select');
            setTransactions([]);
            setSelectedTransactions(new Set());
            setMappings(new Map());
          }}>
            Import More
          </Button>
          {onComplete && (
            <Button onClick={onComplete}>
              Done
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>Bank to Ledger Import</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* GL Mapping Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Map Transaction to GL Accounts</DialogTitle>
            <DialogDescription>
              Select the appropriate GL accounts for this transaction
            </DialogDescription>
          </DialogHeader>

          {currentMappingTransaction && (
            <div className="grid grid-cols-3 gap-6 overflow-hidden">
              {/* Left Column - Transaction & Mapping (2/3 width) */}
              <div className="col-span-2 space-y-4 overflow-y-auto pr-4" style={{maxHeight: 'calc(90vh - 200px)'}}>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">{currentMappingTransaction.description}</p>
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{currentMappingTransaction.date}</span>
                    <span>
                      {currentMappingTransaction.credit ?
                        `Credit: $${currentMappingTransaction.credit.toFixed(2)}` :
                        `Debit: $${currentMappingTransaction.debit?.toFixed(2)}`
                      }
                    </span>
                  </div>
                </div>

                {/* AI Suggestion Result (when available) */}
                {aiSuggestion && (
                  <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-semibold text-gray-900">AI Suggestion</h4>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-2 border-indigo-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.round(aiSuggestion.confidence / 20) ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {aiSuggestion.confidence}% Confidence
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded p-3 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Debit:</span>
                        <span className="text-sm font-semibold text-green-700">
                          {aiSuggestion.debitAccount.code} - {aiSuggestion.debitAccount.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Credit:</span>
                        <span className="text-sm font-semibold text-blue-700">
                          {aiSuggestion.creditAccount.code} - {aiSuggestion.creditAccount.name}
                        </span>
                      </div>
                    </div>

                    <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                      <p className="font-medium mb-2">💡 Explanation:</p>
                      <p>{aiSuggestion.explanation}</p>
                    </div>

                    {aiSuggestion.reasoning && aiSuggestion.reasoning.length > 0 && (
                      <div className="text-sm">
                        <p className="font-medium text-gray-700 mb-1">Reasoning:</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-600">
                          {aiSuggestion.reasoning.map((reason: string, idx: number) => (
                            <li key={idx}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {aiSuggestion.accountingPrinciple && (
                      <div className="text-sm bg-purple-50 p-2 rounded">
                        <span className="font-medium text-purple-800">🎓 Accounting Principle: </span>
                        <span className="text-purple-700">{aiSuggestion.accountingPrinciple}</span>
                      </div>
                    )}

                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={applyAISuggestion}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Apply Suggestion
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAiSuggestion(null)}
                        >
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

              <div className="space-y-4">
                <div>
                  <Label>Debit Account</Label>
                  {loadingAccounts ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading accounts...
                    </div>
                  ) : glAccounts.length === 0 ? (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No chart of accounts found. Please set up your chart of accounts first.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={mappings.get(currentMappingTransaction.id)?.debitAccount?.id || ''}
                      onValueChange={(value) => {
                        const account = glAccounts.find(a => a.id === value);
                        if (account) {
                          const currentMapping = mappings.get(currentMappingTransaction.id) || {};
                          saveMapping(currentMappingTransaction.id, {
                            ...currentMapping,
                            debitAccount: {
                              id: account.id || '',
                              code: account.code,
                              name: account.name
                            },
                            manuallyMapped: true
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select debit account" />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccounts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No accounts available</div>
                        ) : (
                          glAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id || account.code}>
                              {account.code} - {account.name} ({account.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label>Credit Account</Label>
                  {loadingAccounts ? (
                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading accounts...
                    </div>
                  ) : glAccounts.length === 0 ? (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No chart of accounts found. Please set up your chart of accounts first.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Select
                      value={mappings.get(currentMappingTransaction.id)?.creditAccount?.id || ''}
                      onValueChange={(value) => {
                        const account = glAccounts.find(a => a.id === value);
                        if (account) {
                          const currentMapping = mappings.get(currentMappingTransaction.id) || {};
                          saveMapping(currentMappingTransaction.id, {
                            ...currentMapping,
                            creditAccount: {
                              id: account.id || '',
                              code: account.code,
                              name: account.name
                            },
                            manuallyMapped: true
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select credit account" />
                      </SelectTrigger>
                      <SelectContent>
                        {glAccounts.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">No accounts available</div>
                        ) : (
                          glAccounts.map(account => (
                            <SelectItem key={account.id} value={account.id || account.code}>
                              {account.code} - {account.name} ({account.type})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {/* Save as Rule checkbox */}
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Checkbox
                    id="saveAsRule"
                    checked={saveAsRule}
                    onCheckedChange={(checked) => setSaveAsRule(checked as boolean)}
                  />
                  <Label
                    htmlFor="saveAsRule"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Save as mapping rule (auto-match similar transactions in future)
                  </Label>
                </div>
              </div>
            </div>

              {/* Right Column - AI Chat (1/3 width) */}
              <div className="col-span-1 border-l pl-6 flex flex-col" style={{maxHeight: 'calc(90vh - 200px)'}}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                    <h4 className="font-semibold text-gray-900">AI Assistant</h4>
                  </div>
                  {conversationHistory.length === 0 && (
                    <Button
                      size="sm"
                      onClick={getAISuggestion}
                      disabled={loadingAI || loadingAccounts}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {loadingAI ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Ask AI
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Conversation History */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {conversationHistory.length === 0 && !loadingAI && (
                    <div className="text-center text-sm text-gray-500 mt-8">
                      <p>Click "Ask AI" to get intelligent suggestions and explanations for this transaction.</p>
                    </div>
                  )}
                  {conversationHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg ${
                        msg.role === 'assistant'
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-100 border-gray-200'
                      } border`}
                    >
                      <p className="text-xs font-semibold mb-1 text-gray-600">
                        {msg.role === 'assistant' ? '🤖 AI' : '👤 You'}
                      </p>
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                {conversationHistory.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your response..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessageToAI();
                          }
                        }}
                        disabled={loadingAI}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={sendMessageToAI}
                        disabled={loadingAI || !userInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {loadingAI ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Send'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMappingWithRule}>
              Save Mapping
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}