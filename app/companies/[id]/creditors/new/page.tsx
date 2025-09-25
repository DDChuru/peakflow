'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { creditorService, adminService } from '@/lib/firebase';
import { Company } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/navigation';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Banknote,
  Calendar,
  FileText,
  Save,
  X
} from 'lucide-react';

export default function NewCreditorPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const companyId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    accountNumber: '',
    bankDetails: {
      bankName: '',
      branchCode: '',
      swiftCode: ''
    },
    paymentTerms: 30,
    status: 'active' as 'active' | 'inactive',
    category: '',
    notes: ''
  });

  // Common categories for creditors
  const commonCategories = [
    'Supplier',
    'Contractor',
    'Service Provider',
    'Utility',
    'Rent/Lease',
    'Insurance',
    'Professional Services',
    'Government',
    'Other'
  ];

  useEffect(() => {
    if (companyId && user) {
      fetchCompany();
    }
  }, [companyId, user]);

  const fetchCompany = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching company:', error);
      toast.error('Failed to load company information');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to add a creditor');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a creditor name');
      return;
    }

    try {
      setLoading(true);

      // Only include bank details if at least bank name is provided
      const bankDetails = formData.bankDetails.bankName ? formData.bankDetails : undefined;

      await creditorService.createCreditor(
        companyId,
        {
          ...formData,
          bankDetails,
          currentBalance: 0,
          createdBy: user.uid
        },
        user.uid
      );

      toast.success('Creditor created successfully');
      router.push(`/companies/${companyId}/creditors`);
    } catch (error) {
      console.error('Error creating creditor:', error);
      toast.error('Failed to create creditor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    // Handle nested bank details
    if (name.startsWith('bankDetails.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [field]: value
        }
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
        <PageHeader
          title="Add New Creditor"
          subtitle="Create a new creditor account"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Creditors', href: `/companies/${companyId}/creditors` },
            { label: 'New' }
          ]}
          backHref={`/companies/${companyId}/creditors`}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building2 className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input
                        name="name"
                        label="Creditor Name *"
                        icon={<Building2 className="h-4 w-4" />}
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Enter creditor name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="">Select a category</option>
                        {commonCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Input
                        type="email"
                        name="email"
                        label="Email"
                        icon={<Mail className="h-4 w-4" />}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="creditor@example.com"
                      />
                    </div>

                    <div>
                      <Input
                        type="tel"
                        name="phone"
                        label="Phone"
                        icon={<Phone className="h-4 w-4" />}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <textarea
                          name="address"
                          rows={3}
                          value={formData.address}
                          onChange={handleChange}
                          className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                          placeholder="Enter full address"
                        />
                      </div>
                    </div>

                    <div>
                      <Input
                        name="taxId"
                        label="Tax ID"
                        value={formData.taxId}
                        onChange={handleChange}
                        placeholder="Tax identification number"
                      />
                    </div>

                    <div>
                      <Input
                        name="accountNumber"
                        label="Account Number"
                        icon={<CreditCard className="h-4 w-4" />}
                        value={formData.accountNumber}
                        onChange={handleChange}
                        placeholder="Vendor account number"
                      />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Banknote className="h-5 w-5 mr-2" />
                    Banking Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Input
                        name="bankDetails.bankName"
                        label="Bank Name"
                        icon={<Banknote className="h-4 w-4" />}
                        value={formData.bankDetails.bankName}
                        onChange={handleChange}
                        placeholder="Enter bank name"
                      />
                    </div>

                    <div>
                      <Input
                        name="bankDetails.branchCode"
                        label="Branch Code"
                        value={formData.bankDetails.branchCode}
                        onChange={handleChange}
                        placeholder="Branch/routing code"
                      />
                    </div>

                    <div>
                      <Input
                        name="bankDetails.swiftCode"
                        label="SWIFT Code"
                        value={formData.bankDetails.swiftCode}
                        onChange={handleChange}
                        placeholder="SWIFT/BIC code"
                      />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        name="paymentTerms"
                        label="Payment Terms (days)"
                        icon={<Calendar className="h-4 w-4" />}
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        min={0}
                        placeholder="30"
                      />
                      <p className="mt-1 text-xs text-gray-500">Number of days for payment</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Additional Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      name="notes"
                      rows={4}
                      value={formData.notes}
                      onChange={handleChange}
                      className="pl-10 w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
                      placeholder="Any additional notes about this creditor..."
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex justify-end space-x-3 pt-6"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/creditors`)}
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Create Creditor
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}