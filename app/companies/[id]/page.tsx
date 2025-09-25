'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { AdminService } from '@/lib/firebase/admin-service';
import { ActivityService } from '@/lib/firebase/activity-service';
import { Company, User } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { Input } from '@/components/ui/input';
import { SkeletonCard, SkeletonList } from '@/components/ui/skeleton';
import { Building2, Mail, Phone, MapPin, Info, Users, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const stats = useMemo(() => {
    if (!company) return [];
    return [
      {
        label: 'Company type',
        value: company.type === 'peakflow' ? 'PeakFlow' : 'Client',
        icon: Building2,
      },
      {
        label: 'Status',
        value: company.isActive ? 'Active' : 'Inactive',
        icon: Info,
      },
      {
        label: 'Assigned users',
        value: companyUsers.length,
        icon: Users,
      },
    ];
  }, [company, companyUsers.length]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
        <PageHeader
          title={company?.name ?? 'Company'}
          subtitle={company ? `${company.type === 'peakflow' ? 'PeakFlow' : 'Client'} company` : undefined}
          backHref="/companies"
          breadcrumbs={[
            { label: 'Companies', href: '/companies' },
            { label: company?.name || 'Company' },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Link href={`/dashboard/bank-statements/${companyId}`}>
                <Button variant="outline" size="sm">
                  Bank statements
                </Button>
              </Link>
            </div>
          }
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : !company ? (
            <Card className="bg-white border border-dashed border-gray-200 p-12 text-center text-sm text-gray-600">
              This company is unavailable or has been removed.
            </Card>
          ) : (
            <>
              <FadeIn>
                <Card className="bg-white border border-gray-100">
                  <div className="flex flex-col gap-6 md:flex-row md:justify-between">
                    <div className="flex items-start gap-4">
                      {company.logoUrl ? (
                        <img
                          src={company.logoUrl}
                          alt={company.name}
                          className="h-16 w-16 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-2xl font-semibold">
                          {company.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                            <Building2 className="h-4 w-4" />
                            {company.type === 'peakflow' ? 'PeakFlow tenant' : 'Client tenant'}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                              company.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            )}
                          >
                            {company.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {stats.map((stat, index) => {
                      const Icon = stat.icon;
                      return (
                        <div key={stat.label} className="rounded-xl border border-gray-100 p-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div>
                              <p className="text-xs uppercase tracking-wider text-gray-500">{stat.label}</p>
                              <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </FadeIn>

              <FadeIn>
                <Card className="bg-white border border-gray-100">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <InfoBlock icon={Mail} label="Email" value={company.email} />
                    <InfoBlock icon={Phone} label="Phone" value={company.phone} />
                    <InfoBlock icon={Building2} label="Domain" value={company.domain} />
                    <InfoBlock icon={MapPin} label="Address" value={company.address} stretch />
                    {company.description && (
                      <div className="md:col-span-2 lg:col-span-3">
                        <p className="text-xs uppercase tracking-wider text-gray-500">Description</p>
                        <p className="mt-1 text-sm text-gray-700">{company.description}</p>
                      </div>
                    )}
                  </div>
                </Card>
              </FadeIn>

              <FadeIn>
                <Card className="bg-white border border-gray-100 p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Assigned users</h2>
                      <p className="text-sm text-gray-500">{companyUsers.length} user(s) in this company</p>
                    </div>
                    {canManage && (
                      <Button size="sm" onClick={() => setShowAssignModal(true)}>
                        <Users className="mr-2 h-4 w-4" />
                        Assign users
                      </Button>
                    )}
                  </div>

                  {companyUsers.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">
                      No users assigned yet.
                      {canManage && (
                        <button
                          onClick={() => setShowAssignModal(true)}
                          className="ml-2 text-indigo-600 hover:text-indigo-700"
                        >
                          Assign a user
                        </button>
                      )}
                    </div>
                  ) : (
                    <StaggerList className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {companyUsers.map((companyUser, index) => (
                        <FadeIn key={companyUser.uid} delay={index * 0.05}>
                          <Card className="border border-gray-100">
                            <div className="p-4 space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-3">
                                  {companyUser.imageUrl ? (
                                      <img
                                        src={companyUser.imageUrl}
                                        alt={companyUser.fullName}
                                        className="h-10 w-10 rounded-full"
                                      />
                                  ) : (
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-700">
                                      {companyUser.fullName?.charAt(0) || '?'}
                                    </div>
                                  )}
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">{companyUser.fullName}</p>
                                    <p className="text-xs text-gray-500">{companyUser.email}</p>
                                  </div>
                                </div>
                                {canManage && (
                                  <button
                                    onClick={() => handleRemoveUser(companyUser.uid)}
                                    className="text-rose-600 hover:text-rose-700"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {companyUser.roles.map((role) => (
                                  <span
                                    key={role}
                                    className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </Card>
                        </FadeIn>
                      ))}
                    </StaggerList>
                  )}
                </Card>
              </FadeIn>

              
            </>
          )}
        </div>
      </div>

      {/* Assign Users Modal */}
      {company && showAssignModal && (
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

interface InfoBlockProps {
  icon: LucideIcon;
  label: string;
  value?: string | null;
  stretch?: boolean;
}

function InfoBlock({ icon: Icon, label, value, stretch }: InfoBlockProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4',
        stretch && 'md:col-span-2 lg:col-span-3'
      )}
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-gray-500">{label}</p>
        <p className="mt-1 text-sm text-gray-900">{value || '—'}</p>
      </div>
    </div>
  );
}
