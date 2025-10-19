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
import {
  Plus,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  X,
  DollarSign,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { createVendorBillService } from '@/lib/accounting/vendor-bill-service';
import { createPurchaseOrderService } from '@/lib/accounting/purchase-order-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type {
  VendorBill,
  VendorBillLine,
  VendorBillStatus,
  CreateVendorBillInput,
  UpdateVendorBillInput,
} from '@/types/accounting/vendor-bill';
import type { Creditor } from '@/types/financial';
import type { PurchaseOrder } from '@/types/accounting/purchase-order';
import type { AccountRecord } from '@/types/accounting/chart-of-accounts';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';

// Zod schema for form validation
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(0.01, 'Quantity must be greater than 0'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  glAccountCode: z.string().min(1, 'GL Account is required'),
  taxRate: z.coerce.number().min(0).max(100).default(15),
});

const billSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  vendorBillNumber: z.string().min(1, 'Vendor bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().min(1, 'Due date is required'),
  receivedDate: z.string().optional(),
  poId: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type BillFormData = z.infer<typeof billSchema>;

export default function VendorBillsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [bills, setBills] = useState<VendorBill[]>([]);
  const [vendors, setVendors] = useState<Creditor[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [glAccounts, setGLAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditorService] = useState(() => new CreditorService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorBillStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [unpaidFilter, setUnpaidFilter] = useState(false);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLineItemDialogOpen, setIsLineItemDialogOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<VendorBill | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);

  // Line items state for forms
  const [formLineItems, setFormLineItems] = useState<Array<Partial<VendorBillLine>>>([]);

  // Line item form state for dialog
  const [lineItemForm, setLineItemForm] = useState<Partial<VendorBillLine>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    glAccountCode: '',
    taxRate: 15,
  });

  // React Hook Form for Bill
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<BillFormData>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      vendorId: '',
      vendorBillNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      receivedDate: '',
      poId: '',
      notes: '',
      internalNotes: '',
      lineItems: [],
    },
  });

  const watchedVendorId = watch('vendorId');
  const watchedPoId = watch('poId');

  // Sync formLineItems state with React Hook Form
  useEffect(() => {
    setValue('lineItems', formLineItems as any, { shouldValidate: true });
  }, [formLineItems, setValue]);

  // Filter POs when vendor changes
  const filteredPOs = purchaseOrders.filter(
    po => po.vendorId === watchedVendorId && po.status === 'approved'
  );

  // Pre-populate line items when PO is selected
  useEffect(() => {
    if (watchedPoId && (isCreateDialogOpen || isEditDialogOpen)) {
      const selectedPO = purchaseOrders.find(po => po.id === watchedPoId);
      if (selectedPO && formLineItems.length === 0) {
        const poLineItems = selectedPO.lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          glAccountCode: item.glAccountCode || '',
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
          poId: selectedPO.id,
          poNumber: selectedPO.poNumber,
          poLineId: `line-${index + 1}`,
        }));
        setFormLineItems(poLineItems);
        toast.success('Line items populated from PO');
      }
    }
  }, [watchedPoId, isCreateDialogOpen, isEditDialogOpen]);

  useEffect(() => {
    if (canAccess && companyId && user) {
      loadData();
    }
  }, [canAccess, companyId, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadBills(), loadVendors(), loadPurchaseOrders(), loadGLAccounts()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadBills = async () => {
    if (!user) return;
    const billService = createVendorBillService(companyId, user.uid);
    const data = await billService.getVendorBills();

    // Populate vendor names
    const billsWithVendorNames = data.map(bill => {
      const vendor = vendors.find(v => v.id === bill.vendorId);
      return {
        ...bill,
        vendorName: vendor?.name || bill.vendorName || 'Unknown Vendor',
      };
    });

    setBills(billsWithVendorNames);
  };

  const loadVendors = async () => {
    const data = await creditorService.getCreditors(companyId);
    setVendors(data);
  };

  const loadPurchaseOrders = async () => {
    if (!user) return;
    const poService = createPurchaseOrderService(companyId, user.uid);
    const data = await poService.getPurchaseOrders();
    setPurchaseOrders(data);
  };

  const loadGLAccounts = async () => {
    // Query company-scoped chart of accounts
    const accountsRef = collection(db, `companies/${companyId}/chartOfAccounts`);
    const accountsQuery = query(accountsRef, orderBy('code'));
    const snapshot = await getDocs(accountsQuery);

    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AccountRecord[];

    // Filter to expense accounts (5000-5999 range)
    setGLAccounts(accounts.filter(a => a.type === 'expense'));
  };

  // Line Item Dialog Functions
  const openLineItemDialog = (index?: number) => {
    if (index !== undefined) {
      // Edit existing line item
      setEditingLineItemIndex(index);
      setLineItemForm(formLineItems[index]);
    } else {
      // Add new line item
      setEditingLineItemIndex(null);
      setLineItemForm({
        description: '',
        quantity: 1,
        unitPrice: 0,
        glAccountCode: '',
        taxRate: 15,
      });
    }
    setIsLineItemDialogOpen(true);
  };

  const saveLineItem = () => {
    // Validate
    if (!lineItemForm.description ||
        (lineItemForm.quantity || 0) <= 0 ||
        (lineItemForm.unitPrice || 0) < 0 ||
        !lineItemForm.glAccountCode) {
      toast.error('Please fill in all required fields');
      return;
    }

    const subtotal = (lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0);
    const taxAmount = subtotal * ((lineItemForm.taxRate || 0) / 100);

    // Find GL account name
    const glAccount = glAccounts.find(a => a.code === lineItemForm.glAccountCode);

    const itemWithCalculations: Partial<VendorBillLine> = {
      ...lineItemForm,
      amount: subtotal,
      taxAmount: taxAmount,
      glAccountName: glAccount?.name,
    };

    if (editingLineItemIndex !== null) {
      // Update existing item
      const updated = [...formLineItems];
      updated[editingLineItemIndex] = itemWithCalculations;
      setFormLineItems(updated);
      toast.success('Line item updated');
    } else {
      // Add new item
      setFormLineItems([...formLineItems, itemWithCalculations]);
      toast.success('Line item added');
    }

    // Close dialog and reset
    setIsLineItemDialogOpen(false);
    setEditingLineItemIndex(null);
    setLineItemForm({
      description: '',
      quantity: 1,
      unitPrice: 0,
      glAccountCode: '',
      taxRate: 15,
    });
  };

  const updateLineItemForm = (field: keyof VendorBillLine, value: any) => {
    setLineItemForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const removeLineItem = (index: number) => {
    if (formLineItems.length > 1) {
      setFormLineItems(formLineItems.filter((_, i) => i !== index));
      toast.success('Line item removed');
    } else {
      toast.error('At least one line item is required');
    }
  };

  const calculateSubtotal = () => {
    return formLineItems.reduce((sum, item) => {
      const quantity = item.quantity || 0;
      const unitPrice = item.unitPrice || 0;
      return sum + (quantity * unitPrice);
    }, 0);
  };

  const calculateTax = () => {
    return formLineItems.reduce((sum, item) => {
      return sum + (item.taxAmount || 0);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCreate = async (data: BillFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const billService = createVendorBillService(companyId, user.uid);

      const input: CreateVendorBillInput = {
        vendorBillNumber: data.vendorBillNumber,
        vendorId: data.vendorId,
        billDate: new Date(data.billDate),
        dueDate: new Date(data.dueDate),
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        lineItems: formLineItems.map(item => ({
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          amount: item.amount!,
          glAccountCode: item.glAccountCode!,
          glAccountName: item.glAccountName,
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
          poId: item.poId,
          poNumber: item.poNumber,
          poLineId: item.poLineId,
        })),
        poId: data.poId,
        notes: data.notes,
        internalNotes: data.internalNotes,
        currency: 'ZAR',
      };

      await billService.createVendorBill(input);
      toast.success('Vendor bill created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setFormLineItems([]);
      await loadBills();
    } catch (error: any) {
      console.error('Error creating vendor bill:', error);
      toast.error(error.message || 'Failed to create vendor bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: BillFormData) => {
    if (!user || !selectedBill) return;

    setIsSubmitting(true);
    try {
      const billService = createVendorBillService(companyId, user.uid);

      const updates: UpdateVendorBillInput = {
        vendorBillNumber: data.vendorBillNumber,
        vendorId: data.vendorId,
        billDate: new Date(data.billDate),
        dueDate: new Date(data.dueDate),
        receivedDate: data.receivedDate ? new Date(data.receivedDate) : undefined,
        lineItems: formLineItems.map(item => ({
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          amount: item.amount!,
          glAccountCode: item.glAccountCode!,
          glAccountName: item.glAccountName,
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
          poId: item.poId,
          poNumber: item.poNumber,
          poLineId: item.poLineId,
        })),
        poId: data.poId,
        notes: data.notes,
        internalNotes: data.internalNotes,
      };

      await billService.updateVendorBill(selectedBill.id, updates);
      toast.success('Vendor bill updated successfully');
      setIsEditDialogOpen(false);
      await loadBills();
    } catch (error: any) {
      console.error('Error updating vendor bill:', error);
      toast.error(error.message || 'Failed to update vendor bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedBill) return;

    setIsSubmitting(true);
    try {
      const billService = createVendorBillService(companyId, user.uid);
      await billService.deleteBill(selectedBill.id);
      toast.success('Vendor bill deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedBill(null);
      await loadBills();
    } catch (error: any) {
      console.error('Error deleting vendor bill:', error);
      toast.error(error.message || 'Failed to delete vendor bill');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (bill: VendorBill) => {
    if (!user) return;

    try {
      const billService = createVendorBillService(companyId, user.uid);
      await billService.submitForApproval(bill.id);
      toast.success('Vendor bill submitted for approval');
      await loadBills();
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      toast.error(error.message || 'Failed to submit for approval');
    }
  };

  const handleApprove = async (bill: VendorBill) => {
    if (!user) return;

    try {
      const billService = createVendorBillService(companyId, user.uid);
      await billService.approveBill(bill.id);
      toast.success('Vendor bill approved');
      await loadBills();
    } catch (error: any) {
      console.error('Error approving vendor bill:', error);
      toast.error(error.message || 'Failed to approve vendor bill');
    }
  };

  const handleReject = async (bill: VendorBill) => {
    if (!user) return;

    const reason = prompt('Please provide a rejection reason:');
    if (!reason) return;

    try {
      const billService = createVendorBillService(companyId, user.uid);
      await billService.rejectBill(bill.id, reason);
      toast.success('Vendor bill rejected');
      await loadBills();
    } catch (error: any) {
      console.error('Error rejecting vendor bill:', error);
      toast.error(error.message || 'Failed to reject vendor bill');
    }
  };

  const handleCancel = async (bill: VendorBill) => {
    if (!user) return;

    try {
      const billService = createVendorBillService(companyId, user.uid);
      await billService.updateVendorBill(bill.id, { status: 'cancelled' });
      toast.success('Vendor bill cancelled');
      await loadBills();
    } catch (error: any) {
      console.error('Error cancelling vendor bill:', error);
      toast.error(error.message || 'Failed to cancel vendor bill');
    }
  };

  const openCreateDialog = () => {
    reset({
      vendorId: '',
      vendorBillNumber: '',
      billDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      receivedDate: '',
      poId: '',
      notes: '',
      internalNotes: '',
      lineItems: [] as any
    });
    setFormLineItems([]);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (bill: VendorBill) => {
    setSelectedBill(bill);
    setValue('vendorId', bill.vendorId);
    setValue('vendorBillNumber', bill.vendorBillNumber);
    setValue('billDate', bill.billDate.toISOString().split('T')[0]);
    setValue('dueDate', bill.dueDate.toISOString().split('T')[0]);
    setValue('receivedDate', bill.receivedDate ? bill.receivedDate.toISOString().split('T')[0] : '');
    setValue('poId', bill.poId || '');
    setValue('notes', bill.notes || '');
    setValue('internalNotes', bill.internalNotes || '');

    setFormLineItems(bill.lineItems);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (bill: VendorBill) => {
    setSelectedBill(bill);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (bill: VendorBill) => {
    setSelectedBill(bill);
    setIsDeleteDialogOpen(true);
  };

  // Check if bill is overdue
  const isOverdue = (bill: VendorBill) => {
    const today = new Date();
    return bill.dueDate < today &&
           bill.status !== 'paid' &&
           bill.status !== 'cancelled' &&
           bill.amountDue > 0;
  };

  // Calculate days overdue
  const getDaysOverdue = (bill: VendorBill) => {
    if (!isOverdue(bill)) return 0;
    const today = new Date();
    const diffTime = today.getTime() - bill.dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredBills = bills.filter(bill => {
    const matchesSearch = !searchTerm ||
      bill.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendorBillNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bill.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || bill.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || bill.vendorId === vendorFilter;
    const matchesOverdue = !overdueFilter || isOverdue(bill);
    const matchesUnpaid = !unpaidFilter || (bill.status !== 'paid' && bill.status !== 'cancelled' && bill.amountDue > 0);

    return matchesSearch && matchesStatus && matchesVendor && matchesOverdue && matchesUnpaid;
  });

  // Calculate summary statistics
  const stats = {
    total: bills.length,
    pendingApproval: bills.filter(b => b.status === 'pending_approval').length,
    approved: bills.filter(b => b.status === 'approved').length,
    totalDue: bills.reduce((sum, b) => sum + b.amountDue, 0),
    overdue: bills.filter(b => isOverdue(b)).length,
  };

  const getStatusColor = (status: VendorBillStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'posted': return 'bg-blue-100 text-blue-800';
      case 'partially_paid': return 'bg-indigo-100 text-indigo-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user can approve (admin or financial_admin)
  const canApprove = user?.role === 'admin' || user?.role === 'financial_admin';
  const canDelete = user?.role === 'admin';

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
              <p className="text-gray-600">Loading vendor bills...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Vendor Bills</h1>
              <p className="text-gray-500 mt-1">Manage vendor invoices and bill payments</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bill
            </Button>
          </div>

          {error && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Bills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Pending Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Due</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {stats.totalDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
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
                    placeholder="Search by bill number, vendor bill number, or vendor name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as VendorBillStatus | 'all')}
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="posted">Posted</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Select
                    value={vendorFilter}
                    onChange={(e) => setVendorFilter(e.target.value)}
                  >
                    <option value="all">All Vendors</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                    ))}
                  </Select>
                  <Button
                    variant={overdueFilter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setOverdueFilter(!overdueFilter)}
                  >
                    Overdue Only
                  </Button>
                  <Button
                    variant={unpaidFilter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setUnpaidFilter(!unpaidFilter)}
                  >
                    Unpaid Only
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bills Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardContent className="p-0 overflow-visible flex-1">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Bill #</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount Due</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBills.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                          <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No vendor bills found</p>
                          <p className="text-sm">Create your first vendor bill to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBills.map((bill) => (
                        <tr key={bill.id} className={`hover:bg-gray-50 ${isOverdue(bill) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {bill.billNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bill.vendorBillNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {bill.vendorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(bill.billDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              {new Date(bill.dueDate).toLocaleDateString()}
                              {isOverdue(bill) && (
                                <Badge className="bg-red-100 text-red-800 text-xs">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  {getDaysOverdue(bill)}d overdue
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R {bill.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            R {bill.amountDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(bill.status)}>
                              {bill.status.replace('_', ' ')}
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
                                <DropdownMenuItem onSelect={() => openViewDialog(bill)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {(bill.status === 'draft' || bill.status === 'pending_approval') && (
                                  <>
                                    <DropdownMenuItem onSelect={() => openEditDialog(bill)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    {bill.status === 'draft' && (
                                      <DropdownMenuItem onSelect={() => handleSubmitForApproval(bill)}>
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit for Approval
                                      </DropdownMenuItem>
                                    )}
                                    {canDelete && bill.status === 'draft' && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => openDeleteDialog(bill)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                                {bill.status === 'pending_approval' && canApprove && (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleApprove(bill)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleReject(bill)} className="text-red-600">
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(bill.status === 'draft' || bill.status === 'pending_approval' || bill.status === 'approved') && canApprove && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => handleCancel(bill)} className="text-red-600">
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
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
                <DialogTitle>Create Vendor Bill</DialogTitle>
                <DialogDescription>Create a new vendor bill/invoice for payment processing</DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(handleCreate)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select {...register('vendorId')}>
                      <option value="">Select vendor...</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </Select>
                    {errors.vendorId && <p className="text-sm text-red-600">{errors.vendorId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorBillNumber">Vendor Bill Number *</Label>
                    <Input {...register('vendorBillNumber')} placeholder="Vendor's invoice number" />
                    {errors.vendorBillNumber && <p className="text-sm text-red-600">{errors.vendorBillNumber.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date *</Label>
                    <Input type="date" {...register('billDate')} />
                    {errors.billDate && <p className="text-sm text-red-600">{errors.billDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input type="date" {...register('dueDate')} />
                    {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receivedDate">Received Date</Label>
                    <Input type="date" {...register('receivedDate')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poId">Link to Purchase Order (Optional)</Label>
                    <Select {...register('poId')} disabled={!watchedVendorId}>
                      <option value="">No PO link...</option>
                      {filteredPOs.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} - R{po.totalAmount.toFixed(2)}</option>
                      ))}
                    </Select>
                    {!watchedVendorId && <p className="text-xs text-gray-500">Select a vendor first to see their POs</p>}
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
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">GL Account</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-20">Qty</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Unit Price</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Amount</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formLineItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">
                                {item.description}
                                {item.poNumber && (
                                  <span className="ml-2 text-xs text-blue-600">({item.poNumber})</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {item.glAccountCode} {item.glAccountName && `- ${item.glAccountName}`}
                              </td>
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
                      <span className="text-sm font-medium text-gray-600">Tax:</span>
                      <span className="text-lg font-semibold">R{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  {errors.lineItems && <p className="text-sm text-red-600">{errors.lineItems.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register('notes')} rows={3} placeholder="Notes visible to vendor..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea {...register('internalNotes')} rows={3} placeholder="Internal notes (not visible to vendor)..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Creating...' : 'Create Vendor Bill'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog - Similar structure to Create */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Vendor Bill</DialogTitle>
                <DialogDescription>Update vendor bill details</DialogDescription>
              </DialogHeader>

              {selectedBill && selectedBill.status === 'posted' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This bill has been posted to the General Ledger and should not be modified. Changes may affect financial reports.
                  </AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(handleEdit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select {...register('vendorId')}>
                      <option value="">Select vendor...</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </Select>
                    {errors.vendorId && <p className="text-sm text-red-600">{errors.vendorId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vendorBillNumber">Vendor Bill Number *</Label>
                    <Input {...register('vendorBillNumber')} placeholder="Vendor's invoice number" />
                    {errors.vendorBillNumber && <p className="text-sm text-red-600">{errors.vendorBillNumber.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="billDate">Bill Date *</Label>
                    <Input type="date" {...register('billDate')} />
                    {errors.billDate && <p className="text-sm text-red-600">{errors.billDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input type="date" {...register('dueDate')} />
                    {errors.dueDate && <p className="text-sm text-red-600">{errors.dueDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receivedDate">Received Date</Label>
                    <Input type="date" {...register('receivedDate')} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poId">Link to Purchase Order (Optional)</Label>
                    <Select {...register('poId')} disabled={!watchedVendorId}>
                      <option value="">No PO link...</option>
                      {filteredPOs.map(po => (
                        <option key={po.id} value={po.id}>{po.poNumber} - R{po.totalAmount.toFixed(2)}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                {/* Line Items - Same as Create */}
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
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">GL Account</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-20">Qty</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Unit Price</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-28">Amount</th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-700 w-24">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formLineItems.map((item, index) => (
                            <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                              <td className="py-3 px-4 text-sm">
                                {item.description}
                                {item.poNumber && (
                                  <span className="ml-2 text-xs text-blue-600">({item.poNumber})</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-600">
                                {item.glAccountCode} {item.glAccountName && `- ${item.glAccountName}`}
                              </td>
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
                      <span className="text-sm font-medium text-gray-600">Tax:</span>
                      <span className="text-lg font-semibold">R{calculateTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t-2 border-indigo-200">
                      <span className="text-lg font-bold">Total Amount:</span>
                      <span className="text-2xl font-bold text-indigo-600">R{calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register('notes')} rows={3} placeholder="Notes visible to vendor..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea {...register('internalNotes')} rows={3} placeholder="Internal notes (not visible to vendor)..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Updating...' : 'Update Vendor Bill'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Vendor Bill Details</DialogTitle>
                <DialogDescription>
                  {selectedBill?.billNumber} - {selectedBill?.vendorName}
                </DialogDescription>
              </DialogHeader>

              {selectedBill && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Vendor</Label>
                      <p className="font-medium">{selectedBill.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <p>
                        <Badge className={getStatusColor(selectedBill.status)}>
                          {selectedBill.status.replace('_', ' ')}
                        </Badge>
                        {isOverdue(selectedBill) && (
                          <Badge className="bg-red-100 text-red-800 ml-2">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {getDaysOverdue(selectedBill)} days overdue
                          </Badge>
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Vendor Bill Number</Label>
                      <p className="font-medium">{selectedBill.vendorBillNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Bill Number</Label>
                      <p className="font-medium">{selectedBill.billNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Bill Date</Label>
                      <p className="font-medium">{new Date(selectedBill.billDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Due Date</Label>
                      <p className="font-medium">{new Date(selectedBill.dueDate).toLocaleDateString()}</p>
                    </div>
                    {selectedBill.receivedDate && (
                      <div>
                        <Label className="text-gray-500">Received Date</Label>
                        <p className="font-medium">{new Date(selectedBill.receivedDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedBill.poNumber && (
                      <div>
                        <Label className="text-gray-500">Linked Purchase Order</Label>
                        <p className="font-medium text-blue-600">{selectedBill.poNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Status */}
                  {selectedBill.amountPaid > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Payment Status</h3>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <Label className="text-gray-500">Total Amount</Label>
                          <p className="font-semibold">R {selectedBill.totalAmount.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Amount Paid</Label>
                          <p className="font-semibold text-green-600">R {selectedBill.amountPaid.toFixed(2)}</p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Amount Due</Label>
                          <p className="font-semibold text-red-600">R {selectedBill.amountDue.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval Status */}
                  {selectedBill.status !== 'draft' && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Approval History</h3>
                      <div className="space-y-2 text-sm">
                        {selectedBill.submittedForApprovalAt && (
                          <p className="text-gray-600">
                            Submitted: {new Date(selectedBill.submittedForApprovalAt).toLocaleString()}
                          </p>
                        )}
                        {selectedBill.approvedAt && (
                          <p className="text-green-600">
                            Approved: {new Date(selectedBill.approvedAt).toLocaleString()}
                          </p>
                        )}
                        {selectedBill.rejectedAt && (
                          <p className="text-red-600">
                            Rejected: {new Date(selectedBill.rejectedAt).toLocaleString()}
                            {selectedBill.rejectionReason && ` - ${selectedBill.rejectionReason}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* GL Posting Status */}
                  {selectedBill.glPosted && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">General Ledger Posting</h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-blue-600">
                          Posted: {selectedBill.glPostingDate && new Date(selectedBill.glPostingDate).toLocaleString()}
                        </p>
                        {selectedBill.journalEntryId && (
                          <p className="text-gray-600">
                            Journal Entry: {selectedBill.journalEntryId}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Line Items */}
                  <div>
                    <Label className="text-gray-500 mb-2 block">Line Items</Label>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">GL Account</th>
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Quantity</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedBill.lineItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm">
                                {item.description}
                                {item.poNumber && (
                                  <span className="ml-2 text-xs text-blue-600">({item.poNumber})</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {item.glAccountCode} {item.glAccountName && `- ${item.glAccountName}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right">R {item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right">R {(item.taxAmount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">R {item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">R {selectedBill.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-right text-sm font-medium">Tax:</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">R {selectedBill.taxAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={5} className="px-4 py-3 text-right text-sm font-bold">Total:</td>
                            <td className="px-4 py-3 text-sm text-right font-bold">R {selectedBill.totalAmount.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {selectedBill.notes && (
                    <div>
                      <Label className="text-gray-500">Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedBill.notes}</p>
                    </div>
                  )}

                  {selectedBill.internalNotes && (
                    <div>
                      <Label className="text-gray-500">Internal Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedBill.internalNotes}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
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

                <div>
                  <Label htmlFor="lineitem-glaccount">GL Account (Expense) *</Label>
                  <select
                    id="lineitem-glaccount"
                    value={lineItemForm.glAccountCode || ''}
                    onChange={(e) => updateLineItemForm('glAccountCode', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md ${!lineItemForm.glAccountCode ? 'border-red-300' : 'border-gray-300'}`}
                  >
                    <option value="">Select expense account...</option>
                    {glAccounts.map(account => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
                  {!lineItemForm.glAccountCode && (
                    <p className="text-xs text-red-500 mt-1">GL Account is required</p>
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
                  </div>
                </div>

                <div>
                  <Label htmlFor="lineitem-taxrate">Tax Rate (%)</Label>
                  <Input
                    id="lineitem-taxrate"
                    type="number"
                    value={lineItemForm.taxRate || 15}
                    onChange={(e) => updateLineItemForm('taxRate', parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </div>

                {/* Amount Preview */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-indigo-900">Subtotal:</span>
                    <span className="text-lg font-bold text-indigo-600">
                      R{((lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-indigo-900">Tax ({lineItemForm.taxRate || 0}%):</span>
                    <span className="text-lg font-bold text-indigo-600">
                      R{(((lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0)) * ((lineItemForm.taxRate || 0) / 100)).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                    <span className="text-sm font-medium text-indigo-900">Total:</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      R{(((lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0)) * (1 + ((lineItemForm.taxRate || 0) / 100))).toFixed(2)}
                    </span>
                  </div>
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
                      glAccountCode: '',
                      taxRate: 15,
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

          {/* Delete Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Vendor Bill?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete vendor bill {selectedBill?.billNumber}?
                  This action cannot be undone. Only draft bills can be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                  {isSubmitting ? 'Deleting...' : 'Delete Vendor Bill'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
