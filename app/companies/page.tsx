'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Building2, ShieldCheck, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { PageHeader } from '@/components/ui/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FadeIn, StaggerList } from '@/components/ui/motion';
import { SkeletonList } from '@/components/ui/skeleton';
import { CompaniesService } from '@/lib/firebase/companies-service';
import { Company, CompanyType } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

  const filteredCompanies = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return companies.filter((company) => {
      const matchesSearch = search
        ? company.name.toLowerCase().includes(search) ||
          company.domain?.toLowerCase().includes(search) ||
          company.email?.toLowerCase().includes(search)
        : true;

      const matchesType = filterType === 'all' ? true : company.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [companies, filterType, searchTerm]);

  const stats = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => c.isActive).length;
    const peakflow = companies.filter((c) => c.type === 'peakflow').length;
    return [
      {
        label: 'Total companies',
        value: total,
        icon: Building2,
        helper: `${peakflow} PeakFlow · ${total - peakflow} Client`,
      },
      {
        label: 'Active tenants',
        value: active,
        icon: ShieldCheck,
        helper: `${total - active} inactive`,
      },
      {
        label: 'Users managed',
        value: companies.reduce((sum, company) => sum + (company.userCount || 0), 0),
        icon: Users,
        helper: 'Across all companies',
      },
    ];
  }, [companies]);

  const canManageCompanies = hasRole('admin') || hasRole('developer');

  const headerActions = canManageCompanies ? (
    <Link href="/companies/new">
      <Button size="sm">
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add Company</span>
      </Button>
    </Link>
  ) : null;

  return (
    <ProtectedRoute requiredRoles={['admin', 'developer']}>
      <div className="min-h-screen bg-gray-50 pb-12">
        <PageHeader
          title="Companies"
          subtitle="Manage client and PeakFlow organizations"
          breadcrumbs={[{ label: 'Companies' }]}
          actions={headerActions}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <FadeIn>
            <Card className="bg-white border border-gray-100">
              <div className="flex flex-col gap-4 md:flex-row md:items-end">
                <div className="flex-1">
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search companies by name, domain, or email"
                    label="Search"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={filterType === 'all' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterType('all')}
                  >
                    All
                  </Button>
                  <Button
                    variant={filterType === 'client' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterType('client')}
                  >
                    Client
                  </Button>
                  <Button
                    variant={filterType === 'peakflow' ? 'outline' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterType('peakflow')}
                  >
                    PeakFlow
                  </Button>
                </div>
              </div>
            </Card>
          </FadeIn>

          <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <FadeIn key={stat.label} delay={index * 0.05}>
                  <Card className="bg-white border border-gray-100">
                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                            {stat.label}
                          </p>
                          <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
                          <p className="text-sm text-gray-500">{stat.helper}</p>
                        </div>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                    </div>
                  </Card>
                </FadeIn>
              );
            })}
          </StaggerList>

          {loading ? (
            <Card className="bg-white border border-gray-100 p-6">
              <SkeletonList items={4} />
            </Card>
          ) : filteredCompanies.length === 0 ? (
            <Card className="bg-white border border-dashed border-gray-200 p-12 text-center text-sm text-gray-600">
              No companies match the current filters.
            </Card>
          ) : (
            <StaggerList className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompanies.map((company, index) => (
                <FadeIn key={company.id} delay={0.05 * index}>
                  <Card hover className="bg-white border border-gray-100">
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {company.logoUrl ? (
                            <img
                              src={company.logoUrl}
                              alt={company.name}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {company.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="text-base font-semibold text-gray-900">{company.name}</h3>
                            <p className="text-sm text-gray-500">
                              {company.type === 'peakflow' ? 'PeakFlow' : 'Client'} ·{' '}
                              {company.domain || 'No domain'}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold',
                            company.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          )}
                        >
                          {company.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        {company.email && <p>{company.email}</p>}
                        {company.phone && <p>{company.phone}</p>}
                        {!company.email && !company.phone && (
                          <p className="text-xs text-gray-400">No contact details captured yet.</p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link href={`/companies/${company.id}`}>
                          <Button variant="outline" size="sm">
                            View details
                          </Button>
                        </Link>
                        <Link href={`/companies/${company.id}/financial-dashboard`}>
                          <Button variant="outline" size="sm">
                            Financial dashboard
                          </Button>
                        </Link>
                        <Link href={`/dashboard/bank-statements/${company.id}`}>
                          <Button variant="outline" size="sm">
                            Bank statements
                          </Button>
                        </Link>
                      </div>

                      {canManageCompanies && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(company)}
                            className={company.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'}
                          >
                            {company.isActive ? <ToggleLeft className="h-4 w-4" /> : <ToggleRight className="h-4 w-4" />}
                            {company.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setCompanyToDelete(company);
                              setShowDeleteModal(true);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </FadeIn>
              ))}
            </StaggerList>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && companyToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Delete Company</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete &ldquo;{companyToDelete.name}&rdquo;? This action cannot be undone.
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
