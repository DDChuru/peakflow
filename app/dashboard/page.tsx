'use client';

import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, company, logout, isAdmin, hasRole } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex">
                <div className="flex-shrink-0 flex items-center">
                  <h1 className="text-xl font-bold text-indigo-600">PeakFlow</h1>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  <Link
                    href="/dashboard"
                    className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  {company && (
                    <Link
                      href={`/dashboard/bank-statements/${company.id}`}
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Bank Statements
                    </Link>
                  )}
                  {(hasRole('admin') || hasRole('developer')) && (
                    <Link
                      href="/companies"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Companies
                    </Link>
                  )}
                  {isAdmin() && (
                    <Link
                      href="/admin/users"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      User Management
                    </Link>
                  )}
                  {hasRole('developer') && (
                    <Link
                      href="/developer"
                      className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                    >
                      Developer Tools
                    </Link>
                  )}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <button
                    onClick={logout}
                    className="relative inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Welcome Section */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome back, {user?.fullName}!
                </h2>
                
                {/* User Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Information</h3>
                    <dl className="space-y-1">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                        <dd className="text-sm text-gray-900">{user?.email}</dd>
                      </div>
                      {user?.phoneNumber && (
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Phone</dt>
                          <dd className="text-sm text-gray-900">{user.phoneNumber}</dd>
                        </div>
                      )}
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email Verified</dt>
                        <dd className="text-sm text-gray-900">
                          {user?.emailVerified ? (
                            <span className="text-green-600">✓ Verified</span>
                          ) : (
                            <span className="text-red-600">✗ Not Verified</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Access & Permissions</h3>
                    <dl className="space-y-1">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Roles</dt>
                        <dd className="text-sm text-gray-900">
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user?.roles.map(role => (
                              <span
                                key={role}
                                className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                  role === 'admin' 
                                    ? 'bg-red-100 text-red-800'
                                    : role === 'developer'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </span>
                            ))}
                          </div>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Company</dt>
                        <dd className="text-sm text-gray-900">
                          {company ? company.name : 'No company assigned'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Account Status</dt>
                        <dd className="text-sm text-gray-900">
                          {user?.isActive ? (
                            <span className="text-green-600">✓ Active</span>
                          ) : (
                            <span className="text-red-600">✗ Inactive</span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* Role-based Content */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {company && (
                      <Link
                        href={`/dashboard/bank-statements/${company.id}`}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 hover:bg-green-100 transition-colors"
                      >
                        <h4 className="font-medium text-green-900">Bank Statements</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Upload and analyze bank statements
                        </p>
                      </Link>
                    )}

                    {(hasRole('admin') || hasRole('developer')) && (
                      <Link
                        href="/companies"
                        className="bg-purple-50 border border-purple-200 rounded-lg p-4 hover:bg-purple-100 transition-colors"
                      >
                        <h4 className="font-medium text-purple-900">Manage Companies</h4>
                        <p className="text-sm text-purple-700 mt-1">
                          Create and manage client and PeakFlow companies
                        </p>
                      </Link>
                    )}
                    
                    {isAdmin() && (
                      <Link
                        href="/admin/users"
                        className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 hover:bg-indigo-100 transition-colors"
                      >
                        <h4 className="font-medium text-indigo-900">Manage Users</h4>
                        <p className="text-sm text-indigo-700 mt-1">
                          Add, edit, and manage user roles and permissions
                        </p>
                      </Link>
                    )}
                    
                    {hasRole('developer') && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-900">Developer Tools</h4>
                        <p className="text-sm text-blue-700 mt-1">
                          Access development resources and APIs
                        </p>
                      </div>
                    )}
                    
                    <Link
                      href="/profile"
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900">Edit Profile</h4>
                      <p className="text-sm text-gray-700 mt-1">
                        Update your personal information and preferences
                      </p>
                    </Link>
                  </div>
                </div>

                {/* Company-specific content */}
                {company && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {company.name} Dashboard
                    </h3>
                    <p className="text-sm text-gray-600">
                      Company-specific content and features will appear here based on your role and permissions.
                    </p>
                  </div>
                )}

                {!company && (
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900">No Company Assigned</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Please contact an administrator to be assigned to a company.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}