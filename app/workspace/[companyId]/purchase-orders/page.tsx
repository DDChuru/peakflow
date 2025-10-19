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
  Package,
  DollarSign
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { createPurchaseOrderService } from '@/lib/accounting/purchase-order-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type {
  PurchaseOrder,
  PurchaseOrderLine,
  PurchaseOrderStatus,
  CreatePurchaseOrderInput,
  UpdatePurchaseOrderInput,
} from '@/types/accounting/purchase-order';
import type { Creditor } from '@/types/financial';
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
  glAccountCode: z.string().optional(),
  taxRate: z.coerce.number().min(0).max(100).default(15),
});

const poSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  orderDate: z.string().min(1, 'Order date is required'),
  expectedDeliveryDate: z.string().optional(),
  deliveryAddress: z.string().optional(),
  deliveryContact: z.string().optional(),
  deliveryPhone: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  termsAndConditions: z.string().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
});

type POFormData = z.infer<typeof poSchema>;

export default function PurchaseOrdersPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Creditor[]>([]);
  const [glAccounts, setGLAccounts] = useState<AccountRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditorService] = useState(() => new CreditorService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLineItemDialogOpen, setIsLineItemDialogOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLineItemIndex, setEditingLineItemIndex] = useState<number | null>(null);

  // Line items state for forms
  const [formLineItems, setFormLineItems] = useState<Array<Partial<PurchaseOrderLine>>>([]);

  // Line item form state for dialog
  const [lineItemForm, setLineItemForm] = useState<Partial<PurchaseOrderLine>>({
    description: '',
    quantity: 1,
    unitPrice: 0,
    glAccountCode: '',
    taxRate: 15,
  });

  // React Hook Form for PO
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<POFormData>({
    resolver: zodResolver(poSchema),
    defaultValues: {
      vendorId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      deliveryAddress: '',
      deliveryContact: '',
      deliveryPhone: '',
      notes: '',
      internalNotes: '',
      termsAndConditions: '',
      lineItems: [],
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
    try {
      setLoading(true);
      setError(null);
      await Promise.all([loadPurchaseOrders(), loadVendors(), loadGLAccounts()]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseOrders = async () => {
    if (!user) return;
    const poService = createPurchaseOrderService(companyId, user.uid);
    const data = await poService.getPurchaseOrders();
    setPurchaseOrders(data);
  };

  const loadVendors = async () => {
    const data = await creditorService.getCreditors(companyId);
    setVendors(data);
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
        (lineItemForm.unitPrice || 0) < 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const subtotal = (lineItemForm.quantity || 0) * (lineItemForm.unitPrice || 0);
    const taxAmount = subtotal * ((lineItemForm.taxRate || 0) / 100);

    const itemWithCalculations: Partial<PurchaseOrderLine> = {
      ...lineItemForm,
      amount: subtotal,
      taxAmount: taxAmount,
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

  const updateLineItemForm = (field: keyof PurchaseOrderLine, value: any) => {
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

  const handleCreate = async (data: POFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      const poService = createPurchaseOrderService(companyId, user.uid);

      const input: CreatePurchaseOrderInput = {
        vendorId: data.vendorId,
        orderDate: new Date(data.orderDate),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        lineItems: formLineItems.map(item => ({
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          amount: item.amount!,
          glAccountCode: item.glAccountCode,
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
        })),
        deliveryAddress: data.deliveryAddress,
        deliveryContact: data.deliveryContact,
        deliveryPhone: data.deliveryPhone,
        notes: data.notes,
        internalNotes: data.internalNotes,
        termsAndConditions: data.termsAndConditions,
        currency: 'ZAR',
      };

      await poService.createPurchaseOrder(input);
      toast.success('Purchase order created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setFormLineItems([]);
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.message || 'Failed to create purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: POFormData) => {
    if (!user || !selectedPO) return;

    setIsSubmitting(true);
    try {
      const poService = createPurchaseOrderService(companyId, user.uid);

      const updates: UpdatePurchaseOrderInput = {
        vendorId: data.vendorId,
        orderDate: new Date(data.orderDate),
        expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
        lineItems: formLineItems.map(item => ({
          description: item.description!,
          quantity: item.quantity!,
          unitPrice: item.unitPrice!,
          amount: item.amount!,
          glAccountCode: item.glAccountCode,
          taxAmount: item.taxAmount,
          taxRate: item.taxRate,
        })),
        deliveryAddress: data.deliveryAddress,
        deliveryContact: data.deliveryContact,
        deliveryPhone: data.deliveryPhone,
        notes: data.notes,
        internalNotes: data.internalNotes,
        termsAndConditions: data.termsAndConditions,
      };

      await poService.updatePurchaseOrder(selectedPO.id, updates);
      toast.success('Purchase order updated successfully');
      setIsEditDialogOpen(false);
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error updating purchase order:', error);
      toast.error(error.message || 'Failed to update purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedPO) return;

    setIsSubmitting(true);
    try {
      const poService = createPurchaseOrderService(companyId, user.uid);
      await poService.deletePurchaseOrder(selectedPO.id);
      toast.success('Purchase order deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPO(null);
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error deleting purchase order:', error);
      toast.error(error.message || 'Failed to delete purchase order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (po: PurchaseOrder) => {
    if (!user) return;

    try {
      const poService = createPurchaseOrderService(companyId, user.uid);
      await poService.submitForApproval(po.id);
      toast.success('Purchase order submitted for approval');
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      toast.error(error.message || 'Failed to submit for approval');
    }
  };

  const handleApprove = async (po: PurchaseOrder) => {
    if (!user) return;

    try {
      const poService = createPurchaseOrderService(companyId, user.uid);
      await poService.approvePurchaseOrder(po.id);
      toast.success('Purchase order approved');
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error approving purchase order:', error);
      toast.error(error.message || 'Failed to approve purchase order');
    }
  };

  const handleMarkAsSent = async (po: PurchaseOrder) => {
    if (!user) return;

    try {
      const poService = createPurchaseOrderService(companyId, user.uid);
      await poService.updatePurchaseOrder(po.id, { status: 'sent' });
      toast.success('Purchase order marked as sent');
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error marking as sent:', error);
      toast.error(error.message || 'Failed to mark as sent');
    }
  };

  const handleCancel = async (po: PurchaseOrder) => {
    if (!user) return;

    try {
      const poService = createPurchaseOrderService(companyId, user.uid);
      await poService.updatePurchaseOrder(po.id, { status: 'cancelled' });
      toast.success('Purchase order cancelled');
      await loadPurchaseOrders();
    } catch (error: any) {
      console.error('Error cancelling purchase order:', error);
      toast.error(error.message || 'Failed to cancel purchase order');
    }
  };

  const openCreateDialog = () => {
    reset({
      vendorId: '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      deliveryAddress: '',
      deliveryContact: '',
      deliveryPhone: '',
      notes: '',
      internalNotes: '',
      termsAndConditions: '',
      lineItems: [] as any
    });
    setFormLineItems([]);
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setValue('vendorId', po.vendorId);
    setValue('orderDate', po.orderDate.toISOString().split('T')[0]);
    setValue('expectedDeliveryDate', po.expectedDeliveryDate ? po.expectedDeliveryDate.toISOString().split('T')[0] : '');
    setValue('deliveryAddress', po.deliveryAddress || '');
    setValue('deliveryContact', po.deliveryContact || '');
    setValue('deliveryPhone', po.deliveryPhone || '');
    setValue('notes', po.notes || '');
    setValue('internalNotes', po.internalNotes || '');
    setValue('termsAndConditions', po.termsAndConditions || '');

    setFormLineItems(po.lineItems);
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (po: PurchaseOrder) => {
    setSelectedPO(po);
    setIsDeleteDialogOpen(true);
  };

  const filteredPOs = purchaseOrders.filter(po => {
    const matchesSearch = !searchTerm ||
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.vendorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesVendor = vendorFilter === 'all' || po.vendorId === vendorFilter;

    return matchesSearch && matchesStatus && matchesVendor;
  });

  // Calculate summary statistics
  const stats = {
    total: purchaseOrders.length,
    pendingApproval: purchaseOrders.filter(po => po.status === 'pending_approval').length,
    approved: purchaseOrders.filter(po => po.status === 'approved').length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
  };

  const getStatusColor = (status: PurchaseOrderStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'received': return 'bg-indigo-100 text-indigo-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
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
              <p className="text-gray-600">Loading purchase orders...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
              <p className="text-gray-500 mt-1">Manage vendor purchase orders and approvals</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create PO
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
                <CardTitle className="text-sm font-medium text-gray-500">Total POs</CardTitle>
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
                <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {stats.totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by PO number or vendor name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex gap-2">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PurchaseOrderStatus | 'all')}
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="sent">Sent</option>
                    <option value="received">Received</option>
                    <option value="closed">Closed</option>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PO Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardContent className="p-0 overflow-visible flex-1">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPOs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No purchase orders found</p>
                          <p className="text-sm">Create your first purchase order to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPOs.map((po) => (
                        <tr key={po.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {po.poNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {po.vendorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(po.orderDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R {po.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(po.status)}>
                              {po.status.replace('_', ' ')}
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
                                <DropdownMenuItem onSelect={() => openViewDialog(po)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {po.status === 'draft' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => openEditDialog(po)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleSubmitForApproval(po)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Submit for Approval
                                    </DropdownMenuItem>
                                    {canDelete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => openDeleteDialog(po)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                                {po.status === 'pending_approval' && canApprove && (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleApprove(po)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {po.status === 'approved' && (
                                  <DropdownMenuItem onSelect={() => handleMarkAsSent(po)}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Mark as Sent
                                  </DropdownMenuItem>
                                )}
                                {(po.status === 'draft' || po.status === 'pending_approval' || po.status === 'approved') && canApprove && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={() => handleCancel(po)} className="text-red-600">
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
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Create a new purchase order for vendor goods/services</DialogDescription>
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
                    <Label htmlFor="orderDate">Order Date *</Label>
                    <Input type="date" {...register('orderDate')} />
                    {errors.orderDate && <p className="text-sm text-red-600">{errors.orderDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                    <Input type="date" {...register('expectedDeliveryDate')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea {...register('deliveryAddress')} rows={2} placeholder="Delivery address..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryContact">Delivery Contact</Label>
                    <Input {...register('deliveryContact')} placeholder="Contact person name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryPhone">Delivery Phone</Label>
                    <Input {...register('deliveryPhone')} placeholder="Contact phone number" />
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
                  <Textarea {...register('notes')} rows={3} placeholder="Notes for vendor..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea {...register('internalNotes')} rows={3} placeholder="Internal notes (not shown to vendor)..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea {...register('termsAndConditions')} rows={3} placeholder="Terms and conditions..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog - Similar structure to Create */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Purchase Order</DialogTitle>
                <DialogDescription>Update purchase order details</DialogDescription>
              </DialogHeader>

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
                    <Label htmlFor="orderDate">Order Date *</Label>
                    <Input type="date" {...register('orderDate')} />
                    {errors.orderDate && <p className="text-sm text-red-600">{errors.orderDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                    <Input type="date" {...register('expectedDeliveryDate')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress">Delivery Address</Label>
                  <Textarea {...register('deliveryAddress')} rows={2} placeholder="Delivery address..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deliveryContact">Delivery Contact</Label>
                    <Input {...register('deliveryContact')} placeholder="Contact person name" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="deliveryPhone">Delivery Phone</Label>
                    <Input {...register('deliveryPhone')} placeholder="Contact phone number" />
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
                  <Textarea {...register('notes')} rows={3} placeholder="Notes for vendor..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea {...register('internalNotes')} rows={3} placeholder="Internal notes (not shown to vendor)..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="termsAndConditions">Terms & Conditions</Label>
                  <Textarea {...register('termsAndConditions')} rows={3} placeholder="Terms and conditions..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? 'Updating...' : 'Update Purchase Order'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Purchase Order Details</DialogTitle>
                <DialogDescription>
                  {selectedPO?.poNumber} - {selectedPO?.vendorName}
                </DialogDescription>
              </DialogHeader>

              {selectedPO && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Vendor</Label>
                      <p className="font-medium">{selectedPO.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <p>
                        <Badge className={getStatusColor(selectedPO.status)}>
                          {selectedPO.status.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Order Date</Label>
                      <p className="font-medium">{new Date(selectedPO.orderDate).toLocaleDateString()}</p>
                    </div>
                    {selectedPO.expectedDeliveryDate && (
                      <div>
                        <Label className="text-gray-500">Expected Delivery</Label>
                        <p className="font-medium">{new Date(selectedPO.expectedDeliveryDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedPO.deliveryAddress && (
                      <div className="col-span-2">
                        <Label className="text-gray-500">Delivery Address</Label>
                        <p className="font-medium">{selectedPO.deliveryAddress}</p>
                      </div>
                    )}
                    {selectedPO.deliveryContact && (
                      <div>
                        <Label className="text-gray-500">Delivery Contact</Label>
                        <p className="font-medium">{selectedPO.deliveryContact}</p>
                      </div>
                    )}
                    {selectedPO.deliveryPhone && (
                      <div>
                        <Label className="text-gray-500">Delivery Phone</Label>
                        <p className="font-medium">{selectedPO.deliveryPhone}</p>
                      </div>
                    )}
                  </div>

                  {/* Approval Status */}
                  {selectedPO.status !== 'draft' && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Approval History</h3>
                      <div className="space-y-2 text-sm">
                        {selectedPO.submittedForApprovalAt && (
                          <p className="text-gray-600">
                            Submitted: {new Date(selectedPO.submittedForApprovalAt).toLocaleString()}
                          </p>
                        )}
                        {selectedPO.approvedAt && (
                          <p className="text-green-600">
                            Approved: {new Date(selectedPO.approvedAt).toLocaleString()}
                          </p>
                        )}
                        {selectedPO.rejectedAt && (
                          <p className="text-red-600">
                            Rejected: {new Date(selectedPO.rejectedAt).toLocaleString()}
                            {selectedPO.rejectionReason && ` - ${selectedPO.rejectionReason}`}
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
                            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Quantity</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tax</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPO.lineItems.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm">{item.description}</td>
                              <td className="px-4 py-3 text-sm text-center">{item.quantity}</td>
                              <td className="px-4 py-3 text-sm text-right">R {item.unitPrice.toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right">R {(item.taxAmount || 0).toFixed(2)}</td>
                              <td className="px-4 py-3 text-sm text-right font-medium">R {item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium">Subtotal:</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">R {selectedPO.subtotal.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium">Tax:</td>
                            <td className="px-4 py-3 text-sm text-right font-medium">R {selectedPO.taxAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td colSpan={4} className="px-4 py-3 text-right text-sm font-bold">Total:</td>
                            <td className="px-4 py-3 text-sm text-right font-bold">R {selectedPO.totalAmount.toFixed(2)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {selectedPO.notes && (
                    <div>
                      <Label className="text-gray-500">Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPO.notes}</p>
                    </div>
                  )}

                  {selectedPO.internalNotes && (
                    <div>
                      <Label className="text-gray-500">Internal Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPO.internalNotes}</p>
                    </div>
                  )}

                  {selectedPO.termsAndConditions && (
                    <div>
                      <Label className="text-gray-500">Terms & Conditions</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPO.termsAndConditions}</p>
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
                  <Label htmlFor="lineitem-glaccount">GL Account (Expense)</Label>
                  <select
                    id="lineitem-glaccount"
                    value={lineItemForm.glAccountCode || ''}
                    onChange={(e) => updateLineItemForm('glAccountCode', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select expense account...</option>
                    {glAccounts.map(account => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>
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
                <AlertDialogTitle>Delete Purchase Order?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete purchase order {selectedPO?.poNumber}?
                  This action cannot be undone. Only draft purchase orders can be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                  {isSubmitting ? 'Deleting...' : 'Delete Purchase Order'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
