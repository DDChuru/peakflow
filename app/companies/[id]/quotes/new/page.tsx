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
  ArrowLeft,
  Clock,
  Building2,
  Mail,
  Phone,
  CalendarCheck
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

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
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
                <CardDescription>
                  Select the customer for this quote
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
                    />

                    {showCustomerDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
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

            {/* Quote Details */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Calendar className="h-5 w-5" />
                  Quote Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quoteDate" className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-500" />
                      Quote Date
                    </Label>
                    <Input
                      id="quoteDate"
                      type="date"
                      value={quoteDate}
                      onChange={(e) => setQuoteDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validityPeriod" className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-500" />
                      Validity Period
                    </Label>
                    <RadixSelect
                      value={validityPeriod.toString()}
                      onValueChange={(value) => setValidityPeriod(parseInt(value))}
                    >
                      <SelectTrigger id="validityPeriod">
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="45">45 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                      </SelectContent>
                    </RadixSelect>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <CalendarCheck className="h-3.5 w-3.5 text-gray-500" />
                      Valid Until
                    </Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm flex items-center">
                      <span className="text-gray-700">{validUntil.toLocaleDateString()}</span>
                      <Badge variant="outline" className="ml-auto text-xs bg-white">
                        {validityPeriod} days
                      </Badge>
                    </div>
                  </div>
                </div>

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
                      Add products and services to this quote
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
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
              <CardContent className="space-y-4 pt-6">
                {lineItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 border border-gray-200 rounded-lg space-y-4 hover:border-emerald-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Item {index + 1}
                      </Badge>
                      {lineItems.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLineItem(index)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Input
                          placeholder="Service or product description"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Revenue Account</Label>
                        <RadixSelect
                          value={item.glAccountId}
                          onValueChange={(value) => updateLineItem(index, 'glAccountId', value)}
                        >
                          <SelectTrigger>
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
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Unit Price</Label>
                        <Input
                          type="number"
                          value={item.unitPrice || ''}
                          onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Tax %</Label>
                        <Input
                          type="number"
                          value={item.taxRate || ''}
                          onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                          min="0"
                          max="100"
                          step="0.5"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Amount</Label>
                        <div className="h-10 px-3 py-2 rounded-md border border-gray-200 bg-gray-50 text-sm flex items-center font-semibold">
                          {formatCurrency(item.amount + item.taxAmount)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* Totals */}
                <div className="bg-gray-50 -mx-6 -mb-6 mt-6 p-4 border-t">
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
                        <span className="text-emerald-600">{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes and Terms */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="flex items-center gap-2 text-amber-900">
                  <FileText className="h-5 w-5" />
                  Additional Information
                </CardTitle>
                <CardDescription>
                  Add notes and terms for this quote
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm font-medium">
                    Notes
                    <span className="text-gray-400 text-xs ml-2">(visible on quote)</span>
                  </Label>
                  <Textarea
                    id="notes"
                    rows={3}
                    placeholder="Add any notes for your customer..."
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
                    rows={4}
                    placeholder="Add standard terms and conditions..."
                    value={termsAndConditions}
                    onChange={(e) => setTermsAndConditions(e.target.value)}
                    className="resize-none"
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