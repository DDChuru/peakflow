'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import { AdminService } from '@/lib/firebase/admin-service';
import { User, Company, UserRole } from '@/types/auth';
import toast from 'react-hot-toast';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const adminService = new AdminService();

  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersData, companiesData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getAllCompanies()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, roles: UserRole[]) => {
    try {
      await adminService.updateUserRoles(userId, roles);
      toast.success('Roles updated successfully');
      fetchData();
    } catch (error) {
      toast.error('Failed to update roles');
    }
  };

  const handleCompanyAssignment = async (userId: string, companyId: string) => {
    try {
      if (companyId === 'none') {
        await adminService.removeUserFromCompany(userId);
      } else {
        await adminService.assignUserToCompany(userId, companyId);
      }
      toast.success('Company assignment updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update company assignment');
    }
  };

  const handleToggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await adminService.toggleUserStatus(userId, !currentStatus);
      toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error) {
      toast.error('Failed to toggle user status');
    }
  };

  const CreateUserModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(['client']);
    const [selectedCompany, setSelectedCompany] = useState('none');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
      if (!email || !password || !fullName) {
        toast.error('Email, password, and full name are required');
        return;
      }

      if (selectedRoles.length === 0) {
        toast.error('Please select at least one role');
        return;
      }

      setIsSubmitting(true);
      try {
        await adminService.createUser({
          email,
          password,
          fullName,
          phoneNumber: phoneNumber || undefined,
          roles: selectedRoles,
          companyId: selectedCompany !== 'none' ? selectedCompany : undefined
        });

        toast.success('User created successfully');
        setIsCreateModalOpen(false);
        fetchData();

        // Reset form
        setEmail('');
        setPassword('');
        setFullName('');
        setPhoneNumber('');
        setSelectedRoles(['client']);
        setSelectedCompany('none');
      } catch (error: any) {
        toast.error(error.message || 'Failed to create user');
      } finally {
        setIsSubmitting(false);
      }
    };

    const toggleRole = (role: UserRole) => {
      if (selectedRoles.includes(role)) {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
      } else {
        setSelectedRoles([...selectedRoles, role]);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-96 max-h-[90vh] overflow-y-auto">
          <h3 className="text-lg font-semibold mb-4">Create New User</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="user@example.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Min. 6 characters"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="John Doe"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="+1234567890"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Roles *</label>
              <div className="space-y-2">
                {(['admin', 'developer', 'client'] as UserRole[]).map(role => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isSubmitting}
              >
                <option value="none">No Company</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                // Reset form
                setEmail('');
                setPassword('');
                setFullName('');
                setPhoneNumber('');
                setSelectedRoles(['client']);
                setSelectedCompany('none');
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditUserModal = () => {
    const [selectedRoles, setSelectedRoles] = useState<UserRole[]>(selectedUser?.roles || []);
    const [selectedCompany, setSelectedCompany] = useState(selectedUser?.companyId || 'none');

    if (!selectedUser) return null;

    const handleSave = async () => {
      await handleRoleChange(selectedUser.uid, selectedRoles);
      if (selectedCompany !== selectedUser.companyId) {
        await handleCompanyAssignment(selectedUser.uid, selectedCompany);
      }
      setIsEditModalOpen(false);
      setSelectedUser(null);
    };

    const toggleRole = (role: UserRole) => {
      if (selectedRoles.includes(role)) {
        setSelectedRoles(selectedRoles.filter(r => r !== role));
      } else {
        setSelectedRoles([...selectedRoles, role]);
      }
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6 w-96">
          <h3 className="text-lg font-semibold mb-4">Edit User: {selectedUser.fullName}</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="space-y-2">
              {(['admin', 'developer', 'client'] as UserRole[]).map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="mr-2"
                  />
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="none">No Company</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedUser(null);
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProtectedRoute requiredRoles={['admin']}>
      <div className="min-h-screen bg-gray-50 pb-12">
        <PageHeader
          title="User management"
          subtitle="Manage roles, status, and tenant assignments"
          breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'User Management' }]}
          gradient={false}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create User
            </button>
          </div>
          <div className="bg-white shadow rounded-lg">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roles
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company
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
                    {users.map((user) => {
                      const company = companies.find(c => c.id === user.companyId);
                      return (
                        <tr key={user.uid}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.imageUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full"
                                  src={user.imageUrl}
                                  alt={user.fullName}
                                  // eslint-disable-next-line @next/next/no-img-element
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium">
                                    {user.fullName?.charAt(0) || '?'}
                                  </span>
                                </div>
                              )}
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {user.fullName}
                                </div>
                                {user.phoneNumber && (
                                  <div className="text-sm text-gray-500">
                                    {user.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              {user.roles.map(role => (
                                <span
                                  key={role}
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
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
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {company ? company.name : 'No Company'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                user.isActive
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsEditModalOpen(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user.uid, user.isActive)}
                              className={`${
                                user.isActive
                                  ? 'text-red-600 hover:text-red-900'
                                  : 'text-green-600 hover:text-green-900'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isCreateModalOpen && <CreateUserModal />}
      {isEditModalOpen && <EditUserModal />}
    </ProtectedRoute>
  );
}
