'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { invoiceService, adminService } from '@/lib/firebase';
import { Company, Invoice, InvoiceFilters, InvoiceStatus } from '@/lib/firebase';
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
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Eye,
  Edit2,
  Send,
  Receipt,
  Copy,
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

interface CompanyInvoicesPageProps {
  companyId?: string;
}

export default function CompanyInvoicesPage({ companyId: propCompanyId }: CompanyInvoicesPageProps = {}) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = propCompanyId || (params.id as string);

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30' | '60' | '90'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (companyId && user) {
      fetchCompanyAndInvoices();
    }
  }, [companyId, user]);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, dateRange]);

  const fetchCompanyAndInvoices = async () => {
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

      const invoicesList = await invoiceService.getInvoices(companyId);
      setInvoices(invoicesList);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(search) ||
        inv.customerName.toLowerCase().includes(search) ||
        inv.purchaseOrderNumber?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(inv => inv.status === statusFilter);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(inv => new Date(inv.invoiceDate) >= cutoffDate);
    }

    setFilteredInvoices(filtered);
  };

  const exportInvoices = () => {
    const csv = [
      ['Invoice Number', 'Customer', 'Date', 'Due Date', 'Amount', 'Status'],
      ...filteredInvoices.map(inv => [
        inv.invoiceNumber,
        inv.customerName,
        new Date(inv.invoiceDate).toLocaleDateString(),
        new Date(inv.dueDate).toLocaleDateString(),
        inv.totalAmount.toString(),
        inv.status
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${companyId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadgeVariant = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'overdue': return 'destructive';
      case 'partial': return 'warning';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'partial': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const stats = {
    total: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
    outstanding: invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.amountDue, 0),
    overdue: invoices.filter(inv => {
      if (inv.status === 'paid' || inv.status === 'cancelled') return false;
      return new Date(inv.dueDate) < new Date();
    }).reduce((sum, inv) => sum + inv.amountDue, 0),
    thisMonth: invoices.filter(inv => {
      const invoiceDate = new Date(inv.invoiceDate);
      const now = new Date();
      return invoiceDate.getMonth() === now.getMonth() && invoiceDate.getFullYear() === now.getFullYear();
    }).reduce((sum, inv) => sum + inv.totalAmount, 0)
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
          title="Invoices"
          subtitle={`${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Invoices' }
          ]}
          backHref={`/companies/${companyId}/financial-dashboard`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportInvoices}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href={`/companies/${companyId}/invoices/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Invoice</span>
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Invoices</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-indigo-600" />
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
              <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Outstanding</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.outstanding)}
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
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-gradient-to-br from-white to-red-50 border-red-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Overdue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.overdue)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-red-600" />
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
              <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.thisMonth)}
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-green-600" />
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
                  placeholder="Search by invoice number, customer, or PO..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="lg:flex-1"
                />
                <div className="flex flex-wrap gap-2">
                  {(['all', 'draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'] as const).map((status) => (
                    <Button
                      key={status}
                      variant={statusFilter === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatusFilter(status)}
                      className="capitalize"
                    >
                      {status === 'all' ? 'All Status' : status}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  {(['all', '30', '60', '90'] as const).map((range) => (
                    <Button
                      key={range}
                      variant={dateRange === range ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setDateRange(range)}
                    >
                      {range === 'all' ? 'All Time' : `${range} days`}
                    </Button>
                  ))}
                </div>
              </div>
              {(searchTerm || statusFilter !== 'all' || dateRange !== 'all') && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    Showing {filteredInvoices.length} of {invoices.length} invoices
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setDateRange('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Invoices Grid */}
          <AnimatePresence mode="wait">
            {filteredInvoices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create your first invoice to get started'}
                </p>
                {!searchTerm && (
                  <Link href={`/companies/${companyId}/invoices/new`}>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create First Invoice
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      hover
                      className="overflow-hidden group cursor-pointer"
                      onClick={() => router.push(`/companies/${companyId}/invoices/${invoice.id}`)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{invoice.invoiceNumber}</CardTitle>
                            <CardDescription>{invoice.customerName}</CardDescription>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(invoice.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(invoice.status)}
                            {invoice.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Invoice Date</span>
                            <span>{new Date(invoice.invoiceDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Due Date</span>
                            <span className={cn(
                              new Date(invoice.dueDate) < new Date() && invoice.status !== 'paid' && invoice.status !== 'cancelled'
                                ? 'text-red-600 font-medium' : ''
                            )}>
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">Total Amount</span>
                              <span className="text-lg font-semibold">
                                {formatCurrency(invoice.totalAmount)}
                              </span>
                            </div>
                            {invoice.amountDue > 0 && invoice.status !== 'paid' && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-red-600">Amount Due</span>
                                <span className="text-sm font-semibold text-red-600">
                                  {formatCurrency(invoice.amountDue)}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(invoice.updatedAt)}
                            </span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/companies/${companyId}/invoices/${invoice.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {invoice.status === 'draft' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled
                                  title="Edit coming soon"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                disabled
                                title="More actions coming soon"
                              >
                                <MoreVertical className="h-4 w-4" />
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