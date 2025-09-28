'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  RefreshCcw,
  FileText,
  Calendar,
  Hash,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { cn, formatCurrency } from '@/lib/utils';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import type {
  ReconciliationAdjustment,
  AdjustmentJournalEntry,
  CreateAdjustmentJournalInput,
  ReversalJournalInput,
} from '@/types/accounting/reconciliation';
import type { AccountRecord } from '@/types/accounting/chart-of-accounts';

const adjustmentSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  adjustmentType: z.enum(['fee', 'interest', 'timing', 'other'], {
    errorMap: () => ({ message: 'Please select an adjustment type' }),
  }),
  expenseAccountId: z.string().min(1, 'Please select an expense account'),
  expenseAccountCode: z.string().optional(),
  reference: z.string().optional(),
});

type AdjustmentFormData = z.infer<typeof adjustmentSchema>;

interface AdjustmentEntryManagerProps {
  companyId: string;
  sessionId: string;
  bankAccountId: string;
  bankAccountCode: string;
  currency: string;
  fiscalPeriodId: string;
  availableAccounts: AccountRecord[];
  onAdjustmentCreated?: (adjustment: AdjustmentJournalEntry) => void;
  onAdjustmentReversed?: (reversal: AdjustmentJournalEntry) => void;
  readOnly?: boolean;
}

