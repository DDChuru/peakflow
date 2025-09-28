'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoiceIntegrationService } from '@/lib/firebase';
import { Quote, InvoiceCreateRequest } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  X,
  CreditCard,
  FileText,
  Calendar,
  DollarSign,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface QuoteLineItemForConversion {
  id: string;
  description: string;
  originalQuantity: number;
  quantity: number;
  unitPrice: number;
  amount: number;
  taxRate: number;
  taxAmount: number;
  glAccountId: string;
  included: boolean;
  notes?: string;
}

interface QuoteToInvoiceModalProps {
  quote: Quote;
  companyId: string;
  onClose: () => void;
  onSuccess: (invoiceId: string) => void;
}

export default function QuoteToInvoiceModal({
  quote,
  companyId,
  onClose,
  onSuccess
}: QuoteToInvoiceModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'review' | 'settings' | 'confirm'>('review');

  // Conversion settings
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [notes, setNotes] = useState('');

  // Line items for conversion
  const [lineItems, setLineItems] = useState<QuoteLineItemForConversion[]>([]);

  useEffect(() => {
    // Initialize line items from quote
    const initialItems: QuoteLineItemForConversion[] = quote.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      originalQuantity: item.quantity,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
      glAccountId: item.glAccountId,
      included: true,
      notes: item.notes
    }));
    setLineItems(initialItems);
  }, [quote]);

  const updateLineItem = (index: number, field: keyof QuoteLineItemForConversion, value: any) => {
    setLineItems(prev => prev.map((item, i) => {
      if (i !== index) return item;

      const updated = { ...item, [field]: value };

      // Recalculate amounts when quantity changes
      if (field === 'quantity') {
        updated.amount = updated.quantity * updated.unitPrice;
        updated.taxAmount = (updated.amount * updated.taxRate) / 100;
      }

      return updated;
    }));
  };

  const toggleLineItem = (index: number) => {
    updateLineItem(index, 'included', !lineItems[index].included);
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const addNewLineItem = () => {
    const newItem: QuoteLineItemForConversion = {
      id: `new-${Date.now()}`,
      description: '',
      originalQuantity: 1,
      quantity: 1,
      unitPrice: 0,
      amount: 0,
      taxRate: 0,
      taxAmount: 0,
      glAccountId: '',
      included: true
    };
    setLineItems([...lineItems, newItem]);
  };

  // Calculations
  const includedItems = lineItems.filter(item => item.included);
  const subtotal = includedItems.reduce((sum, item) => sum + item.amount, 0);
  const totalTax = includedItems.reduce((sum, item) => sum + item.taxAmount, 0);
  const totalAmount = subtotal + totalTax;

  const handleConvertToInvoice = async () => {
    try {
      setLoading(true);

      // Validate included items
      const validItems = includedItems.filter(item =>
        item.description.trim() && item.quantity > 0 && item.unitPrice > 0 && item.glAccountId
      );

      if (validItems.length === 0) {
        toast.error('Please include at least one valid line item');
        return;
      }

      // Create invoice request
      const invoiceRequest: InvoiceCreateRequest = {
        customerId: quote.customerId,
        invoiceDate,
        paymentTerms,
        source: 'quote_conversion',
        sourceDocumentId: quote.id,
        currency: quote.currency,
        exchangeRate: quote.exchangeRate,
        lineItems: validItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          glAccountId: item.glAccountId,
          notes: item.notes
        })),
        notes: notes || `Converted from Quote ${quote.quoteNumber}`,
        metadata: {
          sourceQuoteId: quote.id,
          sourceQuoteNumber: quote.quoteNumber,
          conversionDate: new Date().toISOString()
        }
      };

      // Convert quote to invoice using integration service
      const result = await invoiceIntegrationService.convertQuoteToInvoice(
        companyId,
        quote.id,
        invoiceRequest
      );

      onSuccess(result.invoice.id);

    } catch (error) {
      console.error('Error converting quote to invoice:', error);
      toast.error('Failed to convert quote to invoice');
    } finally {
      setLoading(false);
    }
  };

  const stepButtons = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={() => setStep('settings')}
              disabled={includedItems.length === 0}
            >
              Continue
              <span className="ml-2">→</span>
            </Button>
          </>
        );
      case 'settings':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('review')} disabled={loading}>
              <span className="mr-2">←</span>
              Back
            </Button>
            <Button onClick={() => setStep('confirm')}>
              Continue
              <span className="ml-2">→</span>
            </Button>
          </>
        );
      case 'confirm':
        return (
          <>
            <Button variant="outline" onClick={() => setStep('settings')} disabled={loading}>
              <span className="mr-2">←</span>
              Back
            </Button>
            <Button
              onClick={handleConvertToInvoice}
              disabled={loading || includedItems.length === 0}
            >
              <CreditCard className="h-4 w-4" />
              {loading ? 'Converting...' : 'Convert to Invoice'}
            </Button>
          </>
        );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Convert Quote to Invoice
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Converting {quote.quoteNumber} • {formatCurrency(quote.totalAmount)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center space-x-4 mt-4">
              {[
                { key: 'review', label: 'Review Items' },
                { key: 'settings', label: 'Invoice Settings' },
                { key: 'confirm', label: 'Confirm' }
              ].map((stepItem, index) => (
                <div key={stepItem.key} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step === stepItem.key
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`ml-2 text-sm ${
                      step === stepItem.key ? 'text-indigo-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {stepItem.label}
                  </span>
                  {index < 2 && <div className="w-8 h-px bg-gray-300 ml-4" />}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[calc(90vh-200px)] overflow-y-auto">
            {step === 'review' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Select Items to Include</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addNewLineItem}
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <Card
                      key={item.id}
                      className={`transition-all ${
                        item.included ? 'bg-white border-indigo-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={item.included}
                            onChange={() => toggleLineItem(index)}
                            className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <Input
                                  placeholder="Item description"
                                  value={item.description}
                                  onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                  disabled={!item.included}
                                />
                              </div>
                              {lineItems.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeLineItem(index)}
                                  className="ml-2 text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>

                            <div className="grid grid-cols-4 gap-3">
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  disabled={!item.included}
                                />
                                {item.originalQuantity !== item.quantity && (
                                  <div className="text-xs text-orange-600 mt-1">
                                    Original: {item.originalQuantity}
                                  </div>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                                <Input
                                  type="number"
                                  value={item.unitPrice}
                                  onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  disabled={!item.included}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Tax Rate (%)</label>
                                <Input
                                  type="number"
                                  value={item.taxRate}
                                  onChange={(e) => updateLineItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  disabled={!item.included}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Total</label>
                                <div className="text-lg font-semibold text-gray-900 py-2">
                                  {formatCurrency(item.amount + item.taxAmount)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Conversion Summary */}
                <Card className="bg-indigo-50 border-indigo-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-indigo-700">
                          {includedItems.length} of {lineItems.length} items selected
                        </div>
                        <div className="text-xs text-indigo-600">
                          Invoice Total: {formatCurrency(totalAmount)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-indigo-900">
                          {formatCurrency(totalAmount)}
                        </div>
                        <div className="text-xs text-indigo-600">
                          Original: {formatCurrency(quote.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Invoice Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Invoice Date *
                    </label>
                    <Input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Payment Terms (Days) *
                    </label>
                    <Input
                      type="number"
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Additional notes for the invoice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  <div className="text-xs text-gray-500">
                    Default note will include reference to original quote number
                  </div>
                </div>

                {/* Preview Summary */}
                <Card className="bg-gray-50">
                  <CardHeader>
                    <CardTitle className="text-base">Invoice Preview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span>{quote.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Invoice Date:</span>
                      <span>{new Date(invoiceDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Due Date:</span>
                      <span>{new Date(new Date(invoiceDate).getTime() + paymentTerms * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Items:</span>
                      <span>{includedItems.length}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t pt-2">
                      <span>Total Amount:</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Ready to Convert</h3>
                  <p className="text-gray-600">
                    This will create a new invoice from the selected quote items and mark the quote as converted.
                  </p>
                </div>

                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div className="text-sm">
                        <div className="font-medium text-yellow-800 mb-1">Important</div>
                        <ul className="text-yellow-700 space-y-1">
                          <li>• The quote status will be updated to "converted"</li>
                          <li>• A new invoice will be created with the selected items</li>
                          <li>• This action cannot be undone</li>
                          <li>• The original quote will remain accessible for reference</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Final Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Conversion Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Quote:</div>
                        <div className="font-medium">{quote.quoteNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Customer:</div>
                        <div className="font-medium">{quote.customerName}</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Items:</div>
                        <div className="font-medium">{includedItems.length} selected</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Invoice Date:</div>
                        <div className="font-medium">{new Date(invoiceDate).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total Amount:</span>
                        <span>{formatCurrency(totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {step === 'review' && `${includedItems.length} items selected`}
                {step === 'settings' && 'Configure invoice settings'}
                {step === 'confirm' && 'Ready to create invoice'}
              </div>
              <div className="flex space-x-3">
                {stepButtons()}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}