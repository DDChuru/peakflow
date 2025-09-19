'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { AdminService } from '@/lib/firebase/admin-service';
import { ActivityService } from '@/lib/firebase/activity-service';
import { Company, User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { hasRole, user } = useAuth();
  
  const [company, setCompany] = useState<Company | null>(null);
  const [companyUsers, setCompanyUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const companiesService = new CompaniesService();
  const adminService = new AdminService();
  const activityService = new ActivityService();
  
  const companyId = params.id as string;
  const canManage = hasRole('admin') || hasRole('developer');

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      
      // Fetch company details
      const companyData = await companiesService.getCompanyById(companyId);
      if (!companyData) {
        toast.error('Company not found');
        router.push('/companies');
        return;
      }
      setCompany(companyData);
      
      // Fetch all users
      const usersData = await adminService.getAllUsers();
      setAllUsers(usersData);
      
      // Filter users belonging to this company
      const usersInCompany = usersData.filter(user => user.companyId === companyId);
      setCompanyUsers(usersInCompany);
      
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignUsers = async () => {
    try {
      if (!user || !company) return;
      
      const assignedUsers: User[] = [];
      for (const userId of selectedUsers) {
        await adminService.assignUserToCompany(userId, companyId);
        const assignedUser = allUsers.find(u => u.uid === userId);
        if (assignedUser) {
          assignedUsers.push(assignedUser);
          await activityService.logUserAssignedToCompany(
            user,
            assignedUser,
            companyId,
            company.name
          );
        }
      }
      
      toast.success(`${selectedUsers.length} user(s) assigned to company`);
      setShowAssignModal(false);
      setSelectedUsers([]);
      fetchCompanyData();
    } catch (error) {
      console.error('Error assigning users:', error);
      toast.error('Failed to assign users');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the company?')) {
      return;
    }
    
    try {
      if (!user || !company) return;
      
      const removedUser = companyUsers.find(u => u.uid === userId);
      if (removedUser) {
        await adminService.removeUserFromCompany(userId);
        await activityService.logUserRemovedFromCompany(
          user,
          removedUser,
          companyId,
          company.name
        );
        toast.success('User removed from company');
        fetchCompanyData();
      }
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const availableUsers = allUsers.filter(user => 
    !user.companyId && 
    user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/companies" 
              className="text-indigo-600 hover:text-indigo-800 mb-4 inline-flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Companies
            </Link>
            
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-start space-x-4">
                  {company.logoUrl ? (
                    <img 
                      src={company.logoUrl} 
                      alt={company.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-3xl font-bold text-white">
                        {company.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        company.type === 'peakflow' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {company.type === 'peakflow' ? 'PeakFlow' : 'Client'} Company
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        company.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <Link
                    href={`/dashboard/bank-statements/${companyId}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bank Statements
                  </Link>
                  {canManage && (
                    <Link
                      href={`/companies/${companyId}/edit`}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Edit Company
                    </Link>
                  )}
                </div>
              </div>
              
              {/* Company Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                {company.domain && (
                  <div>
                    <p className="text-sm text-gray-500">Domain</p>
                    <p className="text-gray-900 font-medium">{company.domain}</p>
                  </div>
                )}
                {company.email && (
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900 font-medium">{company.email}</p>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="text-gray-900 font-medium">{company.phone}</p>
                  </div>
                )}
                {company.address && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-gray-500">Address</p>
                    <p className="text-gray-900 font-medium">{company.address}</p>
                  </div>
                )}
                {company.description && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-gray-900">{company.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Company Users</h2>
                <p className="text-gray-600 mt-1">{companyUsers.length} user(s) in this company</p>
              </div>
              
              {canManage && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all transform hover:scale-105"
                >
                  + Assign Users
                </button>
              )}
            </div>

            {companyUsers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="mt-4 text-gray-500">No users assigned to this company yet</p>
                {canManage && (
                  <button
                    onClick={() => setShowAssignModal(true)}
                    className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Assign your first user
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {companyUsers.map(user => (
                  <div key={user.uid} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {user.imageUrl ? (
                          <img 
                            src={user.imageUrl} 
                            alt={user.fullName}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {user.fullName?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{user.fullName}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      
                      {canManage && (
                        <button
                          onClick={() => handleRemoveUser(user.uid)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {user.roles.map(role => (
                        <span
                          key={role}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            role === 'admin' 
                              ? 'bg-red-100 text-red-800'
                              : role === 'developer'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Users Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-gray-900">Assign Users to {company.name}</h3>
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUsers([]);
                    setSearchTerm('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search */}
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Search users by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {availableUsers.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No unassigned users available
                </p>
              ) : (
                <div className="space-y-2">
                  {availableUsers.map(user => (
                    <label
                      key={user.uid}
                      className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUsers.includes(user.uid)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.uid)}
                        onChange={() => toggleUserSelection(user.uid)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex gap-1">
                        {user.roles.map(role => (
                          <span
                            key={role}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {selectedUsers.length} user(s) selected
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedUsers([]);
                    setSearchTerm('');
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignUsers}
                  disabled={selectedUsers.length === 0}
                  className={`px-6 py-2 rounded-lg text-white font-medium ${
                    selectedUsers.length === 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  Assign {selectedUsers.length > 0 && `(${selectedUsers.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}