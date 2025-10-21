'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { adminService, debtorService } from '@/lib/firebase';
import { SLAService } from '@/lib/accounting/sla-service';
import { SLAIntegrationService } from '@/lib/accounting/sla-integration-service';
import { Company, ServiceAgreement, BillingFrequency, SLALineItem } from '@/types/accounting/sla';
import { Debtor } from '@/types/debtor';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadixSelect as Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/ui/navigation';
import { LineItemManager } from '@/components/contracts/LineItemManager';
import {
  CalendarDays,
  Calculator,
  CreditCard,
  FileText,
  Save,
  Send,
  Plus,
  Trash2,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Users,
  Settings
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

// Mock GL accounts - replace with actual chart of accounts service
const mockGLAccounts = [
  { id: 'rev-001', code: '4000', name: 'Professional Services Revenue' },
  { id: 'rev-002', code: '4100', name: 'Software License Revenue' },
  { id: 'rev-003', code: '4200', name: 'Support Services Revenue' },
  { id: 'rev-004', code: '4300', name: 'Consulting Revenue' }
];

export default function NewContractPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [contractValue, setContractValue] = useState(0);
  const [debtors, setDebtors] = useState<Debtor[]>([]);

  const slaService = new SLAService();
  const slaIntegrationService = new SLAIntegrationService(companyId);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      billingFrequency: 'monthly',
      autoGenerateInvoices: true,
      advanceDays: 3,
      currency: 'USD',
      paymentTerms: 30,
      lineItems: [{
        description: '',
        quantity: 1,
        unitPrice: 0,
        glAccountId: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
        unit: 'service'
      }]
    }
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

  // Wrapper function to ensure partial updates don't override existing data
  const handleLineItemUpdate = (index: number, updates: Partial<any>) => {
    const currentItem = lineItemFields[index];
    updateLineItem(index, { ...currentItem, ...updates });
  };

  const watchedLineItems = watch('lineItems');
  const watchedBillingFrequency = watch('billingFrequency');
  const watchedStartDate = watch('startDate');
  const watchedEndDate = watch('endDate');

  useEffect(() => {
    if (companyId && user) {
      fetchCompany();
    }
  }, [companyId, user]);

  useEffect(() => {
    // Calculate total contract value when line items change
    const total = watchedLineItems.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    setContractValue(total);
  }, [watchedLineItems]);

  useEffect(() => {
    // Auto-generate next billing date based on start date and frequency
    if (watchedStartDate && watchedBillingFrequency) {
      const startDate = new Date(watchedStartDate);
      let nextBillingDate = new Date(startDate);

      switch (watchedBillingFrequency) {
        case 'monthly':
          // Next billing date is the start date
          break;
        case 'quarterly':
          // Next billing date is the start date
          break;
        case 'annual':
          // Next billing date is the start date
          break;
        case 'custom':
          // For custom, default to monthly
          break;
      }

      setValue('nextBillingDate', nextBillingDate.toISOString().split('T')[0]);
    }
  }, [watchedStartDate, watchedBillingFrequency, setValue]);

  const fetchCompany = async () => {
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

      // Fetch debtors for this company
      try {
        const companyDebtors = await debtorService.getDebtors(companyId);
        setDebtors(companyDebtors);

        if (companyDebtors.length === 0) {
          toast('No customers found. Please add customers first.');
        }
      } catch (error) {
        console.error('Error fetching debtors:', error);
        toast.error('Failed to load customers');
      }

      // Generate next contract number
      try {
        const existingSLAs = await slaService.getSLAs(companyId);
        const nextNumber = `SLA-${String(existingSLAs.length + 1).padStart(4, '0')}`;
        setValue('contractNumber', nextNumber);
      } catch (error) {
        // If SLAs can't be fetched (permissions), use default
        setValue('contractNumber', 'SLA-0001');
      }

    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ContractFormData, asDraft = false) => {
    if (!user?.uid) return;

    try {
      setSubmitting(true);

      // Validate date range
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);

      if (endDate <= startDate) {
        toast.error('End date must be after start date');
        return;
      }

      // Calculate next billing date
      const nextBillingDate = new Date(startDate);
      switch (data.billingFrequency) {
        case 'monthly':
          if (data.dayOfMonth && data.dayOfMonth >= 1 && data.dayOfMonth <= 31) {
            nextBillingDate.setDate(data.dayOfMonth);
            if (nextBillingDate < startDate) {
              nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            }
          }
          break;
        case 'quarterly':
          nextBillingDate.setMonth(nextBillingDate.getMonth() + 3);
          break;
        case 'annual':
          nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          break;
      }

      // Find the selected customer
      const selectedCustomer = debtors.find(d => d.id === data.customerId);
      if (!selectedCustomer) {
        toast.error('Selected customer not found');
        return;
      }

      // Prepare line items with calculated amounts
      const processedLineItems: Omit<SLALineItem, 'id' | 'createdAt' | 'updatedAt'>[] = data.lineItems.map((item, index) => ({
        ...item,
        amount: item.quantity * item.unitPrice,
        status: 'active' as const,
        recurrence: 'always' as const,
        glAccountCode: mockGLAccounts.find(acc => acc.id === item.glAccountId)?.code,
        glAccountName: mockGLAccounts.find(acc => acc.id === item.glAccountId)?.name
      }));

      const contractData: Omit<ServiceAgreement, 'id' | 'createdAt' | 'updatedAt' | 'companyId'> = {
        ...data,
        customerName: selectedCustomer.name, // Use real customer name
        status: asDraft ? 'draft' : 'active',
        nextBillingDate: nextBillingDate.toISOString().split('T')[0],
        contractValue: contractValue,
        lineItems: processedLineItems as SLALineItem[],
        createdBy: user.uid
      };

      const result = await slaIntegrationService.createSLAWithCustomerIntegration(
        companyId,
        contractData,
        user.uid,
        {
          createCustomerIfNotExists: true,
          validateCustomerCredit: true
        }
      );

      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => toast(warning, { icon: '⚠️' }));
      }

      toast.success(`Contract ${result.sla.contractNumber} ${asDraft ? 'saved as draft' : 'created successfully'}`);
      router.push(`/companies/${companyId}/contracts/${result.sla.id}`);

    } catch (error) {
      console.error('Error creating contract:', error);
      toast.error('Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateMonthlyRecurring = () => {
    switch (watchedBillingFrequency) {
      case 'monthly':
        return contractValue;
      case 'quarterly':
        return contractValue / 3;
      case 'annual':
        return contractValue / 12;
      default:
        return contractValue;
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <PageHeader
          title="New Service Agreement"
          subtitle="Create a new service level agreement contract"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Contracts', href: `/companies/${companyId}/contracts` },
            { label: 'New' }
          ]}
          backHref={`/companies/${companyId}/contracts`}
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit((data) => onSubmit(data, false))} className="space-y-8">

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
                    <Select onValueChange={(value) => {
                      setValue('customerId', value);
                      const customer = debtors.find(c => c.id === value);
                      if (customer) {
                        setValue('customerName', customer.name);
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder={debtors.length > 0 ? "Select customer" : "No customers available"} />
                      </SelectTrigger>
                      <SelectContent>
                        {debtors.length > 0 ? (
                          debtors.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name} {customer.accountNumber && `(${customer.accountNumber})`}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No customers found - Please add customers first
                          </SelectItem>
                        )}
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
                    <Select onValueChange={(value: BillingFrequency) => setValue('billingFrequency', value)}>
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

                  {watchedBillingFrequency === 'monthly' && (
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
                    <Select onValueChange={(value) => setValue('currency', value)}>
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
                    {...register('autoGenerateInvoices')}
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
                  onUpdate={handleLineItemUpdate}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
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
                  Contract Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Contract Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(contractValue)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Per {watchedBillingFrequency || 'period'}
                    </p>
                  </div>

                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-500">Monthly Recurring</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(calculateMonthlyRecurring())}
                    </p>
                    <p className="text-xs text-gray-500">
                      Estimated monthly revenue
                    </p>
                  </div>

                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-500">Line Items</p>
                    <p className="text-2xl font-bold text-green-900">
                      {watchedLineItems.length}
                    </p>
                    <p className="text-xs text-gray-500">
                      Service items included
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
                onClick={() => onSubmit(watch(), true)}
                disabled={submitting}
              >
                <FileText className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button type="submit" disabled={submitting}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {submitting ? 'Creating...' : 'Create & Activate'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
