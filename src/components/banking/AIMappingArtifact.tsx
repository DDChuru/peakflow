'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, ChevronRight, Check, X, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  MappingSuggestion,
  AccountCreationSuggestion
} from '@/lib/ai/accounting-assistant';
import { BankTransaction } from '@/types/bank-statement';

interface AIMappingArtifactProps {
  transaction: BankTransaction;
  suggestion: MappingSuggestion;
  createAccount?: AccountCreationSuggestion | null;
  currentIndex: number;
  totalCount: number;
  onApprove: () => void;
  onEdit: () => void;
  onSkip: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onSelectAlternative?: (index: number) => void;
  onCreateAndApply?: () => void;
  isLoading?: boolean;
}

export function AIMappingArtifact({
  transaction,
  suggestion,
  createAccount,
  currentIndex,
  totalCount,
  onApprove,
  onEdit,
  onSkip,
  onPrevious,
  onNext,
  onSelectAlternative,
  onCreateAndApply,
  isLoading = false
}: AIMappingArtifactProps) {

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isLoading) return;

      // Ignore if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' ||
          (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'Enter':
          if (createAccount?.needed && onCreateAndApply) {
            onCreateAndApply();
          } else {
            onApprove();
          }
          break;
        case 'e':
        case 'E':
          onEdit();
          break;
        case 's':
        case 'S':
          onSkip();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isLoading, onApprove, onEdit, onSkip, onPrevious, onNext, onCreateAndApply, createAccount]);

  const isPayment = transaction.debit && transaction.debit > 0;
  const amount = isPayment ? transaction.debit : transaction.credit;

  // Determine confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      {/* Header: Transaction Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              AI Analysis
            </h3>
            <Badge variant="outline" className="text-xs">
              Transaction {currentIndex} of {totalCount}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-medium text-gray-900">{transaction.description}</span>
            <span className="text-gray-500">•</span>
            <span className={cn(
              "font-semibold",
              isPayment ? "text-red-600" : "text-green-600"
            )}>
              R{amount?.toFixed(2)}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-600">{transaction.date}</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={!onPrevious || isLoading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={!onNext || isLoading}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Entity Match Badge (if entity was recognized) */}
      {suggestion.entityMatch && (
        <div className="rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 shadow-md">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
              <span className="text-white text-lg font-bold">
                {suggestion.entityMatch.type === 'debtor' ? '👤' : '🏢'}
              </span>
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-semibold text-gray-900">
                  {suggestion.entityMatch.type === 'debtor' ? 'Customer' : 'Supplier'} Recognized
                </h4>
                <Badge className="bg-green-600 text-white border-green-700">
                  {suggestion.entityMatch.confidence}% Match
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-semibold text-gray-900">
                    {suggestion.entityMatch.entityName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Method:</span>
                  <span className="ml-2 font-medium text-gray-700 capitalize">
                    {suggestion.entityMatch.matchMethod}
                  </span>
                </div>

                {suggestion.entityMatch.outstandingBalance !== undefined && (
                  <div>
                    <span className="text-gray-600">Outstanding:</span>
                    <span className="ml-2 font-semibold text-gray-900">
                      R{suggestion.entityMatch.outstandingBalance.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Suggested Invoice/Bill */}
              {suggestion.entityMatch.suggestedDocument && (
                <div className="mt-2 rounded-md bg-white border border-green-200 p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                        💡 Suggested {suggestion.entityMatch.type === 'debtor' ? 'Invoice' : 'Bill'}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs border-green-600 text-green-700">
                      {suggestion.entityMatch.suggestedDocument.confidence}% Match
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900">
                      {suggestion.entityMatch.suggestedDocument.number}
                    </span>
                    <span className="font-semibold text-gray-900">
                      R{suggestion.entityMatch.suggestedDocument.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Artifact Card */}
      <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50 p-6 shadow-lg">

        {/* Scenario 1: Missing Account - Create & Apply */}
        {createAccount?.needed ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <h4 className="text-lg font-semibold text-gray-900">
                  Missing Account Detected
                </h4>
                <p className="text-sm text-gray-700">
                  {createAccount.reasoning}
                </p>
              </div>
            </div>

            {/* Suggested New Account */}
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                  Suggested New Account
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Code:</span>
                  <span className="ml-2 font-semibold text-gray-900">{createAccount.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{createAccount.type}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-semibold text-gray-900">{createAccount.name}</span>
                </div>
                {createAccount.category && (
                  <div>
                    <span className="text-gray-600">Category:</span>
                    <span className="ml-2 font-medium text-gray-900">{createAccount.category}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Normal Balance:</span>
                  <span className="ml-2 font-medium text-gray-900 capitalize">{createAccount.normalBalance}</span>
                </div>
              </div>
            </div>

            {/* Proposed Mapping */}
            <div className="space-y-2">
              <h5 className="text-sm font-semibold text-gray-900">Proposed Mapping:</h5>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 border border-gray-200">
                  <span className="text-sm text-gray-600">Debit:</span>
                  <span className="font-semibold text-gray-900">
                    {suggestion.debitAccount.code} - {suggestion.debitAccount.name}
                  </span>
                  <span className="font-semibold text-gray-900">R{amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white px-3 py-2 border border-gray-200">
                  <span className="text-sm text-gray-600">Credit:</span>
                  <span className="font-semibold text-gray-900">
                    {suggestion.creditAccount.code} - {suggestion.creditAccount.name}
                  </span>
                  <span className="font-semibold text-gray-900">R{amount?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Reasoning */}
            {suggestion.reasoning && suggestion.reasoning.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900">Why this mapping?</h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  {suggestion.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action: Create & Apply */}
            <div className="flex items-center justify-between pt-2 border-t border-amber-200">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-xs text-gray-600">
                  Will save as rule for future auto-mapping
                </span>
              </div>
              <Button
                onClick={onCreateAndApply}
                disabled={isLoading}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
              >
                {isLoading ? 'Creating...' : 'Create Account & Apply'}
              </Button>
            </div>
          </div>
        ) : (
          /* Scenario 2 & 3: Standard Mapping or Multiple Options */
          <div className="space-y-4">
            {/* Confidence Badge */}
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Mapping Suggestion</h4>
              <Badge className={cn(
                "px-3 py-1 text-sm font-semibold border",
                getConfidenceColor(suggestion.confidence)
              )}>
                {suggestion.confidence}% Confidence
              </Badge>
            </div>

            {/* Primary Mapping */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between rounded-md bg-white px-4 py-3 border border-gray-300 shadow-sm">
                <span className="text-sm font-medium text-gray-600">Debit:</span>
                <span className="font-semibold text-gray-900">
                  {suggestion.debitAccount.code} - {suggestion.debitAccount.name}
                </span>
                <span className="font-semibold text-green-600">R{amount?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between rounded-md bg-white px-4 py-3 border border-gray-300 shadow-sm">
                <span className="text-sm font-medium text-gray-600">Credit:</span>
                <span className="font-semibold text-gray-900">
                  {suggestion.creditAccount.code} - {suggestion.creditAccount.name}
                </span>
                <span className="font-semibold text-red-600">R{amount?.toFixed(2)}</span>
              </div>
            </div>

            {/* Reasoning */}
            {suggestion.reasoning && suggestion.reasoning.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900">💬 Reasoning:</h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  {suggestion.reasoning.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Explanation */}
            {suggestion.explanation && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                <p className="text-sm text-gray-700">{suggestion.explanation}</p>
                {suggestion.accountingPrinciple && (
                  <p className="text-xs text-gray-600 mt-2">
                    <span className="font-semibold">Accounting Principle:</span> {suggestion.accountingPrinciple}
                  </p>
                )}
              </div>
            )}

            {/* Alternative Mappings */}
            {suggestion.alternatives && suggestion.alternatives.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-semibold text-gray-900">Alternative Mappings:</h5>
                <div className="space-y-2">
                  {suggestion.alternatives.map((alt, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectAlternative?.(idx)}
                      disabled={isLoading}
                      className="w-full text-left rounded-lg border border-gray-300 bg-gray-50 p-3 hover:bg-gray-100 hover:border-indigo-300 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-gray-900">
                          Option {idx + 2}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {alt.confidence}% confidence
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-700 space-y-0.5">
                        <div>
                          Debit: {alt.debitAccount.code} - {alt.debitAccount.name}
                        </div>
                        <div>
                          Credit: {alt.creditAccount.code} - {alt.creditAccount.name}
                        </div>
                        {alt.reasoning && (
                          <div className="text-xs text-gray-600 mt-1">
                            {alt.reasoning}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save as Rule Indicator */}
            {suggestion.shouldSaveAsRule && (
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Check className="h-4 w-4 text-green-600" />
                <span>Will save as rule for future auto-mapping</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onSkip}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Skip
          </Button>
          <Button
            variant="outline"
            onClick={onEdit}
            disabled={isLoading}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Edit Details
          </Button>
        </div>

        {/* Primary Action */}
        {!createAccount?.needed && (
          <Button
            onClick={onApprove}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6"
          >
            {isLoading ? 'Applying...' : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Approve & Save Rule
              </>
            )}
          </Button>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-gray-500 text-center space-x-4">
        <span><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">Enter</kbd> Approve</span>
        <span><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">E</kbd> Edit</span>
        <span><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">S</kbd> Skip</span>
        <span><kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">←</kbd> <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300">→</kbd> Navigate</span>
      </div>
    </motion.div>
  );
}
