'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, Plus, Search, Filter, CheckCircle, XCircle, Eye, DollarSign } from 'lucide-react';
import { createCreditNoteService, InvoiceService } from '@/lib/accounting';
import { debtorService } from '@/lib/firebase';
import type { CreditNote, CreditNoteReason, CreditNoteLineItem } from '@/types/accounting/credit-note';
import type { Debtor } from '@/types/financial';
import type { Invoice } from '@/types/accounting/invoice';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';

export default function CreditNotesPage() {
  const params = useParams();
  const companyId = params?.companyId as string;
  const { user } = useAuth();
  const { canAccess: hasAccess, loading: accessLoading } = useWorkspaceAccess(companyId);

  // State
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [customers, setCustomers] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Create dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [creditNoteDate, setCreditNoteDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<CreditNoteReason>('goods-returned');
  const [reasonDescription, setReasonDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<Partial<CreditNoteLineItem>[]>([
    { description: '', quantity: 1, unitPrice: 0 },
  ]);
  const [taxRate, setTaxRate] = useState(15);

  // View dialog
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingCreditNote, setViewingCreditNote] = useState<CreditNote | null>(null);

  // Allocate dialog
  const [isAllocateDialogOpen, setIsAllocateDialogOpen] = useState(false);
  const [allocatingCreditNote, setAllocatingCreditNote] = useState<CreditNote | null>(null);
  const [outstandingInvoices, setOutstandingInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [allocations, setAllocations] = useState<{ invoiceId: string; amount: number }[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);

  // Load data
  useEffect(() => {
    if (!hasAccess || !user) return;
    loadData();
  }, [hasAccess, user, companyId]);

  async function loadData() {
    try {
      setLoading(true);

      // Load customers
      const customersData = await debtorService.getDebtors(companyId);
      setCustomers(customersData);

      // Load credit notes
      await loadCreditNotes();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load credit notes');
    } finally {
      setLoading(false);
    }
  }

  async function loadCreditNotes() {
    if (!user) return;

    try {
      const creditNoteService = createCreditNoteService(
        companyId,
        user.uid,
        'current' // TODO: Get from company settings
      );

      const notes = await creditNoteService.getCreditNotes({ type: 'sales' });
      setCreditNotes(notes);
    } catch (error) {
      console.error('Error loading credit notes:', error);
    }
  }

  // Create credit note
  async function handleCreateCreditNote() {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    if (lineItems.length === 0 || !lineItems[0].description) {
      toast.error('Please add at least one line item');
      return;
    }

    if (!user) return;

    try {
      setIsCreating(true);

      const creditNoteService = createCreditNoteService(
        companyId,
        user.uid,
        'current'
      );

      const result = await creditNoteService.createSalesCreditNote({
        customerId: selectedCustomerId,
        creditNoteDate: new Date(creditNoteDate),
        reason,
        reasonDescription,
        lineItems: lineItems as any,
        taxRate,
        notes,
      });

      if (result.success && result.creditNote) {
        toast.success(`Credit note ${result.creditNote.creditNoteNumber} created`);
        setCreditNotes([result.creditNote, ...creditNotes]);
        setIsCreateDialogOpen(false);
        resetForm();
      } else {
        toast.error(result.message || 'Failed to create credit note');
      }
    } catch (error: any) {
      console.error('Error creating credit note:', error);
      toast.error(error.message || 'Failed to create credit note');
    } finally {
      setIsCreating(false);
    }
  }

  // Approve credit note
  async function handleApproveCreditNote(creditNoteId: string) {
    if (!user) return;

    try {
      const creditNoteService = createCreditNoteService(
        companyId,
        user.uid,
        'current'
      );

      const result = await creditNoteService.approveCreditNote(creditNoteId);

      if (result.success) {
        toast.success('Credit note approved and posted to GL');
        await loadCreditNotes();
      } else {
        toast.error(result.message || 'Failed to approve credit note');
      }
    } catch (error: any) {
      console.error('Error approving credit note:', error);
      toast.error(error.message || 'Failed to approve credit note');
    }
  }

  // Load outstanding invoices for allocation
  async function loadOutstandingInvoices(customerId: string) {
    if (!user) return;

    try {
      setLoadingInvoices(true);
      const invoiceService = new InvoiceService(companyId);

      // Get all invoices for this customer with outstanding balances
      const allInvoices = await invoiceService.getInvoicesByDebtor(customerId);
      const outstanding = allInvoices.filter(
        (inv) => inv.status === 'sent' || inv.status === 'partial'
      );

      setOutstandingInvoices(outstanding);
      setAllocations([]);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Failed to load outstanding invoices');
    } finally {
      setLoadingInvoices(false);
    }
  }

  // Handle allocation dialog open
  function handleOpenAllocationDialog(creditNote: CreditNote) {
    setAllocatingCreditNote(creditNote);
    setIsAllocateDialogOpen(true);

    if (creditNote.type === 'sales') {
      loadOutstandingInvoices(creditNote.customerId);
    }
  }

  // Toggle invoice selection for allocation
  function toggleInvoiceSelection(invoice: Invoice) {
    const existing = allocations.find((a) => a.invoiceId === invoice.id);

    if (existing) {
      // Remove allocation
      setAllocations(allocations.filter((a) => a.invoiceId !== invoice.id));
    } else {
      // Add allocation with full invoice amount or remaining credit (whichever is smaller)
      const remainingCredit =
        (allocatingCreditNote?.amountUnallocated || 0) -
        allocations.reduce((sum, a) => sum + a.amount, 0);
      const allocationAmount = Math.min(invoice.amountDue || 0, remainingCredit);

      setAllocations([...allocations, { invoiceId: invoice.id, amount: allocationAmount }]);
    }
  }

  // Update allocation amount
  function updateAllocationAmount(invoiceId: string, amount: number) {
    setAllocations(
      allocations.map((a) => (a.invoiceId === invoiceId ? { ...a, amount } : a))
    );
  }

  // Apply allocations
  async function handleApplyAllocations() {
    if (!user || !allocatingCreditNote) return;

    if (allocations.length === 0) {
      toast.error('Please select at least one invoice');
      return;
    }

    try {
      setIsAllocating(true);

      const creditNoteService = createCreditNoteService(
        companyId,
        user.uid,
        'current'
      );

      // Apply allocations sequentially
      for (const allocation of allocations) {
        const invoice = outstandingInvoices.find((inv) => inv.id === allocation.invoiceId);
        if (!invoice) continue;

        const result = await creditNoteService.allocateCreditNote({
          creditNoteId: allocatingCreditNote.id,
          documentType: 'invoice',
          documentId: allocation.invoiceId,
          amountToAllocate: allocation.amount,
          notes: `Allocated from credit note ${allocatingCreditNote.creditNoteNumber}`,
        });

        if (!result.success) {
          toast.error(`Failed to allocate to ${invoice.invoiceNumber}: ${result.message}`);
          return;
        }
      }

      toast.success(`Credit note allocated to ${allocations.length} invoice(s)`);
      setIsAllocateDialogOpen(false);
      setAllocations([]);
      await loadCreditNotes();
    } catch (error: any) {
      console.error('Error applying allocations:', error);
      toast.error(error.message || 'Failed to apply allocations');
    } finally {
      setIsAllocating(false);
    }
  }

  // Reset form
  function resetForm() {
    setSelectedCustomerId('');
    setCreditNoteDate(new Date().toISOString().split('T')[0]);
    setReason('goods-returned');
    setReasonDescription('');
    setNotes('');
    setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setTaxRate(15);
  }

  // Add line item
  function addLineItem() {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  }

  // Remove line item
  function removeLineItem(index: number) {
    setLineItems(lineItems.filter((_, i) => i !== index));
  }

  // Update line item
  function updateLineItem(
    index: number,
    field: keyof CreditNoteLineItem,
    value: any
  ) {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  }

  // Calculate totals
  const subtotal = lineItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.unitPrice || 0),
    0
  );
  const taxAmount = (subtotal * taxRate) / 100;
  const totalAmount = subtotal + taxAmount;

  // Filter credit notes
  const filteredCreditNotes = creditNotes.filter((cn) => {
    const matchesSearch =
      cn.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || cn.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Reason labels
  const reasonLabels: Record<CreditNoteReason, string> = {
    'goods-returned': 'Goods Returned',
    'damaged-goods': 'Damaged Goods',
    'pricing-error': 'Pricing Error',
    'discount-applied': 'Discount Applied',
    'service-issue': 'Service Issue',
    'duplicate-invoice': 'Duplicate Invoice',
    'overpayment': 'Over-Payment',
    'goodwill-gesture': 'Goodwill Gesture',
    'other': 'Other',
  };

  if (accessLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="p-8">
        <p className="text-red-600">You do not have access to this workspace.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Credit Notes</h1>
          <p className="text-gray-600 mt-1">
            Manage customer refunds, returns, and credit allocations
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Credit Note
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Credit Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditNotes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Approved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {creditNotes.filter((cn) => cn.status === 'approved').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(creditNotes.reduce((sum, cn) => sum + cn.totalAmount, 0))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Unallocated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(
                creditNotes.reduce((sum, cn) => sum + cn.amountUnallocated, 0)
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by customer or credit note number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending-approval">Pending Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="allocated">Allocated</SelectItem>
                <SelectItem value="partially-allocated">Partially Allocated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Credit Notes List */}
      {filteredCreditNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No credit notes yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first credit note to get started
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Credit Note
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCreditNotes.map((cn) => (
            <Card key={cn.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{cn.creditNoteNumber}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cn.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : cn.status === 'draft'
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {cn.status}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          cn.allocationStatus === 'fully-allocated'
                            ? 'bg-blue-100 text-blue-800'
                            : cn.allocationStatus === 'partially-allocated'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {cn.allocationStatus.replace('-', ' ')}
                      </span>
                    </div>

                    <p className="text-gray-600 mb-1">{cn.customerName}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {reasonLabels[cn.reason]} • {new Date(cn.creditNoteDate).toLocaleDateString()}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Amount</p>
                        <p className="font-medium">{formatCurrency(cn.totalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Allocated</p>
                        <p className="font-medium text-blue-600">
                          {formatCurrency(cn.amountAllocated)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Unallocated</p>
                        <p className="font-medium text-orange-600">
                          {formatCurrency(cn.amountUnallocated)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Line Items</p>
                        <p className="font-medium">{cn.lineItems.length}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setViewingCreditNote(cn);
                        setIsViewDialogOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    {cn.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApproveCreditNote(cn.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}

                    {cn.status === 'approved' && cn.amountUnallocated > 0 && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenAllocationDialog(cn)}
                      >
                        Allocate
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Credit Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Sales Credit Note</DialogTitle>
            <DialogDescription>
              Issue a credit note to a customer for returns, refunds, or adjustments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={creditNoteDate}
                  onChange={(e) => setCreditNoteDate(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Reason *</Label>
                <Select
                  value={reason}
                  onValueChange={(value) => setReason(value as CreditNoteReason)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(reasonLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label>Reason Description</Label>
              <Textarea
                placeholder="Explain the reason for this credit note..."
                value={reasonDescription}
                onChange={(e) => setReasonDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* Line Items */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <Label>Line Items *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Description"
                        value={item.description || ''}
                        onChange={(e) =>
                          updateLineItem(index, 'description', e.target.value)
                        }
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={item.quantity || ''}
                        onChange={(e) =>
                          updateLineItem(index, 'quantity', Number(e.target.value))
                        }
                        min="1"
                      />
                      <Input
                        type="number"
                        placeholder="Unit Price"
                        value={item.unitPrice || ''}
                        onChange={(e) =>
                          updateLineItem(index, 'unitPrice', Number(e.target.value))
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {lineItems.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeLineItem(index)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({taxRate}%):</span>
                <span className="font-medium">{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateCreditNote} disabled={isCreating}>
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Credit Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Credit Note Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {viewingCreditNote && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingCreditNote.creditNoteNumber}</DialogTitle>
                <DialogDescription>
                  {viewingCreditNote.customerName} •{' '}
                  {new Date(viewingCreditNote.creditNoteDate).toLocaleDateString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-600">Status</Label>
                    <p className="font-medium capitalize">{viewingCreditNote.status}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Allocation</Label>
                    <p className="font-medium capitalize">
                      {viewingCreditNote.allocationStatus.replace('-', ' ')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-600">Reason</Label>
                    <p className="font-medium">{reasonLabels[viewingCreditNote.reason]}</p>
                  </div>
                  <div>
                    <Label className="text-gray-600">GL Posted</Label>
                    <p className="font-medium">{viewingCreditNote.glPosted ? 'Yes' : 'No'}</p>
                  </div>
                </div>

                {viewingCreditNote.reasonDescription && (
                  <div>
                    <Label className="text-gray-600">Reason Description</Label>
                    <p>{viewingCreditNote.reasonDescription}</p>
                  </div>
                )}

                <div>
                  <Label className="text-gray-600 mb-2 block">Line Items</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 text-sm">Description</th>
                          <th className="text-right p-2 text-sm">Qty</th>
                          <th className="text-right p-2 text-sm">Price</th>
                          <th className="text-right p-2 text-sm">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewingCreditNote.lineItems.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">{item.description}</td>
                            <td className="p-2 text-right">{item.quantity}</td>
                            <td className="p-2 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="p-2 text-right">
                              {formatCurrency(item.totalAmount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">
                      {formatCurrency(viewingCreditNote.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">
                      Tax ({viewingCreditNote.taxRate}%):
                    </span>
                    <span className="font-medium">
                      {formatCurrency(viewingCreditNote.taxAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(viewingCreditNote.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Allocated:</span>
                    <span>{formatCurrency(viewingCreditNote.amountAllocated)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span>Unallocated:</span>
                    <span>{formatCurrency(viewingCreditNote.amountUnallocated)}</span>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Allocate Credit Note Dialog */}
      <Dialog open={isAllocateDialogOpen} onOpenChange={setIsAllocateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {allocatingCreditNote && (
            <>
              <DialogHeader>
                <DialogTitle>Allocate Credit Note</DialogTitle>
                <DialogDescription>
                  Allocate {allocatingCreditNote.creditNoteNumber} to outstanding invoices
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Credit Note Summary */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-gray-600">Credit Note Amount</Label>
                        <p className="text-lg font-bold">
                          {formatCurrency(allocatingCreditNote.totalAmount)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Allocated</Label>
                        <p className="text-lg font-bold text-blue-600">
                          {formatCurrency(allocatingCreditNote.amountAllocated)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-600">Available</Label>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(
                            allocatingCreditNote.amountUnallocated -
                              allocations.reduce((sum, a) => sum + a.amount, 0)
                          )}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Outstanding Invoices */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Outstanding Invoices for {allocatingCreditNote.customerName}
                  </h3>

                  {loadingInvoices ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : outstandingInvoices.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-8">
                        <p className="text-gray-600">No outstanding invoices found</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {outstandingInvoices.map((invoice) => {
                        const allocation = allocations.find(
                          (a) => a.invoiceId === invoice.id
                        );
                        const isSelected = !!allocation;

                        return (
                          <Card
                            key={invoice.id}
                            className={`cursor-pointer transition-all ${
                              isSelected ? 'ring-2 ring-primary' : ''
                            }`}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-4">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleInvoiceSelection(invoice)}
                                />

                                <div className="flex-1">
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <p className="font-semibold">
                                        {invoice.invoiceNumber}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {new Date(
                                          invoice.invoiceDate
                                        ).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-sm text-gray-600">Amount Due</p>
                                      <p className="font-semibold">
                                        {formatCurrency(invoice.amountDue || 0)}
                                      </p>
                                    </div>
                                  </div>

                                  {isSelected && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <Label className="text-sm">
                                        Allocate Amount:
                                      </Label>
                                      <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-gray-400" />
                                        <Input
                                          type="number"
                                          value={allocation.amount}
                                          onChange={(e) =>
                                            updateAllocationAmount(
                                              invoice.id,
                                              Number(e.target.value)
                                            )
                                          }
                                          min="0"
                                          max={Math.min(
                                            invoice.amountDue || 0,
                                            allocatingCreditNote.amountUnallocated
                                          )}
                                          step="0.01"
                                          className="w-32"
                                        />
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            updateAllocationAmount(
                                              invoice.id,
                                              Math.min(
                                                invoice.amountDue || 0,
                                                allocatingCreditNote.amountUnallocated -
                                                  allocations
                                                    .filter(
                                                      (a) => a.invoiceId !== invoice.id
                                                    )
                                                    .reduce((sum, a) => sum + a.amount, 0)
                                              )
                                            )
                                          }
                                        >
                                          Max
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Allocation Summary */}
                {allocations.length > 0 && (
                  <Card className="bg-blue-50">
                    <CardContent className="pt-6">
                      <div className="space-y-2">
                        <h4 className="font-semibold mb-3">Allocation Summary</h4>
                        {allocations.map((allocation) => {
                          const invoice = outstandingInvoices.find(
                            (inv) => inv.id === allocation.invoiceId
                          );
                          if (!invoice) return null;

                          return (
                            <div
                              key={allocation.invoiceId}
                              className="flex justify-between items-center"
                            >
                              <span className="text-sm">{invoice.invoiceNumber}</span>
                              <span className="font-medium">
                                {formatCurrency(allocation.amount)}
                              </span>
                            </div>
                          );
                        })}
                        <div className="border-t pt-2 flex justify-between items-center font-bold">
                          <span>Total Allocated:</span>
                          <span>
                            {formatCurrency(
                              allocations.reduce((sum, a) => sum + a.amount, 0)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-green-600">
                          <span>Remaining Credit:</span>
                          <span className="font-bold">
                            {formatCurrency(
                              allocatingCreditNote.amountUnallocated -
                                allocations.reduce((sum, a) => sum + a.amount, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAllocateDialogOpen(false);
                    setAllocations([]);
                  }}
                  disabled={isAllocating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleApplyAllocations}
                  disabled={isAllocating || allocations.length === 0}
                >
                  {isAllocating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Apply Allocations
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
