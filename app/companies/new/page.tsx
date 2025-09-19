'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { CompanyType } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

const companySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  type: z.enum(['client', 'peakflow']),
  domain: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal(''))
});

type CompanyFormData = z.infer<typeof companySchema>;

export default function NewCompanyPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<CompanyType>('client');
  const router = useRouter();
  const { user } = useAuth();
  const companiesService = new CompaniesService();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      type: 'client'
    }
  });

  const onSubmit = async (data: CompanyFormData) => {
    if (!user) {
      toast.error('You must be logged in to create a company');
      return;
    }

    try {
      setIsLoading(true);
      
      // Don't send undefined values to Firebase
      const companyData = {
        name: data.name,
        type: data.type
      };

      await companiesService.createCompany(companyData, user.uid);
      toast.success('Company created successfully!');
      router.push('/companies');
    } catch (error: any) {
      console.error('Error creating company:', error);
      toast.error(error.message || 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTypeSelect = (type: CompanyType) => {
    setSelectedType(type);
    setValue('type', type);
  };

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Create New Company
            </h1>
            <p className="text-lg text-gray-600">
              Set up a new organization in the PeakFlow ecosystem
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Company Type Selection - Modern Card Style */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Select Company Type
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Client Company Card */}
                <button
                  type="button"
                  onClick={() => handleTypeSelect('client')}
                  className={`relative group transition-all duration-300 transform hover:scale-105 ${
                    selectedType === 'client' 
                      ? 'scale-105' 
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div className={`rounded-xl border-2 transition-all duration-300 p-6 h-full ${
                    selectedType === 'client'
                      ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl'
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}>
                    {/* Selection Indicator */}
                    {selectedType === 'client' && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center">
                      <div className={`rounded-full p-4 mb-4 transition-colors ${
                        selectedType === 'client'
                          ? 'bg-green-100'
                          : 'bg-gray-100 group-hover:bg-green-50'
                      }`}>
                        <svg className={`w-8 h-8 ${
                          selectedType === 'client' ? 'text-green-600' : 'text-gray-600 group-hover:text-green-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        selectedType === 'client' ? 'text-green-900' : 'text-gray-900'
                      }`}>
                        Client Company
                      </h3>
                      <p className={`text-sm ${
                        selectedType === 'client' ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        Customer organization using PeakFlow services
                      </p>
                    </div>
                  </div>
                </button>

                {/* PeakFlow Company Card */}
                <button
                  type="button"
                  onClick={() => handleTypeSelect('peakflow')}
                  className={`relative group transition-all duration-300 transform hover:scale-105 ${
                    selectedType === 'peakflow' 
                      ? 'scale-105' 
                      : 'hover:shadow-xl'
                  }`}
                >
                  <div className={`rounded-xl border-2 transition-all duration-300 p-6 h-full ${
                    selectedType === 'peakflow'
                      ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}>
                    {/* Selection Indicator */}
                    {selectedType === 'peakflow' && (
                      <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-2 shadow-lg animate-bounce">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    
                    <div className="flex flex-col items-center text-center">
                      <div className={`rounded-full p-4 mb-4 transition-colors ${
                        selectedType === 'peakflow'
                          ? 'bg-blue-100'
                          : 'bg-gray-100 group-hover:bg-blue-50'
                      }`}>
                        <svg className={`w-8 h-8 ${
                          selectedType === 'peakflow' ? 'text-blue-600' : 'text-gray-600 group-hover:text-blue-500'
                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className={`text-lg font-semibold mb-2 ${
                        selectedType === 'peakflow' ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        PeakFlow Company
                      </h3>
                      <p className={`text-sm ${
                        selectedType === 'peakflow' ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        Internal or partner organization
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              <input type="hidden" {...register('type')} value={selectedType} />
              {errors.type && (
                <p className="mt-3 text-sm text-red-600 text-center">{errors.type.message}</p>
              )}
            </div>

            {/* Company Details - Modern Input Fields */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Company Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name - Full Width */}
                <div className="md:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <input
                      {...register('name')}
                      type="text"
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900"
                      placeholder="Enter company name"
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                {/* Domain */}
                <div>
                  <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
                    Domain
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <input
                      {...register('domain')}
                      type="text"
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="example.com"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      {...register('email')}
                      type="email"
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="contact@example.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      {...register('phone')}
                      type="tel"
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                {/* Logo URL */}
                <div>
                  <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      {...register('logoUrl')}
                      type="url"
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  {errors.logoUrl && (
                    <p className="mt-1 text-sm text-red-600">{errors.logoUrl.message}</p>
                  )}
                </div>

                {/* Address - Full Width */}
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <textarea
                      {...register('address')}
                      rows={2}
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="123 Main St, City, State 12345"
                    />
                  </div>
                </div>

                {/* Description - Full Width */}
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <textarea
                      {...register('description')}
                      rows={3}
                      className="pl-10 block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                      placeholder="Brief description of the company..."
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions - Modern Buttons */}
            <div className="flex justify-between items-center">
              <Link
                href="/companies"
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`px-8 py-3 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  selectedType === 'peakflow'
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:ring-blue-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:ring-green-500'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  `Create ${selectedType === 'peakflow' ? 'PeakFlow' : 'Client'} Company`
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}