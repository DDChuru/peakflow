'use client';

import React, { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DraggableLocation
} from '@hello-pangea/dnd';
import {
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  Target,
  Zap,
  Clock,
  DollarSign,
  AlertCircle,
  Link2,
  Unlink,
  Eye,
  RefreshCw,
  Banknote,
  BookOpen,
  Calendar,
  Hash,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { cn, formatCurrency } from '@/lib/utils';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import type { BankTransaction } from '@/types/bank-statement';
import type { LedgerEntry } from '@/types/accounting/general-ledger';
import type {
  ReconciliationMatch,
  ReconciliationMatchStatus
} from '@/types/accounting/reconciliation';

interface ManualMatchingInterfaceProps {
  companyId: string;
  sessionId: string;
  bankTransactions: BankTransaction[];
  ledgerEntries: LedgerEntry[];
  existingMatches: ReconciliationMatch[];
  onMatchCreated: (match: ReconciliationMatch) => void;
  onMatchUpdated: (matchId: string, status: ReconciliationMatchStatus) => void;
  onMatchDeleted: (matchId: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

interface PendingMatch {
  bankTransaction: BankTransaction;
  ledgerEntry: LedgerEntry;
  confidence: number;
  amountDifference: number;
}

export default function ManualMatchingInterface({
  companyId,
  sessionId,
  bankTransactions,
  ledgerEntries,
  existingMatches,
  onMatchCreated,
  onMatchUpdated,
  onMatchDeleted,
  onRefresh,
  loading = false,
}: ManualMatchingInterfaceProps) {
  const [selectedBankTransaction, setSelectedBankTransaction] = useState<BankTransaction | null>(null);
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<LedgerEntry | null>(null);
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([]);
  const [activeTab, setActiveTab] = useState<'manual' | 'suggested' | 'confirmed'>('manual');
  const [processingMatch, setProcessingMatch] = useState(false);

  // Create sets of matched transaction IDs for quick lookup
  const matchedBankIds = useMemo(() =>
    new Set(existingMatches.map(match => match.bankTransactionId)),
    [existingMatches]
  );

  const matchedLedgerIds = useMemo(() =>
    new Set(existingMatches.map(match => match.ledgerTransactionId)),
    [existingMatches]
  );

  // Filter unmatched transactions
  const unmatchedBankTransactions = useMemo(() =>
    bankTransactions.filter(tx =>
      tx.id && !matchedBankIds.has(getBankTransactionKey(tx))
    ),
    [bankTransactions, matchedBankIds]
  );

  const unmatchedLedgerEntries = useMemo(() =>
    ledgerEntries.filter(entry => !matchedLedgerIds.has(entry.id)),
    [ledgerEntries, matchedLedgerIds]
  );

  // Calculate match confidence
  const calculateMatchConfidence = useCallback((bankTx: BankTransaction, ledgerEntry: LedgerEntry): number => {
    const bankAmount = (bankTx.credit ?? 0) - (bankTx.debit ?? 0);
    const ledgerAmount = ledgerEntry.debit - ledgerEntry.credit;
    const amountDiff = Math.abs(bankAmount - ledgerAmount);

    // Amount score (0-50 points)
    const amountScore = amountDiff === 0 ? 50 : Math.max(0, 50 - (amountDiff / Math.abs(bankAmount) * 50));

    // Date score (0-30 points)
    const bankDate = new Date(bankTx.date);
    const ledgerDate = new Date(ledgerEntry.transactionDate);
    const daysDiff = Math.abs((bankDate.getTime() - ledgerDate.getTime()) / (1000 * 60 * 60 * 24));
    const dateScore = Math.max(0, 30 - (daysDiff * 3));

    // Reference score (0-20 points)
    const bankRef = (bankTx.reference || '').toLowerCase();
    const ledgerRef = (ledgerEntry.metadata?.reference || '').toString().toLowerCase();
    const referenceScore = bankRef && ledgerRef && bankRef.includes(ledgerRef) ? 20 : 0;

    return Math.min(100, amountScore + dateScore + referenceScore) / 100;
  }, []);

  // Handle drag and drop
  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;

    // Handle bank transaction dropped on ledger entry
    if (source.droppableId === 'bank-transactions' && destination.droppableId.startsWith('ledger-entry-')) {
      const ledgerEntryId = destination.droppableId.replace('ledger-entry-', '');
      const bankTransaction = unmatchedBankTransactions.find(tx => getBankTransactionKey(tx) === draggableId);
      const ledgerEntry = unmatchedLedgerEntries.find(entry => entry.id === ledgerEntryId);

      if (bankTransaction && ledgerEntry) {
        const confidence = calculateMatchConfidence(bankTransaction, ledgerEntry);
        const bankAmount = (bankTransaction.credit ?? 0) - (bankTransaction.debit ?? 0);
        const ledgerAmount = ledgerEntry.debit - ledgerEntry.credit;
        const amountDifference = Math.abs(bankAmount - ledgerAmount);

        setPendingMatches(prev => [
          ...prev.filter(pm =>
            getBankTransactionKey(pm.bankTransaction) !== draggableId &&
            pm.ledgerEntry.id !== ledgerEntryId
          ),
          { bankTransaction, ledgerEntry, confidence, amountDifference }
        ]);

        setSelectedBankTransaction(bankTransaction);
        setSelectedLedgerEntry(ledgerEntry);
      }
    }
  }, [unmatchedBankTransactions, unmatchedLedgerEntries, calculateMatchConfidence]);

  // Handle click matching
  const handleTransactionClick = useCallback((transaction: BankTransaction | LedgerEntry) => {
    if ('credit' in transaction || 'debit' in transaction) {
      // This is a bank transaction
      const bankTx = transaction as BankTransaction;
      if (selectedLedgerEntry) {
        // Create match with selected ledger entry
        const confidence = calculateMatchConfidence(bankTx, selectedLedgerEntry);
        const bankAmount = (bankTx.credit ?? 0) - (bankTx.debit ?? 0);
        const ledgerAmount = selectedLedgerEntry.debit - selectedLedgerEntry.credit;
        const amountDifference = Math.abs(bankAmount - ledgerAmount);

        setPendingMatches(prev => [
          ...prev.filter(pm =>
            getBankTransactionKey(pm.bankTransaction) !== getBankTransactionKey(bankTx) &&
            pm.ledgerEntry.id !== selectedLedgerEntry.id
          ),
          { bankTransaction: bankTx, ledgerEntry: selectedLedgerEntry, confidence, amountDifference }
        ]);

        setSelectedBankTransaction(bankTx);
      } else {
        setSelectedBankTransaction(bankTx);
        setSelectedLedgerEntry(null);
      }
    } else {
      // This is a ledger entry
      const ledgerEntry = transaction as LedgerEntry;
      if (selectedBankTransaction) {
        // Create match with selected bank transaction
        const confidence = calculateMatchConfidence(selectedBankTransaction, ledgerEntry);
        const bankAmount = (selectedBankTransaction.credit ?? 0) - (selectedBankTransaction.debit ?? 0);
        const ledgerAmount = ledgerEntry.debit - ledgerEntry.credit;
        const amountDifference = Math.abs(bankAmount - ledgerAmount);

        setPendingMatches(prev => [
          ...prev.filter(pm =>
            getBankTransactionKey(pm.bankTransaction) !== getBankTransactionKey(selectedBankTransaction) &&
            pm.ledgerEntry.id !== ledgerEntry.id
          ),
          { bankTransaction: selectedBankTransaction, ledgerEntry, confidence, amountDifference }
        ]);

        setSelectedLedgerEntry(ledgerEntry);
      } else {
        setSelectedLedgerEntry(ledgerEntry);
        setSelectedBankTransaction(null);
      }
    }
  }, [selectedBankTransaction, selectedLedgerEntry, calculateMatchConfidence]);

  // Create match
  const createMatch = useCallback(async (pendingMatch: PendingMatch) => {
    try {
      setProcessingMatch(true);

      const match = await reconciliationService.recordMatch(companyId, sessionId, {
        bankTransactionId: getBankTransactionKey(pendingMatch.bankTransaction),
        ledgerTransactionId: pendingMatch.ledgerEntry.id,
        amount: (pendingMatch.bankTransaction.credit ?? 0) - (pendingMatch.bankTransaction.debit ?? 0),
        status: 'suggested',
        confidence: pendingMatch.confidence,
        notes: `Manual match created with ${Math.round(pendingMatch.confidence * 100)}% confidence`,
        metadata: {
          manualMatch: true,
          amountDifference: pendingMatch.amountDifference,
        },
        createdBy: 'user', // This should come from auth context
      });

      onMatchCreated(match);
      setPendingMatches(prev => prev.filter(pm => pm !== pendingMatch));
      setSelectedBankTransaction(null);
      setSelectedLedgerEntry(null);

      toast.success('Match created successfully');
    } catch (error) {
      console.error('Failed to create match:', error);
      toast.error('Failed to create match');
    } finally {
      setProcessingMatch(false);
    }
  }, [companyId, sessionId, onMatchCreated]);

  // Confirm match
  const confirmMatch = useCallback(async (matchId: string) => {
    try {
      await reconciliationService.updateMatchStatus(companyId, sessionId, matchId, 'confirmed');
      onMatchUpdated(matchId, 'confirmed');
      toast.success('Match confirmed');
    } catch (error) {
      console.error('Failed to confirm match:', error);
      toast.error('Failed to confirm match');
    }
  }, [companyId, sessionId, onMatchUpdated]);

  // Reject match
  const rejectMatch = useCallback(async (matchId: string) => {
    try {
      await reconciliationService.updateMatchStatus(companyId, sessionId, matchId, 'rejected');
      onMatchUpdated(matchId, 'rejected');
      toast.success('Match rejected');
    } catch (error) {
      console.error('Failed to reject match:', error);
      toast.error('Failed to reject match');
    }
  }, [companyId, sessionId, onMatchUpdated]);

  // Delete match
  const deleteMatch = useCallback(async (matchId: string) => {
    try {
      await reconciliationService.deleteMatch(companyId, sessionId, matchId);
      onMatchDeleted(matchId);
      toast.success('Match deleted');
    } catch (error) {
      console.error('Failed to delete match:', error);
      toast.error('Failed to delete match');
    }
  }, [companyId, sessionId, onMatchDeleted]);

  // Clear selections
  const clearSelections = useCallback(() => {
    setSelectedBankTransaction(null);
    setSelectedLedgerEntry(null);
    setPendingMatches([]);
  }, []);

  // Filter matches by status
  const suggestedMatches = existingMatches.filter(match => match.status === 'suggested');
  const confirmedMatches = existingMatches.filter(match => match.status === 'confirmed');

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 p-2">
            <ArrowRightLeft className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Manual Matching</h2>
            <p className="text-sm text-slate-600">
              Click transactions to select them, or drag bank transactions onto ledger entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(selectedBankTransaction || selectedLedgerEntry) && (
            <Button variant="outline" size="sm" onClick={clearSelections}>
              <XCircle className="mr-2 h-4 w-4" />
              Clear selection
            </Button>
          )}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn('mr-2 h-4 w-4', loading && 'animate-spin')} />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Pending Matches */}
      {pendingMatches.length > 0 && (
        <Card className="border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-5 w-5 text-violet-600" />
              <h3 className="text-lg font-semibold text-slate-900">Pending Matches</h3>
              <Badge variant="secondary">{pendingMatches.length}</Badge>
            </div>

            <div className="space-y-3">
              {pendingMatches.map((pendingMatch, index) => (
                <PendingMatchCard
                  key={`${getBankTransactionKey(pendingMatch.bankTransaction)}-${pendingMatch.ledgerEntry.id}`}
                  pendingMatch={pendingMatch}
                  onConfirm={() => createMatch(pendingMatch)}
                  onCancel={() => setPendingMatches(prev => prev.filter((_, i) => i !== index))}
                  processing={processingMatch}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Manual Matching
          </TabsTrigger>
          <TabsTrigger value="suggested" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Suggested ({suggestedMatches.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed" className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Confirmed ({confirmedMatches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-6">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Bank Transactions */}
              <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Banknote className="h-5 w-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Unmatched Bank Transactions</h3>
                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                      {unmatchedBankTransactions.length}
                    </Badge>
                  </div>

                  <Droppable droppableId="bank-transactions">
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={cn(
                          'space-y-3 min-h-[200px] p-3 rounded-lg border-2 border-dashed transition-colors',
                          snapshot.isDraggingOver
                            ? 'border-blue-400 bg-blue-100'
                            : 'border-blue-200 bg-blue-50/50'
                        )}
                      >
                        {unmatchedBankTransactions.map((transaction, index) => (
                          <Draggable
                            key={getBankTransactionKey(transaction)}
                            draggableId={getBankTransactionKey(transaction)}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={cn(
                                  'transition-all duration-200',
                                  snapshot.isDragging && 'rotate-2 scale-105'
                                )}
                              >
                                <BankTransactionCard
                                  transaction={transaction}
                                  selected={selectedBankTransaction === transaction}
                                  onClick={() => handleTransactionClick(transaction)}
                                  dragging={snapshot.isDragging}
                                />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>

              {/* Ledger Entries */}
              <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    <h3 className="text-lg font-semibold text-slate-900">Unmatched Ledger Entries</h3>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                      {unmatchedLedgerEntries.length}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {unmatchedLedgerEntries.map((entry) => (
                      <Droppable key={entry.id} droppableId={`ledger-entry-${entry.id}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={cn(
                              'transition-all duration-200',
                              snapshot.isDraggingOver && 'scale-105'
                            )}
                          >
                            <LedgerEntryCard
                              entry={entry}
                              selected={selectedLedgerEntry === entry}
                              onClick={() => handleTransactionClick(entry)}
                              dropTarget={snapshot.isDraggingOver}
                            />
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </DragDropContext>
        </TabsContent>

        <TabsContent value="suggested" className="space-y-4">
          {suggestedMatches.length === 0 ? (
            <EmptyState
              icon={<Clock className="h-12 w-12 text-slate-300" />}
              title="No suggested matches"
              description="Suggested matches will appear here after auto-matching runs."
            />
          ) : (
            <div className="space-y-4">
              {suggestedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onConfirm={() => confirmMatch(match.id)}
                  onReject={() => rejectMatch(match.id)}
                  onDelete={() => deleteMatch(match.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedMatches.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12 text-slate-300" />}
              title="No confirmed matches"
              description="Confirmed matches will appear here once you approve suggested matches."
            />
          ) : (
            <div className="space-y-4">
              {confirmedMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onDelete={() => deleteMatch(match.id)}
                  confirmed
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper function to get a consistent key for bank transactions
function getBankTransactionKey(transaction: BankTransaction): string {
  if (transaction.id) return transaction.id;
  return `${transaction.date}-${transaction.description}-${transaction.balance}`;
}

// Sub-components
interface BankTransactionCardProps {
  transaction: BankTransaction;
  selected: boolean;
  onClick: () => void;
  dragging?: boolean;
}

function BankTransactionCard({ transaction, selected, onClick, dragging }: BankTransactionCardProps) {
  const amount = (transaction.credit ?? 0) - (transaction.debit ?? 0);
  const isCredit = amount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        selected
          ? 'border-blue-500 bg-blue-100 shadow-lg shadow-blue-200/50'
          : 'border-blue-200 bg-white hover:border-blue-300',
        dragging && 'shadow-xl shadow-blue-300/50 border-blue-400 bg-blue-50'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Banknote className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <p className="font-medium text-slate-900 truncate">{transaction.description}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-3 w-3" />
            <span>{transaction.date}</span>
            {transaction.reference && (
              <>
                <span>·</span>
                <Hash className="h-3 w-3" />
                <span>{transaction.reference}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn(
            'font-bold',
            isCredit ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {formatCurrency(amount)}
          </span>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}
    </div>
  );
}

interface LedgerEntryCardProps {
  entry: LedgerEntry;
  selected: boolean;
  onClick: () => void;
  dropTarget?: boolean;
}

function LedgerEntryCard({ entry, selected, onClick, dropTarget }: LedgerEntryCardProps) {
  const amount = entry.debit - entry.credit;
  const isDebit = amount > 0;

  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-md',
        selected
          ? 'border-emerald-500 bg-emerald-100 shadow-lg shadow-emerald-200/50'
          : 'border-emerald-200 bg-white hover:border-emerald-300',
        dropTarget && 'border-emerald-400 bg-emerald-50 shadow-lg shadow-emerald-300/50 scale-105'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-emerald-600 flex-shrink-0" />
            <p className="font-medium text-slate-900">{entry.accountCode}</p>
            <Badge variant="secondary" className="text-xs">{entry.source}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Calendar className="h-3 w-3" />
            <span>
              {(entry.transactionDate instanceof Date
                ? entry.transactionDate
                : new Date(entry.transactionDate)
              ).toLocaleDateString()}
            </span>
            <span>·</span>
            <Hash className="h-3 w-3" />
            <span>J{entry.journalEntryId}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={cn(
            'font-bold',
            isDebit ? 'text-emerald-600' : 'text-rose-600'
          )}>
            {formatCurrency(amount)}
          </span>
          <p className="text-xs text-slate-500 mt-1">
            {isDebit ? 'Debit' : 'Credit'}
          </p>
        </div>
      </div>

      {selected && (
        <div className="absolute inset-0 border-2 border-emerald-500 rounded-lg pointer-events-none" />
      )}

      {dropTarget && (
        <div className="absolute inset-0 border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none bg-emerald-50/50" />
      )}
    </div>
  );
}

interface PendingMatchCardProps {
  pendingMatch: PendingMatch;
  onConfirm: () => void;
  onCancel: () => void;
  processing: boolean;
}

function PendingMatchCard({ pendingMatch, onConfirm, onCancel, processing }: PendingMatchCardProps) {
  const { bankTransaction, ledgerEntry, confidence, amountDifference } = pendingMatch;

  return (
    <FadeIn>
      <div className="group relative overflow-hidden rounded-xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-5 shadow-lg transition-all duration-300 hover:shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRightLeft className="h-5 w-5 text-violet-600" />
              <span className="font-semibold text-slate-900">Pending Match</span>
              <Badge variant="outline" className="text-violet-600 border-violet-200">
                <Target className="h-3 w-3 mr-1" />
                {Math.round(confidence * 100)}%
              </Badge>
              {amountDifference > 0 && (
                <Badge variant="secondary" className="text-amber-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Δ {formatCurrency(amountDifference)}
                </Badge>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Banknote className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">Bank Transaction</span>
                </div>
                <p className="text-sm text-slate-900 font-medium">{bankTransaction.description}</p>
                <p className="text-xs text-slate-600">{bankTransaction.date}</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Ledger Entry</span>
                </div>
                <p className="text-sm text-slate-900 font-medium">{ledgerEntry.accountCode}</p>
                <p className="text-xs text-slate-600">
                  {(ledgerEntry.transactionDate instanceof Date
                    ? ledgerEntry.transactionDate
                    : new Date(ledgerEntry.transactionDate)
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              onClick={onConfirm}
              disabled={processing}
              className="bg-violet-600 hover:bg-violet-700"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Confirm
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel} disabled={processing}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

interface MatchCardProps {
  match: ReconciliationMatch;
  onConfirm?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  confirmed?: boolean;
}

function MatchCard({ match, onConfirm, onReject, onDelete, confirmed }: MatchCardProps) {
  const statusStyles = {
    suggested: 'border-amber-200 bg-gradient-to-br from-white to-amber-50',
    confirmed: 'border-emerald-200 bg-gradient-to-br from-white to-emerald-50',
    rejected: 'border-rose-200 bg-gradient-to-br from-white to-rose-50',
  };

  const statusIcons = {
    suggested: <Clock className="h-4 w-4 text-amber-600" />,
    confirmed: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    rejected: <XCircle className="h-4 w-4 text-rose-600" />,
  };

  return (
    <FadeIn>
      <div className={cn(
        'group relative overflow-hidden rounded-xl border p-5 shadow-lg transition-all duration-300 hover:shadow-xl',
        statusStyles[match.status]
      )}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {statusIcons[match.status]}
              <span className="font-semibold text-slate-900">
                Match #{match.id.slice(-8)}
              </span>
              <Badge variant="outline" className="capitalize">
                {match.status}
              </Badge>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                {Math.round(match.confidence * 100)}%
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-slate-600 mb-3">
              <span>Amount: {formatCurrency(match.amount)}</span>
              <span>Date: {match.matchDate}</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="text-sm">
                <span className="font-medium text-slate-700">Bank: </span>
                <span className="text-slate-600">#{match.bankTransactionId}</span>
              </div>
              <div className="text-sm">
                <span className="font-medium text-slate-700">Ledger: </span>
                <span className="text-slate-600">#{match.ledgerTransactionId}</span>
              </div>
            </div>

            {match.notes && (
              <p className="text-sm text-slate-600 mt-2 italic">{match.notes}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {!confirmed && onConfirm && (
              <Button size="sm" onClick={onConfirm} className="bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Confirm
              </Button>
            )}
            {!confirmed && onReject && (
              <Button variant="outline" size="sm" onClick={onReject}>
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" onClick={onDelete} className="text-rose-600 hover:text-rose-700">
                <Unlink className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 opacity-60">{icon}</div>
      <h4 className="text-lg font-semibold text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-600 max-w-md">{description}</p>
    </div>
  );
}