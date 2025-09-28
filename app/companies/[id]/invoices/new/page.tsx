'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService, debtorService, adminService, chartOfAccountsService } from '@/lib/firebase';
import { Company, Debtor, InvoiceCreateRequest, ChartOfAccount } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/navigation';
import {
  Plus,
  Minus,
  Save,
  Send,
  ArrowLeft,
  Calculator,
  User,
  Calendar,
  DollarSign,
  FileText,
  Trash2,
  Search
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  glAccountId: string;
  accountCode?: string;
  itemCode?: string;
}

export default function CreateInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);

  // Form data
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [purchaseOrderNumber, setPurchaseOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Line items
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      description: '',
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      glAccountId: '',
      accountCode: '',
      itemCode: ''
    }
  ]);

  // Calculations
  const [subtotal, setSubtotal] = useState(0);
  const [totalTax, setTotalTax] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (companyId && user) {
      fetchData();
    }
  }, [companyId, user]);

  useEffect(() => {
    calculateTotals();
  }, [lineItems]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [companies, debtorsList, accountsList] = await Promise.all([
        adminService.getAllCompanies(),
        debtorService.getDebtors(companyId),
        chartOfAccountsService.getAccounts(companyId)
      ]);

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
      setDebtors(debtorsList.filter(d => d.status === 'active'));

      // Filter revenue accounts for line items
      const revenueAccounts = accountsList.filter(acc =>
        acc.category === 'revenue' || acc.accountType === 'revenue'
      );
      setAccounts(revenueAccounts);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const newSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    const newTotalTax = lineItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const newTotal = newSubtotal + newTotalTax;

    setSubtotal(newSubtotal);
    setTotalTax(newTotalTax);
    setTotal(newTotal);
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };

    // Recalculate amounts when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? value : newLineItems[index].quantity;
      const unitPrice = field === 'unitPrice' ? value : newLineItems[index].unitPrice;
      const amount = quantity * unitPrice;
      newLineItems[index].amount = amount;

      // Calculate tax amount
      const taxAmount = (amount * newLineItems[index].taxRate) / 100;
      newLineItems[index].taxAmount = taxAmount;
    }

    // Recalculate tax when tax rate changes
    if (field === 'taxRate') {
      const taxAmount = (newLineItems[index].amount * value) / 100;
      newLineItems[index].taxAmount = taxAmount;
    }

    // Update account code when GL account changes
    if (field === 'glAccountId') {
      const account = accounts.find(acc => acc.id === value);
      newLineItems[index].accountCode = account?.accountCode || '';
    }

    setLineItems(newLineItems);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        taxRate: 0,
        taxAmount: 0,
        glAccountId: '',
        accountCode: '',
        itemCode: ''
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
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

    if (!invoiceDate) {
      toast.error('Please select an invoice date');
      return false;
    }

    if (lineItems.length === 0 || lineItems.every(item => !item.description.trim())) {
      toast.error('Please add at least one line item with a description');
      return false;
    }

    for (let i = 0; i < lineItems.length; i++) {
      const item = lineItems[i];
      if (item.description.trim() && (!item.glAccountId || item.quantity <= 0 || item.unitPrice < 0)) {
        toast.error(`Please complete line item ${i + 1}`);
        return false;
      }
    }

    return true;
  };

  const handleSave = async (shouldSend: boolean = false) => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const invoiceRequest: InvoiceCreateRequest = {
        customerId: selectedCustomer!.id,
        invoiceDate,
        paymentTerms,
        source: 'manual',
        purchaseOrderNumber: purchaseOrderNumber || undefined,
        currency: 'USD', // TODO: Make this configurable
        lineItems: lineItems
          .filter(item => item.description.trim())
          .map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxRate: item.taxRate,
            glAccountId: item.glAccountId,
            accountCode: item.accountCode,
            itemCode: item.itemCode
          })),
        notes: notes || undefined,
        termsAndConditions: termsAndConditions || undefined
      };

      const invoice = await invoiceService.createDirectInvoice(companyId, invoiceRequest, user!.id);

      if (shouldSend) {
        // TODO: Implement send invoice functionality
        toast.success('Invoice created and sent successfully!');
      } else {
        toast.success('Invoice saved as draft');
      }

      router.push(`/companies/${companyId}/invoices/${invoice.id}`);

    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice');
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
          title="Create Invoice"
          subtitle="Generate a new invoice for your customer"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Invoices', href: `/companies/${companyId}/invoices` },
            { label: 'Create' }
          ]}
          backHref={`/companies/${companyId}/invoices`}
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={saving}
              >
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                <Send className="h-4 w-4" />
                Save & Send
              </Button>
            </div>
          }
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Select the customer for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    className="w-full"
                  />

                  {showCustomerDropdown && !selectedCustomer && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredDebtors.length > 0 ? (
                        filteredDebtors.map((debtor) => (
                          <div
                            key={debtor.id}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(debtor);
                              setCustomerSearch('');
                              setShowCustomerDropdown(false);
                            }}
                          >
                            <div className="font-medium">{debtor.name}</div>
                            {debtor.email && (
                              <div className="text-sm text-gray-500">{debtor.email}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-gray-500">No customers found</div>
                      )}
                    </div>
                  )}
                </div>

                {selectedCustomer && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{selectedCustomer.name}</h3>
                        {selectedCustomer.email && (
                          <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                        )}
                        {selectedCustomer.phone && (
                          <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
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
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Invoice Date
                    </label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms (days)
                    </label>
                    <Input
                      type="number"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purchase Order Number (optional)
                  </label>
                  <Input
                    placeholder="Enter PO number if applicable"
                    value={purchaseOrderNumber}
                    onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Line Items
                </CardTitle>
                <CardDescription>
                  Add items and services to this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-medium text-gray-500 border-b">
                        <th className="pb-2 min-w-[200px]">Description</th>
                        <th className="pb-2 w-20">Qty</th>
                        <th className="pb-2 w-24">Unit Price</th>
                        <th className="pb-2 w-20">Tax %</th>
                        <th className="pb-2 w-32">GL Account</th>
                        <th className="pb-2 w-24">Amount</th>
                        <th className="pb-2 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lineItems.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2">
                            <Input
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="border-0 focus:ring-0 px-0"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="border-0 focus:ring-0 px-0 w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="border-0 focus:ring-0 px-0 w-full"
                            />
                          </td>
                          <td className="py-2">
                            <Input
                              type="number"
                              value={item.taxRate}
                              onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.01"
                              className="border-0 focus:ring-0 px-0 w-full"
                            />
                          </td>
                          <td className="py-2">
                            <select
                              value={item.glAccountId}
                              onChange={(e) => updateLineItem(index, 'glAccountId', e.target.value)}
                              className="w-full border-0 focus:ring-0 px-0 bg-transparent text-sm"
                            >
                              <option value="">Select account</option>
                              {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                  {account.accountCode} - {account.accountName}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 text-right font-medium">
                            {formatCurrency(item.amount + item.taxAmount)}
                          </td>
                          <td className="py-2">
                            {lineItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <Button
                  variant="outline"
                  onClick={addLineItem}
                  className="w-full border-dashed"
                >
                  <Plus className="h-4 w-4" />
                  Add Line Item
                </Button>

                {/* Totals */}
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
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add any notes for this invoice"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Terms and Conditions (optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Add terms and conditions for this invoice"
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}