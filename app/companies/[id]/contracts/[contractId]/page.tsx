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
import { Company, ServiceAgreement, SLALineItemHistory } from '@/types/accounting/sla';
import { BillingSchedule } from '@/components/contracts/BillingSchedule';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/ui/navigation';
import {
  Calendar,
  DollarSign,
  FileText,
  History,
  Receipt,
  Edit2,
  Pause,
  Play,
  MoreVertical,
  AlertCircle,
  CheckCircle,
  Clock,
  Timer,
  Users,
  Calculator,
  TrendingUp,
  Activity,
  Eye,
  Download,
  Send,
  RefreshCw,
  Settings,
  Target,
  CreditCard,
  Percent
} from 'lucide-react';
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils';

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;
  const contractId = params.contractId as string;

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [contract, setContract] = useState<ServiceAgreement | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const slaService = new SLAService();
  const slaIntegrationService = new SLAIntegrationService(companyId);

  useEffect(() => {
    if (companyId && contractId && user) {
      fetchData();
    }
  }, [companyId, contractId, user]);

  const fetchData = async () => {
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

      const contractData = await slaService.getSLA(companyId, contractId);
      if (!contractData) {
        toast.error('Contract not found');
        router.push(`/companies/${companyId}/contracts`);
        return;
      }

      setContract(contractData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusAction = async (action: 'suspend' | 'resume' | 'generate-invoice' | 'renew') => {
    if (!contract || !user?.uid) return;

    try {
      setProcessing(true);

      switch (action) {
        case 'suspend':
          await slaService.updateSLA(companyId, contractId, { status: 'suspended' }, user.uid);
          toast.success('Contract suspended successfully');
          break;
        case 'resume':
          await slaService.updateSLA(companyId, contractId, { status: 'active' }, user.uid);
          toast.success('Contract resumed successfully');
          break;
        case 'generate-invoice':
          // This would integrate with invoice generation service
          toast.success('Invoice generation initiated');
          break;
        case 'renew':
          // Navigate to renewal page
          router.push(`/companies/${companyId}/contracts/${contractId}/renew`);
          return;
      }

      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'draft': return 'secondary';
      case 'suspended': return 'warning';
      case 'expired': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'draft': return <FileText className="h-4 w-4" />;
      case 'suspended': return <Pause className="h-4 w-4" />;
      case 'expired': return <Timer className="h-4 w-4" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isDueSoon = () => {
    if (!contract?.nextBillingDate || contract.status !== 'active') return false;
    const today = new Date();
    const nextBilling = new Date(contract.nextBillingDate);
    const daysUntilBilling = Math.ceil((nextBilling.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilBilling <= 7 && daysUntilBilling >= 0;
  };

  const isExpiringSoon = () => {
    if (!contract) return false;
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const daysUntilExpiry = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0 && contract.status === 'active';
  };

  const calculateMetrics = () => {
    if (!contract) return null;

    const today = new Date();
    const startDate = new Date(contract.startDate);
    const endDate = new Date(contract.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.max(0, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const progress = Math.min(100, (daysPassed / totalDays) * 100);

    // Calculate revenue based on frequency
    let monthlyRecurring = 0;
    let annualValue = 0;

    switch (contract.billingFrequency) {
      case 'monthly':
        monthlyRecurring = contract.contractValue;
        annualValue = contract.contractValue * 12;
        break;
      case 'quarterly':
        monthlyRecurring = contract.contractValue / 3;
        annualValue = contract.contractValue * 4;
        break;
      case 'annual':
        monthlyRecurring = contract.contractValue / 12;
        annualValue = contract.contractValue;
        break;
      default:
        monthlyRecurring = contract.contractValue / 12;
        annualValue = contract.contractValue;
    }

    return {
      totalDays,
      daysPassed,
      daysRemaining,
      progress,
      monthlyRecurring,
      annualValue
    };
  };

  const metrics = calculateMetrics();

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

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-500 mb-6">The requested contract could not be found.</p>
          <Link href={`/companies/${companyId}/contracts`}>
            <Button>Return to Contracts</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title={contract.contractNumber}
          subtitle={contract.contractName}
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Contracts', href: `/companies/${companyId}/contracts` },
            { label: contract.contractNumber }
          ]}
          backHref={`/companies/${companyId}/contracts`}
          actions={
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              {contract.status === 'active' && isDueSoon() && (
                <Button
                  size="sm"
                  onClick={() => handleStatusAction('generate-invoice')}
                  disabled={processing}
                >
                  <Receipt className="h-4 w-4" />
                  <span className="hidden sm:inline">Generate Invoice</span>
                </Button>
              )}
              <Link href={`/companies/${companyId}/contracts/${contractId}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Status Alerts */}
          <AnimatePresence>
            {isDueSoon() && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Card className="border-orange-200 bg-orange-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <h3 className="font-medium text-orange-900">Billing Due Soon</h3>
                          <p className="text-sm text-orange-700">
                            Next billing date: {new Date(contract.nextBillingDate!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStatusAction('generate-invoice')}
                        disabled={processing}
                      >
                        Generate Invoice
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isExpiringSoon() && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6"
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <h3 className="font-medium text-red-900">Contract Expiring Soon</h3>
                          <p className="text-sm text-red-700">
                            End date: {new Date(contract.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStatusAction('renew')}
                        disabled={processing}
                      >
                        Renew Contract
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-white to-blue-50 border-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Contract Value</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(contract.contractValue)}
                      </p>
                      <p className="text-xs text-blue-600 capitalize">
                        Per {contract.billingFrequency}
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
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-gradient-to-br from-white to-green-50 border-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Monthly Recurring</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(metrics?.monthlyRecurring || 0)}
                      </p>
                      <p className="text-xs text-green-600">
                        Estimated monthly revenue
                      </p>
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
              <Card className="bg-gradient-to-br from-white to-purple-50 border-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Days Remaining</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics?.daysRemaining || 0}
                      </p>
                      <p className="text-xs text-purple-600">
                        {metrics?.progress.toFixed(1)}% complete
                      </p>
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
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
              <Card className="bg-gradient-to-br from-white to-indigo-50 border-indigo-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={getStatusBadgeVariant(contract.status)}
                          className="flex items-center gap-1"
                        >
                          {getStatusIcon(contract.status)}
                          {contract.status}
                        </Badge>
                      </div>
                      {contract.nextBillingDate && contract.status === 'active' && (
                        <p className="text-xs text-indigo-600 mt-1">
                          Next: {new Date(contract.nextBillingDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="h-12 w-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Activity className="h-6 w-6 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Contract Progress */}
          {metrics && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Contract Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Start: {new Date(contract.startDate).toLocaleDateString()}</span>
                    <span>{metrics.progress.toFixed(1)}% Complete</span>
                    <span>End: {new Date(contract.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${metrics.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{metrics.daysPassed}</p>
                      <p className="text-sm text-gray-500">Days Passed</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{metrics.daysRemaining}</p>
                      <p className="text-sm text-gray-500">Days Remaining</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{metrics.totalDays}</p>
                      <p className="text-sm text-gray-500">Total Days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabs Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="line-items">Line Items</TabsTrigger>
              <TabsTrigger value="billing">Billing Schedule</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contract Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Contract Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Contract Number</p>
                        <p className="font-medium">{contract.contractNumber}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Customer</p>
                        <p className="font-medium">{contract.customerName}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-medium">{new Date(contract.endDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Billing Frequency</p>
                        <p className="font-medium capitalize">{contract.billingFrequency}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Payment Terms</p>
                        <p className="font-medium">{contract.paymentTerms} days</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Currency</p>
                        <p className="font-medium">{contract.currency}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Auto Generate</p>
                        <p className="font-medium">
                          {contract.autoGenerateInvoices ? 'Yes' : 'No'}
                        </p>
                      </div>
                    </div>
                    {contract.description && (
                      <div>
                        <p className="text-gray-500 text-sm mb-2">Description</p>
                        <p className="text-sm">{contract.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {contract.status === 'active' && (
                      <>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={() => handleStatusAction('suspend')}
                          disabled={processing}
                        >
                          <Pause className="h-4 w-4 mr-2" />
                          Suspend Contract
                        </Button>
                        {isDueSoon() && (
                          <Button
                            className="w-full justify-start"
                            onClick={() => handleStatusAction('generate-invoice')}
                            disabled={processing}
                          >
                            <Receipt className="h-4 w-4 mr-2" />
                            Generate Invoice Now
                          </Button>
                        )}
                      </>
                    )}
                    {contract.status === 'suspended' && (
                      <Button
                        className="w-full justify-start"
                        onClick={() => handleStatusAction('resume')}
                        disabled={processing}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Resume Contract
                      </Button>
                    )}
                    <Button
                      className="w-full justify-start"
                      variant="outline"
                      onClick={() => handleStatusAction('renew')}
                      disabled={processing}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew Contract
                    </Button>
                    <Link href={`/companies/${companyId}/contracts/${contractId}/edit`}>
                      <Button className="w-full justify-start" variant="outline">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit Contract
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="line-items" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Line Items
                    <Badge variant="secondary" className="ml-2">
                      {contract.lineItems.length}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Services and products included in this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contract.lineItems.map((item, index) => (
                      <Card key={item.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                              <h4 className="font-medium text-gray-900">{item.description}</h4>
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-1">{item.notes}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span>Effective: {new Date(item.effectiveFrom).toLocaleDateString()}</span>
                                {item.effectiveTo && (
                                  <span>Until: {new Date(item.effectiveTo).toLocaleDateString()}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Quantity × Unit Price</p>
                              <p className="font-medium">
                                {item.quantity} × {formatCurrency(item.unitPrice)}
                              </p>
                              {item.unit && (
                                <p className="text-xs text-gray-500">{item.unit}</p>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-gray-500">Amount</p>
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(item.amount)}
                              </p>
                              {item.taxRate && (
                                <p className="text-xs text-gray-500">+{item.taxRate}% tax</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900">Total Contract Value</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(contract.contractValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <BillingSchedule
                contract={contract}
                onGenerateInvoice={() => handleStatusAction('generate-invoice')}
                onUpdateBillingDate={(date) => {
                  // Handle billing date update
                  console.log('Update billing date:', date);
                }}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Contract History
                  </CardTitle>
                  <CardDescription>
                    Timeline of changes and activities for this contract
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Contract Created</h4>
                        <p className="text-sm text-gray-600">
                          Initial contract creation with {contract.lineItems.length} line items
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatRelativeTime(contract.createdAt)} by {contract.createdBy}
                        </p>
                      </div>
                    </div>

                    {contract.status === 'active' && (
                      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                          <Activity className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Contract Activated</h4>
                          <p className="text-sm text-gray-600">
                            Contract became active and billing schedule started
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatRelativeTime(contract.updatedAt)}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Placeholder for additional history items */}
                    <div className="text-center py-8 text-gray-500">
                      <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Additional history items will appear here as the contract evolves</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ProtectedRoute>
  );
}