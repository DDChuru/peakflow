'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company, CompanyType } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<CompanyType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const companiesService = new CompaniesService();

  useEffect(() => {
    fetchCompanies();
  }, [filterType]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      let companiesData: Company[];
      
      if (filterType === 'all') {
        companiesData = await companiesService.getAllCompanies();
      } else {
        companiesData = await companiesService.getCompaniesByType(filterType);
      }
      
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!companyToDelete) return;
    
    try {
      await companiesService.deleteCompany(companyToDelete.id);
      toast.success('Company deleted successfully');
      setShowDeleteModal(false);
      setCompanyToDelete(null);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to delete company');
    }
  };

  const handleToggleStatus = async (company: Company) => {
    try {
      await companiesService.toggleCompanyStatus(company.id, !company.isActive);
      toast.success(`Company ${!company.isActive ? 'activated' : 'deactivated'}`);
      fetchCompanies();
    } catch (error) {
      toast.error('Failed to update company status');
    }
  };

  const filteredCompanies = companies.filter(company => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        company.name.toLowerCase().includes(search) ||
        company.domain?.toLowerCase().includes(search) ||
        company.email?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const canManageCompanies = hasRole('admin') || hasRole('developer');

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Companies Management
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage client and PeakFlow companies
                  </p>
                </div>
                {canManageCompanies && (
                  <Link
                    href="/companies/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    + Add Company
                  </Link>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="px-4 py-4 sm:px-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filterType === 'all'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('client')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filterType === 'client'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300`}
                  >
                    Client
                  </button>
                  <button
                    onClick={() => setFilterType('peakflow')}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      filterType === 'peakflow'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } border border-gray-300`}
                  >
                    PeakFlow
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Companies List */}
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No companies found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCompanies.map((company) => (
                      <tr key={company.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {company.logoUrl ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={company.logoUrl}
                                alt={company.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-gray-600 font-medium">
                                  {company.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {company.name}
                              </div>
                              {company.description && (
                                <div className="text-sm text-gray-500">
                                  {company.description.substring(0, 50)}...
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.type === 'peakflow'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {company.type === 'peakflow' ? 'PeakFlow' : 'Client'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {company.domain || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            {company.email && (
                              <div>{company.email}</div>
                            )}
                            {company.phone && (
                              <div>{company.phone}</div>
                            )}
                            {!company.email && !company.phone && '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              company.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Link
                              href={`/companies/${company.id}`}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              View
                            </Link>
                            <Link
                              href={`/dashboard/bank-statements/${company.id}`}
                              className="text-green-600 hover:text-green-900"
                            >
                              Bank Statements
                            </Link>
                            {canManageCompanies && (
                              <>
                                <Link
                                  href={`/companies/${company.id}/edit`}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => handleToggleStatus(company)}
                                  className={`${
                                    company.isActive
                                      ? 'text-yellow-600 hover:text-yellow-900'
                                      : 'text-green-600 hover:text-green-900'
                                  }`}
                                >
                                  {company.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                  onClick={() => {
                                    setCompanyToDelete(company);
                                    setShowDeleteModal(true);
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Company</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{companyToDelete.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCompanyToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}