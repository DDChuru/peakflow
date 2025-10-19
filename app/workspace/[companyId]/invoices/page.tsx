'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { WorkspaceLayout } from '@/components/layout/WorkspaceLayout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, FileText, Search, Filter, MoreHorizontal, Calendar, AlertCircle, Eye, Edit, Trash2, X, DollarSign, Send, Receipt, CheckCircle, Download } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { InvoiceService } from '@/lib/accounting/invoice-service';
import { InvoicePostingService } from '@/lib/accounting/invoice-posting-service';
import { fiscalPeriodService } from '@/lib/accounting';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { BankAccountService } from '@/lib/firebase/bank-account-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Invoice, InvoiceLineItem, InvoiceStatus, InvoiceSource } from '@/types/accounting/invoice';
import { Debtor } from '@/types/financial';
import { ChartOfAccount } from '@/types/accounting/chart-of-accounts';
import { BankAccount } from '@/types/accounting/bank-account';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { pdfService } from '@/lib/pdf/pdf.service';

// Zod schema for form validation
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  glAccountId: z.string().min(1, 'GL Account is required'),
  itemCode: z.string().optional(),
});

const invoiceSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  invoiceDate: z.string().min(1, 'Invoice date is required'),
  paymentTerms: z.coerce.number().min(0).default(30),
  source: z.enum(['manual', 'quote', 'sales_order', 'sla', 'import']).default('manual'),
  currency: z.string().default('ZAR'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

const paymentSchema = z.object({
  paymentDate: z.string().min(1, 'Payment date is required'),
  amount: z.coerce.number().min(0.01, 'Payment amount must be greater than 0'),
  paymentMethod: z.enum(['cash', 'check', 'bank_transfer', 'card', 'other']),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;
type PaymentFormData = z.infer<typeof paymentSchema>;

export default function InvoicesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Debtor[]>([]);
  const [glAccounts, setGLAccounts] = useState<ChartOfAccount[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [primaryBankAccount, setPrimaryBankAccount] = useState<BankAccount | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invoiceService] = useState(() => new InvoiceService());
  const [debtorService] = useState(() => new DebtorService());
  const [bankAccountService] = useState(() => new BankAccountService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isLineItemDialogOpen, setIsLineItemDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);

  // Line items state for forms
  const [formLineItems, setFormLineItems] = useState<Array<Partial<InvoiceLineItem>>>([
    { description: '', quantity: 1, unitPrice: 0, glAccountId: '' }
  ]);

  // Default GL Account for new line items (optional)
  const [defaultGLAccountId, setDefaultGLAccountId] = useState<string>('');

  // Line item form state for dialog
  const [lineItemForm, setLineItemForm] = useState<Partial<InvoiceLineItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    glAccountId: ''
  });

  // React Hook Form for invoice
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentTerms: 30,
      source: 'manual',
      currency: 'ZAR',
      notes: '',
      taxRate: 0,
      lineItems: formLineItems as any,
    },
  });

  // React Hook Form for payment
  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
    },
  });

  // Sync formLineItems state with React Hook Form
  useEffect(() => {
    setValue('lineItems', formLineItems as any, { shouldValidate: true });
  }, [formLineItems, setValue]);

  useEffect(() => {
    if (canAccess && companyId && user) {
      loadData();
    }
  }, [canAccess, companyId, user]);

  const loadData = async () => {
    console.log('📋 Invoices Page Loading - Company ID:', companyId);
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadInvoices(), loadCustomers(), loadGLAccounts(), loadCompany(), loadBankAccount()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    const data = await invoiceService.getInvoices(companyId);
    setInvoices(data);
  };

  const loadCustomers = async () => {
    const data = await debtorService.getDebtors(companyId);
    setCustomers(data);
  };

  const loadGLAccounts = async () => {
    // Query company-scoped chart of accounts
    const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
    const accountsQuery = query(accountsRef, orderBy('code'));
    const snapshot = await getDocs(accountsQuery);

    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Filter to revenue accounts for line items
    setGLAccounts(accounts.filter(a => a.type === 'revenue'));
  };

  const loadCompany = async () => {
    const companyDoc = await getDoc(doc(db, 'companies', companyId));
    if (companyDoc.exists()) {
      const companyData = { id: companyDoc.id, ...companyDoc.data() };
      console.log('📊 Company Loaded:', companyData);
      console.log('📊 Company VAT Percentage:', companyData.vatPercentage);
      setCompany(companyData);
      // Pre-fill taxRate from company vatPercentage
      if (companyData.vatPercentage !== undefined) {
        setValue('taxRate', companyData.vatPercentage);
        console.log('✅ Pre-filled tax rate:', companyData.vatPercentage);
      } else {
        console.log('⚠️ No vatPercentage found in company data');
      }
    }
  };

  const loadBankAccount = async () => {
    try {
      const accounts = await bankAccountService.listBankAccounts(companyId, {
        status: 'active',
        includeInactive: false
      });

      // Find primary account, or fall back to first active account
      const primary = accounts.find(acc => acc.isPrimary) || accounts[0] || null;
      setPrimaryBankAccount(primary);

      console.log('[Bank Account] Loaded primary account:', primary?.name, primary?.accountNumber);
    } catch (error) {
      console.error('[Bank Account] Error loading bank account:', error);
      // Don't show error toast - bank account is optional for invoices
    }
  };

  // Line Item Dialog Functions
  const openLineItemDialog = (index?: number) => {
    if (index !== undefined) {
      // Edit existing line item
      setEditingLineItemIndex(index);
      setLineItemForm(formLineItems[index]);
    } else {
      // Add new line item - pre-populate with default GL account if set
      setEditingLineItemIndex(null);
      setLineItemForm({
        description: '',
        quantity: 1,
        unitPrice: 0,
        glAccountId: defaultGLAccountId || '' // Pre-populate from default
      });
    }
    setIsLineItemDialogOpen(true);
  };

  const saveLineItem = () => {
    // Validate
    if (!lineItemForm.description || !lineItemForm.glAccountId ||
        (lineItemForm.quantity || 0) <= 0 || (lineItemForm.unitPrice || 0) < 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const itemWithAmount = {
      ...lineItemForm,
      amount: (lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0)
    };

    if (editingLineItemIndex !== null) {
      // Update existing item
      const updated = [...formLineItems];
      updated[editingLineItemIndex] = itemWithAmount;
      setFormLineItems(updated);
      toast.success('Line item updated');
    } else {
      // Add new item
      setFormLineItems([...formLineItems, itemWithAmount]);
      toast.success('Line item added');
    }

    // Close dialog and reset
    setIsLineItemDialogOpen(false);
    setEditingLineItemIndex(null);
    setLineItemForm({
      description: '',
      quantity: 1,
      unitPrice: 0,
      glAccountId: ''
    });
  };

  const updateLineItemForm = (field: keyof InvoiceLineItem, value: any) => {
    setLineItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLineItem = () => {
    setFormLineItems([
      ...formLineItems,
      { description: '', quantity: 1, unitPrice: 0, glAccountId: '' }
    ]);
  };

  const removeLineItem = (index: number) => {
    if (formLineItems.length > 1) {
      setFormLineItems(formLineItems.filter((_, i) => i !== index));
      toast.success('Line item removed');
    } else {
      toast.error('At least one line item is required');
    }
  };

  const updateLineItem = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const updated = [...formLineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-calculate amount
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? parseFloat(value) || 0 : updated[index].quantity || 0;
      const unitPrice = field === 'unitPrice' ? parseFloat(value) || 0 : updated[index].unitPrice || 0;
      updated[index].amount = quantity * unitPrice;
    }

    setFormLineItems(updated);
  };

  const calculateSubtotal = () => {
    return formLineItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    const taxRate = watch('taxRate') || 0;
    return subtotal * (taxRate / 100);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreate = async (data: InvoiceFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Calculate due date
      const invoiceDate = new Date(data.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + (data.paymentTerms || 30));

      // Build invoice data with only defined values
      const invoiceData: any = {
        invoiceNumber: '', // Will be auto-generated
        customerId: data.customerId,
        customerName: customers.find(c => c.id === data.customerId)?.name || '',
        invoiceDate: data.invoiceDate,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: data.paymentTerms,
        status: 'draft' as InvoiceStatus,
        source: data.source,
        currency: data.currency,
        subtotal: 0, // Will be calculated
        taxAmount: 0, // Will be calculated
        totalAmount: 0, // Will be calculated
        amountPaid: 0,
        amountDue: 0, // Will be calculated
        lineItems: formLineItems.map(item => {
          const lineItem: any = {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            glAccountId: item.glAccountId,
            amount: (item.quantity || 0) * (item.unitPrice || 0),
          };

          if (item.itemCode) lineItem.itemCode = item.itemCode;

          return lineItem;
        }),
        taxRate: data.taxRate || 0,
      };

      // Only add optional fields if they have values
      if (data.notes) invoiceData.notes = data.notes;
      if (data.termsAndConditions) invoiceData.termsAndConditions = data.termsAndConditions;
      if (data.purchaseOrderNumber) invoiceData.purchaseOrderNumber = data.purchaseOrderNumber;

      await invoiceService.createDirectInvoice(companyId, invoiceData, user.uid);
      toast.success('Invoice created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
      await loadInvoices();
    } catch (error: any) {
      console.error('Error creating invoice:', error);
      toast.error(error.message || 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: InvoiceFormData) => {
    if (!user || !selectedInvoice) return;

    setIsSubmitting(true);
    try {
      // Calculate due date
      const invoiceDate = new Date(data.invoiceDate);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + (data.paymentTerms || 30));

      const updates: any = {
        customerId: data.customerId,
        customerName: customers.find(c => c.id === data.customerId)?.name || '',
        invoiceDate: data.invoiceDate,
        dueDate: dueDate.toISOString().split('T')[0],
        paymentTerms: data.paymentTerms,
        currency: data.currency,
        taxRate: data.taxRate || 0,
        lineItems: formLineItems.map(item => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${Math.random()}`,
          amount: (item.quantity || 0) * (item.unitPrice || 0),
        })),
      };

      if (data.notes) updates.notes = data.notes;
      if (data.termsAndConditions) updates.termsAndConditions = data.termsAndConditions;
      if (data.purchaseOrderNumber) updates.purchaseOrderNumber = data.purchaseOrderNumber;

      await invoiceService.updateInvoice(companyId, selectedInvoice.id, updates, user.uid);
      toast.success('Invoice updated successfully');
      setIsEditDialogOpen(false);
      await loadInvoices();
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      toast.error(error.message || 'Failed to update invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedInvoice) return;

    setIsSubmitting(true);
    try {
      await invoiceService.updateInvoice(companyId, selectedInvoice.id, { status: 'cancelled' as InvoiceStatus }, user.uid);
      toast.success('Invoice cancelled successfully');
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
      await loadInvoices();
    } catch (error: any) {
      console.error('Error cancelling invoice:', error);
      toast.error(error.message || 'Failed to cancel invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (data: PaymentFormData) => {
    if (!user || !selectedInvoice) return;

    setIsSubmitting(true);
    try {
      const payment: any = {
        invoiceId: selectedInvoice.id,
        paymentDate: data.paymentDate,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        createdBy: user.uid,
      };

      if (data.reference) payment.reference = data.reference;
      if (data.notes) payment.notes = data.notes;

      await invoiceService.recordPayment(companyId, selectedInvoice.id, payment, user.uid);
      toast.success('Payment recorded successfully');
      setIsPaymentDialogOpen(false);
      resetPayment();
      await loadInvoices();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast.error(error.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostToGL = async (invoice: Invoice) => {
    if (!user) return;

    try {
      toast.loading('Posting invoice to GL...', { id: 'post-to-gl' });

      // Get fiscal period for invoice date
      const fiscalPeriod = await fiscalPeriodService.getPeriodForDate(
        companyId,
        new Date(invoice.invoiceDate)
      );

      if (!fiscalPeriod) {
        toast.error('No fiscal period found for invoice date. Please create fiscal periods in Accounting Settings.', { id: 'post-to-gl' });
        return;
      }

      if (fiscalPeriod.status !== 'open') {
        toast.error(`Cannot post to ${fiscalPeriod.status} period: ${fiscalPeriod.name}`, { id: 'post-to-gl' });
        return;
      }

      // Get financial settings from company
      const financialSettings = (company as any)?.financialSettings || {};
      const defaultARAccountId = financialSettings.defaultARAccountId || '1200';
      const defaultTaxPayableAccountId = financialSettings.defaultTaxPayableAccountId || '2200';

      // Use InvoicePostingService to post to GL
      const postingService = new InvoicePostingService({
        tenantId: companyId,
        fiscalPeriodId: fiscalPeriod.id,
        autoPost: true,
        defaultARAccountId,
        defaultTaxPayableAccountId
      });

      const journalEntryId = await postingService.postInvoiceToGL(invoice);

      toast.success(`Invoice posted to GL (Journal Entry: ${journalEntryId})`, { id: 'post-to-gl' });
      await loadInvoices();
    } catch (error: any) {
      console.error('Error posting to GL:', error);
      toast.error(error.message || 'Failed to post to general ledger', { id: 'post-to-gl' });
    }
  };

  const handleSendInvoice = async (invoice: Invoice) => {
    if (!user) return;

    try {
      await invoiceService.updateInvoice(companyId, invoice.id, { status: 'sent' as InvoiceStatus }, user.uid);
      toast.success('Invoice marked as sent');
      await loadInvoices();
    } catch (error: any) {
      console.error('Error sending invoice:', error);
      toast.error(error.message || 'Failed to send invoice');
    }
  };

  const openCreateDialog = () => {
    // Reset form but preserve company defaults
    // Use company VAT percentage, or default to 15% (South Africa standard) if not set
    const companyTaxRate = company?.vatPercentage !== undefined ? company.vatPercentage : 15;

    console.log('=== Opening Create Invoice Dialog ===');
    console.log('Company:', company);
    console.log('Company VAT Percentage:', company?.vatPercentage);
    console.log('Using Tax Rate:', companyTaxRate);

    reset({
      customerId: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      paymentTerms: 30,
      source: 'manual',
      currency: 'ZAR',
      notes: '',
      termsAndConditions: '',
      purchaseOrderNumber: '',
      taxRate: companyTaxRate, // Pre-populate from company (or 15% default)
      lineItems: [] as any
    });
    setFormLineItems([]);
    setDefaultGLAccountId(''); // Reset default GL
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    console.log('🔧 Opening edit dialog for invoice:', invoice.id, invoice.invoiceNumber);
    console.log('Invoice data:', invoice);

    setSelectedInvoice(invoice);
    setValue('customerId', invoice.customerId);
    setValue('invoiceDate', invoice.invoiceDate.split('T')[0]);
    setValue('paymentTerms', invoice.paymentTerms);
    setValue('currency', invoice.currency);
    setValue('source', invoice.source);
    setValue('taxRate', invoice.taxRate ?? company?.vatPercentage ?? 0);
    if (invoice.notes) setValue('notes', invoice.notes);
    if (invoice.termsAndConditions) setValue('termsAndConditions', invoice.termsAndConditions);
    if (invoice.purchaseOrderNumber) setValue('purchaseOrderNumber', invoice.purchaseOrderNumber);

    const lineItems = invoice.lineItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      glAccountId: item.glAccountId,
    }));

    console.log('Setting form line items:', lineItems);
    setFormLineItems(lineItems);

    // Smart default: If all line items use the same GL account, set it as default
    if (lineItems.length > 0) {
      const firstGL = lineItems[0].glAccountId;
      const allSameGL = lineItems.every(item => item.glAccountId === firstGL);
      if (allSameGL) {
        setDefaultGLAccountId(firstGL || '');
        console.log('✓ All items use same GL account, setting as default:', firstGL);
      } else {
        setDefaultGLAccountId('');
        console.log('✗ Mixed GL accounts detected, no default set');
      }
    }

    setIsEditDialogOpen(true);
  };

  const openViewDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    // Load full customer details
    const customer = customers.find(c => c.id === invoice.customerId);
    setSelectedCustomer(customer || null);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    resetPayment({
      paymentDate: new Date().toISOString().split('T')[0],
      amount: invoice.amountDue,
      paymentMethod: 'bank_transfer',
    });
    setIsPaymentDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!selectedInvoice || !company) {
      toast.error('Invoice or company data not available');
      return;
    }

    try {
      // Use company.logoUrl directly - PDFService will convert it automatically!
      const logoUrl = company.logoUrl || null;

      console.log('=== PDF GENERATION DEBUG ===');
      console.log('Company object:', company);
      console.log('Logo URL from company:', company.logoUrl);
      console.log('Logo URL after || null:', logoUrl);
      console.log('Logo URL type:', typeof logoUrl);
      console.log('Logo URL length:', logoUrl?.length);
      console.log('Will include logo?', !!logoUrl);
      console.log('============================');

      // Build document definition
      const docDefinition: any = {
        content: [
          // Header with logo and company info
          {
            columns: [
              {
                width: '*',
                stack: [
                  ...(logoUrl ? [{ image: logoUrl, width: 96, margin: [0, 0, 0, 10] }] : []),
                  { text: company.name, style: 'companyName' },
                  ...(company.address ? [{ text: company.address, style: 'companyDetails' }] : []),
                  ...(company.email ? [{ text: company.email, style: 'companyDetails' }] : []),
                  ...(company.phone ? [{ text: company.phone, style: 'companyDetails' }] : []),
                  ...(company.vatNumber ? [{ text: `VAT: ${company.vatNumber}`, style: 'companyDetails' }] : []),
                ]
              },
              {
                width: 160,
                stack: [
                  { text: 'INVOICE', style: 'documentType', alignment: 'right' },
                  { text: selectedInvoice.invoiceNumber, style: 'invoiceNumber', alignment: 'right' },
                  { text: selectedInvoice.status.toUpperCase(), style: 'status', alignment: 'right' }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Divider
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 20] },

          // Customer and Invoice Details
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'BILL TO', style: 'sectionHeader' },
                  { text: selectedCustomer?.name || selectedInvoice.customerName, style: 'customerName' },
                  ...(selectedCustomer?.address ? [{ text: selectedCustomer.address, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.email ? [{ text: selectedCustomer.email, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.phone ? [{ text: selectedCustomer.phone, style: 'customerDetails' }] : []),
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: 'INVOICE DETAILS', style: 'sectionHeader' },
                  { text: [{ text: 'Invoice Date: ', style: 'label' }, { text: new Date(selectedInvoice.invoiceDate).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'Due Date: ', style: 'label' }, { text: new Date(selectedInvoice.dueDate).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'Payment Terms: ', style: 'label' }, { text: `${selectedInvoice.paymentTerms} days`, style: 'value' }] },
                  ...(selectedInvoice.taxRate !== undefined ? [{ text: [{ text: 'Tax Rate: ', style: 'label' }, { text: `${selectedInvoice.taxRate}%`, style: 'value' }] }] : []),
                  ...(selectedInvoice.purchaseOrderNumber ? [{ text: [{ text: 'PO Number: ', style: 'label' }, { text: selectedInvoice.purchaseOrderNumber, style: 'value' }] }] : []),
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Notes (if any)
          ...(selectedInvoice.notes ? [
            {
              stack: [
                { text: 'NOTES', style: 'sectionHeader' },
                { text: selectedInvoice.notes, style: 'notes' }
              ],
              margin: [0, 0, 0, 20]
            }
          ] : []),

          // Line Items Table
          {
            style: 'itemsTable',
            table: {
              headerRows: 1,
              widths: ['*', 40, 80, 85],
              body: [
                [
                  { text: 'DESCRIPTION', style: 'tableHeader' },
                  { text: 'QTY', style: 'tableHeader', alignment: 'right' },
                  { text: 'UNIT PRICE', style: 'tableHeader', alignment: 'right' },
                  { text: 'AMOUNT', style: 'tableHeader', alignment: 'right' }
                ],
                ...selectedInvoice.lineItems.map((item: any) => [
                  { text: item.description, style: 'tableCell' },
                  { text: item.quantity.toString(), style: 'tableCell', alignment: 'right' },
                  { text: `R ${item.unitPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'tableCell', alignment: 'right' },
                  { text: `R ${item.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'tableCell', alignment: 'right' }
                ])
              ]
            },
            layout: {
              hLineWidth: (i: number, node: any) => (i === 0 || i === 1 || i === node.table.body.length) ? 1 : 0.5,
              vLineWidth: () => 0,
              hLineColor: () => '#e2e8f0',
              fillColor: (i: number) => (i === 0) ? '#f8fafc' : null,
              paddingLeft: () => 10,
              paddingRight: () => 10,
              paddingTop: () => 8,
              paddingBottom: () => 8
            },
            margin: [0, 0, 0, 20]
          },

          // Totals
          {
            columns: [
              { width: '*', text: '' },
              {
                width: 200,
                stack: [
                  {
                    columns: [
                      { text: 'Subtotal', style: 'totalLabel' },
                      { text: `R ${selectedInvoice.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 5]
                  },
                  {
                    columns: [
                      { text: `Tax ${selectedInvoice.taxRate ? `(${selectedInvoice.taxRate}%)` : ''}`, style: 'totalLabel' },
                      { text: `R ${selectedInvoice.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 10]
                  },
                  {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#4f46e5' }],
                    margin: [0, 0, 0, 5]
                  },
                  {
                    columns: [
                      { text: 'TOTAL', style: 'grandTotalLabel' },
                      { text: `R ${selectedInvoice.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'grandTotalValue', alignment: 'right' }
                    ]
                  },
                  ...(selectedInvoice.amountPaid > 0 ? [
                    {
                      columns: [
                        { text: 'PAID', style: 'paidLabel' },
                        { text: `R ${selectedInvoice.amountPaid.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'paidValue', alignment: 'right' }
                      ],
                      margin: [0, 10, 0, 5]
                    },
                    {
                      columns: [
                        { text: 'AMOUNT DUE', style: 'dueLabel' },
                        { text: `R ${selectedInvoice.amountDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'dueValue', alignment: 'right' }
                      ]
                    }
                  ] : [])
                ]
              }
            ]
          },

          // Bank Account Details
          ...(primaryBankAccount ? [
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 20] },
                {
                  table: {
                    widths: ['*'],
                    body: [[{ text: 'BANKING DETAILS', style: 'bankingHeader' }]]
                  },
                  layout: {
                    fillColor: () => '#eef2ff',
                    hLineWidth: () => 0,
                    vLineWidth: () => 0,
                    paddingLeft: () => 10,
                    paddingRight: () => 10,
                    paddingTop: () => 8,
                    paddingBottom: () => 8
                  },
                  margin: [0, 0, 0, 15]
                },
                {
                  columns: [
                    {
                      width: '50%',
                      stack: [
                        { text: [{ text: 'Bank: ', style: 'label' }, { text: primaryBankAccount.bankName, style: 'value' }], margin: [0, 0, 0, 5] },
                        { text: [{ text: 'Account Name: ', style: 'label' }, { text: primaryBankAccount.name, style: 'value' }], margin: [0, 0, 0, 5] },
                        ...(primaryBankAccount.branch ? [{ text: [{ text: 'Branch: ', style: 'label' }, { text: primaryBankAccount.branch, style: 'value' }] }] : []),
                      ]
                    },
                    {
                      width: '50%',
                      stack: [
                        { text: [{ text: 'Account Number: ', style: 'label' }, { text: primaryBankAccount.accountNumber, style: 'value' }], margin: [0, 0, 0, 5] },
                        ...(primaryBankAccount.branchCode ? [{ text: [{ text: 'Branch Code: ', style: 'label' }, { text: primaryBankAccount.branchCode, style: 'value' }] }] : []),
                      ]
                    }
                  ]
                }
              ]
            }
          ] : []),

          // Terms and Conditions
          ...(selectedInvoice.termsAndConditions ? [
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 20] },
                { text: 'TERMS & CONDITIONS', style: 'sectionHeader' },
                { text: selectedInvoice.termsAndConditions, style: 'terms' }
              ]
            }
          ] : [])
        ],
        styles: {
          companyName: { fontSize: 20, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          companyDetails: { fontSize: 9, color: '#64748b', margin: [0, 1, 0, 0] },
          documentType: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 5] },
          invoiceNumber: { fontSize: 20, bold: true, color: '#4f46e5', margin: [0, 0, 0, 5] },
          status: { fontSize: 9, bold: true, color: '#4f46e5', margin: [0, 5, 0, 0] },
          sectionHeader: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 10] },
          bankingHeader: { fontSize: 9, bold: true, color: '#3730a3', margin: [0, 0, 0, 0] },
          customerName: { fontSize: 13, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          customerDetails: { fontSize: 10, color: '#64748b', margin: [0, 2, 0, 0] },
          label: { fontSize: 10, color: '#64748b' },
          value: { fontSize: 10, bold: true, color: '#0f172a' },
          notes: { fontSize: 10, color: '#92400e', background: '#fef3c7', margin: [0, 0, 0, 0], padding: 10 },
          tableHeader: { fontSize: 9, bold: true, color: '#475569', margin: [0, 5, 0, 5] },
          tableCell: { fontSize: 10, color: '#0f172a', margin: [0, 5, 0, 5] },
          totalLabel: { fontSize: 10, color: '#64748b' },
          totalValue: { fontSize: 10, bold: true, color: '#0f172a' },
          grandTotalLabel: { fontSize: 12, bold: true, color: '#0f172a' },
          grandTotalValue: { fontSize: 16, bold: true, color: '#4f46e5' },
          paidLabel: { fontSize: 10, color: '#059669' },
          paidValue: { fontSize: 10, bold: true, color: '#059669' },
          dueLabel: { fontSize: 11, bold: true, color: '#dc2626' },
          dueValue: { fontSize: 13, bold: true, color: '#dc2626' },
          terms: { fontSize: 9, color: '#64748b', margin: [0, 0, 0, 0] }
        },
        defaultStyle: {
          font: 'Roboto'
        },
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60],
        footer: (currentPage: number, pageCount: number) => ({
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: 'center',
          fontSize: 9,
          color: '#94a3b8',
          margin: [0, 20, 0, 0]
        })
      };

      // Generate PDF using centralized service
      // PDFService automatically converts Firebase URLs to base64!
      await pdfService.downloadPdf(docDefinition, `invoice-${selectedInvoice.invoiceNumber}`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = !searchTerm ||
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.purchaseOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    outstanding: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.amountDue, 0),
    overdue: invoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled') return false;
      return new Date(inv.dueDate) < new Date();
    }).length,
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (accessLoading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Checking workspace access...</p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!canAccess) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {accessError || 'You do not have access to this workspace.'}
            </AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </WorkspaceLayout>
    );
  }

  if (loading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Loading invoices...</p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <ProtectedRoute>
      <WorkspaceLayout companyId={companyId}>
        <div className="container mx-auto p-6 max-w-7xl space-y-6 min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="text-gray-500 mt-1">Manage customer invoices and track payments</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {stats.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Outstanding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">R {stats.outstanding.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoices Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardContent className="p-0 overflow-visible flex-1">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No invoices found</p>
                          <p className="text-sm">Create your first invoice to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredInvoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {invoice.invoiceNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {invoice.customerName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.invoiceDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R {invoice.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            {invoice.amountDue > 0 && invoice.status !== 'paid' && (
                              <div className="text-xs text-red-600">
                                Due: R {invoice.amountDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                <DropdownMenuItem onSelect={() => openViewDialog(invoice)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {invoice.status === 'draft' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => openEditDialog(invoice)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleSendInvoice(invoice)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send to Customer
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && invoice.amountDue > 0 && (
                                  <DropdownMenuItem onSelect={() => openPaymentDialog(invoice)}>
                                    <DollarSign className="h-4 w-4 mr-2" />
                                    Record Payment
                                  </DropdownMenuItem>
                                )}
                                {invoice.status !== 'draft' && !invoice.journalEntryId && (
                                  <DropdownMenuItem onSelect={() => handlePostToGL(invoice)}>
                                    <Receipt className="h-4 w-4 mr-2" />
                                    Post to GL
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openDeleteDialog(invoice)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Invoice</DialogTitle>
                <DialogDescription>Create a new customer invoice</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select {...register('customerId')}>
                      <option value="">Select customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </Select>
                    {errors.customerId && <p className="text-sm text-red-600">{errors.customerId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input type="date" {...register('invoiceDate')} />
                    {errors.invoiceDate && <p className="text-sm text-red-600">{errors.invoiceDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (Days) *</Label>
                    <Input type="number" {...register('paymentTerms')} />
                    {errors.paymentTerms && <p className="text-sm text-red-600">{errors.paymentTerms.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select {...register('currency')}>
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseOrderNumber">Purchase Order #</Label>
                    <Input {...register('purchaseOrderNumber')} placeholder="Optional" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input type="number" {...register('taxRate')} min="0" max="100" step="0.01" />
                    {errors.taxRate && <p className="text-sm text-red-600">{errors.taxRate.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {company?.vatPercentage !== undefined
                        ? `Pre-filled from company settings (${company.vatPercentage}%)`
                        : 'Using default 15% (set company VAT % in Company Settings)'}
                    </p>
                  </div>
                </div>

                {/* Default GL Account */}
                <div className="space-y-2">
                  <Label htmlFor="defaultGLAccount">Default GL Account (Optional)</Label>
                  <select
                    id="defaultGLAccount"
                    value={defaultGLAccountId}
                    onChange={(e) => setDefaultGLAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select default account for line items...</option>
                    {glAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    New line items will use this account by default (can be changed per item)
                  </p>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">Line Items *</h3>
                    <Button type="button" onClick={() => openLineItemDialog()} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </div>

                  {formLineItems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No line items added yet</p>
                      <Button type="button" onClick={() => openLineItemDialog()} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-20">Qty</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Unit Price</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Amount</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formLineItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">{item.description}</td>
                              <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                              <td className="py-3 px-4 text-sm text-right">R{(item.unitPrice || 0).toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm font-semibold text-right">
                                R{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openLineItemDialog(index)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="Edit item"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeLineItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                      <span className="text-lg font-semibold">R{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Tax ({watch('taxRate') || 0}%):</span>
                      <span className="text-lg font-semibold">R{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold">Total Invoice Amount:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  {errors.lineItems && <p className="text-sm text-red-600">{errors.lineItems.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register('notes')} rows={3} placeholder="Internal notes..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea {...register('termsAndConditions')} rows={3} placeholder="Payment terms and conditions..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Invoice</DialogTitle>
                <DialogDescription>Update invoice details</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleEdit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer *</Label>
                    <Select {...register('customerId')}>
                      <option value="">Select customer...</option>
                      {customers.map(customer => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </Select>
                    {errors.customerId && <p className="text-sm text-red-600">{errors.customerId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invoiceDate">Invoice Date *</Label>
                    <Input type="date" {...register('invoiceDate')} />
                    {errors.invoiceDate && <p className="text-sm text-red-600">{errors.invoiceDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (Days) *</Label>
                    <Input type="number" {...register('paymentTerms')} />
                    {errors.paymentTerms && <p className="text-sm text-red-600">{errors.paymentTerms.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency *</Label>
                    <Select {...register('currency')}>
                      <option value="ZAR">ZAR - South African Rand</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="purchaseOrderNumber">Purchase Order #</Label>
                    <Input {...register('purchaseOrderNumber')} placeholder="Optional" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input type="number" {...register('taxRate')} min="0" max="100" step="0.01" />
                    {errors.taxRate && <p className="text-sm text-red-600">{errors.taxRate.message}</p>}
                    <p className="text-xs text-gray-500 mt-1">
                      {company?.vatPercentage !== undefined
                        ? `Pre-filled from company settings (${company.vatPercentage}%)`
                        : 'Using default 15% (set company VAT % in Company Settings)'}
                    </p>
                  </div>
                </div>

                {/* Default GL Account */}
                <div className="space-y-2">
                  <Label htmlFor="defaultGLAccount">Default GL Account (Optional)</Label>
                  <select
                    id="defaultGLAccount"
                    value={defaultGLAccountId}
                    onChange={(e) => setDefaultGLAccountId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select default account for line items...</option>
                    {glAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {defaultGLAccountId
                      ? 'Auto-detected from existing items (all use same account)'
                      : 'New line items will use this account by default (can be changed per item)'}
                  </p>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-lg">Line Items *</h3>
                    <Button type="button" onClick={() => openLineItemDialog()} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line Item
                    </Button>
                  </div>

                  {formLineItems.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">No line items added yet</p>
                      <Button type="button" onClick={() => openLineItemDialog()} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Item
                      </Button>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-20">Qty</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Unit Price</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Amount</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formLineItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">{item.description}</td>
                              <td className="py-3 px-4 text-sm text-right">{item.quantity}</td>
                              <td className="py-3 px-4 text-sm text-right">R{(item.unitPrice || 0).toFixed(2)}</td>
                              <td className="py-3 px-4 text-sm font-semibold text-right">
                                R{((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openLineItemDialog(index)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="Edit item"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeLineItem(index)}
                                    className="text-red-600 hover:text-red-800"
                                    title="Remove item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                      <span className="text-lg font-semibold">R{calculateSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Tax ({watch('taxRate') || 0}%):</span>
                      <span className="text-lg font-semibold">R{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold">Total Invoice Amount:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register('notes')} rows={3} placeholder="Internal notes..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea {...register('termsAndConditions')} rows={3} placeholder="Payment terms and conditions..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Updating...' : 'Update Invoice'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Invoice Details</DialogTitle>
                <DialogDescription>
                  {selectedInvoice?.invoiceNumber} - {selectedInvoice?.customerName}
                </DialogDescription>
              </DialogHeader>

              {selectedInvoice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Customer</Label>
                      <p className="font-medium">{selectedInvoice.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <p>
                        <Badge className={getStatusColor(selectedInvoice.status)}>
                          {selectedInvoice.status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Invoice Date</Label>
                      <p className="font-medium">{new Date(selectedInvoice.invoiceDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Due Date</Label>
                      <p className="font-medium">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Terms</Label>
                      <p className="font-medium">{selectedInvoice.paymentTerms} days</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Currency</Label>
                      <p className="font-medium">{selectedInvoice.currency}</p>
                    </div>
                    {selectedInvoice.purchaseOrderNumber && (
                      <div>
                        <Label className="text-gray-500">PO Number</Label>
                        <p className="font-medium">{selectedInvoice.purchaseOrderNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Line Items */}
                  <div>
                    <Label className="text-gray-500 mb-2 block">Line Items</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Quantity</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedInvoice.lineItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm">{item.description}</td>
                              <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right">R {item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">R {item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">R {selectedInvoice.subtotal.toFixed(2)}</td>
                          </tr>
                          {selectedInvoice.taxAmount > 0 && (
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium">Tax:</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">R {selectedInvoice.taxAmount.toFixed(2)}</td>
                            </tr>
                          )}
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold">Total:</td>
                            <td className="px-4 py-3 text-sm text-right font-bold">R {selectedInvoice.totalAmount.toFixed(2)}</td>
                          </tr>
                          {selectedInvoice.amountPaid > 0 && (
                            <>
                              <tr>
                                <td colSpan={3} className="px-4 py-3 text-right text-sm font-medium text-green-600">Paid:</td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-green-600">R {selectedInvoice.amountPaid.toFixed(2)}</td>
                              </tr>
                              <tr>
                                <td colSpan={3} className="px-4 py-3 text-right text-sm font-bold text-red-600">Amount Due:</td>
                                <td className="px-4 py-3 text-sm text-right font-bold text-red-600">R {selectedInvoice.amountDue.toFixed(2)}</td>
                              </tr>
                            </>
                          )}
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <div>
                      <Label className="text-gray-500">Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {selectedInvoice.termsAndConditions && (
                    <div>
                      <Label className="text-gray-500">Terms & Conditions</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedInvoice.termsAndConditions}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Line Item Dialog */}
          <Dialog open={isLineItemDialogOpen} onOpenChange={setIsLineItemDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingLineItemIndex !== null ? 'Edit Line Item' : 'Add Line Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingLineItemIndex !== null
                    ? 'Update the line item details below'
                    : 'Enter the details for the new line item'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="lineitem-description">Description *</Label>
                  <Input
                    id="lineitem-description"
                    value={lineItemForm.description || ''}
                    onChange={(e) => updateLineItemForm('description', e.target.value)}
                    placeholder="Item or service description"
                    className={!lineItemForm.description ? 'border-red-300' : ''}
                  />
                  {!lineItemForm.description && (
                    <p className="text-xs text-red-500 mt-1">Description is required</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lineitem-quantity">Quantity *</Label>
                    <Input
                      id="lineitem-quantity"
                      type="number"
                      value={lineItemForm.quantity || 1}
                      onChange={(e) => updateLineItemForm('quantity', parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                      className={(lineItemForm.quantity || 0) <= 0 ? 'border-red-300' : ''}
                    />
                    {(lineItemForm.quantity || 0) <= 0 && (
                      <p className="text-xs text-red-500 mt-1">Quantity must be greater than 0</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lineitem-unitprice">Unit Price (R) *</Label>
                    <Input
                      id="lineitem-unitprice"
                      type="number"
                      value={lineItemForm.unitPrice || 0}
                      onChange={(e) => updateLineItemForm('unitPrice', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className={(lineItemForm.unitPrice || 0) < 0 ? 'border-red-300' : ''}
                    />
                    {(lineItemForm.unitPrice || 0) < 0 && (
                      <p className="text-xs text-red-500 mt-1">Unit price cannot be negative</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="lineitem-glaccount">GL Account (Revenue) *</Label>
                  <select
                    id="lineitem-glaccount"
                    value={lineItemForm.glAccountId || ''}
                    onChange={(e) => updateLineItemForm('glAccountId', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${!lineItemForm.glAccountId ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    <option value="">Select revenue account...</option>
                    {glAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  {!lineItemForm.glAccountId ? (
                    <p className="text-xs text-red-500 mt-1">GL Account is required</p>
                  ) : defaultGLAccountId && lineItemForm.glAccountId === defaultGLAccountId && editingLineItemIndex === null ? (
                    <p className="text-xs text-green-600 mt-1">✓ Using default GL account (can be changed)</p>
                  ) : null}
                </div>

                {/* Amount Preview */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-indigo-900">Line Item Amount:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      R{((lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0)).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-700 mt-2">
                    {lineItemForm.quantity || 0} × R{(lineItemForm.unitPrice || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsLineItemDialogOpen(false);
                    setEditingLineItemIndex(null);
                    setLineItemForm({
                      description: '',
                      quantity: 1,
                      unitPrice: 0,
                      glAccountId: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" onClick={saveLineItem}>
                  {editingLineItemIndex !== null ? 'Update Item' : 'Add Item'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Record Payment Dialog */}
          <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>
                  Record a payment for invoice {selectedInvoice?.invoiceNumber}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitPayment(handleRecordPayment)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input type="date" {...registerPayment('paymentDate')} />
                  {paymentErrors.paymentDate && <p className="text-sm text-red-600">{paymentErrors.paymentDate.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedInvoice?.amountDue || 0}
                    {...registerPayment('amount')}
                  />
                  {paymentErrors.amount && <p className="text-sm text-red-600">{paymentErrors.amount.message}</p>}
                  <p className="text-xs text-gray-500">
                    Amount due: R {selectedInvoice?.amountDue.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select {...registerPayment('paymentMethod')}>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                    <option value="other">Other</option>
                  </Select>
                  {paymentErrors.paymentMethod && <p className="text-sm text-red-600">{paymentErrors.paymentMethod.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reference">Reference</Label>
                  <Input {...registerPayment('reference')} placeholder="Transaction reference..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...registerPayment('notes')} rows={3} placeholder="Payment notes..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete/Cancel Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel invoice {selectedInvoice?.invoiceNumber}?
                  This action will mark the invoice as cancelled but preserve the record for audit purposes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                  {isSubmitting ? 'Cancelling...' : 'Cancel Invoice'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
