'use client';

import { useState, useEffect, useRef } from 'react';
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
import { Plus, FileText, Search, MoreHorizontal, AlertCircle, Eye, Edit, Trash2, X, Send, Check, XIcon, TrendingUp, DollarSign, Printer, Download } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { QuoteService } from '@/lib/accounting/quote-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { ChartOfAccountsService } from '@/lib/accounting/chart-of-accounts-service';
import { InvoiceService } from '@/lib/accounting/invoice-service';
import { BankAccountService } from '@/lib/firebase/bank-account-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { Quote, QuoteLineItem, QuoteStatus } from '@/types/accounting/quote';
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
});

const quoteSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  quoteDate: z.string().min(1, 'Quote date is required'),
  validityPeriod: z.coerce.number().min(1, 'Validity period required').default(30),
  currency: z.string().default('ZAR'),
  notes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item required'),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuotesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customers, setCustomers] = useState<Debtor[]>([]);
  const [glAccounts, setGLAccounts] = useState<ChartOfAccount[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [primaryBankAccount, setPrimaryBankAccount] = useState<BankAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quoteService] = useState(() => new QuoteService());
  const [invoiceService] = useState(() => new InvoiceService());
  const [debtorService] = useState(() => new DebtorService());
  const [bankAccountService] = useState(() => new BankAccountService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLineItemDialogOpen, setIsLineItemDialogOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);
  const [lineItemForm, setLineItemForm] = useState<Partial<QuoteLineItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    glAccountId: ''
  });

  // Ref for PDF generation
  const printContentRef = useRef<HTMLDivElement>(null);

  // Line items state for forms
  const [formLineItems, setFormLineItems] = useState<Array<Partial<QuoteLineItem>>>([
    { description: '', quantity: 1, unitPrice: 0, glAccountId: '' }
  ]);

  // Default GL Account for new line items (optional)
  const [defaultGLAccountId, setDefaultGLAccountId] = useState<string>('');

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      customerId: '',
      quoteDate: new Date().toISOString().split('T')[0],
      validityPeriod: 30,
      currency: 'ZAR',
      notes: '',
      termsAndConditions: '',
      taxRate: 0,
      lineItems: formLineItems as any,
    },
  });

  // Sync formLineItems state with React Hook Form
  useEffect(() => {
    setValue('lineItems', formLineItems as any);
  }, [formLineItems, setValue]);

  useEffect(() => {
    if (canAccess && companyId && user) {
      loadData();
    }
  }, [canAccess, companyId, user]);

  const loadData = async () => {
    console.log('📋 Quotes Page Loading - Company ID:', companyId);
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadQuotes(), loadCustomers(), loadGLAccounts(), loadCompany(), loadBankAccount()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadQuotes = async () => {
    const data = await quoteService.getQuotes(companyId);
    setQuotes(data);
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
      if (companyData.vatPercentage) {
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
      // Don't show error toast - bank account is optional for quotes
    }
  };

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

  const removeLineItem = (index: number) => {
    if (formLineItems.length > 1) {
      setFormLineItems(formLineItems.filter((_, i) => i !== index));
      toast.success('Line item removed');
    } else {
      toast.error('At least one line item is required');
    }
  };

  const updateLineItemForm = (field: keyof QuoteLineItem, value: any) => {
    setLineItemForm(prev => ({
      ...prev,
      [field]: value
    }));
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

  const calculateValidUntil = (quoteDate: string, validityPeriod: number): string => {
    const date = new Date(quoteDate);
    date.setDate(date.getDate() + validityPeriod);
    return date.toISOString().split('T')[0];
  };

  const handleCreate = async (data: QuoteFormData) => {
    if (!user) return;

    console.log('Form submitted with data:', data);
    console.log('Form line items:', formLineItems);
    console.log('Form errors:', errors);

    // Validate line items manually
    const hasEmptyFields = formLineItems.some(item =>
      !item.description ||
      !item.glAccountId ||
      (item.quantity || 0) <= 0 ||
      (item.unitPrice || 0) < 0
    );

    if (hasEmptyFields) {
      toast.error('Please fill in all required line item fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Get customer details
      const customer = customers.find(c => c.id === data.customerId);

      // Build quote data with only defined values
      const quoteData: any = {
        customerId: data.customerId,
        customerName: customer?.name || '',
        customerEmail: customer?.email || '',
        customerAddress: customer?.address || '',
        customerPhone: customer?.phone || '',
        quoteDate: data.quoteDate,
        validityPeriod: data.validityPeriod,
        currency: data.currency,
        lineItems: formLineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: (item.quantity || 0) * (item.unitPrice || 0), // Calculate amount for each line item
          glAccountId: item.glAccountId,
        })),
      };

      // Only add optional fields if they have values
      if (data.notes) quoteData.notes = data.notes;
      if (data.termsAndConditions) quoteData.termsAndConditions = data.termsAndConditions;
      if (data.taxRate !== undefined && data.taxRate !== null) quoteData.taxRate = data.taxRate;

      console.log('Submitting quote data:', quoteData);

      await quoteService.createQuote(companyId, quoteData, user.uid);
      toast.success('Quote created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
      await loadQuotes();
    } catch (error: any) {
      console.error('Error creating quote:', error);
      toast.error(error.message || 'Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: QuoteFormData) => {
    console.log('📝 handleEdit called with data:', data);

    if (!user) {
      console.error('❌ No user found');
      toast.error('User not authenticated');
      return;
    }

    if (!selectedQuote) {
      console.error('❌ No quote selected');
      toast.error('No quote selected for editing');
      return;
    }

    console.log('✅ User and quote validated:', { userId: user.uid, quoteId: selectedQuote.id });
    console.log('Form line items:', formLineItems);

    // Validate line items
    const hasEmptyFields = formLineItems.some(item =>
      !item.description ||
      !item.glAccountId ||
      (item.quantity || 0) <= 0 ||
      (item.unitPrice || 0) < 0
    );

    if (hasEmptyFields) {
      console.error('❌ Validation failed: Empty or invalid line item fields');
      toast.error('Please fill in all required line item fields');
      return;
    }

    console.log('✅ Line items validation passed');

    setIsSubmitting(true);
    try {
      // Clean line items - remove undefined fields
      const cleanLineItems = formLineItems.map(item => {
        const cleanItem: any = {
          id: item.id || `line-${Date.now()}-${Math.random()}`,
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          amount: (item.quantity || 0) * (item.unitPrice || 0),
          glAccountId: item.glAccountId!,
        };

        // Only add optional fields if they have values
        if (item.accountCode) cleanItem.accountCode = item.accountCode;
        if (item.itemCode) cleanItem.itemCode = item.itemCode;
        if (item.notes) cleanItem.notes = item.notes;

        return cleanItem;
      });

      const updates: Partial<Quote> = {
        customerId: data.customerId,
        customerName: customers.find(c => c.id === data.customerId)?.name || '',
        quoteDate: data.quoteDate,
        validityPeriod: data.validityPeriod,
        currency: data.currency,
        lineItems: cleanLineItems,
      };

      // Add optional fields only if they have values
      if (data.taxRate !== undefined && data.taxRate !== null) {
        updates.taxRate = data.taxRate;
      }
      if (data.notes && data.notes.trim()) {
        updates.notes = data.notes;
      }
      if (data.termsAndConditions && data.termsAndConditions.trim()) {
        updates.termsAndConditions = data.termsAndConditions;
      }

      console.log('📤 Calling quoteService.updateQuote with:', {
        companyId,
        quoteId: selectedQuote.id,
        updates
      });

      await quoteService.updateQuote(companyId, selectedQuote.id, updates, user.uid);

      console.log('✅ Quote updated successfully');
      toast.success('Quote updated successfully');

      setIsEditDialogOpen(false);
      setSelectedQuote(null);
      reset();
      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);

      console.log('🔄 Reloading quotes...');
      await loadQuotes();
      console.log('✅ Quotes reloaded');
    } catch (error: any) {
      console.error('❌ Error updating quote:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      toast.error(error.message || 'Failed to update quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedQuote) return;

    setIsSubmitting(true);
    try {
      await quoteService.updateQuoteStatus(companyId, selectedQuote.id, 'rejected', user.uid);
      toast.success('Quote cancelled successfully');
      setIsDeleteDialogOpen(false);
      setSelectedQuote(null);
      await loadQuotes();
    } catch (error: any) {
      console.error('Error deleting quote:', error);
      toast.error(error.message || 'Failed to cancel quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendQuote = async (quote: Quote) => {
    if (!user) return;

    try {
      await quoteService.updateQuoteStatus(companyId, quote.id, 'sent', user.uid);
      toast.success('Quote sent to customer');
      await loadQuotes();
    } catch (error: any) {
      toast.error('Failed to send quote');
    }
  };

  const handleAcceptQuote = async (quote: Quote) => {
    if (!user) return;

    try {
      await quoteService.updateQuoteStatus(companyId, quote.id, 'accepted', user.uid);
      toast.success('Quote marked as accepted');
      await loadQuotes();
    } catch (error: any) {
      toast.error('Failed to accept quote');
    }
  };

  const handleRejectQuote = async (quote: Quote) => {
    if (!user) return;

    try {
      await quoteService.updateQuoteStatus(companyId, quote.id, 'rejected', user.uid);
      toast.success('Quote marked as rejected');
      await loadQuotes();
    } catch (error: any) {
      toast.error('Failed to reject quote');
    }
  };

  const handleConvertToInvoice = async (quote: Quote) => {
    if (!user) return;

    try {
      await invoiceService.createFromQuote(
        companyId,
        quote.id,
        {
          invoiceDate: new Date().toISOString().split('T')[0],
          paymentTerms: 30,
        },
        user.uid
      );
      toast.success('Quote converted to invoice successfully');
      await loadQuotes();
      router.push(`/workspace/${companyId}/invoices`);
    } catch (error: any) {
      console.error('Error converting quote to invoice:', error);
      toast.error(error.message || 'Failed to convert quote to invoice');
    }
  };

  const handlePrintQuote = () => {
    // Simple print using browser's native functionality
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!selectedQuote || !company) {
      toast.error('Quote or company data not available');
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
                  { text: 'QUOTATION', style: 'documentType', alignment: 'right' },
                  { text: selectedQuote.quoteNumber, style: 'quoteNumber', alignment: 'right' },
                  { text: selectedQuote.status.toUpperCase(), style: 'status', alignment: 'right' }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Divider
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 20] },

          // Customer and Quote Details
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'BILL TO', style: 'sectionHeader' },
                  { text: selectedCustomer?.name || selectedQuote.customerName, style: 'customerName' },
                  ...(selectedCustomer?.address || selectedQuote.customerAddress ? [{ text: selectedCustomer?.address || selectedQuote.customerAddress, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.email || selectedQuote.customerEmail ? [{ text: selectedCustomer?.email || selectedQuote.customerEmail, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.phone || selectedQuote.customerPhone ? [{ text: selectedCustomer?.phone || selectedQuote.customerPhone, style: 'customerDetails' }] : []),
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: 'QUOTE DETAILS', style: 'sectionHeader' },
                  { text: [{ text: 'Quote Date: ', style: 'label' }, { text: new Date(selectedQuote.quoteDate).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'Valid Until: ', style: 'label' }, { text: new Date(selectedQuote.validUntil).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'Validity Period: ', style: 'label' }, { text: `${selectedQuote.validityPeriod} days`, style: 'value' }] },
                  ...(selectedQuote.taxRate !== undefined ? [{ text: [{ text: 'Tax Rate: ', style: 'label' }, { text: `${selectedQuote.taxRate}%`, style: 'value' }] }] : []),
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Notes (if any)
          ...(selectedQuote.notes ? [
            {
              stack: [
                { text: 'NOTES', style: 'sectionHeader' },
                { text: selectedQuote.notes, style: 'notes' }
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
                ...selectedQuote.lineItems.map((item: any) => [
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
                      { text: `R ${selectedQuote.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 5]
                  },
                  {
                    columns: [
                      { text: `Tax ${selectedQuote.taxRate ? `(${selectedQuote.taxRate}%)` : ''}`, style: 'totalLabel' },
                      { text: `R ${selectedQuote.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
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
                      { text: `R ${selectedQuote.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'grandTotalValue', alignment: 'right' }
                    ]
                  }
                ]
              }
            ]
          },

          // Bank Account Details - WITH SUBTLE HEADER BACKGROUND
          ...(primaryBankAccount ? [
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 20] },
                // Header with subtle background
                {
                  table: {
                    widths: ['*'],
                    body: [[{ text: 'BANKING DETAILS', style: 'bankingHeader' }]]
                  },
                  layout: {
                    fillColor: () => '#eef2ff', // Indigo-50
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
          ...(selectedQuote.termsAndConditions ? [
            {
              stack: [
                { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 20] },
                { text: 'TERMS & CONDITIONS', style: 'sectionHeader' },
                { text: selectedQuote.termsAndConditions, style: 'terms' }
              ]
            }
          ] : [])
        ],
        styles: {
          companyName: { fontSize: 20, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          companyDetails: { fontSize: 9, color: '#64748b', margin: [0, 1, 0, 0] },
          documentType: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 5] },
          quoteNumber: { fontSize: 20, bold: true, color: '#4f46e5', margin: [0, 0, 0, 5] },
          status: { fontSize: 9, bold: true, color: '#4f46e5', margin: [0, 5, 0, 0] },
          sectionHeader: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 10] },
          bankingHeader: { fontSize: 9, bold: true, color: '#3730a3', margin: [0, 0, 0, 0] }, // Indigo-900 for subtle header
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
      await pdfService.downloadPdf(docDefinition, `quote-${selectedQuote.quoteNumber}`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const openCreateDialog = () => {
    // Reset form but preserve company defaults
    // Use company VAT percentage, or default to 15% (South Africa standard) if not set
    const companyTaxRate = company?.vatPercentage !== undefined ? company.vatPercentage : 15;

    console.log('=== Opening Create Quote Dialog ===');
    console.log('Company:', company);
    console.log('Company VAT Percentage:', company?.vatPercentage);
    console.log('Using Tax Rate:', companyTaxRate);

    reset({
      customerId: '',
      quoteDate: new Date().toISOString().split('T')[0],
      validityPeriod: 30,
      currency: 'ZAR',
      notes: '',
      termsAndConditions: '',
      taxRate: companyTaxRate, // Pre-populate from company (or 15% default)
      lineItems: [] as any
    });
    setFormLineItems([]);
    setDefaultGLAccountId(''); // Reset default GL
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (quote: Quote) => {
    console.log('🔧 Opening edit dialog for quote:', quote.id, quote.quoteNumber);
    console.log('Quote data:', quote);

    setSelectedQuote(quote);
    setValue('customerId', quote.customerId);
    setValue('quoteDate', quote.quoteDate.split('T')[0]);
    setValue('validityPeriod', quote.validityPeriod);
    setValue('currency', quote.currency);
    setValue('taxRate', quote.taxRate || 0);
    if (quote.notes) setValue('notes', quote.notes);
    if (quote.termsAndConditions) setValue('termsAndConditions', quote.termsAndConditions);

    const lineItems = quote.lineItems.map(item => ({
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
      }
    } else {
      setDefaultGLAccountId('');
    }

    console.log('✅ Edit dialog opened, state set to true');
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (quote: Quote) => {
    // Find customer details from loaded customers
    const customer = customers.find(c => c.id === quote.customerId);
    setSelectedCustomer(customer || null);
    setSelectedQuote(quote);
    setIsViewDialogOpen(true);

    // Debug: Log company data to understand logo issue
    console.log('=== VIEW DIALOG DEBUG ===');
    console.log('Company data:', company);
    console.log('Logo URL:', company?.logoUrl);
    console.log('Logo URL type:', typeof company?.logoUrl);
    console.log('Company has logoUrl?', !!company?.logoUrl);
    console.log('=========================');
  };

  const openDeleteDialog = (quote: Quote) => {
    setSelectedQuote(quote);
    setIsDeleteDialogOpen(true);
  };

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-orange-100 text-orange-800';
      case 'converted':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (quote.customerName && quote.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate summary statistics
  const totalQuotes = quotes.length;
  const pendingQuotes = quotes.filter(q => q.status === 'sent').length;
  const acceptedQuotes = quotes.filter(q => q.status === 'accepted').length;
  const rejectedQuotes = quotes.filter(q => q.status === 'rejected').length;
  const acceptanceRate = (acceptedQuotes + rejectedQuotes) > 0
    ? ((acceptedQuotes / (acceptedQuotes + rejectedQuotes)) * 100).toFixed(1)
    : '0.0';
  const totalValue = quotes.reduce((sum, q) => sum + q.totalAmount, 0);

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
      <ProtectedRoute requireCompany>
        <WorkspaceLayout companyId={companyId}>
          <div className="p-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-600">Loading quotes...</p>
              </div>
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  return (
    <>
      {/* Print-specific styles */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the dialog content when printing */
          body * {
            visibility: hidden;
          }

          /* Show only the view dialog content */
          [role="dialog"] *,
          [role="dialog"] {
            visibility: visible;
          }

          /* Hide dialog backdrop, header, footer buttons */
          [role="dialog"] > div:first-child,
          button,
          .print-hide {
            display: none !important;
          }

          /* Reset dialog styles for print */
          [role="dialog"] {
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            padding: 20mm !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
          }

          /* Table: ALLOW page breaks, but keep header with content */
          table {
            page-break-inside: auto !important;
            break-inside: auto !important;
          }

          thead {
            display: table-header-group !important;
          }

          /* ONLY prevent breaks within individual rows */
          tbody tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
            break-inside: avoid !important;
            break-after: auto !important;
          }

          td, th {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure borders are visible in print */
          .border,
          table,
          thead,
          tbody,
          tr,
          td,
          th {
            border-color: #000 !important;
          }

          /* Keep background colors for important elements */
          .bg-gray-50,
          .bg-slate-50,
          thead {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Ensure images display */
          img {
            display: block !important;
            max-width: 100% !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      <ProtectedRoute requireCompany>
        <WorkspaceLayout companyId={companyId}>
          <div className="p-6 max-w-7xl mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
              <p className="text-gray-600">Manage and track your sales quotes</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Quote
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuotes}</div>
                <p className="text-xs text-muted-foreground">All quotes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Quotes</CardTitle>
                <div className="h-2 w-2 rounded-full bg-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingQuotes}</div>
                <p className="text-xs text-muted-foreground">Awaiting response</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Acceptance Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{acceptanceRate}%</div>
                <p className="text-xs text-muted-foreground">
                  {acceptedQuotes} of {acceptedQuotes + rejectedQuotes} decided
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{totalValue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All quotes combined</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search quotes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as QuoteStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="converted">Converted</option>
            </select>
          </div>

          {/* Quotes Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Sales Quotes</CardTitle>
              <CardDescription>
                All quotes with their current status and details
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible flex-1">
              {filteredQuotes.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first quote</p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Quote
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Quote #</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Amount</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Quote Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Valid Until</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredQuotes.map((quote) => (
                        <tr key={quote.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-indigo-600">{quote.quoteNumber}</span>
                          </td>
                          <td className="py-3 px-4">{quote.customerName || 'Unknown'}</td>
                          <td className="py-3 px-4 font-medium">
                            {quote.currency} {quote.totalAmount.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(quote.status)}>
                              {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(quote.quoteDate).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-gray-600">
                            {new Date(quote.validUntil).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                <DropdownMenuItem onSelect={() => openViewDialog(quote)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {quote.status === 'draft' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => openEditDialog(quote)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleSendQuote(quote)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Send to Customer
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {quote.status === 'sent' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleAcceptQuote(quote)}>
                                      <Check className="h-4 w-4 mr-2" />
                                      Mark as Accepted
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleRejectQuote(quote)}>
                                      <X className="h-4 w-4 mr-2" />
                                      Mark as Rejected
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {quote.status === 'accepted' && !quote.convertedToInvoiceId && (
                                  <DropdownMenuItem onSelect={() => handleConvertToInvoice(quote)}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Convert to Invoice
                                  </DropdownMenuItem>
                                )}
                                {quote.convertedToInvoiceId && (
                                  <DropdownMenuItem
                                    onSelect={() => router.push(`/workspace/${companyId}/invoices`)}
                                  >
                                    <FileText className="h-4 w-4 mr-2" />
                                    View Invoice
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => openDeleteDialog(quote)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Quote
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Create Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Quote</DialogTitle>
                <DialogDescription>
                  Create a new sales quote for a customer
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customerId">Customer *</Label>
                      <select
                        id="customerId"
                        {...register('customerId')}
                        className={`w-full px-3 py-2 border rounded-md ${errors.customerId ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select customer...</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      {errors.customerId && (
                        <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="quoteDate">Quote Date *</Label>
                      <Input
                        id="quoteDate"
                        type="date"
                        {...register('quoteDate')}
                        className={errors.quoteDate ? 'border-red-500' : ''}
                      />
                      {errors.quoteDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.quoteDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="validityPeriod">Validity Period (Days) *</Label>
                      <Input
                        id="validityPeriod"
                        type="number"
                        {...register('validityPeriod')}
                        placeholder="30"
                        className={errors.validityPeriod ? 'border-red-500' : ''}
                      />
                      {errors.validityPeriod && (
                        <p className="text-red-500 text-sm mt-1">{errors.validityPeriod.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <Input
                        id="currency"
                        {...register('currency')}
                        placeholder="ZAR"
                      />
                    </div>

                    <div>
                      <Label htmlFor="taxRate">Tax Rate (%)</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        {...register('taxRate')}
                        placeholder="15"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {company?.vatPercentage !== undefined
                          ? `Pre-filled from company settings (${company.vatPercentage}%)`
                          : 'Using default 15% (set company VAT % in Company Settings)'}
                      </p>
                    </div>
                  </div>

                  <div>
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

                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Internal notes..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="termsAndConditions">Terms and Conditions</Label>
                    <Textarea
                      id="termsAndConditions"
                      {...register('termsAndConditions')}
                      placeholder="Quote terms and conditions..."
                      rows={3}
                    />
                  </div>
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
                      <span className="text-lg font-bold">Total Quote Value:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      reset();
                      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || formLineItems.length === 0}>
                    {isSubmitting ? 'Creating...' : 'Create Quote'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Quote</DialogTitle>
                <DialogDescription>
                  Update quote information and line items
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleEdit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-customerId">Customer *</Label>
                      <select
                        id="edit-customerId"
                        {...register('customerId')}
                        className={`w-full px-3 py-2 border rounded-md ${errors.customerId ? 'border-red-500' : 'border-gray-300'}`}
                      >
                        <option value="">Select customer...</option>
                        {customers.map(customer => (
                          <option key={customer.id} value={customer.id}>
                            {customer.name}
                          </option>
                        ))}
                      </select>
                      {errors.customerId && (
                        <p className="text-red-500 text-sm mt-1">{errors.customerId.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-quoteDate">Quote Date *</Label>
                      <Input
                        id="edit-quoteDate"
                        type="date"
                        {...register('quoteDate')}
                        className={errors.quoteDate ? 'border-red-500' : ''}
                      />
                      {errors.quoteDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.quoteDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-validityPeriod">Validity Period (Days) *</Label>
                      <Input
                        id="edit-validityPeriod"
                        type="number"
                        {...register('validityPeriod')}
                        placeholder="30"
                        className={errors.validityPeriod ? 'border-red-500' : ''}
                      />
                      {errors.validityPeriod && (
                        <p className="text-red-500 text-sm mt-1">{errors.validityPeriod.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="edit-currency">Currency</Label>
                      <Input
                        id="edit-currency"
                        {...register('currency')}
                        placeholder="ZAR"
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-taxRate">Tax Rate (%)</Label>
                      <Input
                        id="edit-taxRate"
                        type="number"
                        {...register('taxRate')}
                        placeholder="15"
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {company?.vatPercentage !== undefined
                          ? `Pre-filled from company settings (${company.vatPercentage}%)`
                          : 'Using default 15% (set company VAT % in Company Settings)'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="edit-defaultGLAccount">Default GL Account (Optional)</Label>
                    <select
                      id="edit-defaultGLAccount"
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

                  <div>
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      {...register('notes')}
                      placeholder="Internal notes..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="edit-termsAndConditions">Terms and Conditions</Label>
                    <Textarea
                      id="edit-termsAndConditions"
                      {...register('termsAndConditions')}
                      placeholder="Quote terms and conditions..."
                      rows={3}
                    />
                  </div>
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
                      <span className="text-lg font-bold">Total Quote Value:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedQuote(null);
                      reset();
                      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || formLineItems.length === 0}>
                    {isSubmitting ? 'Updating...' : 'Update Quote'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="print-hide">
                <DialogTitle>Quote Details</DialogTitle>
                <DialogDescription>
                  View complete quote information
                </DialogDescription>
              </DialogHeader>

              {selectedQuote && (
                <div ref={printContentRef} className="bg-white p-8" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
                  {/* Modern Header with Logo */}
                  {company && (
                    <div className="flex items-start justify-between mb-10 pb-8 border-b border-slate-200">
                      <div className="flex items-start gap-6">
                        {company.logoUrl && (
                          <img
                            src={company.logoUrl}
                            alt={company.name}
                            className="h-24 w-24 object-contain transition-transform duration-300 hover:scale-110"
                          />
                        )}
                        <div>
                          <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">{company.name}</h1>
                          <div className="text-xs text-slate-600 space-y-0.5 leading-relaxed">
                            {company.address && <p>{company.address}</p>}
                            {company.email && <p>{company.email}</p>}
                            {company.phone && <p>{company.phone}</p>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500 mb-1 tracking-wide">QUOTATION</p>
                        <p className="text-2xl font-bold text-indigo-600 mb-2">{selectedQuote.quoteNumber}</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedQuote.status)}`}>
                          {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer and Quote Details - Modern Grid */}
                  <div className="grid grid-cols-2 gap-8 mb-10">
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Bill To</h3>
                      <div className="space-y-1.5">
                        <p className="font-semibold text-slate-900 text-base">{selectedCustomer?.name || selectedQuote.customerName}</p>
                        {(selectedCustomer?.address || selectedQuote.customerAddress) && (
                          <p className="text-sm text-slate-600">{selectedCustomer?.address || selectedQuote.customerAddress}</p>
                        )}
                        {(selectedCustomer?.email || selectedQuote.customerEmail) && (
                          <p className="text-sm text-slate-600">{selectedCustomer?.email || selectedQuote.customerEmail}</p>
                        )}
                        {(selectedCustomer?.phone || selectedQuote.customerPhone) && (
                          <p className="text-sm text-slate-600">{selectedCustomer?.phone || selectedQuote.customerPhone}</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-xs text-slate-500 font-medium">Quote Date</span>
                        <span className="text-sm font-semibold text-slate-900">{new Date(selectedQuote.quoteDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-xs text-slate-500 font-medium">Valid Until</span>
                        <span className="text-sm font-semibold text-slate-900">{new Date(selectedQuote.validUntil).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-xs text-slate-500 font-medium">Validity</span>
                        <span className="text-sm font-semibold text-slate-900">{selectedQuote.validityPeriod} days</span>
                      </div>
                      {selectedQuote.taxRate !== undefined && (
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <span className="text-xs text-slate-500 font-medium">Tax Rate</span>
                          <span className="text-sm font-semibold text-slate-900">{selectedQuote.taxRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedQuote.notes && (
                    <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r">
                      <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-2">Notes</h4>
                      <p className="text-sm text-amber-800 whitespace-pre-wrap leading-relaxed">{selectedQuote.notes}</p>
                    </div>
                  )}

                  {/* Line Items - Modern Table */}
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Items & Services</h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="text-left py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider">Description</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider w-20">Qty</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider w-28">Unit Price</th>
                            <th className="text-right py-3 px-4 text-xs font-bold text-slate-700 uppercase tracking-wider w-32">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedQuote.lineItems.map((item, index) => (
                            <tr
                              key={item.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
                              style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                            >
                              <td className="py-3.5 px-4 text-sm text-slate-900 border-b border-slate-100">{item.description}</td>
                              <td className="py-3.5 px-4 text-right text-sm text-slate-700 border-b border-slate-100">{item.quantity}</td>
                              <td className="py-3.5 px-4 text-right text-sm text-slate-700 border-b border-slate-100">
                                R {item.unitPrice.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3.5 px-4 text-right text-sm font-semibold text-slate-900 border-b border-slate-100">
                                R {item.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Modern Totals Section */}
                    <div className="mt-6 flex justify-end">
                      <div className="w-80 space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-600">Subtotal</span>
                          <span className="text-base font-semibold text-slate-900">
                            R {selectedQuote.subtotal.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100">
                          <span className="text-sm text-slate-600">
                            Tax {selectedQuote.taxRate ? `(${selectedQuote.taxRate}%)` : ''}
                          </span>
                          <span className="text-base font-semibold text-slate-900">
                            R {selectedQuote.taxAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-3 bg-indigo-50 -mx-4 px-4 rounded-lg">
                          <span className="text-base font-bold text-slate-900">Total</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            R {selectedQuote.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Banking Details - Modern with Subtle Background */}
                  {primaryBankAccount && (
                    <div className="mt-8 rounded-lg overflow-hidden border border-slate-200">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 px-4 py-3 border-b border-indigo-100">
                        <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Banking Details</h4>
                      </div>
                      <div className="p-4 bg-white">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-slate-500 font-medium">Bank:</span>
                              <span className="text-sm font-semibold text-slate-900">{primaryBankAccount.bankName}</span>
                            </div>
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-slate-500 font-medium">Account Name:</span>
                              <span className="text-sm font-semibold text-slate-900">{primaryBankAccount.name}</span>
                            </div>
                            {primaryBankAccount.branch && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-slate-500 font-medium">Branch:</span>
                                <span className="text-sm font-semibold text-slate-900">{primaryBankAccount.branch}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                              <span className="text-xs text-slate-500 font-medium">Account Number:</span>
                              <span className="text-sm font-semibold text-slate-900">{primaryBankAccount.accountNumber}</span>
                            </div>
                            {primaryBankAccount.branchCode && (
                              <div className="flex items-baseline gap-2">
                                <span className="text-xs text-slate-500 font-medium">Branch Code:</span>
                                <span className="text-sm font-semibold text-slate-900">{primaryBankAccount.branchCode}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms and Conditions - Modern */}
                  {selectedQuote.termsAndConditions && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Terms & Conditions</h4>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                        {selectedQuote.termsAndConditions}
                      </p>
                    </div>
                  )}

                  <DialogFooter className="flex justify-between items-center print-hide">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handlePrintQuote}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print
                      </Button>
                      <Button variant="outline" onClick={handleDownloadPDF}>
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                        Close
                      </Button>
                      {selectedQuote.status === 'draft' && (
                        <Button onClick={() => {
                          setIsViewDialogOpen(false);
                          openEditDialog(selectedQuote);
                        }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Quote
                        </Button>
                      )}
                    </div>
                  </DialogFooter>
                </div>
              )}
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

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Quote?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the quote as rejected. This action cannot be undone.
                </AlertDialogDescription>
                {selectedQuote && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedQuote.quoteNumber}</p>
                    <p className="text-sm text-gray-600">{selectedQuote.customerName}</p>
                  </div>
                )}
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? 'Cancelling...' : 'Cancel Quote'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
    </>
  );
}
