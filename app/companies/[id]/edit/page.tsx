'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { IndustryTemplateService } from '@/lib/accounting/industry-template-service';
import { INDUSTRY_TEMPLATES } from '@/lib/accounting/industry-knowledge-base';
import { Company } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/ui/image-upload';
import { CompanyConfigForm } from '@/components/company/CompanyConfigForm';

const companyEditSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  industry: z.string().min(1, 'Please select an industry'),
  domain: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  vatNumber: z.string().optional()
});

type CompanyEditData = z.infer<typeof companyEditSchema>;

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const companiesService = new CompaniesService();

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CompanyEditData>({
    resolver: zodResolver(companyEditSchema)
  });

  const watchIndustry = watch('industry');
  const watchName = watch('name');

  useEffect(() => {
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    try {
      const companyData = await companiesService.getCompanyById(companyId);
      if (!companyData) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }

      setCompany(companyData);

      // Set form values
      setValue('name', companyData.name);
      setValue('industry', companyData.industry || '');
      setValue('domain', companyData.domain || '');
      setValue('description', companyData.description || '');
      setValue('address', companyData.address || '');
      setValue('phone', companyData.phone || '');
      setValue('email', companyData.email || '');
      setValue('logoUrl', companyData.logoUrl || '');
      setValue('vatNumber', companyData.vatNumber || '');
    } catch (error) {
      console.error('Error loading company:', error);
      toast.error('Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompanyEditData) => {
    if (!user) return;

    try {
      setUpdating(true);

      // Check if industry changed
      const industryChanged = company?.industry !== data.industry;

      // Update company basic info
      await companiesService.updateCompany(companyId, {
        name: data.name,
        industry: data.industry,
        domain: data.domain,
        description: data.description,
        address: data.address,
        phone: data.phone,
        email: data.email,
        logoUrl: data.logoUrl,
        vatNumber: data.vatNumber
      });

      // If industry changed, show reset modal
      if (industryChanged) {
        toast.success('Company updated. Reset COA to apply new industry template.');
        setShowResetModal(true);
        // Reload company to update state
        await loadCompany();
      } else {
        toast.success('Company updated successfully');
        router.push('/companies');
      }
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Failed to update company');
    } finally {
      setUpdating(false);
    }
  };

  const handleResetCOA = async () => {
    if (!user || !company) return;

    try {
      setResetting(true);
      const toastId = toast.loading('Resetting Chart of Accounts...');

      // Debug: Log user authentication info
      console.log('[COA Reset] User UID:', user.uid);
      console.log('[COA Reset] User email:', user.email);
      console.log('[COA Reset] User roles:', user.roles);
      console.log('[COA Reset] User companyId:', user.companyId);
      console.log('[COA Reset] Target company ID:', companyId);
      console.log('[COA Reset] Selected industry:', watchIndustry);

      const templateService = new IndustryTemplateService(companyId);
      const result = await templateService.resetAndApplyTemplate({
        companyId,
        industryId: watchIndustry,
        includePatterns: true,
        includeVendors: true,
        createdBy: user.uid
      });

      console.log('[COA Reset] Result:', result);

      // Show success message with details
      if (result.created.accountsCreated > 0) {
        const successMsg = `✅ Chart of Accounts Created!\n\n` +
          `• Deleted: ${result.deleted.accountsDeleted} old accounts\n` +
          `• Created: ${result.created.accountsCreated} new accounts\n` +
          `• Patterns: ${result.created.patternsCreated} transaction patterns\n` +
          `• Vendors: ${result.created.vendorsCreated} vendor mappings`;

        toast.success(successMsg, { id: toastId, duration: 7000 });

        // Show warnings if some parts failed
        if (result.errors.length > 0) {
          setTimeout(() => {
            toast(
              `⚠️ Note: ${result.errors.length} warnings occurred. Check console for details.\n\n` +
              `Bank-to-ledger import will work, but auto-mapping may be limited.`,
              {
                duration: 8000,
                icon: '⚠️',
                style: {
                  border: '1px solid #f59e0b',
                  background: '#fffbeb',
                  color: '#92400e'
                }
              }
            );
          }, 1000);
        }
      } else {
        toast.error('Failed to create Chart of Accounts', { id: toastId });
      }

      setShowResetModal(false);
      router.push('/companies');
    } catch (error) {
      console.error('[COA Reset] Error:', error);
      toast.error('Failed to reset COA: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={['admin', 'developer']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-lg">Loading company...</div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link href="/companies" className="inline-flex items-center text-blue-600 hover:text-blue-800">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Companies
            </Link>
          </div>

          <h1 className="text-3xl font-bold mb-6">Edit Company</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>Update basic company details and industry settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name */}
                <div>
                  <Label htmlFor="name">Company Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Enter company name"
                    className="mt-1"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Industry */}
                <div>
                  <Label htmlFor="industry">
                    Industry Type *
                    {company?.industry && company.industry !== watchIndustry && (
                      <span className="ml-2 text-xs text-amber-600">
                        (Changing from {INDUSTRY_TEMPLATES[company.industry]?.name})
                      </span>
                    )}
                  </Label>
                  <select
                    id="industry"
                    {...register('industry')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select industry...</option>
                    {Object.entries(INDUSTRY_TEMPLATES).map(([key, template]) => (
                      <option key={key} value={key}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                  {errors.industry && (
                    <p className="text-sm text-red-600 mt-1">{errors.industry.message}</p>
                  )}
                </div>

                {/* Other fields: domain, email, phone, address, description, logoUrl */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      {...register('domain')}
                      placeholder="example.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="contact@example.com"
                      className="mt-1"
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vatNumber">VAT/Tax Number</Label>
                    <Input
                      id="vatNumber"
                      {...register('vatNumber')}
                      placeholder="e.g., 4123456789"
                      className="mt-1"
                    />
                  </div>
                  <div className="col-span-2">
                    <ImageUpload
                      value={watch('logoUrl')}
                      onChange={(url) => {
                        setValue('logoUrl', url || '');
                        console.log('📸 Logo uploaded - URL:', url ? 'YES' : 'NO');
                      }}
                      onError={(error) => toast.error(error)}
                      storagePath="company-logos"
                      maxSizeMB={2}
                      aspectRatio="1:1"
                      label="Company Logo"
                      description="Upload your company logo for invoices, quotes, and reports"
                    />
                    {errors.logoUrl && (
                      <p className="text-sm text-red-600 mt-1">{errors.logoUrl.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <textarea
                    id="address"
                    {...register('address')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="123 Main St, City, State"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    {...register('description')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief company description..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reset COA Section */}
            {company?.industry && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <AlertTriangle className="h-6 w-6 text-amber-600 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-900 mb-2">
                        Reset Chart of Accounts
                      </h3>
                      <p className="text-sm text-amber-800 mb-4">
                        This will delete all existing GL accounts, transaction patterns, and vendor mappings,
                        then re-apply the selected industry template. This action cannot be undone.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowResetModal(true)}
                        className="border-amber-600 text-amber-700 hover:bg-amber-100"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset & Re-apply Template
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/companies')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? 'Updating...' : 'Update Company'}
              </Button>
            </div>
          </form>

          {/* Company Configuration Section */}
          <CompanyConfigForm
            companyId={companyId}
            initialCurrency={company?.defaultCurrency}
            initialVatPercentage={company?.vatPercentage}
            onSuccess={loadCompany}
          />
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Trash2 className="h-6 w-6 text-red-600" />
                <CardTitle>Reset Chart of Accounts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                This will permanently delete:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>All GL accounts</li>
                <li>All transaction matching patterns</li>
                <li>All vendor mappings</li>
                <li>Industry configuration</li>
              </ul>
              <p className="text-gray-700">
                Then apply the <strong>{INDUSTRY_TEMPLATES[watchIndustry]?.name}</strong> template with:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>{INDUSTRY_TEMPLATES[watchIndustry]?.chartOfAccounts?.length || 0} new GL accounts</li>
                <li>{INDUSTRY_TEMPLATES[watchIndustry]?.transactionPatterns?.length || 0} transaction patterns</li>
                <li>{INDUSTRY_TEMPLATES[watchIndustry]?.commonVendors?.length || 0} vendor mappings</li>
              </ul>
              <p className="text-red-600 font-semibold">
                This action cannot be undone!
              </p>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowResetModal(false)}
                  disabled={resetting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleResetCOA}
                  disabled={resetting}
                  className="flex-1"
                >
                  {resetting ? 'Resetting...' : 'Reset COA'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </ProtectedRoute>
  );
}
