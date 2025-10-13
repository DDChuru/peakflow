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
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Building,
  CreditCard,
  FileText
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { CreditorService } from '@/lib/firebase/creditor-service';
import { Creditor } from '@/types/financial';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CreditorPrimaryContactForm } from '@/components/contacts/CreditorPrimaryContactForm';
import { CreditorFinancialContactsManager } from '@/components/contacts/CreditorFinancialContactsManager';

// Form validation schema
const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  creditorType: z.enum(['trade', 'tax-authority', 'statutory', 'utility', 'other']).default('trade'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  branchCode: z.string().optional(),
  swiftCode: z.string().optional(),
  category: z.string().optional(),
  paymentTerms: z.coerce.number().min(0, 'Payment terms must be 0 or more days').default(0),
  status: z.enum(['active', 'inactive']).default('active'),
  notes: z.string().optional(),
  // Primary contact fields
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryContactPhone: z.string().optional(),
  primaryContactPosition: z.string().optional(),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function SuppliersPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [suppliers, setSuppliers] = useState<Creditor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creditorService] = useState(() => new CreditorService());
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Creditor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // React Hook Form
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: '',
      creditorType: 'trade',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      accountNumber: '',
      bankName: '',
      branchCode: '',
      swiftCode: '',
      category: '',
      paymentTerms: 30,
      status: 'active',
      notes: '',
      primaryContactName: '',
      primaryContactEmail: '',
      primaryContactPhone: '',
      primaryContactPosition: '',
    },
  });

  useEffect(() => {
    if (canAccess && companyId) {
      loadSuppliers();
    }
  }, [canAccess, companyId]);

  // Check initial scroll state
  useEffect(() => {
    const scrollContainer = document.querySelector('.supplier-table-scroll');
    if (scrollContainer) {
      const hasMore = scrollContainer.scrollHeight > scrollContainer.clientHeight;
      setShowScrollIndicator(hasMore);
    }
  }, [suppliers, searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search suppliers"]')?.focus();
      }
      // Ctrl/Cmd + N to create new supplier
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isCreateDialogOpen) {
        e.preventDefault();
        form.reset();
        setShowBankDetails(false);
        setIsCreateDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCreateDialogOpen, form]);

  // Update selected supplier when suppliers array changes (after contact updates)
  useEffect(() => {
    if (selectedSupplier && suppliers.length > 0) {
      const updatedSupplier = suppliers.find(s => s.id === selectedSupplier.id);
      if (updatedSupplier) {
        setSelectedSupplier(updatedSupplier);
      }
    }
  }, [suppliers]);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await creditorService.getCreditors(companyId);
      setSuppliers(data);
    } catch (err) {
      console.error('Error loading suppliers:', err);
      setError('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (data: SupplierFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Build supplier data object, only including fields with values (Firestore doesn't accept undefined)
      const supplierData: any = {
        name: data.name,
        creditorType: data.creditorType || 'trade',
        paymentTerms: data.paymentTerms || 0,
        status: data.status as 'active' | 'inactive',
        currentBalance: 0,
        createdBy: user.uid,
      };

      // Only add optional fields if they have values
      if (data.email) supplierData.email = data.email;
      if (data.phone) supplierData.phone = data.phone;
      if (data.address) supplierData.address = data.address;
      if (data.taxId) supplierData.taxId = data.taxId;
      if (data.accountNumber) supplierData.accountNumber = data.accountNumber;
      if (data.category) supplierData.category = data.category;
      if (data.notes) supplierData.notes = data.notes;

      // Add bank details if any bank field is provided
      if (data.bankName || data.branchCode || data.swiftCode) {
        supplierData.bankDetails = {
          bankName: data.bankName || '',
        };
        if (data.branchCode) supplierData.bankDetails.branchCode = data.branchCode;
        if (data.swiftCode) supplierData.bankDetails.swiftCode = data.swiftCode;
      }

      const newSupplier = await creditorService.createCreditor(companyId, supplierData, user.uid);

      // Save primary contact if provided
      if (data.primaryContactName) {
        try {
          const primaryContact: any = {
            name: data.primaryContactName,
          };
          if (data.primaryContactEmail) primaryContact.email = data.primaryContactEmail;
          if (data.primaryContactPhone) primaryContact.phone = data.primaryContactPhone;
          if (data.primaryContactPosition) primaryContact.position = data.primaryContactPosition;

          await creditorService.updatePrimaryContact(companyId, newSupplier.id, primaryContact);
        } catch (contactError) {
          console.error('Error saving primary contact:', contactError);
          toast('Supplier created, but failed to save primary contact', { icon: '⚠️' });
        }
      }

      toast.success('Supplier created successfully');
      setIsCreateDialogOpen(false);
      form.reset();
      await loadSuppliers();
    } catch (error) {
      console.error('Error creating supplier:', error);
      toast.error('Failed to create supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSupplier = async (data: SupplierFormData) => {
    if (!selectedSupplier) return;

    setIsSubmitting(true);
    try {
      // Build updates object, only including fields with values (Firestore doesn't accept undefined)
      const updates: any = {
        name: data.name,
        creditorType: data.creditorType || 'trade',
        paymentTerms: data.paymentTerms || 0,
        status: data.status as 'active' | 'inactive',
      };

      // Only add optional fields if they have values
      if (data.email) updates.email = data.email;
      if (data.phone) updates.phone = data.phone;
      if (data.address) updates.address = data.address;
      if (data.taxId) updates.taxId = data.taxId;
      if (data.accountNumber) updates.accountNumber = data.accountNumber;
      if (data.category) updates.category = data.category;
      if (data.notes) updates.notes = data.notes;

      // Add bank details if any bank field is provided
      if (data.bankName || data.branchCode || data.swiftCode) {
        updates.bankDetails = {
          bankName: data.bankName || '',
        };
        if (data.branchCode) updates.bankDetails.branchCode = data.branchCode;
        if (data.swiftCode) updates.bankDetails.swiftCode = data.swiftCode;
      }

      await creditorService.updateCreditor(companyId, selectedSupplier.id, updates);
      toast.success('Supplier updated successfully');
      setIsEditDialogOpen(false);
      setSelectedSupplier(null);
      form.reset();
      await loadSuppliers();
    } catch (error) {
      console.error('Error updating supplier:', error);
      toast.error('Failed to update supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;

    setIsSubmitting(true);
    try {
      await creditorService.permanentlyDeleteCreditor(companyId, selectedSupplier.id);
      toast.success('Supplier deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedSupplier(null);
      await loadSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (supplier: Creditor) => {
    setSelectedSupplier(supplier);
    form.reset({
      name: supplier.name,
      creditorType: supplier.creditorType || 'trade',
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      accountNumber: supplier.accountNumber || '',
      bankName: supplier.bankDetails?.bankName || '',
      branchCode: supplier.bankDetails?.branchCode || '',
      swiftCode: supplier.bankDetails?.swiftCode || '',
      category: supplier.category || '',
      paymentTerms: supplier.paymentTerms || 30,
      status: supplier.status,
      notes: supplier.notes || '',
    });
    setShowBankDetails(!!supplier.bankDetails);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (supplier: Creditor) => {
    setSelectedSupplier(supplier);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (supplier: Creditor) => {
    setSelectedSupplier(supplier);
    setIsViewDialogOpen(true);
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

  if (loading) {
    return (
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-40 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Summary Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-0 pb-2">
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Search Bar Skeleton */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-10 w-28 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Table Skeleton */}
          <Card className="flex flex-col shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="max-h-[calc(100vh-28rem)] overflow-hidden">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-gray-100">
                    <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCreditorTypeInfo = (creditorType?: string) => {
    switch (creditorType) {
      case 'tax-authority':
        return { label: 'Tax Authority', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'statutory':
        return { label: 'Statutory', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'utility':
        return { label: 'Utility', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'other':
        return { label: 'Other', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      case 'trade':
      default:
        return { label: 'Trade', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    }
  };

  // Calculate summary stats
  const activeSuppliers = suppliers.filter(s => s.status === 'active').length;
  const totalPayable = suppliers.reduce((sum, s) => sum + (s.currentBalance || 0), 0);

  // Filter suppliers by search term
  const filteredSuppliers = searchTerm
    ? suppliers.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone?.includes(searchTerm) ||
        s.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : suppliers;

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Suppliers</h1>
              <p className="text-gray-600">Manage your supplier relationships and accounts payable</p>
            </div>
            <Button onClick={() => {
              form.reset();
              setShowBankDetails(false);
              setIsCreateDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Supplier
            </Button>
          </div>

          {error && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Suppliers</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Creditors in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSuppliers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payable (AP)</CardTitle>
                <span className="text-red-600">R</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{totalPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Accounts payable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <span className="text-indigo-600">#</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {[...new Set(suppliers.map(s => s.category).filter(Boolean))].length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Supplier types
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search suppliers by name, email, phone, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                  ⌘K
                </kbd>
              </div>
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Suppliers Table */}
          <Card className="flex flex-col h-[calc(100vh-28rem)] shadow-sm border-gray-200">
            <CardHeader className="border-b bg-gray-50/50 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Supplier Directory</CardTitle>
                  <CardDescription>
                    Complete list of suppliers with their account details
                  </CardDescription>
                </div>
                {filteredSuppliers.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{filteredSuppliers.length}</span> of <span className="font-medium text-gray-900">{suppliers.length}</span> suppliers
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden relative">
              {filteredSuppliers.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first supplier'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => {
                      form.reset();
                      setShowBankDetails(false);
                      setIsCreateDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Supplier
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="supplier-table-scroll h-full overflow-auto border-t scroll-smooth"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const hasMore = target.scrollHeight > target.clientHeight;
                      const isNearTop = target.scrollTop < 50;
                      setShowScrollIndicator(hasMore && isNearTop);
                    }}
                  >
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Supplier</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Contact</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Category</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Status</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Balance (AP)</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Payment Terms</th>
                        <th className="text-left py-3.5 px-4 font-semibold text-gray-700 text-sm bg-gray-50">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSuppliers.map((supplier, index) => (
                        <tr
                          key={supplier.id}
                          className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                          onClick={() => openEditDialog(supplier)}
                        >
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{supplier.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{supplier.accountNumber || supplier.id}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {supplier.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                  <span className="truncate max-w-[200px]">{supplier.email}</span>
                                </div>
                              )}
                              {supplier.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                  {supplier.phone}
                                </div>
                              )}
                              {!supplier.email && !supplier.phone && (
                                <span className="text-sm text-gray-400 italic">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getCreditorTypeInfo(supplier.creditorType).color}`}>
                                  {getCreditorTypeInfo(supplier.creditorType).label}
                                </span>
                                {supplier.bankDetails && (
                                  <CreditCard className="h-3.5 w-3.5 text-gray-400" title="Bank details on file" />
                                )}
                              </div>
                              {supplier.category && (
                                <span className="text-xs text-gray-500">
                                  {supplier.category}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge className={getStatusColor(supplier.status)}>
                              {supplier.status.charAt(0).toUpperCase() + supplier.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`font-semibold ${(supplier.currentBalance || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              R{(supplier.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600">{supplier.paymentTerms || 0} days</span>
                          </td>
                          <td className="py-4 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                                sideOffset={8}
                              >
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openViewDialog(supplier)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openEditDialog(supplier)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => openDeleteDialog(supplier)}
                                  destructive
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                  {/* Scroll Indicator */}
                  {showScrollIndicator && (
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none flex items-end justify-center pb-2">
                      <div className="animate-bounce text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Reminders */}
          {suppliers.filter(s => (s.currentBalance || 0) > 0).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Payment Reminders</CardTitle>
                <CardDescription>
                  Suppliers with outstanding payables requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suppliers
                    .filter(s => (s.currentBalance || 0) > 0)
                    .map((supplier) => (
                      <div key={supplier.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex items-center space-x-3">
                          <Building2 className="h-5 w-5 text-orange-600" />
                          <div>
                            <p className="font-medium">{supplier.name}</p>
                            <p className="text-sm text-gray-600">
                              {supplier.category || 'Supplier'} • {supplier.paymentTerms || 0} days payment terms
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-medium text-orange-600">
                            R{supplier.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <Button size="sm" variant="outline">
                            Pay Now
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create/Edit Supplier Dialog */}
          <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
            if (!open) {
              setIsCreateDialogOpen(false);
              setIsEditDialogOpen(false);
              setSelectedSupplier(null);
              form.reset();
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditDialogOpen ? 'Edit Supplier' : 'Add New Supplier'}
                </DialogTitle>
                <DialogDescription>
                  {isEditDialogOpen
                    ? 'Update the supplier information below.'
                    : 'Enter the supplier details below to add them to your system.'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={form.handleSubmit(isEditDialogOpen ? handleEditSupplier : handleCreateSupplier)}>
                <div className="grid gap-6 py-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <Building className="h-4 w-4 mr-2" />
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          Supplier Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          {...form.register('name')}
                          placeholder="e.g., ABC Suppliers Ltd"
                          className={form.formState.errors.name ? 'border-red-500 focus:ring-red-500' : ''}
                          aria-invalid={!!form.formState.errors.name}
                        />
                        {form.formState.errors.name && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {form.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="creditorType">
                          Creditor Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={form.watch('creditorType')}
                          onValueChange={(value) => form.setValue('creditorType', value as any)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select creditor type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="trade">Trade Supplier</SelectItem>
                            <SelectItem value="tax-authority">Tax Authority (e.g., SARS)</SelectItem>
                            <SelectItem value="statutory">Statutory (e.g., UIF, Pension)</SelectItem>
                            <SelectItem value="utility">Utility (e.g., Eskom, Municipality)</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          {...form.register('category')}
                          placeholder="e.g., Raw Materials"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          {...form.register('email')}
                          placeholder="supplier@example.com"
                          className={form.formState.errors.email ? 'border-red-500 focus:ring-red-500' : ''}
                          aria-invalid={!!form.formState.errors.email}
                        />
                        {form.formState.errors.email && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {form.formState.errors.email.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          {...form.register('phone')}
                          placeholder="+27 11 234 5678"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                        <Input
                          id="taxId"
                          {...form.register('taxId')}
                          placeholder="4123456789"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="accountNumber">Account Number</Label>
                        <Input
                          id="accountNumber"
                          {...form.register('accountNumber')}
                          placeholder="ACC-001"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        {...form.register('address')}
                        placeholder="123 Main Street, City, Province, 0001"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                        <Input
                          id="paymentTerms"
                          type="number"
                          min="0"
                          {...form.register('paymentTerms')}
                          placeholder="30"
                          className={form.formState.errors.paymentTerms ? 'border-red-500 focus:ring-red-500' : ''}
                          aria-invalid={!!form.formState.errors.paymentTerms}
                        />
                        {form.formState.errors.paymentTerms && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {form.formState.errors.paymentTerms.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={form.watch('status')}
                          onValueChange={(value) => form.setValue('status', value as 'active' | 'inactive')}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bank Details Section */}
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setShowBankDetails(!showBankDetails)}
                      className="flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
                    >
                      {showBankDetails ? (
                        <ChevronDown className="h-4 w-4 mr-2" />
                      ) : (
                        <ChevronRight className="h-4 w-4 mr-2" />
                      )}
                      Bank Details (Optional)
                    </button>

                    {showBankDetails && (
                      <div className="grid grid-cols-2 gap-4 pl-6">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name</Label>
                          <Input
                            id="bankName"
                            {...form.register('bankName')}
                            placeholder="e.g., Standard Bank"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="branchCode">Branch Code</Label>
                          <Input
                            id="branchCode"
                            {...form.register('branchCode')}
                            placeholder="051001"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="swiftCode">SWIFT Code</Label>
                          <Input
                            id="swiftCode"
                            {...form.register('swiftCode')}
                            placeholder="SBZAZAJJ"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <FileText className="h-4 w-4 mr-2" />
                      Additional Information
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        {...form.register('notes')}
                        placeholder="Any additional notes about this supplier..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  {/* Primary Contact Section */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-900">Primary Contact (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="primaryContactName">Contact Name</Label>
                        <Input
                          id="primaryContactName"
                          {...form.register('primaryContactName')}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primaryContactPosition">Position</Label>
                        <Input
                          id="primaryContactPosition"
                          {...form.register('primaryContactPosition')}
                          placeholder="e.g., Account Manager"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primaryContactEmail">Email</Label>
                        <Input
                          id="primaryContactEmail"
                          type="email"
                          {...form.register('primaryContactEmail')}
                          placeholder="john@supplier.com"
                          className={form.formState.errors.primaryContactEmail ? 'border-red-500 focus:ring-red-500' : ''}
                          aria-invalid={!!form.formState.errors.primaryContactEmail}
                        />
                        {form.formState.errors.primaryContactEmail && (
                          <p className="text-sm text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {form.formState.errors.primaryContactEmail.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="primaryContactPhone">Phone</Label>
                        <Input
                          id="primaryContactPhone"
                          {...form.register('primaryContactPhone')}
                          placeholder="+27 11 234 5678"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setSelectedSupplier(null);
                      form.reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        {isEditDialogOpen ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        {isEditDialogOpen ? 'Update Supplier' : 'Create Supplier'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{selectedSupplier?.name}</strong>?
                  This action cannot be undone and will permanently remove the supplier from your system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setSelectedSupplier(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteSupplier}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Supplier'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* View Supplier Details Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Supplier Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedSupplier?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedSupplier && (
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Supplier Name</Label>
                      <p className="font-medium mt-1">{selectedSupplier.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Creditor Type</Label>
                      <div className="mt-1">
                        <Badge className={getCreditorTypeInfo(selectedSupplier.creditorType).color}>
                          {getCreditorTypeInfo(selectedSupplier.creditorType).label}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedSupplier.status)}>
                          {selectedSupplier.status.charAt(0).toUpperCase() + selectedSupplier.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Category</Label>
                      <p className="mt-1">{selectedSupplier.category || 'Uncategorized'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="mt-1">{selectedSupplier.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="mt-1">{selectedSupplier.phone || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">Address</Label>
                      <p className="mt-1">{selectedSupplier.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Tax ID / VAT Number</Label>
                      <p className="mt-1">{selectedSupplier.taxId || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Account Number</Label>
                      <p className="mt-1">{selectedSupplier.accountNumber || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Terms</Label>
                      <p className="mt-1">{selectedSupplier.paymentTerms} days</p>
                    </div>
                    {selectedSupplier.bankDetails && (
                      <>
                        <div className="col-span-2 pt-4 border-t">
                          <h4 className="font-medium text-gray-900 mb-4">Bank Details</h4>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <Label className="text-gray-500">Bank Name</Label>
                              <p className="mt-1">{selectedSupplier.bankDetails.bankName || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">Branch Code</Label>
                              <p className="mt-1">{selectedSupplier.bankDetails.branchCode || 'Not provided'}</p>
                            </div>
                            <div>
                              <Label className="text-gray-500">SWIFT Code</Label>
                              <p className="mt-1">{selectedSupplier.bankDetails.swiftCode || 'Not provided'}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    <div>
                      <Label className="text-gray-500">Current Balance (AP)</Label>
                      <p className="mt-1 font-medium">
                        R{(selectedSupplier.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Supplier ID</Label>
                      <p className="mt-1 text-sm text-gray-600">{selectedSupplier.id}</p>
                    </div>
                    {selectedSupplier.notes && (
                      <div className="col-span-2">
                        <Label className="text-gray-500">Notes</Label>
                        <p className="mt-1">{selectedSupplier.notes}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-500">Created Date</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedSupplier.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Updated</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedSupplier.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Primary Contact Section */}
                  <div className="mt-6 pt-6 border-t">
                    <CreditorPrimaryContactForm
                      companyId={companyId}
                      creditorId={selectedSupplier.id}
                      initialData={selectedSupplier.primaryContact}
                      onSuccess={loadSuppliers}
                      inline
                    />
                  </div>

                  {/* Financial Contacts Section */}
                  <div className="mt-6">
                    <CreditorFinancialContactsManager
                      companyId={companyId}
                      creditorId={selectedSupplier.id}
                      onContactsChange={loadSuppliers}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedSupplier(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(selectedSupplier!);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Supplier
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}