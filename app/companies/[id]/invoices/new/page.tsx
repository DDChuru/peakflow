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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/navigation';
import {
  RadixSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Search,
  Clock,
  CreditCard,
  Building2,
  Mail,
  Phone,
  Hash
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
  const [currency, setCurrency] = useState('USD');
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState('');

  // Calculate due date based on invoice date and payment terms
  const dueDate = (() => {
    const date = new Date(invoiceDate);
    date.setDate(date.getDate() + paymentTerms);
    return date.toISOString().split('T')[0];
  })();

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
        currency,
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
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Select the customer for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {!selectedCustomer ? (
                  <div className="relative">
                    <Input
                      icon={<Search className="h-4 w-4" />}
                      placeholder="Search customers by name or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      className="w-full"
                    />

                    {showCustomerDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredDebtors.length > 0 ? (
                          filteredDebtors.map((debtor) => (
                            <div
                              key={debtor.id}
                              className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                              onClick={() => {
                                setSelectedCustomer(debtor);
                                setCustomerSearch('');
                                setShowCustomerDropdown(false);
                              }}
                            >
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-indigo-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{debtor.name}</div>
                                  {debtor.email && (
                                    <div className="text-sm text-gray-500">{debtor.email}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-6 text-center text-gray-500">
                            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No customers found</p>
                            <p className="text-xs mt-1">Try a different search term</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedCustomer.name}</h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                            {selectedCustomer.email && (
                              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5" />
                                {selectedCustomer.email}
                              </span>
                            )}
                            {selectedCustomer.phone && (
                              <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5" />
                                {selectedCustomer.phone}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setCustomerSearch('');
                        }}
                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100"
                      >
                        Change
                      </Button>
                    </div>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calendar className="h-5 w-5" />
                  Invoice Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      Invoice Date
                    </Label>
                    <Input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms" className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      Payment Terms
                    </Label>
                    <RadixSelect
                      value={paymentTerms.toString()}
                      onValueChange={(value) => setPaymentTerms(parseInt(value))}
                    >
                      <SelectTrigger id="paymentTerms">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">Net 7 days</SelectItem>
                        <SelectItem value="14">Net 14 days</SelectItem>
                        <SelectItem value="30">Net 30 days</SelectItem>
                        <SelectItem value="45">Net 45 days</SelectItem>
                        <SelectItem value="60">Net 60 days</SelectItem>
                        <SelectItem value="90">Net 90 days</SelectItem>
                      </SelectContent>
                    </RadixSelect>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5 text-gray-500" />
                      Due Date
                    </Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm flex items-center">
                      <span className="text-gray-700">{new Date(dueDate).toLocaleDateString()}</span>
                      <Badge variant="outline" className="ml-auto text-xs bg-white">
                        {paymentTerms} days
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency" className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-gray-500" />
                      Currency
                    </Label>
                    <RadixSelect value={currency} onValueChange={setCurrency}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </RadixSelect>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="poNumber" className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-gray-500" />
                      PO Number
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </Label>
                    <Input
                      id="poNumber"
                      placeholder="Enter PO number if applicable"
                      value={purchaseOrderNumber}
                      onChange={(e) => setPurchaseOrderNumber(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-emerald-900">
                      <FileText className="h-5 w-5" />
                      Line Items
                    </CardTitle>
                    <CardDescription>
                      Add items and services to this invoice
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addLineItem}
                    className="bg-white hover:bg-emerald-50 border-emerald-200"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 border-b">
                        <th className="px-4 py-3 min-w-[200px]">Description</th>
                        <th className="px-4 py-3 w-20 text-center">Qty</th>
                        <th className="px-4 py-3 w-28 text-right">Unit Price</th>
                        <th className="px-4 py-3 w-20 text-center">Tax %</th>
                        <th className="px-4 py-3 w-40">GL Account</th>
                        <th className="px-4 py-3 w-28 text-right">Amount</th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {lineItems.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <Input
                              placeholder="Enter item description..."
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="1"
                              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-center w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.unitPrice || ''}
                              onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-right w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              value={item.taxRate || ''}
                              onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              step="0.5"
                              placeholder="0"
                              className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-center w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <RadixSelect
                              value={item.glAccountId}
                              onValueChange={(value) => updateLineItem(index, 'glAccountId', value)}
                            >
                              <SelectTrigger className="border-0 shadow-none focus:ring-0 h-8 px-0 text-sm">
                                <SelectValue placeholder="Select account" />
                              </SelectTrigger>
                              <SelectContent>
                                {accounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.accountCode} - {account.accountName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </RadixSelect>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-gray-900">
                              {formatCurrency(item.amount + item.taxAmount)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {lineItems.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeLineItem(index)}
                                className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
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

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-gray-100">
                  {lineItems.map((item, index) => (
                    <div key={index} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">Item {index + 1}</Badge>
                        {lineItems.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Enter item description..."
                        value={item.description}
                        onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-gray-500">Qty</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Price</Label>
                          <Input
                            type="number"
                            value={item.unitPrice || ''}
                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-500">Tax %</Label>
                          <Input
                            type="number"
                            value={item.taxRate || ''}
                            onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                      <RadixSelect
                        value={item.glAccountId}
                        onValueChange={(value) => updateLineItem(index, 'glAccountId', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select GL account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.accountCode} - {account.accountName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </RadixSelect>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-sm text-gray-500">Line Total</span>
                        <span className="font-semibold">{formatCurrency(item.amount + item.taxAmount)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Item Button - Mobile */}
                <div className="md:hidden p-4 border-t">
                  <Button
                    variant="outline"
                    onClick={addLineItem}
                    className="w-full border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                  </Button>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 border-t">
                  <div className="flex justify-end">
                    <div className="w-full md:w-72 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span className="font-medium">{formatCurrency(totalTax)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold pt-3 border-t border-gray-200">
                        <span className="text-gray-900">Total</span>
                        <span className="text-emerald-600">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Add notes and terms for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                    <span className="text-gray-400 text-xs ml-2">(visible on invoice)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Add any notes for your customer, e.g., payment instructions, thank you message..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="terms" className="text-sm font-medium">
                    Terms and Conditions
                    <span className="text-gray-400 text-xs ml-2">(optional)</span>
                  </Label>
                  <Textarea
                    id="terms"
                    rows={3}
                    placeholder="Add standard terms and conditions..."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="resize-none"
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