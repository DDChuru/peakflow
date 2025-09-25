'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { debtorService, adminService } from '@/lib/firebase';
import { Company } from '@/lib/firebase';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Calendar,
  FileText,
  Save,
  X,
  DollarSign,
  Search
} from 'lucide-react';

export default function NewDebtorPage() {
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
    creditLimit: 0,
    paymentTerms: 30,
    status: 'active' as 'active' | 'inactive' | 'blocked',
    notes: ''
  });

  // Autocomplete states
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteResults, setAutocompleteResults] = useState<Array<{
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  }>>([]);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (companyId && user) {
      fetchCompany();
    }
  }, [companyId, user]);

  // Mock autocomplete data - replace with actual API call
  useEffect(() => {
    if (formData.name.length > 1) {
      // Simulate API call for autocomplete
      const mockResults = [
        { name: 'Durai Churu', address: '1443 Bokamaso Street', phone: '+1 (555) 000-0000' },
        { name: 'Churu Durai Daniel', address: '998/2 Mubvee street, Norton', phone: '+263 77 813 5629' },
        { name: 'Daniel Mazita', email: 'daniel@orlicron.com' },
        { name: 'Daniel Churu', address: '12 Pretoria Road' },
        { name: 'Durai Daniel Churu', phone: '+263 77 813 5629' }
      ].filter(item =>
        item.name.toLowerCase().includes(formData.name.toLowerCase())
      );
      setAutocompleteResults(mockResults);
      setShowAutocomplete(mockResults.length > 0);
    } else {
      setAutocompleteResults([]);
      setShowAutocomplete(false);
    }
  }, [formData.name]);

  // Handle click outside autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      toast.error('You must be logged in to add a debtor');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('Please enter a debtor name');
      return;
    }

    try {
      setLoading(true);

      await debtorService.createDebtor(
        companyId,
        {
          ...formData,
          currentBalance: 0,
          overdueAmount: 0,
          createdBy: user.uid
        },
        user.uid
      );

      toast.success('Debtor created successfully');
      router.push(`/companies/${companyId}/debtors`);
    } catch (error) {
      console.error('Error creating debtor:', error);
      toast.error('Failed to create debtor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === 'number') {
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

  const handleAutocompleteSelect = (result: typeof autocompleteResults[0]) => {
    setFormData(prev => ({
      ...prev,
      name: result.name,
      address: result.address || prev.address,
      phone: result.phone || prev.phone,
      email: result.email || prev.email
    }));
    setShowAutocomplete(false);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
        <PageHeader
          title="Add New Debtor"
          subtitle="Create a new debtor account"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || '', href: `/companies/${companyId}` },
            { label: 'Debtors', href: `/companies/${companyId}/debtors` },
            { label: 'New' }
          ]}
          backHref={`/companies/${companyId}/debtors`}
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
                    <User className="h-5 w-5 mr-2" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2" ref={autocompleteRef}>
                      <div className="relative">
                        <Input
                          name="name"
                          label="Debtor Name *"
                          icon={<User className="h-4 w-4" />}
                          value={formData.name}
                          onChange={handleChange}
                          required
                          placeholder="Enter debtor name"
                          autoComplete="off"
                        />

                        {/* Autocomplete Dropdown */}
                        <AnimatePresence>
                          {showAutocomplete && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                            >
                              <div className="max-h-60 overflow-y-auto">
                                {autocompleteResults.map((result, index) => (
                                  <motion.button
                                    key={index}
                                    type="button"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    onClick={() => handleAutocompleteSelect(result)}
                                    className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-indigo-50 hover:to-blue-50 transition-colors group border-b border-gray-50 last:border-0"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <div className="flex items-center">
                                          <User className="h-4 w-4 text-gray-400 mr-2 flex-shrink-0" />
                                          <span className="font-medium text-gray-900 group-hover:text-indigo-600">
                                            {result.name}
                                          </span>
                                        </div>
                                        <div className="ml-6 mt-1 space-y-0.5">
                                          {result.address && (
                                            <div className="flex items-center text-xs text-gray-500">
                                              <MapPin className="h-3 w-3 mr-1" />
                                              {result.address}
                                            </div>
                                          )}
                                          {result.phone && (
                                            <div className="flex items-center text-xs text-gray-500">
                                              <Phone className="h-3 w-3 mr-1" />
                                              {result.phone}
                                            </div>
                                          )}
                                          {result.email && (
                                            <div className="flex items-center text-xs text-gray-500">
                                              <Mail className="h-3 w-3 mr-1" />
                                              {result.email}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Search className="h-4 w-4 text-indigo-500" />
                                      </div>
                                    </div>
                                  </motion.button>
                                ))}
                              </div>
                              {autocompleteResults.length > 3 && (
                                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 text-center border-t">
                                  Showing {autocompleteResults.length} results
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    <div>
                      <Input
                        type="email"
                        name="email"
                        label="Email"
                        icon={<Mail className="h-4 w-4" />}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="debtor@example.com"
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
                    <DollarSign className="h-5 w-5 mr-2" />
                    Financial Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Input
                        type="number"
                        name="creditLimit"
                        label="Credit Limit ($)"
                        icon={<CreditCard className="h-4 w-4" />}
                        value={formData.creditLimit}
                        onChange={handleChange}
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                      />
                      <p className="mt-1 text-xs text-gray-500">Leave as 0 for no limit</p>
                    </div>

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
                        <option value="blocked">Blocked</option>
                      </select>
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
                      placeholder="Any additional notes about this debtor..."
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-end space-x-3 pt-6"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/companies/${companyId}/debtors`)}
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
                    Create Debtor
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