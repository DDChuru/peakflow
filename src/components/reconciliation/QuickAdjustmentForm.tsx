'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Plus,
  DollarSign,
  CheckCircle2,
  RefreshCcw,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn, formatCurrency } from '@/lib/utils';
import { reconciliationService } from '@/lib/accounting/reconciliation-service';
import type {
  AdjustmentJournalEntry,
  CreateAdjustmentJournalInput,
} from '@/types/accounting/reconciliation';
import type { AccountRecord } from '@/types/accounting/chart-of-accounts';

const quickAdjustmentSchema = z.object({
  description: z.string().min(3, 'Description required'),
  amount: z.number().min(0.01, 'Amount must be positive'),
  adjustmentType: z.enum(['fee', 'interest', 'timing', 'other']),
  expenseAccountId: z.string().min(1, 'Account required'),
});

type QuickAdjustmentFormData = z.infer<typeof quickAdjustmentSchema>;

interface QuickAdjustmentFormProps {
  companyId: string;
  sessionId: string;
  bankAccountId: string;
  bankAccountCode: string;
  currency: string;
  fiscalPeriodId: string;
  availableAccounts: AccountRecord[];
  onAdjustmentCreated?: (adjustment: AdjustmentJournalEntry) => void;
  onCancel?: () => void;
  className?: string;
}

// Predefined common adjustments
const COMMON_ADJUSTMENTS = [
  {
    description: 'Bank service charge',
    adjustmentType: 'fee' as const,
    placeholder: '25.00',
  },
  {
    description: 'Interest earned',
    adjustmentType: 'interest' as const,
    placeholder: '15.00',
  },
  {
    description: 'Outstanding check',
    adjustmentType: 'timing' as const,
    placeholder: '100.00',
  },
];

export default function QuickAdjustmentForm({
  companyId,
  sessionId,
  bankAccountId,
  bankAccountCode,
  currency,
  fiscalPeriodId,
  availableAccounts,
  onAdjustmentCreated,
  onCancel,
  className,
}: QuickAdjustmentFormProps) {
  const [creating, setCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof COMMON_ADJUSTMENTS[0] | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuickAdjustmentFormData>({
    resolver: zodResolver(quickAdjustmentSchema),
  });

  const expenseAccounts = availableAccounts.filter(acc => acc.type === 'expense');
  const watchedType = watch('adjustmentType');

  const handleTemplateSelect = (template: typeof COMMON_ADJUSTMENTS[0]) => {
    setSelectedTemplate(template);
    setValue('description', template.description);
    setValue('adjustmentType', template.adjustmentType);

    // Auto-select appropriate account based on type
    const suggestedAccount = getSuggestedAccount(template.adjustmentType);
    if (suggestedAccount) {
      setValue('expenseAccountId', suggestedAccount.id);
    }
  };

  const getSuggestedAccount = (type: string): AccountRecord | undefined => {
    switch (type) {
      case 'fee':
        return expenseAccounts.find(acc =>
          acc.name.toLowerCase().includes('bank') ||
          acc.name.toLowerCase().includes('fee') ||
          acc.code.includes('6200')
        );
      case 'interest':
        return expenseAccounts.find(acc =>
          acc.name.toLowerCase().includes('interest') ||
          acc.code.includes('4000')
        );
      default:
        return undefined;
    }
  };

  const onSubmit = async (data: QuickAdjustmentFormData) => {
    const selectedAccount = availableAccounts.find(acc => acc.id === data.expenseAccountId);
    if (!selectedAccount) {
      toast.error('Please select a valid expense account');
      return;
    }

    try {
      setCreating(true);

      // Create the adjustment record
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
            isQuickAdjustment: true,
            template: selectedTemplate?.description,
          },
        }
      );

      // Create the journal entry
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
      };

      const journalEntry = await reconciliationService.createAdjustmentJournal(
        companyId,
        journalInput
      );

      toast.success('Adjustment created successfully');
      reset();
      setSelectedTemplate(null);
      onAdjustmentCreated?.(journalEntry);
    } catch (error) {
      console.error('Failed to create adjustment:', error);
      toast.error('Failed to create adjustment');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Quick Adjustment</h3>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Quick Templates */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Common adjustments:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {COMMON_ADJUSTMENTS.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleTemplateSelect(template)}
                className={cn(
                  'justify-start text-left h-auto p-2',
                  selectedTemplate === template && 'border-blue-500 bg-blue-50'
                )}
              >
                <div>
                  <div className="font-medium text-xs">{template.description}</div>
                  <div className="text-xs text-gray-500">
                    {template.adjustmentType} • {formatCurrency(parseFloat(template.placeholder), currency)}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <input
              type="text"
              {...register('description')}
              className={cn(
                'w-full px-3 py-2 text-sm border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.description && 'border-red-500'
              )}
              placeholder="Adjustment description"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <DollarSign className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  {...register('amount', { valueAsNumber: true })}
                  className={cn(
                    'w-full pl-8 pr-3 py-2 text-sm border rounded-md',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500',
                    errors.amount && 'border-red-500'
                  )}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>
              )}
            </div>

            <div>
              <select
                {...register('adjustmentType')}
                className={cn(
                  'w-full px-3 py-2 text-sm border rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  errors.adjustmentType && 'border-red-500'
                )}
              >
                <option value="">Type...</option>
                <option value="fee">Bank Fee</option>
                <option value="interest">Interest</option>
                <option value="timing">Timing</option>
                <option value="other">Other</option>
              </select>
              {errors.adjustmentType && (
                <p className="mt-1 text-xs text-red-600">{errors.adjustmentType.message}</p>
              )}
            </div>
          </div>

          <div>
            <select
              {...register('expenseAccountId')}
              className={cn(
                'w-full px-3 py-2 text-sm border rounded-md',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.expenseAccountId && 'border-red-500'
              )}
            >
              <option value="">Select expense account...</option>
              {expenseAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
            {errors.expenseAccountId && (
              <p className="mt-1 text-xs text-red-600">{errors.expenseAccountId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={creating} className="flex items-center gap-2">
              {creating ? (
                <>
                  <RefreshCcw className="h-3 w-3 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3 w-3" />
                  Create
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}