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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Users,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MapPin,
  CreditCard,
  Calendar,
  FileText
} from 'lucide-react';
import { useWorkspaceAccess } from '@/hooks/useWorkspaceAccess';
import { useAuth } from '@/contexts/AuthContext';
import { DebtorService } from '@/lib/firebase/debtor-service';
import { Debtor } from '@/types/financial';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import toast from 'react-hot-toast';
import { PrimaryContactForm } from '@/components/contacts/PrimaryContactForm';
import { FinancialContactsManager } from '@/components/contacts/FinancialContactsManager';

// Zod schema for form validation
const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  taxId: z.string().optional(),
  creditLimit: z.number().min(0, 'Credit limit must be 0 or greater').optional(),
  paymentTerms: z.number().min(0, 'Payment terms must be 0 or greater').default(30),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
  notes: z.string().optional(),
  // Primary contact fields
  primaryContactName: z.string().optional(),
  primaryContactEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  primaryContactPhone: z.string().optional(),
  primaryContactPosition: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomersPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuth();
  const { canAccess, loading: accessLoading, error: accessError } = useWorkspaceAccess(companyId);

  const [customers, setCustomers] = useState<Debtor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debtorService] = useState(() => new DebtorService());
  const [searchTerm, setSearchTerm] = useState('');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Debtor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);

  // React Hook Form
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      creditLimit: 0,
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
      loadCustomers();
    }
  }, [canAccess, companyId]);

  // Check initial scroll state
  useEffect(() => {
    const scrollContainer = document.querySelector('.customer-table-scroll');
    if (scrollContainer) {
      const hasMore = scrollContainer.scrollHeight > scrollContainer.clientHeight;
      setShowScrollIndicator(hasMore);
    }
  }, [customers, searchTerm]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search customers"]')?.focus();
      }
      // Ctrl/Cmd + N to create new customer
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !isCreateDialogOpen) {
        e.preventDefault();
        reset();
        setIsCreateDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCreateDialogOpen, reset]);

  // Update selected customer when customers array changes (after contact updates)
  useEffect(() => {
    if (selectedCustomer && customers.length > 0) {
      const updatedCustomer = customers.find(c => c.id === selectedCustomer.id);
      if (updatedCustomer) {
        setSelectedCustomer(updatedCustomer);
      }
    }
  }, [customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await debtorService.getDebtors(companyId);
      setCustomers(data);
    } catch (err) {
      console.error('Error loading customers:', err);
      setError('Failed to load customers');
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Create customer
  const onCreateSubmit = async (data: CustomerFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      // Build customer data object, only including fields with values (Firestore doesn't accept undefined)
      const customerData: any = {
        name: data.name,
        creditLimit: data.creditLimit || 0,
        paymentTerms: data.paymentTerms,
        status: data.status,
        currentBalance: 0,
        overdueAmount: 0,
        createdBy: user.uid,
      };

      // Only add optional fields if they have values
      if (data.email) customerData.email = data.email;
      if (data.phone) customerData.phone = data.phone;
      if (data.address) customerData.address = data.address;
      if (data.taxId) customerData.taxId = data.taxId;
      if (data.notes) customerData.notes = data.notes;

      const newCustomer = await debtorService.createDebtor(
        companyId,
        customerData,
        user.uid
      );

      // Save primary contact if provided
      if (data.primaryContactName) {
        try {
          const primaryContact: any = {
            name: data.primaryContactName,
          };
          if (data.primaryContactEmail) primaryContact.email = data.primaryContactEmail;
          if (data.primaryContactPhone) primaryContact.phone = data.primaryContactPhone;
          if (data.primaryContactPosition) primaryContact.position = data.primaryContactPosition;

          await debtorService.updatePrimaryContact(companyId, newCustomer.id, primaryContact);
        } catch (contactError) {
          console.error('Error saving primary contact:', contactError);
          toast('Customer created, but failed to save primary contact', { icon: '⚠️' });
        }
      }

      toast.success('Customer created successfully');
      setIsCreateDialogOpen(false);
      reset();
      await loadCustomers();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit customer
  const onEditSubmit = async (data: CustomerFormData) => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      // Build updates object, only including fields with values (Firestore doesn't accept undefined)
      const updates: any = {
        name: data.name,
        creditLimit: data.creditLimit || 0,
        paymentTerms: data.paymentTerms,
        status: data.status,
      };

      // Only add optional fields if they have values
      if (data.email) updates.email = data.email;
      if (data.phone) updates.phone = data.phone;
      if (data.address) updates.address = data.address;
      if (data.taxId) updates.taxId = data.taxId;
      if (data.notes) updates.notes = data.notes;

      await debtorService.updateDebtor(companyId, selectedCustomer.id, updates);

      toast.success('Customer updated successfully');
      setIsEditDialogOpen(false);
      setSelectedCustomer(null);
      reset();
      await loadCustomers();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete customer
  const handleDelete = async () => {
    if (!selectedCustomer) return;

    setIsSubmitting(true);
    try {
      await debtorService.permanentlyDeleteDebtor(companyId, selectedCustomer.id);
      toast.success('Customer deleted successfully');
      setIsDeleteDialogOpen(false);
      setSelectedCustomer(null);
      await loadCustomers();
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open edit dialog with customer data
  const openEditDialog = (customer: Debtor) => {
    setSelectedCustomer(customer);
    setValue('name', customer.name);
    setValue('email', customer.email || '');
    setValue('phone', customer.phone || '');
    setValue('address', customer.address || '');
    setValue('taxId', customer.taxId || '');
    setValue('creditLimit', customer.creditLimit || 0);
    setValue('paymentTerms', customer.paymentTerms || 30);
    setValue('status', customer.status);
    setValue('notes', customer.notes || '');
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const openDeleteDialog = (customer: Debtor) => {
    setSelectedCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  // Open view dialog
  const openViewDialog = (customer: Debtor) => {
    setSelectedCustomer(customer);
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
          <Card className="flex flex-col h-[calc(100vh-28rem)]">
            <CardHeader>
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0">
              <div className="border-t">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center gap-4 px-4 py-3 border-b">
                    <div className="h-12 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-12 w-48 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
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
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate summary stats
  const activeCustomers = customers.filter(c => c.status === 'active').length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const totalOverdue = customers.reduce((sum, c) => sum + (c.overdueAmount || 0), 0);

  // Filter customers by search term
  const filteredCustomers = searchTerm
    ? customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone?.includes(searchTerm)
      )
    : customers;

  return (
    <ProtectedRoute requireCompany>
      <WorkspaceLayout companyId={companyId}>
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
              <p className="text-gray-600">Manage your customer relationships and accounts receivable</p>
            </div>
            <Button onClick={() => {
              reset();
              setIsCreateDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
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
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Debtors in system
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
                <div className="h-2 w-2 rounded-full bg-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding (AR)</CardTitle>
                <span className="text-green-600">R</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Accounts receivable
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <span className="text-orange-600">!</span>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R{totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-muted-foreground">
                  Requires attention
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
                placeholder="Search customers by name, email, or phone..."
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

          {/* Customers Table */}
          <Card className="flex flex-col h-[calc(100vh-28rem)]">
            <CardHeader className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Customer Directory</CardTitle>
                  <CardDescription>
                    Complete list of customers with their account details
                  </CardDescription>
                </div>
                {filteredCustomers.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{filteredCustomers.length}</span> of <span className="font-medium text-gray-900">{customers.length}</span> customers
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden p-0 relative">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm ? 'Try adjusting your search' : 'Get started by adding your first customer'}
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => {
                      reset();
                      setIsCreateDialogOpen(true);
                    }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div
                    className="customer-table-scroll overflow-auto h-full border-t scroll-smooth"
                    onScroll={(e) => {
                      const target = e.currentTarget;
                      const hasMore = target.scrollHeight > target.clientHeight;
                      const isNearTop = target.scrollTop < 50;
                      setShowScrollIndicator(hasMore && isNearTop);
                    }}
                  >
                  <table className="w-full">
                    <thead className="sticky top-0 bg-white z-10 border-b shadow-sm">
                      <tr>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Customer</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Contact</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Balance (AR)</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Overdue</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Payment Terms</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 bg-gray-50">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div
                              className="cursor-pointer"
                              onClick={() => openViewDialog(customer)}
                            >
                              <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">{customer.name}</p>
                              <p className="text-xs text-gray-500">{customer.id}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {customer.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                                  <span className="truncate max-w-[200px]" title={customer.email}>{customer.email}</span>
                                </div>
                              )}
                              {customer.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                                  {customer.phone}
                                </div>
                              )}
                              {!customer.email && !customer.phone && (
                                <span className="text-sm text-gray-400">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(customer.status)}>
                              {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            R{(customer.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-3 px-4">
                            <span className={(customer.overdueAmount || 0) > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                              R{(customer.overdueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{customer.paymentTerms || 0} days</td>
                          <td className="py-3 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => e.stopPropagation()}
                                  className="hover:bg-gray-100"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onSelect={() => openViewDialog(customer)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => openEditDialog(customer)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onSelect={() => openDeleteDialog(customer)}
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

          {/* Overdue Customers Alert */}
          {customers.filter(c => (c.overdueAmount || 0) > 0).length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Overdue Accounts</CardTitle>
                <CardDescription>
                  Customers with overdue payments requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers
                    .filter(c => (c.overdueAmount || 0) > 0)
                    .map((customer) => (
                      <div key={customer.id} className="flex items-center justify-between p-4 border border-orange-200 rounded-lg bg-orange-50">
                        <div className="flex items-center space-x-3">
                          <div className="h-2 w-2 rounded-full bg-orange-500" />
                          <div>
                            <p className="font-medium">{customer.name}</p>
                            <p className="text-sm text-gray-600">
                              {customer.paymentTerms} days payment terms
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-orange-600">R{customer.overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          <p className="text-sm text-gray-500">Overdue</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create Customer Dialog */}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Enter customer details to create a new account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onCreateSubmit)}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="Enter customer name"
                      error={errors.name?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="customer@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+27 12 345 6789"
                      icon={<Phone className="h-4 w-4" />}
                      error={errors.phone?.message}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      {...register('address')}
                      placeholder="Enter customer address"
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                    <Input
                      id="taxId"
                      {...register('taxId')}
                      placeholder="Enter tax ID"
                      icon={<FileText className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="creditLimit">Credit Limit (R)</Label>
                    <Controller
                      name="creditLimit"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="0.00"
                          icon={<CreditCard className="h-4 w-4" />}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={errors.creditLimit?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentTerms">Payment Terms (days)</Label>
                    <Controller
                      name="paymentTerms"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="30"
                          icon={<Calendar className="h-4 w-4" />}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          error={errors.paymentTerms?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="blocked">Blocked</option>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...register('notes')}
                      placeholder="Additional notes about this customer"
                      className="resize-none"
                      rows={3}
                    />
                  </div>

                  {/* Primary Contact Section */}
                  <div className="col-span-2 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Primary Contact (Optional)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="primaryContactName">Contact Name</Label>
                        <Input
                          id="primaryContactName"
                          {...register('primaryContactName')}
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <Label htmlFor="primaryContactPosition">Position</Label>
                        <Input
                          id="primaryContactPosition"
                          {...register('primaryContactPosition')}
                          placeholder="e.g., CEO, Manager"
                        />
                      </div>
                      <div>
                        <Label htmlFor="primaryContactEmail">Email</Label>
                        <Input
                          id="primaryContactEmail"
                          type="email"
                          {...register('primaryContactEmail')}
                          placeholder="john@example.com"
                        />
                        {errors.primaryContactEmail && (
                          <p className="text-sm text-red-600 mt-1">{errors.primaryContactEmail.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="primaryContactPhone">Phone</Label>
                        <Input
                          id="primaryContactPhone"
                          {...register('primaryContactPhone')}
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
                      reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Creating...
                      </>
                    ) : (
                      'Create Customer'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Edit Customer Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Customer</DialogTitle>
                <DialogDescription>
                  Update customer information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onEditSubmit)}>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="col-span-2">
                    <Label htmlFor="edit-name">Customer Name *</Label>
                    <Input
                      id="edit-name"
                      {...register('name')}
                      placeholder="Enter customer name"
                      error={errors.name?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email</Label>
                    <Input
                      id="edit-email"
                      type="email"
                      {...register('email')}
                      placeholder="customer@example.com"
                      icon={<Mail className="h-4 w-4" />}
                      error={errors.email?.message}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      {...register('phone')}
                      placeholder="+27 12 345 6789"
                      icon={<Phone className="h-4 w-4" />}
                      error={errors.phone?.message}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-address">Address</Label>
                    <Textarea
                      id="edit-address"
                      {...register('address')}
                      placeholder="Enter customer address"
                      className="resize-none"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-taxId">Tax ID / VAT Number</Label>
                    <Input
                      id="edit-taxId"
                      {...register('taxId')}
                      placeholder="Enter tax ID"
                      icon={<FileText className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-creditLimit">Credit Limit (R)</Label>
                    <Controller
                      name="creditLimit"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="0.00"
                          icon={<CreditCard className="h-4 w-4" />}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          error={errors.creditLimit?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-paymentTerms">Payment Terms (days)</Label>
                    <Controller
                      name="paymentTerms"
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="number"
                          placeholder="30"
                          icon={<Calendar className="h-4 w-4" />}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          error={errors.paymentTerms?.message}
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                          <option value="blocked">Blocked</option>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-notes">Notes</Label>
                    <Textarea
                      id="edit-notes"
                      {...register('notes')}
                      placeholder="Additional notes about this customer"
                      className="resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(false);
                      setSelectedCustomer(null);
                      reset();
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting || !isValid}>
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Updating...
                      </>
                    ) : (
                      'Update Customer'
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
                <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{selectedCustomer?.name}</strong>?
                  This action cannot be undone and will permanently remove the customer
                  from your system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  onClick={() => {
                    setIsDeleteDialogOpen(false);
                    setSelectedCustomer(null);
                  }}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Customer'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* View Customer Details Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Customer Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedCustomer?.name}
                </DialogDescription>
              </DialogHeader>
              {selectedCustomer && (
                <div className="py-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <Label className="text-gray-500">Customer Name</Label>
                      <p className="font-medium mt-1">{selectedCustomer.name}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedCustomer.status)}>
                          {selectedCustomer.status.charAt(0).toUpperCase() + selectedCustomer.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-500">Email</Label>
                      <p className="mt-1">{selectedCustomer.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Phone</Label>
                      <p className="mt-1">{selectedCustomer.phone || 'Not provided'}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-gray-500">Address</Label>
                      <p className="mt-1">{selectedCustomer.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Tax ID / VAT Number</Label>
                      <p className="mt-1">{selectedCustomer.taxId || 'Not provided'}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Credit Limit</Label>
                      <p className="mt-1 font-medium">
                        R{(selectedCustomer.creditLimit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Current Balance (AR)</Label>
                      <p className="mt-1 font-medium">
                        R{(selectedCustomer.currentBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Overdue Amount</Label>
                      <p className={`mt-1 font-medium ${(selectedCustomer.overdueAmount || 0) > 0 ? 'text-orange-600' : ''}`}>
                        R{(selectedCustomer.overdueAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Payment Terms</Label>
                      <p className="mt-1">{selectedCustomer.paymentTerms} days</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Customer ID</Label>
                      <p className="mt-1 text-sm text-gray-600">{selectedCustomer.id}</p>
                    </div>
                    {selectedCustomer.notes && (
                      <div className="col-span-2">
                        <Label className="text-gray-500">Notes</Label>
                        <p className="mt-1">{selectedCustomer.notes}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-500">Created Date</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Last Updated</Label>
                      <p className="mt-1 text-sm">
                        {new Date(selectedCustomer.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Primary Contact Section */}
                  <div className="mt-6 pt-6 border-t">
                    <PrimaryContactForm
                      companyId={companyId}
                      debtorId={selectedCustomer.id}
                      initialData={selectedCustomer.primaryContact}
                      onSuccess={loadCustomers}
                      inline
                    />
                  </div>

                  {/* Financial Contacts Section */}
                  <div className="mt-6">
                    <FinancialContactsManager
                      companyId={companyId}
                      debtorId={selectedCustomer.id}
                      onContactsChange={loadCustomers}
                    />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setSelectedCustomer(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    openEditDialog(selectedCustomer!);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Customer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </WorkspaceLayout>
    </ProtectedRoute>
  );
}