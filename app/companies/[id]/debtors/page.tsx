'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { debtorService, adminService } from '@/lib/firebase';
import { Company, Debtor } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/navigation';
import {
  Search,
  Plus,
  Download,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  AlertCircle,
  User,
  Calendar,
  Edit2,
  Trash2,
  Eye
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function CompanyDebtorsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [debtors, setDebtors] = useState<Debtor[]>([]);
  const [filteredDebtors, setFilteredDebtors] = useState<Debtor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'blocked'>('all');
  const [overdueFilter, setOverdueFilter] = useState(false);
  const [selectedDebtor, setSelectedDebtor] = useState<Debtor | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    if (companyId && user) {
      fetchCompanyAndDebtors();
    }
  }, [companyId, user]);

  useEffect(() => {
    filterDebtors();
  }, [debtors, searchTerm, statusFilter, overdueFilter]);

  const fetchCompanyAndDebtors = async () => {
    try {
      setLoading(true);

      const companies = await adminService.getAllCompanies();
      const currentCompany = companies.find(c => c.id === companyId);

      if (!currentCompany) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      if (user && user.companyId !== companyId && !user.roles.includes('admin')) {
        toast.error('You do not have access to this company');
        router.push('/companies');
        return;
      }

      setCompany(currentCompany);

      const debtorsList = await debtorService.getDebtors(companyId);
      setDebtors(debtorsList);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load debtors');
    } finally {
      setLoading(false);
    }
  };

  const filterDebtors = () => {
    let filtered = [...debtors];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(search) ||
        d.email?.toLowerCase().includes(search) ||
        d.phone?.includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (overdueFilter) {
      filtered = filtered.filter(d => d.overdueAmount > 0);
    }

    setFilteredDebtors(filtered);
  };

  const handleDeleteDebtor = async (debtor: Debtor) => {
    try {
      await debtorService.deleteDebtor(companyId, debtor.id);
      toast.success('Debtor archived successfully');
      fetchCompanyAndDebtors();
    } catch (error) {
      toast.error('Failed to delete debtor');
    }
  };

  const exportDebtors = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Current Balance', 'Overdue Amount', 'Status'],
      ...filteredDebtors.map(d => [
        d.name,
        d.email || '',
        d.phone || '',
        d.currentBalance.toString(),
        d.overdueAmount.toString(),
        d.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debtors-${companyId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: debtors.length,
    active: debtors.filter(d => d.status === 'active').length,
    totalOutstanding: debtors.reduce((sum, d) => sum + d.currentBalance, 0),
    overdueAmount: debtors.reduce((sum, d) => sum + d.overdueAmount, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-indigo-600 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title="Debtors"
          subtitle={`${filteredDebtors.length} account${filteredDebtors.length !== 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Debtors' }
          ]}
          backHref={`/companies/${companyId}/financial-dashboard`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportDebtors}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href={`/companies/${companyId}/debtors/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Debtor</span>
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Debtors</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Active</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.active}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Outstanding</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.totalOutstanding)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-gradient-to-br from-white to-red-50 border-red-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.overdueAmount)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardContent className="space-y-4 p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <Input
                  icon={<Search className="h-4 w-4" />}
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="lg:flex-1"
                />
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'inactive', 'blocked'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                  <Button
                    variant={overdueFilter ? 'destructive' : 'outline'}
                    size="sm"
                    onClick={() => setOverdueFilter(!overdueFilter)}
                  >
                    <AlertCircle className="h-4 w-4" />
                    Overdue
                  </Button>
                </div>
              </div>
              {(searchTerm || statusFilter !== 'all' || overdueFilter) && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    Showing {filteredDebtors.length} of {debtors.length} debtors
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setOverdueFilter(false);
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Debtors Grid */}
          <AnimatePresence mode="wait">
            {filteredDebtors.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No debtors found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Add your first debtor to get started'}
                </p>
                {!searchTerm && (
                  <Link href={`/companies/${companyId}/debtors/new`}>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Add First Debtor
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDebtors.map((debtor, index) => (
                  <motion.div
                    key={debtor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      hover
                      className="overflow-hidden group"
                      onClick={() => setSelectedDebtor(debtor)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold text-lg">
                              {debtor.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{debtor.name}</CardTitle>
                              <CardDescription>{debtor.taxId || 'No Tax ID'}</CardDescription>
                            </div>
                          </div>
                          <Badge
                            variant={
                              debtor.status === 'active' ? 'success' :
                              debtor.status === 'blocked' ? 'destructive' :
                              'secondary'
                            }
                          >
                            {debtor.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-600">
                            {debtor.email && (
                              <div className="flex items-center space-x-1">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <span>{debtor.email}</span>
                              </div>
                            )}
                          </div>
                          {debtor.phone && (
                            <div className="flex items-center text-sm text-gray-600 space-x-1">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span>{debtor.phone}</span>
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">Balance</span>
                              <span className="text-lg font-semibold">
                                {formatCurrency(debtor.currentBalance)}
                              </span>
                            </div>
                            {debtor.overdueAmount > 0 && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-red-600">Overdue</span>
                                <span className="text-sm font-semibold text-red-600">
                                  {formatCurrency(debtor.overdueAmount)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(debtor.updatedAt)}
                            </span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled
                                title="Edit coming soon"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDebtor(debtor);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
