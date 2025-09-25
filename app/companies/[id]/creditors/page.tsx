'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { creditorService, adminService } from '@/lib/firebase';
import { Company, Creditor } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/navigation';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  CreditCard,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  AlertTriangle,
  X,
  ChevronRight,
  Banknote
} from 'lucide-react';
import { cn, formatCurrency, formatDate } from '@/lib/utils';

export default function CompanyCreditorsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [creditors, setCreditors] = useState<Creditor[]>([]);
  const [filteredCreditors, setFilteredCreditors] = useState<Creditor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (companyId && user) {
      fetchCompanyAndCreditors();
    }
  }, [companyId, user]);

  useEffect(() => {
    filterCreditors();
  }, [creditors, searchTerm, statusFilter, categoryFilter]);

  const fetchCompanyAndCreditors = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const companies = await adminService.getAllCompanies();
      const currentCompany = companies.find(c => c.id === companyId);

      if (!currentCompany) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      // Check access
      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('You do not have access to this company');
        router.push('/companies');
        return;
      }

      setCompany(currentCompany);

      // Fetch creditors
      const creditorsList = await creditorService.getCreditors(companyId);
      setCreditors(creditorsList);

      // Extract unique categories
      const uniqueCategories = await creditorService.getCategories(companyId);
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load creditors');
    } finally {
      setLoading(false);
    }
  };

  const filterCreditors = () => {
    let filtered = [...creditors];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search) ||
        c.accountNumber?.includes(search)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    setFilteredCreditors(filtered);
  };

  const handleDeleteCreditor = async (creditorId: string) => {
    try {
      setDeletingId(creditorId);
      await creditorService.deleteCreditor(companyId, creditorId);
      toast.success('Creditor deleted successfully');
      fetchCompanyAndCreditors();
    } catch (error) {
      console.error('Error deleting creditor:', error);
      toast.error('Failed to delete creditor');
    } finally {
      setDeletingId(null);
    }
  };

  const toggleCardExpansion = (creditorId: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(creditorId)) {
      newExpanded.delete(creditorId);
    } else {
      newExpanded.add(creditorId);
    }
    setExpandedCards(newExpanded);
  };

  const exportCreditors = () => {
    const csv = [
      ['Name', 'Category', 'Email', 'Phone', 'Account Number', 'Current Balance', 'Payment Terms', 'Status'],
      ...filteredCreditors.map(c => [
        c.name,
        c.category || '',
        c.email || '',
        c.phone || '',
        c.accountNumber || '',
        c.currentBalance.toString(),
        c.paymentTerms.toString(),
        c.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `creditors-${companyId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
        <div className="animate-pulse">
          <div className="h-20 bg-white border-b border-gray-100" />
          <div className="max-w-7xl mx-auto px-4 py-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalPayable = creditors.reduce((sum, c) => sum + c.currentBalance, 0);
  const activeCount = creditors.filter(c => c.status === 'active').length;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
        <PageHeader
          title="Creditors"
          subtitle={`${filteredCreditors.length} creditor${filteredCreditors.length !== 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Creditors' }
          ]}
          backHref={`/companies/${companyId}/financial-dashboard`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportCreditors}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href={`/companies/${companyId}/creditors/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Creditor</span>
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                <div className="absolute inset-0 bg-grid-white/10" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Payable</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {formatCurrency(totalPayable)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-500 to-emerald-600">
                <div className="absolute inset-0 bg-grid-white/10" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Active Creditors</p>
                      <p className="text-2xl font-bold text-white mt-1">{activeCount}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600">
                <div className="absolute inset-0 bg-grid-white/10" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Categories</p>
                      <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                      <Filter className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-col gap-4 md:flex-row">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search creditors by name, email, or account"
                  icon={<Search className="h-4 w-4" />}
                  className="md:flex-1"
                />
                <div className="flex flex-col gap-4 md:flex-row">
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                    }
                    className="min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="all">All status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="min-w-[160px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="all">All categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {(searchTerm || statusFilter !== 'all' || categoryFilter !== 'all') && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    Showing {filteredCreditors.length} of {creditors.length} creditors
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setCategoryFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Creditors List */}
          <AnimatePresence mode="wait">
            {filteredCreditors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <CreditCard className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No creditors found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first creditor'}
                </p>
                <Link href={`/companies/${companyId}/creditors/new`}>
                  <Button>
                    <Plus className="h-4 w-4" />
                    Add First Creditor
                  </Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreditors.map((creditor, index) => (
                  <motion.div
                    key={creditor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group relative hover:shadow-xl transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-600" />

                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {creditor.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{creditor.name}</h3>
                              <p className="text-sm text-gray-500">
                                {creditor.category || 'Uncategorized'}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={creditor.status === 'active' ? 'success' : 'secondary'}
                            className="animate-fade-in"
                          >
                            {creditor.status}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between py-2 border-t border-gray-100">
                            <span className="text-sm text-gray-500">Current Balance</span>
                            <span className="text-lg font-bold text-gray-900">
                              {formatCurrency(creditor.currentBalance)}
                            </span>
                          </div>

                          {creditor.accountNumber && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Banknote className="h-4 w-4 mr-2 text-gray-400" />
                              Acc: {creditor.accountNumber}
                            </div>
                          )}

                          {creditor.paymentTerms && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                              Payment Terms: {creditor.paymentTerms} days
                            </div>
                          )}

                          {(creditor.email || creditor.phone) && (
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                              {creditor.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  <span className="truncate">{creditor.email}</span>
                                </div>
                              )}
                              {creditor.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  {creditor.phone}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Expandable Details */}
                          {creditor.bankDetails && (creditor.bankDetails.bankName || creditor.bankDetails.branchCode || creditor.bankDetails.swiftCode) && (
                            <div className="pt-2">
                              <button
                                onClick={() => toggleCardExpansion(creditor.id)}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center"
                              >
                                {expandedCards.has(creditor.id) ? 'Hide' : 'Show'} Bank Details
                                <ChevronRight className={cn(
                                  "h-4 w-4 ml-1 transition-transform",
                                  expandedCards.has(creditor.id) && "rotate-90"
                                )} />
                              </button>

                              <AnimatePresence>
                                {expandedCards.has(creditor.id) && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="mt-2 space-y-1 text-sm text-gray-600"
                                  >
                                    {creditor.bankDetails.bankName && (
                                      <div>Bank: {creditor.bankDetails.bankName}</div>
                                    )}
                                    {creditor.bankDetails.branchCode && (
                                      <div>Branch: {creditor.bankDetails.branchCode}</div>
                                    )}
                                    {creditor.bankDetails.swiftCode && (
                                      <div>SWIFT: {creditor.bankDetails.swiftCode}</div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center justify-end space-x-2 pt-3 mt-3 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" disabled title="Edit coming soon">
                              <Edit2 className="h-4 w-4" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCreditor(creditor.id)}
                              disabled={deletingId === creditor.id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === creditor.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ProtectedRoute>
  );
}
