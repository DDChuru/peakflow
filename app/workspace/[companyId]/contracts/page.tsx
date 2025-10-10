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
import { Plus, FileCheck, Search, Filter, MoreHorizontal, Calendar, AlertCircle, Eye, Edit, Trash2, X, FileText, Download } from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { SLAService } from '@/lib/accounting/sla-service';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { ChartOfAccountsService } from '@/lib/accounting/chart-of-accounts-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { ServiceAgreement, SLALineItem, BillingFrequency, SLAStatus } from '@/types/accounting/sla';
import { Debtor } from '@/types/financial';
import { ChartOfAccount } from '@/types/accounting/chart-of-accounts';
import { useForm, Controller } from 'react-hook-form';
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
  unit: z.string().optional(),
});

const slaSchema = z.object({
  contractName: z.string().min(1, 'Contract name is required'),
  customerId: z.string().min(1, 'Customer is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  billingFrequency: z.enum(['monthly', 'quarterly', 'annual', 'custom']),
  currency: z.string().default('ZAR'),
  paymentTerms: z.coerce.number().min(0).default(30),
  autoGenerateInvoices: z.boolean().default(false),
  description: z.string().optional(),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
  advanceDays: z.coerce.number().min(0).optional(),
  taxRate: z.coerce.number().min(0).max(100).optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type SLAFormData = z.infer<typeof slaSchema>;

export default function ContractsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [slas, setSLAs] = useState<ServiceAgreement[]>([]);
  const [customers, setCustomers] = useState<Debtor[]>([]);
  const [glAccounts, setGLAccounts] = useState<ChartOfAccount[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slaService] = useState(() => new SLAService());
  const [debtorService] = useState(() => new DebtorService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SLAStatus | 'all'>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLineItemDialogOpen, setIsLineItemDialogOpen] = useState(false);
  const [selectedSLA, setSelectedSLA] = useState<ServiceAgreement | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);

  // Line items state for forms
  const [formLineItems, setFormLineItems] = useState<Array<Partial<SLALineItem>>>([
    { description: '', quantity: 1, unitPrice: 0, glAccountId: '' }
  ]);

  // Default GL Account for new line items (optional)
  const [defaultGLAccountId, setDefaultGLAccountId] = useState<string>('');

  // Line item form state for dialog
  const [lineItemForm, setLineItemForm] = useState<Partial<SLALineItem>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    glAccountId: ''
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SLAFormData>({
    resolver: zodResolver(slaSchema),
    defaultValues: {
      contractName: '',
      customerId: '',
      startDate: '',
      endDate: '',
      billingFrequency: 'monthly',
      currency: 'ZAR',
      paymentTerms: 30,
      autoGenerateInvoices: false,
      description: '',
      taxRate: 0,
      lineItems: formLineItems as any,
    },
  });

  // Sync formLineItems state with React Hook Form
  useEffect(() => {
    setValue('lineItems', formLineItems as any, { shouldValidate: true });
    console.log('📋 Line items synced:', formLineItems);
  }, [formLineItems, setValue]);

  useEffect(() => {
    if (canAccess && companyId && user) {
      loadData();
    }
  }, [canAccess, companyId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadSLAs(), loadCustomers(), loadGLAccounts(), loadCompany()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSLAs = async () => {
    const data = await slaService.getSLAs(companyId);
    setSLAs(data);
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
      setCompany(companyData);
      // Pre-fill taxRate from company vatPercentage
      if (companyData.vatPercentage) {
        setValue('taxRate', companyData.vatPercentage);
      }
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

  const updateLineItemForm = (field: keyof SLALineItem, value: any) => {
    setLineItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addLineItem = () => {
    setFormLineItems([...formLineItems, { description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
  };

  const removeLineItem = (index: number) => {
    if (formLineItems.length > 1) {
      setFormLineItems(formLineItems.filter((_, i) => i !== index));
      toast.success('Line item removed');
    } else {
      toast.error('At least one line item is required');
    }
  };

  const updateLineItem = (index: number, field: keyof SLALineItem, value: any) => {
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

  const handleCreate = async (data: SLAFormData) => {
    console.log('✅ handleCreate called with data:', data);
    console.log('📊 Form validation errors:', errors);

    if (!user) return;

    setIsSubmitting(true);
    try {
      // Calculate next billing date based on start date
      const startDate = new Date(data.startDate);
      let nextBillingDate = new Date(startDate);

      if (data.dayOfMonth && data.billingFrequency === 'monthly') {
        nextBillingDate.setDate(Math.min(data.dayOfMonth, new Date(nextBillingDate.getFullYear(), nextBillingDate.getMonth() + 1, 0).getDate()));
      }

      // Build SLA data with only defined values
      const slaData: any = {
        contractNumber: '', // Will be auto-generated
        contractName: data.contractName,
        customerId: data.customerId,
        customerName: customers.find(c => c.id === data.customerId)?.name || '',
        startDate: data.startDate,
        endDate: data.endDate,
        billingFrequency: data.billingFrequency,
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        status: 'draft' as SLAStatus,
        autoGenerateInvoices: data.autoGenerateInvoices || false,
        contractValue: 0, // Will be calculated from line items
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        lineItems: formLineItems.map(item => {
          const lineItem: any = {
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            amount: item.quantity * item.unitPrice, // Calculate amount for each line item
            glAccountId: item.glAccountId,
            effectiveFrom: data.startDate,
            status: 'active',
            recurrence: 'always',
          };

          if (item.unit) lineItem.unit = item.unit;

          return lineItem;
        }),
      };

      // Only add optional fields if they have values
      if (data.description) slaData.description = data.description;
      if (data.dayOfMonth) slaData.dayOfMonth = data.dayOfMonth;
      if (data.advanceDays) slaData.advanceDays = data.advanceDays;
      if (data.taxRate) slaData.taxRate = data.taxRate;

      await slaService.createSLA(companyId, slaData, user.uid);
      toast.success('Service agreement created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
      await loadSLAs();
    } catch (error: any) {
      console.error('Error creating SLA:', error);
      toast.error(error.message || 'Failed to create service agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: SLAFormData) => {
    if (!user || !selectedSLA) return;

    setIsSubmitting(true);
    try {
      const updates: any = {
        contractName: data.contractName,
        customerId: data.customerId,
        customerName: customers.find(c => c.id === data.customerId)?.name || '',
        startDate: data.startDate,
        endDate: data.endDate,
        billingFrequency: data.billingFrequency,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        autoGenerateInvoices: data.autoGenerateInvoices || false,
        lineItems: formLineItems.map(item => ({
          ...item,
          id: item.id || `temp-${Date.now()}-${Math.random()}`,
          amount: (item.quantity || 0) * (item.unitPrice || 0),
          effectiveFrom: item.effectiveFrom || data.startDate,
          status: item.status || 'active',
          recurrence: item.recurrence || 'always',
          createdAt: item.createdAt || new Date(),
          updatedAt: new Date(),
        })),
      };

      if (data.description) updates.description = data.description;
      if (data.dayOfMonth) updates.dayOfMonth = data.dayOfMonth;
      if (data.advanceDays) updates.advanceDays = data.advanceDays;
      if (data.taxRate) updates.taxRate = data.taxRate;

      await slaService.updateSLA(companyId, selectedSLA.id, updates, user.uid);
      toast.success('Service agreement updated successfully');
      setIsEditDialogOpen(false);
      setSelectedSLA(null);
      reset();
      setFormLineItems([{ description: '', quantity: 1, unitPrice: 0, glAccountId: '' }]);
      await loadSLAs();
    } catch (error: any) {
      console.error('Error updating SLA:', error);
      toast.error(error.message || 'Failed to update service agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedSLA) return;

    setIsSubmitting(true);
    try {
      await slaService.deleteSLA(companyId, selectedSLA.id, user.uid);
      toast.success('Service agreement cancelled successfully');
      setIsDeleteDialogOpen(false);
      setSelectedSLA(null);
      await loadSLAs();
    } catch (error: any) {
      console.error('Error deleting SLA:', error);
      toast.error(error.message || 'Failed to cancel service agreement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCreateDialog = () => {
    // Reset form but preserve company defaults
    const companyTaxRate = company?.vatPercentage !== undefined ? company.vatPercentage : 15;

    reset({
      contractName: '',
      customerId: '',
      startDate: '',
      endDate: '',
      billingFrequency: 'monthly',
      currency: 'ZAR',
      paymentTerms: 30,
      autoGenerateInvoices: false,
      description: '',
      taxRate: companyTaxRate,
      lineItems: [] as any
    });
    setFormLineItems([]);
    setDefaultGLAccountId(''); // Reset default GL
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (sla: ServiceAgreement) => {
    setSelectedSLA(sla);
    setValue('contractName', sla.contractName);
    setValue('customerId', sla.customerId);
    setValue('startDate', sla.startDate);
    setValue('endDate', sla.endDate);
    setValue('billingFrequency', sla.billingFrequency);
    setValue('currency', sla.currency);
    setValue('paymentTerms', sla.paymentTerms);
    setValue('autoGenerateInvoices', sla.autoGenerateInvoices);
    if (sla.description) setValue('description', sla.description);
    if (sla.dayOfMonth) setValue('dayOfMonth', sla.dayOfMonth);
    if (sla.advanceDays) setValue('advanceDays', sla.advanceDays);
    setValue('taxRate', sla.taxRate ?? company?.vatPercentage ?? 15);

    const lineItems = sla.lineItems.map(item => ({
      ...item,
      id: item.id,
      effectiveFrom: item.effectiveFrom,
      status: item.status,
      recurrence: item.recurrence,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

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

  const openViewDialog = (sla: ServiceAgreement) => {
    setSelectedSLA(sla);
    // Load full customer details
    const customer = customers.find(c => c.id === sla.customerId);
    setSelectedCustomer(customer || null);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (sla: ServiceAgreement) => {
    setSelectedSLA(sla);
    setIsDeleteDialogOpen(true);
  };

  const handleDownloadPDF = async () => {
    if (!selectedSLA || !company) {
      toast.error('Service agreement or company data not available');
      return;
    }

    try {
      const logoUrl = company.logoUrl || null;

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
                  { text: 'SERVICE AGREEMENT', style: 'documentType', alignment: 'right' },
                  { text: selectedSLA.contractNumber, style: 'contractNumber', alignment: 'right' },
                  { text: selectedSLA.status.toUpperCase(), style: 'status', alignment: 'right' }
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Divider
          { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 0, 0, 20] },

          // Customer and Agreement Details
          {
            columns: [
              {
                width: '50%',
                stack: [
                  { text: 'CLIENT', style: 'sectionHeader' },
                  { text: selectedCustomer?.name || selectedSLA.customerName, style: 'customerName' },
                  ...(selectedCustomer?.address ? [{ text: selectedCustomer.address, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.email ? [{ text: selectedCustomer.email, style: 'customerDetails' }] : []),
                  ...(selectedCustomer?.phone ? [{ text: selectedCustomer.phone, style: 'customerDetails' }] : []),
                ]
              },
              {
                width: '50%',
                stack: [
                  { text: 'AGREEMENT DETAILS', style: 'sectionHeader' },
                  { text: [{ text: 'Contract Name: ', style: 'label' }, { text: selectedSLA.contractName, style: 'value' }] },
                  { text: [{ text: 'Start Date: ', style: 'label' }, { text: new Date(selectedSLA.startDate).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'End Date: ', style: 'label' }, { text: new Date(selectedSLA.endDate).toLocaleDateString(), style: 'value' }] },
                  { text: [{ text: 'Billing Frequency: ', style: 'label' }, { text: selectedSLA.billingFrequency.toUpperCase(), style: 'value' }] },
                  { text: [{ text: 'Payment Terms: ', style: 'label' }, { text: `${selectedSLA.paymentTerms} days`, style: 'value' }] },
                  ...(selectedSLA.taxRate !== undefined ? [{ text: [{ text: 'Tax Rate: ', style: 'label' }, { text: `${selectedSLA.taxRate}%`, style: 'value' }] }] : []),
                ]
              }
            ],
            margin: [0, 0, 0, 20]
          },

          // Description (if any)
          ...(selectedSLA.description ? [
            {
              stack: [
                { text: 'DESCRIPTION', style: 'sectionHeader' },
                { text: selectedSLA.description, style: 'description' }
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
                ...selectedSLA.lineItems.map((item: any) => [
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
                      { text: `R ${(selectedSLA.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 5]
                  },
                  ...(selectedSLA.taxRate && selectedSLA.taxRate > 0 ? [{
                    columns: [
                      { text: `Tax (${selectedSLA.taxRate}%)`, style: 'totalLabel' },
                      { text: `R ${(selectedSLA.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0) * (selectedSLA.taxRate / 100)).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'totalValue', alignment: 'right' }
                    ],
                    margin: [0, 0, 0, 10]
                  }] : []),
                  {
                    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, lineColor: '#4f46e5' }],
                    margin: [0, 0, 0, 5]
                  },
                  {
                    columns: [
                      { text: 'TOTAL CONTRACT VALUE', style: 'grandTotalLabel' },
                      { text: `R ${selectedSLA.contractValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'grandTotalValue', alignment: 'right' }
                    ]
                  },
                  ...(selectedSLA.billingFrequency === 'monthly' ? [{
                    columns: [
                      { text: 'Monthly Recurring', style: 'recurringLabel' },
                      { text: `R ${(selectedSLA.contractValue / 12).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'recurringValue', alignment: 'right' }
                    ],
                    margin: [0, 10, 0, 0]
                  }] : selectedSLA.billingFrequency === 'quarterly' ? [{
                    columns: [
                      { text: 'Quarterly', style: 'recurringLabel' },
                      { text: `R ${(selectedSLA.contractValue / 4).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, style: 'recurringValue', alignment: 'right' }
                    ],
                    margin: [0, 10, 0, 0]
                  }] : [])
                ]
              }
            ]
          },

          // Billing Information
          {
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: '#e2e8f0' }], margin: [0, 20, 0, 20] },
              { text: 'BILLING INFORMATION', style: 'sectionHeader' },
              {
                columns: [
                  {
                    width: '50%',
                    stack: [
                      { text: [{ text: 'Billing Frequency: ', style: 'label' }, { text: selectedSLA.billingFrequency.charAt(0).toUpperCase() + selectedSLA.billingFrequency.slice(1), style: 'value' }], margin: [0, 0, 0, 5] },
                      { text: [{ text: 'Next Billing Date: ', style: 'label' }, { text: new Date(selectedSLA.nextBillingDate).toLocaleDateString(), style: 'value' }], margin: [0, 0, 0, 5] },
                    ]
                  },
                  {
                    width: '50%',
                    stack: [
                      { text: [{ text: 'Payment Terms: ', style: 'label' }, { text: `${selectedSLA.paymentTerms} days`, style: 'value' }], margin: [0, 0, 0, 5] },
                      { text: [{ text: 'Auto-Generate Invoices: ', style: 'label' }, { text: selectedSLA.autoGenerateInvoices ? 'Yes' : 'No', style: 'value' }], margin: [0, 0, 0, 5] },
                    ]
                  }
                ]
              }
            ]
          }
        ],
        styles: {
          companyName: { fontSize: 20, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          companyDetails: { fontSize: 9, color: '#64748b', margin: [0, 1, 0, 0] },
          documentType: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 5] },
          contractNumber: { fontSize: 20, bold: true, color: '#4f46e5', margin: [0, 0, 0, 5] },
          status: { fontSize: 9, bold: true, color: '#4f46e5', margin: [0, 5, 0, 0] },
          sectionHeader: { fontSize: 9, bold: true, color: '#64748b', margin: [0, 0, 0, 10] },
          customerName: { fontSize: 13, bold: true, color: '#0f172a', margin: [0, 0, 0, 5] },
          customerDetails: { fontSize: 10, color: '#64748b', margin: [0, 2, 0, 0] },
          label: { fontSize: 10, color: '#64748b' },
          value: { fontSize: 10, bold: true, color: '#0f172a' },
          description: { fontSize: 10, color: '#334155', margin: [0, 0, 0, 0] },
          tableHeader: { fontSize: 9, bold: true, color: '#475569', margin: [0, 5, 0, 5] },
          tableCell: { fontSize: 10, color: '#0f172a', margin: [0, 5, 0, 5] },
          totalLabel: { fontSize: 10, color: '#64748b' },
          totalValue: { fontSize: 10, bold: true, color: '#0f172a' },
          grandTotalLabel: { fontSize: 12, bold: true, color: '#0f172a' },
          grandTotalValue: { fontSize: 16, bold: true, color: '#4f46e5' },
          recurringLabel: { fontSize: 10, color: '#059669' },
          recurringValue: { fontSize: 12, bold: true, color: '#059669' },
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

      await pdfService.downloadPdf(docDefinition, `service-agreement-${selectedSLA.contractNumber}`);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const getStatusColor = (status: SLAStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredSLAs = slas.filter(sla => {
    const matchesSearch = sla.contractNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sla.contractName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (sla.customerName && sla.customerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || sla.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                <p className="text-gray-600">Loading service agreements...</p>
              </div>
            </div>
          </div>
        </WorkspaceLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto min-h-screen flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Contracts & Service Agreements</h1>
              <p className="text-gray-600">Manage recurring billing contracts and service agreements</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              New Agreement
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Agreements</CardTitle>
                <FileCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{slas.length}</div>
                <p className="text-xs text-muted-foreground">All agreements</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {slas.filter(c => c.status === 'active').length}
                </div>
                <p className="text-xs text-muted-foreground">Currently running</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {slas.filter(c => {
                    const endDate = new Date(c.endDate);
                    const today = new Date();
                    const sixtyDaysFromNow = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
                    return c.status === 'active' && endDate <= sixtyDaysFromNow && endDate >= today;
                  }).length}
                </div>
                <p className="text-xs text-muted-foreground">Within 60 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <span className="text-green-600">R</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{slas.reduce((sum, contract) => sum + contract.contractValue, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">All agreements combined</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search agreements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SLAStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Agreements Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Service Agreements</CardTitle>
              <CardDescription>
                All service agreements with their current status and details
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-visible flex-1">
              {filteredSLAs.length === 0 ? (
                <div className="text-center py-12">
                  <FileCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No service agreements found</h3>
                  <p className="text-gray-600 mb-4">Get started by creating your first agreement</p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Agreement
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Contract #</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Value</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Frequency</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Start Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">End Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSLAs.map((sla) => (
                        <tr key={sla.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <span className="font-medium text-indigo-600">{sla.contractNumber}</span>
                          </td>
                          <td className="py-3 px-4">{sla.contractName}</td>
                          <td className="py-3 px-4">{sla.customerName || 'Unknown'}</td>
                          <td className="py-3 px-4 font-medium">
                            {sla.currency} {sla.contractValue.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-gray-600 capitalize">{sla.billingFrequency}</td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(sla.status)}>
                              {sla.status.charAt(0).toUpperCase() + sla.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{sla.startDate}</td>
                          <td className="py-3 px-4 text-gray-600">{sla.endDate}</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="z-50">
                                <DropdownMenuItem onSelect={() => openViewDialog(sla)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openEditDialog(sla)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => openDeleteDialog(sla)}
                                  className="text-red-600"
                                  destructive
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Cancel Agreement
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
                <DialogTitle>Create Service Agreement</DialogTitle>
                <DialogDescription>
                  Set up a new recurring billing contract
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={(e) => {
                console.log('🚀 Form submit event triggered');
                handleSubmit(handleCreate)(e);
              }} className="space-y-6">
                {/* Form-level validation errors */}
                {Object.keys(errors).length > 0 && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please fix the following errors:
                      <ul className="list-disc list-inside mt-2">
                        {Object.entries(errors).map(([key, error]) => (
                          <li key={key} className="text-sm">
                            {key}: {error?.message as string}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="contractName">Contract Name *</Label>
                      <Input
                        id="contractName"
                        {...register('contractName')}
                        placeholder="Annual Support Agreement"
                        className={errors.contractName ? 'border-red-500' : ''}
                      />
                      {errors.contractName && (
                        <p className="text-red-500 text-sm mt-1">{errors.contractName.message}</p>
                      )}
                    </div>

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
                      <Label htmlFor="startDate">Start Date *</Label>
                      <Input
                        id="startDate"
                        type="date"
                        {...register('startDate')}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                      {errors.startDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.startDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="endDate">End Date *</Label>
                      <Input
                        id="endDate"
                        type="date"
                        {...register('endDate')}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                      {errors.endDate && (
                        <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="billingFrequency">Billing Frequency *</Label>
                      <select
                        id="billingFrequency"
                        {...register('billingFrequency')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="paymentTerms">Payment Terms (Days) *</Label>
                      <Input
                        id="paymentTerms"
                        type="number"
                        {...register('paymentTerms')}
                        placeholder="30"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dayOfMonth">Day of Month (for monthly)</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        {...register('dayOfMonth')}
                        placeholder="1-31"
                        min="1"
                        max="31"
                      />
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
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...register('description')}
                      placeholder="Contract description..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="autoGenerateInvoices"
                      type="checkbox"
                      {...register('autoGenerateInvoices')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="autoGenerateInvoices" className="cursor-pointer">
                      Auto-generate invoices
                    </Label>
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
                      <span className="text-lg font-bold">Total Contract Value:</span>
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
                  <Button
                    type="submit"
                    disabled={isSubmitting || formLineItems.length === 0}
                    onClick={(e) => {
                      console.log('🔘 Submit button clicked');
                      console.log('Form line items:', formLineItems);
                      console.log('Is valid:', isValid);
                    }}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Agreement'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Service Agreement</DialogTitle>
                <DialogDescription>
                  Update agreement details and line items
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleEdit)} className="space-y-6">
                {/* Same form fields as Create Dialog */}
                <div className="space-y-4">
                  <h3 className="font-medium text-lg">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-contractName">Contract Name *</Label>
                      <Input
                        id="edit-contractName"
                        {...register('contractName')}
                        className={errors.contractName ? 'border-red-500' : ''}
                      />
                      {errors.contractName && (
                        <p className="text-red-500 text-sm mt-1">{errors.contractName.message}</p>
                      )}
                    </div>

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
                      <Label htmlFor="edit-startDate">Start Date *</Label>
                      <Input
                        id="edit-startDate"
                        type="date"
                        {...register('startDate')}
                        className={errors.startDate ? 'border-red-500' : ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-endDate">End Date *</Label>
                      <Input
                        id="edit-endDate"
                        type="date"
                        {...register('endDate')}
                        className={errors.endDate ? 'border-red-500' : ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-billingFrequency">Billing Frequency *</Label>
                      <select
                        id="edit-billingFrequency"
                        {...register('billingFrequency')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annual">Annual</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="edit-paymentTerms">Payment Terms (Days) *</Label>
                      <Input
                        id="edit-paymentTerms"
                        type="number"
                        {...register('paymentTerms')}
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
                    <Label htmlFor="edit-description">Description</Label>
                    <Textarea
                      id="edit-description"
                      {...register('description')}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="edit-autoGenerateInvoices"
                      type="checkbox"
                      {...register('autoGenerateInvoices')}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="edit-autoGenerateInvoices" className="cursor-pointer">
                      Auto-generate invoices
                    </Label>
                  </div>
                </div>

                {/* Default GL Account */}
                <div className="space-y-2">
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
                    {defaultGLAccountId
                      ? 'Auto-detected from existing line items (can be changed)'
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
                      <span className="text-lg font-semibold">
                        R{calculateSubtotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Tax ({watch('taxRate') || 0}%):</span>
                      <span className="text-lg font-semibold">
                        R{calculateTax().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold">Total Contract Value:</span>
                      <span className="text-2xl font-bold text-indigo-600">
                        R{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedSLA(null);
                      reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Agreement'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Service Agreement Details</DialogTitle>
                <DialogDescription>
                  View complete agreement information
                </DialogDescription>
              </DialogHeader>

              {selectedSLA && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-500">Contract Number</Label>
                      <p className="font-medium">{selectedSLA.contractNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Contract Name</Label>
                      <p className="font-medium">{selectedSLA.contractName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Customer</Label>
                      <p className="font-medium">{selectedSLA.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <Badge className={getStatusColor(selectedSLA.status)}>
                        {selectedSLA.status.charAt(0).toUpperCase() + selectedSLA.status.slice(1)}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-gray-500">Start Date</Label>
                      <p className="font-medium">{selectedSLA.startDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">End Date</Label>
                      <p className="font-medium">{selectedSLA.endDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Billing Frequency</Label>
                      <p className="font-medium capitalize">{selectedSLA.billingFrequency}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Next Billing Date</Label>
                      <p className="font-medium">{selectedSLA.nextBillingDate}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Terms</Label>
                      <p className="font-medium">{selectedSLA.paymentTerms} days</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Auto-generate Invoices</Label>
                      <p className="font-medium">{selectedSLA.autoGenerateInvoices ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {selectedSLA.description && (
                    <div>
                      <Label className="text-gray-500">Description</Label>
                      <p className="font-medium">{selectedSLA.description}</p>
                    </div>
                  )}

                  {/* Line Items */}
                  <div>
                    <h3 className="font-medium text-lg mb-4">Line Items</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-4 text-sm font-medium text-gray-500">Description</th>
                            <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Quantity</th>
                            <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Unit Price</th>
                            <th className="text-right py-2 px-4 text-sm font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedSLA.lineItems.map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="py-2 px-4">{item.description}</td>
                              <td className="py-2 px-4 text-right">{item.quantity}</td>
                              <td className="py-2 px-4 text-right">
                                {selectedSLA.currency} {item.unitPrice.toFixed(2)}
                              </td>
                              <td className="py-2 px-4 text-right font-medium">
                                {selectedSLA.currency} {item.amount.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t-2">
                          <tr>
                            <td colSpan={3} className="py-2 px-4 text-right font-medium">Total:</td>
                            <td className="py-2 px-4 text-right font-bold text-lg">
                              {selectedSLA.currency} {selectedSLA.contractValue.toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={handleDownloadPDF}>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                    <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      setIsViewDialogOpen(false);
                      openEditDialog(selectedSLA);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Agreement
                    </Button>
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
                <AlertDialogTitle>Cancel Service Agreement?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark the agreement as cancelled. This action cannot be undone.
                </AlertDialogDescription>
                {selectedSLA && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <p className="font-medium">{selectedSLA.contractNumber}</p>
                    <p className="text-sm text-gray-600">{selectedSLA.contractName}</p>
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
                  {isSubmitting ? 'Cancelling...' : 'Cancel Agreement'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
