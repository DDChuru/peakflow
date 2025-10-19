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
import { Checkbox } from '@/components/ui/checkbox';
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
  Search,
  MoreHorizontal,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Send,
  CheckCircle,
  X,
  DollarSign,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Receipt,
  XCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { createVendorPaymentService } from '@/lib/accounting/vendor-payment-service';
import { createVendorBillService } from '@/lib/accounting/vendor-bill-service';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { db } from '@/lib/firebase/config';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import type {
  Payment,
  PaymentStatus,
  PaymentMethod,
  CreatePaymentInput,
  UpdatePaymentInput,
  VoidPaymentInput,
  PaymentAllocation,
} from '@/types/accounting/payment';
import type { VendorBill } from '@/types/accounting/vendor-bill';
import type { Creditor } from '@/types/financial';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

// Bank Account interface (simplified)
interface BankAccount {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  isActive: boolean;
}

// Zod schema for form validation
const paymentSchema = z.object({
  vendorId: z.string().min(1, 'Vendor is required'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['check', 'eft', 'wire', 'cash', 'credit_card', 'debit_card'] as const, {
    errorMap: () => ({ message: 'Payment method is required' }),
  }),
  bankAccountId: z.string().min(1, 'Bank account is required'),
  checkNumber: z.string().optional(),
  referenceNumber: z.string().optional(),
  paymentDescription: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

// Void payment schema
const voidSchema = z.object({
  voidReason: z.string().min(1, 'Void reason is required'),
  voidDate: z.string().min(1, 'Void date is required'),
});

type VoidFormData = z.infer<typeof voidSchema>;

export default function VendorPaymentsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [vendors, setVendors] = useState<Creditor[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [vendorBills, setVendorBills] = useState<VendorBill[]>([]);
  const [availableBills, setAvailableBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditorService] = useState(() => new CreditorService());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [vendorFilter, setVendorFilter] = useState<string>('all');
  const [bankAccountFilter, setBankAccountFilter] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bill allocation state
  const [selectedBillAllocations, setSelectedBillAllocations] = useState<Map<string, number>>(new Map());
  const [selectedVendorId, setSelectedVendorId] = useState<string>('');

  // React Hook Form for Payment
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      vendorId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'eft',
      bankAccountId: '',
      checkNumber: '',
      referenceNumber: '',
      paymentDescription: '',
      notes: '',
      internalNotes: '',
    },
  });

  // React Hook Form for Void
  const {
    register: registerVoid,
    handleSubmit: handleSubmitVoid,
    reset: resetVoid,
    formState: { errors: voidErrors },
  } = useForm<VoidFormData>({
    resolver: zodResolver(voidSchema),
    defaultValues: {
      voidReason: '',
      voidDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch form values
  const watchVendorId = watch('vendorId');
  const watchPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (canAccess && companyId && user) {
      loadData();
    }
  }, [canAccess, companyId, user]);

  // Load available bills when vendor changes
  useEffect(() => {
    if (watchVendorId) {
      loadAvailableBills(watchVendorId);
      setSelectedVendorId(watchVendorId);
    } else {
      setAvailableBills([]);
      setSelectedBillAllocations(new Map());
    }
  }, [watchVendorId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        loadPayments(),
        loadVendors(),
        loadBankAccounts(),
        loadVendorBills(),
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    if (!user) return;
    const paymentService = createVendorPaymentService(companyId, user.uid);
    const data = await paymentService.getPayments();

    // Enrich with vendor names
    const enrichedData = await Promise.all(
      data.map(async (payment) => {
        if (!payment.vendorName) {
          const vendor = vendors.find(v => v.id === payment.vendorId);
          return { ...payment, vendorName: vendor?.name || 'Unknown Vendor' };
        }
        return payment;
      })
    );

    setPayments(enrichedData);
  };

  const loadVendors = async () => {
    const data = await creditorService.getCreditors(companyId);
    setVendors(data);
  };

  const loadBankAccounts = async () => {
    const accountsRef = collection(db, `companies/${companyId}/bankAccounts`);
    const accountsQuery = query(accountsRef, where('isActive', '==', true), orderBy('accountName'));
    const snapshot = await getDocs(accountsQuery);

    const accounts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BankAccount[];

    setBankAccounts(accounts);
  };

  const loadVendorBills = async () => {
    if (!user) return;
    const billService = createVendorBillService(companyId, user.uid);
    const data = await billService.getVendorBills();
    setVendorBills(data);
  };

  const loadAvailableBills = async (vendorId: string) => {
    if (!user) return;
    const billService = createVendorBillService(companyId, user.uid);
    const allBills = await billService.getVendorBills({
      vendorId,
      unpaid: true
    });

    // Filter to approved/posted bills with amount due
    const unpaidBills = allBills.filter(
      bill =>
        (bill.status === 'approved' || bill.status === 'posted' || bill.status === 'partially_paid') &&
        bill.amountDue > 0
    );

    setAvailableBills(unpaidBills);
  };

  const handleBillSelection = (billId: string, checked: boolean) => {
    const newAllocations = new Map(selectedBillAllocations);

    if (checked) {
      const bill = availableBills.find(b => b.id === billId);
      if (bill) {
        newAllocations.set(billId, bill.amountDue);
      }
    } else {
      newAllocations.delete(billId);
    }

    setSelectedBillAllocations(newAllocations);
  };

  const handleAllocationAmountChange = (billId: string, amount: number) => {
    const newAllocations = new Map(selectedBillAllocations);
    const bill = availableBills.find(b => b.id === billId);

    if (bill && amount > 0 && amount <= bill.amountDue) {
      newAllocations.set(billId, amount);
    }

    setSelectedBillAllocations(newAllocations);
  };

  const calculateTotalPaymentAmount = () => {
    let total = 0;
    selectedBillAllocations.forEach(amount => {
      total += amount;
    });
    return total;
  };

  const calculateRemainingToAllocate = () => {
    return calculateTotalPaymentAmount();
  };

  const handleCreate = async (data: PaymentFormData) => {
    if (!user) return;

    // Validate allocations
    if (selectedBillAllocations.size === 0) {
      toast.error('Please select at least one bill to pay');
      return;
    }

    const totalAmount = calculateTotalPaymentAmount();
    if (totalAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);

      const billAllocations: Omit<PaymentAllocation, 'billNumber' | 'billAmount' | 'remainingAmount'>[] = [];
      selectedBillAllocations.forEach((amountAllocated, billId) => {
        billAllocations.push({
          billId,
          amountAllocated,
        });
      });

      const input: CreatePaymentInput = {
        vendorId: data.vendorId,
        paymentDate: new Date(data.paymentDate),
        amount: totalAmount,
        paymentMethod: data.paymentMethod,
        bankAccountId: data.bankAccountId,
        billAllocations,
        checkNumber: data.checkNumber,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        internalNotes: data.internalNotes,
        paymentDescription: data.paymentDescription,
        currency: 'ZAR',
      };

      await paymentService.createPayment(input);
      toast.success('Payment created successfully');
      setIsCreateDialogOpen(false);
      reset();
      setSelectedBillAllocations(new Map());
      setSelectedVendorId('');
      await loadPayments();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast.error(error.message || 'Failed to create payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (data: PaymentFormData) => {
    if (!user || !selectedPayment) return;

    // Validate allocations
    if (selectedBillAllocations.size === 0) {
      toast.error('Please select at least one bill to pay');
      return;
    }

    const totalAmount = calculateTotalPaymentAmount();
    if (totalAmount <= 0) {
      toast.error('Payment amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);

      const billAllocations: Omit<PaymentAllocation, 'billNumber' | 'billAmount' | 'remainingAmount'>[] = [];
      selectedBillAllocations.forEach((amountAllocated, billId) => {
        billAllocations.push({
          billId,
          amountAllocated,
        });
      });

      const updates: UpdatePaymentInput = {
        vendorId: data.vendorId,
        paymentDate: new Date(data.paymentDate),
        amount: totalAmount,
        paymentMethod: data.paymentMethod,
        bankAccountId: data.bankAccountId,
        billAllocations,
        checkNumber: data.checkNumber,
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        internalNotes: data.internalNotes,
        paymentDescription: data.paymentDescription,
      };

      await paymentService.updatePayment(selectedPayment.id, updates);
      toast.success('Payment updated successfully');
      setIsEditDialogOpen(false);
      await loadPayments();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      toast.error(error.message || 'Failed to update payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !selectedPayment) return;

    setIsSubmitting(true);
    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.deletePayment(selectedPayment.id);
      toast.success('Payment deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
      await loadPayments();
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(error.message || 'Failed to delete payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (payment: Payment) => {
    if (!user) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.submitForApproval(payment.id);
      toast.success('Payment submitted for approval');
      await loadPayments();
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      toast.error(error.message || 'Failed to submit for approval');
    }
  };

  const handleApprove = async (payment: Payment) => {
    if (!user) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.approvePayment(payment.id);
      toast.success('Payment approved');
      await loadPayments();
    } catch (error: any) {
      console.error('Error approving payment:', error);
      toast.error(error.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (payment: Payment) => {
    if (!user) return;

    const reason = prompt('Please enter rejection reason:');
    if (!reason) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.rejectPayment(payment.id, reason);
      toast.success('Payment rejected');
      await loadPayments();
    } catch (error: any) {
      console.error('Error rejecting payment:', error);
      toast.error(error.message || 'Failed to reject payment');
    }
  };

  const handleProcess = async (payment: Payment) => {
    if (!user) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.processPayment(payment.id);
      toast.success('Payment processed successfully');
      await loadPayments();
      await loadVendorBills(); // Reload bills to see updated amounts
    } catch (error: any) {
      console.error('Error processing payment:', error);
      toast.error(error.message || 'Failed to process payment');
    }
  };

  const handleVoid = async (data: VoidFormData) => {
    if (!user || !selectedPayment) return;

    setIsSubmitting(true);
    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      const input: VoidPaymentInput = {
        paymentId: selectedPayment.id,
        voidReason: data.voidReason,
        voidDate: new Date(data.voidDate),
      };

      await paymentService.voidPayment(input);
      toast.success('Payment voided successfully');
      setIsVoidDialogOpen(false);
      resetVoid();
      await loadPayments();
      await loadVendorBills(); // Reload bills to see reversed amounts
    } catch (error: any) {
      console.error('Error voiding payment:', error);
      toast.error(error.message || 'Failed to void payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkAsCleared = async (payment: Payment) => {
    if (!user) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.updatePayment(payment.id, { status: 'cleared' });
      toast.success('Payment marked as cleared');
      await loadPayments();
    } catch (error: any) {
      console.error('Error marking as cleared:', error);
      toast.error(error.message || 'Failed to mark as cleared');
    }
  };

  const handleCancel = async (payment: Payment) => {
    if (!user) return;

    try {
      const paymentService = createVendorPaymentService(companyId, user.uid);
      await paymentService.updatePayment(payment.id, { status: 'cancelled' });
      toast.success('Payment cancelled');
      await loadPayments();
    } catch (error: any) {
      console.error('Error cancelling payment:', error);
      toast.error(error.message || 'Failed to cancel payment');
    }
  };

  const openCreateDialog = () => {
    reset({
      vendorId: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'eft',
      bankAccountId: '',
      checkNumber: '',
      referenceNumber: '',
      paymentDescription: '',
      notes: '',
      internalNotes: '',
    });
    setSelectedBillAllocations(new Map());
    setSelectedVendorId('');
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (payment: Payment) => {
    if (payment.status === 'processed' || payment.status === 'posted') {
      toast.error('Processed or posted payments cannot be edited');
      return;
    }

    setSelectedPayment(payment);
    setValue('vendorId', payment.vendorId);
    setValue('paymentDate', payment.paymentDate.toISOString().split('T')[0]);
    setValue('paymentMethod', payment.paymentMethod as any);
    setValue('bankAccountId', payment.bankAccountId);
    setValue('checkNumber', payment.checkNumber || '');
    setValue('referenceNumber', payment.referenceNumber || '');
    setValue('paymentDescription', payment.paymentDescription || '');
    setValue('notes', payment.notes || '');
    setValue('internalNotes', payment.internalNotes || '');

    // Set bill allocations
    const allocations = new Map<string, number>();
    payment.billAllocations.forEach(alloc => {
      allocations.set(alloc.billId, alloc.amountAllocated);
    });
    setSelectedBillAllocations(allocations);
    setSelectedVendorId(payment.vendorId);

    setIsEditDialogOpen(true);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDeleteDialogOpen(true);
  };

  const openVoidDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    resetVoid({
      voidReason: '',
      voidDate: new Date().toISOString().split('T')[0],
    });
    setIsVoidDialogOpen(true);
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm ||
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.checkNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.paymentMethod === methodFilter;
    const matchesVendor = vendorFilter === 'all' || payment.vendorId === vendorFilter;
    const matchesBank = bankAccountFilter === 'all' || payment.bankAccountId === bankAccountFilter;

    return matchesSearch && matchesStatus && matchesMethod && matchesVendor && matchesBank;
  });

  // Calculate summary statistics
  const stats = {
    total: payments.length,
    pendingApproval: payments.filter(p => p.status === 'pending_approval').length,
    processed: payments.filter(p => p.status === 'processed' || p.status === 'posted').length,
    totalAmount: payments
      .filter(p => p.status !== 'void' && p.status !== 'cancelled')
      .reduce((sum, p) => sum + p.amount, 0),
    unreconciledCount: payments.filter(p =>
      (p.status === 'processed' || p.status === 'posted') && !p.reconciledAt
    ).length,
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-indigo-100 text-indigo-800';
      case 'posted': return 'bg-blue-100 text-blue-800';
      case 'cleared': return 'bg-green-100 text-green-800';
      case 'void': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'check': return <Receipt className="h-4 w-4" />;
      case 'eft': return <ArrowLeftRight className="h-4 w-4" />;
      case 'wire': return <Banknote className="h-4 w-4" />;
      case 'cash': return <DollarSign className="h-4 w-4" />;
      case 'credit_card':
      case 'debit_card': return <CreditCard className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'check': return 'bg-purple-100 text-purple-800';
      case 'eft': return 'bg-blue-100 text-blue-800';
      case 'wire': return 'bg-indigo-100 text-indigo-800';
      case 'cash': return 'bg-green-100 text-green-800';
      case 'credit_card':
      case 'debit_card': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if user can approve/process (admin only)
  const canApprove = user?.role === 'admin';
  const canProcess = user?.role === 'admin';
  const canVoid = user?.role === 'admin';
  const canPostToGL = user?.role === 'admin' || user?.role === 'financial_admin';
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
              <p className="text-gray-600">Loading vendor payments...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Vendor Payments</h1>
              <p className="text-gray-500 mt-1">Manage vendor payments and bill allocations</p>
            </div>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Payment
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
                <CardTitle className="text-sm font-medium text-gray-500">Total Payments</CardTitle>
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
                <CardTitle className="text-sm font-medium text-gray-500">Processed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">{stats.processed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {stats.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-500">Unreconciled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.unreconciledCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col space-y-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search by payment number, vendor name, check number, or reference..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="processed">Processed</option>
                    <option value="posted">Posted</option>
                    <option value="cleared">Cleared</option>
                    <option value="void">Void</option>
                    <option value="cancelled">Cancelled</option>
                  </Select>
                  <Select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
                  >
                    <option value="all">All Methods</option>
                    <option value="check">Check</option>
                    <option value="eft">EFT</option>
                    <option value="wire">Wire</option>
                    <option value="cash">Cash</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
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
                  <Select
                    value={bankAccountFilter}
                    onChange={(e) => setBankAccountFilter(e.target.value)}
                  >
                    <option value="all">All Bank Accounts</option>
                    {bankAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} ({account.accountNumber})
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card className="overflow-visible flex-1 flex flex-col">
            <CardContent className="p-0 overflow-visible flex-1">
              <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Number</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium mb-2">No payments found</p>
                          <p className="text-sm">Create your first vendor payment to get started</p>
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {payment.paymentNumber}
                            {payment.checkNumber && (
                              <div className="text-xs text-gray-500">Check: {payment.checkNumber}</div>
                            )}
                            {payment.referenceNumber && (
                              <div className="text-xs text-gray-500">Ref: {payment.referenceNumber}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {payment.vendorName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            R {payment.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getPaymentMethodColor(payment.paymentMethod)}>
                              <span className="flex items-center gap-1">
                                {getPaymentMethodIcon(payment.paymentMethod)}
                                {payment.paymentMethod.replace('_', ' ')}
                              </span>
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={getStatusColor(payment.status)}>
                              {payment.status.replace('_', ' ')}
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
                                <DropdownMenuItem onSelect={() => openViewDialog(payment)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                {payment.status === 'draft' && (
                                  <>
                                    <DropdownMenuItem onSelect={() => openEditDialog(payment)}>
                                      <Edit className="h-4 w-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleSubmitForApproval(payment)}>
                                      <Send className="h-4 w-4 mr-2" />
                                      Submit for Approval
                                    </DropdownMenuItem>
                                    {canDelete && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => openDeleteDialog(payment)} className="text-red-600">
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </>
                                )}
                                {payment.status === 'pending_approval' && canApprove && (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleApprove(payment)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleReject(payment)} className="text-red-600">
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {payment.status === 'approved' && canProcess && (
                                  <>
                                    <DropdownMenuItem onSelect={() => handleProcess(payment)}>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Process Payment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleCancel(payment)} className="text-red-600">
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {(payment.status === 'processed' || payment.status === 'posted') && (
                                  <>
                                    {!payment.reconciledAt && (
                                      <DropdownMenuItem onSelect={() => handleMarkAsCleared(payment)}>
                                        <CheckCircle className="h-4 w-4 mr-2" />
                                        Mark as Cleared
                                      </DropdownMenuItem>
                                    )}
                                    {canVoid && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => openVoidDialog(payment)} className="text-red-600">
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Void Payment
                                        </DropdownMenuItem>
                                      </>
                                    )}
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

          {/* Create/Edit Payment Dialog */}
          <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
            }
          }}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditDialogOpen ? 'Edit Payment' : 'Create Payment'}</DialogTitle>
                <DialogDescription>
                  {isEditDialogOpen ? 'Update payment details and bill allocations' : 'Create a new vendor payment with bill allocations'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit(isEditDialogOpen ? handleEdit : handleCreate)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vendorId">Vendor *</Label>
                    <Select {...register('vendorId')} disabled={isEditDialogOpen}>
                      <option value="">Select vendor...</option>
                      {vendors.map(vendor => (
                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                      ))}
                    </Select>
                    {errors.vendorId && <p className="text-sm text-red-600">{errors.vendorId.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentDate">Payment Date *</Label>
                    <Input type="date" {...register('paymentDate')} />
                    {errors.paymentDate && <p className="text-sm text-red-600">{errors.paymentDate.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentMethod">Payment Method *</Label>
                    <Select {...register('paymentMethod')}>
                      <option value="eft">EFT</option>
                      <option value="check">Check</option>
                      <option value="wire">Wire Transfer</option>
                      <option value="cash">Cash</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="debit_card">Debit Card</option>
                    </Select>
                    {errors.paymentMethod && <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankAccountId">Bank Account *</Label>
                    <Select {...register('bankAccountId')}>
                      <option value="">Select bank account...</option>
                      {bankAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountName} - {account.accountNumber}
                        </option>
                      ))}
                    </Select>
                    {errors.bankAccountId && <p className="text-sm text-red-600">{errors.bankAccountId.message}</p>}
                  </div>

                  {watchPaymentMethod === 'check' && (
                    <div className="space-y-2">
                      <Label htmlFor="checkNumber">Check Number</Label>
                      <Input {...register('checkNumber')} placeholder="Check number" />
                    </div>
                  )}

                  {(watchPaymentMethod === 'eft' || watchPaymentMethod === 'wire') && (
                    <div className="space-y-2">
                      <Label htmlFor="referenceNumber">Reference Number</Label>
                      <Input {...register('referenceNumber')} placeholder="Transaction reference" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentDescription">Payment Description</Label>
                  <Input {...register('paymentDescription')} placeholder="Description for bank/vendor" />
                </div>

                {/* Bill Allocations Section */}
                <div className="space-y-4 border-t pt-4">
                  <div>
                    <h3 className="font-medium text-lg mb-2">Bill Allocations *</h3>
                    <p className="text-sm text-gray-500 mb-4">Select bills to pay for this vendor</p>
                  </div>

                  {!selectedVendorId ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Select a vendor to view available bills</p>
                    </div>
                  ) : availableBills.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">No unpaid bills available for this vendor</p>
                    </div>
                  ) : (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="w-12 px-4 py-3 text-center">
                              <span className="sr-only">Select</span>
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Bill Number</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Due Date</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Total Amount</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Amount Due</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 w-32">Amount to Pay</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {availableBills.map((bill) => {
                            const isSelected = selectedBillAllocations.has(bill.id);
                            const allocatedAmount = selectedBillAllocations.get(bill.id) || 0;
                            const isOverdue = new Date(bill.dueDate) < new Date();

                            return (
                              <tr key={bill.id} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                                <td className="px-4 py-3 text-center">
                                  <Checkbox
                                    checked={isSelected}
                                    onCheckedChange={(checked) => handleBillSelection(bill.id, checked as boolean)}
                                  />
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <div className="font-medium">{bill.billNumber}</div>
                                  <div className="text-xs text-gray-500">{bill.vendorBillNumber}</div>
                                </td>
                                <td className="py-3 px-4 text-sm">
                                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                    {format(new Date(bill.dueDate), 'MMM dd, yyyy')}
                                  </span>
                                  {isOverdue && (
                                    <div className="text-xs text-red-600">Overdue</div>
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm text-right">
                                  R {bill.totalAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4 text-sm text-right font-medium">
                                  R {bill.amountDue.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="py-3 px-4">
                                  {isSelected ? (
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      max={bill.amountDue}
                                      value={allocatedAmount}
                                      onChange={(e) => handleAllocationAmountChange(bill.id, parseFloat(e.target.value) || 0)}
                                      className="text-right"
                                    />
                                  ) : (
                                    <span className="text-sm text-gray-400 text-right block">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Payment Summary */}
                  {selectedBillAllocations.size > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-indigo-900">Bills Selected:</span>
                          <span className="text-lg font-bold text-indigo-600">{selectedBillAllocations.size}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-indigo-200">
                          <span className="text-lg font-bold text-indigo-900">Total Payment Amount:</span>
                          <span className="text-2xl font-bold text-indigo-600">
                            R {calculateTotalPaymentAmount().toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea {...register('notes')} rows={3} placeholder="Notes for vendor..." />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="internalNotes">Internal Notes</Label>
                  <Textarea {...register('internalNotes')} rows={3} placeholder="Internal notes (not shown to vendor)..." />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid || selectedBillAllocations.size === 0}>
                    {isSubmitting ? 'Saving...' : isEditDialogOpen ? 'Update Payment' : 'Create Payment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* View Payment Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  {selectedPayment?.paymentNumber} - {selectedPayment?.vendorName}
                </DialogDescription>
              </DialogHeader>

              {selectedPayment && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Vendor</Label>
                      <p className="font-medium">{selectedPayment.vendorName}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <p>
                        <Badge className={getStatusColor(selectedPayment.status)}>
                          {selectedPayment.status.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Date</Label>
                      <p className="font-medium">{format(new Date(selectedPayment.paymentDate), 'MMMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Amount</Label>
                      <p className="font-medium text-lg">R {selectedPayment.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Method</Label>
                      <p>
                        <Badge className={getPaymentMethodColor(selectedPayment.paymentMethod)}>
                          <span className="flex items-center gap-1">
                            {getPaymentMethodIcon(selectedPayment.paymentMethod)}
                            {selectedPayment.paymentMethod.replace('_', ' ')}
                          </span>
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Bank Account</Label>
                      <p className="font-medium">
                        {selectedPayment.bankAccountName || 'N/A'}
                        {selectedPayment.bankAccountNumber && (
                          <span className="text-sm text-gray-500"> ({selectedPayment.bankAccountNumber})</span>
                        )}
                      </p>
                    </div>
                    {selectedPayment.checkNumber && (
                      <div>
                        <Label className="text-gray-500">Check Number</Label>
                        <p className="font-medium">{selectedPayment.checkNumber}</p>
                      </div>
                    )}
                    {selectedPayment.referenceNumber && (
                      <div>
                        <Label className="text-gray-500">Reference Number</Label>
                        <p className="font-medium">{selectedPayment.referenceNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Approval History */}
                  {selectedPayment.status !== 'draft' && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Approval History</h3>
                      <div className="space-y-2 text-sm">
                        {selectedPayment.submittedForApprovalAt && (
                          <p className="text-gray-600">
                            Submitted: {format(new Date(selectedPayment.submittedForApprovalAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                        {selectedPayment.approvedAt && (
                          <p className="text-green-600">
                            Approved: {format(new Date(selectedPayment.approvedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                        {selectedPayment.rejectedAt && (
                          <p className="text-red-600">
                            Rejected: {format(new Date(selectedPayment.rejectedAt), 'MMM dd, yyyy HH:mm')}
                            {selectedPayment.rejectionReason && ` - ${selectedPayment.rejectionReason}`}
                          </p>
                        )}
                        {selectedPayment.processedAt && (
                          <p className="text-indigo-600">
                            Processed: {format(new Date(selectedPayment.processedAt), 'MMM dd, yyyy HH:mm')}
                          </p>
                        )}
                        {selectedPayment.voidedAt && (
                          <p className="text-red-600">
                            Voided: {format(new Date(selectedPayment.voidedAt), 'MMM dd, yyyy HH:mm')}
                            {selectedPayment.voidReason && ` - ${selectedPayment.voidReason}`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bill Allocations */}
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Bill Allocations</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Bill Number</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Bill Amount</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount Allocated</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Remaining</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedPayment.billAllocations.map((allocation, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm">{allocation.billNumber}</td>
                              <td className="px-4 py-3 text-sm text-right">
                                R {allocation.billAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm text-right font-medium">
                                R {allocation.amountAllocated.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-sm text-right">
                                R {allocation.remainingAmount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-right text-sm font-bold">Total Payment:</td>
                            <td className="px-4 py-3 text-sm text-right font-bold">
                              R {selectedPayment.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                            </td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {selectedPayment.paymentDescription && (
                    <div>
                      <Label className="text-gray-500">Payment Description</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPayment.paymentDescription}</p>
                    </div>
                  )}

                  {selectedPayment.notes && (
                    <div>
                      <Label className="text-gray-500">Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPayment.notes}</p>
                    </div>
                  )}

                  {selectedPayment.internalNotes && (
                    <div>
                      <Label className="text-gray-500">Internal Notes</Label>
                      <p className="text-sm mt-1 whitespace-pre-wrap">{selectedPayment.internalNotes}</p>
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

          {/* Delete Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Payment?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete payment {selectedPayment?.paymentNumber}?
                  This action cannot be undone. Only draft payments can be deleted.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                  {isSubmitting ? 'Deleting...' : 'Delete Payment'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Void Dialog */}
          <Dialog open={isVoidDialogOpen} onOpenChange={setIsVoidDialogOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Void Payment</DialogTitle>
                <DialogDescription>
                  This will void payment {selectedPayment?.paymentNumber} and reverse all bill allocations.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmitVoid(handleVoid)} className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                    <div className="text-sm text-red-800">
                      <p className="font-medium mb-1">Warning: This will:</p>
                      <ul className="list-disc ml-4 space-y-1">
                        <li>Mark the payment as void</li>
                        <li>Reverse all bill allocations</li>
                        <li>Update bill amounts due</li>
                        {selectedPayment?.glPosted && <li>Create a reversal journal entry</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voidReason">Void Reason *</Label>
                  <Textarea {...registerVoid('voidReason')} rows={3} placeholder="Reason for voiding this payment..." />
                  {voidErrors.voidReason && <p className="text-sm text-red-600">{voidErrors.voidReason.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voidDate">Void Date *</Label>
                  <Input type="date" {...registerVoid('voidDate')} />
                  {voidErrors.voidDate && <p className="text-sm text-red-600">{voidErrors.voidDate.message}</p>}
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsVoidDialogOpen(false)} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700">
                    {isSubmitting ? 'Voiding...' : 'Void Payment'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}
