'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileUp,
  ArrowRight,
  Calculator,
  CheckCircle,
  AlertCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Target,
  Zap,
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BankToLedgerImportProps {
  companyId: string;
}

export function BankToLedgerImport({ companyId }: BankToLedgerImportProps) {
  const [hasUnmatchedTransactions, setHasUnmatchedTransactions] = useState(true); // Mock state

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-white/80 backdrop-blur-xl">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/30 via-teal-50/20 to-green-50/30" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/5 to-transparent rounded-full -translate-y-16 translate-x-16" />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-slate-900">
                  Direct Bank to Ledger Import
                </h3>
                <span className="px-2 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold rounded-full shadow-lg animate-pulse">
                  <Sparkles className="h-3 w-3 inline mr-1" />
                  NEW
                </span>
              </div>
              <p className="text-sm text-slate-600 font-medium">
                Convert bank transactions directly to journal entries - no invoicing required
              </p>
            </div>
          </div>
        </div>

        {hasUnmatchedTransactions ? (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border border-white/30 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-slate-700" />
                  <span className="text-sm font-bold text-slate-700">Unmatched Transactions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">23</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-medium text-emerald-700">Ready for import</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-800">15</span>
                  <p className="text-xs text-emerald-600">transactions</p>
                </div>

                <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-700">Need GL mapping</span>
                  </div>
                  <span className="text-lg font-bold text-amber-800">8</span>
                  <p className="text-xs text-amber-600">transactions</p>
                </div>

                <div className="bg-blue-50/80 rounded-xl p-3 border border-blue-200/50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-blue-700">Total value</span>
                  </div>
                  <span className="text-lg font-bold text-blue-800">{formatCurrency(45280)}</span>
                  <p className="text-xs text-blue-600">amount</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href={`/workspace/${companyId}/bank-import`} className="flex-1">
                  <Button className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                    <div className="flex items-center justify-center">
                      <FileUp className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                      <span className="font-semibold">Import to Ledger</span>
                      <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </Button>
                </Link>
                <Link href={`/workspace/${companyId}/reconciliation`}>
                  <Button className="h-12 bg-white/60 hover:bg-white/80 border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-105 group px-6">
                    <span className="font-semibold">Review</span>
                    <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-gradient-to-br from-amber-50/80 to-orange-50/60 border border-amber-200/50 rounded-2xl p-4 backdrop-blur-sm shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-amber-900">Smart Suggestion</p>
                    <span className="px-2 py-0.5 bg-amber-200/50 text-amber-800 text-xs font-medium rounded-full">
                      AI
                    </span>
                  </div>
                  <p className="text-sm text-amber-800 mb-3 leading-relaxed">
                    8 transactions appear to be recurring expenses. Would you like to set up automatic GL mapping rules?
                  </p>
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group"
                  >
                    Set up rules
                    <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg text-center"
          >
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">All Caught Up!</h3>
            <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
              All bank transactions have been processed and imported to your ledger
            </p>
            <Link href={`/workspace/${companyId}/bank-statements`}>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                <FileText className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Upload New Statement
                <ChevronRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Button>
            </Link>
          </motion.div>
        )}

        <div className="mt-6 pt-5 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-600">This month imported</span>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900">127</span>
                <span className="text-sm text-slate-600">entries</span>
                <span className="text-slate-400">•</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(285000)}</span>
              </div>
              <p className="text-xs text-slate-500">Successfully processed</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}