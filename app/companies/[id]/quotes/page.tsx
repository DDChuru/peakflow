'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { quoteService, adminService } from '@/lib/firebase';
import { Company, Quote, QuoteFilters, QuoteStatus } from '@/lib/firebase';
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
  XCircle,
  RefreshCw,
  Timer,
  Target,
  Percent
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function CompanyQuotesPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<'all' | '30' | '60' | '90'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    if (companyId && user) {
      fetchCompanyAndQuotes();
    }
  }, [companyId, user]);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, statusFilter, dateRange]);

  const fetchCompanyAndQuotes = async () => {
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

      const quotesList = await quoteService.getQuotes(companyId);
      setQuotes(quotesList);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  const filterQuotes = () => {
    let filtered = [...quotes];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.quoteNumber.toLowerCase().includes(search) ||
        quote.customerName.toLowerCase().includes(search) ||
        quote.notes?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(quote => new Date(quote.quoteDate) >= cutoffDate);
    }

    setFilteredQuotes(filtered);
  };

  const exportQuotes = () => {
    const csv = [
      ['Quote Number', 'Customer', 'Date', 'Valid Until', 'Amount', 'Status', 'Version'],
      ...filteredQuotes.map(quote => [
        quote.quoteNumber,
        quote.customerName,
        new Date(quote.quoteDate).toLocaleDateString(),
        new Date(quote.validUntil).toLocaleDateString(),
        quote.totalAmount.toString(),
        quote.status,
        quote.version.toString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quotes-${companyId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadgeVariant = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'sent': return 'default';
      case 'draft': return 'secondary';
      case 'rejected': return 'destructive';
      case 'expired': return 'warning';
      case 'converted': return 'success';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: QuoteStatus) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'sent': return <Send className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'expired': return <Timer className="h-4 w-4" />;
      case 'converted': return <RefreshCw className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isExpiringSoon = (quote: Quote) => {
    const today = new Date();
    const validUntil = new Date(quote.validUntil);
    const daysUntilExpiry = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0 && quote.status === 'sent';
  };

  const stats = {
    total: quotes.length,
    totalValue: quotes.reduce((sum, quote) => sum + quote.totalAmount, 0),
    openValue: quotes.filter(quote => ['draft', 'sent'].includes(quote.status)).reduce((sum, quote) => sum + quote.totalAmount, 0),
    conversionRate: quotes.length > 0 ? (quotes.filter(quote => quote.status === 'converted').length / quotes.filter(quote => ['sent', 'accepted', 'converted', 'rejected', 'expired'].length > 0).length) * 100 : 0,
    expiringSoon: quotes.filter(isExpiringSoon).length,
    thisMonth: quotes.filter(quote => {
      const quoteDate = new Date(quote.quoteDate);
      const now = new Date();
      return quoteDate.getMonth() === now.getMonth() && quoteDate.getFullYear() === now.getFullYear();
    }).length
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
          title="Quotes"
          subtitle={`${filteredQuotes.length} quote${filteredQuotes.length !== 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Quotes' }
          ]}
          backHref={`/companies/${companyId}/financial-dashboard`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportQuotes}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href={`/companies/${companyId}/quotes/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Create Quote</span>
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-gray-50 border-gray-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Quotes</p>
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
                      <p className="text-sm text-gray-500">Open Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats.openValue)}
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
              <Card className="bg-gradient-to-br from-white to-yellow-50 border-yellow-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Expiring Soon</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.expiringSoon}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
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
                      <p className="text-sm text-gray-500">Conversion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.conversionRate.toFixed(1)}%
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <Percent className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">This Month</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.thisMonth}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
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
                  placeholder="Search by quote number, customer, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="lg:flex-1"
                />
                <div className="flex flex-wrap gap-2">
                  {(['all', 'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'] as const).map((status) => (
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
                    Showing {filteredQuotes.length} of {quotes.length} quotes
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

          {/* Quotes Grid */}
          <AnimatePresence mode="wait">
            {filteredQuotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No quotes found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create your first quote to get started'}
                </p>
                {!searchTerm && (
                  <Link href={`/companies/${companyId}/quotes/new`}>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create First Quote
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredQuotes.map((quote, index) => (
                  <motion.div
                    key={quote.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      hover
                      className="overflow-hidden group cursor-pointer relative"
                      onClick={() => router.push(`/companies/${companyId}/quotes/${quote.id}`)}
                    >
                      {isExpiringSoon(quote) && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="warning" size="sm" pulse>
                            <Timer className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {quote.quoteNumber}
                              {quote.version > 1 && (
                                <Badge variant="secondary" size="sm">
                                  v{quote.version}
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>{quote.customerName}</CardDescription>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(quote.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(quote.status)}
                            {quote.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Quote Date</span>
                            <span>{new Date(quote.quoteDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Valid Until</span>
                            <span className={cn(
                              new Date(quote.validUntil) < new Date() && quote.status === 'sent'
                                ? 'text-red-600 font-medium' : ''
                            )}>
                              {new Date(quote.validUntil).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">Quote Amount</span>
                              <span className="text-lg font-semibold">
                                {formatCurrency(quote.totalAmount)}
                              </span>
                            </div>
                            {quote.convertedToInvoiceId && (
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-600">Converted</span>
                                <span className="text-sm font-semibold text-green-600">
                                  Invoice Created
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(quote.updatedAt)}
                            </span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/companies/${companyId}/quotes/${quote.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {quote.status === 'draft' && (
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