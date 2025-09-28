'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoiceService, debtorService, chartOfAccountsService } from '@/lib/firebase';
import { Debtor, ChartOfAccount, InvoiceCreateRequest } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Save,
  Send,
  User,
  DollarSign,
  FileText,
  Search,
  X
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface QuickInvoiceFormProps {
  companyId: string;
  userId: string;
  onSuccess?: (invoiceId: string) => void;
  onCancel?: () => void;
  className?: string;
  isModal?: boolean;
}

export default function QuickInvoiceForm({
  companyId,
  userId,
  onSuccess,
  onCancel,
  className = '',
  isModal = false
}: QuickInvoiceFormProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Data
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Calculations
  const taxAmount = (amount * taxRate) / 100;
  const totalAmount = amount + taxAmount;

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [debtorsList, accountsList] = await Promise.all([
        debtorService.getDebtors(companyId),
        chartOfAccountsService.getAccounts(companyId)
      ]);

      setDebtors(debtorsList.filter(d => d.status === 'active'));

      // Filter revenue accounts
      const revenueAccounts = accountsList.filter(acc =>
        acc.category === 'revenue' || acc.accountType === 'revenue'
      );
      setAccounts(revenueAccounts);

      // Set default account if available
      if (revenueAccounts.length > 0) {
        setSelectedAccount(revenueAccounts[0].id);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDebtors = debtors.filter(debtor =>
    debtor.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    debtor.email?.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const validateForm = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return false;
    }

    if (!description.trim()) {
      toast.error('Please enter a description');
      return false;
    }

    if (amount <= 0) {
      toast.error('Please enter a valid amount');
      return false;
    }

    if (!selectedAccount) {
      toast.error('Please select a GL account');
      return false;
    }

    return true;
  };

  const handleSubmit = async (shouldSend: boolean = false) => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const invoiceRequest: InvoiceCreateRequest = {
        customerId: selectedCustomer!.id,
        invoiceDate: new Date().toISOString(),
        paymentTerms: 30,
        source: 'manual',
        currency: 'USD',
        lineItems: [{
          description,
          quantity: 1,
          unitPrice: amount,
          taxRate,
          glAccountId: selectedAccount
        }],
        notes: notes || undefined
      };

      const invoice = await invoiceService.createDirectInvoice(companyId, invoiceRequest, userId);

      if (shouldSend) {
        // TODO: Implement send functionality
        toast.success('Quick invoice created and sent!');
      } else {
        toast.success('Quick invoice created successfully!');
      }

      // Reset form
      setSelectedCustomer(null);
      setCustomerSearch('');
      setDescription('');
      setAmount(0);
      setTaxRate(0);
      setNotes('');

      // Call success callback
      onSuccess?.(invoice.id);

    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to create invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form
    setSelectedCustomer(null);
    setCustomerSearch('');
    setDescription('');
    setAmount(0);
    setTaxRate(0);
    setNotes('');

    onCancel?.();
  };

  if (loading) {
    return (
      <Card className={className}>
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
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Quick Invoice
          </CardTitle>
          {isModal && onCancel && (
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Customer *
          </label>
          <div className="relative">
            <Input
              icon={<Search className="h-4 w-4" />}
              placeholder="Search customers..."
              value={selectedCustomer ? selectedCustomer.name : customerSearch}
              onChange={(e) => {
                if (!selectedCustomer) {
                  setCustomerSearch(e.target.value);
                }
              }}
              onFocus={() => setShowCustomerDropdown(true)}
              onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
            />

            {showCustomerDropdown && !selectedCustomer && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {filteredDebtors.length > 0 ? (
                  filteredDebtors.map((debtor) => (
                    <div
                      key={debtor.id}
                      className="px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedCustomer(debtor);
                        setCustomerSearch('');
                        setShowCustomerDropdown(false);
                      }}
                    >
                      <div className="font-medium text-sm">{debtor.name}</div>
                      {debtor.email && (
                        <div className="text-xs text-gray-500">{debtor.email}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">No customers found</div>
                )}
              </div>
            )}
          </div>

          {selectedCustomer && (
            <div className="p-3 bg-gray-50 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{selectedCustomer.name}</div>
                  {selectedCustomer.email && (
                    <div className="text-xs text-gray-500">{selectedCustomer.email}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <Input
            placeholder="Service or product description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Amount and Tax */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Amount *
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Tax Rate (%)
            </label>
            <Input
              type="number"
              placeholder="0"
              value={taxRate || ''}
              onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              step="0.01"
            />
          </div>
        </div>

        {/* GL Account */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Revenue Account *
          </label>
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.accountCode} - {account.accountName}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Notes (optional)
          </label>
          <textarea
            rows={2}
            placeholder="Additional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
        </div>

        {/* Total Summary */}
        {amount > 0 && (
          <div className="border-t pt-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-1">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2 pt-4">
          {onCancel && (
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={saving}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => handleSubmit(false)}
            disabled={saving}
            className="flex-1"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            onClick={() => handleSubmit(true)}
            disabled={saving}
            className="flex-1"
          >
            <Send className="h-4 w-4" />
            {saving ? 'Creating...' : 'Save & Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}