export default function AdjustmentEntryManager({
  companyId,
  sessionId,
  bankAccountId,
  bankAccountCode,
  currency,
  fiscalPeriodId,
  availableAccounts,
  onAdjustmentCreated,
  onAdjustmentReversed,
  readOnly = false,
}: AdjustmentEntryManagerProps) {
  const [adjustments, setAdjustments] = useState<ReconciliationAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [reversing, setReversing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [balanceValidation, setBalanceValidation] = useState<{
    isValid: boolean;
    message?: string;
    projectedDifference: number;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentSchema),
  });

  // Watch amount to validate balance in real-time
  const watchedAmount = watch('amount');

  useEffect(() => {
    loadAdjustments();
  }, [companyId, sessionId]);

  useEffect(() => {
    if (watchedAmount && watchedAmount > 0) {
      validateBalance([{ amount: watchedAmount }]);
    }
  }, [watchedAmount]);

  const loadAdjustments = async () => {
    try {
      setLoading(true);
      const result = await reconciliationService.getAdjustmentHistory(companyId, sessionId);
      setAdjustments(result);
    } catch (error) {
      console.error('Failed to load adjustments:', error);
      toast.error('Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  };

  const validateBalance = async (proposedAdjustments: { amount: number }[]) => {
    try {
      const validation = await reconciliationService.validateAdjustmentBalance(
        companyId,
        sessionId,
        proposedAdjustments
      );
      setBalanceValidation(validation);
    } catch (error) {
      console.error('Failed to validate balance:', error);
    }
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    if (!data.amount || data.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const selectedAccount = availableAccounts.find(acc => acc.id === data.expenseAccountId);
    if (!selectedAccount) {
      toast.error('Please select a valid expense account');
      return;
    }

    try {
      setCreating(true);

      // First create the adjustment record
      const adjustmentRecord = await reconciliationService.recordAdjustment(
        companyId,
        sessionId,
        {
          description: data.description,
          amount: data.amount,
          adjustmentType: data.adjustmentType,
          ledgerAccountId: data.expenseAccountId,
          ledgerAccountCode: selectedAccount.code,
          createdBy: 'current-user', // This should come from auth context
          metadata: {
            reference: data.reference,
          },
        }
      );

      // Then create the journal entry
      const journalInput: CreateAdjustmentJournalInput = {
        sessionId,
        adjustmentId: adjustmentRecord.id,
        bankAccountId,
        bankAccountCode,
        expenseAccountId: data.expenseAccountId,
        expenseAccountCode: selectedAccount.code,
        description: data.description,
        amount: data.amount,
        adjustmentType: data.adjustmentType,
        transactionDate: new Date(),
        fiscalPeriodId,
        currency,
        createdBy: 'current-user', // This should come from auth context
        reference: data.reference,
      };

      const journalEntry = await reconciliationService.createAdjustmentJournal(
        companyId,
        journalInput
      );

      toast.success('Adjustment created successfully');
      reset();
      setShowForm(false);
      await loadAdjustments();
      onAdjustmentCreated?.(journalEntry);
    } catch (error) {
      console.error('Failed to create adjustment:', error);
      toast.error('Failed to create adjustment');
    } finally {
      setCreating(false);
    }
  };

  const handleReverse = async (adjustment: ReconciliationAdjustment) => {
    if (!adjustment.postedJournalId) {
      toast.error('Cannot reverse adjustment without posted journal entry');
      return;
    }

    if (adjustment.reversalJournalId) {
      toast.error('This adjustment has already been reversed');
      return;
    }

    const reason = prompt('Please enter a reason for the reversal:');
    if (!reason) return;

    try {
      setReversing(adjustment.id);

      const reversalInput: ReversalJournalInput = {
        originalJournalId: adjustment.postedJournalId,
        reason,
        reversalDate: new Date(),
        createdBy: 'current-user', // This should come from auth context
      };

      const reversal = await reconciliationService.createReversalJournal(
        companyId,
        reversalInput
      );

      toast.success('Adjustment reversed successfully');
      await loadAdjustments();
      onAdjustmentReversed?.(reversal);
    } catch (error) {
      console.error('Failed to reverse adjustment:', error);
      toast.error('Failed to reverse adjustment');
    } finally {
      setReversing(null);
    }
  };

  const getAdjustmentTypeLabel = (type: string) => {
    switch (type) {
      case 'fee': return 'Bank Fee';
      case 'interest': return 'Interest';
      case 'timing': return 'Timing Difference';
      case 'other': return 'Other';
      default: return type;
    }
  };

  const getAdjustmentTypeColor = (type: string) => {
    switch (type) {
      case 'fee': return 'bg-red-100 text-red-800';
      case 'interest': return 'bg-green-100 text-green-800';
      case 'timing': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const expenseAccounts = availableAccounts.filter(acc => acc.type === 'expense');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Adjustment Entries</h3>
          <p className="text-sm text-gray-600">
            Create journal entries for bank fees, interest, and other adjustments
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        )}
      </div>

      {/* Balance Validation Alert */}
      {balanceValidation && watchedAmount && (
        <FadeIn>
          <div
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg border',
              balanceValidation.isValid
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-yellow-50 border-yellow-200 text-yellow-800'
            )}
          >
            {balanceValidation.isValid ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <span className="text-sm">{balanceValidation.message}</span>
          </div>
        </FadeIn>
      )}

      {/* Adjustment Form */}
      {showForm && !readOnly && (
        <FadeIn>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create Adjustment Entry
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      {...register('description')}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.description && 'border-red-500'
                      )}
                      placeholder="e.g., Bank service charge"
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Amount ({currency}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount', { valueAsNumber: true })}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.amount && 'border-red-500'
                      )}
                      placeholder="0.00"
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Adjustment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('adjustmentType')}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.adjustmentType && 'border-red-500'
                      )}
                    >
                      <option value="">Select type...</option>
                      <option value="fee">Bank Fee</option>
                      <option value="interest">Interest Earned</option>
                      <option value="timing">Timing Difference</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.adjustmentType && (
                      <p className="mt-1 text-sm text-red-600">{errors.adjustmentType.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Expense Account <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register('expenseAccountId')}
                      onChange={(e) => {
                        const selectedAccount = expenseAccounts.find(acc => acc.id === e.target.value);
                        if (selectedAccount) {
                          setValue('expenseAccountCode', selectedAccount.code);
                        }
                      }}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500',
                        errors.expenseAccountId && 'border-red-500'
                      )}
                    >
                      <option value="">Select account...</option>
                      {expenseAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                    {errors.expenseAccountId && (
                      <p className="mt-1 text-sm text-red-600">{errors.expenseAccountId.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
                    <input
                      type="text"
                      {...register('reference')}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Bank reference number"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating} className="flex items-center gap-2">
                    {creating ? (
                      <>
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Create Adjustment
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Adjustments List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <RefreshCcw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : adjustments.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No adjustments created yet</p>
              <p className="text-sm">Create adjustment entries for bank fees, interest, and other items</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <StaggerList>
          {adjustments.map((adjustment) => (
            <FadeIn key={adjustment.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className={getAdjustmentTypeColor(adjustment.adjustmentType)}>
                          {getAdjustmentTypeLabel(adjustment.adjustmentType)}
                        </Badge>
                        {adjustment.reversalJournalId && (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Reversed
                          </Badge>
                        )}
                      </div>

                      <div className="mb-2">
                        <h4 className="font-medium">{adjustment.description}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(adjustment.amount, currency)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {adjustment.createdAt.toLocaleDateString()}
                          </span>
                          {adjustment.ledgerAccountCode && (
                            <span className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              {adjustment.ledgerAccountCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {adjustment.postedJournalId && (
                        <div className="text-xs text-gray-500">
                          Journal Entry: {adjustment.postedJournalId}
                        </div>
                      )}
                    </div>

                    {!readOnly && adjustment.postedJournalId && !adjustment.reversalJournalId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReverse(adjustment)}
                        disabled={reversing === adjustment.id}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        {reversing === adjustment.id ? (
                          <RefreshCcw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Reverse
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeIn>
          ))}
        </StaggerList>
      )}
    </div>
  );
}