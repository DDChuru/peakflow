'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminService } from '@/lib/firebase';
import { SLAService } from '@/lib/accounting/sla-service';
import { Company, ServiceAgreement, BillingFrequency, SLALineItem } from '@/types/accounting/sla';
import { LineItemManager } from '@/components/contracts/LineItemManager';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/navigation';
import {
  CalendarDays,
  Calculator,
  CreditCard,
  FileText,
  Save,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Settings,
  History
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

const contractSchema = z.object({
  contractNumber: z.string().min(1, 'Contract number is required'),
  contractName: z.string().min(1, 'Contract name is required'),
  customerId: z.string().min(1, 'Customer is required'),
  customerName: z.string().optional(),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  billingFrequency: z.enum(['monthly', 'quarterly', 'annual', 'custom']),
  dayOfMonth: z.number().min(1).max(31).optional(),
  autoGenerateInvoices: z.boolean().default(true),
  advanceDays: z.number().min(0).max(90).default(0),
  currency: z.string().default('USD'),
  paymentTerms: z.number().min(0).max(365).default(30),
  taxRate: z.number().min(0).max(100).optional(),
  department: z.string().optional(),
  projectCode: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lineItems: z.array(z.object({
    id: z.string().optional(),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: z.number().min(0, 'Unit price cannot be negative'),
    glAccountId: z.string().min(1, 'GL Account is required'),
    glAccountCode: z.string().optional(),
    glAccountName: z.string().optional(),
    effectiveFrom: z.string().min(1, 'Effective from date is required'),
    effectiveTo: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
    unit: z.string().optional(),
    category: z.string().optional(),
    notes: z.string().optional()
  })).min(1, 'At least one line item is required')
});

type ContractFormData = z.infer<typeof contractSchema>;

// Mock customer data - replace with actual customer service
const mockCustomers = [
  { id: '1', name: 'Acme Corporation', email: 'billing@acme.com' },
  { id: '2', name: 'TechStart Inc', email: 'finance@techstart.com' },
  { id: '3', name: 'Global Solutions Ltd', email: 'accounts@globalsolutions.com' }
];

// Mock GL accounts - replace with actual chart of accounts service
const mockGLAccounts = [
  { id: 'rev-001', code: '4000', name: 'Professional Services Revenue' },
  { id: 'rev-002', code: '4100', name: 'Software License Revenue' },
  { id: 'rev-003', code: '4200', name: 'Support Services Revenue' },
  { id: 'rev-004', code: '4300', name: 'Consulting Revenue' }
];

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;
  const contractId = params.contractId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [contract, setContract] = useState<ServiceAgreement | null>(null);
  const [contractValue, setContractValue] = useState(0);

  const slaService = new SLAService();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema)
  });

  const {
    fields: lineItemFields,
    append: appendLineItem,
    remove: removeLineItem,
    update: updateLineItem
  } = useFieldArray({
    control,
    name: 'lineItems'
  });

  const watchedLineItems = watch('lineItems');

  useEffect(() => {
    if (companyId && contractId && user) {
      fetchData();
    }
  }, [companyId, contractId, user]);

  useEffect(() => {
    // Calculate total contract value when line items change
    if (watchedLineItems) {
      const total = watchedLineItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);
      setContractValue(total);
    }
  }, [watchedLineItems]);

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

      // Populate form with existing data
      const formData: ContractFormData = {
        contractNumber: contractData.contractNumber,
        contractName: contractData.contractName,
        customerId: contractData.customerId,
        customerName: contractData.customerName,
        description: contractData.description || '',
        startDate: contractData.startDate,
        endDate: contractData.endDate,
        billingFrequency: contractData.billingFrequency,
        dayOfMonth: contractData.dayOfMonth,
        autoGenerateInvoices: contractData.autoGenerateInvoices,
        advanceDays: contractData.advanceDays || 0,
        currency: contractData.currency,
        paymentTerms: contractData.paymentTerms,
        taxRate: contractData.taxRate,
        department: contractData.department,
        projectCode: contractData.projectCode,
        tags: contractData.tags || [],
        lineItems: contractData.lineItems.map(item => ({
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          glAccountId: item.glAccountId,
          glAccountCode: item.glAccountCode,
          glAccountName: item.glAccountName,
          effectiveFrom: item.effectiveFrom,
          effectiveTo: item.effectiveTo,
          taxRate: item.taxRate,
          unit: item.unit,
          category: item.category,
          notes: item.notes
        }))
      };

      reset(formData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load contract data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContractFormData) => {
    if (!user?.uid || !contract) return;

    try {
      setSubmitting(true);

      // Validate date range
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      // Prepare line items with calculated amounts
      const processedLineItems: Partial<SLALineItem>[] = data.lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        glAccountId: item.glAccountId,
        glAccountCode: item.glAccountCode || mockGLAccounts.find(acc => acc.id === item.glAccountId)?.code,
        glAccountName: item.glAccountName || mockGLAccounts.find(acc => acc.id === item.glAccountId)?.name,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
        taxRate: item.taxRate,
        unit: item.unit,
        category: item.category,
        notes: item.notes,
        status: 'active' as const,
        recurrence: 'always' as const
      }));

      const updates: Partial<ServiceAgreement> = {
        contractNumber: data.contractNumber,
        contractName: data.contractName,
        customerId: data.customerId,
        customerName: data.customerName,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        billingFrequency: data.billingFrequency,
        dayOfMonth: data.dayOfMonth,
        autoGenerateInvoices: data.autoGenerateInvoices,
        advanceDays: data.advanceDays,
        currency: data.currency,
        paymentTerms: data.paymentTerms,
        taxRate: data.taxRate,
        department: data.department,
        projectCode: data.projectCode,
        tags: data.tags,
        contractValue: contractValue,
        lineItems: processedLineItems as SLALineItem[]
      };

      await slaService.updateSLA(companyId, contractId, updates, user.uid);

      toast.success(`Contract ${data.contractNumber} updated successfully`);
      router.push(`/companies/${companyId}/contracts/${contractId}`);

    } catch (error) {
      console.error('Error updating contract:', error);
      toast.error('Failed to update contract');
    } finally {
      setSubmitting(false);
    }
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

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Contract Not Found</h2>
          <p className="text-gray-500 mb-6">The requested contract could not be found.</p>
          <Button onClick={() => router.push(`/companies/${companyId}/contracts`)}>
            Return to Contracts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title={`Edit ${contract.contractNumber}`}
          subtitle="Modify service agreement details and billing configuration"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Contracts', href: `/companies/${companyId}/contracts` },
            { label: contract.contractNumber, href: `/companies/${companyId}/contracts/${contractId}` },
            { label: 'Edit' }
          ]}
          backHref={`/companies/${companyId}/contracts/${contractId}`}
          actions={
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/contracts/${contractId}`)}
              >
                Cancel
              </Button>
            </div>
          }
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

            {/* Status Alert */}
            {contract.status !== 'draft' && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Editing Active Contract</h3>
                      <p className="text-sm text-yellow-700">
                        Changes to line items will create a modification history and may affect future billing.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contract Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Contract Details
                </CardTitle>
                <CardDescription>
                  Basic contract information and customer details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Contract Number</Label>
                    <Input
                      id="contractNumber"
                      {...register('contractNumber')}
                      placeholder="SLA-0001"
                    />
                    {errors.contractNumber && (
                      <p className="text-sm text-red-600">{errors.contractNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractName">Contract Name</Label>
                    <Input
                      id="contractName"
                      {...register('contractName')}
                      placeholder="Professional Services Agreement"
                    />
                    {errors.contractName && (
                      <p className="text-sm text-red-600">{errors.contractName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="customerId">Customer</Label>
                    <Select
                      value={watch('customerId')}
                      onValueChange={(value) => {
                        setValue('customerId', value);
                        const customer = mockCustomers.find(c => c.id === value);
                        if (customer) {
                          setValue('customerName', customer.name);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockCustomers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.customerId && (
                      <p className="text-sm text-red-600">{errors.customerId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department (Optional)</Label>
                    <Input
                      id="department"
                      {...register('department')}
                      placeholder="IT Services"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register('startDate')}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register('endDate')}
                    />
                    {errors.endDate && (
                      <p className="text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Describe the services covered by this agreement..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Configuration
                </CardTitle>
                <CardDescription>
                  Set up billing frequency and automation preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="billingFrequency">Billing Frequency</Label>
                    <Select
                      value={watch('billingFrequency')}
                      onValueChange={(value: BillingFrequency) => setValue('billingFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annual">Annual</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {watch('billingFrequency') === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="dayOfMonth">Billing Day of Month</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        {...register('dayOfMonth', { valueAsNumber: true })}
                        placeholder="1"
                      />
                      <p className="text-xs text-gray-500">
                        Day of month to generate invoices (1-31)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="advanceDays">Advance Days</Label>
                    <Input
                      id="advanceDays"
                      type="number"
                      min="0"
                      max="90"
                      {...register('advanceDays', { valueAsNumber: true })}
                      placeholder="3"
                    />
                    <p className="text-xs text-gray-500">
                      Generate invoices X days before billing date
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTerms"
                      type="number"
                      min="0"
                      max="365"
                      {...register('paymentTerms', { valueAsNumber: true })}
                      placeholder="30"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={watch('currency')}
                      onValueChange={(value) => setValue('currency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="USD" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Default Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      {...register('taxRate', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="autoGenerateInvoices"
                    checked={watch('autoGenerateInvoices')}
                    onCheckedChange={(checked) => setValue('autoGenerateInvoices', checked)}
                  />
                  <Label htmlFor="autoGenerateInvoices">Auto-generate invoices</Label>
                  <p className="text-sm text-gray-500">
                    Automatically create invoices based on the billing schedule
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Service Line Items
                </CardTitle>
                <CardDescription>
                  Define the services and pricing for this contract
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LineItemManager
                  lineItems={lineItemFields}
                  glAccounts={mockGLAccounts}
                  onAdd={() => appendLineItem({
                    description: '',
                    quantity: 1,
                    unitPrice: 0,
                    glAccountId: '',
                    effectiveFrom: new Date().toISOString().split('T')[0],
                    unit: 'service'
                  })}
                  onRemove={removeLineItem}
                  onUpdate={updateLineItem}
                  register={register}
                  errors={errors}
                  showEffectiveDates={true}
                  showHistory={contract.status !== 'draft'}
                />

                {errors.lineItems && (
                  <p className="text-sm text-red-600 mt-2">{errors.lineItems.message}</p>
                )}
              </CardContent>
            </Card>

            {/* Contract Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Updated Contract Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">New Contract Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(contractValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Per {watch('billingFrequency') || 'period'}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Original Value</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(contract.contractValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Previous contract value
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Difference</p>
                    <p className={cn(
                      "text-2xl font-bold",
                      contractValue > contract.contractValue ? "text-green-900" :
                      contractValue < contract.contractValue ? "text-red-900" : "text-gray-900"
                    )}>
                      {contractValue > contract.contractValue ? '+' : ''}
                      {formatCurrency(contractValue - contract.contractValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Change in value
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/contracts/${contractId}`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                <Save className="h-4 w-4 mr-2" />
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}