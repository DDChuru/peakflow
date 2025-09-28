'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { quoteService, debtorService, chartOfAccountsService, adminService } from '@/lib/firebase';
import { Company, Debtor, ChartOfAccount, QuoteCreateRequest } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/navigation';
import {
  Plus,
  Save,
  Send,
  User,
  DollarSign,
  FileText,
  Search,
  X,
  Calendar,
  Calculator,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  glAccountId: string;
  accountCode?: string;
  itemCode?: string;
  notes?: string;
}

export default function CreateQuotePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  // Data
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityPeriod, setValidityPeriod] = useState(30);
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([{
    id: '1',
    description: '',
    quantity: 1,
    unitPrice: 0,
    amount: 0,
    taxRate: 0,
    taxAmount: 0,
    glAccountId: ''
  }]);

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subtotal + totalTax;
  const validUntil = new Date(quoteDate);
  validUntil.setDate(validUntil.getDate() + validityPeriod);

  useEffect(() => {
    if (companyId && user) {
      fetchData();
    }
  }, [companyId, user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const companies = await adminService.getAllCompanies();
      const currentCompany = companies.find(c => c.id === companyId);

      if (!currentCompany) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('You do not have access to this company');
        router.push('/companies');
        return;
      }

      setCompany(currentCompany);

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
        setLineItems(prev => prev.map((item, index) =>
          index === 0 ? { ...item, glAccountId: revenueAccounts[0].id } : item
        ));
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

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      const updated = { ...item, [field]: value };

      // Recalculate amounts when quantity or unit price changes
      if (field === 'quantity' || field === 'unitPrice') {
        updated.amount = updated.quantity * updated.unitPrice;
        updated.taxAmount = (updated.amount * updated.taxRate) / 100;
      }

      // Recalculate tax when tax rate changes
      if (field === 'taxRate') {
        updated.taxAmount = (updated.amount * updated.taxRate) / 100;
      }

      return updated;
    }));
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: (lineItems.length + 1).toString(),
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      glAccountId: accounts.length > 0 ? accounts[0].id : ''
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const validateForm = () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return false;
    }

    if (!quoteDate) {
      toast.error('Please enter a quote date');
      return false;
    }

    if (validityPeriod <= 0) {
      toast.error('Please enter a valid validity period');
      return false;
    }

    const validItems = lineItems.filter(item =>
      item.description.trim() && item.quantity > 0 && item.unitPrice > 0 && item.glAccountId
    );

    if (validItems.length === 0) {
      toast.error('Please add at least one valid line item');
      return false;
    }

    return true;
  };

  const handleSubmit = async (shouldSend: boolean = false) => {
    if (!validateForm() || !user) return;

    try {
      setSaving(true);

      // Filter out incomplete line items
      const validLineItems = lineItems.filter(item =>
        item.description.trim() && item.quantity > 0 && item.unitPrice > 0 && item.glAccountId
      ).map(item => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        glAccountId: item.glAccountId,
        accountCode: item.accountCode,
        itemCode: item.itemCode,
        notes: item.notes
      }));

      const quoteRequest: QuoteCreateRequest = {
        customerId: selectedCustomer!.id,
        quoteDate,
        validityPeriod,
        currency,
        lineItems: validLineItems,
        notes: notes || undefined,
        termsAndConditions: termsAndConditions || undefined
      };

      const quote = await quoteService.createQuote(companyId, quoteRequest, user.uid);

      if (shouldSend) {
        // Update status to sent
        await quoteService.updateQuoteStatus(companyId, quote.id, 'sent', user.uid);
        toast.success('Quote created and sent successfully!');
      } else {
        toast.success('Quote created successfully!');
      }

      // Navigate to quote detail page
      router.push(`/companies/${companyId}/quotes/${quote.id}`);

    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Failed to create quote');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title="Create Quote"
          subtitle="Create a new quote for your customer"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Quotes', href: `/companies/${companyId}/quotes` },
            { label: 'Create' }
          ]}
          backHref={`/companies/${companyId}/quotes`}
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/quotes`)}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Quotes
              </Button>
            </div>
          }
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>

            {/* Quote Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Quote Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Quote Date *
                    </label>
                    <Input
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Validity Period (Days) *
                    </label>
                    <Input
                      type="number"
                      value={validityPeriod}
                      onChange={(e) => setValidityPeriod(parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Valid Until
                    </label>
                    <Input
                      value={validUntil.toLocaleDateString()}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Line Items
                  </CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {lineItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">Item {index + 1}</Badge>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Description *
                        </label>
                        <Input
                          placeholder="Service or product description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Revenue Account *
                        </label>
                        <select
                          value={item.glAccountId}
                          onChange={(e) => updateLineItem(index, 'glAccountId', e.target.value)}
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
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Quantity *
                        </label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Unit Price *
                        </label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
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
                          value={item.taxRate}
                          onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.01"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <Input
                          value={formatCurrency(item.amount)}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Tax:</span>
                        <span>{formatCurrency(totalTax)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Internal notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Terms and Conditions
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Terms and conditions for this quote..."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/quotes`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={saving}
              >
                <Send className="h-4 w-4" />
                {saving ? 'Creating...' : 'Save & Send'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}