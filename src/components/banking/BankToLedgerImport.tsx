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
  RadixSelect,
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
import toastLib from 'react-hot-toast';
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
import { BankStatement, BankTransaction } from '@/types/bank-statement';
import { ImportedTransaction, GLMapping, ImportStatistics } from '@/types/accounting/bank-import';
import { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { BankToLedgerService } from '@/lib/accounting/bank-to-ledger-service';
import { IndustryTemplateService, CompanyAccountRecord } from '@/lib/accounting/industry-template-service';
import { bankStatementService } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { MappingPipeline, TransactionMapping, ProcessingResult } from '@/lib/ai/mapping-pipeline';
import { RuleLearningService } from '@/lib/ai/rule-learning-service';
import { AIMappingArtifact } from '@/components/banking/AIMappingArtifact';
import { MappingSuggestion, AccountCreationSuggestion } from '@/lib/ai/accounting-assistant';
import { fuzzyMatch, normalizeForMatching } from '@/lib/utils/string-matching';
import {
  createPaymentAllocationService,
  type MultiInvoiceAllocation,
  type PartialPaymentAllocation
} from '@/lib/accounting/payment-allocation-service';

// Helper function to format currency
function formatBalance(value?: number | string | null, currency: string = 'USD'): string {
  if (value === null || value === undefined) {
    return '—';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(value);
  }

  const trimmed = value.trim();
  if (!trimmed) return '—';

  const numeric = parseFloat(trimmed.replace(/[^0-9.-]/g, ''));
  const suffixMatch = trimmed.match(/[A-Za-z]+$/);
  const suffix = suffixMatch ? suffixMatch[0].toUpperCase() : '';

  if (!Number.isNaN(numeric)) {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(numeric);
    return suffix ? `${formatted} ${suffix}` : formatted;
  }

  return trimmed;
}

// Helper function to format amount (shorter version for inline use)
function formatAmount(value: number | undefined, currency: string = 'USD'): string {
  if (!value || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPeriod(from?: string | null, to?: string | null): string {
  const start = from?.trim();
  const end = to?.trim();

  if (!start && !end) {
    return 'Period unavailable';
  }

  if (start && end) {
    return `${start} → ${end}`;
  }

  return start || end || 'Period unavailable';
}

// Helper to safely convert any value to string (prevents React rendering objects)
function safeStringify(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  if (typeof value === 'object' && value !== null) {
    // Check for common error object structures
    if ('title' in value && 'description' in value) {
      const { title, description } = value as { title: unknown; description: unknown };
      return `${String(title)}: ${String(description)}`;
    }
    if ('message' in value) {
      const { message } = value as { message: unknown };
      return String(message);
    }
    return JSON.stringify(value);
  }
  return String(value);
}

interface BankToLedgerImportProps {
  companyId: string;
  bankAccountId?: string;
  onComplete?: () => void;
}

type WorkflowStep = 'select' | 'mapping' | 'preview' | 'posting' | 'complete';

export function BankToLedgerImport({ companyId, bankAccountId, onComplete }: BankToLedgerImportProps) {
  const { user, company } = useAuth();

  // Get company currency from context (default to USD if not set)
  const companyCurrency = company?.defaultCurrency || 'USD';

  // Safe toast wrapper - ensures all messages are strings before rendering
  type ToastOptions = Parameters<typeof toastLib>[1];

  const toast = Object.assign(
    (message: unknown, options?: ToastOptions) => toastLib(safeStringify(message), options),
    {
      success: (message: unknown, options?: ToastOptions) => toastLib.success(safeStringify(message), options),
      error: (message: unknown, options?: ToastOptions) => toastLib.error(safeStringify(message), options),
      loading: (message: unknown, options?: ToastOptions) => toastLib.loading(safeStringify(message), options),
      info: (message: unknown, options?: ToastOptions) => toastLib(safeStringify(message), options),
      dismiss: toastLib.dismiss,
      remove: toastLib.remove,
    }
  );

  // State
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('select');
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [transactions, setTransactions] = useState<ImportedTransaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [glAccounts, setGlAccounts] = useState<CompanyAccountRecord[]>([]);
  const [mappings, setMappings] = useState<Map<string, GLMapping>>(new Map());
  const [statistics, setStatistics] = useState<ImportStatistics | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [currentMappingTransaction, setCurrentMappingTransaction] = useState<ImportedTransaction | null>(null);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
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

  // Tri-state buckets for AI-assisted mapping
  const [autoMapped, setAutoMapped] = useState<Array<{
    transaction: BankTransaction;
    mapping: TransactionMapping;
  }>>([]);
  const [needsReview, setNeedsReview] = useState<Array<{
    transaction: BankTransaction;
    suggestedMapping: TransactionMapping;
  }>>([]);
  const [needsAI, setNeedsAI] = useState<Array<{
    transaction: BankTransaction;
  }>>([]);

  // Processing state
  const [processingStats, setProcessingStats] = useState<ProcessingResult['stats'] | null>(null);
  const [activeTab, setActiveTab] = useState<'auto-mapped' | 'needs-review' | 'needs-ai'>('auto-mapped');
  const [isProcessing, setIsProcessing] = useState(false);

  // AI artifact state
  const [currentAIIndex, setCurrentAIIndex] = useState(0);
  const [currentAISuggestion, setCurrentAISuggestion] = useState<MappingSuggestion | null>(null);
  const [currentAccountCreation, setCurrentAccountCreation] = useState<AccountCreationSuggestion | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  // Phase 4: Advanced suggestions state
  const [currentMultiInvoiceSuggestions, setCurrentMultiInvoiceSuggestions] = useState<any[]>([]);
  const [currentPartialPaymentSuggestions, setCurrentPartialPaymentSuggestions] = useState<any[]>([]);

  // Services
  const [bankToLedgerService, setBankToLedgerService] = useState<BankToLedgerService | null>(null);
  const [coaService, setCoaService] = useState<IndustryTemplateService | null>(null);
  const [mappingPipeline, setMappingPipeline] = useState<MappingPipeline | null>(null);
  const [ruleLearningService, setRuleLearningService] = useState<RuleLearningService | null>(null);

  // Initialize services
  useEffect(() => {
    if (companyId) {
      setBankToLedgerService(new BankToLedgerService(companyId));
      setCoaService(new IndustryTemplateService(companyId));
      setMappingPipeline(new MappingPipeline(companyId));
      setRuleLearningService(new RuleLearningService(companyId));
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
      setStatements(Array.isArray(stmts) ? stmts.filter(Boolean) : []);
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
        setSelectedStatement(statement);
        const importedTransactions: ImportedTransaction[] = statement.transactions.map((tx, index) => ({
          ...tx,
          id: tx.id || `${statementId}_tx_${index}`,
          importSessionId: '',
          mappingStatus: 'unmapped' as const,
          selected: false
        }));

        setTransactions(importedTransactions);
        setSelectedTransactions(new Set());
        setMappings(new Map());
        setProcessingStats(null);

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

  // Suggest GL mappings for transactions using AI-powered pipeline
  const suggestMappings = async (txs: ImportedTransaction[]) => {
    if (!mappingPipeline) {
      console.warn('MappingPipeline not initialized yet');
      return;
    }

    setIsProcessing(true);

    try {
      console.log(`[SUGGEST MAPPINGS] Processing ${txs.length} transactions with MappingPipeline...`);

      // Convert ImportedTransaction[] to BankTransaction[]
      const bankTransactions: BankTransaction[] = txs.map(tx => ({
        id: tx.id,
        date: tx.date,
        description: tx.description,
        debit: tx.debit,
        credit: tx.credit,
        balance: tx.balance,
        category: tx.category,
        reference: tx.reference
      }));

      // Process through pipeline
      const result = await mappingPipeline.processTransactions(bankTransactions, {
        autoMapThreshold: 85,
        reviewThreshold: 60,
        enableExactMatch: true,
        enablePatternMatch: true,
        enableFuzzyMatch: true,
        enableCategoryMatch: true,
        fuzzyMatchThreshold: 0.8
      });

      // Update tri-state buckets
      setAutoMapped(result.autoMapped);
      setNeedsReview(result.needsReview);
      setNeedsAI(result.needsAI);
      setProcessingStats(result.stats);

      console.log(`[SUGGEST MAPPINGS] Pipeline complete:`, {
        autoMapped: result.stats.autoMappedCount,
        needsReview: result.stats.needsReviewCount,
        needsAI: result.stats.needsAICount,
        autoMapPercentage: `${result.stats.autoMappedPercentage.toFixed(1)}%`,
        estimatedAICost: `$${result.stats.estimatedAICost.toFixed(3)}`
      });

      // Apply auto-mapped transactions to mappings
      const newMappings = new Map<string, GLMapping>();
      result.autoMapped.forEach(({ transaction, mapping }) => {
        newMappings.set(transaction.id, {
          debitAccount: {
            id: mapping.debitAccount.id || '',
            code: mapping.debitAccount.code,
            name: mapping.debitAccount.name
          },
          creditAccount: {
            id: mapping.creditAccount.id || '',
            code: mapping.creditAccount.code,
            name: mapping.creditAccount.name
          },
          confidence: mapping.confidence / 100,
          manuallyMapped: false
        });

        // Update transaction status
        const tx = txs.find(t => t.id === transaction.id);
        if (tx) {
          tx.mappingStatus = 'suggested';
          tx.glMapping = newMappings.get(transaction.id);
        }
      });

      setMappings(newMappings);

      // Auto-select all auto-mapped transactions for posting
      const autoMappedIds = result.autoMapped.map(({ transaction }) => transaction.id);
      setSelectedTransactions(new Set(autoMappedIds));

      calculateStatistics(txs);

      // Show success message with statistics
      toast.success(
        `✨ Processing complete!\n` +
        `🟢 ${result.stats.autoMappedCount} auto-mapped (${result.stats.autoMappedPercentage.toFixed(1)}%)\n` +
        `🟡 ${result.stats.needsReviewCount} need review\n` +
        `🔵 ${result.stats.needsAICount} need AI assistance`,
        { duration: 5000 }
      );

      // Auto-switch to appropriate tab
      if (result.stats.autoMappedCount > 0) {
        setActiveTab('auto-mapped');
      } else if (result.stats.needsReviewCount > 0) {
        setActiveTab('needs-review');
      } else if (result.stats.needsAICount > 0) {
        setActiveTab('needs-ai');
      }

    } catch (error) {
      console.error('Failed to process transactions with pipeline:', error);
      toast.error('Failed to process transactions. Please try again.');
    } finally {
      setIsProcessing(false);
    }
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

  /**
   * Batch-apply mapping to similar unmapped transactions
   * Finds all unmapped transactions with similar descriptions and applies the same mapping
   *
   * @param mappedTransaction - The transaction that was just mapped
   * @param mapping - The GL mapping to apply
   * @param similarityThreshold - Minimum similarity score (0-100) to consider a match
   * @returns Number of additional transactions mapped
   */
  const applyMappingToSimilar = (
    mappedTransaction: ImportedTransaction,
    mapping: GLMapping,
    similarityThreshold: number = 80
  ): number => {
    let count = 0;

    // Get all unmapped transactions (from all buckets)
    const unmappedTransactions = [
      ...needsReview.map(item => item.transaction),
      ...needsAI.map(item => item.transaction),
      ...transactions.filter(tx =>
        tx.mappingStatus === 'unmapped' &&
        tx.id !== mappedTransaction.id &&
        !mappings.has(tx.id)
      )
    ];

    // Find similar transactions using fuzzy matching
    const similarTransactions = unmappedTransactions.filter(tx => {
      const matchResult = fuzzyMatch(
        mappedTransaction.description,
        tx.description,
        {
          maxLevenshteinDistance: 5,
          minSimilarityRatio: similarityThreshold / 100,
          checkAbbreviation: false,
          checkPartialWords: true
        }
      );

      return matchResult.isMatch && matchResult.confidence >= similarityThreshold;
    });

    // Apply mapping to all similar transactions
    similarTransactions.forEach(tx => {
      saveMapping(tx.id, {
        ...mapping,
        manuallyMapped: false // Marked as auto-applied from similar transaction
      });
      setSelectedTransactions(prev => new Set([...prev, tx.id]));
      count++;
    });

    return count;
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
          availableAccounts: glAccounts,
          companyId // Now includes companyId for entity matching!
        })
      });

      const data = await response.json();

      // Store the AI's message (ensure it's a string)
      if (data.message) {
        const messageStr = safeStringify(data.message);
        setAiMessage(messageStr);
        setConversationHistory([{ role: 'assistant', content: messageStr }]);
      }

      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast.success('AI suggestion ready!');
      } else if (data.needsMoreInfo) {
        toast.info('AI needs more information. You can respond in the chat below.');
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
          companyId, // Now includes companyId for entity matching!
          userMessage: userInput
        })
      });

      const data = await response.json();

      // Add AI response to history (ensure it's a string)
      if (data.message) {
        const messageStr = safeStringify(data.message);
        setAiMessage(messageStr);
        setConversationHistory([...newHistory, { role: 'assistant', content: messageStr }]);
      }

      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast.success('AI suggestion updated!');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      toast.error('Failed to send message');
    } finally{
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
      // Add the current transaction to selected transactions (so it gets posted!)
      setSelectedTransactions(new Set([...selectedTransactions, currentMappingTransaction.id]));

      // Batch-apply to similar unmapped transactions BEFORE saving rule
      const similarCount = applyMappingToSimilar(currentMappingTransaction, mapping, 80);

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

          // Show success message with batch count
          if (similarCount > 0) {
            toast.success(
              `✅ Mapping applied to ${similarCount + 1} similar transactions!\n📋 Rule created for future auto-matching!`,
              { duration: 5000 }
            );
          } else {
            toast.success('Mapping saved and rule created for future auto-matching!');
          }
        } else {
          toast.error('Could not create rule pattern from transaction description');
        }
      } else {
        // No rule, just show batch mapping results
        if (similarCount > 0) {
          toast.success(
            `✅ Mapping applied to ${similarCount + 1} similar transactions!`,
            { duration: 4000 }
          );
        } else {
          toast.success('Mapping saved successfully');
        }
      }

      // Update buckets - remove all newly mapped transactions
      const newlyMappedIds = new Set<string>();
      transactions.forEach(t => {
        if (mappings.has(t.id)) newlyMappedIds.add(t.id);
      });

      setNeedsAI(needsAI.filter(item => !newlyMappedIds.has(item.transaction.id)));
      setNeedsReview(needsReview.filter(item => !newlyMappedIds.has(item.transaction.id)));

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

  // Post transactions to staging ledger
  const postToStaging = async () => {
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

      // Prepare mappings for posting (same format as postToLedger)
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

      // Post to staging
      const result = await bankToLedgerService.postToStaging({
        sessionId: session.id,
        transactions: transactionMappings,
        fiscalPeriodId: 'current',
        postImmediately: false,
        createdBy: user.uid
      });

      if (result.success) {
        toast.success(
          `Posted ${result.journalCount} transactions to staging ledger.\n` +
          `Debits: R${result.balance.totalDebits.toFixed(2)}, Credits: R${result.balance.totalCredits.toFixed(2)}\n` +
          `${result.balance.isBalanced ? '✅ Balanced' : '❌ Not balanced'}`,
          { duration: 8000 }
        );

        setCurrentStep('complete');

        if (onComplete) {
          onComplete();
        }
      } else {
        toast.error('Failed to post to staging ledger');
      }
    } catch (error) {
      console.error('Failed to post to staging:', error);
      const errorMessage = safeStringify(error);
      toast.error(`Failed to post to staging: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Post transactions directly to production ledger
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

      // Log transaction dates for debugging
      console.log('[PostToLedger] Transaction dates:', transactionMappings.map(t => ({
        id: t.bankTransaction.id,
        date: t.bankTransaction.date,
        description: t.bankTransaction.description
      })));

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
        // Show detailed error messages (safely convert to strings)
        const errorDetails = result.errors && result.errors.length > 0
          ? `\n\nErrors:\n${result.errors.slice(0, 3).map(e => safeStringify(e)).join('\n')}${result.errors.length > 3 ? '\n...' : ''}`
          : '';
        toast.error(`Posted ${result.processedCount} transactions, ${result.failedCount} failed${errorDetails}`, {
          duration: 10000
        });
        console.error('Posting errors:', result.errors);
      }
    } catch (error) {
      console.error('Failed to post transactions:', error);
      const errorMessage = safeStringify(error);
      toast.error(`Failed to post transactions: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // AI Artifact Handlers
  const handleAnalyzeWithAI = async () => {
    if (needsAI.length === 0 || currentAIIndex >= needsAI.length) return;

    const currentTransaction = needsAI[currentAIIndex].transaction;
    setIsProcessingAI(true);

    try {
      const response = await fetch('/api/ai/analyze-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction: currentTransaction,
          availableAccounts: glAccounts,
          companyId // Now includes companyId for entity matching!
        })
      });

      const data = await response.json();

      if (data.success && data.suggestion) {
        setCurrentAISuggestion(data.suggestion);
        setCurrentAccountCreation(data.createAccount || null);
        // Phase 4: Capture advanced suggestions
        setCurrentMultiInvoiceSuggestions(data.multiInvoiceSuggestions || []);
        setCurrentPartialPaymentSuggestions(data.partialPaymentSuggestions || []);

        // Enhanced toast message
        let message = 'AI analysis complete!';
        if (data.multiInvoiceSuggestions && data.multiInvoiceSuggestions.length > 0) {
          message += ` Found ${data.multiInvoiceSuggestions.length} multi-invoice option(s).`;
        }
        if (data.partialPaymentSuggestions && data.partialPaymentSuggestions.length > 0) {
          message += ` Found ${data.partialPaymentSuggestions.length} partial payment option(s).`;
        }
        toast.success(message);
      } else if (data.fallback || !data.success) {
        // AI encountered an error or returned fallback mode
        const errorMessage = safeStringify(data.message || data.details || 'Could not generate suggestion');
        toast.error(`${errorMessage}\n\nOpening manual mapping...`);
        console.error('[AI] Analysis failed:', errorMessage);

        // Open manual mapping dialog as fallback
        const tx = transactions.find(t => t.id === currentTransaction.id);
        if (tx) {
          openMappingDialog(tx);
        }
      } else {
        toast.error('Could not generate suggestion. Opening manual mapping...');

        // Open manual mapping dialog as fallback
        const tx = transactions.find(t => t.id === currentTransaction.id);
        if (tx) {
          openMappingDialog(tx);
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error);
      toast.error('Failed to analyze transaction. Opening manual mapping...');

      // Open manual mapping dialog as fallback
      const tx = transactions.find(t => t.id === currentTransaction.id);
      if (tx) {
        openMappingDialog(tx);
      }
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleApproveAISuggestion = async () => {
    if (!currentAISuggestion || !ruleLearningService) return;

    const currentTransaction = needsAI[currentAIIndex].transaction;
    setIsProcessingAI(true);

    try {
      // Save AI approval as rule using RuleLearningService
      const ruleResult = await ruleLearningService.saveAIApprovalAsRule(
        currentTransaction,
        currentAISuggestion
      );

      if (ruleResult.created) {
        // Apply mapping to current transaction
        const mapping: GLMapping = {
          debitAccount: {
            id: currentAISuggestion.debitAccount.id || '',
            code: currentAISuggestion.debitAccount.code,
            name: currentAISuggestion.debitAccount.name
          },
          creditAccount: {
            id: currentAISuggestion.creditAccount.id || '',
            code: currentAISuggestion.creditAccount.code,
            name: currentAISuggestion.creditAccount.name
          },
          confidence: currentAISuggestion.confidence / 100,
          manuallyMapped: false
        };

        // Find the ImportedTransaction from transactions array
        const tx = transactions.find(t => t.id === currentTransaction.id);
        if (tx) {
          saveMapping(currentTransaction.id, mapping);
          setSelectedTransactions(new Set([...selectedTransactions, currentTransaction.id]));

          // Batch-apply to similar unmapped transactions
          const similarCount = applyMappingToSimilar(tx, mapping, 80);

          // Update buckets - remove all newly mapped transactions
          const newlyMappedIds = new Set([currentTransaction.id]);
          transactions.forEach(t => {
            if (mappings.has(t.id)) newlyMappedIds.add(t.id);
          });

          setNeedsAI(needsAI.filter(item => !newlyMappedIds.has(item.transaction.id)));
          setNeedsReview(needsReview.filter(item => !newlyMappedIds.has(item.transaction.id)));

          // Show success message with batch count
          if (similarCount > 0) {
            toast.success(
              `✅ Mapping applied to ${similarCount + 1} similar transactions!\n📋 ${ruleResult.message}`,
              { duration: 5000 }
            );
          } else {
            toast.success(`✅ Mapping applied and rule saved!\n📋 ${ruleResult.message}`);
          }
        }

        // Move to next or clear
        if (needsAI.length > 1) {
          setCurrentAISuggestion(null);
          setCurrentAccountCreation(null);
          // Keep currentAIIndex the same since we removed one item
        } else {
          setCurrentAISuggestion(null);
          setCurrentAccountCreation(null);
          setCurrentAIIndex(0);
          toast.success('All AI transactions processed! 🎉');
        }
      }
    } catch (error) {
      console.error('Failed to approve AI suggestion:', error);
      toast.error('Failed to save mapping');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleEditAISuggestion = () => {
    if (needsAI.length === 0 || currentAIIndex >= needsAI.length) return;

    const currentTransaction = needsAI[currentAIIndex].transaction;
    const tx = transactions.find(t => t.id === currentTransaction.id);
    if (tx) {
      openMappingDialog(tx);
    }
  };

  const handleSkipAISuggestion = () => {
    // Move to next transaction or wrap around
    if (currentAIIndex < needsAI.length - 1) {
      setCurrentAIIndex(currentAIIndex + 1);
      setCurrentAISuggestion(null);
      setCurrentAccountCreation(null);
    } else {
      setCurrentAISuggestion(null);
      setCurrentAccountCreation(null);
      setCurrentAIIndex(0);
      toast('Reached end of AI transactions');
    }
  };

  const handlePreviousAI = () => {
    if (currentAIIndex > 0) {
      setCurrentAIIndex(currentAIIndex - 1);
      setCurrentAISuggestion(null);
      setCurrentAccountCreation(null);
    }
  };

  const handleNextAI = () => {
    if (currentAIIndex < needsAI.length - 1) {
      setCurrentAIIndex(currentAIIndex + 1);
      setCurrentAISuggestion(null);
      setCurrentAccountCreation(null);
    }
  };

  const handleSelectAlternative = async (alternativeIndex: number) => {
    if (!currentAISuggestion || !currentAISuggestion.alternatives) return;

    const alternative = currentAISuggestion.alternatives[alternativeIndex];
    if (alternative) {
      // Replace current suggestion with the selected alternative
      setCurrentAISuggestion({
        ...currentAISuggestion,
        debitAccount: alternative.debitAccount,
        creditAccount: alternative.creditAccount,
        confidence: alternative.confidence,
        reasoning: alternative.reasoning ? [alternative.reasoning] : currentAISuggestion.reasoning
      });
      toast('Alternative mapping selected');
    }
  };

  const handleCreateAndApply = async () => {
    if (!currentAccountCreation?.needed || !currentAISuggestion || !ruleLearningService) return;

    const currentTransaction = needsAI[currentAIIndex].transaction;
    setIsProcessingAI(true);

    try {
      // Create account AND save rule in one operation
      const result = await ruleLearningService.createAccountAndSaveRule(
        currentTransaction,
        currentAISuggestion,
        currentAccountCreation
      );

      if (result.account.created && result.rule.created) {
        // Apply mapping to current transaction
        const mapping: GLMapping = {
          debitAccount: {
            id: result.account.accountId,
            code: result.account.code,
            name: result.account.name
          },
          creditAccount: {
            id: currentAISuggestion.creditAccount.id || '',
            code: currentAISuggestion.creditAccount.code,
            name: currentAISuggestion.creditAccount.name
          },
          confidence: currentAISuggestion.confidence / 100,
          manuallyMapped: false
        };

        // Find the ImportedTransaction from transactions array
        const tx = transactions.find(t => t.id === currentTransaction.id);
        if (tx) {
          saveMapping(currentTransaction.id, mapping);
          setSelectedTransactions(new Set([...selectedTransactions, currentTransaction.id]));

          // Batch-apply to similar unmapped transactions
          const similarCount = applyMappingToSimilar(tx, mapping, 80);

          // Update buckets - remove all newly mapped transactions
          const newlyMappedIds = new Set([currentTransaction.id]);
          transactions.forEach(t => {
            if (mappings.has(t.id)) newlyMappedIds.add(t.id);
          });

          setNeedsAI(needsAI.filter(item => !newlyMappedIds.has(item.transaction.id)));
          setNeedsReview(needsReview.filter(item => !newlyMappedIds.has(item.transaction.id)));

          // Reload GL accounts to include newly created account
          await loadGLAccounts();

          // Show success message with batch count
          if (similarCount > 0) {
            toast.success(
              `✨ Success!\n📊 ${result.account.code} - ${result.account.name}\n✅ Applied to ${similarCount + 1} similar transactions!\n📋 ${result.rule.message}`,
              { duration: 6000 }
            );
          } else {
            toast.success(
              `✨ Success!\n📊 ${result.account.code} - ${result.account.name}\n📋 ${result.rule.message}`,
              { duration: 5000 }
            );
          }
        }

        // Move to next or clear
        if (needsAI.length > 1) {
          setCurrentAISuggestion(null);
          setCurrentAccountCreation(null);
        } else {
          setCurrentAISuggestion(null);
          setCurrentAccountCreation(null);
          setCurrentAIIndex(0);
          toast.success('All AI transactions processed! 🎉');
        }
      } else {
        toast.error('Failed to create account or rule');
      }
    } catch (error) {
      console.error('Failed to create account and apply:', error);
      toast.error('Failed to create account');
    } finally {
      setIsProcessingAI(false);
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

  const renderSelectedStatementSummary = () => {
    if (!selectedStatement) {
      return null;
    }

    const { accountInfo, summary } = selectedStatement;
    const period = formatPeriod(summary?.statementPeriod?.from, summary?.statementPeriod?.to);

    return (
      <Card className="border-dashed bg-muted/30">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Bank</p>
              <p className="font-semibold text-sm text-foreground">
                {accountInfo?.bankName || '—'}
              </p>
              {accountInfo?.branch && (
                <p className="text-xs text-muted-foreground mt-1">{accountInfo.branch}</p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Account</p>
              <p className="font-semibold text-sm text-foreground">
                {accountInfo?.accountName || '—'}
              </p>
              <div className="space-y-1 mt-1">
                {accountInfo?.accountNumber && (
                  <p className="font-mono text-[11px]">{accountInfo.accountNumber}</p>
                )}
                {accountInfo?.accountType && (
                  <p className="text-xs text-muted-foreground">{accountInfo.accountType}</p>
                )}
              </div>
            </div>
            <div className="md:text-right">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Statement Period</p>
              <p className="text-sm font-medium text-foreground">
                {period}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs md:justify-end">
                <div className="rounded-md border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-emerald-700">
                  <p className="uppercase tracking-wide opacity-80">Opening</p>
                  <p className="font-semibold text-sm">{formatBalance(summary?.openingBalance, companyCurrency)}</p>
                </div>
                <div className="rounded-md border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-indigo-700">
                  <p className="uppercase tracking-wide opacity-80">Closing</p>
                  <p className="font-semibold text-sm">{formatBalance(summary?.closingBalance, companyCurrency)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
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
              key={statement.id ?? statement.fileName}
              className={`cursor-pointer hover:shadow-md transition-shadow ${loading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => {
                if (statement.id) {
                  loadTransactionsFromStatement(statement.id);
                }
              }}
            >
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Bank</p>
                      <p className="font-semibold text-sm text-foreground">
                        {statement.accountInfo?.bankName || 'Bank account'}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium">
                        {statement.accountInfo?.accountName || 'Account'}
                      </p>
                      {statement.accountInfo?.accountNumber && (
                        <p className="font-mono text-[11px]">
                          {statement.accountInfo.accountNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 text-right">
                    <div className="text-xs text-muted-foreground text-right">
                      <p className="uppercase tracking-wide">Statement period</p>
                      <p className="text-sm font-medium text-foreground">
                        {formatPeriod(statement.summary?.statementPeriod?.from, statement.summary?.statementPeriod?.to)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-md border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-emerald-700">
                        <p className="text-[11px] uppercase tracking-wide opacity-80">Opening</p>
                        <p className="font-semibold">{formatBalance(statement.summary?.openingBalance, companyCurrency)}</p>
                      </div>
                      <div className="rounded-md border border-indigo-100 bg-indigo-50/80 px-3 py-2 text-indigo-700">
                        <p className="text-[11px] uppercase tracking-wide opacity-80">Closing</p>
                        <p className="font-semibold">{formatBalance(statement.summary?.closingBalance, companyCurrency)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="text-right">
                        <p className="uppercase tracking-wide">Transactions</p>
                        <p className="font-medium text-foreground">
                          {statement.summary?.transactionCount ?? statement.transactions.length}
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">AI-Powered Transaction Mapping</h3>
          <p className="text-sm text-muted-foreground">
            Intelligently categorized by confidence level
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
            Preview ({selectedTransactions.size})
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {renderSelectedStatementSummary()}

      {/* Tri-State Statistics Cards */}
      {processingStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total</p>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{processingStats.total}</p>
              <p className="text-xs text-muted-foreground mt-1">All transactions</p>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-green-700">🟢 Auto-Mapped</p>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-700">{processingStats.autoMappedCount}</p>
              <p className="text-xs text-green-600 mt-1">
                {processingStats.autoMappedPercentage.toFixed(0)}% - Ready to apply
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-yellow-700">🟡 Needs Review</p>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-700">{processingStats.needsReviewCount}</p>
              <p className="text-xs text-yellow-600 mt-1">
                Medium confidence - verify
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-700">🔵 Needs AI</p>
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">{processingStats.needsAICount}</p>
              <p className="text-xs text-blue-600 mt-1">
                Est. cost: ${processingStats.estimatedAICost.toFixed(3)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Processing transactions through AI pipeline...
          </AlertDescription>
        </Alert>
      )}

      {/* Tri-State Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="auto-mapped" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Auto-Mapped ({autoMapped.length})
          </TabsTrigger>
          <TabsTrigger value="needs-review" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Needs Review ({needsReview.length})
          </TabsTrigger>
          <TabsTrigger value="needs-ai" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Needs AI ({needsAI.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Auto-Mapped */}
        <TabsContent value="auto-mapped" className="space-y-4">
          {autoMapped.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No high-confidence mappings found. Review other tabs for transactions needing attention.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  These transactions matched existing rules with high confidence (≥85%)
                </p>
                <Button
                  onClick={() => {
                    // Select all auto-mapped transactions
                    const autoIds = autoMapped.map(item => item.transaction.id);
                    setSelectedTransactions(new Set(autoIds));
                  }}
                  size="sm"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Select All {autoMapped.length}
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={autoMapped.every(item => selectedTransactions.has(item.transaction.id))}
                          onCheckedChange={(checked) => {
                            const autoIds = autoMapped.map(item => item.transaction.id);
                            if (checked) {
                              setSelectedTransactions(new Set([...selectedTransactions, ...autoIds]));
                            } else {
                              const newSet = new Set(selectedTransactions);
                              autoIds.forEach(id => newSet.delete(id));
                              setSelectedTransactions(newSet);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Mapping</TableHead>
                      <TableHead>Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {autoMapped.map(({ transaction, mapping }) => (
                      <TableRow key={transaction.id} className="hover:bg-green-50/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedTransactions.has(transaction.id)}
                            onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm">{transaction.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
                        <TableCell className="text-sm">
                          {formatAmount(transaction.debit || transaction.credit || 0, companyCurrency)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>Dr: {mapping.debitAccount.code}</div>
                          <div>Cr: {mapping.creditAccount.code}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-green-600">
                            {mapping.confidence}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 2: Needs Review */}
        <TabsContent value="needs-review" className="space-y-4">
          {needsReview.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                No transactions need review. All transactions either auto-mapped or need AI assistance.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  These transactions have medium confidence (60-84%). Quick review recommended.
                </p>
              </div>

              <div className="space-y-3">
                {needsReview.map(({ transaction, suggestedMapping }) => (
                  <Card key={transaction.id} className="border-yellow-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={selectedTransactions.has(transaction.id)}
                              onCheckedChange={() => toggleTransactionSelection(transaction.id)}
                            />
                            <div>
                              <p className="font-semibold text-sm">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {transaction.date} • {formatAmount(transaction.debit || transaction.credit || 0, companyCurrency)}
                              </p>
                            </div>
                          </div>
                          <div className="ml-6 text-sm space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Debit:</span>
                              <span className="font-medium">{suggestedMapping.debitAccount.code} - {suggestedMapping.debitAccount.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Credit:</span>
                              <span className="font-medium">{suggestedMapping.creditAccount.code} - {suggestedMapping.creditAccount.name}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                            {suggestedMapping.confidence}% Match
                          </Badge>
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" onClick={() => {
                              const tx = transactions.find(t => t.id === transaction.id);
                              if (tx) openMappingDialog(tx);
                            }}>
                              Edit
                            </Button>
                            <Button size="sm" onClick={() => {
                              // Apply the suggested mapping
                              const mapping: GLMapping = {
                                debitAccount: {
                                  id: suggestedMapping.debitAccount.id || '',
                                  code: suggestedMapping.debitAccount.code,
                                  name: suggestedMapping.debitAccount.name
                                },
                                creditAccount: {
                                  id: suggestedMapping.creditAccount.id || '',
                                  code: suggestedMapping.creditAccount.code,
                                  name: suggestedMapping.creditAccount.name
                                },
                                confidence: suggestedMapping.confidence / 100,
                                manuallyMapped: false
                              };

                              // Save the mapping
                              saveMapping(transaction.id, mapping);
                              setSelectedTransactions(new Set([...selectedTransactions, transaction.id]));

                              // Remove from needsReview bucket
                              setNeedsReview(needsReview.filter(item => item.transaction.id !== transaction.id));

                              // Optionally apply to similar transactions
                              const tx = transactions.find(t => t.id === transaction.id);
                              if (tx) {
                                const similarCount = applyMappingToSimilar(tx, mapping, 80);
                                if (similarCount > 0) {
                                  toast.success(`✅ Mapping applied to ${similarCount + 1} similar transactions!`, { duration: 5000 });

                                  // Remove all newly mapped transactions from needsReview
                                  const newlyMappedIds = new Set([transaction.id]);
                                  transactions.forEach(t => {
                                    if (mappings.has(t.id)) newlyMappedIds.add(t.id);
                                  });
                                  setNeedsReview(needsReview.filter(item => !newlyMappedIds.has(item.transaction.id)));
                                } else {
                                  toast.success('✅ Mapping applied!');
                                }
                              } else {
                                toast.success('✅ Mapping applied!');
                              }
                            }}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab 3: Needs AI */}
        <TabsContent value="needs-ai" className="space-y-4">
          {needsAI.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>
                All transactions have been mapped! No AI assistance needed.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Show AIMappingArtifact when analyzing */}
              {currentAISuggestion ? (
                <AIMappingArtifact
                  transaction={needsAI[currentAIIndex].transaction}
                  suggestion={currentAISuggestion}
                  createAccount={currentAccountCreation}
                  currentIndex={currentAIIndex + 1}
                  totalCount={needsAI.length}
                  onApprove={handleApproveAISuggestion}
                  onEdit={handleEditAISuggestion}
                  onSkip={handleSkipAISuggestion}
                  onPrevious={currentAIIndex > 0 ? handlePreviousAI : undefined}
                  onNext={currentAIIndex < needsAI.length - 1 ? handleNextAI : undefined}
                  onSelectAlternative={handleSelectAlternative}
                  onCreateAndApply={handleCreateAndApply}
                  isLoading={isProcessingAI}
                  // Phase 4: Advanced suggestions
                  multiInvoiceSuggestions={currentMultiInvoiceSuggestions}
                  partialPaymentSuggestions={currentPartialPaymentSuggestions}
                  onApplyMultiInvoice={async (suggestion) => {
                    console.log('[Phase 5] Apply multi-invoice:', suggestion);

                    if (!user || !bankAccountId) {
                      toast.error('Missing user or bank account information');
                      return;
                    }

                    const currentTransaction = needsAI[currentAIIndex].transaction;
                    setIsProcessingAI(true);

                    try {
                      // Create payment allocation service
                      const allocationService = createPaymentAllocationService({
                        companyId,
                        userId: user.uid,
                        fiscalPeriodId: 'current', // TODO: Get from company settings
                        arAccountId: 'ar-account-id', // TODO: Get from company settings
                        bankAccountId: bankAccountId
                      });

                      // Convert suggestion to allocation format
                      const allocations: MultiInvoiceAllocation[] = suggestion.invoices.map(inv => ({
                        invoiceId: inv.id,
                        invoiceNumber: inv.invoiceNumber,
                        amount: inv.amount
                      }));

                      // Allocate payment
                      const result = await allocationService.allocateMultiInvoicePayment(
                        currentTransaction,
                        allocations
                      );

                      if (result.success) {
                        toast.success(safeStringify(result.message), { duration: 5000 });

                        // Remove from needs AI and move to next
                        setNeedsAI(needsAI.filter((_, idx) => idx !== currentAIIndex));
                        setCurrentAISuggestion(null);
                        setCurrentMultiInvoiceSuggestions([]);
                        setCurrentPartialPaymentSuggestions([]);

                        if (needsAI.length > 1) {
                          // Keep currentAIIndex the same since we removed one item
                        } else {
                          setCurrentAIIndex(0);
                        }
                      } else {
                        toast.error(safeStringify(result.message));
                      }
                    } catch (error: any) {
                      console.error('Multi-invoice allocation error:', error);
                      toast.error(`Failed to allocate payment: ${safeStringify(error)}`);
                    } finally {
                      setIsProcessingAI(false);
                    }
                  }}
                  onApplyPartialPayment={async (suggestion) => {
                    console.log('[Phase 5] Apply partial payment:', suggestion);

                    if (!user || !bankAccountId) {
                      toast.error('Missing user or bank account information');
                      return;
                    }

                    const currentTransaction = needsAI[currentAIIndex].transaction;
                    setIsProcessingAI(true);

                    try {
                      // Create payment allocation service
                      const allocationService = createPaymentAllocationService({
                        companyId,
                        userId: user.uid,
                        fiscalPeriodId: 'current', // TODO: Get from company settings
                        arAccountId: 'ar-account-id', // TODO: Get from company settings
                        bankAccountId: bankAccountId
                      });

                      // Convert suggestion to allocation format
                      const allocation: PartialPaymentAllocation = {
                        invoiceId: suggestion.invoice.id,
                        amount: currentTransaction.credit || 0,
                        remainingAmount: suggestion.remainingAmount
                      };

                      // Allocate partial payment
                      const result = await allocationService.allocatePartialPayment(
                        currentTransaction,
                        allocation
                      );

                      if (result.success) {
                        toast.success(safeStringify(result.message), { duration: 5000 });

                        // Remove from needs AI and move to next
                        setNeedsAI(needsAI.filter((_, idx) => idx !== currentAIIndex));
                        setCurrentAISuggestion(null);
                        setCurrentMultiInvoiceSuggestions([]);
                        setCurrentPartialPaymentSuggestions([]);

                        if (needsAI.length > 1) {
                          // Keep currentAIIndex the same since we removed one item
                        } else {
                          setCurrentAIIndex(0);
                        }
                      } else {
                        toast.error(safeStringify(result.message));
                      }
                    } catch (error: any) {
                      console.error('Partial payment allocation error:', error);
                      toast.error(`Failed to allocate partial payment: ${safeStringify(error)}`);
                    } finally {
                      setIsProcessingAI(false);
                    }
                  }}
                />
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      These transactions have no matching rules. AI analysis can suggest mappings.
                    </p>
                    <Button
                      onClick={handleAnalyzeWithAI}
                      disabled={needsAI.length === 0 || isProcessingAI}
                    >
                      {isProcessingAI ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Analyze with AI
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {needsAI.map(({ transaction }, idx) => (
                      <Card
                        key={transaction.id}
                        className={`border-blue-200 hover:bg-blue-50/50 transition-colors ${
                          idx === currentAIIndex ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Sparkles className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="font-semibold text-sm">{transaction.description}</p>
                                <p className="text-xs text-muted-foreground">
                                  {transaction.date} • {formatAmount(transaction.debit || transaction.credit || 0, companyCurrency)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-blue-600 text-blue-700">
                                No Rule Match
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const tx = transactions.find(t => t.id === transaction.id);
                                  if (tx) openMappingDialog(tx);
                                }}
                              >
                                Manual Map
                              </Button>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentAIIndex(idx);
                                  handleAnalyzeWithAI();
                                }}
                              >
                                <Sparkles className="h-3 w-3 mr-1" />
                                AI Analyze
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderPreviewStep = () => {
    const selectedTxs = transactions.filter(tx => selectedTransactions.has(tx.id));
    const bankDisplayName = selectedStatement?.accountInfo?.accountName || selectedStatement?.accountInfo?.bankName || 'Bank Account';

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
            <Button variant="outline" onClick={postToLedger} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post Directly to Production
                </>
              )}
            </Button>
            <Button onClick={postToStaging} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post to Staging
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>

        {renderSelectedStatementSummary()}

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You are about to post {selectedTxs.length} transactions.
            <br />
            <strong>Recommended:</strong> Use "Post to Staging" to review and verify balance before finalizing.
            <br />
            Or use "Post Directly to Production" to skip staging (cannot be undone).
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
                        {formatAmount(amount, companyCurrency)}
                      </p>
                    </div>
                    <div className="grid gap-2">
                      {tx.credit ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Dr: {bankDisplayName}</span>
                            <span>{formatAmount(amount, companyCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cr: {mapping?.creditAccount?.name || 'Unknown'}</span>
                            <span>{formatAmount(amount, companyCurrency)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm">
                            <span>Dr: {mapping?.debitAccount?.name || 'Unknown'}</span>
                            <span>{formatAmount(amount, companyCurrency)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Cr: {bankDisplayName}</span>
                            <span>{formatAmount(amount, companyCurrency)}</span>
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
            setProcessingStats(null);
            setStatistics(null);
            setSelectedStatement(null);
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
                        `Credit: ${formatAmount(currentMappingTransaction.credit, companyCurrency)}` :
                        `Debit: ${formatAmount(currentMappingTransaction.debit, companyCurrency)}`
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
                    <RadixSelect
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
                    </RadixSelect>
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
                    <RadixSelect
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
                    </RadixSelect>
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
