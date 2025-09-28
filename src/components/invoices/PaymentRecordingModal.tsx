'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoiceService, bankAccountService } from '@/lib/firebase';
import { Invoice, InvoicePayment, BankAccount } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  X,
  Receipt,
  DollarSign,
  Calendar,
  CreditCard,
  Building,
  Hash,
  FileText,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PaymentRecordingModalProps {
  invoice: Invoice;
  companyId: string;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

type PaymentMethod = 'cash' | 'check' | 'bank_transfer' | 'card' | 'other';

const paymentMethodOptions: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: 'cash', label: 'Cash', icon: DollarSign },
  { value: 'check', label: 'Check', icon: FileText },
  { value: 'bank_transfer', label: 'Bank Transfer', icon: Building },
  { value: 'card', label: 'Credit/Debit Card', icon: CreditCard },
  { value: 'other', label: 'Other', icon: Hash }
];

export default function PaymentRecordingModal({
  invoice,
  companyId,
  onClose,
  onPaymentRecorded
}: PaymentRecordingModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  // Form state
  const [paymentAmount, setPaymentAmount] = useState<number>(invoice.amountDue);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string>('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  // Validation
  const isPartialPayment = paymentAmount < invoice.amountDue;
  const isOverpayment = paymentAmount > invoice.amountDue;

  useEffect(() => {
    fetchBankAccounts();
  }, [companyId]);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await bankAccountService.getBankAccounts(companyId);
      setBankAccounts(accounts.filter(acc => acc.status === 'active'));

      // Set default bank account
      if (accounts.length > 0) {
        setSelectedBankAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      toast.error('Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!paymentAmount || paymentAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return false;
    }

    if (paymentAmount > invoice.amountDue) {
      if (!confirm('This payment amount is greater than the amount due. Continue?')) {
        return false;
      }
    }

    if (!paymentDate) {
      toast.error('Please select a payment date');
      return false;
    }

    if (paymentMethod === 'bank_transfer' && !selectedBankAccount) {
      toast.error('Please select a bank account for bank transfers');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !user) return;

    try {
      setSaving(true);

      const payment: Omit<InvoicePayment, 'id' | 'invoiceId' | 'createdAt'> = {
        paymentDate,
        amount: paymentAmount,
        paymentMethod,
        reference: reference || undefined,
        notes: notes || undefined,
        createdBy: user.id
      };

      await invoiceService.recordPayment(companyId, invoice.id, payment, user.id);

      toast.success('Payment recorded successfully!');
      onPaymentRecorded();

    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6">
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-8 w-8 rounded-full border-4 border-indigo-600 border-t-transparent"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg"
        >
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Record Payment
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Invoice Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Invoice:</span>
                  <span className="font-semibold">{invoice.invoiceNumber}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Customer:</span>
                  <span>{invoice.customerName}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Total Amount:</span>
                  <span>{formatCurrency(invoice.totalAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Amount Due:</span>
                  <span className="text-lg font-semibold text-red-600">
                    {formatCurrency(invoice.amountDue)}
                  </span>
                </div>
              </div>

              {/* Payment Amount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
                {isPartialPayment && (
                  <p className="text-sm text-yellow-600">
                    This is a partial payment. Remaining balance: {formatCurrency(invoice.amountDue - paymentAmount)}
                  </p>
                )}
                {isOverpayment && (
                  <p className="text-sm text-red-600">
                    This payment exceeds the amount due by {formatCurrency(paymentAmount - invoice.amountDue)}
                  </p>
                )}
              </div>

              {/* Payment Date */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Payment Method *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethodOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <Button
                        key={option.value}
                        variant={paymentMethod === option.value ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod(option.value)}
                        className="justify-start h-auto p-3"
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        <span className="text-sm">{option.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Bank Account (only for bank transfers) */}
              {paymentMethod === 'bank_transfer' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Bank Account *
                  </label>
                  <select
                    value={selectedBankAccount}
                    onChange={(e) => setSelectedBankAccount(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select bank account</option>
                    {bankAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} ({account.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Reference */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Reference (optional)
                </label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Check number, transfer ID, etc."
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional notes about this payment"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Payment Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-medium">Payment Summary:</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Payment Amount:</span>
                    <span className="font-semibold">{formatCurrency(paymentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <span className={invoice.amountDue - paymentAmount === 0 ? 'text-green-600 font-semibold' : ''}>
                      {formatCurrency(Math.max(0, invoice.amountDue - paymentAmount))}
                    </span>
                  </div>
                  {invoice.amountDue - paymentAmount === 0 && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <Check className="h-4 w-4" />
                      <span>Invoice will be marked as paid</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="flex-1"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  {saving ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}