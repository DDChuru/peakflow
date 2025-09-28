'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/firebase';
import { SLAService } from '@/lib/accounting/sla-service';
import { SLAIntegrationService } from '@/lib/accounting/sla-integration-service';
import { Company, ServiceAgreement, SLAStatus, BillingFrequency, SLASummary } from '@/types/accounting/sla';
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
  Calendar,
  DollarSign,
  TrendingUp,
  AlertCircle,
  FileText,
  Eye,
  Edit2,
  Pause,
  Play,
  Receipt,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Timer,
  Target,
  Percent,
  Users,
  CreditCard,
  Activity
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function CompanyContractsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [contracts, setContracts] = useState<ServiceAgreement[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<ServiceAgreement[]>([]);
  const [summary, setSummary] = useState<SLASummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SLAStatus | 'all'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<BillingFrequency | 'all'>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'all' | '30' | '60' | '90'>('all');

  const slaService = new SLAService();
  const slaIntegrationService = new SLAIntegrationService(companyId);

  useEffect(() => {
    if (companyId && user) {
      fetchCompanyAndContracts();
    }
  }, [companyId, user]);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter, frequencyFilter, customerFilter, dateRange]);

  const fetchCompanyAndContracts = async () => {
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

      // Fetch contracts and summary
      const [contractsList, summaryData] = await Promise.all([
        slaService.getSLAs(companyId),
        slaService.getSLASummary(companyId)
      ]);

      setContracts(contractsList);
      setSummary(summaryData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contracts');
    } finally {
      setLoading(false);
    }
  };

  const filterContracts = () => {
    let filtered = [...contracts];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(contract =>
        contract.contractNumber.toLowerCase().includes(search) ||
        contract.contractName.toLowerCase().includes(search) ||
        contract.customerName?.toLowerCase().includes(search) ||
        contract.description?.toLowerCase().includes(search)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    if (frequencyFilter !== 'all') {
      filtered = filtered.filter(contract => contract.billingFrequency === frequencyFilter);
    }

    if (customerFilter !== 'all') {
      filtered = filtered.filter(contract => contract.customerId === customerFilter);
    }

    if (dateRange !== 'all') {
      const days = parseInt(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filtered = filtered.filter(contract => new Date(contract.createdAt) >= cutoffDate);
    }

    setFilteredContracts(filtered);
  };

  const exportContracts = () => {
    const csv = [
      ['Contract Number', 'Customer', 'Start Date', 'End Date', 'Frequency', 'Value', 'Status', 'Next Billing'],
      ...filteredContracts.map(contract => [
        contract.contractNumber,
        contract.customerName || '',
        new Date(contract.startDate).toLocaleDateString(),
        new Date(contract.endDate).toLocaleDateString(),
        contract.billingFrequency,
        contract.contractValue.toString(),
        contract.status,
        contract.nextBillingDate ? new Date(contract.nextBillingDate).toLocaleDateString() : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contracts-${companyId}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleStatusAction = async (contract: ServiceAgreement, action: 'suspend' | 'resume' | 'generate-invoice') => {
    try {
      if (!user?.uid) return;

      switch (action) {
        case 'suspend':
          await slaService.updateSLA(companyId, contract.id, { status: 'suspended' }, user.uid);
          toast.success(`Contract ${contract.contractNumber} suspended`);
          break;
        case 'resume':
          await slaService.updateSLA(companyId, contract.id, { status: 'active' }, user.uid);
          toast.success(`Contract ${contract.contractNumber} resumed`);
          break;
        case 'generate-invoice':
          // This would integrate with invoice generation service
          toast.success(`Invoice generation initiated for ${contract.contractNumber}`);
          break;
      }

      fetchCompanyAndContracts(); // Refresh data
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    }
  };

  const getStatusBadgeVariant = (status: SLAStatus) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'suspended': return 'warning';
      case 'expired': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: SLAStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'suspended': return <Pause className="h-4 w-4" />;
      case 'expired': return <Timer className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFrequencyBadge = (frequency: BillingFrequency) => {
    const colors = {
      monthly: 'bg-blue-100 text-blue-800',
      quarterly: 'bg-purple-100 text-purple-800',
      annual: 'bg-green-100 text-green-800',
      custom: 'bg-orange-100 text-orange-800'
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', colors[frequency])}>
        {frequency}
      </span>
    );
  };

  const isDueSoon = (contract: ServiceAgreement) => {
    if (!contract.nextBillingDate || contract.status !== 'active') return false;
    const today = new Date();
    const nextBilling = new Date(contract.nextBillingDate);
    const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilBilling <= 7 && daysUntilBilling >= 0;
  };

  const isExpiringSoon = (contract: ServiceAgreement) => {
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && contract.status === 'active';
  };

  const uniqueCustomers = Array.from(new Set(contracts.map(c => c.customerId)))
    .map(customerId => {
      const contract = contracts.find(c => c.customerId === customerId);
      return {
        id: customerId,
        name: contract?.customerName || 'Unknown Customer'
      };
    });

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
          title="Service Agreements"
          subtitle={`${filteredContracts.length} contract${filteredContracts.length !== 1 ? 's' : ''}`}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Contracts' }
          ]}
          backHref={`/companies/${companyId}/financial-dashboard`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={exportContracts}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Link href={`/companies/${companyId}/contracts/new`}>
                <Button size="sm">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Contract</span>
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
                      <p className="text-sm text-gray-500">Active Contracts</p>
                      <p className="text-3xl font-bold text-gray-900">{summary?.activeSLAs || 0}</p>
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
                      <p className="text-sm text-gray-500">Monthly Recurring Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(summary?.monthlyRecurringRevenue || 0)}
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
                      <p className="text-sm text-gray-500">Next Billing</p>
                      <p className="text-2xl font-bold text-gray-900">{summary?.nextBillingCount || 0}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-yellow-600" />
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
                      <p className="text-sm text-gray-500">Expiring Soon</p>
                      <p className="text-2xl font-bold text-gray-900">{summary?.expiringSoon || 0}</p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <AlertCircle className="h-6 w-6 text-green-600" />
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
                      <p className="text-sm text-gray-500">Annual Contract Value</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(summary?.totalAnnualValue || 0)}
                      </p>
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
                  placeholder="Search by contract number, name, or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="lg:flex-1"
                />
                <div className="flex flex-wrap gap-2">
                  {(['all', 'active', 'draft', 'suspended', 'expired', 'cancelled'] as const).map((status) => (
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
              </div>

              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 py-2">Frequency:</span>
                  {(['all', 'monthly', 'quarterly', 'annual', 'custom'] as const).map((freq) => (
                    <Button
                      key={freq}
                      variant={frequencyFilter === freq ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFrequencyFilter(freq)}
                      className="capitalize"
                    >
                      {freq === 'all' ? 'All' : freq}
                    </Button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-500 py-2">Customer:</span>
                  <select
                    value={customerFilter}
                    onChange={(e) => setCustomerFilter(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-1 text-sm"
                  >
                    <option value="all">All Customers</option>
                    {uniqueCustomers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(searchTerm || statusFilter !== 'all' || frequencyFilter !== 'all' || customerFilter !== 'all' || dateRange !== 'all') && (
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <p>
                    Showing {filteredContracts.length} of {contracts.length} contracts
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                      setFrequencyFilter('all');
                      setCustomerFilter('all');
                      setDateRange('all');
                    }}
                  >
                    Clear filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contracts Grid */}
          <AnimatePresence mode="wait">
            {filteredContracts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-20"
              >
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FileText className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm ? 'Try adjusting your search criteria' : 'Create your first service agreement to get started'}
                </p>
                {!searchTerm && (
                  <Link href={`/companies/${companyId}/contracts/new`}>
                    <Button>
                      <Plus className="h-4 w-4" />
                      Create First Contract
                    </Button>
                  </Link>
                )}
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredContracts.map((contract, index) => (
                  <motion.div
                    key={contract.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      hover
                      className="overflow-hidden group cursor-pointer relative"
                      onClick={() => router.push(`/companies/${companyId}/contracts/${contract.id}`)}
                    >
                      {isDueSoon(contract) && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="warning" size="sm" pulse>
                            <Clock className="h-3 w-3 mr-1" />
                            Due Soon
                          </Badge>
                        </div>
                      )}

                      {isExpiringSoon(contract) && !isDueSoon(contract) && (
                        <div className="absolute top-2 right-2 z-10">
                          <Badge variant="destructive" size="sm">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Expiring Soon
                          </Badge>
                        </div>
                      )}

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {contract.contractNumber}
                              {getFrequencyBadge(contract.billingFrequency)}
                            </CardTitle>
                            <CardDescription>{contract.contractName}</CardDescription>
                            <p className="text-sm text-gray-600 mt-1">{contract.customerName}</p>
                          </div>
                          <Badge
                            variant={getStatusBadgeVariant(contract.status)}
                            className="flex items-center gap-1"
                          >
                            {getStatusIcon(contract.status)}
                            {contract.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Contract Period</span>
                            <span>
                              {new Date(contract.startDate).toLocaleDateString()} - {new Date(contract.endDate).toLocaleDateString()}
                            </span>
                          </div>

                          {contract.nextBillingDate && contract.status === 'active' && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Next Billing</span>
                              <span className={cn(
                                isDueSoon(contract) ? 'text-orange-600 font-medium' : ''
                              )}>
                                {new Date(contract.nextBillingDate).toLocaleDateString()}
                              </span>
                            </div>
                          )}

                          <div className="pt-3 border-t border-gray-100">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-500">Contract Value</span>
                              <span className="text-lg font-semibold">
                                {formatCurrency(contract.contractValue)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-500">Line Items</span>
                              <span className="text-sm font-medium">
                                {contract.lineItems.length} item{contract.lineItems.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-400">
                              {formatRelativeTime(contract.updatedAt)}
                            </span>
                            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/companies/${companyId}/contracts/${contract.id}`);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/companies/${companyId}/contracts/${contract.id}/edit`);
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              {contract.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusAction(contract, 'suspend');
                                  }}
                                >
                                  <Pause className="h-4 w-4" />
                                </Button>
                              )}
                              {contract.status === 'suspended' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusAction(contract, 'resume');
                                  }}
                                >
                                  <Play className="h-4 w-4" />
                                </Button>
                              )}
                              {contract.status === 'active' && isDueSoon(contract) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusAction(contract, 'generate-invoice');
                                  }}
                                >
                                  <Receipt className="h-4 w-4" />
                                </Button>
                              )}
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